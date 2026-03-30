// 导入 @lark-base-open/js-sdk
import { bitable } from '../../vendor/@lark-base-open/js-sdk/dist/index.mjs';

// 全局暴露 bitable 对象
window.bitable = bitable;

// 全局变量
let editor;
let terminal;

// 初始化 Monaco Editor
function initMonacoEditor() {
  // 简化 Monaco Editor 初始化
  require(['vs/editor/editor.main'], function(monaco) {
    editor = monaco.editor.create(document.getElementById('editor'), {
      value: '',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 2,
      insertSpaces: true,
      // 启用水平滚动条
      horizontalScrolling: true,
      // 显示水平滚动条
      scrollbar: {
        horizontal: 'visible',
        vertical: 'visible'
      }
    });
  });
}

// 初始化 xterm.js 终端
function initTerminal() {
  // 检查 xterm.js 的导出方式
  if (window.xterm) {
    terminal = new window.xterm.Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#f48771',
        green: '#57ab5a',
        yellow: '#d69d85',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#d4d4d4',
        brightBlack: '#686868',
        brightRed: '#f48771',
        brightGreen: '#57ab5a',
        brightYellow: '#d69d85',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
      },
      fontSize: 14,
      lineHeight: 1.5,
      cursorBlink: true,
      scrollback: 1000
    });
  } else if (window.Terminal) {
    terminal = new window.Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#f48771',
        green: '#57ab5a',
        yellow: '#d69d85',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#d4d4d4',
        brightBlack: '#686868',
        brightRed: '#f48771',
        brightGreen: '#57ab5a',
        brightYellow: '#d69d85',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
      },
      fontSize: 14,
      lineHeight: 1.5,
      cursorBlink: true,
      scrollback: 1000
    });
  } else {
    // 如果 xterm.js 加载失败，使用简单的终端模拟
    terminal = {
      open: function(element) {
        this.element = element;
        // 添加占位符和内容容器
        this.element.innerHTML = `
          <div style="position: relative; height: 100%;">
            <div class="terminal-placeholder" style="position: absolute; top: 10px; left: 10px; color: #666; font-family: monospace; pointer-events: none;">
              程序输出将显示在这里
            </div>
            <div class="terminal-content" style="padding: 10px; height: 100%; overflow-y: auto; background: #1e1e1e; color: #d4d4d4; font-family: monospace; box-sizing: border-box;"></div>
          </div>
        `;
        this.content = this.element.querySelector('.terminal-content');
        this.placeholder = this.element.querySelector('.terminal-placeholder');
      },
      write: function(text) {
        if (this.content && this.placeholder) {
          // 隐藏占位符
          this.placeholder.style.display = 'none';
          // 替换 \r\n 和 \n 为 <br>，确保换行显示
          const formattedText = text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          this.content.innerHTML += formattedText;
          // 确保滚动到底部
          setTimeout(() => {
            this.content.scrollTop = this.content.scrollHeight;
          }, 0);
        }
      },
      clear: function() {
        if (this.content && this.placeholder) {
          this.content.innerHTML = '';
          // 显示占位符
          this.placeholder.style.display = 'block';
        }
      },
      selectAll: function() {
        if (this.content) {
          const range = document.createRange();
          range.selectNodeContents(this.content);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    };
  }
  
  // 为 xterm.js 添加占位符
  if (window.xterm || window.Terminal) {
    terminal.open(document.getElementById('terminal'));
    
    // 清除任何默认的欢迎文本
    terminal.clear();
    
    // 添加占位符元素
    const placeholder = document.createElement('div');
    placeholder.className = 'terminal-placeholder';
    placeholder.style.cssText = 'position: absolute; top: 10px; left: 10px; color: #666; font-family: monospace; pointer-events: none;';
    placeholder.textContent = '程序输出将显示在这里';
    
    // 插入占位符到终端容器
    const terminalElement = document.getElementById('terminal');
    terminalElement.style.position = 'relative';
    terminalElement.appendChild(placeholder);
    
    // 重写 write 方法，隐藏占位符并自动滚动到底部
    const originalWrite = terminal.write.bind(terminal);
    terminal.write = function(text) {
      placeholder.style.display = 'none';
      originalWrite(text);
      // 自动滚动到底部
      terminal.scrollToBottom();
    };
    
    // 重写 clear 方法，显示占位符
    const originalClear = terminal.clear.bind(terminal);
    terminal.clear = function() {
      originalClear();
      placeholder.style.display = 'block';
    };
  } else {
    // 对于模拟终端，直接打开
    terminal.open(document.getElementById('terminal'));
  }
}

// 初始化可拖动分隔条
function initResizer() {
  const resizer = document.getElementById('resizer');
  const editorContainer = document.querySelector('.editor-container');
  const terminalContainer = document.querySelector('.terminal-container');
  const container = document.querySelector('.container');
  
  let isResizing = false;
  let startY = 0;
  let startEditorHeight = 0;
  
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startEditorHeight = editorContainer.offsetHeight;
    document.body.style.cursor = 'row-resize';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newEditorHeight = startEditorHeight + deltaY;
    const containerHeight = container.offsetHeight;
    
    // 确保最小高度
    if (newEditorHeight >= 100 && containerHeight - newEditorHeight >= 100) {
      const editorFlex = newEditorHeight / containerHeight;
      const terminalFlex = (containerHeight - newEditorHeight) / containerHeight;
      
      editorContainer.style.flex = editorFlex;
      terminalContainer.style.flex = terminalFlex;
    }
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
  });
}

