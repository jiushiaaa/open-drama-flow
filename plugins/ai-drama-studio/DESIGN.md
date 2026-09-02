---
version: alpha
name: "OpenDramaFlow"
description: "A quiet Chinese AI comic-drama production desk with a restrained blue pixel-studio identity."
colors:
  paper: "#EEF3FB"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFF"
  ink: "#17171A"
  muted: "#656B76"
  line: "#DFE6F2"
  primary: "#151518"
  primary-strong: "#303035"
  accent: "#405CE0"
  warning: "#9A5A13"
  danger: "#BA3441"
  success: "#277658"
typography:
  sans:
    fontFamily: "Inter, Microsoft YaHei UI, PingFang SC, Noto Sans CJK SC, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  DEFAULT: "0.5rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  dialog: "1rem"
spacing:
  panel-gap: "0.75rem"
  page-gutter: "0.875rem"
  sidebar: "16.25rem"
components:
  app-shell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.sans}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.panel-gap}"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.surface}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  field:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.page-gutter}"
  separator:
    backgroundColor: "{colors.line}"
    height: "0.0625rem"
  stage-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  status-muted:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.muted}"
    typography: "{typography.mono}"
  status-warning:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warning}"
  status-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
  status-success:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.success}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
  shot-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
---

# OpenDramaFlow Design System

## Overview

### Creative North Star

像 MiniMax Design 一样安静、宽松的桌面创作工具，同时拥有一套克制的蓝紫像素片场身份：机器人导演、分镜画面和时间线只负责表达“从剧本到成片”，用户仍能清楚看见作品阶段、镜头证据、模型费用边界和下一步决策。

### Product context and register

- **Audience and primary job:** 独立 AI 漫剧创作者；让 Codex 代管从剧本到成片的长链路，同时保留人工费用决策。
- **Target market(s) and evidence:** 中文创作场景；用户以中文提出漫剧、Seedance 和本地 Codex 工作流需求。
- **Locale(s) and language policy:** 界面使用简体中文，模型/协议标识保留英文；中文为唯一产品文案来源。
- **Usage scene:** Windows 桌面浏览器高频制作，桌面三列优先，窄屏用于检查与审批。
- **Register:** 制作型产品，不是营销落地页；语气直接、克制、可核验。
- **Memorable signature:** ImageGen 生成的像素机器人导演同时担任应用 Icon 与空状态主视觉；主画布里的“制作脊柱”以方形编号贯穿故事、角色、分镜、素材、视频、成片。
- **Restraint:** 像素语言只用于品牌资产、标题辅助字体、阶段编号和少量块状阴影；表单、密钥、审批和错误恢复继续使用熟悉控件。
- **Reference boundary:** 借鉴参考图的蓝紫像素媒介、白色留白与轻快工具感，也保留 MiniMax Design 的浅色侧栏和黑色主动作；不复制任何现有吉祥物、业务文案、卡片结构或聊天布局。
- **Token ownership/runtime mapping:** 本文件是视觉意图与规范值来源；`public/styles.css` 的 `:root` 是唯一运行时映射。检查以 `designmd lint`、严格项目审计和人工 token 对照为准。

## Colors

默认浅色桌面：`paper` 是带轻微蓝感的工作底，`surface` 是主画布，`surface-subtle` 只做次级区域。`primary` 是近黑主动作，`accent` 电光蓝只用于当前阶段、焦点、像素资产呼应和品牌微强调；`warning` 表示待审批/费用风险，`danger` 表示失败或清除凭据，`success` 只表示有成功证据。当前版本无深色主题；强制高对比时让系统接管颜色与滚动条。

## Typography

中文正文优先 `Microsoft YaHei UI` / `PingFang SC` / `Noto Sans CJK SC`，拉丁界面可使用 Inter 回退。标题 700–770 重量、紧凑字距；正文 14–16px、行高 1.5–1.75。品牌名、镜头号、阶段号、状态时间与英文制作标签使用 mono 栈，形成像素工具的节拍；大段中文正文不使用像素字体、斜体或全大写。

## Layout

