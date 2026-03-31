import { useState, useCallback, useRef } from 'react';
import useEditorStore from '../store/editorStore';
import { loadGitHubProject, loadFileOnDemand, loadAllFiles, parseGitHubUrl } from '../utils/githubLoader';

/**
 * Hook для загрузки проектов из GitHub
 * Использует ТОЛЬКО JSDelivr (без GitHub API!):
 * - JSDelivr Data API для структуры дерева
 * - JSDelivr CDN для контента файлов
 * 
 * Преимущества:
 * - 0 запросов к GitHub API
 * - Нет rate limit
 * - Не нужен токен
 */
export default function useGitHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  
  // Ref для хранения информации о репо (для lazy loading через CDN)
  const repoInfoRef = useRef(null);
  
  // Используем селекторы для стабильных ссылок на actions
  const setFiles = useEditorStore((state) => state.setFiles);
  const updateFile = useEditorStore((state) => state.updateFile);
  const setCurrentFile = useEditorStore((state) => state.setCurrentFile);
  const setGlobalLoading = useEditorStore((state) => state.setLoading);
  const setGlobalError = useEditorStore((state) => state.setError);
  const expandFolder = useEditorStore((state) => state.expandFolder);
  const reset = useEditorStore((state) => state.reset);
  
  // Загрузка проекта из GitHub (только структура + начальный файл)
  const loadProject = useCallback(async (githubUrl, options = {}) => {
    const { 
      onProgress,
      clearExisting = true,
      autoOpenMainFile = true,
      initialFile = null // Файл который открыть и загрузить сразу
    } = options;
    
    setIsLoading(true);
    setError(null);
    setProgress({ status: 'starting', message: 'Initializing...' });
    setGlobalLoading(true, 'Loading project from GitHub...');
    
    if (clearExisting) {
      reset();
    }
    
    try {
      // Парсим URL для получения имени репо
      const parsedInfo = parseGitHubUrl(githubUrl);
      
      setProgress({ status: 'loading', message: `Loading ${parsedInfo.repo}...` });
      
      // Загружаем структуру через JSDelivr Data API + начальный файл через CDN
      const { files, defaultFile, repoInfo: loadedRepoInfo } = await loadGitHubProject(
        githubUrl, 
        (progressInfo) => {
          setProgress({
            status: 'loading',
            message: progressInfo.message || `Loading ${progressInfo.path || ''}...`,
            ...progressInfo
          });
          onProgress?.(progressInfo);
        }, 
        { initialFile }
      );
      
      // Сохраняем информацию о репо для lazy loading
      repoInfoRef.current = loadedRepoInfo;
      setRepoInfo(loadedRepoInfo);
      
      // Устанавливаем файлы
      const formattedFiles = {};
      Object.entries(files).forEach(([path, data]) => {
        // Создаем родительские директории
        const parts = path.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          if (!formattedFiles[currentPath]) {
            formattedFiles[currentPath] = { type: 'directory' };
          }
        }
        formattedFiles[path] = data;
      });
      
      setFiles(formattedFiles);
      
      // Раскрываем корневые папки
      const rootFolders = new Set();
      Object.keys(formattedFiles).forEach(path => {
        const firstPart = path.split('/')[0];
        if (formattedFiles[firstPart]?.type === 'directory') {
          rootFolders.add(firstPart);
        }
      });
      rootFolders.forEach(folder => expandFolder(folder));
      
      // Открываем главный файл
      const fileToOpen = initialFile || defaultFile;
      if (autoOpenMainFile && fileToOpen) {
        setCurrentFile(fileToOpen);
        
        // Раскрываем путь к файлу
        const parts = fileToOpen.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          expandFolder(currentPath);
        }
      }
      
      setProgress({ status: 'complete', message: 'Project loaded successfully!' });
      setGlobalLoading(false);
      setIsLoading(false);
      
      return { files: formattedFiles, defaultFile: fileToOpen, repoInfo: loadedRepoInfo };
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to load project';
      setError(errorMessage);
      setGlobalError(errorMessage);
      setProgress({ status: 'error', message: errorMessage });
      setGlobalLoading(false);
      setIsLoading(false);
      throw err;
    }
  }, [setFiles, setCurrentFile, setGlobalLoading, setGlobalError, expandFolder, reset]);
  
  // Lazy load файла при открытии
  const loadFile = useCallback(async (filePath) => {
    if (!repoInfoRef.current) {
      throw new Error('Repository info not available. Load project first.');
    }
    
    const files = useEditorStore.getState().files;
    const file = files[filePath];
    
    // Если файл уже загружен — возвращаем контент
    if (file?.loaded && file?.content !== undefined) {
      return file.content;
    }
    
    console.log('[useGitHub] Lazy loading file via CDN:', filePath);
    
    try {
      // Загружаем через JSDelivr CDN (без rate limit!)
      const content = await loadFileOnDemand(repoInfoRef.current, filePath);
      
      // Обновляем файл в store с контентом
      updateFile(filePath, content);
      
      // Также помечаем как загруженный
      const currentFiles = useEditorStore.getState().files;
      if (currentFiles[filePath]) {
        useEditorStore.setState({
          files: {
            ...currentFiles,
            [filePath]: {
              ...currentFiles[filePath],
              content,
              loaded: true
            }
          }
        });
      }
      
      return content;
    } catch (err) {
      console.error('[useGitHub] Failed to load file:', filePath, err);
      throw err;
    }
  }, [updateFile]);
  
  // Загрузка ВСЕХ файлов для синхронизации с WebContainer
  const loadAllFilesForSync = useCallback(async () => {
    const currentFiles = useEditorStore.getState().files;
    const setFiles = useEditorStore.getState().setFiles;
    
    // Если нет repoInfo — значит это не GitHub проект, файлы уже загружены
    if (!repoInfoRef.current) {
      console.log('[useGitHub] No repo info, files already loaded (not a GitHub project)');
      return currentFiles;
    }
    
    console.log('[useGitHub] Loading all files for WebContainer sync...');
    
    const updatedFiles = await loadAllFiles(repoInfoRef.current, currentFiles);
    setFiles(updatedFiles);
    
    return updatedFiles;
  }, []);
  
  // Парсинг URL
  const parseUrl = useCallback((url) => {
    try {
      return parseGitHubUrl(url);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);
  
  // Очистка состояния
  const clearState = useCallback(() => {
    setIsLoading(false);
    setProgress(null);
    setError(null);
    setRepoInfo(null);
    repoInfoRef.current = null;
  }, []);
  
  return {
    // State
    isLoading,
    progress,
    error,
    repoInfo,
    
    // Actions
    loadProject,
    loadFile, // Lazy load одного файла
    loadAllFilesForSync, // Загрузить ВСЕ файлы для синхронизации с WebContainer
    parseUrl,
    clearState
  };
}
