import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Edit2
} from 'lucide-react';
import useEditorStore from '../store/editorStore';
import { validateFileName } from '../utils/fileSystem';

/**
 * Элемент дерева файлов
 */
function FileTreeItem({ 
  item, 
  level = 0, 
  onContextMenu,
  allowFileCreation,
  allowFileDeletion 
}) {
  const currentFile = useEditorStore((state) => state.currentFile);
  const expandedFolders = useEditorStore((state) => state.expandedFolders);
  const toggleFolder = useEditorStore((state) => state.toggleFolder);
  
  const isFolder = item.type === 'directory';
  const isExpanded = expandedFolders.has(item.path);
  const isActive = currentFile === item.path;
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    
    if (isFolder) {
      toggleFolder(item.path);
    } else {
      // Напрямую устанавливаем currentFile через store
      useEditorStore.setState({ currentFile: item.path });
    }
  }, [isFolder, item.path, toggleFolder]);
  
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, item);
  }, [item, onContextMenu]);
  
  const paddingLeft = 12 + level * 16;
  
  return (
    <>
      <div
        className={`file-tree-item flex items-center gap-2 py-1.5 px-2 cursor-pointer select-none ${
          isActive ? 'active' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse arrow for folders */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center text-[#8b949e]">
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        
        {/* Icon */}
        <span className="flex-shrink-0">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-[#58a6ff]" />
            ) : (
              <Folder size={16} className="text-[#58a6ff]" />
            )
          ) : (
            <File size={16} className="text-[#8b949e]" />
          )}
        </span>
        
        {/* Name */}
        <span className="text-sm truncate">{item.name}</span>
      </div>
      
      {/* Children */}
      {isFolder && isExpanded && item.children && (
        <div className="animate-slide-in">
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onContextMenu={onContextMenu}
              allowFileCreation={allowFileCreation}
              allowFileDeletion={allowFileDeletion}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Форма создания нового файла/папки
 */
function NewItemForm({ type, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateFileName(name);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    onSubmit(name);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-2 border-b border-[#30363d]">
      <div className="flex items-center gap-2">
        {type === 'folder' ? (
          <Folder size={16} className="text-[#58a6ff]" />
        ) : (
          <File size={16} className="text-[#8b949e]" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={onCancel}
          placeholder={type === 'folder' ? 'Folder name' : 'File name'}
          className="input flex-1 text-sm py-1"
        />
      </div>
      {error && (
        <p className="text-xs text-[#f85149] mt-1 ml-6">{error}</p>
      )}
    </form>
  );
}

/**
 * Контекстное меню
 */
function ContextMenu({ x, y, item, onClose, onAction }) {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  const isFolder = item.type === 'directory';
  
  return (
    <div
      ref={menuRef}
      className="context-menu animate-fade-in"
      style={{ left: x, top: y }}
    >
      {isFolder && (
        <>
          <div 
            className="context-menu-item"
            onClick={() => onAction('newFile', item)}
          >
            <Plus size={14} />
            <span>Новый файл</span>
          </div>
          <div 
            className="context-menu-item"
            onClick={() => onAction('newFolder', item)}
          >
            <FolderPlus size={14} />
            <span>Новая папка</span>
          </div>
          <div className="context-menu-separator" />
        </>
      )}
      <div 
        className="context-menu-item"
        onClick={() => onAction('rename', item)}
      >
        <Edit2 size={14} />
        <span>Переименовать</span>
      </div>
      <div 
        className="context-menu-item danger"
        onClick={() => onAction('delete', item)}
      >
        <Trash2 size={14} />
        <span>Удалить</span>
      </div>
    </div>
  );
}

/**
 * Компонент дерева файлов
 */
export default function FileTree({ 
  allowFileCreation = true, 
  allowFileDeletion = true,
  onFileCreate,
  onFileDelete
}) {
  const getFileTree = useEditorStore((state) => state.getFileTree);
  const addFile = useEditorStore((state) => state.addFile);
  const addFolder = useEditorStore((state) => state.addFolder);
  const deleteFile = useEditorStore((state) => state.deleteFile);
  const expandFolder = useEditorStore((state) => state.expandFolder);
  
  const [contextMenu, setContextMenu] = useState(null);
  const [newItem, setNewItem] = useState(null);
  
  const fileTree = getFileTree();
  
  const handleContextMenu = useCallback((e, item) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  }, []);
  
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  const handleContextAction = useCallback((action, item) => {
    handleCloseContextMenu();
    
    switch (action) {
      case 'newFile':
        setNewItem({ parentPath: item.path, type: 'file' });
        expandFolder(item.path);
        break;
      case 'newFolder':
        setNewItem({ parentPath: item.path, type: 'folder' });
        expandFolder(item.path);
        break;
      case 'rename':
        break;
      case 'delete':
        if (allowFileDeletion) {
          deleteFile(item.path);
          onFileDelete?.(item.path);
        }
        break;
    }
  }, [allowFileDeletion, deleteFile, expandFolder, onFileDelete, handleCloseContextMenu]);
  
  const handleNewItemSubmit = useCallback((name) => {
    if (!newItem) return;
    
    const path = newItem.parentPath && newItem.parentPath !== '' 
      ? `${newItem.parentPath}/${name}` 
      : name;
    
    if (newItem.type === 'folder') {
      addFolder(path);
    } else {
      addFile(path, '');
      onFileCreate?.(path, '');
    }
    
    setNewItem(null);
  }, [newItem, addFile, addFolder, onFileCreate]);
  
  const handleNewItemCancel = useCallback(() => {
    setNewItem(null);
  }, []);
  
  const handleRootContextMenu = useCallback((e) => {
    e.preventDefault();
    handleContextMenu(e, { path: '', type: 'directory', name: 'root' });
  }, [handleContextMenu]);
  
  return (
    <div 
      className="h-full bg-[#010409] text-[#e6edf3] overflow-auto"
      onContextMenu={handleRootContextMenu}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
        <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide">
          Файлы
        </span>
        {allowFileCreation && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNewItem({ parentPath: '', type: 'file' })}
              className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Новый файл"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setNewItem({ parentPath: '', type: 'folder' })}
              className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Новая папка"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>
      
      {/* New item form at root level */}
      {newItem && newItem.parentPath === '' && (
        <NewItemForm
          type={newItem.type}
          onSubmit={handleNewItemSubmit}
          onCancel={handleNewItemCancel}
        />
      )}
      
      {/* File tree */}
      <div className="py-1">
        {fileTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#8b949e] text-sm">
            <p>Файлы не загружены</p>
          </div>
        ) : (
          fileTree.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              level={0}
              onContextMenu={handleContextMenu}
              allowFileCreation={allowFileCreation}
              allowFileDeletion={allowFileDeletion}
            />
          ))
        )}
      </div>
      
      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={handleCloseContextMenu}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}
