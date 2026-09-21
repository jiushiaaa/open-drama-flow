export function createProviderSettings({ el, api, toast }) {
  const root = el("section", { id: "provider-settings-view", class: "route-view provider-settings production-console", hidden: true });
  document.querySelector(".main-surface").append(root);
  let entered = false, selected = "ark", filter = "全部", search = "", data, generation = 0;
  const button = (title, action, primary = false) => el("button", { type: "button", class: `button ${primary ? "primary" : "outline"}`, onclick: async () => { try { await action(); } catch (e) { toast(e.message, "error"); } } }, title);
  const field = (label, node) => el("label", {}, el("span", {}, label), node);
  const input = (name, value = "", attrs = {}) => el("input", { name, value, ...attrs });
  const select = (name, options, value) => { const n = el("select", { name }, options.map(([id, label]) => el("option", { value: id }, label))); n.value = value; return n; };
  const link = (label, url) => el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, label);
  function formSubmit(form, action) {
    form.addEventListener("submit", async event => {
      event.preventDefault(); const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
      try { await action(Object.fromEntries(new FormData(form))); toast("已保存", "success"); } catch (e) { toast(e.message, "error"); } finally { submit.disabled = false; }
    }); return form;
  }
  function credentials(v) {
    return el("div", { class: "provider-credentials" }, v.credentials.map(key => {
      const label = { apiKey: "API Key", accessKey: v.id === "tencent" ? "SecretId" : "Access Key", secretKey: "Secret Key" }[key];
      const configured = v.credentialStatus[key], value = input("apiKey", "", { type: "password", required: true, minlength: 12, maxlength: 512, autocomplete: "off", placeholder: configured ? "已加密保存；填写可替换" : `填写 ${label}` });
      const form = el("form", { class: "provider-key-row" }, field(label, value), el("button", { type: "submit", class: "button primary" }, "保存"), button("清除", async () => {
        if (!confirm(`清除 ${v.name} 的 ${label}？已有任务记录不会删除。`)) return;
        await api(`/api/providers/${v.id}/credentials/${key}`, { method: "DELETE" }); value.value = ""; await load();
      }));
      return formSubmit(form, async values => { try { await api(`/api/providers/${v.id}/credentials/${key}`, { method: "PUT", body: JSON.stringify(values) }); await load(); } finally { value.value = ""; } });
    }));
  }
  function routeForm() {
    const form = el("form", { class: "console-form provider-routes" }, [["video", "video", "视频首选"], ["fallbackImage", "image", data.host === "codex" ? "图片备用 API" : "图片生成 API"], ["speech", "audio", "独立 TTS 首选"]].map(([name, kind, title]) => field(title, select(name, data.providers.filter(p => p.kind === kind).map(p => [p.id, p.name]), data.selection[name] || "speech"))), el("button", { type: "submit", class: "button primary" }, "保存默认选择"));
    return formSubmit(form, async values => { await api("/api/providers", { method: "PUT", body: JSON.stringify(values) }); await load(); });
  }
  function customForm() {
    const examples = Object.fromEntries(data.providers.filter(p => data.customProtocols.includes(p.protocol)).map(p => [p.protocol, p]));
    const protocol = select("protocol", data.customProtocols.map(p => [p, p]), "openai-image");
    const endpoint = input("submitPath", "/images/generations", { required: true });
    protocol.addEventListener("change", () => { endpoint.value = examples[protocol.value]?.submitPath || "/images/generations"; });
    const form = el("form", { class: "console-form" },
      field("供应商名称", input("name", "", { required: true, maxlength: 80 })),
      field("唯一标识（custom- 开头）", input("id", "custom-", { required: true, pattern: "custom-[a-z0-9](?:[a-z0-9]|-){0,45}" })),
      field("接口协议", protocol), field("Base URL（包含版本前缀）", input("baseUrl", "", { type: "url", required: true, placeholder: "https://api.example.com/v1" })),
      field("模型 ID", input("model", "", { required: true, maxlength: 160 })), field("请求路径（追加到 Base URL）", endpoint),
      field("备注", input("notes", "", { maxlength: 500 })), el("button", { type: "submit", class: "button primary" }, "添加供应商"));
    return el("section", { class: "console-panel provider-editor" }, el("h2", {}, "自定义供应商"), el("p", {}, "选择服务实际兼容的媒体协议，而不是聊天协议。仅允许公网 HTTPS；保存后填写独立 Key。接口、模型更换需新建标识，防止旧任务与密钥被错误转发。"), formSubmit(form, async values => { await api("/api/providers/custom", { method: "POST", body: JSON.stringify(values) }); selected = values.id; filter = "全部"; search = ""; await load(); }));
  }
  function editor(v) {
    const models = data.providers.filter(p => p.provider === v.id);
    return el("section", { class: "console-panel provider-editor" },
      el("header", { class: "provider-editor-header" }, el("div", {}, el("p", { class: "eyebrow" }, `${v.region} / ${v.custom ? "CUSTOM ENDPOINT" : "OFFICIAL API"}`), el("h2", {}, v.name)), v.docs ? link("官方文档 ↗", v.docs) : null),
      el("p", { class: "console-note" }, "密钥仅保存在本机系统加密存储，不写入项目、浏览器缓存或 Git。保存配置不代表服务开通或账号实测通过。"), credentials(v),
      el("details", { class: "provider-endpoints" }, el("summary", {}, "接口与请求地址 · 已预设"), el("code", {}, v.baseUrl), models.map(p => el("p", {}, `${p.model} · ${p.protocol}`, el("br"), el("code", {}, `${p.baseUrl || v.baseUrl}${p.submitPath}`)))),
      el("h3", {}, "可用模型与接入范围"), el("div", { class: "provider-models" }, models.map(p => el("article", {}, el("div", { class: "provider-model-title" }, el("strong", {}, p.model), el("span", { class: "provider-badge" }, { image: "图片", video: "视频", audio: "声音" }[p.kind])),
        el("p", {}, p.specification || (p.protocol === "native" ? "使用现有生产工具与参数约束" : "文本输入 · 单候选输出")), el("small", {}, `输入：${p.inputs.join(" / ")} · 工具：${p.tool}`)))),
      el("p", { class: "console-note" }, "现有 Skill 主要针对 Seedance 适配；其他模型须按其参数范围调整提示词。不自动复制 Seedance 的多参考、编辑与续写能力。独立 TTS 选择不改变 ASR 与音乐的豆包语音入口。切换默认值不修改已创建任务。"));
  }
  function render() {
    const searchBox = input("search", search, { type: "search", placeholder: "搜索供应商", "aria-label": "搜索供应商" });
    const list = el("div", { class: "provider-list" });
    const populate = () => {
      list.replaceChildren(...data.vendors.filter(v => (filter === "全部" || v.region === filter) && `${v.name} ${v.id}`.toLowerCase().includes(search.toLowerCase())).map(v => button(`${v.name}　${Object.values(v.credentialStatus).every(Boolean) ? "✓" : ""}`, () => { selected = v.id; render(); }, selected === v.id)));
      if (!list.childElementCount) list.append(el("p", {}, "没有匹配的供应商"));
    };
    searchBox.addEventListener("input", () => { search = searchBox.value; populate(); }); populate();
    const vendor = data.vendors.find(v => v.id === selected);
    root.replaceChildren(el("header", { class: "provider-page-header" }, el("div", {}, el("p", { class: "eyebrow" }, "PROVIDER SETTINGS"), el("h1", {}, "供应商与 API"), el("p", {}, "选择供应商，保存密钥，即可交给 Agent 调用。")), button("＋ 添加供应商", () => { selected = "new"; render(); }, true)),
      el("section", { class: "console-panel" }, el("h2", {}, "默认生成模型"), el("p", {}, "未特别指定时，Agent 优先使用以下模型。修改只影响新任务，不会切换已创建的任务。"), el("p", { class: "provider-image-policy" }, data.host === "codex" ? "图片默认：Codex 内置 imagegen · 使用 Codex 额度。下方图片 API 仅在明确指定或内置生图不可用时使用。" : "图片默认使用所选图片 API，需先配置对应供应商的密钥。"), routeForm()),
      el("header", { class: "provider-config-heading" }, el("h2", {}, "供应商与密钥配置"), el("p", {}, "在这里配置各家的连接信息。保存密钥不会改变上方的默认模型。")),
      el("div", { class: "provider-layout" }, el("aside", { class: "console-panel provider-picker", "aria-label": "供应商列表" }, searchBox, el("div", { class: "provider-region-tabs" }, ["全部", "国内", "海外", "自定义"].map(r => button(r, () => { filter = r; render(); }, filter === r))), list), selected === "new" ? customForm() : vendor ? editor(vendor) : el("p", {}, "请选择供应商")),
    );
  }
  async function load() { const token = ++generation; data = await api("/api/providers"); if (token === generation && entered) render(); }
  return { enter() { if (entered) return; entered = true; void load().catch(e => { toast(e.message, "error"); root.replaceChildren(el("p", {}, "配置页面加载失败，请确认已启动新版服务。"), button("重试", load)); }); }, leave() { if (!entered) return; entered = false; generation++; root.querySelectorAll('input[type="password"]').forEach(n => { n.value = ""; }); } };
}
