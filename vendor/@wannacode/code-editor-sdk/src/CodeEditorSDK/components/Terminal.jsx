import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Square
} from 'lucide-react';
import useEditorStore from '../store/editorStore';

// xterm импортируется динамически чтобы избежать SSR проблем
let XTerm = null;
let FitAddon = null;
let WebLinksAddon = null;

// Функция для загрузки xterm модулей
const loadXtermModules = async () => {
  if (typeof window === 'undefined') return false;
  if (XTerm) return true; // Уже загружено
  
  try {
    const [xtermModule, fitModule, webLinksModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links')
    ]);
    
    // Загружаем CSS
    await import('@xterm/xterm/css/xterm.css');
    
    XTerm = xtermModule.Terminal;
    FitAddon = fitModule.FitAddon;
    WebLinksAddon = webLinksModule.WebLinksAddon;
    
    return true;
  } catch (error) {
    console.error('[Terminal] Failed to load xterm:', error);
    return false;
  }
};

/**
 * Компонент терминала на основе xterm.js
 * Использует visibility вместо условного рендеринга чтобы сохранять состояние
 */
const Terminal = forwardRef(function Terminal({ 
  onCommandRun,
  height = '200px',
  showHeader = true,
  visible = true
}, ref) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const shellProcessRef = useRef(null);
  const writerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const [isXtermLoaded, setIsXtermLoaded] = useState(false);
  
  const webcontainer = useEditorStore((state) => state.webcontainer);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  const isRunning = useEditorStore((state) => state.isRunning);
  const setRunning = useEditorStore((state) => state.setRunning);
  const setCurrentProcess = useEditorStore((state) => state.setCurrentProcess);
  const clearTerminalStore = useEditorStore((state) => state.clearTerminal);
  const setPreviewUrl = useEditorStore((state) => state.setPreviewUrl);
  
  // Загрузка xterm модулей
  useEffect(() => {
    loadXtermModules().then((loaded) => {
      setIsXtermLoaded(loaded);
    });
  }, []);
  
  // Инициализация терминала
  useEffect(() => {
    if (!terminalRef.current || isInitializedRef.current || !isXtermLoaded || !XTerm) return;
    
    isInitializedRef.current = true;
    
    const xterm = new XTerm({
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#264f78',
        black: '#0d1117',
        red: '#f85149',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#e6edf3',
        brightBlack: '#8b949e',
        brightRed: '#ff7b72',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true,
    });
    
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    
    xterm.open(terminalRef.current);
    
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
    
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
    
    // Приветственное сообщение
    xterm.writeln('\x1b[1;34m╭─────────────────────────────────────────╮\x1b[0m');
    xterm.writeln('\x1b[1;34m│\x1b[0m   \x1b[1;36mCode Editor SDK Terminal\x1b[0m              \x1b[1;34m│\x1b[0m');
    xterm.writeln('\x1b[1;34m│\x1b[0m   \x1b[2mPowered by WebContainer\x1b[0m               \x1b[1;34m│\x1b[0m');
    xterm.writeln('\x1b[1;34m╰─────────────────────────────────────────╯\x1b[0m');
    xterm.writeln('');
    
    // Обработка resize
    const handleResize = () => {
      setTimeout(() => fitAddon.fit(), 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => fitAddon.fit(), 100);
    });
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [isXtermLoaded]);
  
  // Fit при изменении видимости
  useEffect(() => {
    if (visible && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [visible]);
  
  // Запуск shell когда контейнер готов
  useEffect(() => {
    if (!webcontainer || !xtermRef.current || shellProcessRef.current) return;
    
    const startShell = async () => {
      try {
        const xterm = xtermRef.current;
        
        const shellProcess = await webcontainer.spawn('jsh', {
          terminal: {
            cols: xterm.cols,
            rows: xterm.rows,
          },
        });
        
        shellProcessRef.current = shellProcess;
        
        const input = shellProcess.input.getWriter();
        writerRef.current = input;
        
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              xterm.write(data);
            },
          })
        );
        
        xterm.onResize(({ cols, rows }) => {
          shellProcess.resize({ cols, rows });
        });
        
        xterm.onData((data) => {
          input.write(data);
        });
        
        webcontainer.on('server-ready', (port, url) => {
          console.log('Server ready:', url);
          setPreviewUrl(url);
          xterm.writeln(`\r\n\x1b[32m✓ Сервер запущен: ${url}\x1b[0m\r\n`);
        });
        
      } catch (error) {
        console.error('Failed to start shell:', error);
        xtermRef.current?.writeln(`\x1b[31mОшибка запуска shell: ${error.message}\x1b[0m`);
      }
    };
    
    startShell();
  }, [webcontainer, setPreviewUrl]);
  
  const killCurrentProcess = useCallback(() => {
    if (writerRef.current) {
      writerRef.current.write('\x03');
      xtermRef.current?.writeln('\r\n\x1b[33mПроцесс прерван\x1b[0m');
    }
    setCurrentProcess(null);
    setRunning(false);
  }, [setCurrentProcess, setRunning]);
  
  const handleClear = useCallback(() => {
    xtermRef.current?.clear();
    clearTerminalStore();
  }, [clearTerminalStore]);
  
  const runCommand = useCallback((command) => {
    if (writerRef.current) {
      writerRef.current.write(command + '\n');
      onCommandRun?.(command, null);
    }
  }, [onCommandRun]);
  
  const write = useCallback((text) => {
    xtermRef.current?.write(text);
  }, []);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    runCommand,
    clear: handleClear,
    kill: killCurrentProcess,
    write,
    focus: () => xtermRef.current?.focus(),
  }), [runCommand, handleClear, killCurrentProcess, write]);
  
  return (
    <div 
      className="flex flex-col bg-[#0d1117] border-t border-[#30363d]"
      style={{ 
        height,
        display: visible ? 'flex' : 'none'
      }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#010409] border-b border-[#30363d] flex-shrink-0">
          <div className="flex items-center gap-2">
            <TerminalIcon size={14} className="text-[#8b949e]" />
            <span className="text-sm font-medium text-[#e6edf3]">Терминал</span>
            {isRunning && (
              <span className="flex items-center gap-1 text-xs text-[#3fb950]">
                <span className="w-2 h-2 bg-[#3fb950] rounded-full animate-pulse" />
                Выполняется
              </span>
            )}
            {!isContainerReady && (
              <span className="text-xs text-[#d29922]">
                Инициализация...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {isRunning && (
              <button
                onClick={killCurrentProcess}
                className="p-1.5 rounded hover:bg-[#f8514926] text-[#f85149] transition-colors"
                title="Остановить (Ctrl+C)"
              >
                <Square size={14} />
              </button>
            )}
            <button
              onClick={handleClear}
              className="p-1.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Очистить"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* Terminal content */}
      <div 
        ref={terminalRef} 
        className="flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  );
});

export default Terminal;
