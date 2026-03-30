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

// 执行上下文
const context = Object.freeze({
  console: customConsole,
  print, // 直接把 Python 风格 print 暴露出去
  dfd: window.dfd, // Danfo.js
  // 获取多维表格数据并转换为 Danfo.js 可读取的字典形式
  async getBitableData() {
    try {
      // 检查是否在飞书环境中
      if (!window.lark && !window.Base && !window['lark-base']) {
        throw new Error('未检测到飞书环境');
      }
      
      // 初始化 Base JS SDK
      const Base = window.Base || window['lark-base'];
      if (!Base) {
        throw new Error('Base JS SDK 初始化失败');
      }
      
      // 获取当前应用实例
      const app = await Base.app.current();
      if (!app) {
        throw new Error('获取应用实例失败');
      }
      
      // 获取当前表格
      const table = await app.table.current();
      if (!table) {
        throw new Error('获取表格失败');
      }
      
      // 获取所有记录
      const records = await table.records.all();
      if (!records || records.length === 0) {
        return {};
      }
      
      // 获取所有字段
      const fields = await table.fields.all();
      const fieldMap = {};
      fields.forEach(field => {
        fieldMap[field.id] = field.name;
      });
      
      // 转换为字典形式
      const data = {};
      // 初始化每个字段的数组
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
      
      return data;
    } catch (error) {
      console.error('获取多维表格数据失败:', error);
      throw error;
    }
  },
  // 使用 DataFrame 更新多维表格的指定字段
  async updateBitableData(df, fields) {
    try {
      // 检查是否在飞书环境中
      if (!window.lark && !window.Base && !window['lark-base']) {
        throw new Error('未检测到飞书环境');
      }
      
      // 检查 df 是否为 Danfo.js DataFrame
      if (!df || typeof df.toJSON !== 'function') {
        throw new Error('请传入 Danfo.js DataFrame');
      }
      
      // 初始化 Base JS SDK
      const Base = window.Base || window['lark-base'];
      if (!Base) {
        throw new Error('Base JS SDK 初始化失败');
      }
      
      // 获取当前应用实例
      const app = await Base.app.current();
      if (!app) {
        throw new Error('获取应用实例失败');
      }
      
      // 获取当前表格
      const table = await app.table.current();
      if (!table) {
        throw new Error('获取表格失败');
      }
      
      // 获取所有记录
      const records = await table.records.all();
      if (!records || records.length === 0) {
        throw new Error('表格中没有记录');
      }
      
      // 获取所有字段
      const tableFields = await table.fields.all();
      const fieldMap = {};
      tableFields.forEach(field => {
        fieldMap[field.name] = field.id;
      });
      
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
      return true;
    } catch (error) {
      console.error('更新多维表格数据失败:', error);
      throw error;
    }
  }
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