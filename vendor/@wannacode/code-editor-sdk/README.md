# Code Editor SDK

React SDK компонент для встраивания полнофункционального редактора кода с Node.js runtime в браузере.

## ✨ Возможности

- **Monaco Editor** — редактор кода на базе VS Code с подсветкой синтаксиса и IntelliSense
- **WebContainer** — полноценный Node.js runtime в браузере
- **Терминал** — интерактивный терминал на базе xterm.js
- **Файловая система** — виртуальная файловая система с поддержкой CRUD операций
- **GitHub интеграция** — загрузка любых публичных репозиториев

## 🚀 Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:5173

## 📦 Использование SDK

### Declarative API

```jsx
import { CodeEditorSDK } from '@mycompany/code-editor-sdk';

function App() {
  return (
    <CodeEditorSDK
      githubUrl="https://github.com/user/repo"
      onFileChange={(filename, content) => {
        console.log('File changed:', filename);
      }}
      onCommandRun={(command, output) => {
        console.log('Command run:', command);
      }}
      onProjectLoaded={(files) => {
        console.log('Project loaded:', Object.keys(files).length, 'files');
      }}
      config={{
        theme: 'dark',
        editorHeight: '600px',
        terminalHeight: '300px',
        showSidebar: true,
        showTerminal: true,
        showToolbar: true,
        allowFileCreation: true,
        allowFileDeletion: true,
        sidebarWidth: 250,
      }}
    />
  );
}
```

### Imperative API

```jsx
import { useRef } from 'react';
import { CodeEditorSDK } from '@mycompany/code-editor-sdk';

function App() {
  const editorRef = useRef();

  const handleLoadProject = async () => {
    await editorRef.current.loadProject('https://github.com/facebook/react');
  };

  const handleRunScript = async () => {
    await editorRef.current.runScript('index.js');
  };

  const handleRunCommand = async () => {
    await editorRef.current.runCommand('npm install');
  };

  return (
    <div>
      <button onClick={handleLoadProject}>Load Project</button>
      <button onClick={handleRunScript}>Run Script</button>
      <button onClick={handleRunCommand}>npm install</button>
      
      <CodeEditorSDK ref={editorRef} />
    </div>
  );
}
```

## 📚 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `githubUrl` | `string` | - | URL GitHub репозитория для автозагрузки |
| `onFileChange` | `(filename, content) => void` | - | Callback при изменении файла |
| `onCommandRun` | `(command, output) => void` | - | Callback при выполнении команды |
| `onProjectLoaded` | `(files) => void` | - | Callback при загрузке проекта |
| `config` | `object` | - | Конфигурация (см. ниже) |

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'dark' \| 'light'` | `'dark'` | Тема редактора |
| `editorHeight` | `string` | `'100%'` | Высота редактора |
| `terminalHeight` | `string` | `'250px'` | Высота терминала |
| `showSidebar` | `boolean` | `true` | Показывать боковую панель |
| `showTerminal` | `boolean` | `true` | Показывать терминал |
| `showToolbar` | `boolean` | `true` | Показывать панель инструментов |
| `allowFileCreation` | `boolean` | `true` | Разрешить создание файлов |
| `allowFileDeletion` | `boolean` | `true` | Разрешить удаление файлов |
| `sidebarWidth` | `number` | `250` | Ширина боковой панели |
| `defaultFile` | `string` | `'index.js'` | Файл по умолчанию |

### Imperative Methods

```typescript
interface CodeEditorSDKRef {
  // File operations
  openFile(path: string): void;
  createFile(path: string, content?: string): string;
  createFolder(path: string): string;
  deleteFile(path: string): void;
  getFileContent(path: string): string | null;
  updateFile(path: string, content: string): void;
  getFiles(): Record<string, FileData>;
  
  // Runtime operations
  runCommand(command: string): Promise<{ exitCode?: number; error?: string }>;
  runScript(file: string): Promise<{ exitCode?: number; error?: string }>;
  npmInstall(): Promise<number>;
  killProcess(): void;
  syncFiles(): Promise<void>;
  
  // Project operations
  loadProject(githubUrl: string): Promise<void>;
  exportProject(): Record<string, string>;
  importProject(files: Record<string, string>): void;
  
  // UI operations
  setTheme(theme: 'dark' | 'light'): void;
  toggleSidebar(): void;
  toggleTerminal(): void;
  
  // Terminal operations
  clearTerminal(): void;
  
  // State
  isReady: boolean;
  isRunning: boolean;
}
```

## 🔌 Hooks

SDK экспортирует отдельные hooks для кастомизации:

```jsx
import { useRuntime, useFileSystem, useGitHub } from '@mycompany/code-editor-sdk';

function CustomEditor() {
  const runtime = useRuntime();
  const fileSystem = useFileSystem();
  const github = useGitHub();
  
  // Используйте индивидуальные hooks
  await runtime.runCommand('npm start');
  fileSystem.createFile('app.js', 'console.log("Hello")');
  await github.loadProject('github.com/user/repo');
}
```

## 🎨 Компоненты

SDK экспортирует отдельные компоненты:

```jsx
import { 
  FileTree, 
  Editor, 
  Terminal, 
  Toolbar 
} from '@mycompany/code-editor-sdk';

// Создайте собственный layout
function CustomLayout() {
  return (
    <div className="flex">
      <FileTree />
      <div className="flex-1">
        <Toolbar />
        <Editor />
        <Terminal />
      </div>
    </div>
  );
}
```

## 🛠 Технологии

- **React** — UI framework
- **Monaco Editor** — Code editor
- **WebContainer API** — Node.js runtime в браузере
- **xterm.js** — Terminal emulator
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **Lucide React** — Icons

## ⚠️ Важно

WebContainer требует специальных HTTP заголовков для работы:

```javascript
// vite.config.js
export default {
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
}
```

## 📝 Лицензия

MIT
# js-practice-editor-2
