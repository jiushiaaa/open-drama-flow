const stageDefinitions = [
  ["story", "故事", "剧本与节奏"],
  ["characters", "角色", "一致性锚点"],
  ["storyboard", "分镜", "镜头与对白"],
  ["assets", "素材", "图片与导入"],
  ["videos", "视频", "模型镜头"],
  ["final", "成片", "剪辑与导出"]
];

const $ = selector => document.querySelector(selector);
const shell = $("#app-shell");
let studioState = null;
let activeProjectId = null;
let stateController = null;
let settingsTrigger = null;
let pollTimer = null;
let keyEditMode = false;

const savedKeyMask = "••••••••••••••••";

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null && value !== false) node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: options.body instanceof FormData ? options.headers : { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error?.message || `HTTP_${response.status}`);
    error.code = body?.error?.code || `HTTP_${response.status}`;
    throw error;
  }
  return body;
}

function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = busyLabel || "处理中…";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function toast(message, tone = "info") {
  const viewport = $("#toast-viewport");
  const duplicate = [...viewport.children].find(item => item.textContent === message);
  if (duplicate) duplicate.remove();
  const node = el("div", { class: `toast ${tone}`, role: tone === "error" ? "alert" : "status", text: message });
  viewport.append(node);
  while (viewport.children.length > 4) viewport.firstElementChild.remove();
  const timer = setTimeout(() => node.remove(), tone === "error" ? 8000 : 4500);
  node.addEventListener("mouseenter", () => clearTimeout(timer), { once: true });
}

function activeProject() {
  return studioState?.projects.find(project => project.id === activeProjectId) || studioState?.projects[0] || null;
}

