<p align="center">
  <a href="README.md">English</a>
</p>

<p align="center">
  <img src="plugins/ai-drama-studio/public/assets/studio-pixel-hero.png" alt="OpenDramaFlow AI 漫剧片场" width="920" />
</p>

<h1 align="center">OpenDramaFlow</h1>

<p align="center">
  面向 Codex PC 桌面版的开源本地 AI 漫剧生产框架：从创作目标、剧本和分镜，到图片、视频、审批、剪辑与成片。
</p>

<p align="center">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-62c370" />
  <img alt="Codex Plugin" src="https://img.shields.io/badge/Codex-Plugin-111827" />
  <img alt="MCP Ready" src="https://img.shields.io/badge/MCP-Ready-3b82f6" />
  <img alt="Node.js 20+" src="https://img.shields.io/badge/Node.js-20%2B-4f9d45" />
  <img alt="Windows Desktop" src="https://img.shields.io/badge/Windows-Desktop-2563eb" />
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#生产流程">生产流程</a> ·
  <a href="#界面展示">界面展示</a> ·
  <a href="#核心能力">核心能力</a> ·
  <a href="#codex-插件">Codex 插件</a> ·
  <a href="#开发与验证">开发与验证</a> ·
  <a href="#安全边界">安全边界</a>
</p>

---

## OpenDramaFlow 是什么？

OpenDramaFlow 不是一个简单的 Prompt 包装器，也不是只能点击一次的视频生成页面。它是一套让 Codex 可以持续操作的本地制作 harness，为整条 AI 漫剧生产链提供可检查、可恢复的项目状态：

**创作目标 → 剧本 → 角色设定 → 分镜 → 图片资产 → 视频镜头 → 剪辑 → 本地成片**

剧本、镜头、生成任务、付费审批、素材路径和渲染任务都处于同一个工作流中。空白项目不会自动注入示例故事、假素材、占位分镜或模拟模型结果。

OpenDramaFlow 专为 **Windows PC 上的 Codex Desktop** 设计。

## 为什么值得用？

| 需求 | OpenDramaFlow 提供的能力 |
| --- | --- |
| 稳定复用制作流程 | 结构化管理项目、人物、场景、分镜、任务、审批和成片 |
| Codex 全程操作 | 通过 MCP 创建、读取、修改、生成和渲染项目 |
| 自动选择专业能力 | 48 个专业 Skill 加 1 个总控 Skill，按用户需求自动加载 |
| 控制真实费用 | 付费调用前必须审批，并设置图片和视频硬性次数上限 |
| 本地保护密钥 | 使用 Windows DPAPI 加密，MCP 永远不会返回 API Key 明文 |
| 拒绝伪造产物 | FFmpeg 只合成真实生成或导入的图片与视频 |
| 支持中断恢复 | 项目状态、已完成素材和供应商任务可以在重启后继续使用 |

## 生产流程

```mermaid
flowchart LR
    A[创作目标] --> B[剧本与角色设定]
    B --> C[分镜与素材任务]
    C --> D{付费调用审批}
    D -->|图片| E[Codex Image Gen / Seedream]
    D -->|视频| F[Seedance 2.5]
    E --> G[镜头资产库]
    F --> G
    G --> H[FFmpeg 剪辑与字幕]
    H --> I[本地成片]
```

1. 创建一个真正的空白项目。
2. 向 Codex 说明题材、受众、时长、风格和交付目标。
3. Codex 写入正式剧本、角色设定、场景和有序分镜。
4. OpenDramaFlow 创建图片任务以及有调用上限的付费审批。
5. Codex Image Gen 或 Seedream 生成真实图片资产。
6. Seedance 2.5 使用已经批准且可访问的视觉参考生成视频镜头。
7. FFmpeg 统一真实素材格式、组织时间线并烧录字幕。

## 界面展示

### 项目库

桌面端从真正的空项目库开始。页面中的新手指引只是静态文档，不会向项目状态写入演示内容。

![OpenDramaFlow 项目库](docs/images/project-library.png)

### 本地密钥仓

普通用户只需要配置火山方舟 API Key。模型 ID、画幅、分辨率、水印和生成上限由系统维护，不作为日常表单暴露。

![OpenDramaFlow API Key 安全仓](docs/images/api-key-vault.png)

## 核心能力

### 创作与生成

- 由 Codex 编写故事梗概、正式剧本、角色设定、场景和分镜。
- 每个镜头包含顺序、时长、景别、生成 Prompt、字幕和制作状态。
- Codex 可以领取 Image Gen 任务并回填真实图片素材。
- Seedream 5.0 Pro 图片生成适配器。
- Seedance 2.5 异步任务创建、轮询、下载和镜头回填。
- FFmpeg 确定性剪辑、视频规格统一、音频处理和 SRT 字幕烧录。

### 自动 Skill 路由

OpenDramaFlow 当前包含 49 个项目 Skill：

- 1 个 AI 漫剧总控制作 Skill。
- 48 个 Codex 原生专业 Skill，覆盖漫剧、广告、MV、科普、提示词、拆片、配音规划、UI 动效和剪辑判断等场景。

`drama_route_skills` 会分析用户原始需求，自动读取最多三个最相关的专业 Skill。用户不需要为每次创作手动安装、勾选或判断 Skill。没有专业命中时，系统自动回退到总控 Skill。

### 审批与恢复

- Seedream 和 Seedance 真实付费调用必须先获得批次审批。
- 每个批次都有图片与视频调用硬上限。
- 后续步骤失败时，已经成功生成的素材会继续保留。
- Codex Image Gen 可以让流水线暂停，待真实图片回填后继续执行。
- 项目状态和任务默认保存在 Git 仓库之外。

