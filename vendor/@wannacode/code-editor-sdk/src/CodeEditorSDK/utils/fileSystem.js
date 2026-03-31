/**
 * Утилиты для работы с файловой системой
 */

/**
 * Получает расширение файла
 * @param {string} filename - Имя файла
 * @returns {string}
 */
export function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Получает имя файла без расширения
 * @param {string} filename - Имя файла
 * @returns {string}
 */
export function getFileName(filename) {
  const parts = filename.split('/');
  return parts[parts.length - 1];
}

/**
 * Получает родительскую директорию
 * @param {string} path - Путь к файлу
 * @returns {string}
 */
export function getParentDirectory(path) {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

/**
 * Определяет язык для Monaco Editor по расширению
 * @param {string} filename - Имя файла
 * @returns {string}
 */
export function getLanguageFromExtension(filename) {
  const ext = getFileExtension(filename);
  
  const languageMap = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    
    // Data
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    
    // Markdown
    'md': 'markdown',
    'mdx': 'markdown',
    
    // Config
    'env': 'plaintext',
    'gitignore': 'plaintext',
    'dockerignore': 'plaintext',
    
    // Other
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'sql': 'sql',
    'graphql': 'graphql',
    'gql': 'graphql',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'kt': 'kotlin',
    'swift': 'swift',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
  };
  
  // Специальные файлы
  const name = getFileName(filename).toLowerCase();
  const specialFiles = {
    'dockerfile': 'dockerfile',
    '.gitignore': 'plaintext',
    '.env': 'plaintext',
    '.env.local': 'plaintext',
    '.env.development': 'plaintext',
    '.env.production': 'plaintext',
    'makefile': 'makefile',
    '.prettierrc': 'json',
    '.eslintrc': 'json',
    'tsconfig.json': 'json',
    'package.json': 'json',
    'package-lock.json': 'json',
  };
  
  return specialFiles[name] || languageMap[ext] || 'plaintext';
}

/**
 * Получает иконку для файла (используется с lucide-react)
 * @param {string} filename - Имя файла
 * @returns {string} - Название иконки
 */
export function getFileIcon(filename) {
  const ext = getFileExtension(filename);
  const name = getFileName(filename).toLowerCase();
  
  // Специальные файлы
  const specialIcons = {
    'package.json': 'Package',
    'tsconfig.json': 'Settings',
    '.gitignore': 'GitBranch',
    'dockerfile': 'Container',
    '.env': 'Key',
    'readme.md': 'BookOpen',
    'license': 'Scale',
  };
  
  if (specialIcons[name]) {
    return specialIcons[name];
  }
  
  // По расширению
  const extIcons = {
    // JavaScript/TypeScript
    'js': 'FileCode',
    'jsx': 'FileCode',
    'ts': 'FileCode',
    'tsx': 'FileCode',
    
    // Web
    'html': 'FileCode',
    'css': 'Palette',
    'scss': 'Palette',
    'less': 'Palette',
    
    // Data
    'json': 'Braces',
    'xml': 'FileCode',
    'yaml': 'FileText',
    'yml': 'FileText',
    
    // Markdown
    'md': 'FileText',
    'mdx': 'FileText',
    
    // Images
    'png': 'Image',
    'jpg': 'Image',
    'jpeg': 'Image',
    'gif': 'Image',
    'svg': 'Image',
    'webp': 'Image',
    
    // Config
    'env': 'Key',
    'lock': 'Lock',
  };
  
  return extIcons[ext] || 'File';
}

/**
 * Определяет является ли файл текстовым
 * @param {string} filename - Имя файла
 * @returns {boolean}
 */
export function isTextFile(filename) {
  const ext = getFileExtension(filename);
  
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp',
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'mp3', 'mp4', 'avi', 'mov', 'webm',
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'zip', 'tar', 'gz', 'rar', '7z',
    'exe', 'dll', 'so', 'dylib'
  ];
  
  return !binaryExtensions.includes(ext);
}

/**
 * Нормализует путь
 * @param {string} path - Путь
 * @returns {string}
 */
export function normalizePath(path) {
  return path
    .replace(/\\/g, '/') // Windows paths
    .replace(/\/+/g, '/') // Multiple slashes
    .replace(/^\//, '') // Leading slash
    .replace(/\/$/, ''); // Trailing slash
}

/**
 * Соединяет части пути
 * @param {...string} parts - Части пути
 * @returns {string}
 */
export function joinPath(...parts) {
  return normalizePath(parts.filter(Boolean).join('/'));
}

/**
 * Создает уникальное имя файла если файл уже существует
 * @param {string} path - Желаемый путь
 * @param {Object} existingFiles - Существующие файлы
 * @returns {string}
 */
export function getUniquePath(path, existingFiles) {
  if (!existingFiles[path]) {
    return path;
  }
  
  const dir = getParentDirectory(path);
  const name = getFileName(path);
  const ext = getFileExtension(name);
  const baseName = ext ? name.slice(0, -(ext.length + 1)) : name;
  
  let counter = 1;
  let newPath;
  
  do {
    const newName = ext ? `${baseName} (${counter}).${ext}` : `${baseName} (${counter})`;
    newPath = dir ? `${dir}/${newName}` : newName;
    counter++;
  } while (existingFiles[newPath]);
  
  return newPath;
}

/**
 * Валидирует имя файла
 * @param {string} name - Имя файла
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileName(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: 'File name cannot be empty' };
  }
  
  // Запрещенные символы в имени файла
  const invalidChars = /[<>:"/\\|?*]/;
  // Проверка на контрольные символы отдельно
  const hasControlChars = /[\u0000-\u001f]/.test(name);
  if (invalidChars.test(name)) {
    return { valid: false, error: 'File name contains invalid characters' };
  }
  if (hasControlChars) {
    return { valid: false, error: 'File name contains invalid characters' };
  }
  
  // Зарезервированные имена в Windows
  const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  const baseName = name.split('.')[0];
  if (reserved.test(baseName)) {
    return { valid: false, error: 'File name is reserved' };
  }
  
  // Слишком длинное имя
  if (name.length > 255) {
    return { valid: false, error: 'File name is too long' };
  }
  
  return { valid: true };
}

export default {
  getFileExtension,
  getFileName,
  getParentDirectory,
  getLanguageFromExtension,
  getFileIcon,
  isTextFile,
  normalizePath,
  joinPath,
  getUniquePath,
  validateFileName
};


