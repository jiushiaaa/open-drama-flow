<p align="center"><a href="README.md">English</a> · 简体中文</p>

<p align="center">
  <img src="plugins/ai-drama-studio/public/assets/studio-pixel-hero.png" alt="OpenDramaFlow 机器人制片工作室" width="920" />
</p>

<h1 align="center">OpenDramaFlow</h1>

<p align="center"><strong>你来讲故事，Agent 来组织制作。</strong><br />本地优先的视频制作 Harness，提供 Codex 原生插件与标准 MCP 接入。</p>

<p align="center">
  <img alt="MIT 软件许可" src="https://img.shields.io/badge/License-MIT-62c370" />
  <img alt="Codex 插件" src="https://img.shields.io/badge/Codex-Plugin-111827" />
  <img alt="MCP" src="https://img.shields.io/badge/Tools-MCP-3b82f6" />
  <img alt="Windows 与 macOS" src="https://img.shields.io/badge/Windows%20%7C%20macOS-Local--first-2563eb" />
</p>

<p align="center"><a href="#作品展示">作品展示</a> · <a href="#快速开始">快速开始</a> · <a href="#agent-兼容性">Agent 兼容性</a> · <a href="#制作流程">制作流程</a> · <a href="#内置技能">技能</a> · <a href="AGENT_GUIDE.md">Agent 安装指南</a></p>

OpenDramaFlow 把你的 AI 助手连接成一个视频制作工作台：规划故事、设计角色与镜头、生成素材、复核效果、剪辑交付。通过 MCP 串联 **47 个 Skill、五类制作流程、模型接口、版本化素材与本地后期工具**。

面向 **Windows 与 macOS**，提供 Codex 原生插件和其他 Agent 的标准本地 MCP 接入。Agent 负责组织制作，你不必手工搭建节点图。**Codex 默认使用内置 imagegen；其他 Agent 使用用户配置的生图 API Key。**

**左侧 Codex 对话负责创作，右侧插件画布展示素材与成果。** 你不需要从零搭建工作流，也不需要手动添加、连接节点。

## 为什么使用 OpenDramaFlow

- **用对话带领创作。** 从小说改编、短片到产品广告，根据目标选择专业 Skill、编写分镜和 Prompt，再调用工具执行。
- **素材与过程看得见。** 项目、分卷／季度、创作页和素材库统一管理；无限画布支持完整图片预览、视频播放与产物关联。
- **围绕 Seedance 制作。** 按职责组织图片、视频、音频与首尾帧参考，支持视频生成、续写和编辑。
- **可以修改，也可以接着做。** 保存绑定版本的阶段检查点和供应商任务 ID，记录方案选择与成本影响；恢复中断任务时保护已认可片段，减少重复生成。
- **经验留在项目里。** 将候选经验与已批准设定分开，避免一次实验覆盖角色、剧情和其他项目的规则。

![OpenDramaFlow 无限画布：素材、镜头与制作关系](docs/images/production-canvas.png)

<details>
<summary>查看项目库与 Skill 浏览器</summary>

![项目库](docs/images/project-library.png)

![Skill 目录与文件浏览](docs/images/skill-browser.png)

</details>

## 作品展示

### 《从姑获鸟开始》城寨风云篇 · 第一集

