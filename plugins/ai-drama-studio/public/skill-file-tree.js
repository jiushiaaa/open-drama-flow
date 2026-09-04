function compareNodes(left, right) {
  if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
  return left.name.localeCompare(right.name, "zh-CN", { numeric: true, sensitivity: "base" });
}

export function buildSkillFileTree(items) {
  const root = { type: "directory", name: "", path: "", children: [] };
  const directories = new Map([["", root]]);

  function ensureDirectory(directoryPath) {
    const normalized = String(directoryPath || "").replace(/^\/+|\/+$/g, "");
    if (!normalized) return root;
    if (directories.has(normalized)) return directories.get(normalized);
    const segments = normalized.split("/");
    const name = segments.pop();
    const parentPath = segments.join("/");
    const parent = ensureDirectory(parentPath);
    const node = { type: "directory", name, path: `${normalized}/`, children: [] };
    parent.children.push(node);
    directories.set(normalized, node);
    return node;
  }

  for (const item of items || []) {
    if (item.type === "directory") ensureDirectory(item.path);
  }
  for (const item of items || []) {
    if (item.type !== "file") continue;
    const normalized = String(item.path || "").replace(/^\/+/, "");
    const segments = normalized.split("/");
    const name = segments.pop();
    ensureDirectory(segments.join("/")).children.push({ type: "file", name, path: normalized });
  }

  function sortBranch(node) {
    node.children.sort(compareNodes);
    for (const child of node.children) if (child.type === "directory") sortBranch(child);
  }
  sortBranch(root);
  return root.children;
}

export function countSkillTreeFiles(node) {
  if (node.type === "file") return 1;
  return node.children.reduce((total, child) => total + countSkillTreeFiles(child), 0);
}

export function skillFileBadge(fileName) {
  const extension = String(fileName || "").split(".").pop();
  return extension && extension !== fileName ? extension.slice(0, 4).toUpperCase() : "FILE";
}