async function refreshState({ silent = false } = {}) {
  stateController?.abort();
  const controller = new AbortController();
  stateController = controller;
  try {
    const response = await fetch("/api/state", { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const next = await response.json();
    if (controller !== stateController) return;
    studioState = next;
    if (!activeProjectId || !studioState.projects.some(project => project.id === activeProjectId)) activeProjectId = studioState.projects[0]?.id || null;
    render();
    const service = $("#service-status");
    service.className = "service-status online";
    service.lastChild.textContent = "本地服务在线";
    schedulePoll();
  } catch (error) {
    if (error.name === "AbortError") return;
    document.title = "服务不可用 — OpenDramaFlow";
    const service = $("#service-status");
    service.className = "service-status offline";
    service.lastChild.textContent = "本地服务不可用";
    if (!silent) toast("无法读取本地制作状态，请确认服务仍在运行。", "error");
  }
}

function schedulePoll() {
  clearTimeout(pollTimer);
  const active = studioState?.jobs.some(job => ["queued", "running"].includes(job.status));
  pollTimer = setTimeout(() => refreshState({ silent: true }), active ? 1500 : 6000);
}

function render() {
  document.title = "制作台 — OpenDramaFlow";
  const project = activeProject();
  $("#empty-state").hidden = Boolean(project);
  $("#workspace").hidden = !project;
  $("#production-spine").hidden = !project;
  $("#project-header-actions").hidden = !project;
  renderSidebarProjects(project);
  renderStages(project);
  renderSettings();
  if (!project) return;
  renderProject(project);
  renderShots(project);
  renderActivity(project);
  renderOutput(project);
}

function renderSidebarProjects(project) {
  const container = $("#sidebar-projects");
  const projects = studioState?.projects || [];
  $("#sidebar-project-count").textContent = String(projects.length);
  container.replaceChildren();
  if (!projects.length) {
    container.append(el("p", { text: "还没有项目" }));
    return;
  }
  for (const item of projects) {
    const button = el("button", {
      class: `sidebar-project-button${item.id === project?.id ? " active" : ""}`,
      type: "button",
      "aria-current": item.id === project?.id ? "true" : null,
      onclick: () => {
        activeProjectId = item.id;
        render();
        $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    el("img", { src: "/icons/film.svg", alt: "", "aria-hidden": "true" }),
    el("span", { text: item.title }));
    container.append(button);
  }
}

function renderStages(project) {
  const list = $("#stage-list");
  list.replaceChildren();
  if (!project) return;
  const currentIndex = Math.max(0, stageDefinitions.findIndex(([key]) => key === project.currentStage));
  stageDefinitions.forEach(([key, label, detail], index) => {
    const count = key === "story" ? `${project.script?.scenes?.length || 0} 场` : key === "characters" ? `${project.characters?.length || 0} 人` : key === "storyboard" ? `${project.shots?.length || 0} 镜` : key === "assets" ? `${project.assets?.length || 0} 项` : key === "videos" ? `${project.shots?.filter(shot => shot.clipPath).length || 0} 段` : `${project.outputs?.length || 0} 条`;
    const className = index === currentIndex ? "active" : index < currentIndex ? "complete" : "";
    const item = el("li", { class: className, "aria-current": index === currentIndex ? "step" : null },
      el("span", { class: "stage-index", text: String(index + 1).padStart(2, "0") }),
      el("strong", { text: label }),
      el("small", { text: count || detail })
    );
    list.append(item);
  });
}

function renderProject(project) {
  const summary = $("#project-summary");
  summary.replaceChildren(
    el("h3", { class: "project-title", text: project.title }),
    el("p", { class: "project-logline", text: project.logline || "尚未写入故事梗概。" }),
    project.script?.premise ? el("p", { class: "premise", text: project.script.premise }) : null
  );
  const status = $("#project-status");
  const statusMap = { draft: ["草稿", "neutral"], ready: ["分镜就绪", "warning"], rendered: ["已成片", "success"] };
  const [label, tone] = statusMap[project.status] || [project.status, "neutral"];
  status.textContent = label;
  status.className = `status-chip ${tone}`;

  const characters = $("#character-list");
  characters.replaceChildren();
  if (!project.characters.length) characters.append(el("p", { class: "project-logline", text: "暂无角色锚点。让 Codex 写入正式角色设定后会显示在这里。" }));
  for (const character of project.characters) characters.append(el("article", { class: "character-card" }, el("strong", { text: character.name }), el("p", { text: character.visual })));

  $("#render-button").disabled = project.shots.length === 0 || studioState.jobs.some(job => job.projectId === project.id && ["queued", "running"].includes(job.status));
  $("#request-real-button").disabled = project.shots.length === 0;
}

function renderShots(project) {
  $("#shot-count").textContent = `${project.shots.length} 个镜头`;
  const board = $("#shot-board");
  board.replaceChildren();
  if (!project.shots.length) {
    board.append(el("div", { class: "empty-state" }, el("h3", { text: "还没有分镜" }), el("p", { text: "把真实创作目标告诉 Codex，由它按你的故事写剧本并拆镜。" })));
    return;
  }
  for (const shot of project.shots) {
    const asset = [...project.assets].reverse().find(item => item.shotId === shot.id && item.kind === "image");
    const visual = el("div", { class: "shot-visual" },
      el("span", { class: "shot-number", text: `SHOT ${String(shot.order).padStart(2, "0")}` }),
      asset ? el("img", { src: asset.mediaUrl, alt: `镜头 ${shot.order} 图片素材` }) : el("span", { class: "shot-placeholder", text: "待生成" })
    );
    const tone = shot.status === "rendered" || shot.status === "video-ready" ? "success" : shot.status?.includes("running") ? "warning" : "neutral";
    board.append(el("article", { class: "shot-card" }, visual,
      el("div", { class: "shot-body" },
        el("div", { class: "shot-meta" }, el("span", { text: `${shot.framing} · ${shot.duration}s` }), el("span", { class: `status-chip ${tone}`, text: shot.status || "planned" })),
        el("h3", { text: shot.scene }),
        el("p", { class: "shot-prompt", text: shot.prompt }),
        el("p", { class: "shot-subtitle", text: `「${shot.subtitle}」` })
      )
    ));
  }
}

function statusTone(status) {
  if (["succeeded", "approved", "completed"].includes(status)) return "success";
  if (["failed", "rejected", "expired", "cancelled"].includes(status)) return "danger";
  if (["pending", "queued", "running", "waiting", "claimed"].includes(status)) return "warning";
  return "neutral";
}

function friendlyJobError(value) {
  const text = String(value || "");
  if (text.startsWith("FFMPEG_FAILED")) return "本地 FFmpeg 渲染失败。请检查素材格式和 FFmpeg 后重试。";
  if (text.startsWith("SEEDREAM")) return "Seedream 图片步骤未完成。请检查模型 ID、权限或提示词。";
  if (text.startsWith("SEEDANCE")) return "Seedance 视频步骤未完成。请查询原任务状态后再决定是否重试。";
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
}

function renderActivity(project) {
  const approvals = $("#approval-list");
  approvals.replaceChildren();
  const projectApprovals = studioState.approvals.filter(item => item.projectId === project.id).slice(0, 4);
  if (!projectApprovals.length) approvals.append(el("p", { class: "project-logline", text: "暂无真实模型审批。" }));
  for (const approval of projectApprovals) {
    const actions = el("div", { class: "card-actions" });
    if (approval.status === "pending") {
      actions.append(
        el("button", { class: "button primary", type: "button", onclick: event => decideApprovalAction(event.currentTarget, approval.id, "approved") }, "批准此批次"),
        el("button", { class: "button ghost", type: "button", onclick: event => decideApprovalAction(event.currentTarget, approval.id, "rejected") }, "拒绝")
      );
    } else if (approval.status === "approved" && !approval.jobId) {
      actions.append(el("button", { class: "button warning", type: "button", onclick: event => runRealAction(event.currentTarget, approval.id) }, "执行已批准批次"));
    }
    approvals.append(el("article", { class: "approval-card" },
      el("header", {}, el("strong", { text: "真实模型费用审批" }), el("span", { class: `status-chip ${statusTone(approval.status)}`, text: approval.status })),
      el("p", { text: `图片最多 ${approval.maxImageCalls} 次（已用 ${approval.usedImageCalls}），视频最多 ${approval.maxVideoCalls} 次（已用 ${approval.usedVideoCalls}）。` }),
      actions
    ));
  }

  const jobs = $("#job-list");
  jobs.replaceChildren();
  const projectJobs = studioState.jobs.filter(item => item.projectId === project.id).slice(0, 5);
  if (!projectJobs.length) jobs.append(el("p", { class: "project-logline", text: "暂无生成或剪辑任务。" }));
  for (const job of projectJobs) {
    const jobLabel = job.type === "local-render" ? "本地混合剪辑" : "真实模型批次";
    const actions = el("div", { class: "card-actions" });
    if (job.type === "real-pipeline" && job.status === "waiting") {
      actions.append(el("button", { class: "button outline", type: "button", onclick: event => resumeRealAction(event.currentTarget, job.id) }, "图片回填后续跑"));
    }
    jobs.append(el("article", { class: "task-card" },
      el("header", {}, el("strong", { text: jobLabel }), el("span", { class: `status-chip ${statusTone(job.status)}`, text: job.status })),
      el("p", { text: `阶段：${job.stage}` }),
      job.error ? el("p", { class: "task-error", text: friendlyJobError(job.error) }) : null,
      actions
    ));
  }

  const events = $("#event-list");
  events.replaceChildren();
  for (const event of studioState.events.filter(item => !item.detail?.projectId || item.detail.projectId === project.id).slice(0, 8)) {
    events.append(el("li", {}, event.message, el("time", { datetime: event.at, text: new Date(event.at).toLocaleString("zh-CN", { hour12: false }) })));
  }
}

function renderOutput(project) {
  const container = $("#final-output");
  const output = project.outputs[0];
  container.hidden = !output;
  container.replaceChildren();
  if (!output) return;
  container.append(
    el("header", {}, el("h3", { text: "本地成片已生成" }), el("a", { class: "button outline", href: output.mediaUrl, download: "", text: "下载 MP4" })),
    el("video", { controls: true, preload: "metadata", src: output.mediaUrl, "aria-label": `${project.title} 本地成片` })
  );
}

function renderSettings() {
  if (!studioState) return;
  const configured = studioState.credentialStatus.arkConfigured;
  const chip = $("#credential-chip");
  chip.textContent = configured ? "已安全保存" : "未配置";
  chip.className = `status-chip ${configured ? "success" : "warning"}`;
  $("#clear-key-button").disabled = !configured;
  renderCredentialField(configured);
}

function renderCredentialField(configured) {
  const input = $("#ark-api-key");
  const viewingSaved = configured && !keyEditMode;
  if (viewingSaved) {
    input.value = savedKeyMask;
    input.readOnly = true;
    input.type = "password";
  } else if (input.readOnly) {
    input.value = "";
    input.readOnly = false;
    input.type = "password";
  }
  $("#ark-key-label").textContent = viewingSaved ? "已保存的 API Key" : configured ? "新的 API Key" : "API Key";
  $("#ark-key-help").textContent = viewingSaved
    ? "已加密保存；关闭页面或重启项目后仍会自动使用。明文不会回显。"
    : "请只在这里粘贴。保存后持续显示掩码，不会把明文送回页面。";
  $("#secret-toggle").hidden = viewingSaved;
  $("#replace-key-button").hidden = !viewingSaved;
  $("#save-key-button").hidden = viewingSaved;
}

async function createProjectAction(button) {
  setBusy(button, true, "正在建立…");
  try {
    const { project } = await api("/api/projects", { method: "POST", body: JSON.stringify({ title: "未命名漫剧" }) });
    activeProjectId = project.id;
    await refreshState();
    $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("空白项目已建立，可以让 Codex 开始写剧本。", "success");
  } catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

async function requestRealAction(button) {
  const project = activeProject();
  if (!project) return;
  setBusy(button, true, "正在创建…");
  try { await api(`/api/projects/${project.id}/approvals`, { method: "POST", body: "{}" }); await refreshState(); toast("真实模型批次已创建，尚未调用模型。", "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

async function renderProjectAction(button) {
  const project = activeProject();
  if (!project) return;
  setBusy(button, true, "正在提交…");
  try { await api(`/api/projects/${project.id}/render`, { method: "POST", body: "{}" }); await refreshState(); toast("本地剪辑已启动，不会调用模型。", "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

async function resumeRealAction(button, jobId) {
  setBusy(button, true, "正在续跑…");
  try { await api(`/api/jobs/${jobId}/resume`, { method: "POST", body: "{}" }); await refreshState(); toast("真实批次已按原审批上限续跑。", "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

async function decideApprovalAction(button, id, decision) {
  setBusy(button, true, decision === "approved" ? "正在批准…" : "正在拒绝…");
  try { await api(`/api/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision }) }); await refreshState(); toast(decision === "approved" ? "批次已批准，尚未执行。" : "批次已拒绝。", "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

async function runRealAction(button, id) {
  setBusy(button, true, "正在提交…");
  try { await api(`/api/approvals/${id}/run`, { method: "POST", body: "{}" }); await refreshState(); toast("已批准的真实批次开始执行。", "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { setBusy(button, false); }
}

function openSettings() {
  settingsTrigger = document.activeElement;
  keyEditMode = false;
  renderSettings();
  renderCredentialField(Boolean(studioState?.credentialStatus.arkConfigured));
  const overlay = $("#settings-overlay");
  overlay.hidden = false;
  shell.inert = true;
  $("#settings-dialog").focus();
}

function closeSettings() {
  $("#settings-overlay").hidden = true;
  shell.inert = false;
  keyEditMode = false;
  $("#ark-api-key").value = "";
  $("#ark-api-key").readOnly = false;
  $("#ark-key-error").textContent = "";
  $("#settings-alert").hidden = true;
  settingsTrigger?.focus();
}

function trapDialogFocus(event) {
  if (event.key === "Escape") { closeSettings(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...$("#settings-dialog").querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), [href]")].filter(node => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

async function saveCredential(event) {
  event.preventDefault();
  const input = $("#ark-api-key");
  const errorNode = $("#ark-key-error");
  errorNode.textContent = "";
  input.removeAttribute("aria-invalid");
  const value = input.value.trim();
  if (value.length < 12 || /\s/.test(value)) {
    input.setAttribute("aria-invalid", "true");
    errorNode.textContent = "请输入不含空格的完整 API Key。";
    input.focus();
    return;
  }
  const button = $("#save-key-button");
  setBusy(button, true, "正在加密…");
  try {
    await api("/api/secrets/ark", { method: "PUT", body: JSON.stringify({ apiKey: value }) });
    keyEditMode = false;
    input.value = "";
    input.type = "password";
    await refreshState({ silent: true });
    toast("API Key 已使用 Windows DPAPI 加密保存。", "success");
  } catch (error) { errorNode.textContent = error.message; }
  finally { setBusy(button, false); }
}

async function clearCredential() {
  const button = $("#clear-key-button");
  setBusy(button, true, "正在清除…");
  try { await api("/api/secrets/ark", { method: "DELETE" }); keyEditMode = false; await refreshState({ silent: true }); toast("已清除本机保存的 Ark API Key。", "success"); }
  catch (error) { $("#settings-alert").textContent = error.message; $("#settings-alert").hidden = false; }
  finally { setBusy(button, false); }
}

async function importAsset(file) {
  const project = activeProject();
  if (!project) { toast("请先建立项目，再导入素材。", "error"); return; }
  if (file.size > 30 * 1024 * 1024) { toast("文件超过 30MB 上限。", "error"); return; }
  const form = new FormData();
  form.append("projectId", project.id);
  form.append("file", file);
  try { await api("/api/assets/import", { method: "POST", body: form }); await refreshState(); toast(`已导入 ${file.name}`, "success"); }
  catch (error) { toast(error.message, "error"); }
  finally { $("#asset-file").value = ""; }
}

$("#refresh-button").addEventListener("click", event => refreshState().finally(() => event.currentTarget.focus()));
$("#settings-button").addEventListener("click", openSettings);
$("#settings-close").addEventListener("click", closeSettings);
$("#settings-cancel").addEventListener("click", closeSettings);
$("#settings-dialog").addEventListener("keydown", trapDialogFocus);
$("#create-project-button").addEventListener("click", event => createProjectAction(event.currentTarget));
$("#empty-state").addEventListener("click", event => {
  if (event.target.closest('[data-action="create-project"]')) createProjectAction(event.target.closest("button"));
  if (event.target.closest('[data-action="open-settings"]')) openSettings();
});
$("#render-button").addEventListener("click", event => renderProjectAction(event.currentTarget));
$("#request-real-button").addEventListener("click", event => requestRealAction(event.currentTarget));
$("#credential-form").addEventListener("submit", saveCredential);
$("#replace-key-button").addEventListener("click", () => {
  keyEditMode = true;
  renderCredentialField(true);
  $("#ark-api-key").focus();
});
$("#clear-key-button").addEventListener("click", clearCredential);
$("#asset-file").addEventListener("change", event => { const [file] = event.target.files; if (file) importAsset(file); });
$("#secret-toggle").addEventListener("click", event => {
  const input = $("#ark-api-key");
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  event.currentTarget.textContent = showing ? "显示" : "隐藏";
  event.currentTarget.setAttribute("aria-label", showing ? "显示 API Key" : "隐藏 API Key");
  event.currentTarget.setAttribute("aria-pressed", String(!showing));
  input.focus();
});

refreshState();
