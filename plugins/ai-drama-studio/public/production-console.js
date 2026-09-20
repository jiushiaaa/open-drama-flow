// No credentials are returned by the API or retained in localStorage.
export function createProductionConsole({ el, api, toast }) {
  const root = el("section", { id: "production-console-view", class: "route-view production-console", hidden: true });
  document.querySelector(".main-surface").append(root);
  let entered = false, filters = {}, tab = "requests", report, generation = 0;
  const button = (label, action, className = "button outline") => el("button", { type: "button", class: className, onclick: async () => { try { await action(); } catch (error) { toast(error.message, "error"); } } }, label);
  const money = values => Object.entries(values || {}).map(([currency, amounts]) => `${currency} ${typeof amounts === "number" ? amounts.toFixed(4) : amounts}`).join(" · ") || "暂无记录";
  const currencies = (summary, key) => money(Object.fromEntries(Object.entries(summary.currencies || {}).filter(([, a]) => a[`${key}Records`] > 0).map(([c, a]) => [c, a[key]])));
  const input = (name, type = "text", value = "", extra = {}) => el("input", { name, type, value, ...extra });
  const field = (label, node) => el("label", {}, el("span", {}, label), node);
  const select = (name, choices, value) => { const node = el("select", { name }, choices.map(([v, text]) => el("option", { value: v }, text))); node.value = value; return node; };
  const section = (title, ...children) => el("section", { class: "console-panel" }, el("h2", {}, title), ...children);
  const table = (headers, rows) => el("div", { class: "console-table-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, headers.map(h => el("th", {}, h)))), el("tbody", {}, rows.length ? rows.map(row => el("tr", {}, row.map(cell => el("td", {}, cell ?? "—")))) : el("tr", {}, el("td", { colspan: headers.length, class: "console-empty" }, "暂无记录；未测试或未定价不等于免费。")))));
  const detail = (title, ...nodes) => el("details", { class: "console-panel" }, el("summary", {}, title), ...nodes);
  function submitForm(form, action) {
    form.addEventListener("submit", async event => { event.preventDefault(); const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
      try { await action(Object.fromEntries(new FormData(form))); toast("已保存", "success"); } catch (error) { toast(error.message, "error"); } finally { if (submit) submit.disabled = false; }
    }); return form;
  }
  function priceForm(rule = {}) {
    const form = el("form", { class: "console-form" },
      field("调用类别", select("kind", ["seedance-video", "seedream-image", "asr", "tts", "music", "fal-video", "fal-image", "replicate-image"].map(x => [x, x]), rule.kind || "seedance-video")),
      field("完整模型 ID", input("model", "text", rule.model || "", { required: true, maxlength: 160 })),
      field("币种", input("currency", "text", rule.currency || "CNY", { pattern: "[A-Z]{3}", required: true })),
      field("计费单位", select("unit", [["request", "每次请求"], ["second", "每秒"], ["image", "每张图"], ["character", "每字符"]], rule.unit || "request")),
      field("单位估价", input("rate", "number", rule.rate ?? "", { min: 0, max: 1000000, step: "any", required: true })),
      field("价格来源 / 日期", input("source", "text", rule.source || "", { required: true, maxlength: 500 })),
      el("button", { type: "submit", class: "button primary" }, "保存定价"));
    return submitForm(form, async values => { await api("/api/usage/prices", { method: "PUT", body: JSON.stringify({ ...values, rate: Number(values.rate) }) }); await load(); });
  }
  function trend(data) {
    const panels = [];
    for (const currency of Object.keys(data.summary.currencies)) {
      const days = data.trend.filter(d => d.key !== "unknown"), max = Math.max(0.0001, ...days.flatMap(d => [d.currencies[currency]?.estimated || 0, d.currencies[currency]?.actual || 0]));
      const chart = el("div", { class: "console-chart", role: "img", "aria-label": `${currency} 每日估算与实账对照（UTC），两者不相加` });
      for (const day of days) {
        const values = day.currencies[currency] || { estimated: 0, actual: 0 };
        chart.append(el("div", { class: "console-day", title: `${day.key} 估算 ${values.estimated} / 实账 ${values.actual}` },
          el("div", { class: "console-bars" }, el("span", { class: "console-estimate", style: `height:${Math.max(1, values.estimated / max * 150)}px` }), el("span", { class: "console-actual", style: `height:${Math.max(1, values.actual / max * 150)}px` })), el("small", {}, day.key.slice(5))));
      }
      panels.push(el("h3", {}, `${currency} · 蓝色估算 / 绿色已核对账单`), chart);
    }
    return section("每日费用趋势 · UTC", ...(panels.length ? panels : [el("p", {}, "配置定价并产生新的调用后显示估算；录入账单后显示实账。不回填历史价格。") ]));
  }
  function requestTable() {
    const groups = tab === "providers" ? report.byProvider : report.byModel;
    if (tab !== "requests") return table([tab === "providers" ? "供应商" : "模型", "请求数", "估算", "已核对账单", "未核账"], groups.map(g => [g.key, g.calls, currencies(g, "estimated"), currencies(g, "actual"), g.unreconciled]));
    return table(["时间 (UTC)", "供应商 / 模型", "项目 / 镜头", "状态", "估算", "实账", "操作"], report.records.map(r => [
      r.at?.replace("T", " ").slice(0, 19), `${r.provider} / ${r.model || "未知模型"}`, [r.projectId, r.shotId].filter(Boolean).join(" / "), r.status,
      r.estimate ? `${r.estimate.currency} ${r.estimate.amount}` : "未定价", r.actual ? `${r.actual.currency} ${r.actual.amount}` : "待核对",
      button("录入账单", () => {
        const dialog = el("dialog", { class: "modal" }), form = el("form", { class: "console-form" }, el("h2", {}, "此调用的累计净账单"),
          field("凭据编号", input("receiptId", "text", "", { required: true })), field("币种", input("currency", "text", r.actual?.currency || r.estimate?.currency || "CNY", { required: true, pattern: "[A-Z]{3}" })),
          field("实际累计金额（不是追加费用）", input("amount", "number", "", { required: true, min: 0, step: "any" })), field("账单证据来源", input("source", "text", "", { required: true })), el("button", { type: "submit", class: "button primary" }, "核账"), button("取消", () => dialog.close()));
        submitForm(form, async values => { await api("/api/usage/settlements", { method: "POST", body: JSON.stringify({ callId: r.callId, receipt: { ...values, amount: Number(values.amount) } }) }); dialog.close(); await load(); });
        dialog.append(form); document.body.append(dialog); dialog.addEventListener("close", () => dialog.remove()); dialog.showModal();
      })
    ]));
  }
  function keyForm(provider, configured) {
    const key = input("apiKey", "password", "", { autocomplete: "off", minlength: 12, maxlength: 512, required: true, placeholder: configured ? "已加密保存，输入新 Key 可替换" : "尚未配置" });
    const form = el("form", { class: "console-key-form" }, field(provider, key), el("button", { type: "submit", class: "button outline" }, "安全保存"), button("清除", async () => { await api(`/api/secrets/${provider}`, { method: "DELETE" }); key.value = ""; key.placeholder = "尚未配置"; toast("已清除该凭据"); }));
    return submitForm(form, async values => { await api(`/api/secrets/${provider}`, { method: "PUT", body: JSON.stringify(values) }); key.value = ""; key.placeholder = "已加密保存"; });
  }
  function providerPanel(data) {
    const form = el("form", { class: "console-form" },
      field("视频首选", select("video", [["ark", "火山方舟 · Seedance 2.5（完整已接入输入）"], ["fal-wan", "fal · Wan 2.2（仅文生视频）"]], data.selection.video)),
      field(data.host === "generic" ? "图片 API 供应商" : "图片备用供应商", select("fallbackImage", [["ark-seedream", "方舟 · Seedream"], ["fal-flux", "fal · FLUX Schnell"], ["replicate-flux", "Replicate · FLUX Schnell"]], data.selection.fallbackImage)),
      el("button", { type: "submit", class: "button primary" }, "保存路由偏好"));
    submitForm(form, values => api("/api/providers", { method: "PUT", body: JSON.stringify(values) }));
    return detail("供应商与 API Key", el("p", {}, data.host === "generic" ? "当前为通用 Agent：请配置图片 API Key，默认方舟 Seedream，也可选择 fal / Replicate。图片先暂存，验收后入库。视频默认 Seedance，语音默认豆包。" : "当前为 Codex：图片优先使用会话内置工具；备用模型仅在明确要求或内置工具不可用时使用。默认视频：方舟 Seedance；默认语音：豆包语音。切换不会修改或重启已有任务。"), form,
      table(["适配器", "支持输入", "密钥", "验证状态"], data.providers.map(p => [p.name, p.inputs.join(" / "), p.credentialConfigured ? "已配置" : "未配置", "保存不代表账号实测"])),
      keyForm("fal", data.providers.find(p => p.provider === "fal")?.credentialConfigured), keyForm("replicate", data.providers.find(p => p.provider === "replicate")?.credentialConfigured),
      el("p", {}, "方舟和豆包语音的 Key 仍在左侧 API Key 页面配置。其他供应商此版不接受图片、视频或音频参考，需高级参考时使用 Seedance。"));
  }
  function upscalePanel(data) {
    const runtime = data.runtime || {}, form = el("form", { class: "console-form" },
      field("Real-ESRGAN 可执行文件绝对路径", input("executable", "text", runtime.executable || "", { required: true })),
      field("模型目录绝对路径", input("modelsDirectory", "text", runtime.modelsDirectory || "", { required: true })),
      field("模型", select("model", ["realesrgan-x4plus", "realesrgan-x4plus-anime", "realesr-animevideov3"].map(v => [v, v]), runtime.model || "realesrgan-x4plus")),
      field("GPU 编号（-1 为 CPU）", input("gpu", "number", runtime.gpu ?? 0, { min: -1, max: 16 })), field("Tile", input("tile", "number", runtime.tile || 256, { min: 32, max: 1024 })), el("button", { type: "submit", class: "button primary" }, "验证文件并保存"));
    submitForm(form, values => api("/api/upscale/runtime", { method: "PUT", body: JSON.stringify({ ...values, gpu: Number(values.gpu), tile: Number(values.tile) }) }));
    return detail("本地超分 · Real-ESRGAN", el("p", {}, "由 Codex 创建并启动超分任务。支持分块恢复、源文件与模型哈希校验、音轨保留；不覆盖原片。完成后仍需看画面与听声音。"), form,
      table(["任务", "进度", "状态", "操作"], (data.jobs || []).slice().reverse().map(j => [j.id, `${j.completedFrames} / ${j.frames} 帧`, j.status,
        j.status === "running" ? button("暂停", async () => { await api(`/api/upscale/${j.id}/pause`, { method: "POST", body: "{}" }); await load(); }) : j.status !== "succeeded" ? button("恢复", async () => { await api(`/api/upscale/${j.id}/resume`, { method: "POST", body: "{}" }); await load(); }) : "待视觉验收"
      ])));
  }
  function billingPanel(data) {
    const form = el("form", { class: "console-form" }, field("自动同步", select("enabled", [["false", "关闭"], ["true", "工作台运行期间每 6 小时同步"]], String(data.settings.enabled))),
      field("指定账期（留空跟随当前月）", input("period", "month", data.settings.period || "")), el("button", { type: "submit", class: "button primary" }, "保存同步设置"));
    submitForm(form, values => api("/api/billing", { method: "PUT", body: JSON.stringify({ enabled: values.enabled === "true", ...(values.period ? { period: values.period } : {}) }) }));
    return detail("火山引擎账户账单 · 独立核对", el("p", {}, "需要具有 ListBillDetail 只读权限的独立 AK / SK，不是方舟生成 Key。拉取的是账户级月账单，可能包括其他云产品，不会按猜测分摊到镜头，也不会与估算相加。"),
      keyForm("volc-billing-ak", data.configured), keyForm("volc-billing-sk", data.configured), form,
      button("立即同步", async () => { await api("/api/billing/sync", { method: "POST", body: JSON.stringify({ ...(form.elements.period.value ? { period: form.elements.period.value } : {}) }) }); await load(); }),
      el("p", { role: "status" }, `最近同步：${data.lastAttempt?.status || "从未同步"} ${data.lastAttempt?.error || ""}`),
      table(["账期", "账户应付金额", "明细数", "更新时间"], data.bills.map(b => [b.period, money(b.totals), b.rowCount, b.at])));
  }
  async function load() {
    const token = ++generation;
    if (!root.childElementCount) root.append(el("p", { role: "status" }, "正在读取本机用量…"));
    try {
      const [data, providers, upscales, billing] = await Promise.all([api(`/api/usage?${new URLSearchParams(filters)}`), api("/api/providers"), api("/api/upscale"), api("/api/billing")]);
      if (token !== generation) return; report = data;
      const controls = el("form", { class: "console-filters" },
        field("供应商", select("provider", [["", "全部供应商"], ...data.options.providers.map(v => [v, v])], filters.provider || "")),
        field("模型", select("model", [["", "全部模型"], ...data.options.models.map(v => [v, v])], filters.model || "")),
        field("开始日期 UTC", input("from", "date", filters.from || "")), field("结束日期 UTC", input("to", "date", filters.to || "")), el("button", { type: "submit", class: "button primary" }, "筛选"), button("刷新", load));
      controls.addEventListener("submit", e => { e.preventDefault(); filters = Object.fromEntries([...new FormData(controls)].filter(([, v]) => v)); void load(); });
      const log = section("调用记录", el("div", { class: "console-tabs" }, [["requests", "请求日志"], ["providers", "供应商统计"], ["models", "模型统计"]].map(([id, title]) => button(title, () => { tab = id; void load(); }, `button ${tab === id ? "primary" : "outline"}`))), requestTable(),
        el("div", { class: "console-pagination" }, button("上一页", () => { filters.page = String(Math.max(1, data.page - 1)); void load(); }), el("span", {}, `${data.page} / ${data.pages}`), button("下一页", () => { filters.page = String(Math.min(data.pages, data.page + 1)); void load(); })));
      root.replaceChildren(el("header", {}, el("p", { class: "eyebrow" }, "PRODUCTION CONTROL"), el("h1", {}, "用量与工具"), el("p", {}, "本机制作调用 · 定价 · 供应商 · 可恢复后期")), controls,
        el("div", { class: "console-metrics" }, [["请求数", data.summary.calls], ["预估成本", currencies(data.summary, "estimated")], ["已核对账单", currencies(data.summary, "actual")], ["待核对 / 未定价", `${data.summary.unreconciled} / ${data.summary.unpriced}`]].map(([label, value]) => el("article", {}, el("small", {}, label), el("strong", {}, value)))),
        el("p", { class: "console-note" }, "估算与实账分开，各币种不混算。未定价、失败和结果未知的请求不视为免费；不统计 Codex 订阅或本机电费。"), trend(data), log,
        detail("成本定价 · 仅影响后续调用", priceForm(), ...data.prices.map(rule => detail(`${rule.kind} / ${rule.model} · ${rule.currency} ${rule.rate}/${rule.unit}`, priceForm(rule)))),
        providerPanel(providers), upscalePanel(upscales), billingPanel(billing));
    } catch (error) { toast(error.message, "error"); if (!report) root.replaceChildren(el("p", { role: "alert" }, "用量页面加载失败。请确认新版工作台服务已启动。"), button("重试", load)); }
  }
  return { enter() { if (!entered) { entered = true; void load(); } }, leave() { entered = false; root.querySelectorAll('input[type="password"]').forEach(node => { node.value = ""; }); } };
}
