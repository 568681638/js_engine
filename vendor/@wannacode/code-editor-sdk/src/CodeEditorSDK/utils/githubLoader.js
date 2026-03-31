/**
 * GitHub Repository Loader
 * 
 * Использует ТОЛЬКО JSDelivr (без GitHub API!):
 * - JSDelivr Data API для структуры дерева
 * - JSDelivr CDN для контента файлов
 * 
 * Преимущества:
 * - 0 запросов к GitHub API
 * - Нет rate limit
 * - Не нужен токен
 * - Глобальный CDN с кешированием
 */

// Кеш для загруженного контента файлов
const fileContentCache = new Map();

/**
 * Очищает кеш контента файлов
 */
export function clearFileCache() {
  fileContentCache.clear();
}

/**
 * Парсит GitHub URL
 * @param {string} url - GitHub URL
 * @returns {{ owner: string, repo: string, branch: string, path: string }}
 */
export function parseGitHubUrl(url) {
  let cleanUrl = url.trim();
  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
  cleanUrl = cleanUrl.replace(/^github\.com\//, '');
  cleanUrl = cleanUrl.replace(/\.git$/, '');
  
  const parts = cleanUrl.split('/');
  
  if (parts.length < 2) {
    throw new Error('Invalid GitHub URL format. Expected: owner/repo');
  }
  
  const owner = parts[0];
  const repo = parts[1];
  let branch = 'main';
  let path = '';
  
  if (parts.length > 3 && parts[2] === 'tree') {
    branch = parts[3];
    if (parts.length > 4) {
      path = parts.slice(4).join('/');
    }
  }
  
  return { owner, repo, branch, path };
}

/**
 * Получает структуру репозитория через JSDelivr Data API
 * https://data.jsdelivr.com/v1/package/gh/{owner}/{repo}@{branch}
 * 
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} branch 
 * @returns {Promise<Object>} - { files: { path: { type, hash, size } }, default: string }
 */
async function getRepoTreeFromCDN(owner, repo, branch = 'main') {
  const url = `https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}@${branch}`;
  
  console.log('[GitHubLoader] Fetching tree from JSDelivr:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      // Пробуем master ветку
      if (branch === 'main') {
        console.log('[GitHubLoader] Branch "main" not found, trying "master"...');
        return getRepoTreeFromCDN(owner, repo, 'master');
      }
      throw new Error(`Repository not found: ${owner}/${repo}@${branch}`);
    }
    throw new Error(`JSDelivr API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // JSDelivr возвращает { type, name, default, files: [...] }
  // files - это вложенная структура { name, hash, size } или { name, files: [...] } для папок
  
  return data;
}

/**
 * Рекурсивно преобразует дерево JSDelivr в плоскую структуру
 * @param {Array} files - массив файлов/папок из JSDelivr
 * @param {string} basePath - текущий путь
 * @param {Object} result - результирующий объект
 */
function flattenJsDelivrTree(files, basePath = '', result = {}) {
  for (const item of files) {
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
    
    if (item.files) {
      // Это директория
      result[itemPath] = { type: 'directory' };
      flattenJsDelivrTree(item.files, itemPath, result);
    } else {
      // Это файл
      result[itemPath] = { 
        type: 'file', 
        loaded: false,
        size: item.size,
        hash: item.hash
      };
    }
  }
  
  return result;
}

/**
 * Загружает контент файла через JSDelivr CDN
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} branch 
 * @param {string} path 
 * @returns {Promise<string>}
 */
async function loadFileFromCDN(owner, repo, branch, path) {
  const url = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
  
  console.log('[GitHubLoader] Loading file from CDN:', path);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to load file from CDN: ${path} (${response.status})`);
  }
  
  return response.text();
}

/**
 * Загружает контент файла (с кешированием)
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} path 
 * @param {string} branch 
 * @returns {Promise<string>}
 */
export async function loadFileContent(owner, repo, path, branch = 'main') {
  const cacheKey = `${owner}/${repo}@${branch}/${path}`;
  
  // Проверяем кеш
  if (fileContentCache.has(cacheKey)) {
    console.log('[GitHubLoader] Cache hit:', path);
    return fileContentCache.get(cacheKey);
  }
  
  const content = await loadFileFromCDN(owner, repo, branch, path);
  
  // Сохраняем в кеш
  fileContentCache.set(cacheKey, content);
  
  return content;
}

