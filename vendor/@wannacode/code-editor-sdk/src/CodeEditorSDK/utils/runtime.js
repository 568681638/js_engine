// WebContainer импортируется динамически чтобы избежать SSR проблем
let WebContainerClass = null;
let webcontainerInstance = null;
let bootPromise = null;

/**
 * Загружает WebContainer API динамически
 * @returns {Promise<typeof import('@webcontainer/api').WebContainer>}
 */
async function loadWebContainerAPI() {
  if (typeof window === 'undefined') {
    throw new Error('WebContainer can only be used in browser environment');
  }
  
  if (WebContainerClass) {
    return WebContainerClass;
  }
  
  const module = await import('@webcontainer/api');
  WebContainerClass = module.WebContainer;
  return WebContainerClass;
}

/**
 * Инициализирует WebContainer
 * @returns {Promise<import('@webcontainer/api').WebContainer>}
 */
export async function bootWebContainer() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  if (bootPromise) {
    return bootPromise;
  }
  
  const WebContainer = await loadWebContainerAPI();
  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  
  return webcontainerInstance;
}

/**
 * Получает существующий WebContainer instance
 * @returns {WebContainer | null}
 */
export function getWebContainer() {
  return webcontainerInstance;
}

/**
 * Преобразует плоскую структуру файлов в структуру для WebContainer
 * @param {Object} files - Плоская структура { 'path/to/file.js': { content: '...' } }
 * @returns {Object} - Структура для WebContainer
 */
export function filesToWebContainerFormat(files) {
  const result = {};
  
  Object.entries(files).forEach(([path, data]) => {
    const parts = path.split('/').filter(Boolean);
    let current = result;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // Это файл
        if (data.type === 'file') {
          current[part] = {
            file: {
              contents: data.content || ''
            }
          };
        } else {
          // Это пустая директория
          current[part] = {
            directory: {}
          };
        }
      } else {
        // Это директория
        if (!current[part]) {
          current[part] = {
            directory: {}
          };
        }
        current = current[part].directory;
      }
    });
  });
  
  return result;
}

/**
 * Синхронизирует файлы в WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {Object} files - Плоская структура файлов
 */
export async function syncFilesToContainer(container, files) {
  const wcFiles = filesToWebContainerFormat(files);
  await container.mount(wcFiles);
}

/**
 * Записывает один файл в WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {string} path - Путь к файлу
 * @param {string} content - Содержимое файла
 */
export async function writeFileToContainer(container, path, content) {
  await container.fs.writeFile(path, content);
}

/**
 * Читает файл из WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {string} path - Путь к файлу
 * @returns {Promise<string>}
 */
export async function readFileFromContainer(container, path) {
  const content = await container.fs.readFile(path, 'utf-8');
  return content;
}

/**
 * Создает директорию в WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {string} path - Путь к директории
 */
export async function mkdirInContainer(container, path) {
  await container.fs.mkdir(path, { recursive: true });
}

/**
 * Удаляет файл или директорию из WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {string} path - Путь к файлу/директории
 */
export async function removeFromContainer(container, path) {
  await container.fs.rm(path, { recursive: true });
}

/**
 * Выполняет команду в WebContainer
 * @param {WebContainer} container - WebContainer instance
 * @param {string} command - Команда для выполнения
 * @param {Object} options - Опции
 * @param {Function} options.onOutput - Callback для вывода
 * @param {Function} options.onError - Callback для ошибок
 * @returns {Promise<{ process: any, exitCode: Promise<number> }>}
 */
export async function runCommand(container, command, options = {}) {
  const { onOutput = () => {} } = options;
  
  const parts = command.split(' ').filter(Boolean);
  const cmd = parts[0];
  const args = parts.slice(1);
  
  const process = await container.spawn(cmd, args);
  
  // Обработка stdout
  process.output.pipeTo(
    new WritableStream({
      write(chunk) {
        onOutput(chunk);
      }
    })
  );
  
  return {
    process,
    exitCode: process.exit,
    kill: () => process.kill()
  };
}

/**
 * Запускает npm install
 * @param {WebContainer} container - WebContainer instance
 * @param {Function} onOutput - Callback для вывода
 * @returns {Promise<number>} - Exit code
 */
export async function npmInstall(container, onOutput = () => {}) {
  const { exitCode } = await runCommand(container, 'npm install', { onOutput });
  return exitCode;
}

/**
 * Запускает npm script
 * @param {WebContainer} container - WebContainer instance
 * @param {string} script - Название скрипта
 * @param {Function} onOutput - Callback для вывода
 * @returns {Promise<{ process: any, exitCode: Promise<number> }>}
 */
export async function npmRun(container, script, onOutput = () => {}) {
  return runCommand(container, `npm run ${script}`, { onOutput });
}

/**
 * Запускает node script
 * @param {WebContainer} container - WebContainer instance
 * @param {string} file - Путь к файлу
 * @param {Function} onOutput - Callback для вывода
 * @returns {Promise<{ process: any, exitCode: Promise<number> }>}
 */
export async function runNodeScript(container, file, onOutput = () => {}) {
  return runCommand(container, `node ${file}`, { onOutput });
}

/**
 * Получает URL для preview (если запущен dev server)
 * @param {WebContainer} container - WebContainer instance
 * @returns {Promise<string>}
 */
export function getPreviewUrl(container) {
  return new Promise((resolve) => {
    container.on('server-ready', (port, url) => {
      resolve(url);
    });
  });
}

export default {
  bootWebContainer,
  getWebContainer,
  filesToWebContainerFormat,
  syncFilesToContainer,
  writeFileToContainer,
  readFileFromContainer,
  mkdirInContainer,
  removeFromContainer,
  runCommand,
  npmInstall,
  npmRun,
  runNodeScript,
  getPreviewUrl
};


