// 导入 @wannacode/code-editor-sdk
import { CodeEditorSDK } from '../../vendor/@wannacode/code-editor-sdk/src/CodeEditorSDK/index.js';

// 全局变量
let fileTree;
let editor;
let terminal;
let customConsole;

// 自定义控制台
class CustomConsole {
  constructor(terminal) {
    this.terminal = terminal;
  }
  
  log(...args) {
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');
    this.terminal.write(`[LOG] ${message}\n`);
  }
  
  error(...args) {
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');
    this.terminal.write(`[ERROR] ${message}\n`);
  }
  
  warn(...args) {
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');
    this.terminal.write(`[WARN] ${message}\n`);
  }
  
  info(...args) {
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');
    this.terminal.write(`[INFO] ${message}\n`);
  }
}

// Python 风格的 print 函数
function print(...args) {
  const message = args.map(arg => {
    try {
      return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
    } catch (e) {
      return String(arg);
    }
  }).join(' ');
  terminal.write(`${message}\n`);
}

// 调试飞书环境
function debugFeishuEnv() {
  console.log('飞书环境调试信息:');
  console.log('window.Base:', !!window.Base);
  console.log('window.BaseOpen:', !!window.BaseOpen);
  console.log('window.lark-base:', !!window['lark-base']);
  console.log('window.top:', !!window.top);
  if (window.top && window.top !== window) {
    console.log('window.top.Base:', !!window.top.Base);
    console.log('window.top.BaseOpen:', !!window.top.BaseOpen);
    console.log('window.top.lark-base:', !!window.top['lark-base']);
  }
}

