// No credentials are returned by the API or retained in localStorage.
export function createProductionConsole({ el, api, toast, mode = "usage" }) {
  const root = el("section", { id: mode === "settings" ? "local-settings-view" : "production-console-view", class: "route-view production-console", hidden: true });
  document.querySelector(".main-surface").append(root);
  let entered = false, filters = {}, tab = "requests", report, catalog, generation = 0;
  const button = (label, action, className = "button outline") => el("button", { type: "button", class: className, onclick: async () => { try { await action(); } catch (error) { toast(error.message, "error"); } } }, label);
  const money = values => Object.entries(values || {}).map(([currency, amounts]) => `${currency} ${typeof amounts === "number" ? amounts.toFixed(4) : amounts}`).join(" · ") || "暂无记录";
  const currencies = (summary, key) => money(Object.fromEntries(Object.entries(summary.currencies || {}).filter(([, a]) => a[`${key}Records`] > 0).map(([c, a]) => [c, a[key]])));
  const input = (name, type = "text", value = "", extra = {}) => el("input", { name, type, value, ...extra });
  const field = (label, node) => el("label", {}, el("span", {}, label), node);
  const select = (name, choices, value) => { const node = el("select", { name }, choices.map(([v, text]) => el("option", { value: v }, text))); node.value = value; return node; };
  const section = (title, ...children) => el("section", { class: "console-panel" }, el("h2", {}, title), ...children);
  const table = (headers, rows) => el("div", { class: "console-table-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, headers.map(h => el("th", {}, h)))), el("tbody", {}, rows.length ? rows.map(row => el("tr", {}, row.map(cell => el("td", {}, cell ?? "—")))) : el("tr", {}, el("td", { colspan: headers.length, class: "console-empty" }, "暂无记录；未测试或未定价不等于免费。")))));
  const detail = (title, ...nodes) => el("details", { class: "console-panel" }, el("summary", {}, title), ...nodes);
  const unitLabel = unit => ({ request: "次", image: "张", second: "秒", character: "字符", million_tokens: "百万 Token", megapixel: "百万像素（向上取整）" }[unit] || unit);
  const estimateLabel = status => ({ "historical-unknown": "历史价格未记录", "quantity-unknown": "等待计费用量", "price-not-configured": "缺少匹配价格" }[status] || "暂无估算");
  const providerOf = rule => rule.provider === "doubao-speech" ? "speech" : rule.provider || (["asr", "tts", "music"].includes(rule.kind) ? "speech" : rule.kind.startsWith("fal-") ? "fal" : rule.kind.startsWith("replicate-") ? "replicate" : "ark");
  function submitForm(form, action) {
    form.addEventListener("submit", async event => { event.preventDefault(); const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
      try { await action(Object.fromEntries(new FormData(form))); toast("已保存", "success"); } catch (error) { toast(error.message, "error"); } finally { if (submit) submit.disabled = false; }
    }); return form;
  }
  function priceForm(rule = {}) {
    if (!rule.model) {
      const vendor = select("vendor", catalog.vendors.map(v => [v.id, v.name]), catalog.vendors[0].id), models = select("profile", [], ""), body = el("div");
      const update = () => {
        const speechModel = catalog.speechPriceModels?.find(p => p.model === models.value);
        if (vendor.value === "speech" && speechModel) { body.replaceChildren(priceForm(report.prices.find(r => providerOf(r) === "speech" && r.model === speechModel.model) || speechModel)); return; }
        const p = catalog.providers.find(p => p.id === models.value); if (!p) return;
        const rules = report.prices.filter(r => providerOf(r) === p.provider && r.model === p.model && (!r.profile || r.profile === p.id));
        if (rules.length > 1) {
          const variants = select("variant", rules.map((r, i) => [String(i), r.specification || r.variant || "自定义通用价格"]), "0"), editor = el("div", {}, priceForm(rules[0]));
          variants.addEventListener("change", () => editor.replaceChildren(priceForm(rules[Number(variants.value)])));
          body.replaceChildren(field("计费规格", variants), editor); return;
        }
        body.replaceChildren(priceForm(rules[0] || { provider: p.provider, profile: p.id, model: p.model, kind: p.id === "ark" ? "seedance-video" : p.id === "ark-seedream" ? "ark-image" : `${p.provider}-${p.kind}`, unit: p.kind === "image" ? "image" : p.kind === "video" ? "second" : "character" }));
      };
      const changeVendor = () => { const items = vendor.value === "speech" ? (catalog.speechPriceModels || []).map(p => ({ id: p.model, model: `${p.kind.toUpperCase()} · ${p.model}` })) : catalog.providers.filter(p => p.provider === vendor.value); models.replaceChildren(...items.map(p => el("option", { value: p.id }, p.model))); update(); };
      vendor.addEventListener("change", changeVendor); models.addEventListener("change", update); changeVendor();
      return el("div", {}, el("div", { class: "console-form" }, field("供应商", vendor), field("模型", models)), body);
    }
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
    return submitForm(form, async values => { if (!values.profile) delete values.profile; await api("/api/usage/prices", { method: "PUT", body: JSON.stringify({ ...values, rate: Number(values.rate), ...(rule.variant ? { variant: rule.variant, conditions: rule.conditions } : {}) }) }); await load(); });
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
    return section("每日费用趋势 · UTC", ...(panels.length ? panels : [el("p", {}, "新调用会自动匹配价格；Token、像素和音频时长计费需等接口返回用量。历史未记录价格的调用不按现价回填；录入账单后显示实账。") ]));
  }
  function requestTable() {
    const groups = tab === "providers" ? report.byProvider : report.byModel;
    if (tab !== "requests") return table([tab === "providers" ? "供应商" : "模型", "请求数", "估算", "已核对账单", "未核账"], groups.map(g => [g.key, g.calls, currencies(g, "estimated"), currencies(g, "actual"), g.unreconciled]));
    return table(["时间 (UTC)", "供应商 / 模型", "项目 / 镜头", "状态", "估算", "实账", "操作"], report.records.map(r => [
      r.at?.replace("T", " ").slice(0, 19), `${r.provider} / ${r.model || "未知模型"}`, [r.projectId, r.shotId].filter(Boolean).join(" / "), r.status,
      r.estimate ? el("span", { title: `${r.estimate.quantity} ${unitLabel(r.estimate.unit)} × ${r.estimate.rate}；${r.estimateStatus === "provider-usage-estimated-not-billed" ? "按接口返回用量估算，非账单" : "按请求用量估算，非账单"}` }, `${r.estimate.currency} ${r.estimate.amount}`) : estimateLabel(r.estimateStatus), r.actual ? `${r.actual.currency} ${r.actual.amount}` : "待核对",
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
      const [data, providers] = await Promise.all([api(`/api/usage?${new URLSearchParams(filters)}`), api("/api/providers")]);
      if (token !== generation) return; report = data; catalog = providers;
      const controls = el("form", { class: "console-filters" },
        field("供应商", select("provider", [["", "全部供应商"], ...data.options.providers.map(v => [v, v])], filters.provider || "")),
        field("模型", select("model", [["", "全部模型"], ...data.options.models.map(v => [v, v])], filters.model || "")),
        field("开始日期 UTC", input("from", "date", filters.from || "")), field("结束日期 UTC", input("to", "date", filters.to || "")), el("button", { type: "submit", class: "button primary" }, "筛选"), button("刷新", load));
      controls.addEventListener("submit", e => { e.preventDefault(); filters = Object.fromEntries([...new FormData(controls)].filter(([, v]) => v)); void load(); });
      controls.elements.provider.addEventListener("change", () => { filters.provider = controls.elements.provider.value; delete filters.model; delete filters.page; void load(); });
      const log = section("调用记录", el("div", { class: "console-tabs" }, [["requests", "请求日志"], ["providers", "供应商统计"], ["models", "模型统计"]].map(([id, title]) => button(title, () => { tab = id; void load(); }, `button ${tab === id ? "primary" : "outline"}`))), requestTable(),
        el("div", { class: "console-pagination" }, button("上一页", () => { filters.page = String(Math.max(1, data.page - 1)); void load(); }), el("span", {}, `${data.page} / ${data.pages}`), button("下一页", () => { filters.page = String(Math.min(data.pages, data.page + 1)); void load(); })));
      root.replaceChildren(el("header", {}, el("p", { class: "eyebrow" }, "USAGE & COSTS"), el("h1", {}, "用量详情"), el("p", {}, "按供应商、模型与币种查看制作费用。"), el("a", { href: "#providers" }, "管理供应商与 API →")), controls,
        el("div", { class: "console-metrics" }, [["请求数", data.summary.calls], ["预估成本", currencies(data.summary, "estimated")], ["已核对账单", currencies(data.summary, "actual")], ["待核账 / 暂无估算", `${data.summary.unreconciled} / ${data.summary.unpriced}`]].map(([label, value]) => el("article", {}, el("small", {}, label), el("strong", {}, value)))),
        el("p", { class: "console-note" }, `估算与实账分开，各币种不混算。历史未记录价格 ${data.summary.estimateGaps?.historical || 0} 条 · 等待用量 ${data.summary.estimateGaps?.quantity || 0} 条 · 缺匹配价格 ${data.summary.estimateGaps?.price || 0} 条。不统计 Codex 订阅或本机电费；失败或未知不等于免费。`),
        detail(`模型定价 · ${data.prices.filter(r => r.preset).length} 条官方规格预设与自定义优惠`, el("p", {}, "内置供应商目录均有价格预设，自动应用于新调用，无需先保存。按供应商、模型和规格隔离；资源包、免费额度和阶梯折扣不自动推断，可自行修改优惠单价。Seedance 按返回的 completion_tokens 计价；声音开关不改变其 2.5 单价。"), priceForm(),
          ...catalog.vendors.map(v => { const rules = data.prices.filter(r => providerOf(r) === v.id); return detail(v.name, ...(rules.length ? rules.map(rule => detail(`${rule.model} · ${rule.variant || "默认规格"} · ${rule.currency} ${Number(rule.rate.toPrecision(8))}/${unitLabel(rule.unit)} · ${rule.preset ? "官方预设" : "自定义"}`, el("p", {}, `${rule.specification || "自定义规格"} · ${rule.recordedAt || ""}`), /^https:\/\//.test(rule.source) ? el("a", { href: rule.source, target: "_blank", rel: "noopener noreferrer" }, "查看官方价格来源 ↗") : null, priceForm(rule))) : [el("p", {}, "自定义供应商请填写约定价格；不继承其他供应商的报价。") ])); })), trend(data), log);
    } catch (error) { toast(error.message, "error"); if (!report) root.replaceChildren(el("p", { role: "alert" }, "用量页面加载失败。请确认新版工作台服务已启动。"), button("重试", load)); }
  }
  return { enter() { if (!entered) { entered = true; void load(); } }, leave() { if (!entered) return; entered = false; generation++; root.querySelectorAll('input[type="password"]').forEach(node => { node.value = ""; }); } };
}
