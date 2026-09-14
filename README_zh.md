<p align="center"><a href="README.md">English</a> · 简体中文</p>

<p align="center">
  <img src="plugins/ai-drama-studio/public/assets/studio-pixel-hero.png" alt="OpenDramaFlow 机器人制片工作室" width="920" />
</p>

<h1 align="center">OpenDramaFlow</h1>

<p align="center"><strong>你来讲故事，Codex 来组织制作。</strong><br />在 Codex 中，把创意、剧本和参考素材变成视频。</p>

<p align="center">
  <img alt="MIT 软件许可" src="https://img.shields.io/badge/License-MIT-62c370" />
  <img alt="Codex 插件" src="https://img.shields.io/badge/Codex-Plugin-111827" />
  <img alt="MCP" src="https://img.shields.io/badge/Tools-MCP-3b82f6" />
  <img alt="Windows" src="https://img.shields.io/badge/Windows-Desktop-2563eb" />
</p>

<p align="center"><a href="#作品展示">作品展示</a> · <a href="#快速开始">快速开始</a> · <a href="#制作流程">制作流程</a> · <a href="#内置技能">内置技能</a> · <a href="#文档与开发">文档</a></p>

OpenDramaFlow 是面向 **Windows Codex Desktop** 的开源视频生产插件。它把专业创作 Skill、模型接口、素材版本和本地后期连接起来，让 Codex 从理解目标、拆解镜头一路组织到成片交付。

**左侧 Codex 对话负责创作，右侧插件画布展示素材与成果。** 你不需要从零搭建工作流，也不需要手动添加、连接节点。

## 为什么使用 OpenDramaFlow

- **用对话带领创作。** 从小说改编、短片到产品广告，根据目标选择专业 Skill、编写分镜和 Prompt，再调用工具执行。
- **素材与过程看得见。** 项目、分卷／季度、创作页和素材库统一管理；无限画布支持完整图片预览、视频播放与产物关联。
- **围绕 Seedance 制作。** 按职责组织图片、视频、音频与首尾帧参考，支持视频生成、续写和编辑。
- **可以修改，也可以接着做。** 保存素材版本、供应商任务 ID 和制作状态，保护已认可片段，减少重复生成。
- **经验留在项目里。** 将候选经验与已批准设定分开，避免一次实验覆盖角色、剧情和其他项目的规则。

![OpenDramaFlow 无限画布：素材、镜头与制作关系](docs/images/production-canvas.png)

<details>
<summary>查看项目库与 Skill 浏览器</summary>

![项目库](docs/images/project-library.png)

![Skill 目录与文件浏览](docs/images/skill-browser.png)

</details>

## 作品展示

### 《从姑获鸟开始》城寨风云篇 · 第一集

