import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import useEditorStore from '../store/editorStore';

/**
 * Компонент Preview для отображения результата выполнения
 */
export default function Preview({ height = '100%' }) {
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const previewUrl = useEditorStore((state) => state.previewUrl);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  
  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      setIsLoading(true);
      iframeRef.current.src = previewUrl;
    }
  };
  
  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (previewUrl) {
      setIsLoading(true);
    }
  }, [previewUrl]);
  
  if (!previewUrl) {
    return (
      <div 
        className="flex flex-col bg-[#0d1117] border-l border-[#30363d]"
        style={{ height }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#010409] border-b border-[#30363d] flex-shrink-0">
          <span className="text-sm font-medium text-[#e6edf3]">Превью</span>
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            {!isContainerReady && (
              <span className="text-[#d29922]">Initializing...</span>
            )}
          </div>
        </div>
        
        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center text-[#8b949e]">
          <div className="text-center">
            <div className="text-5xl mb-4 opacity-20">🖼️</div>
            <p className="text-sm">Запустите сервер для просмотра</p>
            <p className="text-xs mt-2 opacity-60">
              Нажмите Run внизу
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`flex flex-col bg-[#0d1117] border-l border-[#30363d] ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#010409] border-b border-[#30363d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#e6edf3]">Превью</span>
          <span className="text-xs text-[#8b949e] truncate max-w-[200px]">
            {previewUrl}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin mr-2" />
          )}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      
      {/* Iframe */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  );
}

