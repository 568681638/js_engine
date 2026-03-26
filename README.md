# js_engine
飞书多维表格插件-js引擎，用于实时代码操作对应的多维表格

## 项目简介

js_engine 是一个飞书多维表格插件，允许用户通过编写 JavaScript 代码来实时代码操作对应的多维表格。它提供了一个简洁的界面，用户可以直接在插件中编写和执行代码，操作表格数据。

## 功能特性

- **实时代码执行**：编写 JavaScript 代码并立即执行
- **Monaco Editor**：集成 VS Code 的 Monaco Editor 提供专业的代码编辑体验
- **xterm.js 终端**：集成 web 版 VS Code 终端，提供更好的输出体验
- **Danfo.js 支持**：集成 js 版 pandas (Danfo.js)，提供强大的数据处理能力
- **Python 风格 print**：提供 `print` 函数方便调试
- **自定义控制台**：控制台输出重定向到页面终端
- **错误处理**：详细的错误信息和行号显示
- **可调整布局**：编辑区和终端之间有可拖动的分隔条
- **响应式设计**：自适应不同屏幕尺寸

## 快速开始

1. 在飞书多维表格中添加此插件
2. 打开插件，在代码编辑器中编写 JavaScript 代码
3. 点击「运行」按钮执行代码
4. 在终端区域查看执行结果

## 使用方法

### 基本用法

在代码编辑器中输入 JavaScript 代码，例如：

```javascript
// 使用 console.log 输出
console.log('Hello, World!');

// 使用 print 函数输出
print('Hello, World!');

// 使用 Danfo.js 处理数据
const df = new dfd.DataFrame({
  'col1': [1, 2, 3, 4],
  'col2': [5, 6, 7, 8]
});

print('DataFrame:');
print(df);

// 计算平均值
const mean = df.col('col1').mean();
print('Mean of col1:', mean);
```

### 可用对象

插件提供了以下全局对象：

- **console**：自定义控制台，输出重定向到页面终端
- **print**：Python 风格的打印函数
- **dfd**：Danfo.js 实例，用于数据处理

## 代码示例

### 1. 基本输出

```javascript
// 使用 console.log
console.log('Hello, World!');

// 使用 print 函数
print('Hello, World!');
```

### 2. 数据处理（使用 Danfo.js）

```javascript
// 创建 DataFrame
const df = new dfd.DataFrame({
  'name': ['Alice', 'Bob', 'Charlie', 'David'],
  'age': [25, 30, 35, 40],
  'score': [85, 90, 80, 95]
});

// 查看数据
print('Original DataFrame:');
print(df);

// 筛选数据
const filtered = df.query('age > 30');
print('Filtered DataFrame (age > 30):');
print(filtered);

// 计算统计信息
const stats = df.describe();
print('Statistics:');
print(stats);

// 按列排序
const sorted = df.sortValues({ by: 'score', ascending: false });
print('Sorted by score (descending):');
print(sorted);
```

### 3. 循环和条件

```javascript
// 循环输出
for (let i = 0; i < 5; i++) {
  console.log(`Iteration ${i}`);
}

// 条件判断
const num = 42;
if (num > 50) {
  print('Number is greater than 50');
} else if (num > 20) {
  print('Number is greater than 20 but less than or equal to 50');
} else {
  print('Number is less than or equal to 20');
}
```

### 4. 函数定义

```javascript
// 定义函数
function calculateSum(a, b) {
  return a + b;
}

// 调用函数
const result = calculateSum(10, 20);
print('Sum:', result);

// 箭头函数
const calculateProduct = (a, b) => a * b;
print('Product:', calculateProduct(5, 6));
```

## API 文档

### Danfo.js 文档

- [Danfo.js 官方文档](https://danfo.js.org/)

### 常用 Danfo.js API

#### DataFrame 创建
- `new dfd.DataFrame(data)` - 创建新的 DataFrame
- `dfd.readCSV(url)` - 从 CSV 文件读取数据
- `dfd.readJSON(url)` - 从 JSON 文件读取数据

#### DataFrame 操作
- `df.head(n)` - 获取前 n 行
- `df.tail(n)` - 获取后 n 行
- `df.describe()` - 计算统计信息
- `df.sortValues({ by: column, ascending: boolean })` - 按列排序
- `df.query(condition)` - 按条件筛选
- `df.groupby(columns)` - 按列分组
- `df.merge(otherDf, options)` - 合并两个 DataFrame

#### 列操作
- `df.col(column)` - 获取列
- `df.addColumn(name, values)` - 添加新列
- `df.drop({ columns: [names] })` - 删除列

## 注意事项

1. **安全性**：请不要在代码中包含敏感信息，如密码、API 密钥等
2. **性能**：处理大量数据时请注意性能，避免阻塞主线程
3. **错误处理**：编写代码时请添加适当的错误处理
4. **本地文件系统**：由于浏览器安全限制，在本地文件系统中运行时，Monaco Editor 可能会有一些功能限制（如 web worker 相关功能）

## 快捷键

插件支持以下 VS Code 风格的快捷键：

- **Ctrl+Enter**：运行代码
- **Ctrl+Z**：撤销
- **Ctrl+Y**：重做
- **Ctrl+F**：查找
- **Ctrl+H**：替换
- **Ctrl+/**：注释/取消注释
- **Tab**：增加缩进
- **Shift+Tab**：减少缩进

## 许可证

MIT