// 往终端输出内容，模拟 Python 的 print 函数
function print(...args) {
  // 处理关键字参数
  let sep = ' ';
  let end = '\r\n';
  let file = null;
  let flush = false;
  
  // 检查最后一个参数是否为对象（可能包含关键字参数）
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'object' && lastArg !== null && !Array.isArray(lastArg)) {
      if (lastArg.sep !== undefined) sep = lastArg.sep;
      if (lastArg.end !== undefined) end = lastArg.end;
      if (lastArg.file !== undefined) file = lastArg.file;
      if (lastArg.flush !== undefined) flush = lastArg.flush;
      // 移除关键字参数对象
      args.pop();
    }
  }
  
  // 转换并连接参数
  const str = args.map(item => {
    if (typeof item === 'object' && item !== null) {
      try {
        return JSON.stringify(item, null, 2);
      } catch (e) {
        return String(item);
      }
    }
    return String(item);
  }).join(sep);

  // 输出到指定文件或默认终端
  if (file && typeof file.write === 'function') {
    file.write(str + end);
    if (flush && typeof file.flush === 'function') {
      file.flush();
    }
  } else {
    terminal.write(str + end);
  }
}

// 自定义 console，也输出到终端
const customConsole = {
  log: (...args) => print(...args),
  warn: (...args) => print('[WARN]', ...args),
  error: (...args) => print('[ERROR]', ...args),
};

// 调试：输出所有可能的飞书相关全局对象
function debugFeishuEnv() {
  console.log('飞书环境检测:', {
    lark: !!window.lark,
    Base: !!window.Base,
    'lark-base': !!window['lark-base'],
    app: !!window.app,
    $app: !!window.$app,
    larkin: !!window.larkin,
    Bitable: !!window.Bitable,
    bitable: !!window.bitable,
    __LARK__: !!window.__LARK__,
    FEISHU: !!window.FEISHU,
    feishu: !!window.feishu,
    windowKeys: Object.keys(window).filter(key => ['lark', 'Base', 'app', 'Bitable', 'bitable'].some(prefix => key.toLowerCase().includes(prefix)))
  });
}



