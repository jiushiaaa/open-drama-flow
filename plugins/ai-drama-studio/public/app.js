const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const stageDefinitions = [["story", "故事"], ["characters", "角色"], ["storyboard", "分镜"], ["assets", "素材"], ["videos", "视频"], ["final", "成片"]];
const sortLabels = { updated: "最近更新", created: "最近创建", title: "名称顺序" };

let studioState = null;
let activeProjectId = null;
let activeCreationId = null;
let activeWorldId = "all";
let activeProjectTab = "creations";
let activeAssetFolderId = null;
let assetViewMode = "grid";
let expandedProjectIds = new Set();
let projectSort = "updated";
let projectSearch = "";
let projectDialogMode = "create-project";
let mutationTargetId = null;
let mutationParentId = null;
let deleteTargetType = "project";
let pollTimer = null;
let availableSkills = [];
let skillSearch = "";
let skillFilter = "all";
let activeSkillDetail = null;
let assetContextTarget = null;
let activePreviewAssetId = null;
let activeEditorAssetId = null;
let assetMoveTarget = null;
let canvasRuntime = { x: 120, y: 90, zoom: 0.78, dragging: null, saveTimer: null, nodeIds: [] };

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}

async function api(path, options = {}) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: options.body instanceof FormData ? options.headers : { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `HTTP_${response.status}`);
  return body;
}

function toast(message, tone = "info") {
  const node = el("div", { class: `toast ${tone}`, role: tone === "error" ? "alert" : "status", text: message });
  $("#toast-viewport").append(node);
  setTimeout(() => node.remove(), tone === "error" ? 7000 : 4200);
}

function activeProject() { return studioState?.projects.find(project => project.id === activeProjectId) || null; }
function activeCreation() { return activeProject()?.creations?.find(item => item.id === activeCreationId) || null; }
function activeWorld() { return activeProject()?.worlds?.find(item => item.id === activeCreation()?.worldId) || null; }
function currentRoute() { return ["start", "project-library", "project", "workspace", "skills", "project-guide"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "start"; }
function go(route) { location.hash = route; }

function sortedProjects() {
  const items = [...(studioState?.projects || [])].filter(item => item.title.toLowerCase().includes(projectSearch.toLowerCase()));
  return sortItems(items);
}

function sortItems(items) {
  return items.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (projectSort === "title" ? a.title.localeCompare(b.title, "zh-CN") : new Date(projectSort === "created" ? b.createdAt : b.updatedAt) - new Date(projectSort === "created" ? a.createdAt : a.updatedAt)));
}

function sortedCreations(project) { return sortItems([...(project?.creations || [])]); }

async function refreshState({ quiet = false } = {}) {
  try {
    const [stateResponse, skillResponse] = await Promise.all([api("/api/state"), api("/api/skills")]);
    studioState = stateResponse;
    availableSkills = skillResponse.skills || [];
    if (!activeProjectId || !studioState.projects.some(project => project.id === activeProjectId)) activeProjectId = studioState.projects[0]?.id || null;
    if (activeProjectId && !expandedProjectIds.size) expandedProjectIds.add(activeProjectId);
    const project = activeProject();
    if (project && (!activeCreationId || !project.creations?.some(item => item.id === activeCreationId))) activeCreationId = project.creations?.[0]?.id || null;
    render();
    schedulePoll();
  } catch (error) {
    if (!quiet) toast("本地工作台未连接，请重新打开插件。", "error");
  }
}

function schedulePoll() {
  clearTimeout(pollTimer);
  const busy = studioState?.jobs.some(job => ["queued", "running"].includes(job.status));
  pollTimer = setTimeout(() => refreshState({ quiet: true }), busy ? 1500 : 7000);
}

function render() {
  renderSidebar();
  renderLibrary();
  renderProjectOverview();
  renderSettings();
  renderSkills();
  applyRoute();
  if (currentRoute() === "workspace") renderWorkspace();
}

function applyRoute() {
  let route = currentRoute();
  if (!activeProject() && ["project", "workspace"].includes(route)) route = "project-library";
  const routeViewIds = { start: "start-view", "project-library": "project-library-view", project: "project-overview-view", workspace: "workspace-view", skills: "skills-view", "project-guide": "project-guide-view" };
  $$(".route-view").forEach(view => { view.hidden = view.id !== routeViewIds[route]; });
  $$(".primary-nav a").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${route}` || (route === "project" && link.getAttribute("href") === "#project-library") || (route === "workspace" && link.getAttribute("href") === "#project-library")));
  const routeTitle = route === "start" ? "开始创作" : route === "project-library" ? "项目库" : route === "skills" ? "Skill" : route === "project-guide" ? "项目新手指引" : activeProject()?.title || "OpenDramaFlow";
  document.title = `${routeTitle} — OpenDramaFlow`;
}

function renderSidebar() {
  const container = $("#sidebar-projects");
  container.replaceChildren();
  const projects = sortItems([...(studioState?.projects || [])]);
  if (!projects.length) container.append(el("p", { class: "sidebar-empty", text: "暂无项目" }));
  for (const project of projects) {
    const expanded = expandedProjectIds.has(project.id);
    const projectRow = el("section", { class: `sidebar-project-row ${project.id === activeProjectId ? "active" : ""} ${expanded ? "expanded" : ""}` });
    projectRow.append(el("div", { class: "sidebar-project-head" },
      el("button", { class: "sidebar-project-main", type: "button", "aria-expanded": expanded, onclick: () => { if (expanded) expandedProjectIds.delete(project.id); else expandedProjectIds.add(project.id); renderSidebar(); } }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("span", { text: project.title })),
      el("div", { class: "sidebar-row-actions" },
        el("button", { type: "button", title: "进入项目详情", "aria-label": `进入${project.title}项目详情`, onclick: event => { event.stopPropagation(); openProject(project.id); } }, el("img", { src: "/icons/chevron-right.svg", alt: "" })),
        el("button", { type: "button", title: "新建创作页", "aria-label": `在${project.title}中新建创作页`, onclick: event => { event.stopPropagation(); activeProjectId = project.id; expandedProjectIds.add(project.id); activeWorldId = "all"; openProjectDialog("create-creation", null, project.id); } }, el("img", { src: "/icons/plus.svg", alt: "" }))
      )
    ));
    if (expanded) projectRow.append(renderSidebarHierarchy(project));
    container.append(projectRow);
  }
}

function sidebarCreationRow(project, creation) {
  return el("div", { class: `sidebar-creation-row ${creation.id === activeCreationId && currentRoute() === "workspace" ? "current" : ""}` },
    el("button", { class: "sidebar-creation-main", type: "button", onclick: () => { activeProjectId = project.id; expandedProjectIds.add(project.id); openWorkspace(creation.id); } }, el("span", { text: creation.title })),
    el("div", { class: "sidebar-row-actions" },
      el("button", { type: "button", title: creation.pinned ? "取消置顶" : "置顶", "aria-label": `${creation.pinned ? "取消置顶" : "置顶"}${creation.title}`, onclick: event => toggleCreationPinned(event, project.id, creation) }, el("img", { src: creation.pinned ? "/icons/pin-filled.svg" : "/icons/pin.svg", alt: "" })),
      el("button", { type: "button", title: "更多", "aria-label": `管理${creation.title}`, onclick: event => toggleCreationMenu(event, project.id, creation.id) }, el("img", { src: "/icons/ellipsis.svg", alt: "" })), creationMenu(project.id, creation)
    )
  );
}

function renderSidebarHierarchy(project) {
  const tree = el("div", { class: "sidebar-creations hierarchy" });
  for (const creation of sortedCreations(project).filter(item => !item.worldId)) tree.append(sidebarCreationRow(project, creation));
  for (const world of [...(project.worlds || [])].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || a.title.localeCompare(b.title, "zh-CN"))) {
    const group = el("section", { class: "sidebar-world-group" },
      el("div", { class: "sidebar-world-title" }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("strong", { text: world.title }), el("span", { text: String(project.creations.filter(item => item.worldId === world.id).length) }))
    );
    for (const creation of sortedCreations(project).filter(item => item.worldId === world.id)) group.append(sidebarCreationRow(project, creation));
    tree.append(group);
  }
  return tree;
}

function projectPreview(project) {
  const image = (project.assets || []).find(asset => asset.kind === "image");
  return { src: image?.mediaUrl || "/assets/empty-project-pixel.png", hasAsset: Boolean(image) };
}

function renderLibrary() {
  const grid = $("#project-library-grid");
  grid.replaceChildren();
  for (const project of sortedProjects()) {
    const preview = projectPreview(project);
    const card = el("article", { class: `project-card ${project.pinned ? "pinned" : ""}`, tabindex: "0" },
      el("button", { class: "project-card-main", type: "button", onclick: () => openProject(project.id) },
        el("div", { class: "project-stack" }, el("div", { class: "project-layer project-layer-back" }), el("div", { class: `project-layer project-preview ${preview.hasAsset ? "has-asset" : "empty"}` }, el("img", { src: preview.src, alt: preview.hasAsset ? `${project.title} 的首项图片素材` : "空白项目素材" }))),
        el("div", { class: "project-card-copy" }, el("strong", { text: project.title }), el("time", { datetime: project.updatedAt, text: formatDate(project.updatedAt) }), el("small", { text: `${project.creations?.length || 0} 个创作页 · ${project.assets?.length || 0} 项素材` }))
      ),
      el("div", { class: "card-actions-hover" },
        el("button", { type: "button", title: project.pinned ? "取消置顶" : "置顶", "aria-label": `${project.pinned ? "取消置顶" : "置顶"}${project.title}`, onclick: event => toggleProjectPinned(event, project) }, el("img", { src: project.pinned ? "/icons/pin-filled.svg" : "/icons/pin.svg", alt: "" })),
        el("button", { type: "button", title: "重命名", "aria-label": `重命名${project.title}`, onclick: event => { event.stopPropagation(); openProjectDialog("rename-project", project.id); } }, el("img", { src: "/icons/pencil.svg", alt: "" })),
        el("button", { class: "danger-action", type: "button", title: "删除", "aria-label": `删除${project.title}`, onclick: event => { event.stopPropagation(); openDeleteDialog("project", project.id); } }, el("img", { src: "/icons/trash-2.svg", alt: "" }))
      )
    );
    grid.append(card);
  }
  if (!sortedProjects().length) grid.append(el("div", { class: "empty-result" }, el("img", { src: "/assets/empty-project-pixel.png", alt: "" }), el("strong", { text: projectSearch ? "没有匹配的项目" : "还没有项目" }), el("p", { text: projectSearch ? "换一个关键词试试。" : "点击上方“新建项目”开始第一段创作。" })));
}

async function toggleProjectPinned(event, project) {
  event.stopPropagation();
  try { await api(`/api/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ pinned: !project.pinned }) }); await refreshState({ quiet: true }); toast(project.pinned ? "已取消项目置顶。" : "项目已置顶。", "success"); }
  catch (error) { toast(error.message, "error"); }
}

