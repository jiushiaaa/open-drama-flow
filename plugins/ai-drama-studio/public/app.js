const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const stageDefinitions = [["story", "故事"], ["characters", "角色"], ["storyboard", "分镜"], ["assets", "素材"], ["videos", "视频"], ["final", "成片"]];
const sortLabels = { updated: "最近更新", created: "最近创建", title: "名称顺序" };

let studioState = null;
let activeProjectId = null;
let activeCreationId = null;
let activeProjectTab = "creations";
let projectSort = "updated";
let projectSearch = "";
let projectDialogMode = "create-project";
let mutationTargetId = null;
let pollTimer = null;
let availableSkills = [];
let skillSearch = "";
let skillFilter = "all";
let activeSkillDetail = null;

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
function currentRoute() { return ["project-library", "project", "workspace", "skills", "project-guide"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "project-library"; }
function go(route) { location.hash = route; }

function sortedProjects() {
  const items = [...(studioState?.projects || [])].filter(item => item.title.toLowerCase().includes(projectSearch.toLowerCase()));
  return items.sort((a, b) => projectSort === "title" ? a.title.localeCompare(b.title, "zh-CN") : new Date(projectSort === "created" ? b.createdAt : b.updatedAt) - new Date(projectSort === "created" ? a.createdAt : a.updatedAt));
}

async function refreshState({ quiet = false } = {}) {
  try {
    const [stateResponse, skillResponse] = await Promise.all([api("/api/state"), api("/api/skills")]);
    studioState = stateResponse;
    availableSkills = skillResponse.skills || [];
    if (!activeProjectId || !studioState.projects.some(project => project.id === activeProjectId)) activeProjectId = studioState.projects[0]?.id || null;
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
  renderWorkspace();
  renderSettings();
  renderSkills();
  applyRoute();
}

function applyRoute() {
  let route = currentRoute();
  if (!activeProject() && ["project", "workspace"].includes(route)) route = "project-library";
  const routeViewIds = { "project-library": "project-library-view", project: "project-overview-view", workspace: "workspace-view", skills: "skills-view", "project-guide": "project-guide-view" };
  $$(".route-view").forEach(view => { view.hidden = view.id !== routeViewIds[route]; });
  $$(".primary-nav a").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${route}` || (route === "project" && link.getAttribute("href") === "#project-library") || (route === "workspace" && link.getAttribute("href") === "#project-library")));
  document.title = `${route === "project-library" ? "项目库" : activeProject()?.title || "OpenDramaFlow"} — OpenDramaFlow`;
}

function renderSidebar() {
  const container = $("#sidebar-projects");
  container.replaceChildren();
  const projects = [...(studioState?.projects || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (!projects.length) container.append(el("p", { class: "sidebar-empty", text: "暂无项目" }));
  for (const project of projects) container.append(el("button", { class: project.id === activeProjectId ? "active" : "", type: "button", onclick: () => openProject(project.id) }, el("img", { src: "/icons/folder-kanban.svg", alt: "" }), el("span", { text: project.title })));
}

function projectCover(project) {
  const image = [...(project.assets || [])].reverse().find(asset => asset.kind === "image");
  return image?.mediaUrl || "/assets/project-cover-rain-station.png";
}

function renderLibrary() {
  const grid = $("#project-library-grid");
  grid.replaceChildren();
  for (const project of sortedProjects()) {
    const card = el("article", { class: "project-card", tabindex: "0" },
      el("button", { class: "project-card-main", type: "button", onclick: () => openProject(project.id) },
        el("div", { class: "project-cover" }, el("img", { src: projectCover(project), alt: "" })),
        el("div", { class: "project-card-copy" }, el("strong", { text: project.title }), el("time", { datetime: project.updatedAt, text: formatDate(project.updatedAt) }), el("small", { text: `${project.creations?.length || 0} 个创作页 · ${project.assets?.length || 0} 项素材` }))
      ),
      el("button", { class: "card-more", type: "button", "aria-label": `管理 ${project.title}`, onclick: event => toggleProjectMenu(event, project.id) }, el("img", { src: "/icons/ellipsis.svg", alt: "" })),
      projectMenu(project)
    );
    grid.append(card);
  }
  if (!projectSearch) grid.append(el("button", { class: "new-project-tile", type: "button", onclick: () => openProjectDialog("create-project") }, el("img", { src: "/icons/folder-plus.svg", alt: "" }), el("strong", { text: studioState?.projects.length ? "新建项目" : "新建第一个项目" }), el("span", { text: "从空白本地项目开始" })));
  else if (!sortedProjects().length) grid.append(el("div", { class: "empty-result" }, el("strong", { text: "没有匹配的项目" }), el("p", { text: "换一个关键词试试。" })));
}

function projectMenu(project) {
  return el("div", { class: "project-menu", "data-project-menu": project.id, hidden: true },
    el("button", { type: "button", onclick: () => openProjectDialog("rename-project", project.id) }, el("img", { src: "/icons/pencil.svg", alt: "" }), "重命名"),
    el("button", { class: "danger-text", type: "button", onclick: () => openDeleteDialog(project.id) }, el("img", { src: "/icons/trash-2.svg", alt: "" }), "删除")
  );
}

function toggleProjectMenu(event, projectId) {
  event.stopPropagation();
  $$('[data-project-menu]').forEach(menu => { menu.hidden = menu.dataset.projectMenu !== projectId || !menu.hidden; });
}

function openProject(projectId) {
  activeProjectId = projectId;
  activeCreationId = activeProject()?.creations?.[0]?.id || null;
  activeProjectTab = "creations";
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
  const creations = $("#creation-grid");
  creations.replaceChildren();
  for (const creation of project.creations || []) creations.append(el("button", { class: "creation-card", type: "button", onclick: () => openWorkspace(creation.id) }, el("div", { class: "creation-art" }, el("img", { src: projectCover(project), alt: "" }), el("span", {}, el("img", { src: "/icons/message-square.svg", alt: "" }), friendlyStatus(creation.status))), el("strong", { text: creation.title }), el("time", { datetime: creation.updatedAt, text: formatDate(creation.updatedAt) })));
  if (!project.creations?.length) creations.append(el("button", { class: "new-project-tile creation-empty", type: "button", onclick: () => openProjectDialog("create-creation") }, el("img", { src: "/icons/message-square.svg", alt: "" }), el("strong", { text: "新建创作页" }), el("span", { text: "一个项目可以保存多个创作会话" })));
  renderAssets(project);
}

function renderAssets(project) {
  const query = $("#asset-search")?.value?.trim().toLowerCase() || "";
  const grid = $("#asset-grid");
  grid.replaceChildren();
  const assets = (project.assets || []).filter(asset => String(asset.originalName || asset.shotId || "").toLowerCase().includes(query));
  for (const asset of assets) grid.append(el("article", { class: "asset-card" }, asset.kind === "image" ? el("img", { src: asset.mediaUrl, alt: asset.originalName || "项目图片素材" }) : el("video", { src: asset.mediaUrl, muted: true, preload: "metadata" }), el("div", {}, el("strong", { text: asset.originalName || (asset.kind === "image" ? "生成图片" : "视频镜头") }), el("small", { text: `${asset.provider} · ${formatDate(asset.createdAt)}` }), el("span", { class: `source-badge ${asset.remoteSourceType === "local" ? "local" : "ready"}`, text: asset.remoteSourceType === "local" ? "本地" : "Seedance 可用" }))));
  if (!assets.length) grid.append(el("div", { class: "asset-empty" }, el("img", { src: "/icons/images.svg", alt: "" }), el("strong", { text: "还没有项目资产" }), el("p", { text: "Codex Image Gen 生成的图片和导入文件会自动出现在这里。" })));
}

function openWorkspace(creationId) { activeCreationId = creationId; renderWorkspace(); go("workspace"); }

function renderWorkspace() {
  const project = activeProject();
  if (!project) return;
  const creation = project.creations?.find(item => item.id === activeCreationId) || project.creations?.[0];
  $("#workspace-project-link").textContent = project.title;
  $("#workspace-creation-title").textContent = creation?.title || "主创作页";
  $("#workspace-title").textContent = creation?.title || project.title;
  $("#workspace-logline").textContent = project.logline || "等待 Codex 写入正式故事与分镜。";
  renderStages(project); renderBrief(project); renderShots(project); renderActivity(project); renderOutput(project);
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
  $("#request-real-button").disabled = !project.shots?.length;
  $("#render-button").disabled = !project.shots?.length || studioState.jobs.some(job => job.projectId === project.id && ["queued", "running"].includes(job.status));
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
      el("span", { class: "skill-card-icon" }, el("img", { src: "/assets/studio-pixel-icon.png", alt: "" })),
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

function openProjectDialog(mode, targetId = null) {
  projectDialogMode = mode; mutationTargetId = targetId;
  const project = studioState?.projects.find(item => item.id === targetId);
  const meta = mode === "rename-project" ? ["重命名项目", "保存名称", project?.title || ""] : mode === "create-creation" ? ["新建创作页", "创建创作页", ""] : ["新建项目", "创建项目", ""];
  $("#project-dialog-title").textContent = meta[0]; $("#project-submit").textContent = meta[1]; $("#project-name").value = meta[2]; $("#project-form-error").textContent = "";
  $("#project-dialog").showModal(); setTimeout(() => $("#project-name").focus(), 30);
}

function openDeleteDialog(projectId) { mutationTargetId = projectId; $("#delete-project-name").textContent = studioState.projects.find(item => item.id === projectId)?.title || ""; $("#delete-dialog").showModal(); }

async function submitProjectForm(event) {
  event.preventDefault(); const title = $("#project-name").value.trim();
  if (!title) { $("#project-form-error").textContent = "请输入名称。"; return; }
  try {
    if (projectDialogMode === "rename-project") await api(`/api/projects/${mutationTargetId}`, { method: "PATCH", body: JSON.stringify({ title }) });
    else if (projectDialogMode === "create-creation") { const result = await api(`/api/projects/${activeProjectId}/creations`, { method: "POST", body: JSON.stringify({ title }) }); activeCreationId = result.creation.id; }
    else { const result = await api("/api/projects", { method: "POST", body: JSON.stringify({ title }) }); activeProjectId = result.project.id; }
    $("#project-dialog").close(); await refreshState(); go(projectDialogMode === "create-project" ? "project" : currentRoute());
  } catch (error) { $("#project-form-error").textContent = error.message; }
}

async function deleteProject(event) {
  event.preventDefault();
  try { await api(`/api/projects/${mutationTargetId}`, { method: "DELETE" }); $("#delete-dialog").close(); activeProjectId = null; await refreshState(); go("project-library"); toast("项目已移入本机回收目录。", "success"); }
  catch (error) { toast(error.message, "error"); }
}

async function importAssets(files) {
  const project = activeProject(); if (!project || !files.length) return;
  try { for (const file of files) { const form = new FormData(); form.append("projectId", project.id); form.append("file", file); await api("/api/assets/import", { method: "POST", body: form }); } await refreshState(); toast(`已导入 ${files.length} 个素材。`, "success"); }
  catch (error) { toast(error.message, "error"); }
}

async function decideApproval(id, decision) { try { await api(`/api/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision }) }); await refreshState(); } catch (error) { toast(error.message, "error"); } }
async function runApproval(id) { try { await api(`/api/approvals/${id}/run`, { method: "POST", body: "{}" }); await refreshState(); } catch (error) { toast(error.message, "error"); } }
async function resumeJob(id) { try { await api(`/api/jobs/${id}/resume`, { method: "POST", body: "{}" }); await refreshState(); } catch (error) { toast(error.message, "error"); } }

