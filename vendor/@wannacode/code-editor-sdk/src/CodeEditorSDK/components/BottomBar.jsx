import { 
  Play, 
  Square, 
  Package,
  RefreshCw,
  Github,
  Download,
  Code2,
  Monitor,
  Columns2,
  FolderTree,
  Terminal as TerminalIcon
} from 'lucide-react';
import { useState, useCallback } from 'react';
import useEditorStore from '../store/editorStore';

/**
 * Нижняя панель управления
 */
export default function BottomBar({
  onRunScript,
  onStopProcess,
  onNpmInstall,
  onSyncFiles,
  onLoadProject,
  // Dev mode - показывает все кнопки
  devMode = false,
  // Visibility props
  showRunButton = true,
  showInstallButton = true,
  showSyncButton = true,
  showGithubButton = true,
  showModeToggle = true,
  showSidebarToggle = true,
  showTerminalToggle = true,
}) {
  const [githubUrl, setGithubUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const isRunning = useEditorStore((state) => state.isRunning);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  const isLoading = useEditorStore((state) => state.isLoading);
  const showEditor = useEditorStore((state) => state.showEditor);
  const showPreview = useEditorStore((state) => state.showPreview);
  const showTerminal = useEditorStore((state) => state.showTerminal);
  const showSidebar = useEditorStore((state) => state.showSidebar);
  const setShowEditor = useEditorStore((state) => state.setShowEditor);
  const setShowPreview = useEditorStore((state) => state.setShowPreview);
  const toggleTerminal = useEditorStore((state) => state.toggleTerminal);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  
  // Режимы отображения
  const currentMode = showEditor && showPreview ? 'both' : showEditor ? 'editor' : 'preview';
  
  const setMode = useCallback((mode) => {
    switch (mode) {
      case 'editor':
        setShowEditor(true);
        setShowPreview(false);
        break;
      case 'preview':
        setShowEditor(false);
        setShowPreview(true);
        break;
      case 'both':
        setShowEditor(true);
        setShowPreview(true);
        break;
    }
  }, [setShowEditor, setShowPreview]);
  
  const handleLoadProject = useCallback(() => {
    if (githubUrl.trim()) {
      onLoadProject?.(githubUrl.trim());
      setShowUrlInput(false);
      setGithubUrl('');
    }
  }, [githubUrl, onLoadProject]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleLoadProject();
    } else if (e.key === 'Escape') {
      setShowUrlInput(false);
      setGithubUrl('');
    }
  }, [handleLoadProject]);
  
  // Показываем кнопки только в devMode или если явно включены
  const shouldShowActions = devMode || showRunButton || showInstallButton || showSyncButton || showGithubButton;
  
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#010409] border-t border-[#30363d] flex-shrink-0">
      {/* Левая часть - статус и toggles */}
      <div className="flex items-center gap-2">
        {/* Статус */}
        <div className="flex items-center gap-2 mr-3">
          <div 
            className={`w-2 h-2 rounded-full ${
              isContainerReady 
                ? 'bg-[#3fb950]' 
                : 'bg-[#d29922] animate-pulse'
            }`} 
          />
          <span className="text-xs text-[#8b949e]">
            {isContainerReady ? 'Готов' : 'Загрузка...'}
          </span>
        </div>
        
        {/* Sidebar toggle */}
        {showSidebarToggle && (
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded transition-colors ${
              showSidebar 
                ? 'bg-[#30363d] text-[#e6edf3]' 
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
            }`}
            title={showSidebar ? 'Скрыть файлы' : 'Показать файлы'}
          >
            <FolderTree size={14} />
          </button>
        )}
        
        {/* Terminal toggle */}
        {showTerminalToggle && (
          <button
            onClick={toggleTerminal}
            className={`p-1.5 rounded transition-colors ${
              showTerminal 
                ? 'bg-[#30363d] text-[#e6edf3]' 
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
            }`}
            title={showTerminal ? 'Скрыть терминал' : 'Показать терминал'}
          >
            <TerminalIcon size={14} />
          </button>
        )}
      </div>
      
      {/* Правая часть - режимы и действия */}
      <div className="flex items-center gap-2">
        {/* Режимы отображения */}
        {showModeToggle && (
          <div className="flex items-center bg-[#21262d] rounded-md p-0.5 mr-2">
            <button
              onClick={() => setMode('editor')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                currentMode === 'editor'
                  ? 'bg-[#30363d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Только код"
            >
              <Code2 size={12} />
              <span>Код</span>
            </button>
            <button
              onClick={() => setMode('both')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                currentMode === 'both'
                  ? 'bg-[#30363d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Код и превью"
            >
              <Columns2 size={12} />
              <span>Оба</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                currentMode === 'preview'
                  ? 'bg-[#30363d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Только превью"
            >
              <Monitor size={12} />
              <span>Превью</span>
            </button>
          </div>
        )}
        
        {/* Действия (только в devMode или если включены) */}
        {shouldShowActions && (
          <>
            {/* GitHub input */}
            {(devMode || showGithubButton) && showUrlInput && (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="github.com/user/repo"
                  className="input text-xs py-1 px-2 w-48"
                  autoFocus
                />
                <button
                  onClick={handleLoadProject}
                  disabled={!githubUrl.trim()}
                  className="btn text-xs py-1"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false);
                    setGithubUrl('');
                  }}
                  className="text-xs text-[#8b949e] hover:text-[#e6edf3]"
                >
                  ✕
                </button>
              </div>
            )}
            
            {!showUrlInput && (
              <>
                {/* GitHub */}
                {(devMode || showGithubButton) && (
                  <button
                    onClick={() => setShowUrlInput(true)}
                    className="btn text-xs py-1"
                    title="Загрузить из GitHub"
                  >
                    <Github size={12} />
                    <span>GitHub</span>
                  </button>
                )}
                
                {/* Sync */}
                {(devMode || showSyncButton) && (
                  <button
                    onClick={onSyncFiles}
                    disabled={!isContainerReady || isRunning || isLoading}
                    className="btn text-xs py-1"
                    title="Синхронизировать файлы"
                  >
                    <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </button>
                )}
                
                {/* Install */}
                {(devMode || showInstallButton) && (
                  <button
                    onClick={onNpmInstall}
                    disabled={!isContainerReady || isRunning || isLoading}
                    className="btn text-xs py-1"
                    title="Установить зависимости"
                  >
                    <Package size={12} />
                    <span>Install</span>
                  </button>
                )}
                
                {/* Run/Stop */}
                {(devMode || showRunButton) && (
                  isRunning ? (
                    <button
                      onClick={onStopProcess}
                      className="btn btn-danger text-xs py-1"
                      title="Остановить"
                    >
                      <Square size={12} />
                      <span>Стоп</span>
                    </button>
                  ) : (
                    <button
                      onClick={onRunScript}
                      disabled={!isContainerReady || isLoading}
                      className="btn btn-success text-xs py-1"
                      title="Запустить"
                    >
                      <Play size={12} />
                      <span>Run</span>
                    </button>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