// 根据表格名称获取表格实例
async function getTable(tableName) {
  try {
    console.log('开始获取表格实例');
    
    // 调试飞书环境
    debugFeishuEnv();
    
    // 尝试使用 window.BaseOpen
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
}

// 将表格实例转换为字典对象（可用于Danfo.js初始化DataFrame）
async function table2dict(table) {
  try {
    if (!table) {
      console.error('请传入表格实例');
      return {};
    }
    
    console.log('开始将表格转换为字典');
    console.log('表格实例类型:', typeof table);
    console.log('表格实例属性:', Object.keys(table));
    
    // 尝试获取所有记录
    let records;
    try {
      console.log('检查 table.records:', table.records);
      if (table.records && typeof table.records === 'object' && table.records.all && typeof table.records.all === 'function') {
        console.log('尝试使用 table.records.all()');
        records = await table.records.all();
        console.log('获取记录成功:', records && records.length);
      } else if (table.getRecords && typeof table.getRecords === 'function') {
        console.log('尝试使用 table.getRecords()');
        records = await table.getRecords();
        console.log('获取记录成功 (getRecords):', records && records.length);
      } else if (table.query && typeof table.query === 'function') {
        console.log('尝试使用 table.query()');
        records = await table.query();
        console.log('获取记录成功 (query):', records && records.length);
      } else {
        console.log('表格实例没有 records.all、getRecords 或 query 方法');
        return {};
      }
    } catch (e) {
      console.error('获取记录失败:', e);
      console.error('获取记录错误堆栈:', e.stack);
      return {};
    }
    
    // 尝试获取所有字段
    let fields;
    try {
      console.log('检查 table.fields:', table.fields);
      if (table.fields && typeof table.fields === 'object' && table.fields.all && typeof table.fields.all === 'function') {
        console.log('尝试使用 table.fields.all()');
        fields = await table.fields.all();
        console.log('获取字段成功:', fields && fields.length);
      } else if (table.getFields && typeof table.getFields === 'function') {
        console.log('尝试使用 table.getFields()');
        fields = await table.getFields();
        console.log('获取字段成功 (getFields):', fields && fields.length);
      } else if (table.getFieldList && typeof table.getFieldList === 'function') {
        console.log('尝试使用 table.getFieldList()');
        fields = await table.getFieldList();
        console.log('获取字段成功 (getFieldList):', fields && fields.length);
      } else {
        console.log('表格实例没有 fields.all、getFields 或 getFieldList 方法');
        return {};
      }
    } catch (e) {
      console.error('获取字段失败:', e);
      console.error('获取字段错误堆栈:', e.stack);
      return {};
    }
    
    if (records && records.length > 0 && fields) {
      const fieldMap = {};
      fields.forEach(field => {
        // 尝试不同的字段名称属性
        const fieldName = field.name || field.title || field.fieldName || `字段${field.id}`;
        fieldMap[field.id] = fieldName;
      });
      console.log('字段映射:', fieldMap);
      
      // 转换为字典形式
      const data = {};
      Object.values(fieldMap).forEach(fieldName => {
        data[fieldName] = [];
      });
      
      // 填充数据
      records.forEach((record, index) => {
        console.log(`处理记录 ${index}:`);
        console.log('记录类型:', typeof record);
        console.log('记录属性:', Object.keys(record));
        
        if (record.values) {
          Object.entries(record.values).forEach(([fieldId, value]) => {
            const fieldName = fieldMap[fieldId];
            if (fieldName) {
              data[fieldName].push(value !== undefined ? value : null);
            }
          });
        } else if (record.fields) {
          Object.entries(record.fields).forEach(([fieldId, value]) => {
            const fieldName = fieldMap[fieldId];
            if (fieldName) {
              data[fieldName].push(value !== undefined ? value : null);
            }
          });
        } else {
          console.log('记录没有 values 或 fields 属性');
        }
      });
      
      console.log('转换后的数据:', data);
      return data;
    } else {
      console.log('表格无数据或字段');
      return {};
    }
  } catch (error) {
    console.error('转换表格为字典失败:', error);
    console.error('错误堆栈:', error.stack);
    return {};
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
    let records;
    try {
      if (table.records && table.records.all) {
        records = await table.records.all();
      } else if (table.getRecords) {
        records = await table.getRecords();
      } else {
        throw new Error('表格实例没有获取记录的方法');
      }
      console.log('获取记录成功:', records && records.length);
    } catch (e) {
      console.error('获取记录失败:', e);
      throw e;
    }
    
    // 获取所有字段
    let tableFields;
    try {
      if (table.fields && table.fields.all) {
        tableFields = await table.fields.all();
      } else if (table.getFields) {
        tableFields = await table.getFields();
      } else {
        throw new Error('表格实例没有获取字段的方法');
      }
      console.log('获取字段成功:', tableFields && tableFields.length);
    } catch (e) {
      console.error('获取字段失败:', e);
      throw e;
    }
    
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
      
      // 遍历记录并更新
      records.forEach((record, index) => {
        // 检查是否有对应的数据行
        if (dfJson[fieldsToUpdate[0]] && dfJson[fieldsToUpdate[0]][index] !== undefined) {
          const updateData = {};
          
          // 填充要更新的字段数据
          fieldsToUpdate.forEach(fieldName => {
            const fieldId = fieldMap[fieldName];
            if (fieldId && dfJson[fieldName] && dfJson[fieldName][index] !== undefined) {
              updateData[fieldId] = dfJson[fieldName][index];
            }
          });
          
          // 如果有数据要更新
          if (Object.keys(updateData).length > 0) {
            console.log(`更新记录 ${index}:`, updateData);
            if (record.update) {
              updatePromises.push(record.update(updateData));
            } else {
              console.error('记录没有 update 方法');
            }
          }
        }
      });
      
      // 执行更新
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log('更新完成:', updatePromises.length, '条记录');
        return true;
      } else {
        console.log('没有记录需要更新');
        return false;
      }
    } else {
      console.log('表格无数据或字段');
      return false;
    }
  } catch (error) {
    console.error('更新表格失败:', error);
    throw error;
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

// 运行代码
async function runCode() {
  terminal.write('\n🚀 正在执行代码...\n');
  
  const code = editor.getValue().trim();
  if (!code) {
    terminal.write('❌ 代码为空，请输入代码\n');
    return;
  }

  try {
    // 使用浏览器的原生 JS 引擎执行代码
    const fn = new Function(
      ...Object.keys(context),
      `return (async () => { ${code} })();`
    );
    await fn(...Object.values(context));
    terminal.write('✅ 代码执行完成\n');

  } catch (err) {
    const lineNumber = getErrorLineNumber(err, code);
    if (lineNumber !== null) {
      terminal.write(`❌ 异常 (第 ${lineNumber} 行)：${err.message}\n`);
    } else {
      terminal.write(`❌ 异常：${err.message}\n`);
    }
    terminal.write(`堆栈信息：${err.stack}\n`);
  }
}

// 从错误信息中提取行号
function getErrorLineNumber(err, code) {
  const match = err.stack.match(/eval at .*?:(\d+):\d+/);
  if (match) {
    const evalLine = parseInt(match[1]);
    // 调整行号，因为我们在代码外面包了一层 async 函数
    return evalLine - 3;
  }
  return null;
}

// 复制终端内容
function copyTerminalContent() {
  const terminalElement = document.getElementById('terminal');
  const text = terminalElement.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    terminal.write('✅ 终端内容已复制到剪贴板\n');
  }).catch(err => {
    terminal.write(`❌ 复制失败: ${err.message}\n`);
  });
}

// 清空终端
function clearTerminal() {
  terminal.clear();
  terminal.write('🚀 多维表格 JS 引擎已启动\n');
  terminal.write('📝 请在编辑器中编写 JavaScript 代码\n');
  terminal.write('▶️  点击运行按钮执行代码\n\n');
}

