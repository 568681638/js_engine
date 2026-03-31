import { useState, useCallback } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Github,
  Sun,
  Moon,
  Package,
  Code2,
  Monitor,
  Terminal,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react';
import useEditorStore from '../store/editorStore';

/**
 * Панель инструментов - полностью настраиваемая через props
 */
export default function Toolbar({
  onRunScript,
  onStopProcess,
  onNpmInstall,
  onLoadProject,
  onSyncFiles,
  theme,
  onThemeChange,
  startCommand,
  // Visibility props
  showRunButton = true,
  showInstallButton = true,
  showSyncButton = true,
  showGithubButton = true,
  showThemeToggle = true,
  showPanelToggles = true,
  showStatusIndicator = true,
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
  const toggleEditor = useEditorStore((state) => state.toggleEditor);
  const togglePreview = useEditorStore((state) => state.togglePreview);
  const toggleTerminal = useEditorStore((state) => state.toggleTerminal);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  
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
  
  // Проверяем есть ли хоть какие-то элементы для отображения
  const hasLeftItems = showRunButton || showInstallButton || showSyncButton || showGithubButton;
  const hasRightItems = showPanelToggles || showThemeToggle || showStatusIndicator;
  
  if (!hasLeftItems && !hasRightItems) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#010409] border-b border-[#30363d] flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Run/Stop */}
        {showRunButton && (
          isRunning ? (
            <button
              onClick={onStopProcess}
              className="btn btn-danger"
              title="Stop process"
            >
              <Square size={14} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={onRunScript}
              disabled={!isContainerReady || isLoading}
              className="btn btn-success"
              title={startCommand ? `Run: ${startCommand}` : 'Run script'}
            >
              <Play size={14} />
              <span>Run</span>
            </button>
          )
        )}
        
        {/* npm install */}
        {showInstallButton && (
          <button
            onClick={onNpmInstall}
            disabled={!isContainerReady || isRunning || isLoading}
            className="btn"
            title="Install dependencies"
          >
            <Package size={14} />
            <span>Install</span>
          </button>
        )}
        
        {/* Sync files */}
        {showSyncButton && (
          <button
            onClick={onSyncFiles}
            disabled={!isContainerReady || isRunning || isLoading}
            className="btn"
            title="Sync files to container"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        )}
        
        {(showRunButton || showInstallButton || showSyncButton) && showGithubButton && (
          <div className="w-px h-6 bg-[#30363d] mx-2" />
        )}
        
        {/* GitHub load */}
        {showGithubButton && (
          showUrlInput ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="github.com/user/repo"
                className="input w-64"
                autoFocus
              />
              <button
                onClick={handleLoadProject}
                disabled={!githubUrl.trim()}
                className="btn btn-primary"
              >
                <Download size={14} />
                <span>Load</span>
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false);
                  setGithubUrl('');
                }}
                className="btn"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowUrlInput(true)}
              className="btn"
              title="Load project from GitHub"
            >
              <Github size={14} />
              <span>GitHub</span>
            </button>
          )
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Panel toggles */}
        {showPanelToggles && (
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded transition-colors ${
                showSidebar 
                  ? 'bg-[#30363d] text-[#e6edf3]' 
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
              }`}
              title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            >
              {showSidebar ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            </button>
            <button
              onClick={toggleEditor}
              className={`p-1.5 rounded transition-colors ${
                showEditor 
                  ? 'bg-[#30363d] text-[#e6edf3]' 
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
              }`}
              title={showEditor ? 'Hide editor' : 'Show editor'}
            >
              <Code2 size={14} />
            </button>
            <button
              onClick={togglePreview}
              className={`p-1.5 rounded transition-colors ${
                showPreview 
                  ? 'bg-[#30363d] text-[#e6edf3]' 
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
              }`}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={toggleTerminal}
              className={`p-1.5 rounded transition-colors ${
                showTerminal 
                  ? 'bg-[#30363d] text-[#e6edf3]' 
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
              }`}
              title={showTerminal ? 'Hide terminal' : 'Show terminal'}
            >
              <Terminal size={14} />
            </button>
          </div>
        )}
        
        {showPanelToggles && showThemeToggle && (
          <div className="w-px h-6 bg-[#30363d]" />
        )}
        
        {/* Theme toggle */}
        {showThemeToggle && (
          <button
            onClick={() => onThemeChange?.(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}
        
        {/* Status indicator */}
        {showStatusIndicator && (
          <div className="flex items-center gap-2 ml-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                isContainerReady 
                  ? 'bg-[#3fb950]' 
                  : 'bg-[#d29922] animate-pulse'
              }`} 
            />
            <span className="text-xs text-[#8b949e]">
              {isContainerReady ? 'Ready' : 'Loading...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