// 根据表格名称获取表格实例
async function getTable(tableName) {
  try {
    // 首先输出调试信息
    debugFeishuEnv();
    
    // 尝试使用导入的 bitable 对象
    console.log('尝试使用导入的 bitable 对象获取表格');
    try {
      if (bitable) {
        console.log('bitable 对象已加载');
        
        // 获取表格元数据列表和当前选择
        const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]);
        console.log('获取表格列表成功:', tableList && tableList.length);
        console.log('获取当前选择成功:', !!selection);
        
        if (tableList && tableList.length > 0) {
          let targetTable;
          if (tableName) {
            // 查找名称匹配的表格
            targetTable = tableList.find(table => table.name === tableName);
          } else {
            // 如果没有提供表格名称，使用当前选择的表格或第一个表格
            targetTable = tableList.find(table => table.id === selection.tableId) || tableList[0];
          }
          
          if (targetTable) {
            console.log('找到表格:', targetTable.name, 'ID:', targetTable.id);
            
            // 根据表格ID获取表格实例
            const table = await bitable.base.getTableById(targetTable.id);
            console.log('获取表格实例成功:', !!table);
            return table;
          } else {
            console.error('未找到名称为', tableName, '的表格');
            throw new Error(`未找到名称为 ${tableName} 的表格`);
          }
        }
      } else {
        console.log('bitable 对象未加载');
      }
    } catch (e) {
      console.error('使用 bitable 对象失败:', e);
      throw e;
    }
    
    // 尝试使用 window.BaseOpen（兼容旧版本）
    console.log('尝试使用 window.BaseOpen 获取表格');
    try {
      if (window.BaseOpen) {
        console.log('window.BaseOpen 已加载');
        
        // 初始化 SDK
        const base = new window.BaseOpen();
        console.log('BaseOpen 实例创建成功');
        
        // 获取当前应用
        const app = await base.app.current();
        console.log('获取应用实例成功:', !!app);
        
        if (tableName) {
          // 获取所有表格
          const tables = await app.tables.all();
          console.log('获取表格列表成功:', tables && tables.length);
          
          if (tables && tables.length > 0) {
            // 查找名称匹配的表格
            const targetTable = tables.find(table => table.name === tableName);
            if (targetTable) {
              console.log('找到表格:', targetTable.name);
              return targetTable;
            } else {
              console.error('未找到名称为', tableName, '的表格');
              throw new Error(`未找到名称为 ${tableName} 的表格`);
            }
          }
        } else {
          // 如果没有提供表格名称，使用当前表格
          const table = await app.table.current();
          console.log('获取当前表格成功:', !!table);
          if (table) {
            return table;
          }
        }
      } else {
        console.log('window.BaseOpen 未加载');
      }
    } catch (e) {
      console.error('使用 window.BaseOpen 失败:', e);
      throw e;
    }
    
    // 尝试直接使用 top 窗口的对象
    console.log('尝试访问 top 窗口获取表格');
    try {
      if (window.top && window.top !== window) {
        console.log('top 窗口存在');
        
        // 尝试从 top 窗口获取飞书相关对象
        const topBase = window.top.Base || window.top['lark-base'];
        const topBaseOpen = window.top.BaseOpen;
        
        console.log('top 窗口对象:', {
          Base: !!topBase,
          BaseOpen: !!topBaseOpen
        });
        
        // 尝试使用 top 窗口的 BaseOpen
        if (topBaseOpen) {
          console.log('使用 top.BaseOpen');
          try {
            const base = new topBaseOpen();
            console.log('BaseOpen 实例创建成功');
            
            // 获取当前应用
            const app = await base.app.current();
            console.log('获取应用实例成功:', !!app);
            
            if (tableName) {
              // 获取所有表格
              const tables = await app.tables.all();
              console.log('获取表格列表成功:', tables && tables.length);
              
              if (tables && tables.length > 0) {
                // 查找名称匹配的表格
                const targetTable = tables.find(table => table.name === tableName);
                if (targetTable) {
                  console.log('找到表格:', targetTable.name);
                  return targetTable;
                } else {
                  console.error('未找到名称为', tableName, '的表格');
                  throw new Error(`未找到名称为 ${tableName} 的表格`);
                }
              }
            } else {
              // 如果没有提供表格名称，使用当前表格
              const table = await app.table.current();
              console.log('获取当前表格成功:', !!table);
              if (table) {
                return table;
              }
            }
          } catch (e) {
            console.error('使用 top.BaseOpen 失败:', e);
          }
        }
        
        // 尝试使用 top 窗口的 Base
        if (topBase) {
          console.log('使用 top.Base');
          try {
            const app = await topBase.app.current();
            console.log('获取应用实例成功:', !!app);
            
            if (app) {
              if (tableName) {
                // 获取所有表格
                let tables;
                if (app.tables && app.tables.all) {
                  tables = await app.tables.all();
                  console.log('获取表格列表成功:', tables && tables.length);
                }
                
                if (tables && tables.length > 0) {
                  // 查找名称匹配的表格
                  const targetTable = tables.find(table => table.name === tableName);
                  if (targetTable) {
                    console.log('找到表格:', targetTable.name);
                    return targetTable;
                  } else {
                    console.error('未找到名称为', tableName, '的表格');
                    throw new Error(`未找到名称为 ${tableName} 的表格`);
                  }
                }
              } else {
                // 如果没有提供表格名称，使用当前表格
                let table;
                if (app.table && app.table.current) {
                  table = await app.table.current();
                  console.log('获取当前表格成功:', !!table);
                } else if (app.getActiveTable) {
                  table = await app.getActiveTable();
                  console.log('获取当前表格成功:', !!table);
                }
                if (table) {
                  return table;
                }
              }
            }
          } catch (e) {
            console.error('使用 top.Base 失败:', e);
          }
        }
      }
    } catch (e) {
      console.error('访问 top 窗口失败:', e);
    }
    
    // 如果所有方法都失败，抛出错误
    throw new Error('未检测到飞书环境或无法获取表格');
  } catch (error) {
    console.error('获取表格失败:', error);
    throw error;
  }
}