桌面为固定浅蓝灰左侧栏与白色主画布。侧栏收纳开始创作、项目导航、制作入口、设置与本地服务状态；主画布先呈现项目库标题，再放制作脊柱和三列工作区。没有项目时，透明像素片场主视觉占据空状态中心但不改变操作顺序；其后的“项目新手指引”是内置文档，不进入项目数据。1260px 以下活动列落到下一行，900px 以下侧栏变为横向导航并改成单列，620px 以下镜头卡改为横向信息卡。设置对话框只承载 API Key 和已接入能力摘要；标题和动作始终可达。媒体使用明确 9:16 比例避免布局位移。

## Elevation & Depth

静态层级主要靠纸张色差和 1px 蓝灰边线。品牌主动作、开始创作与空状态允许 3–4px 无模糊块状阴影，作为像素语言的唯一立体表达；全局柔和强阴影仍只给设置对话框与 toast。镜头内容不使用悬浮玻璃或装饰性阴影。

## Shapes

按钮、字段和卡片使用 6–12px 圆角，主画布 14px，设置对话框 16px；按钮不用药丸形。制作脊柱使用方形编号和紧凑卡片强化顺序。普通操作图标继续使用 Lucide Static；应用品牌与空状态使用 ImageGen 像素资产，二者不互相替代。

## Components

### Foundational visual states

共享 Button、Field、Dialog、Toast、StatusChip、ShotCard 和 ProductionSpine 的 default、hover、focus-visible、disabled、busy、success、warning、error 状态由 `public/styles.css` 维护。忙碌按钮保留尺寸并暴露 `aria-busy`；不使用假百分比或可选 skeleton。

### Buttons and actions

每个决策区只保留一个 primary。Outline 用于普通次级动作，Warning 用于真实模型审批/执行，Danger Ghost 用于清除凭据。按钮动词具体；危险动作与频繁动作留出空间。图标动作不取代关键文本按钮。

### Navigation and data display

制作脊柱是阶段导航/进度证据，不是可点击 tab；当前、完成、未来状态同时用文字和颜色表达。镜头卡固定 9:16 预览，元数据显示景别、时长和真实状态。任务卡只将 `succeeded` 视为完成证据。

### Forms and overlays

Settings dialog 是唯一密钥输入所有者，全局 toast viewport 是唯一瞬时反馈所有者。密钥默认遮罩，显隐按钮保留焦点，保存后清空。模型、Model ID、画幅、分辨率、水印、音频、调用上限和连接地址均由系统维护，不渲染成用户字段。字段错误内联关联；对话框实现 inert 背景、焦点圈、Escape 和焦点恢复。滚动条基线全局维护。

### Iconography

普通操作使用 Lucide Static 线框资产，保持约 2px 视觉重量；应用 Icon 和空状态主视觉使用同一套 ImageGen 蓝紫像素资产。核心动作保留文字标签；关闭按钮等图标动作使用 40px 目标和明确 `aria-label`。

### Motion

只对对话框进入和 toast 使用 160–220ms 动画，按钮 hover 位移 1px；动画表达层级与状态，不装饰常规刷新。`prefers-reduced-motion` 下移除位移并将过渡缩到 80ms。

### Content and data visualization

不把“已排队”写成“已生成”，不显示供应商原始错误或密钥。状态词保留协议英文以便排错，解释文案使用中文。技术 Model ID 保留在 Codex 可审计的系统配置中，不出现在普通用户设置界面；镜头号和审批调用计数保持原值。

## Do's and Don'ts

- **Do:** 让阶段、镜头、任务、审批和成片证据同时可见。
- **Do:** 普通用户只需提供 API Key；系统代管模型和生成参数。
- **Do:** 让像素机器人、分镜和时间线只出现在品牌与创作氛围区域。
- **Do:** 所有视觉 token 经本文件到 `public/styles.css` 单一路径落地。
- **Do:** 项目库只呈现用户主动创建的真实项目；新手指引始终保持为文档。
- **Don't:** 复制 MiniMax Design 外观或把产品做成聊天框套壳。
- **Don't:** 使用假成功、假进度、密钥回显、浏览器原生确认框或无动作按钮。
- **Don't:** 注入示例项目、内置故事、占位素材、假任务或演示流水线。
- **Don't:** 在普通设置中暴露模型 ID、供应商 URL、画幅、分辨率、水印或调用上限。
- **Don't:** 把表单、审批卡或长文本做成游戏 HUD，也不重复生成不同风格的吉祥物。
