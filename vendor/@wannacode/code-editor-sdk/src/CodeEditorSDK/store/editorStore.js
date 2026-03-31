import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useEditorStore = create(
  subscribeWithSelector((set, get) => ({
    // File system state
    files: {},
    currentFile: null,
    expandedFolders: new Set(['']),
    
    // Editor state
    isLoading: false,
    loadingMessage: '',
    error: null,
    
    // Terminal state
    terminalOutput: [],
    isRunning: false,
    currentProcess: null,
    
    // WebContainer state
    webcontainer: null,
    isContainerReady: false,
    
    // Preview state
    previewUrl: null,
    
    // UI state
    theme: 'dark',
    showEditor: true,
    showPreview: true,
    showTerminal: true,
    showSidebar: true,
    
    // Actions - File System
    setFiles: (files) => set({ files }),
    
    addFile: (path, content = '') => set((state) => ({
      files: { ...state.files, [path]: { content, type: 'file' } }
    })),
    
    addFolder: (path) => set((state) => ({
      files: { ...state.files, [path]: { type: 'directory' } }
    })),
    
    updateFile: (path, content) => set((state) => {
      if (!state.files[path]) return state;
      return {
        files: {
          ...state.files,
          [path]: { ...state.files[path], content }
        }
      };
    }),
    
    deleteFile: (path) => set((state) => {
      const newFiles = { ...state.files };
      Object.keys(newFiles).forEach(key => {
        if (key === path || key.startsWith(path + '/')) {
          delete newFiles[key];
        }
      });
      return { 
        files: newFiles,
        currentFile: state.currentFile === path ? null : state.currentFile
      };
    }),
    
    renameFile: (oldPath, newPath) => set((state) => {
      const newFiles = { ...state.files };
      const content = newFiles[oldPath];
      delete newFiles[oldPath];
      newFiles[newPath] = content;
      
      Object.keys(state.files).forEach(key => {
        if (key.startsWith(oldPath + '/')) {
          const newKey = key.replace(oldPath, newPath);
          newFiles[newKey] = state.files[key];
          delete newFiles[key];
        }
      });
      
      return { 
        files: newFiles,
        currentFile: state.currentFile === oldPath ? newPath : state.currentFile
      };
    }),
    
    setCurrentFile: (path) => {
      const { files } = get();
      // Только устанавливаем если файл существует и это не директория
      if (files[path] && files[path].type === 'file') {
        set({ currentFile: path });
      }
    },
    
    toggleFolder: (path) => set((state) => {
      const expanded = new Set(state.expandedFolders);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      return { expandedFolders: expanded };
    }),
    
    expandFolder: (path) => set((state) => {
      const expanded = new Set(state.expandedFolders);
      expanded.add(path);
      return { expandedFolders: expanded };
    }),
    
    // Actions - Loading state
    setLoading: (isLoading, message = '') => set({ 
      isLoading, 
      loadingMessage: message 
    }),
    
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    
    // Actions - Terminal
    appendTerminalOutput: (output) => set((state) => ({
      terminalOutput: [...state.terminalOutput, output]
    })),
    
    clearTerminal: () => set({ terminalOutput: [] }),
    
    setRunning: (isRunning) => set({ isRunning }),
    setCurrentProcess: (process) => set({ currentProcess: process }),
    
    // Actions - WebContainer
    setWebcontainer: (webcontainer) => set({ webcontainer, isContainerReady: true }),
    setContainerReady: (ready) => set({ isContainerReady: ready }),
    
    // Actions - Preview
    setPreviewUrl: (url) => set({ previewUrl: url }),
    
    // Actions - UI
    setTheme: (theme) => set({ theme }),
    toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
    togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
    toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
    toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
    setShowEditor: (show) => set({ showEditor: show }),
    setShowPreview: (show) => set({ showPreview: show }),
    setShowTerminal: (show) => set({ showTerminal: show }),
    setShowSidebar: (show) => set({ showSidebar: show }),
    
    // Actions - Reset
    reset: () => set({
      files: {},
      currentFile: null,
      expandedFolders: new Set(['']),
      terminalOutput: [],
      isRunning: false,
      currentProcess: null,
      error: null,
      previewUrl: null,
    }),
    
    // Computed - Get file tree structure
    getFileTree: () => {
      const { files } = get();
      const tree = { name: '', path: '', children: [], type: 'directory' };
      
      Object.keys(files).sort().forEach(path => {
        const parts = path.split('/').filter(Boolean);
        let current = tree;
        
        parts.forEach((part, index) => {
          const currentPath = parts.slice(0, index + 1).join('/');
          let child = current.children.find(c => c.name === part);
          
          if (!child) {
            child = {
              name: part,
              path: currentPath,
              children: [],
              type: index === parts.length - 1 ? files[path].type : 'directory'
            };
            current.children.push(child);
          }
          current = child;
        });
      });
      
      const sortChildren = (node) => {
        node.children.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      };
      sortChildren(tree);
      
      return tree.children;
    },
    
    // Get file content safely
    getFileContent: (path) => {
      const { files } = get();
      const file = files[path];
      if (file && file.type === 'file') {
        return file.content ?? '';
      }
      return '';
    }
  }))
);

export default useEditorStore;