// 将表格实例转换为字典对象（可用于Danfo.js初始化DataFrame）
async function table2dict(table) {
  try {
    if (!table) {
      throw new Error('请传入表格实例');
    }
    
    console.log('开始将表格转换为字典');
    
    // 获取所有记录
    const records = await table.records.all();
    console.log('获取记录成功:', records && records.length);
    
    // 获取所有字段
    const fields = await table.fields.all();
    console.log('获取字段成功:', fields && fields.length);
    
    if (records && records.length > 0 && fields) {
      const fieldMap = {};
      fields.forEach(field => {
        fieldMap[field.id] = field.name;
      });
      console.log('字段映射:', fieldMap);
      
      // 转换为字典形式
      const data = {};
      Object.values(fieldMap).forEach(fieldName => {
        data[fieldName] = [];
      });
      
      // 填充数据
      records.forEach(record => {
        Object.entries(record.values).forEach(([fieldId, value]) => {
          const fieldName = fieldMap[fieldId];
          if (fieldName) {
            data[fieldName].push(value !== undefined ? value : null);
          }
        });
      });
      
      console.log('转换后的数据:', data);
      return data;
    } else {
      console.log('表格无数据或字段');
      return {};
    }
  } catch (error) {
    console.error('转换表格为字典失败:', error);
    throw error;
  }
}

