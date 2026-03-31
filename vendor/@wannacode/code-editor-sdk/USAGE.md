# Использование CodeEditorSDK

## ✅ Да, это полноценный SDK!

Проект настроен как React SDK компонент, который можно встраивать в другие проекты.

## 📦 Установка

### Вариант 1: Локальная установка (для разработки)

```bash
# В директории SDK
npm link

# В вашем проекте
npm link @mycompany/code-editor-sdk
```

### Вариант 2: Через npm (если опубликован)

```bash
npm install @mycompany/code-editor-sdk
```

### Вариант 3: Через относительный путь (для монорепо)

```json
{
  "dependencies": {
    "@mycompany/code-editor-sdk": "file:../js-practice-editor-2"
  }
}
```

## 🚀 Использование

### Базовый пример (как вы используете)

```jsx
import { CodeEditorSDK } from '@mycompany/code-editor-sdk';
import { useRef } from 'react';

function MyComponent() {
  const editorRef = useRef();
  const githubUrl = 'https://github.com/user/repo';
  const startCommand = 'npm run dev';
  const height = 800;
  const openFile = 'src/index.js';

  return (
    <div className="absolute inset-0">
      <CodeEditorSDK
        ref={editorRef}
        githubUrl={githubUrl || undefined}
        onProjectLoaded={(files) => {
          console.log('Проект загружен:', files);
        }}
        onReady={() => {
          console.log('Редактор готов!');
        }}
        config={{
          theme: 'dark',
          height: `${height}px`,
          terminalHeight: '200px',
          sidebarWidth: 250,
          showSidebar: false,
          showTerminal: true,
          showPreview: true,
          showEditor: true,
          showBottomBar: true,
          showModeToggle: true,
          showSidebarToggle: true,
          showTerminalToggle: true,
          devMode: false,
          showRunButton: false,
          showInstallButton: false,
          showSyncButton: false,
          showGithubButton: false,
          allowFileCreation: true,
          allowFileDeletion: true,
          readOnly: false,
          defaultFile: openFile || undefined,
          startCommand: startCommand || undefined,
          autoInstall: false,
          autoRun: !!startCommand,
        }}
      />
    </div>
  );
}
```

## 📋 Все доступные пропсы

### Основные пропсы компонента

- `githubUrl` (string) - URL GitHub репозитория для загрузки
- `initialFiles` (object) - Объект с файлами `{ 'path/to/file.js': 'content' }`
- `onFileChange` (function) - Callback при изменении файла
- `onCommandRun` (function) - Callback при запуске команды
- `onProjectLoaded` (function) - Callback после загрузки проекта
- `onFileSelect` (function) - Callback при выборе файла
- `onReady` (function) - Callback когда редактор готов

### Config объект

```typescript
config: {
  // Файл по умолчанию
  defaultFile?: string;
  
  // Тема
  theme?: 'dark' | 'light';
  
  // Размеры
  height?: string;           // '100%', '800px', etc.
  terminalHeight?: string;    // '200px'
  sidebarWidth?: number;     // 250
  
  // Видимость панелей
  showSidebar?: boolean;
  showTerminal?: boolean;
  showPreview?: boolean;
  showEditor?: boolean;
  
  // Нижняя панель
  showBottomBar?: boolean;
  showModeToggle?: boolean;
  showSidebarToggle?: boolean;
  showTerminalToggle?: boolean;
  
  // Кнопки действий
  devMode?: boolean;          // Показывает все кнопки
  showRunButton?: boolean;
  showInstallButton?: boolean;
  showSyncButton?: boolean;
  showGithubButton?: boolean;
  
  // Разрешения
  allowFileCreation?: boolean;
  allowFileDeletion?: boolean;
  readOnly?: boolean;
  
  // Автоматизация
  startCommand?: string;     // Команда для запуска (например, 'npm run dev')
  autoInstall?: boolean;      // Автоматически запускать npm install
  autoRun?: boolean;          // Автоматически запускать startCommand
}
```

## 🎯 Imperative API (через ref)

```jsx
const editorRef = useRef();

// Открыть файл
editorRef.current?.openFile('src/index.js');

// Создать файл
editorRef.current?.createFile('src/new.js', 'console.log("hello");');

// Запустить команду
editorRef.current?.runCommand('npm install');

// Получить все файлы
const files = editorRef.current?.getFiles();

// Загрузить проект из GitHub
editorRef.current?.loadProject('https://github.com/user/repo');

// Экспортировать проект
const project = editorRef.current?.exportProject();
```

## ⚙️ Настройка для Next.js

Если используете Next.js, добавьте в `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mycompany/code-editor-sdk'],
  // Для Turbopack
  experimental: {
    turbo: {
      resolveExtensions: ['.jsx', '.js', '.tsx', '.ts', '.json']
    }
  }
};

module.exports = nextConfig;
```

## 🎨 Импорт стилей

Если нужно импортировать стили SDK:

```jsx
import '@mycompany/code-editor-sdk/styles';
// или
import '@mycompany/code-editor-sdk/src/index.css';
```

## ✅ Ваше использование полностью корректно!

Все пропсы, которые вы используете, поддерживаются:
- ✅ `githubUrl` - загрузка из GitHub
- ✅ `startCommand` - команда запуска
- ✅ `autoRun` - автоматический запуск
- ✅ `defaultFile` - файл по умолчанию
- ✅ Все остальные настройки