function creationMenu(projectId, creation) {
  return el("div", { class: "creation-menu", "data-creation-menu": creation.id, hidden: true },
    el("button", { type: "button", onclick: event => { event.stopPropagation(); openProjectDialog("rename-creation", creation.id, projectId); } }, el("img", { src: "/icons/pencil.svg", alt: "" }), "重命名"),
    el("button", { class: "danger-text", type: "button", onclick: event => { event.stopPropagation(); openDeleteDialog("creation", projectId, creation.id); } }, el("img", { src: "/icons/trash-2.svg", alt: "" }), "删除")
  );
}

function toggleCreationMenu(event, projectId, creationId) {
  event.stopPropagation();
  $$('[data-creation-menu]').forEach(menu => { menu.hidden = menu.dataset.creationMenu !== creationId || !menu.hidden; });
}

async function toggleCreationPinned(event, projectId, creation) {
  event.stopPropagation();
  try { await api(`/api/projects/${projectId}/creations/${creation.id}`, { method: "PATCH", body: JSON.stringify({ pinned: !creation.pinned }) }); await refreshState({ quiet: true }); toast(creation.pinned ? "已取消创作页置顶。" : "创作页已置顶。", "success"); }
  catch (error) { toast(error.message, "error"); }
}

function openProject(projectId) {
  activeProjectId = projectId;
  expandedProjectIds.add(projectId);
  activeCreationId = activeProject()?.creations?.[0]?.id || null;
  activeProjectTab = "creations";
  activeWorldId = "all";
  activeAssetFolderId = null;
  render();
  go("project");
}

function renderProjectOverview() {
  const project = activeProject();
  if (!project) return;
  $("#overview-project-title").textContent = project.title;
  $("#creations-tab").classList.toggle("active", activeProjectTab === "creations");
  $("#assets-tab").classList.toggle("active", activeProjectTab === "assets");
  $("#creations-panel").hidden = activeProjectTab !== "creations";
  $("#assets-panel").hidden = activeProjectTab !== "assets";
  $("#new-creation-button").hidden = activeProjectTab !== "creations";
  $("#new-world-button").hidden = activeProjectTab !== "creations";
  const creations = $("#creation-grid");
  creations.replaceChildren();
  const worlds = project.worlds || [];
  const worldFilters = $("#world-filter-list");
  worldFilters.replaceChildren(
    el("button", { class: activeWorldId === "all" ? "active" : "", type: "button", onclick: () => { activeWorldId = "all"; renderProjectOverview(); } }, `全部 ${project.creations?.length || 0}`),
    el("button", { class: activeWorldId === "series" ? "active" : "", type: "button", onclick: () => { activeWorldId = "series"; renderProjectOverview(); } }, `系列总览 ${project.creations?.filter(item => !item.worldId).length || 0}`),
    ...worlds.map(world => el("button", { class: activeWorldId === world.id ? "active" : "", type: "button", onclick: () => { activeWorldId = world.id; renderProjectOverview(); } }, `${world.title} ${project.creations?.filter(item => item.worldId === world.id).length || 0}`))
  );
  $("#world-context-note").textContent = activeWorldId === "series" ? "当前显示系列总览与跨分卷、跨季度创作。" : activeWorldId === "all" ? "父项目保存整部 IP；分卷或季度负责一段独立内容；创作页负责一集或一个明确任务。" : `当前分卷 / 季度：${worlds.find(item => item.id === activeWorldId)?.title || "未命名"}。创作会自动继承系列公共资产与当前分卷 / 季度资产。`;
  const preview = projectPreview(project);
  const visibleCreations = sortedCreations(project).filter(creation => activeWorldId === "all" || (activeWorldId === "series" ? !creation.worldId : creation.worldId === activeWorldId));
  for (const creation of visibleCreations) creations.append(el("article", { class: `creation-card ${creation.pinned ? "pinned" : ""}` },
    el("button", { class: "creation-card-main", type: "button", onclick: () => openWorkspace(creation.id) }, el("div", { class: `creation-art ${preview.hasAsset ? "has-asset" : "empty"}` }, el("img", { src: preview.src, alt: "" }), el("span", {}, el("img", { src: "/icons/message-square.svg", alt: "" }), friendlyStatus(creation.status))), el("strong", { text: creation.title }), el("time", { datetime: creation.updatedAt, text: formatDate(creation.updatedAt) })),
    el("div", { class: "card-actions-hover creation-actions" },
      el("button", { type: "button", title: creation.pinned ? "取消置顶" : "置顶", onclick: event => toggleCreationPinned(event, project.id, creation) }, el("img", { src: creation.pinned ? "/icons/pin-filled.svg" : "/icons/pin.svg", alt: "" })),
      el("button", { type: "button", title: "重命名", onclick: event => { event.stopPropagation(); openProjectDialog("rename-creation", creation.id, project.id); } }, el("img", { src: "/icons/pencil.svg", alt: "" })),
      el("button", { class: "danger-action", type: "button", title: "删除", onclick: event => { event.stopPropagation(); openDeleteDialog("creation", project.id, creation.id); } }, el("img", { src: "/icons/trash-2.svg", alt: "" }))
    )
  ));
  if (!visibleCreations.length) creations.append(el("button", { class: "new-project-tile creation-empty", type: "button", onclick: () => openProjectDialog("create-creation") }, el("img", { src: "/icons/message-square.svg", alt: "" }), el("strong", { text: "新建创作页" }), el("span", { text: activeWorldId === "all" ? "先建立分卷 / 季度，或直接创建系列总览" : "每张画布负责一集或一个明确生产任务" })));
  renderAssets(project);
}