**[在抖音观看](https://v.douyin.com/rD_OP4_kMSI/)** · **[在bilibili观看](https://www.bilibili.com/video/BV1WtYC6UEEN/?vd_source=e0643483c6a3517007cd0589b285add0#reply117268142886086)**

[![第一集封面，点击在抖音观看](docs/images/episode-one-cover.jpg)](https://v.douyin.com/rD_OP4_kMSI/)

从角色与场景设定、镜头生成，到声音、剪辑和包装的完整制作案例。

![片头节选：城寨、拳台与锁链](production/publish-examples/opening-showcase.gif)

### 超分前后

左侧为 **720p 源片**，右侧为 **本地 4K 超分结果**；同步展示同一镜头的相同局部区域。

![同镜头局部对比：左侧 720p，右侧 4K 超分](production/publish-examples/upscale-comparison.gif)

[查看原分辨率样例与处理方法](production/publish-examples/README.md)

## 快速开始

### 把这个链接交给你的 Agent

```text
请为我当前使用的 Agent 安装 https://github.com/jiushiaaa/open-drama-flow 。
先阅读 README_zh.md、AGENT_GUIDE.md 和 AGENTS.md，识别宿主并选择对应安装方式。
保留已有 MCP 配置和正在运行的项目，不调用付费模型；验证连接后打开工作台。
```

有本地终端和文件权限的 Agent 可以按指南执行。如果只粘贴仓库链接，请补充“帮我安装”，避免被理解为介绍或审查项目。

### 环境要求

- **Windows 或 macOS**，以及 **Git**。
- **Node.js 20+ / npm**、**FFmpeg / ffprobe**，并确保 Agent 能找到这些命令。
- **Codex Desktop**，或具备 **本地 stdio MCP** 和本地文件权限的其他 Agent。
- 云端生成需要自备供应商凭据，默认 **方舟 / Seedance**，**豆包语音**可选；模型费用由供应商收取。

核心插件不要求 Python。可选深度模型有独立依赖；本地超分需另行安装运行时、权重并具备兼容硬件。

### Codex 原生安装

Windows：

```powershell
git clone https://github.com/jiushiaaa/open-drama-flow.git
cd open-drama-flow
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

macOS，克隆并进入同一仓库后运行：

```bash
bash scripts/install.sh codex
```

安装器检查依赖，并使用可用的系统包管理器补齐工具；macOS 自动安装依赖需要 Homebrew。安装后重新加载插件或新开 Codex 任务。使用 Codex 内置图片工具时，不需要另配生图 Key。

### 其他本地 Agent 接入

按上面的命令克隆仓库后，在仓库根目录运行：

```powershell
npm --prefix plugins/ai-drama-studio ci
node scripts/agent-setup.mjs --check
node scripts/agent-setup.mjs --print-config
```

将输出中的 `ai-drama-studio` 服务条目合并到宿主 MCP 设置，保留其他服务。配置使用本机绝对路径，不需要安装 Codex。[查看各宿主配置方式与验证步骤 →](AGENT_GUIDE.md)

macOS 也可直接运行 `bash scripts/install.sh generic`，完成依赖安装、隔离验证与配置输出。生成的配置选择通用 Agent 模式，合并时请保留 `env` 字段。

**配置 API Key：**方舟 Key 用于 Seedance 视频；非 Codex 宿主还需开通同一 Key 对应的 Seedream 生图，或选择 fal / Replicate 生图 Key。在工作台「API Key」和「用量与工具」中保存，豆包语音可选。Windows 使用 DPAPI、macOS 使用系统钥匙串保管凭据，不写入仓库。工作台地址以 `drama_get_state` 返回值为准，默认 Codex 使用 4317，通用 Agent 使用 4319。

### 开始第一个项目

先描述一个范围明确的小项目：

> 使用 OpenDramaFlow，把我提供的故事制作成一条 15 秒、16:9 的悬疑短片。先梳理事件、角色和镜头，使用当前 Agent 对应的生图方式，候选经我确认后入库；先做一条视频样片，再决定后续制作。请先说明预计调用次数。

默认自动执行当前目标范围内、调用上限明确的任务；图片入库和生产记忆仍保留验收边界。可按项目选择手动审批，不需要手工搭建画布节点。

## Agent 兼容性

跨宿主共享的是 **MCP 工具 + 可阅读的制作指令**，不是声称一份专有插件包能直接安装到所有软件。

| Agent | Windows／macOS 接入方式 | 图片生成 |
| --- | --- | --- |
| Codex Desktop | 原生插件或 Codex MCP 模式 | 默认内置 imagegen |
| Cursor / Claude Code | 标准本地 stdio MCP | 用户配置的生图 API Key |
| Trae Worker / WorkBuddy / DeepSeekHarness／其他 Agent | 使用其本地 stdio MCP 接口（需宿主提供） | 用户配置的生图 API Key |

宿主需具备本地进程／文件权限和 MCP 工具调用，仅有专有插件市场并不充分。各宿主共享相同的项目状态、技能、画布与验收规则。[安装与能力检查清单 →](AGENT_GUIDE.md#1-check-the-host-before-installing)

<details>
<summary>平台与宿主验证状态</summary>

Windows 集成与标准 MCP 冒烟测试已在本机执行。macOS 安装、Application Support 目录与钥匙串保存已实现，并提供 Windows/macOS CI 原生测试；维护者尚未在 Mac 上完成端到端制作实测。其他 Agent 客户端仍需确认实际连接、媒体看听与可信审批能力。项目未提供托管 MCP 网关或 Linux 密钥后端，缺失的看听或确认能力不能记为审核通过。

</details>

## 制作流程

从制作类型开始，而不是从空白节点图开始：

| 类型 | 制作路径 | 请求示例 |
| --- | --- | --- |
| 剧情／短片 | 原文 → 母版 → 拍摄计划 → 预演 → 生成 → 连续性 → 交付 | “把这段已授权的故事改编成悬疑短片。” |
| 广告 | 产品 → 创意 → 参考 → 拍摄 → 生成 → 合规 → 交付 | “用我确认的产品图制作 15 秒广告。” |
| 讲解 | 大纲 → 脚本 → 画面映射 → 素材 → 剪辑 → 审核 → 交付 | “根据我提供的事实做一条 60 秒讲解。” |
| MV | 音乐 → 创意 → 节拍 → 素材 → 剪辑 → 审核 → 交付 | “为这段已授权音乐制作匹配节奏的画面。” |
| 动效演示 | 界面 → 层级 → 时间线 → 本地动画 → 可选生成 → 审核 → 交付 | “把这些 UI 截图做成简洁的产品演示。” |

每阶段都定义输入、必交产物、可用工具、验收标准和恢复位置。这些是供 Agent 执行的制作合同，不代表缺少模型、渲染器或审核工具时也能自动完成。

```mermaid
flowchart LR
    A[创意 / 剧本 / 参考] --> B[Agent 选择流程与 Skill]
    B --> C[拍摄脚本 · 图片与白模预演]
    C --> D[验收素材 · 编译 Prompt]
    D --> E[Seedance 视频生成]
    E --> F{镜头复核}
    F -->|局部修改| D
    F -->|通过| G[声音 · 剪辑 · 超分与交付]
```

1. **先导演，再生成。** Codex 根据原文和已批准设定编写拍摄脚本，明确事件、对白、机位、动作和跨镜头连续性；必要时编写三维白模预演。
2. **参考各司其职。** Codex 使用内置 imagegen，其他 Agent 使用配置的生图 API；图片验收后入库，再将 Prompt 与外观、动作、运镜、声音参考送入 Seedance 2.5。当前独立图片 API 适配器只支持文生图，尚不支持参考图生图或图片编辑。
3. **局部修复，组织交付。** 检查画面、运动、身份、对白与字幕，保护已认可内容，再完成声音、剪辑、可选超分和交付。经验先成为候选，批准后进入生产记忆。

### Agent 优先，代码保护制作边界

| 层次 | 包含什么 | Agent 获取什么 |
| --- | --- | --- |
| 能力层 | MCP 工具、能力目录、流程定义 | 有什么，现在能否运行 |
| 制作层 | 总控合同、阶段标准、专业 Skill | 如何制作，怎样验收 |
| 技术层 | 模型接口、FFmpeg、Real-ESRGAN 等资料 | 具体技术怎么使用 |

Agent 负责创意和编排，Node.js 负责预算、版本、状态流转与参数校验。检查点保存证据与恢复位置；决策记录保存备选方案、选择／放弃理由和成本影响。两者都不能代替图片验收或生产记忆批准。不强制增加网络调研阶段，也不要求每个阶段重复弹窗审批。[阶段合同与决策记录 →](plugins/ai-drama-studio/docs/production-contracts.md)

<details>
<summary>白模空间与摄影机预演</summary>

![原创 Three.js 白模运镜预览](production/publish-examples/whitebox-camera/preview.gif)

[查看白模视频和可编辑源码](production/publish-examples/whitebox-camera/README.md) · [制作指南与工具配置](docs/production-guide_zh.md)

</details>

## 内置技能

内置 **47 个 Skill：1 个总控 + 46 个专业技能**。MCP 路由器按任务选择指令；Codex 原生集成也直接提供 Skill。其他宿主可以读取相同的 Markdown 文件，不必具备原生 Skill 安装器。代表性技能如下：

| Skill | 负责什么 | 适用场景 |
| --- | --- | --- |
| [AI 漫剧总制片](plugins/ai-drama-studio/skills/ai-drama-producer/SKILL.md) | 规划、路由、制作状态与交付组织 | 从创意到成片的全流程 |
| [小说漫剧前期制片](plugins/ai-drama-studio/skills/novel-comic-drama-preproduction/SKILL.md) | 原文整理、剧本、角色场景资产与导演分镜 | 长篇小说、分卷改编 |
| [角色场景分镜板](plugins/ai-drama-studio/skills/character-scene-storyboard/SKILL.md) | 统一角色参考、场景和剧情节点 | 前期设定、分镜设计 |
| [电影镜头与角色卡](plugins/ai-drama-studio/skills/film-shot/SKILL.md) | 景别、机位、光影与调度 | 电影感镜头、角色一致性 |
| [Seedance 多模态提示词专家](plugins/ai-drama-studio/skills/seedance-prompt-expert/SKILL.md) | 多参考、首尾帧、续写与编辑 Prompt | 输入职责、声音与连续性约束 |
| [品牌官方广告](plugins/ai-drama-studio/skills/brand-ad/SKILL.md) | 材质、工艺、Logo 与产品主角 | 15 秒内轻量产品广告 |
| [二次元漫画／游戏 PV](plugins/ai-drama-studio/skills/anime-game-pv/SKILL.md) | 角色、群像与世界观宣传 | 15 秒内游戏、活动 PV |
| [电影片头与概念预告](plugins/ai-drama-studio/skills/cinematic-title-sequence/SKILL.md) | 片名、卡司、人物行动与悬念 | 剧集片头、概念预告 |
| [剪辑判断与精修](plugins/ai-drama-studio/skills/clip-studio-craft/SKILL.md) | 节奏、剪切、转场、字幕与速度 | 已有素材的后期精修 |
| [视频拆解与复刻](plugins/ai-drama-studio/skills/video-deconstruct/SKILL.md) | 从参考提取镜头证据与结构 | 逐镜分析、反推 Prompt |
| [创作方法转化与实证](plugins/ai-drama-studio/skills/creator-method-transfer/SKILL.md) | 把教程和参考转成可检验的镜头假设 | 方法学习、动作与运镜实验 |

Skill 提供专业工作流，不等于新增模型能力。[浏览全部技能](plugins/ai-drama-studio/skills)

**当前涉及视频生成的 Skill 均围绕 Seedance 2.5 做适配。** 通用的策划和剪辑知识可以复用，但尚未针对其他模型单独调优提示词、参考职责与生成流程，也未验证其成片效果。切换供应商不会自动完成 Skill 适配，效果可能存在偏差。

<details>
<summary>让你的 Agent 为其他模型适配 Skill</summary>

可以在本地仓库中，让 Agent 创建模型专用版本：

> 请将这个 Skill 适配到我指定的供应商和模型。先阅读其最新官方文档，并核对插件实际已接入的能力，再调整提示词、参考职责、时长、声音与验收标准，明确列出不支持的功能。保留 Seedance 默认流程、已验收素材及现有预算和验收边界。先做文件校验，再提出一次有明确调用上限的样片验证，不要把修改完成当作效果验证通过。

更新 Skill 不会凭空补齐缺失的模型接口；指令适配与账号真实生成验证是两个步骤。

</details>

## 模型与扩展

### 生成供应商

以下列出的是**已实现的具体接口，不代表接入了供应商旗下所有模型**。默认仍为方舟与豆包语音。可选的 fal / Replicate 适配器已通过模拟接口测试，**尚未完成真实账号实测**；密钥、服务权限、余额、模型可用性与结果下载仍需通过小用量端到端测试确认。

| 供应商／入口 | 模型与支持用途 | 能力边界 |
| --- | --- | --- |
| Codex 内置 image-gen | 角色、场景与参考图 | 当前 Codex 任务提供的默认图片入口；确认后入库 |
| 火山方舟 | Seedance 2.5 视频；Seedream 文生图 | Seedream 是非 Codex 宿主的默认 API 生图入口；Seedance 输入与模式受所选模型及接口约束 |
| 豆包语音 | ASR、标准 TTS、SeedAudio 1.0 音乐 | 需单独的可选语音配置及服务权限；未配置时使用 Seedance 原生视频声音 |
| fal | Wan 2.2 A14B 文生视频；FLUX Schnell 文生图 | 实验性适配；当前仅接收文本，不等同于 Seedance 的多参考与编辑能力 |
| Replicate | FLUX Schnell 文生图 | 实验性适配；目前未接入 Replicate 视频生成 |

在 Codex 中，API 生图是用户明确指定或内置工具确实不可用／失败时才启用的备用路线；在其他 Agent 中，配置生图 API 是正常路线。两者都先生成库外候选，验收后入库，保留已冻结的调用上限。新增的独立 Seedream 候选接口已做模拟测试，真实账号验证另行进行。

### 本地工具与可选扩展

| 工具 | 用途 | 接入方式 |
| --- | --- | --- |
| FFmpeg | 剪辑、混音、字幕、媒体检查与导出 | 本地工具 |
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | 可恢复的本地 MCP 超分 | 使用用户本机算力，单独安装运行时与权重；分块恢复、音轨保留，4K 为后期输出 |
| [Video Depth Anything](https://github.com/DepthAnything/Video-Depth-Anything) | 视频时序深度参考 | 单独安装；实验性动作分析 |

**超分目前仅支持本地执行。** 项目不提供 Real-ESRGAN 云端托管、云端超分接口或供其他用户使用的 GPU 服务器。

Codex 模型由你选择，不硬编码为某个版本。SeedAudio 1.0 音乐通过可选的豆包语音配置使用；ChatCut 仍是外部剪辑扩展。[配置与能力边界](docs/production-guide_zh.md#模型与工具)

<details>
<summary>为什么引入 Video Depth Anything？</summary>

**让动作设计不只依赖文字描述，也能借助真实运动的空间参考。** 在第一集的打斗制作中，仅靠 Prompt 和手工白模，仍难以表达可信的攻防距离、进退关系和遮挡变化。因此，我们探索从有权使用的武打参考中提取时序深度，辅助 Codex 分析和设计动作。

[Video Depth Anything](https://github.com/DepthAnything/Video-Depth-Anything) 将视频转换为连续的深度估计：用深度而非原始色彩、纹理表示画面中的远近关系，并注重跨帧一致性。它在本项目中的用途是：

- **辅助看清空间。** 将原视频与深度视频对照，观察人物前后位置、接近与远离、遮挡和摄影机运动。
- **把参考转成拍摄设计。** Codex 结合两者分析动作阶段与镜头调度，再写入拍摄脚本、白模预演和 Seedance Prompt；借鉴运动关系，不默认照搬原片角色、服装与场景。
- **开展可对照的生成实验。** 在接口允许且输入经过确认时，尝试将深度可视化视频作为视频参考；对比有无该参考的结果，并记录实际提交的素材版本。

这是一条**可选的动作参考实验路线**，不是普通视频制作的必需依赖。它输出深度，不输出骨骼、关节轨迹或接触力，也不是 Seedance 的专用深度控制接口。“Codex 分析参考”不等于训练模型；目前尚未验证它能稳定改善复杂打斗或实现精确动作迁移。

</details>

## 已知局限

- **复杂打斗仍需反复打磨。** 抓握、快速攻防、遮挡和重心变化可能出错；白模与时序深度不能替代骨骼动捕和接触求解。
- **参考不是硬约束。** 多参考和生成式编辑可能改变身份或要求保留的内容，长片仍需要跨镜头检查与正常速度看听。
- **素材检索基于元数据。** 当前通过镜头关联、版本与素材元数据查找内容，不是视频语义理解；检索结果不能替代制作验收中的实际看画面、听声音。
- **生成与本地计算有成本。** 能力取决于账号权限、服务接口和素材条件；超分、深度模型及外围插件需要独立配置。

## 文档与开发

- [Agent 安装、宿主兼容与零费用验证指南](AGENT_GUIDE.md)
- [制作指南：模型、验收与本地数据](docs/production-guide_zh.md)
- [阶段合同、恢复与决策记录](plugins/ai-drama-studio/docs/production-contracts.md)
- [统一工具能力、本地声音后期与费用记录](plugins/ai-drama-studio/docs/toolchain.md)
- 工作台「用量与工具」支持费用趋势、请求日志、定价、供应商配置与本地超分任务；默认方舟 / 豆包语音，可选 fal / Replicate 的有限输入适配。账户账单需单独配置只读凭据。
- [插件与 MCP 说明](plugins/ai-drama-studio/README.md)
- [公开样例与复现素材](production/publish-examples/README.md)
- [模型和参考来源](docs/reference-sources.md)
- [画布组件与构建](plugins/ai-drama-studio/ui/README.md)
- [贡献与工作约定](AGENTS.md)
- [制作经验：身份、动作因果与镜头衔接](docs/production-iteration-20260919.md)

欢迎提交可复现的问题、工作流改进和专业 Skill。开发检查不调用付费模型：

```powershell
node --test scripts/agent-setup.test.mjs
cd plugins/ai-drama-studio
npm ci
npm run check
npm test
node scripts/sync-skill-manifest.mjs --check
node scripts/verify-skill-mcp.mjs
```

软件采用 [MIT 许可](LICENSE)。画布使用 [infinite-canvas](https://github.com/basketikun/infinite-canvas) 的 React + TypeScript 组件，保留上游许可与署名。第三方模型、权重和创作素材适用各自许可。
