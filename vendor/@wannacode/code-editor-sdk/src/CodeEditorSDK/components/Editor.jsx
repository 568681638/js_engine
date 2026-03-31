import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import useEditorStore from '../store/editorStore';
import { getLanguageFromExtension } from '../utils/fileSystem';

// Monaco импортируется динамически чтобы избежать SSR проблем
let MonacoEditor = null;

const loadMonacoModule = async () => {
  if (typeof window === 'undefined') return false;
  if (MonacoEditor) return true;
  
  try {
    const monacoModule = await import('@monaco-editor/react');
    MonacoEditor = monacoModule.default;
    return true;
  } catch (error) {
    console.error('[Editor] Failed to load monaco:', error);
    return false;
  }
};

/**
 * Компонент редактора кода на основе Monaco Editor
 */
export default function Editor({ onFileChange, theme = 'dark', readOnly = false }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  
  const files = useEditorStore((state) => state.files);
  const currentFile = useEditorStore((state) => state.currentFile);
  const updateFile = useEditorStore((state) => state.updateFile);
  const isContainerReady = useEditorStore((state) => state.isContainerReady);
  
  // Загрузка Monaco модуля
  useEffect(() => {
    loadMonacoModule().then((loaded) => {
      setIsMonacoLoaded(loaded);
    });
  }, []);
  
  // Получаем содержимое файла безопасно
  const currentContent = useMemo(() => {
    if (!currentFile || !files[currentFile]) return '';
    const file = files[currentFile];
    if (file.type !== 'file') return '';
    return file.content ?? '';
  }, [currentFile, files]);
  
  // Проверяем загружен ли файл (для lazy loading)
  const isFileLoading = useMemo(() => {
    if (!currentFile || !files[currentFile]) return false;
    const file = files[currentFile];
    // Файл загружается если он не помечен как loaded и нет контента
    return file.type === 'file' && !file.loaded && file.content === undefined;
  }, [currentFile, files]);
  
  const language = useMemo(() => {
    return currentFile ? getLanguageFromExtension(currentFile) : 'plaintext';
  }, [currentFile]);
  
  // Обработка монтирования редактора
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Настраиваем тему
    monaco.editor.defineTheme('customDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
        { token: 'constant', foreground: '79c0ff' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#264f7855',
        'editorCursor.foreground': '#58a6ff',
        'editorWhitespace.foreground': '#30363d',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorLineNumber.foreground': '#8b949e',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editorGutter.background': '#0d1117',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'input.background': '#0d1117',
        'input.border': '#30363d',
        'input.foreground': '#e6edf3',
        'dropdown.background': '#161b22',
        'dropdown.border': '#30363d',
        'list.activeSelectionBackground': '#264f78',
        'list.hoverBackground': '#161b22',
        'scrollbarSlider.background': '#30363d55',
        'scrollbarSlider.hoverBackground': '#30363d88',
        'scrollbarSlider.activeBackground': '#30363dbb',
      }
    });
    
    monaco.editor.defineTheme('customLight', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' },
        { token: 'type', foreground: 'e36209' },
        { token: 'function', foreground: '6f42c1' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editor.selectionBackground': '#0366d625',
        'editorLineNumber.foreground': '#959da5',
        'editorGutter.background': '#ffffff',
      }
    });
    
    monaco.editor.setTheme(theme === 'dark' ? 'customDark' : 'customLight');
    
    // Настройки редактора
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });
    
    // Горячие клавиши
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log('File saved');
    });
  }, [theme]);
  
  // Обработка изменений в редакторе
  const handleEditorChange = useCallback((value) => {
    if (currentFile && value !== undefined) {
      updateFile(currentFile, value);
      onFileChange?.(currentFile, value);
    }
  }, [currentFile, updateFile, onFileChange]);
  
  // Обновляем тему при изменении
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'customDark' : 'customLight');
    }
  }, [theme]);
  
  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-[#8b949e]">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4 opacity-20">📝</div>
          <p className="text-lg">Выберите файл</p>
          <p className="text-sm mt-2 opacity-60">
            Нажмите на иконку папки внизу
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] h-full">
      {/* Tabs / File path */}
      <div className="flex items-center px-4 py-2 border-b border-[#30363d] bg-[#010409] flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] rounded-md border border-[#30363d]">
          <span className="text-[#58a6ff] text-sm">{currentFile}</span>
          {!isContainerReady && (
            <span className="text-xs text-[#d29922] ml-2">(not synced)</span>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 min-h-0">
        {isFileLoading ? (
          <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] gap-3">
            <div className="spinner" />
            <span className="text-sm text-[#8b949e]">Загрузка файла...</span>
          </div>
        ) : isMonacoLoaded && MonacoEditor ? (
          <MonacoEditor
            key={currentFile}
            height="100%"
            language={language}
            value={currentContent}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme={theme === 'dark' ? 'customDark' : 'customLight'}
            loading={
              <div className="flex items-center justify-center h-full bg-[#0d1117]">
                <div className="spinner" />
              </div>
            }
            options={{
              readOnly: readOnly,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#0d1117]">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