// 初始化文件树
function initFileTree() {
  // 模拟文件树数据
  const fileTreeData = [
    {
      name: 'src',
      type: 'directory',
      children: [
        {
          name: 'js',
          type: 'directory',
          children: [
            {
              name: 'main.js',
              type: 'file',
              path: 'src/js/main.js'
            }
          ]
        }
      ]
    },
    {
      name: 'vendor',
      type: 'directory',
      children: [
        {
          name: '@lark-base-open',
          type: 'directory',
          children: [
            {
              name: 'js-sdk',
              type: 'directory',
              children: [
                {
                  name: 'dist',
                  type: 'directory',
                  children: [
                    {
                      name: 'index.js',
                      type: 'file',
                      path: 'vendor/@lark-base-open/js-sdk/dist/index.js'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'danfojs',
          type: 'directory',
          children: [
            {
              name: 'lib',
              type: 'directory',
              children: [
                {
                  name: 'bundle.js',
                  type: 'file',
                  path: 'vendor/danfojs/lib/bundle.js'
                }
              ]
            }
          ]
        },
        {
          name: 'monaco-editor',
          type: 'directory',
          children: [
            {
              name: 'dev',
              type: 'directory',
              children: [
                {
                  name: 'vs',
                  type: 'directory',
                  children: [
                    {
                      name: 'editor',
                      type: 'directory',
                      children: [
                        {
                          name: 'editor.main.js',
                          type: 'file',
                          path: 'vendor/monaco-editor/dev/vs/editor/editor.main.js'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'index.html',
      type: 'file',
      path: 'index.html'
    },
    {
      name: 'package.json',
      type: 'file',
      path: 'package.json'
    },
    {
      name: 'test.js',
      type: 'file',
      path: 'test.js'
    }
  ];

  // 渲染文件树
  const fileTreeElement = document.getElementById('file-tree');
  fileTreeElement.innerHTML = renderFileTree(fileTreeData);

  // 绑定文件树点击事件
  fileTreeElement.addEventListener('click', (e) => {
    const fileElement = e.target.closest('.file-item');
    if (fileElement) {
      const path = fileElement.dataset.path;
      if (path) {
        openFile(path);
      }
    }
  });
}

// 渲染文件树
function renderFileTree(data, level = 0) {
  let html = '<ul style="list-style: none; padding-left: ' + (level * 20) + 'px;">';
  data.forEach(item => {
    if (item.type === 'directory') {
      html += `<li class="directory-item" style="margin: 4px 0;">
                <span style="cursor: pointer; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">📁</span>
                  ${item.name}
                </span>
                ${renderFileTree(item.children || [], level + 1)}
              </li>`;
    } else {
      html += `<li class="file-item" data-path="${item.path}" style="margin: 4px 0; cursor: pointer; display: flex; align-items: center;">
                <span style="margin-right: 8px;">📄</span>
                ${item.name}
              </li>`;
    }
  });
  html += '</ul>';
  return html;
}

// 打开文件
function openFile(path) {
  // 这里可以根据路径加载文件内容
  // 目前我们只是模拟打开文件
  terminal.write(`📂 打开文件: ${path}\n`);
  
  // 设置编辑器内容
  if (path === 'test.js') {
    editor.setValue('// 测试代码 - 可以直接复制到代码编辑器中执行\nasync function testNewFunctions() {\n  try {\n    // 测试 getTable 函数\n    console.log(\'测试 getTable 函数...\');\n    const table = await getTable();\n    console.log(\'获取表格成功:\', !!table);\n    \n    // 输出表格的基本信息，而不是整个表格实例\n    console.log(\'表格名称:\', table.name);\n    console.log(\'表格ID:\', table.id);\n    \n    // 测试 table2dict 函数\n    console.log(\'\n测试 table2dict 函数...\');\n    const data = await table2dict(table);\n    console.log(\'转换为字典成功:\', Object.keys(data).length > 0);\n    console.log(\'数据:\', data);\n    \n    // 测试 setTable 函数\n    console.log(\'\n测试 setTable 函数...\');\n    if (data && Object.keys(data).length > 0) {\n      // 创建一个简单的 DataFrame\n      const df = new dfd.DataFrame(data);\n      console.log(\'创建 DataFrame 成功:\', !!df);\n      \n      // 更新表格\n      const result = await setTable(table, df);\n      console.log(\'更新表格成功:\', result);\n    }\n  } catch (error) {\n    console.error(\'测试失败:\', error);\n  }\n}\n\ntestNewFunctions();\n\n// 或者直接执行以下代码，不需要调用函数\n/*\ntry {\n  // 测试 getTable 函数\n  console.log(\'测试 getTable 函数...\');\n  const table = await getTable();\n  console.log(\'获取表格成功:\', !!table);\n  \n  // 输出表格的基本信息，而不是整个表格实例\n  console.log(\'表格名称:\', table.name);\n  console.log(\'表格ID:\', table.id);\n  \n  // 测试 table2dict 函数\n  console.log(\'\n测试 table2dict 函数...\');\n  const data = await table2dict(table);\n  console.log(\'转换为字典成功:\', Object.keys(data).length > 0);\n  console.log(\'数据:\', data);\n  \n  // 测试 setTable 函数\n  console.log(\'\n测试 setTable 函数...\');\n  if (data && Object.keys(data).length > 0) {\n    // 创建一个简单的 DataFrame\n    const df = new dfd.DataFrame(data);\n    console.log(\'创建 DataFrame 成功:\', !!df);\n    \n    // 更新表格\n    const result = await setTable(table, df);\n    console.log(\'更新表格成功:\', result);\n  }\n} catch (error) {\n  console.error(\'测试失败:\', error);\n}\n*/');
  } else if (path === 'src/js/main.js') {
    editor.setValue('// 主脚本文件');
  } else if (path === 'package.json') {
    editor.setValue('// package.json 文件');
  } else if (path === 'index.html') {
    editor.setValue('// index.html 文件');
  }
}

// 初始化
async function init() {
  // 初始化文件树
  initFileTree();
  
  // 初始化编辑器
  if (CodeEditorSDK && CodeEditorSDK.Editor) {
    editor = new CodeEditorSDK.Editor({
      container: document.getElementById('editor'),
      language: 'javascript',
      theme: 'vs-light',
      value: '// 在这里编写 JavaScript 代码\n\nasync function test() {\n  console.log("Hello, World!");\n  \n  // 测试飞书表格操作\n  try {\n    const table = await getTable();\n    console.log("获取表格成功:", !!table);\n    \n    // 输出表格的基本信息\n    console.log("表格名称:", table.name);\n    console.log("表格ID:", table.id);\n    \n    // 测试 table2dict 函数\n    const data = await table2dict(table);\n    console.log("转换为字典成功:", Object.keys(data).length > 0);\n    console.log("数据:", data);\n    \n    // 测试 setTable 函数\n    if (data && Object.keys(data).length > 0) {\n      // 创建一个简单的 DataFrame\n      const df = new dfd.DataFrame(data);\n      console.log("创建 DataFrame 成功:", !!df);\n      \n      // 更新表格\n      const result = await setTable(table, df);\n      console.log("更新表格成功:", result);\n    }\n  } catch (error) {\n    console.error("测试失败:", error);\n  }\n}\n\ntest();'
    });
  } else {
    // 降级方案：使用简单的文本编辑器
    editor = {
      getValue: function() {
        return document.getElementById('editor').value;
      },
      setValue: function(value) {
        document.getElementById('editor').value = value;
      }
    };
  }
  
  // 初始化终端
  if (CodeEditorSDK && CodeEditorSDK.Terminal) {
    terminal = new CodeEditorSDK.Terminal({
      container: document.getElementById('terminal'),
      options: {
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace'
      }
    });
  } else {
    // 降级方案：使用简单的终端模拟
    terminal = {
      write: function(text) {
        const terminalElement = document.getElementById('terminal');
        const placeholder = terminalElement.querySelector('.terminal-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
        terminalElement.innerHTML += text;
        terminalElement.scrollTop = terminalElement.scrollHeight;
      },
      clear: function() {
        const terminalElement = document.getElementById('terminal');
        terminalElement.innerHTML = '<div class="terminal-placeholder" style="color: #666; pointer-events: none;">程序输出将显示在这里</div>';
      }
    };
  }
  
  // 创建自定义控制台
  customConsole = new CustomConsole(terminal);
  
  // 绑定事件
  document.getElementById('editor-run').addEventListener('click', runCode);
  document.getElementById('terminal-copy').addEventListener('click', copyTerminalContent);
  document.getElementById('terminal-clear').addEventListener('click', clearTerminal);
  
  // 初始化可拖动分隔条
  initResizer();
  
  // 输出欢迎信息
  terminal.write('🎉 多维表格 JS 引擎初始化完成\n');
  terminal.write('📚 支持的功能：\n');
  terminal.write('  - 代码编辑和执行\n');
  terminal.write('  - 表格数据读取和转换\n');
  terminal.write('  - DataFrame 数据更新表格\n');
  terminal.write('  - 自定义控制台输出\n');
  terminal.write('  - 文件树浏览\n\n');
}

// 初始化可拖动分隔条
function initResizer() {
  const resizer = document.getElementById('resizer');
  const editorContainer = document.querySelector('.editor-container');
  const terminalContainer = document.querySelector('.terminal-container');
  const container = document.querySelector('.editor-terminal');
  
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

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);