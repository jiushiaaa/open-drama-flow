# OpenDramaFlow

一个面向 Codex PC 桌面版的开源本地 AI 漫剧制作 harness。它把正式剧本、角色设定、分镜、真实素材、生成任务、费用审批和 FFmpeg 成片统一成可检查的项目状态。完整的中英双语项目说明位于仓库根目录的 [`README.md`](../../README.md)。

> 面向 Codex Desktop 的 Windows PC 桌面工作流。

## 当前可用

- 本地网页制作台与项目状态管理
- 只创建空白项目，不注入示例故事、演示分镜、占位素材或假任务
- 内置“项目新手指引”；它是文档，不写入项目库
- 页面内只配置火山方舟 API Key；模型 ID、画幅、分辨率、水印和调用上限由系统维护
- Windows DPAPI 加密保存 API Key；当前 Windows 用户重启项目后无需重填，页面只显示固定掩码
- Codex 通过 `drama_update_plan` 写入正式剧本、角色设定和分镜
- Codex Image Gen 任务队列：Codex 可领取任务、调用内置图片模型并回填真实素材
- Seedream 图片生成与 Seedance 异步视频任务适配器
- 真实模型调用前的批次审批与硬性次数上限
- FFmpeg 只合成已生成或已导入的真实素材
- Codex MCP 工具和 `ai-drama-producer` Skill
- 44 个 MiniMax Design 创作能力的 Codex 原生适配 Skill，覆盖漫剧、广告、MV、动画、拆片、提示词、UI 动效和 Skill 审查等工作
- 自动 Skill 路由：Codex 按 Skill 描述隐式发现能力，同时由 `drama_route_skills` 根据用户原始需求读取最相关的专用制作规范，无需用户手动安装、勾选或选择

这些 Skill 是面向本项目能力边界的功能复刻与优化，不是对 MiniMax 私有提示词或私有工具调用的逐字复制。图片统一适配 Codex Image Gen / Seedream，视频统一适配 Seedance 2.5，确定性剪辑交给 FFmpeg；当前没有接入的配音克隆、专业 NLE 工程和 3D 场景工具不会伪造成功结果。

## 自动 Skill 加载

每次新的创作请求由 `ai-drama-producer` 总控 Skill 接入，并将用户原始描述交给 `drama_route_skills`。路由器会加载最多三个最匹配的专用 Skill 正文，再按“用户要求 > 当前项目真实状态 > 首要专用 Skill > 次要补充 Skill > 总控默认值”的顺序执行。纯状态查询可以跳过路由；没有专用命中时自动回退到总控 Skill。

可通过 MCP 的 `drama_list_skills` 查看当前能力目录。能力目录只来自项目内已验证的 Skill，不从页面模拟或动态拼装假数据。

## 启动

```powershell
cd plugins/ai-drama-studio
npm install
npm start
```

然后打开 `http://127.0.0.1:4317`。

运行目录默认是 `%LOCALAPPDATA%\OpenDramaFlow\data`，可通过 `AI_DRAMA_DATA_DIR` 覆盖。服务只监听回环地址。

## 安全边界

- 不要把 API Key 粘贴进聊天、剧本、项目 JSON 或 `.env`。
- 页面只显示“已保存/未保存”，不会回传密钥。
- 保存与清除密钥是独立操作；系统模型配置不含密钥。
- 真实生成必须先创建审批，再由用户在页面批准。每个审批固定图片/视频最大调用次数。
- Codex Image Gen 产物是本地文件；交给 Seedance 前还需要官方可访问 URL、火山素材 Asset ID，或后续接入对象存储上传桥。

## 验证

```powershell
npm run check
npm test
```