## 快速开始

### 环境要求

- Windows 10 或 Windows 11
- Codex Desktop
- 调用 Seedream 或 Seedance 时所需的火山方舟 API Key

Node.js 20+、FFmpeg、Codex 插件和免账号 HTTPS 辅助程序都会由仓库安装器检查并安装。

### 用一句 Prompt 安装（推荐）

打开 Codex Desktop，直接发送下面这段话。Codex 会完成安装，普通用户不需要手动输入安装命令：

> 请在这台 Windows 电脑上克隆或打开 https://github.com/jiushiaaa/open-drama-flow。先阅读仓库说明并检查 `scripts/install.ps1`，然后在仓库根目录执行它。验证仓库内置的 49 个 Skill 全部存在、Codex 插件已经启用、本地工作台健康接口能够响应。不要索取或输出任何 API Key。完成后提醒我重启 Codex Desktop，再打开 OpenDramaFlow。

如果使用 Fork 仓库，只需把 Prompt 中的地址替换成自己的 Fork 地址。49 个内置 Skill、安装器和 HTTPS 桥实现都跟随 Git 仓库提交，不依赖作者电脑上的本地文件。

### 直接运行安装器（开发备用）

已经克隆仓库时，也可以在仓库根目录运行：

```powershell
.\scripts\install.ps1
```

安装器会下载 Cloudflare 官方 Windows `cloudflared`，并为本地参考图建立临时 [Quick Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)。这个过程不需要 Cloudflare 账号、API Token、ngrok 账号或对象存储配置。Quick Tunnel 适合测试和开发；正式团队环境如果需要固定域名或 SLA，可通过 `AI_DRAMA_ASSET_BRIDGE_BASE_URL` 接入自建 HTTPS 地址。

### 启动桌面服务

在仓库根目录运行：

```powershell
cd plugins\ai-drama-studio
npm install
npm start
```

打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

HTTP 服务只监听本机回环地址。项目状态默认保存在 `%LOCALAPPDATA%\OpenDramaFlow\data`，也可以通过 `AI_DRAMA_DATA_DIR` 更改位置。

## Codex 插件

仓库已经包含 Codex 插件清单、MCP 配置、本地 marketplace 和全部 49 个 Skill。

`scripts/install.ps1` 会自动把仓库注册为本地 marketplace、刷新 `ai-drama-studio@ai-drama-local` 并启动工作台。安装完成后重启 Codex Desktop，使新的 Skill 与 MCP 服务生效。

### MCP 工具

| 工具 | 用途 |
| --- | --- |
| `drama_get_state` | 读取项目、分镜、任务、审批和最近事件 |
| `drama_route_skills` | 自动识别并加载专业创作 Skill |
| `drama_list_skills` | 查看当前专业 Skill 目录 |
| `drama_create_skill` | 直接写入一个会立即加入自动路由的本地 Skill |
| `drama_set_skill_enabled` | 启用或停用某个 Skill 的自动路由 |
| `drama_create_project` | 创建不触发模型调用的空白项目 |
| `drama_update_plan` | 写入正式故事、人物、场景和分镜 |
| `drama_request_paid_batch` | 创建有次数上限的真实调用审批 |
| `drama_resume_paid_batch` | 图片任务完成后继续已经批准的流水线 |
| `drama_claim_image_task` | 领取一个 Codex Image Gen 任务 |
| `drama_complete_image_task` | 将真实图片回填到对应镜头 |
| `drama_render_project` | 使用 FFmpeg 把真实素材渲染成本地 MP4 |

## 项目结构

```text
open-drama-flow/
├─ .agents/plugins/marketplace.json
├─ docs/images/
├─ scripts/install.ps1        # Windows 一步安装器
├─ plugins/ai-drama-studio/
│  ├─ .codex-plugin/plugin.json
│  ├─ public/                 # Windows PC 桌面端界面
│  ├─ scripts/                # DPAPI 密钥辅助脚本
│  ├─ skills/                 # 总控与专业 Skill
│  ├─ src/                    # HTTP、MCP、模型、状态、工作流、FFmpeg
│  └─ test/
├─ README.md                  # English
├─ README_zh.md               # 简体中文
└─ LICENSE
```

## 开发与验证

```powershell
cd plugins\ai-drama-studio
npm run check
npm test
```

当前回归测试覆盖空项目无模拟数据、仓库自带的全部 49 个 Skill、Skill 导入与持久化开关、代表性创作请求的自动路由、总控回退和确定性成片渲染。

## 安全边界

- 不要提交 API Key、供应商 Token、私人素材或项目运行数据。
- 方舟 API Key 使用 Windows DPAPI 为当前用户加密，且不会通过 MCP 返回。
- `studio-data`、本地审计目录、依赖、QA 输出和密钥文件均被 Git 排除。
- 只有真实结果已经下载并关联到项目后，才能声称模型调用成功。
- Seedance 仍要求 HTTPS 或 `asset://` 参考图。OpenDramaFlow 会自动用 Cloudflare Quick Tunnel 为当前本地图生成随机令牌、有效期一小时的 HTTPS 地址，不会公开整个素材库；如果当前网络阻断 Quick Tunnel，任务会安全等待，并可改用 `AI_DRAMA_ASSET_BRIDGE_BASE_URL` 或火山 `asset://` 地址。

## 当前能力边界

- 正式生产前仍应使用自己的模型权限完成一次真实付费端到端验证。
- 音色克隆、专业 NLE 工程导出和可控 3D 场景仍属于规划能力，等待真实适配器接入。
- OpenDramaFlow 面向 Windows PC 桌面工作流。

## License

[MIT](LICENSE)
