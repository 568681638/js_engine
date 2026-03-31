import { 
  useRef, 
  useEffect, 
  useCallback, 
  useImperativeHandle, 
  forwardRef,
  useState 
} from 'react';
import useEditorStore from './store/editorStore';
import useRuntime from './hooks/useRuntime';
import useFileSystem from './hooks/useFileSystem';
import useGitHub from './hooks/useGitHub';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Preview from './components/Preview';
import BottomBar from './components/BottomBar';
import LoadingOverlay from './components/LoadingOverlay';

/**
 * CodeEditorSDK - Главный компонент SDK
 * Полностью настраиваемый через props для встраивания
 */
const CodeEditorSDK = forwardRef(function CodeEditorSDK({
  // Источник данных
  githubUrl,
  initialFiles,
  
  // Callbacks
  onFileChange,
  onCommandRun,
  onProjectLoaded,
  onFileSelect,
  onReady,
  
  // Конфигурация
  config = {}
}, ref) {
  const {
    // Файл который открыть по умолчанию
    defaultFile = null,
    
    // Тема
    theme: initialTheme = 'dark',
    
    // Размеры
    height = '100%',
    terminalHeight = '200px',
    sidebarWidth = 250,
    
    // Видимость панелей (начальное состояние)
    showSidebar: initialShowSidebar = false, // По умолчанию скрыт
    showTerminal: initialShowTerminal = true,
    showPreview: initialShowPreview = true,
    showEditor: initialShowEditor = true,
    
    // Нижняя панель
    showBottomBar = true,
    showModeToggle = true,
    showSidebarToggle = true,
    showTerminalToggle = true,
    
    // Кнопки действий (только при devMode или если явно включены)
    devMode = false,
    showRunButton = false,
    showInstallButton = false,
    showSyncButton = false,
    showGithubButton = false,
    
    // Разрешения
    allowFileCreation = true,
    allowFileDeletion = true,
    readOnly = false,
    
    // Автоматизация
    startCommand = null,
    autoInstall = false,
    autoRun = false,
    // Если true, перед startCommand автоматически выполнится npm install
    installBeforeStart = true,
  } = config;
  
  const [theme, setTheme] = useState(initialTheme);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const terminalRef = useRef(null);
  const containerRef = useRef(null);
  const hasAutoRun = useRef(false);
  
  // Hooks
  const runtime = useRuntime();
  const fileSystem = useFileSystem();
  const github = useGitHub();
  
  // Store selectors
  const isLoading = useEditorStore((state) => state.isLoading);
  const loadingMessage = useEditorStore((state) => state.loadingMessage);
  const error = useEditorStore((state) => state.error);
  const currentFile = useEditorStore((state) => state.currentFile);
  const files = useEditorStore((state) => state.files);
  const clearError = useEditorStore((state) => state.clearError);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  const showEditorState = useEditorStore((state) => state.showEditor);
  const showPreviewState = useEditorStore((state) => state.showPreview);
  const showTerminalState = useEditorStore((state) => state.showTerminal);
  const showSidebarState = useEditorStore((state) => state.showSidebar);
  const setShowEditor = useEditorStore((state) => state.setShowEditor);
  const setShowPreview = useEditorStore((state) => state.setShowPreview);
  const setShowTerminal = useEditorStore((state) => state.setShowTerminal);
  const setShowSidebar = useEditorStore((state) => state.setShowSidebar);
  
  // Инициализация UI состояния
  useEffect(() => {
    setShowSidebar(initialShowSidebar);
    setShowTerminal(initialShowTerminal);
    setShowPreview(initialShowPreview);
    setShowEditor(initialShowEditor);
  }, []);
  
  // Загрузка initialFiles
  useEffect(() => {
    if (initialFiles && !isInitialized) {
      setIsInitialized(true);
      fileSystem.importProject(initialFiles);
      
      if (defaultFile) {
        setTimeout(() => {
          useEditorStore.setState({ currentFile: defaultFile });
        }, 100);
      }
      
      onProjectLoaded?.(initialFiles);
    }
  }, [initialFiles]);
  
  // Загрузка из GitHub (lazy loading — только структура + начальный файл)
  useEffect(() => {
    if (githubUrl && !isInitialized && !initialFiles) {
      setIsInitialized(true);
      console.log('[CodeEditorSDK] Loading GitHub project (lazy mode):', githubUrl);
      
      github.loadProject(githubUrl, { 
        initialFile: defaultFile // Загрузить контент этого файла сразу
      }).then((result) => {
        console.log('[CodeEditorSDK] Project structure loaded:', {
          filesCount: Object.keys(result.files).length,
          defaultFile: result.defaultFile,
          files: Object.keys(result.files)
        });
        
        onProjectLoaded?.(result.files);
        
        const fileToOpen = defaultFile || result.defaultFile;
        if (fileToOpen) {
          console.log('[CodeEditorSDK] Opening file:', fileToOpen);
          setTimeout(() => {
            useEditorStore.setState({ currentFile: fileToOpen });
          }, 100);
        }
      }).catch((error) => {
        console.error('[CodeEditorSDK] Failed to load project:', error);
      });
    }
  }, [githubUrl, defaultFile]);
  
  // Синхронизация файлов с контейнером - используем подписку на store
  const hasSyncedRef = useRef(false);
  
  useEffect(() => {
    if (!isContainerReady) return;
    
    // Подписываемся на изменения files в store
    const unsubscribe = useEditorStore.subscribe(
      (state) => Object.keys(state.files).length,
      (filesCount, prevFilesCount) => {
        // Синхронизируем только когда файлы появились впервые
        if (filesCount > 0 && prevFilesCount === 0 && !hasSyncedRef.current) {
          hasSyncedRef.current = true;
          
          // Сначала загружаем ВСЕ файлы (для lazy loading), потом синхронизируем
          github.loadAllFilesForSync().then(() => runtime.syncFiles()).then(() => {
            onReady?.();
            
            if (autoInstall || autoRun) {
              const runAutoTasks = async () => {
                const latestFiles = useEditorStore.getState().files;
                const hasPackageJson = latestFiles['package.json'];
                
                if (autoRun && startCommand) {
                  // Если нужно запустить команду
                  if (hasPackageJson && installBeforeStart) {
                    // npm install && команда - выполняются последовательно
                    terminalRef.current?.runCommand?.(`npm install && ${startCommand}`);
                  } else {
                    terminalRef.current?.runCommand?.(startCommand);
                  }
                } else if (autoInstall && hasPackageJson) {
                  // Только npm install без команды
                  terminalRef.current?.runCommand?.('npm install');
                }
              };
              
              setTimeout(runAutoTasks, 1000);
            }
          }).catch(console.error);
        }
      },
      { fireImmediately: true }
    );
    
    return () => unsubscribe();
  }, [isContainerReady, autoInstall, autoRun, startCommand, onReady, runtime, installBeforeStart, github]);
  
  // Lazy loading: загружаем контент файла при выборе
  useEffect(() => {
    if (!currentFile) return;
    
    const file = files[currentFile];
    
    // Если файл существует, но контент не загружен — загружаем лениво
    if (file && file.type === 'file' && !file.loaded && !file.content) {
      console.log('[CodeEditorSDK] Lazy loading file:', currentFile);
      
      github.loadFile(currentFile).catch((error) => {
        console.error('[CodeEditorSDK] Failed to lazy load file:', currentFile, error);
      });
    }
    
    onFileSelect?.(currentFile);
  }, [currentFile, files, onFileSelect, github]);
  
  const handleFileChange = useCallback((filename, content) => {
    if (runtime.isReady) {
      runtime.writeFile(filename, content);
    }
    onFileChange?.(filename, content);
  }, [runtime, onFileChange]);
  
  const handleRunScript = useCallback(async () => {
    const hasPackageJson = files['package.json'];
    const prefix = hasPackageJson && installBeforeStart ? 'npm install && ' : '';
    
    if (startCommand) {
      terminalRef.current?.runCommand?.(prefix + startCommand);
      return;
    }
    
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(files['package.json'].content);
        if (pkg.scripts?.dev) {
          terminalRef.current?.runCommand?.(prefix + 'npm run dev');
          return;
        } else if (pkg.scripts?.start) {
          terminalRef.current?.runCommand?.(prefix + 'npm start');
          return;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
    
    const fileToRun = currentFile || defaultFile;
    if (fileToRun && (fileToRun.endsWith('.js') || fileToRun.endsWith('.mjs'))) {
      terminalRef.current?.runCommand?.(`node ${fileToRun}`);
    }
  }, [startCommand, currentFile, defaultFile, files, installBeforeStart]);
  
  const handleNpmInstall = useCallback(() => {
    terminalRef.current?.runCommand?.('npm install');
  }, []);
  
  const handleSyncFiles = useCallback(async () => {
    await runtime.syncFiles();
  }, [runtime]);
  
  const handleLoadProject = useCallback(async (url) => {
    hasAutoRun.current = false;
    const result = await github.loadProject(url);
    onProjectLoaded?.(result.files);
    
    const fileToOpen = defaultFile || result.defaultFile;
    if (fileToOpen) {
      setTimeout(() => {
        useEditorStore.setState({ currentFile: fileToOpen });
      }, 100);
    }
    
    if (runtime.isReady) {
      await runtime.syncFiles();
    }
  }, [github, runtime, onProjectLoaded, defaultFile]);
  
  const handleStopProcess = useCallback(() => {
    terminalRef.current?.kill?.();
  }, []);
  
  // Imperative API
  useImperativeHandle(ref, () => ({
    openFile: (path) => useEditorStore.setState({ currentFile: path }),
    createFile: (path, content) => fileSystem.createFile(path, content),
    createFolder: (path) => fileSystem.createFolder(path),
    deleteFile: (path) => fileSystem.remove(path),
    getFileContent: (path) => fileSystem.getFileContent(path),
    updateFile: (path, content) => fileSystem.updateFile(path, content),
    getFiles: () => useEditorStore.getState().files,
    getCurrentFile: () => useEditorStore.getState().currentFile,
    
    runCommand: (cmd) => terminalRef.current?.runCommand?.(cmd),
    runCommandWithInstall: (cmd) => terminalRef.current?.runCommand?.(`npm install && ${cmd}`),
    runScript: (file) => terminalRef.current?.runCommand?.(`node ${file}`),
    npmInstall: () => terminalRef.current?.runCommand?.('npm install'),
    killProcess: () => terminalRef.current?.kill?.(),
    syncFiles: () => runtime.syncFiles(),
    
    loadProject: (url) => handleLoadProject(url),
    loadFile: (path) => github.loadFile(path), // Lazy load файла
    exportProject: () => fileSystem.exportProject(),
    importProject: (projectFiles) => {
      fileSystem.importProject(projectFiles);
      if (defaultFile && projectFiles[defaultFile]) {
        setTimeout(() => {
          useEditorStore.setState({ currentFile: defaultFile });
        }, 100);
      }
    },
    
    setTheme: (t) => setTheme(t),
    toggleSidebar: () => useEditorStore.getState().toggleSidebar(),
    toggleEditor: () => useEditorStore.getState().toggleEditor(),
    togglePreview: () => useEditorStore.getState().togglePreview(),
    toggleTerminal: () => useEditorStore.getState().toggleTerminal(),
    
    setShowSidebar: (v) => useEditorStore.getState().setShowSidebar(v),
    setShowEditor: (v) => useEditorStore.getState().setShowEditor(v),
    setShowPreview: (v) => useEditorStore.getState().setShowPreview(v),
    setShowTerminal: (v) => useEditorStore.getState().setShowTerminal(v),
    
    clearTerminal: () => terminalRef.current?.clear?.(),
    writeToTerminal: (text) => terminalRef.current?.write?.(text),
    
    isReady: runtime.isReady,
    isRunning: useEditorStore.getState().isRunning,
    getState: () => useEditorStore.getState(),
  }), [fileSystem, runtime, handleLoadProject, setTheme, defaultFile]);
  
  const hasEditorOrPreview = showEditorState || showPreviewState;
  
  return (
    <div 
      ref={containerRef}
      className="flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden relative"
      style={{ height }}
    >
      {/* Loading overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-[#f85149] text-white px-4 py-2 flex items-center justify-between z-40 animate-slide-in">
          <span>{error}</span>
          <button 
            onClick={clearError}
            className="text-white/80 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        {showSidebarState && (
          <div 
            className="flex-shrink-0 border-r border-[#30363d] overflow-hidden"
            style={{ width: sidebarWidth }}
          >
            <FileTree
              allowFileCreation={allowFileCreation && !readOnly}
              allowFileDeletion={allowFileDeletion && !readOnly}
              onFileCreate={(path, content) => handleFileChange(path, content)}
              onFileDelete={(path) => console.log('Deleted:', path)}
              onFileSelect={onFileSelect}
            />
          </div>
        )}
        
        {/* Editor + Preview + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Editor and Preview row */}
          {hasEditorOrPreview && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Editor */}
              {showEditorState && (
                <div className={`flex-1 overflow-hidden ${showPreviewState ? 'border-r border-[#30363d]' : ''}`}>
                  <Editor
                    onFileChange={readOnly ? undefined : handleFileChange}
                    theme={theme}
                    readOnly={readOnly}
                  />
                </div>
              )}
              
              {/* Preview */}
              {showPreviewState && (
                <div className="flex-1 overflow-hidden">
                  <Preview height="100%" />
                </div>
              )}
            </div>
          )}
          
          {/* Terminal - всегда рендерится, visibility через prop */}
          <Terminal
            ref={terminalRef}
            onCommandRun={onCommandRun}
            height={terminalHeight}
            visible={showTerminalState}
          />
        </div>
      </div>
      
      {/* Bottom bar */}
      {showBottomBar && (
        <BottomBar
          onRunScript={handleRunScript}
          onStopProcess={handleStopProcess}
          onNpmInstall={handleNpmInstall}
          onSyncFiles={handleSyncFiles}
          onLoadProject={handleLoadProject}
          devMode={devMode}
          showRunButton={showRunButton}
          showInstallButton={showInstallButton}
          showSyncButton={showSyncButton}
          showGithubButton={showGithubButton}
          showModeToggle={showModeToggle}
          showSidebarToggle={showSidebarToggle}
          showTerminalToggle={showTerminalToggle}
        />
      )}
    </div>
  );
});

export default CodeEditorSDK;
