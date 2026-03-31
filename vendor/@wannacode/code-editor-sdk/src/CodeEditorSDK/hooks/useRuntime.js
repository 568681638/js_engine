import { useEffect, useCallback, useRef } from 'react';
import useEditorStore from '../store/editorStore';
import { 
  bootWebContainer, 
  syncFilesToContainer,
  writeFileToContainer
} from '../utils/runtime';

/**
 * Hook для управления WebContainer runtime
 */
export default function useRuntime() {
  const containerRef = useRef(null);
  const isBootingRef = useRef(false);
  const isSyncingRef = useRef(false);
  
  const webcontainer = useEditorStore((state) => state.webcontainer);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  
  // Инициализация WebContainer
  const initContainer = useCallback(async () => {
    // Проверяем через ref чтобы избежать race conditions
    if (containerRef.current) {
      return containerRef.current;
    }
    
    if (isBootingRef.current) {
      // Ждём пока завершится текущая инициализация
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (containerRef.current) {
            clearInterval(checkInterval);
            resolve(containerRef.current);
          }
        }, 100);
        // Таймаут на случай ошибки
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 30000);
      });
    }
    
    isBootingRef.current = true;
    const { setLoading, setError, setWebcontainer, appendTerminalOutput } = useEditorStore.getState();
    
    setLoading(true, 'Initializing WebContainer...');
    
    try {
      const container = await bootWebContainer();
      containerRef.current = container;
      setWebcontainer(container);
      setLoading(false);
      
      appendTerminalOutput({ 
        type: 'system', 
        content: 'WebContainer initialized successfully!' 
      });
      
      return container;
    } catch (error) {
      setError(`Failed to initialize WebContainer: ${error.message}`);
      setLoading(false);
      isBootingRef.current = false;
      throw error;
    }
  }, []);
  
  // Синхронизация файлов с контейнером
  const syncFiles = useCallback(async () => {
    // Предотвращаем параллельные синхронизации
    if (isSyncingRef.current) {
      return;
    }
    
    let container = containerRef.current || webcontainer;
    
    if (!container) {
      // Инициализируем контейнер и ждём результат
      container = await initContainer();
      if (!container) {
        console.error('Failed to get container for sync');
        return;
      }
    }
    
    isSyncingRef.current = true;
    const { setLoading, setError, appendTerminalOutput, files: currentFiles } = useEditorStore.getState();
    
    try {
      setLoading(true, 'Syncing files...');
      await syncFilesToContainer(container, currentFiles);
      setLoading(false);
      
      appendTerminalOutput({ 
        type: 'system', 
        content: 'Files synced to container' 
      });
    } catch (error) {
      setError(`Failed to sync files: ${error.message}`);
      setLoading(false);
      throw error;
    } finally {
      isSyncingRef.current = false;
    }
  }, [webcontainer, initContainer]);
  
  // Запись одного файла
  const writeFile = useCallback(async (path, content) => {
    const container = containerRef.current || webcontainer;
    if (!container) return;
    
    try {
      await writeFileToContainer(container, path, content);
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
    }
  }, [webcontainer]);
  
  // Автоматическая инициализация при первом рендере - БЕЗ зависимостей!
  useEffect(() => {
    initContainer().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Обновляем ref когда контейнер установлен в store
  useEffect(() => {
    if (webcontainer && !containerRef.current) {
      containerRef.current = webcontainer;
    }
  }, [webcontainer]);
  
  return {
    container: containerRef.current || webcontainer,
    isReady: isContainerReady,
    initContainer,
    syncFiles,
    writeFile
  };
}
