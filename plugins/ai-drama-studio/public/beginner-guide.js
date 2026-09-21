export const guideSections = [
  { id: "quick-start", title: "快速开始", intro: "OpenDramaFlow 是 Agent 的本地视频工作台。你在 Agent 对话里提出创作要求，在工作台中管理项目、素材、模型与制作记录。", topics: [
    { id: "first-connection", title: "连接工作台", paragraphs: ["先让 Agent 安装并连接 OpenDramaFlow，再打开它返回的本机工作台地址。工作台不是独立聊天机器人；脚本规划、工具调用和制作编排由 Agent 完成。", "Codex 可以把工作台放在对话右侧；其他支持 MCP 的 Agent 也可连接工具，在浏览器中查看工作台。电脑更换后需要重新配置本机环境和密钥。"] },
    { id: "first-video", title: "完成第一次创作", steps: ["打开「供应商与 API」，配置要使用的视频供应商密钥。Codex 生图默认使用内置 imagegen；其他 Agent 还需配置图片 API。", "在「项目库」点击「新建项目」，输入项目名称；进入项目，为本次内容创建创作页。", "在 Agent 对话中说明项目与创作页、时长、画幅、风格、参考资料和预算，让它先整理剧本与分镜。", "检查候选图片并确认采用的版本，再开始视频生成。", "让 Agent 完成剪辑，观看视频、检查声音和字幕，确认后保存交付版本。"], example: "在项目《我的短片》的第一集创作页中制作一段 30 秒、16:9 的雨夜短片。先给我剧本、分镜和角色候选图，本轮不要调用视频生成；确认后再按我的预算制作。" }
  ] },
  { id: "providers", title: "模型与密钥", intro: "默认模型决定新任务优先用谁，供应商配置决定怎样连接服务。两者相互独立。", topics: [
    { id: "api-keys", title: "配置供应商", steps: ["进入「供应商与 API」，从国内、海外或自定义列表中选中供应商。", "填写 API Key 并保存。部分供应商需要 Access Key / Secret Key，请按界面字段分别填写。", "接口地址已按预设提供，可展开「接口与请求地址」核对。保存成功不等于账号已开通对应模型。", "如需接入自己的服务，点击「添加供应商」，填写接口协议、Base URL、请求路径和模型 ID，再配置密钥。"], paragraphs: ["密钥保存在本机系统加密存储中，不写入项目或 Git。自定义服务必须兼容界面列出的媒体协议，并非填写任意网址就能调用。"] },
    { id: "default-models", title: "选择默认模型", paragraphs: ["在「默认生成模型」中分别选择视频、图片 API 和独立 TTS，然后点击「保存默认选择」。新任务未特别指定模型时使用这里的选择；已经创建的任务不受影响。", "Codex 图片优先使用会话内置 imagegen，消耗 Codex 额度，不计入外部图片 API 费用。图片备用 API 仅在明确指定或内置工具不可用时使用；其他 Agent 使用配置好的图片 API。", "独立 TTS 用于旁白或补录，不会改变 ASR 和音乐入口。现有专业 Skill 主要适配 Seedance；切换模型时应让 Agent 按实际接口能力调整提示词和参考素材。"], example: "这次视频使用我已配置的可灵，先检查支持的时长、画幅和参考图格式，并调整提示词。不要改动已经提交的 Seedance 任务。" }
  ] },
  { id: "projects", title: "项目与素材", intro: "项目保存一部作品的公共资料；分卷组织故事阶段；创作页承载单集制作或资产开发。", topics: [
    { id: "project-structure", title: "创建项目、分卷与创作页", paragraphs: ["从「项目库」新建项目后，进入项目详情组织分卷和创作页。创作页类型包括单集生产、分卷总控、资产开发和系列总览；角色母版可以单独放在资产开发页。", "左侧项目和分卷可以分别展开、折叠。分卷内创作页默认按名称排序，也可切换创建顺序。统一使用 E01、E02 等编号，能让多集内容更容易查找。", "同名项目或多个创作页并存时，在对话中明确目标。切换工作台页面不代表 Agent 自动换了制作目标。"] },
    { id: "asset-management", title: "导入、组织与确认素材", paragraphs: ["在项目素材页上传原文、图片、音视频等资料，并用文件夹整理来源、角色、场景与成片。支持的格式以文件选择器和界面提示为准。只导入你有权使用的内容。", "图片生成先得到候选，再确认具体版本入库；不满意的候选不会自动替换角色母版。可以明确委托 Agent 验收某个项目范围，但需要说明范围和标准。", "告诉 Agent 哪张图属于哪个镜头、角色和版本。素材检索依据镜头关联、版本和元数据，不会自动理解视频里的所有动作。删除前检查引用，避免移除后续镜头需要的母版。"], example: "采用角色卡候选 B，作为第一集主角母版，导入角色文件夹。其他候选不要入库；后续镜头保持这一版服装与脸型。" },
    { id: "canvas", title: "使用创作画布", paragraphs: ["打开创作页查看画布中的素材和制作节点。可拖动节点整理位置，使用画布的缩放与视图控件浏览内容，点击媒体节点查看具体素材。", "画布是查看和组织制作内容的界面。节点布局不等于执行命令；生成、修订或剪辑仍需在 Agent 对话中提出，并指明目标镜头与要保留的内容。"] }
  ] },
  { id: "production", title: "创作流程与 Skill", intro: "从明确需求开始，逐步形成剧本、分镜、参考素材、视频和交付版本。并非每次请求都要走完整流程。", topics: [
    { id: "brief", title: "提出需求与控制预算", paragraphs: ["说明题材、观众、平台、目标时长、画幅、画风、声音要求和素材来源。只想做角色图或改一个镜头时，直接限定本轮范围。", "自动模式会在已授权目标和预算内继续执行；手动模式需要对应审批。需要停在剧本、候选图或试镜阶段时，请在对话中明确说明。", "外部生成失败或结果不明时，先让 Agent 用原任务 ID 查询，不要直接重复提交。已成功的视频可重做本地后期，不必重新付费生成。"] },
    { id: "skills", title: "查看与启停 Skill", paragraphs: ["「Skill」页面可搜索和筛选内置、导入及停用技能。启用开关影响后续自动匹配，不会重跑已完成的制作。", "点击技能查看 SKILL.md 与参考资料，文件夹可以独立折叠。通常只需描述目标，Agent 会选择合适技能；也可在对话中明确指定技能名称。", "通过「导入 Skill」添加自有技能文件。导入前检查其中的模型要求、调用规则和适用范围，避免过时内容覆盖你的制作约束。"] },
    { id: "review-delivery", title: "验收镜头与交付", steps: ["检查剧本与原文是否一致，镜头顺序、台词和动作是否完整。", "确认角色、服装、场景和参考图版本，再生成视频。", "逐镜观看视频，检查人物一致性、动作衔接、字幕与声音；局部问题只修受影响的区间。", "完成剪辑后再次观看整片，并保留原素材、制作记录和最终版本。"], paragraphs: ["文件生成成功和技术检查通过不等于画面质量已验收。让 Agent 分别报告完成了哪些技术检查、哪些内容实际看过或听过、哪些仍待你确认。"] }
  ] },
  { id: "costs-tools", title: "用量与本地工具", intro: "外部模型用量和本地处理任务分开管理。工具配置只影响后续使用，不会自动启动处理。", topics: [
    { id: "usage", title: "查询费用与设置价格", paragraphs: ["在「用量详情」选择供应商后，模型列表会显示对应模型。设置开始和结束日期，点击「确认」应用条件；点击「重置」清空筛选。日期按页面标注的 UTC 计算。", "请求日志、供应商统计和模型统计查看的是同一组筛选结果。没有消费记录的模型会显示空表；预估成本按币种展示，不合并不同币种。", "页面底部的「模型定价」按供应商与模型展开。可按自己的优惠修改单价并保存，新调用使用更新后的价格。预估成本不等于供应商最终扣款。"] },
    { id: "upscale", title: "配置视频超分", paragraphs: ["在「工具」展开 Real-ESRGAN，填写本机可执行文件和模型目录，选择匹配的模型、GPU 与 Tile，点击「验证文件并保存」。不确定参数时，让 Agent 先检查本机环境。", "配置完成后，在对话中指定要超分的源视频和目标分辨率。「超分任务」显示帧进度、状态及暂停／恢复操作，不是消费记录。已有分块会按校验结果复用。", "超分仅支持本地执行，不提供共享云端服务器。它生成新的后期版本，不会覆盖原片，也不代表源视频原生就是 4K。"] },
    { id: "depth", title: "配置视频深度与后期工具", paragraphs: ["在 Video Depth Anything 中填写专用 Python、项目目录与模型权重路径，点击「验证路径并保存」。标题旁的信息图标说明配置与执行的区别，悬浮或键盘聚焦都能查看。", "视频深度是外部处理工具，用于把参考视频转换为时序深度参考，不是自动动作捕捉或保证动作迁移成功的功能。让 Agent 检查模型、输入、输出目录后再执行。", "FFmpeg 区域显示剪辑、音频降噪、混音、字幕等依赖状态，点击「重新检测」可刷新。音量、字幕和剪辑参数按每次任务单独指定。"] }
  ] },
  { id: "troubleshooting", title: "常见问题", intro: "先区分页面连接、工具环境和供应商任务，避免把本地显示问题误当成生成失败。", topics: [
    { id: "loading-errors", title: "页面或工具配置加载失败", paragraphs: ["先刷新页面，确认打开的是 Agent 返回的当前工作台地址。更新插件后若提示接口不存在或需加载新版服务，让 Agent 重启对应工作台；只刷新浏览器不会更新后台进程。", "重启时说明工作台地址和端口，保留其他正在制作的服务。不要为了恢复页面关闭全部 Agent 或删除项目数据。"] },
    { id: "generation-errors", title: "密钥已保存但无法生成", paragraphs: ["检查供应商账号是否开通目标模型、余额是否充足、地区和接口是否匹配。保存 Key 只验证保存操作，不代表已完成付费生成测试。", "将错误与原任务 ID 交给 Agent 核对。不要把完整密钥贴进对话或截图。对于结果未知的付费任务，先查询再决定是否重试。"] },
    { id: "missing-tools", title: "本机工具不存在或路径失效", paragraphs: ["确认可执行文件、模型权重和目录确实存在。移动工具目录或换电脑后，重新填写路径。Python 本体存在并不表示该环境已安装所需依赖。", "FFmpeg 使用工作台进程的 PATH。安装后重新启动工作台并检测；视频深度和超分仍需分别检查自己的依赖与模型文件。"] }
  ] }
];

