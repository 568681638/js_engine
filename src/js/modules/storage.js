// 代码片段存储管理
const STORAGE_KEY = 'js-engine-snippets';

// 加载保存的代码片段
function loadSavedSnippets() {
  const snippets = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return snippets;
}

// 保存代码片段
function saveSnippet(name, code) {
  if (!name || !code) {
    return false;
  }

  const snippets = loadSavedSnippets();
  snippets[name] = code;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  return true;
}

// 删除代码片段
function deleteSnippet(name) {
  const snippets = loadSavedSnippets();
  delete snippets[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

export {
  loadSavedSnippets,
  saveSnippet,
  deleteSnippet
};