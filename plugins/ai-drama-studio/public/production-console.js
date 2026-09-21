// No credentials are returned by the API or retained in localStorage.
export function createProductionConsole({ el, api, toast, mode = "usage" }) {
  const root = el("section", { id: mode === "settings" ? "local-settings-view" : "production-console-view", class: "route-view production-console", hidden: true });
  document.querySelector(".main-surface").append(root);
  let entered = false, filters = {}, tab = "requests", report, generation = 0;
  const button = (label, action, className = "button outline") => el("button", { type: "button", class: className, onclick: async () => { try { await action(); } catch (error) { toast(error.message, "error"); } } }, label);
  const money = values => Object.entries(values || {}).map(([currency, amounts]) => `${currency} ${typeof amounts === "number" ? amounts.toFixed(4) : amounts}`).join(" · ") || "暂无记录";
  const currencies = (summary, key) => money(Object.fromEntries(Object.entries(summary.currencies || {}).filter(([, a]) => a[`${key}Records`] > 0).map(([c, a]) => [c, a[key]])));
  const input = (name, type = "text", value = "", extra = {}) => el("input", { name, type, value, ...extra });
  const field = (label, node) => el("label", {}, el("span", {}, label), node);
  const select = (name, choices, value) => { const node = el("select", { name }, choices.map(([v, text]) => el("option", { value: v }, text))); node.value = value; return node; };
  const section = (title, ...children) => el("section", { class: "console-panel" }, el("h2", {}, title), ...children);
  const table = (headers, rows) => el("div", { class: "console-table-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, headers.map(h => el("th", {}, h)))), el("tbody", {}, rows.length ? rows.map(row => el("tr", {}, row.map(cell => el("td", {}, cell ?? "—")))) : el("tr", {}, el("td", { colspan: headers.length, class: "console-empty" }, "暂无消费记录")))));
  const detail = (title, ...nodes) => el("details", { class: "console-panel" }, el("summary", {}, title), ...nodes);
  const unitLabel = unit => ({ request: "次", image: "张", second: "秒", character: "字符", million_tokens: "百万 Token", megapixel: "百万像素（向上取整）" }[unit] || unit);
  const estimateLabel = status => ({ "historical-unknown": "历史价格未记录", "quantity-unknown": "待补充计费用量", "price-not-configured": "缺少匹配价格" }[status] || "暂无估算");
  const providerOf = rule => rule.provider === "doubao-speech" ? "speech" : rule.provider || (["asr", "tts", "music"].includes(rule.kind) ? "speech" : rule.kind.startsWith("fal-") ? "fal" : rule.kind.startsWith("replicate-") ? "replicate" : "ark");
  function submitForm(form, action) {
    form.addEventListener("submit", async event => { event.preventDefault(); const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
      try { await action(Object.fromEntries(new FormData(form))); toast("已保存", "success"); } catch (error) { toast(error.message, "error"); } finally { if (submit) submit.disabled = false; }
    }); return form;
  }
  function priceForm(rule, onSaved) {
    const form = el("form", { class: "console-form" },
      field("供应商", input("provider", "text", providerOf(rule), { readonly: true })),
      field("调用类别", input("kind", "text", rule.kind, { readonly: true })),
      field("完整模型 ID", input("model", "text", rule.model || "", { required: true, readonly: true })),
      input("profile", "hidden", rule.profile || ""),
      field("币种", input("currency", "text", rule.currency || "CNY", { pattern: "[A-Z]{3}", required: true })),
      field("计费单位", select("unit", [["request", "每次请求"], ["second", "每秒"], ["image", "每张图"], ["character", "每字符"], ["million_tokens", "每百万 Token"], ["megapixel", "每百万像素（向上取整）"]], rule.unit || "request")),
      field("单位估价", input("rate", "number", rule.rate ?? "", { min: 0, max: 1000000, step: "any", required: true })),
      field("价格来源 / 日期", input("source", "text", rule.source || "", { required: true, maxlength: 500 })),
      el("button", { type: "submit", class: "button primary" }, "保存定价"));
    return submitForm(form, async values => {
      if (!values.profile) delete values.profile;
      const submit = form.querySelector('[type="submit"]');
      submit.textContent = "正在保存…";
      try {
        const saved = await api("/api/usage/prices", { method: "PUT", body: JSON.stringify({ ...values, rate: Number(values.rate), ...(rule.variant ? { variant: rule.variant, conditions: rule.conditions } : {}) }) });
        Object.assign(rule, saved);
        onSaved();
      } finally { submit.textContent = "保存定价"; }
    });
  }
  function pricingPanel(data) {
    const title = rule => `${rule.model} · ${rule.variant || "默认规格"} · ${rule.currency} ${Number(rule.rate.toPrecision(8))}/${unitLabel(rule.unit)}`;
    return detail("模型定价", el("p", {}, "按供应商、模型和规格设置单价，保存后用于新调用。"), ...data.filterOptions.vendors.map(v => {
      const rules = data.prices.filter(r => providerOf(r) === v.id);
      return detail(v.name, ...(rules.length ? rules.map(rule => {
        const node = detail(title(rule));
        let loaded = false;
        node.addEventListener("toggle", () => {
          if (!node.open || loaded) return;
          loaded = true;
          const description = el("p", {}, `${rule.specification || "自定义规格"} · ${rule.recordedAt || ""}`);
          const source = el("p");
          const update = () => {
            node.querySelector("summary").textContent = title(rule);
            description.textContent = `${rule.specification || "自定义规格"} · ${rule.recordedAt || ""}`;
            source.replaceChildren(/^https:\/\//.test(rule.source) ? el("a", { href: rule.source, target: "_blank", rel: "noopener noreferrer" }, "官方价格来源 ↗") : rule.source || "");
          };
          update();
          node.append(description, source, priceForm(rule, update));
        });
        return node;
      }) : [el("p", {}, "暂无定价配置")]));
    }));
  }
  function trend(data) {
    const panels = [];
    for (const currency of Object.keys(data.summary.currencies)) {
      const days = data.trend.filter(d => d.key !== "unknown" && d.currencies[currency]?.estimatedRecords > 0);
      if (!days.length) continue;
      const svg = (tag, attrs = {}, text) => { const node = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); if (text !== undefined) node.textContent = text; return node; };
      const width = Math.max(720, days.length * 76 + 100), height = 260, left = 70, top = 30, plotHeight = 180, plotWidth = width - left - 24;
      const max = Math.max(0.01, ...days.map(d => d.currencies[currency].estimated)) * 1.15;
      const chart = svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${currency} 每日预估费用，UTC，仅展示已有估算的日期`, class: "console-trend-svg" });
      for (let i = 0; i <= 4; i++) {
        const y = top + plotHeight * i / 4;
        chart.append(svg("line", { x1: left, x2: width - 24, y1: y, y2: y, stroke: "#e7edf5", "stroke-dasharray": i === 4 ? "none" : "4 4" }), svg("text", { x: left - 12, y: y + 4, "text-anchor": "end", fill: "#78869b", "font-size": 12 }, (max * (4 - i) / 4).toFixed(2)));
      }
      days.forEach((day, i) => {
        const value = day.currencies[currency].estimated, x = left + plotWidth * (i + 0.5) / days.length, barWidth = Math.min(54, plotWidth / days.length * 0.5), barHeight = value / max * plotHeight;
        const bar = svg("rect", { x: x - barWidth / 2, y: top + plotHeight - barHeight, width: barWidth, height: barHeight, rx: 5, fill: "#527aff", tabindex: 0 });
        bar.append(svg("title", {}, `${day.key} · ${currency} ${value.toFixed(4)} · ${day.currencies[currency].estimatedRecords} 条估算`));
        chart.append(bar, svg("text", { x, y: top + plotHeight - barHeight - 9, "text-anchor": "middle", fill: "#314e91", "font-size": 12 }, value.toFixed(2)), svg("text", { x, y: 239, "text-anchor": "middle", fill: "#78869b", "font-size": 12 }, day.key.slice(5)));
      });
      panels.push(el("h3", {}, `${currency} · 预估成本`), el("div", { class: "console-trend-scroll" }, chart));
    }
    return section("每日费用趋势 · UTC", ...(panels.length ? panels : [el("p", { class: "console-empty" }, "当前条件下暂无费用数据")]));
  }
  const vendorName = id => report.filterOptions.vendors.find(v => v.id === id)?.name || id;
  const modelName = (provider, model) => { const name = report.filterOptions.models.find(m => m.provider === provider && m.model === model)?.name || model || "未知模型"; const prefix = `${vendorName(provider)} · `; return name.startsWith(prefix) ? name.slice(prefix.length) : name; };
  function requestTable() {
    const groups = tab === "providers" ? report.byProvider : report.byModel;
    if (tab !== "requests") return table([tab === "providers" ? "供应商" : "模型", "请求数", "预估成本"], groups.map(g => { const [provider, ...model] = g.key.split(" / "); return [tab === "providers" ? vendorName(g.key) : `${vendorName(provider)} / ${modelName(provider, model.join(" / "))}`, g.calls, currencies(g, "estimated")]; }));
    return table(["时间 (UTC)", "供应商 / 模型", "项目 / 镜头", "状态", "预估成本"], report.records.map(r => [
      r.at?.replace("T", " ").slice(0, 19), el("div", { class: "console-model-cell" }, el("strong", {}, vendorName(r.provider)), el("span", { title: r.model || "" }, modelName(r.provider, r.model))), [r.projectId, r.shotId].filter(Boolean).join(" / "), el("span", { class: `console-status ${r.status === "succeeded" ? "success" : r.status === "failed" ? "failure" : "pending"}` }, ({ succeeded: "已完成", failed: "失败", running: "生成中", submitted: "已提交", uncertain: "待确认", reserved: "已预留" }[r.status] || r.status)),
      r.estimate ? el("span", { title: `${r.estimate.quantity} ${unitLabel(r.estimate.unit)} × ${r.estimate.rate}` }, `${r.estimate.currency} ${r.estimate.amount.toFixed(4)}`) : estimateLabel(r.estimateStatus)
    ]));
  }
  function keyForm(provider, configured) {
    const key = input("apiKey", "password", "", { autocomplete: "off", minlength: 12, maxlength: 512, required: true, placeholder: configured ? "已加密保存，输入新 Key 可替换" : "尚未配置" });
    const form = el("form", { class: "console-key-form" }, field(provider, key), el("button", { type: "submit", class: "button outline" }, "安全保存"), button("清除", async () => { await api(`/api/secrets/${provider}`, { method: "DELETE" }); key.value = ""; key.placeholder = "尚未配置"; toast("已清除该凭据"); }));
    return submitForm(form, async values => { await api(`/api/secrets/${provider}`, { method: "PUT", body: JSON.stringify(values) }); key.value = ""; key.placeholder = "已加密保存"; });
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
      if (mode === "settings") {
        const [upscales, billing] = await Promise.all([api("/api/upscale"), api("/api/billing")]);
        if (token !== generation) return;
        root.replaceChildren(el("header", {}, el("h1", {}, "本地与账单设置"), el("a", { href: "#providers" }, "← 返回供应商配置")), upscalePanel(upscales), billingPanel(billing)); return;
      }
      const data = await api(`/api/usage?${new URLSearchParams(filters)}`);
      if (token !== generation) return; report = data;
      const modelsFor = provider => [...new Map(data.filterOptions.models.filter(m => !provider || m.provider === provider).map(m => [m.model, [m.model, provider ? m.name : `${vendorName(m.provider)} · ${m.model}`]])).values()];
      const controls = el("form", { class: "console-filters" },
        field("供应商", select("provider", [["", "全部供应商"], ...data.filterOptions.vendors.map(v => [v.id, v.name])], filters.provider || "")),
        field("模型", select("model", [["", "全部模型"], ...modelsFor(filters.provider)], filters.model || "")),
        field("开始日期（UTC）", input("from", "date", filters.from || "")), field("结束日期（UTC）", input("to", "date", filters.to || "")), el("div", { class: "console-filter-actions" }, el("button", { type: "submit", class: "button primary" }, "确认"), button("重置", () => { filters = {}; void load(); })));
      controls.addEventListener("submit", e => { e.preventDefault(); const values = Object.fromEntries([...new FormData(controls)].filter(([, v]) => v)); if (values.from && values.to && values.from > values.to) { toast("开始日期不能晚于结束日期", "error"); return; } filters = values; controls.querySelector('[type="submit"]').disabled = true; void load().finally(() => { controls.querySelector('[type="submit"]').disabled = false; }); });
      controls.elements.provider.addEventListener("change", () => { controls.elements.model.replaceChildren(...[["", "全部模型"], ...modelsFor(controls.elements.provider.value)].map(([value, name]) => el("option", { value }, name))); });
      const log = section("调用记录");
      const renderLog = () => {
        const tabs = el("div", { class: "console-tabs", role: "tablist", "aria-label": "用量统计视图" }, [["requests", "请求日志"], ["providers", "供应商统计"], ["models", "模型统计"]].map(([id, title]) => { const b = button(title, () => { if (tab === id) return; tab = id; renderLog(); log.querySelector('[aria-selected="true"]').focus({ preventScroll: true }); }, `button ${tab === id ? "primary" : "outline"}`); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(tab === id)); return b; }));
        const prev = button("上一页", () => { filters.page = String(data.page - 1); void load(); }), next = button("下一页", () => { filters.page = String(data.page + 1); void load(); }); prev.disabled = data.page <= 1; next.disabled = data.page >= data.pages;
        log.replaceChildren(el("h2", {}, "调用记录"), tabs, requestTable(), ...(tab === "requests" ? [el("div", { class: "console-pagination" }, el("span", {}, `共 ${data.summary.calls} 条`), prev, el("span", {}, `${data.page} / ${data.pages}`), next)] : []));
      };
      renderLog();
      const pricing = pricingPanel(data);
      root.replaceChildren(el("header", {}, el("p", { class: "eyebrow" }, "USAGE & COSTS"), el("h1", {}, "用量详情"), el("p", {}, "按供应商、模型与币种查看制作费用。"), el("a", { href: "#providers" }, "管理供应商与 API →")), controls,
        el("div", { class: "console-metrics" }, [["请求数", data.summary.calls], ["预估成本", currencies(data.summary, "estimated")]].map(([label, value]) => el("article", {}, el("small", {}, label), el("strong", {}, value)))), trend(data), log, pricing);
    } catch (error) { toast(error.message, "error"); if (!report) root.replaceChildren(el("p", { role: "alert" }, "用量页面加载失败。请确认新版工作台服务已启动。"), button("重试", load)); }
  }
  return { enter() { if (!entered) { entered = true; void load(); } }, leave() { if (!entered) return; entered = false; generation++; root.querySelectorAll('input[type="password"]').forEach(node => { node.value = ""; }); } };
}