/**
 * Игнорируемые пути
 */
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  'dist',
  'build',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  'coverage',
  '.nyc_output',
  '.cache',
  '.parcel-cache',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

/**
 * Бинарные расширения
 */
const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.exe', '.dll', '.so', '.dylib'
];

/**
 * Проверяет нужно ли пропустить путь
 */
function shouldIgnorePath(path) {
  const parts = path.split('/');
  return IGNORED_PATHS.some(ignored => 
    parts.includes(ignored) || path === ignored
  );
}

/**
 * Проверяет является ли файл бинарным
 */
function isBinaryFile(path) {
  const lower = path.toLowerCase();
  return BINARY_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Загружает проект из GitHub через JSDelivr (без GitHub API!)
 * 
 * @param {string} githubUrl - URL репозитория на GitHub
 * @param {Function} onProgress - колбэк прогресса
 * @param {Object} options - опции
 * @returns {Promise<{ files: Object, defaultFile: string, repoInfo: Object }>}
 */
export async function loadGitHubProject(githubUrl, onProgress = () => {}, options = {}) {
  const { initialFile = null } = options;
  const { owner, repo, branch, path: basePath } = parseGitHubUrl(githubUrl);
  
  console.log('[GitHubLoader] Loading project via JSDelivr:', { owner, repo, branch, basePath });
  onProgress({ type: 'start', message: `Loading ${owner}/${repo}...` });
  
  // Очищаем кеш
  clearFileCache();
  
  // Получаем структуру дерева через JSDelivr Data API (без GitHub API!)
  const treeData = await getRepoTreeFromCDN(owner, repo, branch);
  
  if (!treeData.files) {
    throw new Error('No files found in repository');
  }
  
  // Преобразуем в плоскую структуру
  const allFiles = flattenJsDelivrTree(treeData.files);
  
  // Фильтруем файлы
  const files = {};
  let fileCount = 0;
  let dirCount = 0;
  
  for (const [itemPath, item] of Object.entries(allFiles)) {
    // Пропускаем если есть basePath и путь не начинается с него
    if (basePath && !itemPath.startsWith(basePath + '/') && itemPath !== basePath) {
      continue;
    }
    
    // Нормализуем путь (убираем basePath)
    let normalizedPath = itemPath;
    if (basePath) {
      normalizedPath = itemPath.startsWith(basePath + '/') 
        ? itemPath.slice(basePath.length + 1) 
        : itemPath;
    }
    
    // Пропускаем игнорируемые
    if (shouldIgnorePath(normalizedPath)) {
      continue;
    }
    
    if (item.type === 'directory') {
      files[normalizedPath] = { type: 'directory' };
      dirCount++;
      onProgress({ type: 'directory', path: normalizedPath });
    } else if (item.type === 'file') {
      // Пропускаем бинарные и слишком большие (>500KB)
      if (isBinaryFile(normalizedPath) || (item.size && item.size > 500 * 1024)) {
        continue;
      }
      
      files[normalizedPath] = { 
        type: 'file', 
        loaded: false,
        size: item.size
      };
      fileCount++;
      onProgress({ type: 'file', path: normalizedPath });
    }
  }
  
  console.log('[GitHubLoader] Parsed structure:', { files: fileCount, directories: dirCount });
  
  // Определяем главный файл
  const mainFileCandidates = [
    'index.js', 'index.ts', 'index.jsx', 'index.tsx',
    'src/index.js', 'src/index.ts', 'src/index.jsx', 'src/index.tsx',
    'src/App.js', 'src/App.jsx', 'src/App.tsx',
    'app.js', 'main.js', 'main.ts',
    'README.md', 'package.json'
  ];
  
  let defaultFile = initialFile || null;
  if (!defaultFile) {
    for (const candidate of mainFileCandidates) {
      if (files[candidate]) {
        defaultFile = candidate;
        break;
      }
    }
  }
  
  // Сохраняем использованную ветку (может измениться с main на master)
  const actualBranch = treeData.version || branch;
  const repoInfo = { owner, repo, branch: actualBranch, path: basePath };
  
  // Загружаем начальный файл через CDN
  if (initialFile && files[initialFile]) {
    try {
      const fullPath = basePath ? `${basePath}/${initialFile}` : initialFile;
      const content = await loadFileFromCDN(owner, repo, actualBranch, fullPath);
      files[initialFile] = { type: 'file', content, loaded: true };
      fileContentCache.set(`${owner}/${repo}@${actualBranch}/${fullPath}`, content);
      console.log('[GitHubLoader] Loaded initial file:', initialFile);
    } catch (error) {
      console.warn('[GitHubLoader] Failed to load initial file:', error);
    }
  }
  
  // Загружаем package.json (нужен для npm install)
  if (files['package.json'] && !files['package.json'].loaded) {
    try {
      const fullPath = basePath ? `${basePath}/package.json` : 'package.json';
      const content = await loadFileFromCDN(owner, repo, actualBranch, fullPath);
      files['package.json'] = { type: 'file', content, loaded: true };
      fileContentCache.set(`${owner}/${repo}@${actualBranch}/${fullPath}`, content);
      console.log('[GitHubLoader] Loaded package.json');
    } catch (error) {
      console.warn('[GitHubLoader] Failed to load package.json:', error);
    }
  }
  
  onProgress({ type: 'complete', message: 'Project loaded!' });
  
  console.log('[GitHubLoader] ✓ Loaded via JSDelivr (0 GitHub API requests)');
  
  return { files, defaultFile, repoInfo };
}

/**
 * Загружает контент файла по требованию (через CDN)
 * @param {Object} repoInfo - { owner, repo, branch, path }
 * @param {string} filePath - путь к файлу
 * @returns {Promise<string>}
 */
export async function loadFileOnDemand(repoInfo, filePath) {
  const { owner, repo, branch = 'main', path: basePath = '' } = repoInfo;
  const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
  return loadFileContent(owner, repo, fullPath, branch);
}

/**
 * Загружает ВСЕ незагруженные файлы параллельно (для синхронизации с WebContainer)
 * @param {Object} repoInfo - { owner, repo, branch, path }
 * @param {Object} files - объект файлов из store
 * @param {Function} onProgress - колбэк прогресса
 * @returns {Promise<Object>} - обновлённый объект файлов с контентом
 */
export async function loadAllFiles(repoInfo, files, onProgress = () => {}) {
  if (!repoInfo) {
    console.warn('[GitHubLoader] No repoInfo provided, cannot load files');
    return files;
  }
  
  const { owner, repo, branch = 'main', path: basePath = '' } = repoInfo;
  
  // Находим все файлы которые ещё не загружены
  const unloadedFiles = Object.entries(files).filter(([path, data]) => 
    data.type === 'file' && !data.loaded && data.content === undefined
  );
  
  if (unloadedFiles.length === 0) {
    console.log('[GitHubLoader] All files already loaded');
    return files;
  }
  
  console.log('[GitHubLoader] Loading', unloadedFiles.length, 'files for WebContainer sync...');
  onProgress({ type: 'sync', message: `Loading ${unloadedFiles.length} files...`, total: unloadedFiles.length, loaded: 0 });
  
  const updatedFiles = { ...files };
  let loadedCount = 0;
  
  // Загружаем параллельно, но с ограничением (5 одновременных запросов)
  const CONCURRENT_LIMIT = 5;
  const chunks = [];
  for (let i = 0; i < unloadedFiles.length; i += CONCURRENT_LIMIT) {
    chunks.push(unloadedFiles.slice(i, i + CONCURRENT_LIMIT));
  }
  
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async ([filePath]) => {
        const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
        const content = await loadFileFromCDN(owner, repo, branch, fullPath);
        return { filePath, content };
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { filePath, content } = result.value;
        updatedFiles[filePath] = {
          ...updatedFiles[filePath],
          content,
          loaded: true
        };
        // Также кешируем
        const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
        fileContentCache.set(`${owner}/${repo}@${branch}/${fullPath}`, content);
      } else {
        console.warn('[GitHubLoader] Failed to load file:', result.reason);
      }
      loadedCount++;
    }
    
    onProgress({ type: 'sync', message: `Loading files...`, total: unloadedFiles.length, loaded: loadedCount });
  }
  
  console.log('[GitHubLoader] ✓ Loaded', loadedCount, 'files for WebContainer');
  
  return updatedFiles;
}

/**
 * @deprecated Не нужен для публичных репо с JSDelivr
 */
export function setGitHubToken(token) {
  console.warn('[GitHubLoader] setGitHubToken is deprecated - JSDelivr does not require authentication');
}

export default {
  parseGitHubUrl,
  loadGitHubProject,
  loadFileOnDemand,
  loadFileContent,
  loadAllFiles,
  setGitHubToken,
  clearFileCache
};