function assetKindLabel(kind) { return ({ image: "图片", video: "视频", audio: "音频", document: "文档", spreadsheet: "表格" })[kind] || "文件"; }
function assetKindIcon(kind) { return ({ image: "image.svg", video: "film.svg", audio: "clapperboard.svg", document: "book-open.svg", spreadsheet: "layout-grid.svg" })[kind] || "folder-kanban.svg"; }
function assetFileSize(size) {
  const value = Number(size || 0);
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(value > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}
function assetFolderPath(project) {
  const folders = project.assetFolders || [];
  const path = [];
  let cursor = folders.find(folder => folder.id === activeAssetFolderId);
  while (cursor) { path.unshift(cursor); cursor = folders.find(folder => folder.id === cursor.parentId); }
  return path;
}
function openAssetFolder(folderId) { activeAssetFolderId = folderId || null; renderAssets(activeProject()); }
function renderAssetPreview(asset) {
  if (asset.kind === "image") return el("img", { src: asset.mediaUrl, alt: asset.originalName || "项目图片素材" });
  if (asset.kind === "video") return el("video", { src: asset.mediaUrl, muted: true, preload: "metadata" });
  if (asset.kind === "audio") return el("div", { class: "asset-audio-preview" }, el("img", { src: `/icons/${assetKindIcon(asset.kind)}`, alt: "" }), el("span", { text: "AUDIO" }));
  const extension = String(asset.originalName || "").split(".").pop()?.toUpperCase() || assetKindLabel(asset.kind);
  return el("div", { class: `asset-file-preview ${asset.kind}` }, el("img", { src: `/icons/${assetKindIcon(asset.kind)}`, alt: "" }), el("strong", { text: extension }));
}
function assetEditable(asset) { return /\.(md|txt|docx)$/i.test(asset?.originalName || ""); }
function folderDisplayPath(project, folderId) {
  if (!folderId) return "全部文件";
  const parts = []; let cursor = project.assetFolders?.find(item => item.id === folderId);
  while (cursor) { parts.unshift(cursor.name); cursor = project.assetFolders?.find(item => item.id === cursor.parentId); }
  return parts.join(" / ");
}
function closeAssetContextMenu() { const menu = $("#asset-context-menu"); menu.hidden = true; menu.replaceChildren(); assetContextTarget = null; }
function openAssetContextMenu(event, type, id) {
  event.preventDefault(); event.stopPropagation();
  assetContextTarget = { type, id };
  const project = activeProject();
  const asset = type === "asset" ? project?.assets?.find(item => item.id === id) : null;
  const menu = $("#asset-context-menu");
  const action = (name, label, icon, danger = false) => el("button", { type: "button", role: "menuitem", class: danger ? "danger-text" : "", onclick: () => runAssetContextAction(name) }, el("img", { src: `/icons/${icon}`, alt: "" }), label);
  menu.replaceChildren(...[
    action("open", "打开", type === "folder" ? "folder-kanban.svg" : "chevron-right.svg"),
    type === "asset" ? action("reveal", "在文件资源管理器中打开", "folder-kanban.svg") : null,
    type === "asset" && assetEditable(asset) ? action("edit", "编辑文档", "pencil.svg") : null,
    action("rename", "重命名", "pencil.svg"),
    action("move", "移动到", "folder-kanban.svg"),
    action("delete", "删除", "trash-2.svg", true)
  ].filter(Boolean));
  menu.hidden = false;
  const width = 244; const height = menu.offsetHeight || 250;
  menu.style.left = `${Math.max(12, Math.min(event.clientX, window.innerWidth - width - 12))}px`;
  menu.style.top = `${Math.max(12, Math.min(event.clientY, window.innerHeight - height - 12))}px`;
}
async function runAssetContextAction(name) {
  const target = assetContextTarget; closeAssetContextMenu(); if (!target) return;
  const project = activeProject();
  const asset = target.type === "asset" ? project?.assets?.find(item => item.id === target.id) : null;
  const folder = target.type === "folder" ? project?.assetFolders?.find(item => item.id === target.id) : null;
  if (name === "open") { target.type === "folder" ? openAssetFolder(target.id) : openAssetPreview(target.id); return; }
  if (name === "reveal") { try { await api(`/api/projects/${project.id}/assets/${target.id}/reveal`, { method: "POST", body: "{}" }); } catch (error) { toast(error.message, "error"); } return; }
  if (name === "edit") { openAssetEditor(target.id); return; }
  if (name === "rename") { openProjectDialog(target.type === "asset" ? "rename-asset" : "rename-folder", target.id, project.id); return; }
  if (name === "move") { openAssetMoveDialog(target.type, target.id); return; }
  if (name === "delete") openDeleteDialog(target.type, project.id, target.id);
}
async function openAssetPreview(assetId, outputPreview = null) {
  const asset = assetId ? activeProject()?.assets?.find(item => item.id === assetId) : outputPreview; if (!asset) return;
  activePreviewAssetId = assetId || null;
  $("#asset-preview-title").textContent = asset.originalName || `${assetKindLabel(asset.kind)}素材`;
  $("#asset-preview-type").textContent = `${assetKindLabel(asset.kind)} · V${asset.version || 1}`;
  $("#asset-preview-meta").textContent = `${formatDate(asset.createdAt)} · ${assetFileSize(asset.size) || "本地文件"}`;
  $("#asset-preview-edit").hidden = !assetId || !assetEditable(asset);
  $("#asset-preview-reveal").hidden = !assetId;
  $("#asset-preview-original").href = asset.mediaUrl || "#";
  $("#asset-preview-original").hidden = !asset.mediaUrl;
  const body = $("#asset-preview-body"); body.replaceChildren(el("p", { class: "asset-preview-loading", text: "正在读取素材…" }));
  if (!$("#asset-preview-dialog").open) $("#asset-preview-dialog").showModal();
  try {
    if (asset.kind === "image") body.replaceChildren(el("img", { src: asset.mediaUrl, alt: asset.originalName || "图片素材" }));
    else if (asset.kind === "video") body.replaceChildren(el("video", { src: asset.mediaUrl, controls: true, playsinline: true, preload: "metadata" }));
    else if (asset.kind === "audio") body.replaceChildren(el("audio", { src: asset.mediaUrl, controls: true, preload: "metadata" }));
    else if (/\.pdf$/i.test(asset.originalName || "")) body.replaceChildren(el("iframe", { src: asset.mediaUrl, title: asset.originalName || "PDF 预览" }));
    else if (assetEditable(asset)) { const result = await api(`/api/projects/${activeProjectId}/assets/${assetId}/content`); body.replaceChildren(el("pre", { text: result.content || "（空文档）" })); }
    else body.replaceChildren(el("div", { class: "asset-preview-unavailable" }, renderAssetPreview(asset), el("strong", { text: "该格式可打开查看，但不支持在工作台内编辑" })));
  } catch (error) { body.replaceChildren(el("p", { class: "field-error", text: error.message })); }
}
async function openAssetEditor(assetId) {
  const asset = activeProject()?.assets?.find(item => item.id === assetId); if (!asset || !assetEditable(asset)) return;
  activeEditorAssetId = assetId; $("#asset-editor-title").textContent = `编辑 ${asset.originalName}`; $("#asset-editor-content").value = "正在读取…"; $("#asset-editor-content").disabled = true; $("#asset-editor-error").textContent = "";
  if ($("#asset-preview-dialog").open) $("#asset-preview-dialog").close();
  $("#asset-editor-dialog").showModal();
  try { const result = await api(`/api/projects/${activeProjectId}/assets/${assetId}/content`); $("#asset-editor-content").value = result.content || ""; $("#asset-editor-content").disabled = false; $("#asset-editor-content").focus(); }
  catch (error) { $("#asset-editor-error").textContent = error.message; }
}
function openAssetMoveDialog(type, id) {
  const project = activeProject(); if (!project) return; assetMoveTarget = { type, id };
  const excluded = new Set([id]);
  if (type === "folder") { let changed = true; while (changed) { changed = false; for (const folder of project.assetFolders || []) if (excluded.has(folder.parentId) && !excluded.has(folder.id)) { excluded.add(folder.id); changed = true; } } }
  $("#asset-move-title").textContent = type === "folder" ? "移动文件夹" : "移动素材";
  $("#asset-move-target").replaceChildren(el("option", { value: "", text: "全部文件（根目录）" }), ...(project.assetFolders || []).filter(folder => !excluded.has(folder.id)).map(folder => el("option", { value: folder.id, text: folderDisplayPath(project, folder.id) })));
  $("#asset-move-error").textContent = ""; $("#asset-move-dialog").showModal();
}
async function moveAssetToFolder(assetId, folderId) {
  await api(`/api/projects/${activeProjectId}/assets/${assetId}`, { method: "PATCH", body: JSON.stringify({ folderId: folderId || null }) });
  await refreshState({ quiet: true }); toast("素材已移动。", "success");
}
function renderAssets(project) {
  if (!project) return;
  if (activeAssetFolderId && !(project.assetFolders || []).some(folder => folder.id === activeAssetFolderId)) activeAssetFolderId = null;
  const query = $("#asset-search")?.value?.trim().toLowerCase() || "";
  const grid = $("#asset-grid");
  grid.classList.toggle("list-view", assetViewMode === "list");
  $("#asset-grid-button").classList.toggle("active", assetViewMode === "grid");
  $("#asset-list-button").classList.toggle("active", assetViewMode === "list");
  grid.replaceChildren();

  const breadcrumbs = $("#asset-breadcrumbs");
  breadcrumbs.replaceChildren(el("button", { type: "button", class: activeAssetFolderId ? "" : "current", onclick: () => openAssetFolder(null) }, "全部文件"));
  for (const folder of assetFolderPath(project)) breadcrumbs.append(el("span", { text: "›" }), el("button", { type: "button", class: folder.id === activeAssetFolderId ? "current" : "", onclick: () => openAssetFolder(folder.id) }, folder.name));

  const folders = (project.assetFolders || []).filter(folder => (folder.parentId || null) === activeAssetFolderId && folder.name.toLowerCase().includes(query));
  const assets = (project.assets || []).filter(asset => (asset.folderId || null) === activeAssetFolderId && String(asset.originalName || asset.shotId || "").toLowerCase().includes(query));
  for (const folder of folders) {
    const itemCount = (project.assetFolders || []).filter(item => item.parentId === folder.id).length + (project.assets || []).filter(asset => asset.folderId === folder.id).length;
    const card = el("article", { class: "asset-folder-card", oncontextmenu: event => openAssetContextMenu(event, "folder", folder.id) },
      el("button", { class: "asset-folder-main", type: "button", onclick: () => openAssetFolder(folder.id) }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("div", {}, el("strong", { text: folder.name, title: folder.name }), el("small", { text: `${itemCount} 项 · ${formatDate(folder.updatedAt)}` }))),
      el("button", { class: "asset-more-button", type: "button", title: "更多", onclick: event => openAssetContextMenu(event, "folder", folder.id) }, el("img", { src: "/icons/ellipsis.svg", alt: "" }))
    );
    card.addEventListener("dragover", event => { event.preventDefault(); event.stopPropagation(); card.classList.add("drop-target"); });
    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
    card.addEventListener("drop", event => { event.preventDefault(); event.stopPropagation(); card.classList.remove("drop-target"); const assetId = event.dataTransfer.getData("application/x-opendrama-asset"); if (assetId) moveAssetToFolder(assetId, folder.id); else importAssets([...event.dataTransfer.files], folder.id); });
    grid.append(card);
  }
  for (const asset of assets) {
    const card = el("article", { class: `asset-card asset-${asset.kind}`, draggable: true, oncontextmenu: event => openAssetContextMenu(event, "asset", asset.id) },
      el("button", { class: "asset-card-preview", type: "button", title: `查看${asset.originalName || "素材"}`, onclick: () => openAssetPreview(asset.id) }, renderAssetPreview(asset)),
      el("div", { class: "asset-card-copy" }, el("strong", { text: asset.originalName || `${assetKindLabel(asset.kind)}素材`, title: asset.originalName || `${assetKindLabel(asset.kind)}素材` }), el("small", { text: `${assetKindLabel(asset.kind)} · ${formatDate(asset.createdAt)}` })),
      el("button", { class: "asset-more-button", type: "button", title: "更多", onclick: event => openAssetContextMenu(event, "asset", asset.id) }, el("img", { src: "/icons/ellipsis.svg", alt: "" }))
    );
    card.addEventListener("dragstart", event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-opendrama-asset", asset.id); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    grid.append(card);
  }
  if (!folders.length && !assets.length) grid.append(el("div", { class: "asset-empty" }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("strong", { text: activeAssetFolderId ? "当前文件夹暂无素材" : "还没有项目资产" }), el("p", { text: "上传原作、设定、图片、视频或音频，也可以新建文件夹分类整理。" }), el("label", { class: "button primary", for: "asset-file" }, el("img", { src: "/icons/upload.svg", alt: "" }), "上传文件")));
}

function openWorkspace(creationId) {
  activeCreationId = creationId;
  const creation = activeProject()?.creations?.find(item => item.id === creationId);
  activeWorldId = creation?.worldId || "series";
  go("workspace");
  renderWorkspace();
}

function creationTypeLabel(type) {
  return ({ episode: "单集生产", "world-control": "分卷 / 季度总控", "series-control": "系列总览", "asset-development": "资产开发" })[type] || "创作画布";
}

function contextAssets(project, creation) {
  if (!project || !creation) return [];
  const refs = new Set((creation.assetRefs || []).map(ref => ref.assetId));
  return (project.assets || []).filter(asset => refs.has(asset.id) || asset.scope === "series" || asset.scope === "project" || (creation.worldId && asset.worldId === creation.worldId) || asset.creationId === creation.id);
}

function buildCanvasGraph(project, creation) {
  if (!creation) return { nodes: [], edges: [] };
  const nodes = [];
  const edges = [];
  const saved = creation.canvas?.positions || {};
  const production = creation.plan || project;
  const add = (node, fallback) => {
    const position = saved[node.id] || fallback;
    nodes.push({ width: 280, height: node.mediaUrl ? 228 : 168, ...node, x: position.x, y: position.y });
    return node.id;
  };
  const connect = (source, target, label = "") => { if (source && target) edges.push({ id: `${source}-${target}`, source, target, label }); };
  const world = project.worlds?.find(item => item.id === creation.worldId);
  const assets = contextAssets(project, creation);

  if (creation.type === "series-control") {
    const root = add({ id: "series-root", kind: "系列总览", title: project.title, body: project.logline || "整部 IP 的系列圣经、公共资产与分卷 / 季度入口。" }, { x: 180, y: 520 });
    (project.worlds || []).forEach((item, index) => {
      const id = add({ id: `world-${item.id}`, kind: "分卷 / 季度", title: item.title, body: item.description || `${project.creations.filter(entry => entry.worldId === item.id).length} 个创作页` }, { x: 600, y: 180 + index * 230 });
      connect(root, id, "进入分卷 / 季度");
    });
  } else if (creation.type === "world-control") {
    const root = add({ id: "world-root", kind: "分卷 / 季度总控", title: world?.title || creation.title, body: world?.description || "分卷 / 季度圣经、角色场景母版与生产进度。" }, { x: 180, y: 500 });
    project.creations.filter(item => item.worldId === creation.worldId && item.id !== creation.id).forEach((item, index) => {
      const id = add({ id: `creation-${item.id}`, kind: creationTypeLabel(item.type), title: item.title, body: friendlyStatus(item.status) }, { x: 620 + Math.floor(index / 4) * 380, y: 140 + (index % 4) * 230 });
      connect(root, id, "生产单元");
    });
  } else {
    let previous = null;
    if (production.script?.premise || production.logline) previous = add({ id: "story-brief", kind: "故事", title: creation.title, body: production.script?.premise || production.logline }, { x: 160, y: 420 });
    if (production.characters?.length) {
      const id = add({ id: "character-bible", kind: "角色母版", title: `${production.characters.length} 个角色锚点`, body: production.characters.slice(0, 4).map(item => `${item.name}：${item.visual}`).join("\n") }, { x: 540, y: 420 });
      connect(previous, id, "锁定角色"); previous = id;
    }
    (production.shots || []).forEach((shot, index) => {
      const shotMedia = [...(project.assets || [])].reverse().filter(asset => asset.shotId === shot.id);
      const media = shotMedia.find(asset => asset.kind === "video") || shotMedia.find(asset => asset.kind === "image");
      const id = add({ id: `shot-${shot.id}`, kind: `SHOT ${String(shot.order || index + 1).padStart(2, "0")}`, title: shot.scene || `镜头 ${index + 1}`, body: shot.prompt || shot.subtitle || "等待镜头描述", meta: `${shot.framing || "镜头"} · ${shot.duration || 0}s`, mediaUrl: media?.mediaUrl, mediaKind: media?.kind, assetId: media?.id }, { x: 920 + Math.floor(index / 3) * 370, y: 120 + (index % 3) * 300 });
      connect(previous, id, index ? "连续镜头" : "进入分镜"); previous = id;
    });
    const shotAssetIds = new Set((project.assets || []).filter(asset => asset.shotId).map(asset => asset.id));
    assets.filter(asset => !shotAssetIds.has(asset.id)).forEach((asset, index) => {
      const id = add({ id: `asset-${asset.id}`, kind: assetKindLabel(asset.kind), title: asset.originalName || `${assetKindLabel(asset.kind)}素材`, body: `${asset.scope === "series" ? "系列公共" : asset.worldId ? "分卷 / 季度资产" : asset.creationId ? "当前创作" : "项目资产"} · v${asset.version || 1}`, mediaUrl: ["image", "video", "audio"].includes(asset.kind) ? asset.mediaUrl : null, mediaKind: asset.kind, assetId: asset.id }, { x: 920 + Math.floor((production.shots?.length || 0) / 3) * 370 + Math.floor(index / 3) * 370, y: 120 + (index % 3) * 300 });
      if (!previous) previous = id; else connect(previous, id, "引用素材");
      previous = id;
    });
    (creation.messages || []).filter(item => item.role === "user").slice(-5).forEach((message, index) => {
      const id = add({ id: `message-${message.id}`, kind: "创作指令", title: `指令 ${index + 1}`, body: message.content }, { x: 160, y: 720 + index * 210 });
      if (!previous) previous = id;
    });
    const output = (project.outputs || []).find(item => !item.creationId || item.creationId === creation.id);
    if (output) {
      const id = add({ id: `output-${output.id}`, kind: "成片", title: "最终视频", body: `${Math.round(output.duration || 0)} 秒 · 已锁定使用素材版本`, mediaUrl: output.mediaUrl, mediaKind: "video" }, { x: Math.max(1500, ...nodes.map(node => node.x + 380)), y: 420 });
      connect(previous, id, "合成成片");
    }
  }
  return { nodes, edges };
}

function renderCanvasNode(node) {
  const media = node.mediaUrl ? (node.mediaKind === "video" ? el("video", { src: node.mediaUrl, muted: true, playsinline: true, preload: "metadata" }) : node.mediaKind === "audio" ? el("audio", { src: node.mediaUrl, controls: true, preload: "metadata" }) : el("img", { src: node.mediaUrl, alt: node.title, draggable: "false" })) : null;
  const previewable = Boolean(node.assetId || node.mediaUrl);
  const previewLabel = node.mediaKind === "video" ? "播放视频" : node.mediaKind === "image" ? "查看全图" : "打开素材";
  const preview = () => openAssetPreview(node.assetId, { kind: node.mediaKind, mediaUrl: node.mediaUrl, originalName: node.title });
  const article = el("article", { class: `canvas-node node-${node.mediaKind || "text"} ${previewable ? "previewable" : ""}`, "data-node-id": node.id, tabindex: previewable ? "0" : null, role: previewable ? "button" : null, "aria-label": previewable ? `${previewLabel}：${node.title}` : null, "aria-haspopup": previewable ? "dialog" : null, style: `left:${node.x}px;top:${node.y}px;width:${node.width}px;min-height:${node.height}px` },
    el("header", {}, el("span", { text: node.kind }), node.meta ? el("small", { text: node.meta }) : null), media ? el("div", { class: "canvas-node-media" }, media, node.mediaKind !== "audio" ? el("span", { class: "canvas-preview-hint", "aria-hidden": "true", text: node.mediaKind === "video" ? "▶ 播放视频" : "查看全图" }) : null) : null,
    el("div", { class: "canvas-node-copy" }, el("strong", { text: node.title }), el("p", { text: node.body || "" }))
  );
  article.addEventListener("pointerdown", event => beginNodeDrag(event, node.id));
  if (previewable) {
    article.addEventListener("click", event => {
      if (event.target.closest("audio") || canvasRuntime.suppressClick) return;
      preview();
    });
    article.addEventListener("keydown", event => {
      if (event.target === article && ["Enter", " "].includes(event.key)) { event.preventDefault(); preview(); }
    });
  }
  return article;
}

function renderWorkspace() {
  if (canvasRuntime.dragging) return;
  const project = activeProject();
  const creation = activeCreation() || project?.creations?.[0];
  if (!project || !creation) return;
  activeCreationId = creation.id;
  const world = project.worlds?.find(item => item.id === creation.worldId);
  $("#workspace-project-link").textContent = project.title;
  $("#workspace-creation-title").textContent = creation.title;
  $("#workspace-world-link").textContent = world?.title || "系列";
  $("#workspace-world-separator").hidden = false;
  const graph = buildCanvasGraph(project, creation);
  canvasRuntime.nodeIds = graph.nodes.map(node => node.id);
  let shouldInitialFit = false;
  if (canvasRuntime.creationId !== creation.id) {
    const viewport = creation.canvas?.viewport || { x: 120, y: 90, zoom: 0.78 };
    canvasRuntime = { ...canvasRuntime, creationId: creation.id, x: viewport.x, y: viewport.y, zoom: viewport.zoom, dragging: null, nodeIds: canvasRuntime.nodeIds };
    shouldInitialFit = !Object.keys(creation.canvas?.positions || {}).length && graph.nodes.length > 1;
  }
  const holder = $("#canvas-nodes");
  holder.replaceChildren(...graph.nodes.map(renderCanvasNode));
  $("#canvas-empty").hidden = graph.nodes.length > 0;
  drawCanvasEdges(graph);
  applyCanvasTransform();
  if (shouldInitialFit) requestAnimationFrame(fitCanvas);
}

function drawCanvasEdges(graph) {
  const svg = $("#canvas-edges");
  svg.setAttribute("viewBox", "0 0 3600 2200");
  svg.replaceChildren();
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  for (const edge of graph.edges) {
    const source = byId.get(edge.source); const target = byId.get(edge.target);
    if (!source || !target) continue;
    const x1 = source.x + source.width; const y1 = source.y + source.height / 2; const x2 = target.x; const y2 = target.y + target.height / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2} ${y2}`);
    path.setAttribute("data-edge-id", edge.id);
    svg.append(path);
  }
  updateMinimap(graph.nodes);
}

function applyCanvasTransform() {
  $("#canvas-world").style.transform = `translate(${canvasRuntime.x}px, ${canvasRuntime.y}px) scale(${canvasRuntime.zoom})`;
  $("#canvas-zoom-label").textContent = `${Math.round(canvasRuntime.zoom * 100)}%`;
  updateMinimapViewport();
}

function updateMinimap(nodes = null) {
  const graphNodes = nodes || buildCanvasGraph(activeProject(), activeCreation()).nodes;
  const holder = $("#minimap-nodes"); holder.replaceChildren();
  for (const node of graphNodes) holder.append(el("i", { style: `left:${node.x / 24}px;top:${node.y / 24}px;width:${Math.max(7, node.width / 24)}px;height:${Math.max(5, node.height / 24)}px` }));
  updateMinimapViewport();
}

function updateMinimapViewport() {
  const stage = $("#canvas-stage"); const viewport = $("#minimap-viewport");
  if (!stage || !viewport) return;
  viewport.style.left = `${Math.max(0, -canvasRuntime.x / canvasRuntime.zoom / 24)}px`;
  viewport.style.top = `${Math.max(0, -canvasRuntime.y / canvasRuntime.zoom / 24)}px`;
  viewport.style.width = `${Math.min(148, stage.clientWidth / canvasRuntime.zoom / 24)}px`;
  viewport.style.height = `${Math.min(92, stage.clientHeight / canvasRuntime.zoom / 24)}px`;
}

function zoomCanvas(delta, anchor = null) {
  const stage = $("#canvas-stage"); const rect = stage.getBoundingClientRect();
  const point = anchor || { x: rect.width / 2, y: rect.height / 2 };
  const previous = canvasRuntime.zoom;
  const next = Math.min(1.8, Math.max(0.25, previous * delta));
  const worldX = (point.x - canvasRuntime.x) / previous; const worldY = (point.y - canvasRuntime.y) / previous;
  canvasRuntime.zoom = next;
  canvasRuntime.x = point.x - worldX * next; canvasRuntime.y = point.y - worldY * next;
  applyCanvasTransform(); scheduleCanvasSave();
}

function fitCanvas() {
  const nodes = buildCanvasGraph(activeProject(), activeCreation()).nodes;
  const stage = $("#canvas-stage");
  if (!nodes.length) { canvasRuntime.x = 120; canvasRuntime.y = 90; canvasRuntime.zoom = 0.78; applyCanvasTransform(); return; }
  const minX = Math.min(...nodes.map(node => node.x)); const minY = Math.min(...nodes.map(node => node.y));
  const maxX = Math.max(...nodes.map(node => node.x + node.width)); const maxY = Math.max(...nodes.map(node => node.y + node.height));
  const zoom = Math.min(1, Math.max(0.28, Math.min((stage.clientWidth - 96) / (maxX - minX), (stage.clientHeight - 96) / (maxY - minY))));
  canvasRuntime.zoom = zoom; canvasRuntime.x = 48 - minX * zoom; canvasRuntime.y = 48 - minY * zoom;
  applyCanvasTransform(); scheduleCanvasSave();
}

function beginNodeDrag(event, nodeId) {
  if (event.button !== 0 || event.target.closest("audio")) return;
  event.stopPropagation();
  canvasRuntime.suppressClick = false;
  const creation = activeCreation(); const graphNode = buildCanvasGraph(activeProject(), creation).nodes.find(item => item.id === nodeId);
  canvasRuntime.dragging = { type: "node", nodeId, pointerId: event.pointerId, moved: false, startX: event.clientX, startY: event.clientY, originX: graphNode?.x || 0, originY: graphNode?.y || 0 };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function scheduleCanvasSave() {
  clearTimeout(canvasRuntime.saveTimer);
  canvasRuntime.saveTimer = setTimeout(saveCanvasState, 350);
}

async function saveCanvasState() {
  const creation = activeCreation(); if (!creation) return;
  const positions = { ...(creation.canvas?.positions || {}) };
  for (const node of $("#canvas-nodes").children) positions[node.dataset.nodeId] = { x: Math.round(parseFloat(node.style.left)), y: Math.round(parseFloat(node.style.top)) };
  const canvas = { viewport: { x: Math.round(canvasRuntime.x), y: Math.round(canvasRuntime.y), zoom: canvasRuntime.zoom }, positions };
  creation.canvas = canvas;
  try { await api(`/api/projects/${activeProjectId}/creations/${creation.id}`, { method: "PATCH", body: JSON.stringify({ canvas }) }); }
  catch (error) { toast(error.message, "error"); }
}

function renderStages(project) {
  const list = $("#stage-list"); list.replaceChildren();
  const current = Math.max(0, stageDefinitions.findIndex(([key]) => key === project.currentStage));
  stageDefinitions.forEach(([key, label], index) => list.append(el("li", { class: index < current ? "complete" : index === current ? "active" : "" }, el("span", { text: String(index + 1).padStart(2, "0") }), el("strong", { text: label }))));
}

function renderBrief(project) {
  $("#project-status").textContent = friendlyStatus(project.status);
  $("#project-summary").replaceChildren(el("h3", { text: project.title }), el("p", { text: project.script?.premise || project.logline || "尚未写入故事梗概。" }));
  const characters = $("#character-list"); characters.replaceChildren();
  for (const person of project.characters || []) characters.append(el("article", { class: "character-card" }, el("strong", { text: person.name }), el("p", { text: person.visual })));
  if (!project.characters?.length) characters.append(el("p", { class: "muted", text: "尚未建立角色锚点。" }));
}

function renderShots(project) {
  $("#shot-count").textContent = `${project.shots?.length || 0} 个镜头`;
  const board = $("#shot-board"); board.replaceChildren();
  for (const shot of project.shots || []) {
    const asset = [...project.assets].reverse().find(item => item.shotId === shot.id && item.kind === "image");
    board.append(el("article", { class: "shot-card" }, el("div", { class: "shot-media" }, asset ? el("img", { src: asset.mediaUrl, alt: "" }) : el("span", { text: "等待图片" }), el("b", { text: `SHOT ${String(shot.order).padStart(2, "0")}` })), el("div", { class: "shot-copy" }, el("header", {}, el("strong", { text: shot.scene }), el("span", { text: `${shot.framing} · ${shot.duration}s` })), el("p", { text: shot.prompt }), shot.subtitle ? el("blockquote", { text: shot.subtitle }) : null, el("small", { text: friendlyStatus(shot.status || "planned") }))));
  }
  if (!project.shots?.length) board.append(el("div", { class: "shot-empty" }, el("strong", { text: "还没有分镜" }), el("p", { text: "在 Codex 中描述创作目标后，剧本与镜头会同步到这里。" })));
}

function renderActivity(project) {
  const approvals = $("#approval-list"); approvals.replaceChildren();
  for (const approval of studioState.approvals.filter(item => item.projectId === project.id).slice(0, 4)) {
    const actions = el("div", { class: "card-actions" });
    if (approval.status === "pending") actions.append(el("button", { class: "button small primary", type: "button", onclick: () => decideApproval(approval.id, "approved") }, "批准"), el("button", { class: "button small subtle", type: "button", onclick: () => decideApproval(approval.id, "rejected") }, "拒绝"));
    if (approval.status === "approved" && !approval.jobId) actions.append(el("button", { class: "button small primary", type: "button", onclick: () => runApproval(approval.id) }, "执行批次"));
    approvals.append(el("article", { class: "activity-card" }, el("header", {}, el("strong", { text: "真实模型批次" }), el("span", { class: "status-chip", text: friendlyStatus(approval.status) })), el("p", { text: `视频上限 ${approval.maxVideoCalls} 次 · 已用 ${approval.usedVideoCalls}` }), actions));
  }
  const jobs = $("#job-list"); jobs.replaceChildren();
  for (const job of studioState.jobs.filter(item => item.projectId === project.id).slice(0, 5)) jobs.append(el("article", { class: "activity-card" }, el("header", {}, el("strong", { text: job.type === "local-render" ? "本地剪辑" : "模型生成" }), el("span", { class: "status-chip", text: friendlyStatus(job.status) })), el("p", { text: friendlyStage(job.stage) }), job.status === "waiting" ? el("button", { class: "button small subtle", type: "button", onclick: () => resumeJob(job.id) }, job.stage === "asset-bridge" ? "重新连接并续跑" : "续跑") : null));
  if (!approvals.children.length && !jobs.children.length) approvals.append(el("p", { class: "muted", text: "暂无任务与审批。" }));
  const events = $("#event-list"); events.replaceChildren();
  for (const event of studioState.events.filter(item => !item.detail?.projectId || item.detail.projectId === project.id).slice(0, 8)) events.append(el("li", {}, el("span", { text: event.message }), el("time", { text: formatDate(event.at) })));
}

function renderOutput(project) {
  const output = project.outputs?.[0]; const holder = $("#final-output"); holder.hidden = !output; holder.replaceChildren();
  if (output) holder.append(el("header", {}, el("strong", { text: "最终视频" }), el("a", { class: "button small subtle", href: output.mediaUrl, download: true, text: "下载 MP4" })), el("video", { src: output.mediaUrl, controls: true, preload: "metadata" }));
}

function renderSettings() {
  if (!studioState) return;
  const configured = studioState.credentialStatus?.arkConfigured;
  $("#credential-chip").textContent = configured ? "已安全保存" : "未配置";
  $("#credential-chip").className = `status-chip ${configured ? "success" : ""}`;
  $("#ark-api-key").placeholder = configured ? "••••••••••••••••" : "粘贴火山方舟 API Key";
  $("#save-key-button").textContent = configured ? "更换并保存" : "安全保存";
  $("#clear-key-button").disabled = !configured;
  const speechConfigured = studioState.credentialStatus?.speechConfigured === true;
  $("#speech-credential-chip").textContent = speechConfigured ? "已安全保存" : "未配置 · 可跳过";
  $("#speech-credential-chip").className = `status-chip ${speechConfigured ? "success" : ""}`;
  $("#speech-api-key").placeholder = speechConfigured ? "已保存，输入新密钥可更换" : "粘贴豆包语音 API Key（可选）";
  $("#save-speech-key-button").textContent = speechConfigured ? "更换并保存" : "安全保存";
  $("#clear-speech-key-button").disabled = !speechConfigured;
  $("#sound-strategy-title").textContent = speechConfigured ? "Seedance + 可选语音辅助" : "Seedance 原生声音";
  $("#sound-strategy-description").textContent = speechConfigured
    ? "视频和主要声音由 Seedance 生成；需要对白核对时用 ASR，需要独立旁白或补录时用 TTS。声音克隆与独立音乐生成暂未接入。"
    : "不调用独立语音服务。视频、对白和环境音由 Seedance 按创作方案生成，仍需实际听音与验片；不包含自动语音识别。";
  const bridge = studioState.assetBridge;
  $("#bridge-status").textContent = bridge?.ready ? "受控 HTTPS 桥已连接" : bridge?.configured ? "已配置，按需连接" : "按需自动连接";
}

function renderSkills() {
  const grid = $("#skill-grid");
  grid.replaceChildren();
  $("#skill-count").textContent = availableSkills.length;
  const query = skillSearch.trim().toLowerCase();
  const visible = availableSkills.filter(skill => {
    const matchesQuery = !query || `${skill.label} ${skill.name} ${skill.description}`.toLowerCase().includes(query);
    const matchesFilter = skillFilter === "all" || skillFilter === "disabled" ? skillFilter !== "disabled" || !skill.enabled : skill.source === skillFilter;
    return matchesQuery && matchesFilter;
  });
  for (const skill of visible) {
    const toggle = el("input", { type: "checkbox", checked: skill.enabled, "aria-label": `${skill.enabled ? "停用" : "启用"}${skill.label}`, onchange: event => setSkillEnabled(skill, event.currentTarget.checked) });
    const button = el("button", { class: "skill-card-main", type: "button", onclick: () => openSkillDetail(skill.name) },
      el("span", { class: "skill-card-copy" }, el("strong", { text: skill.label }), el("small", { text: skill.description }))
    );
    grid.append(el("article", { class: `skill-card ${skill.enabled ? "" : "disabled"}` }, button, el("label", { class: "toggle-label compact" }, toggle, el("span", { class: "toggle-ui" }))));
  }
  if (!visible.length) grid.append(el("div", { class: "empty-result" }, el("strong", { text: "没有匹配的 Skill" }), el("p", { text: "调整搜索词或筛选条件。" })));
}

async function setSkillEnabled(skill, enabled) {
  const previous = skill.enabled;
  skill.enabled = enabled;
  renderSkills();
  try {
    const response = await api(`/api/skills/${encodeURIComponent(skill.name)}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
    const index = availableSkills.findIndex(item => item.name === skill.name);
    if (index >= 0) availableSkills[index] = response.skill;
    if (activeSkillDetail?.skill?.name === skill.name) updateSkillDetailToggle(response.skill);
    renderSkills();
    toast(`${skill.label} 已${enabled ? "启用" : "停用"}。`, "success");
  } catch (error) {
    skill.enabled = previous;
    renderSkills();
    toast(error.message, "error");
  }
}

function updateSkillDetailToggle(skill) {
  $("#skill-detail-toggle").checked = Boolean(skill.enabled);
  $("#skill-detail-toggle-label").textContent = skill.enabled ? "已启用" : "已停用";
}

async function openSkillDetail(name, file = "SKILL.md") {
  try {
    const detail = await api(`/api/skills/${encodeURIComponent(name)}?file=${encodeURIComponent(file)}`);
    activeSkillDetail = detail;
    $("#skill-detail-origin").textContent = detail.skill.source === "built-in" ? "BUILT-IN SKILL" : "IMPORTED SKILL";
    $("#skill-detail-title").textContent = detail.skill.label;
    $("#skill-detail-description").textContent = detail.skill.description;
    $("#skill-selected-file").textContent = detail.selectedFile;
    $("#skill-file-content").textContent = detail.binary ? "该文件无法在此预览。" : detail.content;
    updateSkillDetailToggle(detail.skill);
    const tree = $("#skill-file-tree"); tree.replaceChildren();
    for (const item of detail.files) {
      if (item.type === "directory") tree.append(el("div", { class: "skill-tree-directory" }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("span", { text: item.path })));
      else tree.append(el("button", { class: item.path === detail.selectedFile ? "active" : "", type: "button", onclick: () => openSkillDetail(name, item.path) }, el("span", { text: "MD" }), el("strong", { text: item.path.split("/").pop() })));
    }
    if (!$("#skill-detail-dialog").open) $("#skill-detail-dialog").showModal();
  } catch (error) { toast(error.message, "error"); }
}

async function importSkill(event) {
  event.preventDefault();
  const file = $("#skill-file").files[0];
  if (!file) return;
  const submit = $("#skill-import-submit"); submit.disabled = true; submit.textContent = "安装中…"; $("#skill-import-error").textContent = "";
  try {
    const form = new FormData(); form.append("file", file);
    const response = await api("/api/skills/import", { method: "POST", body: form });
    $("#skill-import-dialog").close();
    $("#skill-import-form").reset(); $("#skill-file-name").textContent = "尚未选择文件";
    await refreshState({ quiet: true });
    toast(`${response.skill.label} 已导入并启用。`, "success");
  } catch (error) { $("#skill-import-error").textContent = error.message; }
  finally { submit.textContent = "安装"; submit.disabled = !$("#skill-file").files[0]; }
}

function acceptSkillFile(file) {
  if (!file) return;
  const transfer = new DataTransfer(); transfer.items.add(file); $("#skill-file").files = transfer.files;
  $("#skill-file-name").textContent = file.name; $("#skill-import-submit").disabled = false; $("#skill-import-error").textContent = "";
}

function openProjectDialog(mode, targetId = null, parentId = null) {
  projectDialogMode = mode; mutationTargetId = targetId; mutationParentId = parentId;
  const projectLookupId = mode === "rename-project" ? targetId : ["rename-creation", "rename-asset", "rename-folder", "create-creation"].includes(mode) ? (parentId || activeProjectId) : activeProjectId;
  const project = studioState?.projects.find(item => item.id === projectLookupId);
  const creation = project?.creations?.find(item => item.id === targetId);
  const asset = project?.assets?.find(item => item.id === targetId);
  const folder = project?.assetFolders?.find(item => item.id === targetId);
  const meta = mode === "rename-project"
    ? ["重命名项目", "保存名称", project?.title || "", "项目名称", "例如：品牌宣传片"]
    : mode === "rename-creation"
      ? ["重命名创作页", "保存名称", creation?.title || "", "创作页名称", "例如：15 秒产品开箱"]
      : mode === "rename-asset"
        ? ["重命名素材", "保存名称", asset?.originalName || "", "素材名称", "例如：角色母版.md"]
      : mode === "rename-folder"
        ? ["重命名文件夹", "保存名称", folder?.name || "", "文件夹名称", "例如：角色与场景"]
      : mode === "create-creation"
        ? ["新建创作页", "创建创作页", "", "创作页名称", "例如：KOC 口播第一版"]
        : mode === "create-world"
          ? ["新建分卷 / 季度", "创建分卷 / 季度", "", "分卷 / 季度名称", "例如：第一卷 · 九龙城寨"]
        : mode === "create-folder"
          ? ["新建文件夹", "创建文件夹", "", "文件夹名称", "例如：原作与设定"]
          : ["新建项目", "创建项目", "", "项目名称", "例如：秋季新品宣传片"];
  $("#project-dialog-title").textContent = meta[0]; $("#project-submit").textContent = meta[1]; $("#project-name").value = meta[2]; $("#project-name-label").textContent = meta[3]; $("#project-name").placeholder = meta[4]; $("#project-form-error").textContent = "";
  $("#creation-meta-fields").hidden = mode !== "create-creation";
  if (mode === "create-creation") {
    const worldSelect = $("#creation-world");
    worldSelect.replaceChildren(el("option", { value: "", text: "系列级 / 不属于具体分卷或季度" }), ...(project?.worlds || []).map(world => el("option", { value: world.id, text: world.title })));
    worldSelect.value = project?.worlds?.some(world => world.id === activeWorldId) ? activeWorldId : "";
    $("#creation-type").value = worldSelect.value ? "episode" : "series-control";
  }
  $("#project-dialog").showModal(); setTimeout(() => $("#project-name").focus(), 30);
}

function openDeleteDialog(type, projectId, creationId = null) {
  const isChild = ["creation", "asset", "folder"].includes(type);
  deleteTargetType = type; mutationParentId = isChild ? projectId : null; mutationTargetId = isChild ? creationId : projectId;
  const project = studioState.projects.find(item => item.id === projectId);
  const target = type === "creation" ? project?.creations?.find(item => item.id === creationId) : type === "asset" ? project?.assets?.find(item => item.id === creationId) : type === "folder" ? project?.assetFolders?.find(item => item.id === creationId) : project;
  const labels = { creation: "创作页", asset: "素材", folder: "文件夹", project: "项目" }; const label = labels[type] || "项目";
  $("#delete-dialog-title").textContent = `删除${label}？`;
  const targetName = target?.title || target?.originalName || target?.name || "";
  const explanation = type === "asset" ? "将从项目中移除并放入本机回收区；被锁定引用的素材不能删除。" : type === "folder" ? "只能删除不含子文件夹和素材的空文件夹。" : type === "creation" ? "创作页会从项目中移除，项目素材保持不变。" : "项目会从界面移除，并保留在本机回收目录。";
  $("#delete-dialog-copy").replaceChildren(`${label}${explanation}确认删除“`, el("strong", { id: "delete-target-name", text: targetName }), "”吗？");
  $("#delete-submit").textContent = `删除${label}`;
  $("#delete-dialog").showModal();
}

async function submitProjectForm(event) {
  event.preventDefault(); const title = $("#project-name").value.trim();
  if (!title) { $("#project-form-error").textContent = "请输入名称。"; return; }
  try {
    if (projectDialogMode === "rename-project") await api(`/api/projects/${mutationTargetId}`, { method: "PATCH", body: JSON.stringify({ title }) });
    else if (projectDialogMode === "rename-creation") await api(`/api/projects/${mutationParentId}/creations/${mutationTargetId}`, { method: "PATCH", body: JSON.stringify({ title }) });
    else if (projectDialogMode === "rename-asset") await api(`/api/projects/${mutationParentId}/assets/${mutationTargetId}`, { method: "PATCH", body: JSON.stringify({ originalName: title }) });
    else if (projectDialogMode === "rename-folder") await api(`/api/projects/${mutationParentId}/asset-folders/${mutationTargetId}`, { method: "PATCH", body: JSON.stringify({ name: title }) });
    else if (projectDialogMode === "create-creation") { const projectId = mutationParentId || activeProjectId; const result = await api(`/api/projects/${projectId}/creations`, { method: "POST", body: JSON.stringify({ title, worldId: $("#creation-world").value || null, type: $("#creation-type").value }) }); activeProjectId = projectId; activeCreationId = result.creation.id; activeWorldId = result.creation.worldId || "series"; }
    else if (projectDialogMode === "create-world") { const projectId = mutationParentId || activeProjectId; const result = await api(`/api/projects/${projectId}/worlds`, { method: "POST", body: JSON.stringify({ title }) }); activeProjectId = projectId; activeWorldId = result.world.id; }
    else if (projectDialogMode === "create-folder") await api(`/api/projects/${activeProjectId}/asset-folders`, { method: "POST", body: JSON.stringify({ name: title, parentId: mutationParentId || null }) });
    else { const result = await api("/api/projects", { method: "POST", body: JSON.stringify({ title }) }); activeProjectId = result.project.id; }
    $("#project-dialog").close(); await refreshState();
    if (projectDialogMode === "create-project") go("project");
    else if (projectDialogMode === "create-creation") go("workspace");
    else if (projectDialogMode === "create-world") { go("project"); toast("分卷 / 季度已创建，并生成独立的标准素材目录。", "success"); }
    else { go(currentRoute()); if (projectDialogMode === "create-folder") { activeProjectTab = "assets"; renderProjectOverview(); toast("文件夹已创建。", "success"); } }
  } catch (error) { $("#project-form-error").textContent = error.message; }
}

async function deleteTarget(event) {
  event.preventDefault();
  try {
    if (deleteTargetType === "creation") {
      await api(`/api/projects/${mutationParentId}/creations/${mutationTargetId}`, { method: "DELETE" });
      if (activeCreationId === mutationTargetId) activeCreationId = null;
      $("#delete-dialog").close(); await refreshState(); go("project"); toast("创作页已删除，项目素材保持不变。", "success");
    } else if (deleteTargetType === "asset") {
      await api(`/api/projects/${mutationParentId}/assets/${mutationTargetId}`, { method: "DELETE" }); $("#delete-dialog").close(); await refreshState({ quiet: true }); activeProjectTab = "assets"; renderProjectOverview(); toast("素材已移入本机回收区。", "success");
    } else if (deleteTargetType === "folder") {
      await api(`/api/projects/${mutationParentId}/asset-folders/${mutationTargetId}`, { method: "DELETE" }); $("#delete-dialog").close(); await refreshState({ quiet: true }); activeProjectTab = "assets"; renderProjectOverview(); toast("空文件夹已删除。", "success");
    } else {
      await api(`/api/projects/${mutationTargetId}`, { method: "DELETE" }); $("#delete-dialog").close(); activeProjectId = null; await refreshState(); go("project-library"); toast("项目已移入本机回收目录。", "success");
    }
  }
  catch (error) { toast(error.message, "error"); }
}

async function importAssets(files, targetFolderId = activeAssetFolderId) {
  const project = activeProject(); if (!project || !files.length) return;
  try { for (const file of files) { const form = new FormData(); form.append("projectId", project.id); form.append("folderId", targetFolderId || ""); form.append("file", file); await api("/api/assets/import", { method: "POST", body: form }); } $("#asset-file").value = ""; await refreshState({ quiet: true }); activeProjectTab = "assets"; renderProjectOverview(); toast(`已导入 ${files.length} 个素材。`, "success"); }
  catch (error) { toast(error.message, "error"); }
}

async function saveEditedAsset(event) {
  event.preventDefault(); if (!activeEditorAssetId) return;
  const submit = $("#asset-editor-submit"); submit.disabled = true; submit.textContent = "保存中…"; $("#asset-editor-error").textContent = "";
  try {
    await api(`/api/projects/${activeProjectId}/assets/${activeEditorAssetId}/content`, { method: "PUT", body: JSON.stringify({ content: $("#asset-editor-content").value }) });
    $("#asset-editor-dialog").close(); await refreshState({ quiet: true }); activeProjectTab = "assets"; renderProjectOverview(); toast("已保存为新版本，旧版本与既有引用保持不变。", "success");
  } catch (error) { $("#asset-editor-error").textContent = error.message; }
  finally { submit.disabled = false; submit.textContent = "保存为新版本"; }
}

async function submitAssetMove(event) {
  event.preventDefault(); if (!assetMoveTarget) return;
  const folderId = $("#asset-move-target").value || null;
  try {
    if (assetMoveTarget.type === "asset") await api(`/api/projects/${activeProjectId}/assets/${assetMoveTarget.id}`, { method: "PATCH", body: JSON.stringify({ folderId }) });
    else await api(`/api/projects/${activeProjectId}/asset-folders/${assetMoveTarget.id}`, { method: "PATCH", body: JSON.stringify({ parentId: folderId }) });
    $("#asset-move-dialog").close(); assetMoveTarget = null; await refreshState({ quiet: true }); activeProjectTab = "assets"; renderProjectOverview(); toast("已移动到目标文件夹。", "success");
  } catch (error) { $("#asset-move-error").textContent = error.message; }
}

async function decideApproval(id, decision) { try { await api(`/api/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision }) }); await refreshState(); } catch (error) { toast(error.message, "error"); } }
async function runApproval(id) { try { await api(`/api/approvals/${id}/run`, { method: "POST", body: "{}" }); await refreshState(); } catch (error) { toast(error.message, "error"); } }
async function resumeJob(id) { try { await api(`/api/jobs/${id}/resume`, { method: "POST", body: "{}" }); await refreshState(); } catch (error) { toast(error.message, "error"); } }

function friendlyStatus(value) { return ({ draft: "草稿", ready: "分镜就绪", rendered: "已成片", planned: "待制作", pending: "待审批", approved: "已批准", rejected: "已拒绝", queued: "排队中", running: "执行中", waiting: "等待续跑", succeeded: "已完成", failed: "失败", "video-ready": "视频就绪", "video-running": "生成中" })[value] || value || "待制作"; }
function friendlyStage(stage) { return ({ queued: "等待开始", images: "准备图片素材", "codex-images": "等待 Codex 图片回填", "asset-bridge": "正在建立受控 HTTPS 图片桥", videos: "生成 Seedance 视频", "videos-ready": "视频镜头已就绪", clips: "标准化镜头", render: "合成声音与字幕", complete: "成片完成", failed: "任务停止" })[stage] || String(stage || "准备中").replace(/^video-(\d+)-/, "镜头 $1："); }
function formatDate(value) { if (!value) return ""; return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function formatTime(value) { if (!value) return ""; return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

$("#project-form").addEventListener("submit", submitProjectForm);
$("#delete-form").addEventListener("submit", deleteTarget);
$$('[data-close-dialog]').forEach(button => button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close()));
$$('[data-action="create-project"]').forEach(button => button.addEventListener("click", () => openProjectDialog("create-project")));
$$('[data-route]').forEach(button => button.addEventListener("click", () => go(button.dataset.route)));
$("#workspace-project-link").addEventListener("click", () => go("project"));
$("#workspace-world-link").addEventListener("click", () => { activeWorldId = activeCreation()?.worldId || "series"; go("project"); });
$("#new-creation-button").addEventListener("click", () => openProjectDialog("create-creation"));
$("#new-world-button").addEventListener("click", () => openProjectDialog("create-world", null, activeProjectId));
$("#creations-tab").addEventListener("click", () => { activeProjectTab = "creations"; renderProjectOverview(); });
$("#assets-tab").addEventListener("click", () => { activeProjectTab = "assets"; renderProjectOverview(); });
$("#new-asset-folder-button").addEventListener("click", () => openProjectDialog("create-folder", null, activeAssetFolderId));
$("#asset-file").addEventListener("change", event => importAssets([...event.target.files]));
$("#asset-grid").addEventListener("dragover", event => { event.preventDefault(); event.currentTarget.classList.add("drop-target"); });
$("#asset-grid").addEventListener("dragleave", event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove("drop-target"); });
$("#asset-grid").addEventListener("drop", event => { event.preventDefault(); event.currentTarget.classList.remove("drop-target"); const assetId = event.dataTransfer.getData("application/x-opendrama-asset"); if (assetId) moveAssetToFolder(assetId, activeAssetFolderId); else importAssets([...event.dataTransfer.files], activeAssetFolderId); });
$("#asset-search").addEventListener("input", () => renderAssets(activeProject()));
$("#asset-list-button").addEventListener("click", () => { assetViewMode = "list"; renderAssets(activeProject()); });
$("#asset-grid-button").addEventListener("click", () => { assetViewMode = "grid"; renderAssets(activeProject()); });
$("#asset-refresh-button").addEventListener("click", () => refreshState({ quiet: true }));
$("#asset-preview-edit").addEventListener("click", () => openAssetEditor(activePreviewAssetId));
$("#asset-preview-reveal").addEventListener("click", () => { if (activePreviewAssetId) api(`/api/projects/${activeProjectId}/assets/${activePreviewAssetId}/reveal`, { method: "POST", body: "{}" }).catch(error => toast(error.message, "error")); });
$("#asset-preview-dialog").addEventListener("close", () => {
  $$("#asset-preview-body video, #asset-preview-body audio").forEach(media => media.pause());
  $("#asset-preview-body").replaceChildren();
  activePreviewAssetId = null;
});
$("#asset-editor-form").addEventListener("submit", saveEditedAsset);
$("#asset-move-form").addEventListener("submit", submitAssetMove);
$("#project-search").addEventListener("input", event => { projectSearch = event.target.value; renderLibrary(); });
$("#library-sort-button").addEventListener("click", () => { $("#library-sort-menu").hidden = !$("#library-sort-menu").hidden; });
$("#sidebar-sort-button").addEventListener("click", () => { $("#sidebar-sort-menu").hidden = !$("#sidebar-sort-menu").hidden; });
$$('[data-sort]').forEach(button => button.addEventListener("click", () => { projectSort = button.dataset.sort; $("#library-sort-label").textContent = sortLabels[projectSort]; $("#library-sort-menu").hidden = true; $("#sidebar-sort-menu").hidden = true; renderLibrary(); }));
$("#settings-button").addEventListener("click", () => $("#settings-dialog").showModal());
$("#start-settings-button").addEventListener("click", () => $("#settings-dialog").showModal());
$("#import-skill-button").addEventListener("click", () => $("#skill-import-dialog").showModal());
$("#skill-import-form").addEventListener("submit", importSkill);
$("#skill-file").addEventListener("change", event => { const file = event.target.files[0]; $("#skill-file-name").textContent = file?.name || "尚未选择文件"; $("#skill-import-submit").disabled = !file; $("#skill-import-error").textContent = ""; });
$("#skill-dropzone").addEventListener("dragover", event => { event.preventDefault(); event.currentTarget.classList.add("dragging"); });
$("#skill-dropzone").addEventListener("dragleave", event => event.currentTarget.classList.remove("dragging"));
$("#skill-dropzone").addEventListener("drop", event => { event.preventDefault(); event.currentTarget.classList.remove("dragging"); acceptSkillFile(event.dataTransfer.files[0]); });
$("#skill-search").addEventListener("input", event => { skillSearch = event.target.value; renderSkills(); });
$$("[data-skill-filter]").forEach(button => button.addEventListener("click", () => { skillFilter = button.dataset.skillFilter; $$("[data-skill-filter]").forEach(item => item.classList.toggle("active", item === button)); renderSkills(); }));
$("#skill-detail-toggle").addEventListener("change", event => { if (activeSkillDetail?.skill) setSkillEnabled(activeSkillDetail.skill, event.currentTarget.checked); });
for (const config of [
  { name: "方舟", key: "ark", input: "ark-api-key", form: "credential-form", toggle: "secret-toggle", error: "ark-key-error", save: "save-key-button", clear: "clear-key-button" },
  { name: "豆包语音", key: "speech", input: "speech-api-key", form: "speech-credential-form", toggle: "speech-secret-toggle", error: "speech-key-error", save: "save-speech-key-button", clear: "clear-speech-key-button" }
]) {
  const resetField = () => { $(`#${config.input}`).value = ""; $(`#${config.input}`).type = "password"; $(`#${config.toggle}`).textContent = "显示"; $(`#${config.toggle}`).setAttribute("aria-pressed", "false"); $(`#${config.toggle}`).setAttribute("aria-label", `显示${config.name}密钥`); $(`#${config.error}`).textContent = ""; };
  $(`#${config.toggle}`).addEventListener("click", event => {
    const input = $(`#${config.input}`); input.type = input.type === "password" ? "text" : "password";
    const visible = input.type === "text"; event.currentTarget.textContent = visible ? "隐藏" : "显示";
    event.currentTarget.setAttribute("aria-pressed", String(visible)); event.currentTarget.setAttribute("aria-label", `${visible ? "隐藏" : "显示"}${config.name}密钥`);
  });
  $(`#${config.form}`).addEventListener("submit", async event => {
    event.preventDefault(); const input = $(`#${config.input}`); const apiKey = input.value.trim();
    if (apiKey.length < 12 || apiKey.length > 512 || /\s/.test(apiKey)) { $(`#${config.error}`).textContent = "密钥格式不正确，请检查空格和完整性。"; return; }
    const button = $(`#${config.save}`); button.disabled = true;
    try { await api(`/api/secrets/${config.key}`, { method: "PUT", body: JSON.stringify({ apiKey }) }); resetField(); await refreshState(); toast(`${config.name}密钥已安全保存，服务权限需通过实际调用确认。`, "success"); }
    catch { $(`#${config.error}`).textContent = "保存失败，请确认工作台服务正常后重试。"; }
    finally { button.disabled = false; }
  });
  $(`#${config.clear}`).addEventListener("click", async () => {
    try { await api(`/api/secrets/${config.key}`, { method: "DELETE" }); resetField(); await refreshState(); toast(`已清除${config.name}密钥。`, "success"); }
    catch { $(`#${config.error}`).textContent = "清除失败，请检查工作台服务。"; }
  });
  $("#settings-dialog").addEventListener("close", resetField);
}
$("#canvas-zoom-in").addEventListener("click", () => zoomCanvas(1.15));
$("#canvas-zoom-out").addEventListener("click", () => zoomCanvas(1 / 1.15));
$("#canvas-fit").addEventListener("click", fitCanvas);
$("#canvas-minimap-toggle").addEventListener("click", event => { event.currentTarget.classList.toggle("active"); $("#canvas-minimap").hidden = !event.currentTarget.classList.contains("active"); });
$("#canvas-stage").addEventListener("pointerdown", event => {
  const leftBlank = event.button === 0 && !event.target.closest(".canvas-node");
  const middlePan = event.button === 1;
  if ((!leftBlank && !middlePan) || event.target.closest(".canvas-minimap")) return;
  event.preventDefault();
  canvasRuntime.suppressClick = false;
  canvasRuntime.dragging = { type: "pan", pointerId: event.pointerId, moved: false, startX: event.clientX, startY: event.clientY, originX: canvasRuntime.x, originY: canvasRuntime.y };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.classList.add("panning");
});
$("#canvas-stage").addEventListener("pointermove", event => {
  const drag = canvasRuntime.dragging; if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
  drag.moved = true;
  if (drag.type === "pan") { canvasRuntime.x = drag.originX + event.clientX - drag.startX; canvasRuntime.y = drag.originY + event.clientY - drag.startY; applyCanvasTransform(); }
  if (drag.type === "node") {
    const node = $(`[data-node-id="${CSS.escape(drag.nodeId)}"]`); if (!node) return;
    const x = drag.originX + (event.clientX - drag.startX) / canvasRuntime.zoom; const y = drag.originY + (event.clientY - drag.startY) / canvasRuntime.zoom;
    node.style.left = `${Math.round(x)}px`; node.style.top = `${Math.round(y)}px`;
    activeCreation().canvas ||= { viewport: {}, positions: {} }; activeCreation().canvas.positions ||= {}; activeCreation().canvas.positions[drag.nodeId] = { x: Math.round(x), y: Math.round(y) };
    drawCanvasEdges(buildCanvasGraph(activeProject(), activeCreation()));
  }
});
$("#canvas-stage").addEventListener("pointerup", event => {
  const drag = canvasRuntime.dragging; if (!drag || event.pointerId !== drag.pointerId) return;
  canvasRuntime.suppressClick = drag.moved || drag.type === "pan";
  canvasRuntime.dragging = null; event.currentTarget.classList.remove("panning");
  if (drag.moved) scheduleCanvasSave();
});
$("#canvas-stage").addEventListener("pointercancel", event => { canvasRuntime.suppressClick = true; canvasRuntime.dragging = null; event.currentTarget.classList.remove("panning"); });
$("#canvas-stage").addEventListener("auxclick", event => { if (event.button === 1) event.preventDefault(); });
$("#canvas-stage").addEventListener("wheel", event => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); if (event.ctrlKey) zoomCanvas(event.deltaY < 0 ? 1.1 : 1 / 1.1, { x: event.clientX - rect.left, y: event.clientY - rect.top }); else { canvasRuntime.x -= event.deltaX; canvasRuntime.y -= event.deltaY; applyCanvasTransform(); scheduleCanvasSave(); } }, { passive: false });
$("#canvas-stage").addEventListener("dragover", event => { event.preventDefault(); event.currentTarget.classList.add("file-dragging"); });
$("#canvas-stage").addEventListener("dragleave", event => event.currentTarget.classList.remove("file-dragging"));
$("#canvas-stage").addEventListener("drop", event => { event.preventDefault(); event.currentTarget.classList.remove("file-dragging"); importCanvasAssets([...event.dataTransfer.files]); });
window.addEventListener("hashchange", () => { applyRoute(); if (currentRoute() === "workspace") renderWorkspace(); });
document.addEventListener("click", event => { if (!event.target.closest(".sidebar-creation-row")) $$('[data-creation-menu]').forEach(menu => { menu.hidden = true; }); if (!event.target.closest(".sort-control")) $("#library-sort-menu").hidden = true; if (!event.target.closest(".sidebar-project-section")) $("#sidebar-sort-menu").hidden = true; if (!event.target.closest("#asset-context-menu") && !event.target.closest(".asset-more-button")) closeAssetContextMenu(); });
window.addEventListener("blur", closeAssetContextMenu);

refreshState();
