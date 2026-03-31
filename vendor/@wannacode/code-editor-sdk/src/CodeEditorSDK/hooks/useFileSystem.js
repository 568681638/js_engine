import { useCallback, useMemo } from 'react';
import useEditorStore from '../store/editorStore';
import { 
  getUniquePath, 
  validateFileName,
  getParentDirectory 
} from '../utils/fileSystem';

/**
 * Hook для управления виртуальной файловой системой
 */
export default function useFileSystem() {
  // Используем селекторы для подписки только на нужные данные
  const files = useEditorStore((state) => state.files);
  const currentFile = useEditorStore((state) => state.currentFile);
  const expandedFolders = useEditorStore((state) => state.expandedFolders);
  
  // Получаем actions один раз - они стабильны и не вызывают ререндеров
  const setFiles = useEditorStore((state) => state.setFiles);
  const addFile = useEditorStore((state) => state.addFile);
  const addFolder = useEditorStore((state) => state.addFolder);
  const updateFileStore = useEditorStore((state) => state.updateFile);
  const deleteFileStore = useEditorStore((state) => state.deleteFile);
  const renameFileStore = useEditorStore((state) => state.renameFile);
  const setCurrentFile = useEditorStore((state) => state.setCurrentFile);
  const toggleFolder = useEditorStore((state) => state.toggleFolder);
  const expandFolder = useEditorStore((state) => state.expandFolder);
  const getFileTree = useEditorStore((state) => state.getFileTree);
  
  // Создание нового файла
  const createFile = useCallback((path, content = '') => {
    const validation = validateFileName(path.split('/').pop());
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Получаем уникальный путь если файл существует
    const uniquePath = getUniquePath(path, files);
    addFile(uniquePath, content);
    
    // Раскрываем родительские папки
    const parts = uniquePath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      expandFolder(currentPath);
    }
    
    // Открываем созданный файл
    setCurrentFile(uniquePath);
    
    return uniquePath;
  }, [files, addFile, expandFolder, setCurrentFile]);
  
  // Создание новой папки
  const createFolder = useCallback((path) => {
    const validation = validateFileName(path.split('/').pop());
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const uniquePath = getUniquePath(path, files);
    addFolder(uniquePath);
    
    // Раскрываем родительские папки
    const parts = uniquePath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      expandFolder(currentPath);
    }
    
    return uniquePath;
  }, [files, addFolder, expandFolder]);
  
  // Удаление файла или папки
  const remove = useCallback((path) => {
    deleteFileStore(path);
  }, [deleteFileStore]);
  
  // Переименование файла или папки
  const rename = useCallback((oldPath, newName) => {
    const validation = validateFileName(newName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const parentPath = getParentDirectory(oldPath);
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    
    if (files[newPath]) {
      throw new Error('A file with this name already exists');
    }
    
    renameFileStore(oldPath, newPath);
    return newPath;
  }, [files, renameFileStore]);
  
  // Перемещение файла
  const move = useCallback((oldPath, newParentPath) => {
    const fileName = oldPath.split('/').pop();
    const newPath = newParentPath ? `${newParentPath}/${fileName}` : fileName;
    
    if (files[newPath]) {
      throw new Error('A file with this name already exists in the destination');
    }
    
    renameFileStore(oldPath, newPath);
    return newPath;
  }, [files, renameFileStore]);
  
  // Копирование файла
  const copy = useCallback((sourcePath, destPath) => {
    const sourceFile = files[sourcePath];
    if (!sourceFile) {
      throw new Error('Source file not found');
    }
    
    const uniquePath = getUniquePath(destPath, files);
    addFile(uniquePath, sourceFile.content || '');
    
    return uniquePath;
  }, [files, addFile]);
  
  // Получение содержимого файла
  const getFileContent = useCallback((path) => {
    const file = files[path];
    return file?.content ?? null;
  }, [files]);
  
  // Проверка существования файла
  const exists = useCallback((path) => {
    return path in files;
  }, [files]);
  
  // Проверка является ли путь директорией
  const isDirectory = useCallback((path) => {
    const file = files[path];
    return file?.type === 'directory';
  }, [files]);
  
  // Получение списка файлов в директории
  const listDirectory = useCallback((path = '') => {
    const result = [];
    const prefix = path ? `${path}/` : '';
    
    Object.keys(files).forEach(filePath => {
      if (path === '') {
        // Корневые файлы
        if (!filePath.includes('/')) {
          result.push(filePath);
        }
      } else if (filePath.startsWith(prefix)) {
        const remaining = filePath.slice(prefix.length);
        const nextSlash = remaining.indexOf('/');
        if (nextSlash === -1) {
          result.push(filePath);
        }
      }
    });
    
    return result;
  }, [files]);
  
  // Экспорт проекта как объект
  const exportProject = useCallback(() => {
    const result = {};
    Object.entries(files).forEach(([path, data]) => {
      if (data.type === 'file') {
        result[path] = data.content;
      }
    });
    return result;
  }, [files]);
  
  // Импорт проекта из объекта
  const importProject = useCallback((projectFiles, clearExisting = true) => {
    if (clearExisting) {
      const newFiles = {};
      Object.entries(projectFiles).forEach(([path, content]) => {
        // Создаем родительские директории
        const parts = path.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          if (!newFiles[currentPath]) {
            newFiles[currentPath] = { type: 'directory' };
          }
        }
        // Добавляем файл
        newFiles[path] = { 
          content: typeof content === 'string' ? content : content.content,
          type: 'file'
        };
      });
      setFiles(newFiles);
    } else {
      Object.entries(projectFiles).forEach(([path, content]) => {
        addFile(path, typeof content === 'string' ? content : content.content);
      });
    }
  }, [setFiles, addFile]);
  
  // Мемоизируем fileTree чтобы не пересчитывать при каждом рендере
  const fileTree = useMemo(() => getFileTree(), [files, getFileTree]);
  
  return {
    // State
    files,
    currentFile,
    expandedFolders,
    fileTree,
    
    // File operations
    createFile,
    createFolder,
    updateFile: updateFileStore,
    remove,
    rename,
    move,
    copy,
    getFileContent,
    exists,
    isDirectory,
    listDirectory,
    
    // Navigation
    openFile: setCurrentFile,
    toggleFolder,
    expandFolder,
    
    // Import/Export
    exportProject,
    importProject
  };
}