// 使用 DataFrame 更新指定表格的指定字段
async function setTable(table, df, fields) {
  try {
    // 检查 df 是否为 Danfo.js DataFrame
    if (!df || typeof df.toJSON !== 'function') {
      throw new Error('请传入 Danfo.js DataFrame');
    }
    
    // 检查表格实例
    if (!table) {
      throw new Error('请传入表格实例');
    }
    
    // 首先输出调试信息
    debugFeishuEnv();
    
    console.log('开始更新表格数据');
    
    // 获取所有记录
    const records = await table.records.all();
    console.log('获取记录成功:', records && records.length);
    
    // 获取所有字段
    const tableFields = await table.fields.all();
    console.log('获取字段成功:', tableFields && tableFields.length);
    
    if (records && records.length > 0 && tableFields) {
      const fieldMap = {};
      tableFields.forEach(field => {
        fieldMap[field.name] = field.id;
      });
      console.log('字段映射:', fieldMap);
      
      // 转换 DataFrame 为 JSON
      const dfJson = df.toJSON();
      
      // 确定要更新的字段
      const fieldsToUpdate = fields || Object.keys(dfJson);
      
      // 验证字段是否存在
      fieldsToUpdate.forEach(fieldName => {
        if (!fieldMap[fieldName]) {
          throw new Error(`字段 ${fieldName} 在表格中不存在`);
        }
      });
      
      // 准备更新数据
      const updatePromises = [];
      records.forEach((record, index) => {
        if (index < df.shape[0]) {
          const updates = {};
          fieldsToUpdate.forEach(fieldName => {
            const fieldId = fieldMap[fieldName];
            if (fieldId) {
              updates[fieldId] = dfJson[fieldName][index];
            }
          });
          if (Object.keys(updates).length > 0) {
            updatePromises.push(record.update(updates));
          }
        }
      });
      
      // 执行更新
      await Promise.all(updatePromises);
      console.log('更新成功');
      return true;
    } else {
      console.log('表格无数据或字段');
      return false;
    }
  } catch (error) {
    console.error('更新表格数据失败:', error);
    return false;
  }
}

// 执行上下文
const context = Object.freeze({
  console: customConsole,
  print, // 直接把 Python 风格 print 暴露出去
  dfd: window.dfd, // Danfo.js
  debugFeishuEnv,
  getTable,
  table2dict,
  setTable
});

// 增强错误处理，提取行号
function getErrorLineNumber(error, code) {
  const match = error.stack.match(/<anonymous>:([0-9]+):[0-9]+/);
  if (match) {
    return parseInt(match[1]) - 1; // 调整行号
  }
  return null;
}

// 运行代码
async function runCode() {
  terminal.write('\n🚀 正在执行代码...\r\n');
  
  require(['vs/editor/editor.main'], async function(monaco) {
    const code = editor.getValue().trim();
    if (!code) {
      terminal.write('❌ 代码为空，请输入代码\r\n');
      return;
    }

    try {
      const fn = new Function(
        ...Object.keys(context),
        `return (async () => { ${code} })();`
      );
      await fn(...Object.values(context));
      terminal.write('✅ 代码执行完成\r\n');

    } catch (err) {
      const lineNumber = getErrorLineNumber(err, code);
      if (lineNumber !== null) {
        terminal.write(`❌ 异常 (第 ${lineNumber} 行)：${err.message}\r\n`);
      } else {
        terminal.write(`❌ 异常：${err.message}\r\n`);
      }
      terminal.write(`堆栈信息：${err.stack}\r\n`);
    }
  });
}

// 清空终端
function clearTerminal() {
  terminal.clear();

}

// 复制终端内容
function copyTerminalContent() {
  if (terminal.selectAll) {
    terminal.selectAll();
    document.execCommand('copy');
    terminal.write('✅ 终端内容已复制到剪贴板\r\n');
  } else {
    terminal.write('❌ 复制功能不可用\r\n');
  }
}

// 初始化应用
function initApp() {
  // 初始化 Monaco Editor
  initMonacoEditor();
  
  // 初始化终端
  initTerminal();
  
  // 初始化可拖动分隔条
  initResizer();

  // 绑定事件
  document.getElementById('editor-run').addEventListener('click', runCode);
  document.getElementById('terminal-clear').addEventListener('click', clearTerminal);
  document.getElementById('terminal-copy').addEventListener('click', copyTerminalContent);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}