export function mountBeginnerGuide(el) {
  const root = document.querySelector("#project-guide-view");
  const nav = el("nav", { class: "guide-toc", "aria-label": "指南目录" }, el("strong", {}, "使用文档"));
  const article = el("article", { class: "guide-article", "aria-label": "新手指南正文", tabindex: "0" });
  const targets = new Map();
  function heading(tag, item) {
    const node = el(tag, { id: `guide-${item.id}`, tabindex: "-1" }, item.title);
    targets.set(item.id, node);
    return node;
  }
  for (const section of guideSections) {
    nav.append(el("a", { href: `#project-guide/${section.id}`, class: "guide-toc-section" }, section.title), el("div", { class: "guide-toc-topics" }, section.topics.map(topic => el("a", { href: `#project-guide/${topic.id}` }, topic.title))));
    article.append(el("section", {}, heading("h2", section), el("p", { class: "guide-intro" }, section.intro), section.topics.map(topic => el("section", {}, heading("h3", topic),
      (topic.paragraphs || []).map(p => el("p", {}, p)), topic.steps ? el("ol", {}, topic.steps.map(p => el("li", {}, p))) : null,
      topic.example ? el("aside", { class: "guide-example" }, el("strong", {}, "试着这样告诉 Agent"), el("p", {}, topic.example)) : null))));
  }
  root.replaceChildren(el("header", { class: "guide-header" }, el("p", { class: "eyebrow" }, "GETTING STARTED"), el("h1", {}, "新手指南"), el("p", {}, "从第一次配置到完整交付，了解每个页面怎么用。")), el("div", { class: "guide-layout" }, nav, article));
  const activate = id => nav.querySelectorAll("a").forEach(link => {
    if (link.hash === `#project-guide/${id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  function navigate() {
    if (!location.hash.startsWith("#project-guide")) return;
    const id = location.hash.split("/")[1] || guideSections[0].id;
    const target = targets.get(id) || targets.values().next().value;
    requestAnimationFrame(() => {
      if (root.hidden) return;
      article.scrollTop += target.getBoundingClientRect().top - article.getBoundingClientRect().top - 24;
      activate(target.id.slice(6));
      if (location.hash.includes("/")) target.focus({ preventScroll: true });
    });
  }
  nav.addEventListener("click", event => { if (event.target.closest("a")?.hash === location.hash) navigate(); });
  article.addEventListener("scroll", () => {
    const top = article.getBoundingClientRect().top;
    let current = guideSections[0].id;
    for (const [id, target] of targets) { if (target.getBoundingClientRect().top <= top + 60) current = id; else break; }
    activate(current);
  }, { passive: true });
  return { navigate };
}