**[在抖音观看](https://v.douyin.com/rD_OP4_kMSI/)** · **[在小红书观看](https://www.xiaohongshu.com/discovery/item/6aa5351d0000000028029cea)**

[![第一集封面，点击在抖音观看](docs/images/episode-one-cover.jpg)](https://v.douyin.com/rD_OP4_kMSI/)

从角色与场景设定、镜头生成，到声音、剪辑和包装的完整制作案例。

![片头节选：城寨、拳台与锁链](production/publish-examples/opening-showcase.gif)

### 超分前后

左侧为 **720p 源片**，右侧为 **本地 4K 超分结果**；同步展示同一镜头的相同局部区域。

![同镜头局部对比：左侧 720p，右侧 4K 超分](production/publish-examples/upscale-comparison.gif)

[查看原分辨率样例与处理方法](production/publish-examples/README.md)

## 快速开始

需要 **Windows、Codex Desktop 和 Git**。安装器会检查 Node.js 20+、npm 与 FFmpeg，并尝试补齐缺失依赖。视频生成需要自备方舟 API Key，模型费用由服务商收取。

```powershell
git clone https://github.com/jiushiaaa/open-drama-flow.git
cd open-drama-flow
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

也可以在 Codex 中打开仓库，直接让它执行：

> 使用 scripts/install.ps1 安装 OpenDramaFlow。检查依赖并验证插件，不进行付费生成，不打断其他制作任务。

安装后新开 Codex 任务或重启 Codex，在工作台 **API Key** 页面配置方舟 Key。豆包语音 Key 为可选项，用于独立 ASR／TTS。凭据由 Windows DPAPI 保管。

然后，在 Codex 里描述你的第一个项目：

> 使用 OpenDramaFlow，把我提供的故事制作成一条 15 秒、16:9 的悬疑短片。先梳理事件、角色和镜头，图片使用 Codex 内置工具，候选经我确认后入库；先做一条视频样片，再决定后续制作。请先说明预计调用次数。

默认自动执行当前目标范围内、调用上限明确的任务；图片入库和生产记忆仍保留验收边界。可按项目选择手动审批，不需要手工搭建画布节点。

## 制作流程

```mermaid
flowchart LR
    A[创意 / 剧本 / 参考] --> B[Codex 规划 · 选择 Skill]
    B --> C[拍摄脚本 · 图片与白模预演]
    C --> D[验收素材 · 编译 Prompt]
    D --> E[Seedance 视频生成]
    E --> F{镜头复核}
    F -->|局部修改| D
    F -->|通过| G[声音 · 剪辑 · 超分与交付]
```

1. **先导演，再生成。** Codex 根据原文和已批准设定编写拍摄脚本，明确事件、对白、机位、动作和跨镜头连续性；必要时编写三维白模预演。
2. **参考各司其职。** 图片默认由当前 Codex 内置 image-gen 工具生成，验收后入库；再将 Prompt 与外观、动作、运镜、声音参考送入 Seedance 2.5。
3. **局部修复，组织交付。** 检查画面、运动、身份、对白与字幕，保护已认可内容，再完成声音、剪辑、可选超分和交付。经验先成为候选，批准后进入生产记忆。

白模空间与摄影机预演：

![原创 Three.js 白模运镜预览](production/publish-examples/whitebox-camera/preview.gif)

[查看白模视频和可编辑源码](production/publish-examples/whitebox-camera/README.md) · [制作指南与工具配置](docs/production-guide_zh.md)

## 内置技能

内置 **47 个 Skill：1 个总控 + 46 个专业技能**。Codex 按任务自动路由，也可以显式指定。以下为代表性技能；点击名称可阅读完整说明。

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

## 模型与扩展

| 工具 | 用途 | 接入方式 |
| --- | --- | --- |
| Codex 内置 image-gen | 角色、场景与参考图 | 默认图片入口；确认后入库 |
| Seedance 2.5 | 视频生成、多模态参考、首尾帧、续写、编辑与原生声音 | 插件 API 适配 |
| 豆包语音 | 独立语音识别与标准 TTS | 可选语音 Key；无 Key 时视频声音交给 Seedance |
| FFmpeg | 剪辑、混音、字幕、媒体检查与导出 | 本地工具 |
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | 本地超分与画面修复 | 单独安装；4K 为后期超分输出 |
| [Video Depth Anything](https://github.com/DepthAnything/Video-Depth-Anything) | 视频时序深度参考 | 单独安装；实验性动作分析 |

Codex 模型由你选择，不硬编码为某个版本。SeedAudio 1.0 音乐制作与 ChatCut 剪辑可作为独立扩展，需要额外配置，不属于本插件的内置服务。[配置与能力边界](docs/production-guide_zh.md#模型与工具)

## 已知局限

- **复杂打斗仍需反复打磨。** 抓握、快速攻防、遮挡和重心变化可能出错；白模与时序深度不能替代骨骼动捕和接触求解。
- **参考不是硬约束。** 多参考和生成式编辑可能改变身份或要求保留的内容，长片仍需要跨镜头检查与正常速度看听。
- **生成与本地计算有成本。** 能力取决于账号权限、服务接口和素材条件；超分、深度模型及外围插件需要独立配置。

## 文档与开发

- [制作指南：模型、验收与本地数据](docs/production-guide_zh.md)
- [插件与 MCP 说明](plugins/ai-drama-studio/README.md)
- [公开样例与复现素材](production/publish-examples/README.md)
- [模型和参考来源](docs/reference-sources.md)
- [画布组件与构建](plugins/ai-drama-studio/ui/README.md)
- [贡献与工作约定](AGENTS.md)

欢迎提交可复现的问题、工作流改进和专业 Skill。开发检查不调用付费模型：

```powershell
cd plugins/ai-drama-studio
npm ci
npm run check
npm test
node scripts/sync-skill-manifest.mjs --check
node scripts/verify-skill-mcp.mjs
```

软件采用 [MIT 许可](LICENSE)。画布使用 [infinite-canvas](https://github.com/basketikun/infinite-canvas) 的 React + TypeScript 组件，保留上游许可与署名。第三方模型、权重和创作素材适用各自许可。