function friendlyStatus(value) { return ({ draft: "草稿", ready: "分镜就绪", rendered: "已成片", planned: "待制作", pending: "待审批", approved: "已批准", rejected: "已拒绝", queued: "排队中", running: "执行中", waiting: "等待续跑", succeeded: "已完成", failed: "失败", "video-ready": "视频就绪", "video-running": "生成中" })[value] || value || "待制作"; }
function friendlyStage(stage) { return ({ queued: "等待开始", images: "准备图片素材", "codex-images": "等待 Codex 图片回填", "asset-bridge": "正在建立受控 HTTPS 图片桥", videos: "生成 Seedance 视频", "videos-ready": "视频镜头已就绪", clips: "标准化镜头", render: "合成声音与字幕", complete: "成片完成", failed: "任务停止" })[stage] || String(stage || "准备中").replace(/^video-(\d+)-/, "镜头 $1："); }
function formatDate(value) { if (!value) return ""; return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }

$("#project-form").addEventListener("submit", submitProjectForm);
$("#delete-form").addEventListener("submit", deleteProject);
$$('[data-close-dialog]').forEach(button => button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close()));
$$('[data-action="create-project"]').forEach(button => button.addEventListener("click", () => openProjectDialog("create-project")));
$$('[data-route]').forEach(button => button.addEventListener("click", () => go(button.dataset.route)));
$("#workspace-project-link").addEventListener("click", () => go("project"));
$("#new-creation-button").addEventListener("click", () => openProjectDialog("create-creation"));
$("#creations-tab").addEventListener("click", () => { activeProjectTab = "creations"; renderProjectOverview(); });
$("#assets-tab").addEventListener("click", () => { activeProjectTab = "assets"; renderProjectOverview(); });
$("#asset-file").addEventListener("change", event => importAssets([...event.target.files]));
$("#asset-search").addEventListener("input", () => renderAssets(activeProject()));
$("#project-search").addEventListener("input", event => { projectSearch = event.target.value; renderLibrary(); });
$("#library-sort-button").addEventListener("click", () => { $("#library-sort-menu").hidden = !$("#library-sort-menu").hidden; });
$("#sidebar-sort-button").addEventListener("click", () => { $("#sidebar-sort-menu").hidden = !$("#sidebar-sort-menu").hidden; });
$$('[data-sort]').forEach(button => button.addEventListener("click", () => { projectSort = button.dataset.sort; $("#library-sort-label").textContent = sortLabels[projectSort]; $("#library-sort-menu").hidden = true; $("#sidebar-sort-menu").hidden = true; renderLibrary(); }));
$("#settings-button").addEventListener("click", () => $("#settings-dialog").showModal());
$("#import-skill-button").addEventListener("click", () => $("#skill-import-dialog").showModal());
$("#skill-import-form").addEventListener("submit", importSkill);
$("#skill-file").addEventListener("change", event => { const file = event.target.files[0]; $("#skill-file-name").textContent = file?.name || "尚未选择文件"; $("#skill-import-submit").disabled = !file; $("#skill-import-error").textContent = ""; });
$("#skill-dropzone").addEventListener("dragover", event => { event.preventDefault(); event.currentTarget.classList.add("dragging"); });
$("#skill-dropzone").addEventListener("dragleave", event => event.currentTarget.classList.remove("dragging"));
$("#skill-dropzone").addEventListener("drop", event => { event.preventDefault(); event.currentTarget.classList.remove("dragging"); acceptSkillFile(event.dataTransfer.files[0]); });
$("#skill-search").addEventListener("input", event => { skillSearch = event.target.value; renderSkills(); });
$$("[data-skill-filter]").forEach(button => button.addEventListener("click", () => { skillFilter = button.dataset.skillFilter; $$("[data-skill-filter]").forEach(item => item.classList.toggle("active", item === button)); renderSkills(); }));
$("#skill-detail-toggle").addEventListener("change", event => { if (activeSkillDetail?.skill) setSkillEnabled(activeSkillDetail.skill, event.currentTarget.checked); });
$("#secret-toggle").addEventListener("click", event => { const input = $("#ark-api-key"); input.type = input.type === "password" ? "text" : "password"; event.currentTarget.textContent = input.type === "password" ? "显示" : "隐藏"; });
$("#credential-form").addEventListener("submit", async event => { event.preventDefault(); const apiKey = $("#ark-api-key").value.trim(); if (!apiKey) { $("#ark-key-error").textContent = "请输入 API Key。"; return; } try { await api("/api/secrets/ark", { method: "PUT", body: JSON.stringify({ apiKey }) }); $("#ark-api-key").value = ""; $("#settings-dialog").close(); await refreshState(); toast("API Key 已安全保存。", "success"); } catch (error) { $("#ark-key-error").textContent = error.message; } });
$("#clear-key-button").addEventListener("click", async () => { try { await api("/api/secrets/ark", { method: "DELETE" }); await refreshState(); toast("已清除保存的 API Key。", "success"); } catch (error) { toast(error.message, "error"); } });
$("#request-real-button").addEventListener("click", async () => { try { await api(`/api/projects/${activeProjectId}/approvals`, { method: "POST", body: JSON.stringify({}) }); await refreshState(); toast("真实模型批次已创建，等待批准。", "success"); } catch (error) { toast(error.message, "error"); } });
$("#render-button").addEventListener("click", async () => { try { await api(`/api/projects/${activeProjectId}/render`, { method: "POST", body: "{}" }); await refreshState(); toast("本地剪辑已开始。", "success"); } catch (error) { toast(error.message, "error"); } });
window.addEventListener("hashchange", applyRoute);
document.addEventListener("click", event => { if (!event.target.closest(".project-card")) $$('[data-project-menu]').forEach(menu => { menu.hidden = true; }); if (!event.target.closest(".sort-control")) $("#library-sort-menu").hidden = true; });

refreshState();
