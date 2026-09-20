# 供应商、密钥与用量

## 配置入口

工作台 **供应商与 API** 统一管理预设、凭据与默认路由，不再分散到旧 API Key 弹窗和用量页。选择供应商后填写密钥即可；腾讯云需要 SecretId 与 SecretKey。MiniMax 国内与国际站、不同供应商的凭据分别保存，不会自动复用或转发。

默认视频仍为方舟 Seedance，独立 TTS、ASR 和音乐默认使用豆包语音。独立 TTS 可以切换为 MiniMax；ASR、音乐仍走豆包的原有工具。Codex 优先使用会话内置图片工具，其他宿主使用配置的图片 API。生成候选验收后才可导入，不因保存密钥改变验收规则。

Windows 使用 DPAPI，macOS 使用钥匙串。前端只能获取“是否配置”，不能读取已保存的密钥；密钥不写入项目状态、浏览器缓存或 Git。旧方舟、豆包、fal、Replicate 密钥无需重新输入。默认路由变更仅影响新任务。

## 当前接入范围

以下按官方文档核对于 **2026-09-20**。预设与适配不代表账号已开通，也不代表该厂商全部能力。新增适配器使用模拟响应验证，未进行真实账号付费生成；首次使用仍需在授权额度内做小样验证。

| 入口 | 已接入模型／接口 | 本版输入与输出约束 | 官方接口依据 |
| --- | --- | --- | --- |
| 火山方舟 | 现有 Seedance 2.5、Seedream | Seedance 沿用已接入的参考输入与参数校验；独立 Seedream 候选为文生图 | [方舟](https://www.volcengine.com/docs/82379) |
| 豆包语音 | ASR、TTS、SeedAudio 音乐 | 沿用现有独立语音工具与资源 ID；服务需单独开通 | [语音](https://www.volcengine.com/docs/6561) |
| MiniMax 国内／国际 | image-01、MiniMax-Hailuo-2.3、speech-2.8-hd | 文生图；16:9、768P、6 秒文生视频；独立 TTS URL 输出，不新增克隆功能 | [国内视频](https://platform.minimax.cn/docs/api-reference/video-generation-t2v)、[国际图片](https://platform.minimax.io/docs/api-reference/image-generation-t2i)、[TTS](https://platform.minimax.io/docs/api-reference/speech-t2a-http) |
| 阿里云百炼 · 北京 | wanx2.1-t2i-turbo、wan2.7-t2v | 文生图；720P、5 秒文生视频；异步任务查询 | [图片](https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference)、[视频](https://help.aliyun.com/zh/model-studio/text-to-video-api-reference) |
| 腾讯云混元 | TextToImageLite、SubmitHunyuanToVideoJob | 文本输入；视频 720P、服务默认时长、16:9；TC3 签名 | [视频](https://cloud.tencent.com/document/product/1616/126160)、[图片 SDK](https://github.com/TencentCloud/tencentcloud-sdk-nodejs/blob/master/src/services/aiart/v20221229/aiart_models.ts) |
| 可灵 · 国际 API | kling-v3、kling-3.0 | 文生图 1K；文生视频 720P、5 秒、单镜头、无声；新版 API Key，不使用旧 AK/SK | [鉴权](https://kling.ai/document-api/api/get-started/authentication)、[视频](https://kling.ai/document-api/api/video/3-0-omni/text-to-video)、[图片](https://kling.ai/document-api/api/image/3-0-omni/image-generation) |
| 智谱 | glm-image、cogvideox-3 | 文本输入；视频 quality、原生声音；异步查询使用任务 id | [图片](https://docs.bigmodel.cn/cn/guide/models/image-generation/glm-image)、[API](https://docs.bigmodel.cn/api-reference/模型-api/视频生成异步) |
| Runway | gen4_image、gen4.5 | 720P 文生图；5 秒文生视频，横／竖屏，不支持方形视频 | [API](https://docs.dev.runwayml.com/api/)、[官方 SDK](https://github.com/runwayml/sdk-node) |
| fal | FLUX Schnell、Wan 2.2 A14B | 文本输入；既有 Wan 帧数和分辨率约束 | [图片](https://fal.ai/models/fal-ai/flux/schnell/api)、[视频](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video/api) |
| Replicate | FLUX Schnell | 文生图，不含视频适配 | [HTTP API](https://replicate.com/docs/reference/http) |

共 11 个区域／服务入口、22 个能力配置。可灵此预设针对国际 API，不将其密钥视为国内平台凭据。其他供应商不会自动继承 Seedance 的多图、视频／音频参考、首尾帧、编辑或续写能力。现有创作 Skill 主要针对 Seedance，需要 Agent 根据目标模型重新适配。

## 自定义供应商

点击“添加供应商”，填写名称、独立标识、媒体协议、Base URL、模型与提交路径，再保存该供应商的 Key。支持 OpenAI 风格 URL 生图、MiniMax 图片／视频／TTS、DashScope 图片／视频、Runway 图片／视频、可灵图片／视频、fal 图片／视频、Replicate 图片协议。

这不是任意 HTTP 请求编辑器：兼容聊天 API 不等于兼容媒体 API。自定义接口必须匹配所选协议的请求、鉴权、查询路径和返回结构。OpenAI 风格生图目前要求方形、单张、URL 返回，不支持仅返回 base64 的服务。自定义条目不自动获取官方价格。

仅允许公网 HTTPS 端点；不接受内网、localhost、地址中的凭据和跳转。已建条目的地址、协议、模型不可覆盖；换接口请创建新标识并重新输入凭据，避免旧任务或 Key 被改指向其他服务。

## 任务与恢复

Agent 先调用 `drama_list_providers` 查看实际工具、输入与默认选择。通用候选接口依次为 `drama_prepare_provider_job` → `drama_start_provider_job` → `drama_get_provider_job` → `drama_download_provider_output`；方舟视频、豆包语音继续使用目录指定的原生工具。

准备时冻结连接、提示词、参数、方案摘要与单次上限。提交不确定时先核对原任务，不自动重发；已知 ID 只查询该任务。下载失败可以恢复，不重新付费生成。原有 automatic / manual、预算、版本与验收保护不变。

## 用量详情与价格

“用量详情”只展示调用、趋势、供应商／模型汇总与定价。供应商筛选后，模型选项随之收窄；同名模型按供应商隔离，CNY 与 USD 不相加。超分与账户账单配置移到“本地超分与账单同步设置”，入口位于供应商页底部。

| 预设 | 默认价格 | 官方来源 |
| --- | --- | --- |
| MiniMax 国内 image-01／Hailuo 2.3 768P 6 秒／speech-2.8-hd | ¥0.025／张；¥2／次；¥3.50／万计费字符 | [国内定价](https://platform.minimax.cn/docs/guides/pricing-paygo) |
| MiniMax 国际对应三项 | $0.0035／张；$0.28／次；$100／百万计费字符 | [国际定价](https://platform.minimax.io/docs/guides/pricing-paygo) |
| 百炼北京 Wanx turbo／Wan 2.7 720P | ¥0.14／张；¥0.60／秒 | [百炼定价](https://help.aliyun.com/zh/model-studio/model-pricing) |
| 腾讯混元生图 Lite | ¥0.099／张，阶梯首档 | [腾讯定价](https://cloud.tencent.com/document/product/1729/105925) |
| 智谱 GLM-Image／CogVideoX-3 | ¥0.10／次；¥1／次 | [智谱定价](https://docs.bigmodel.cn/cn/guide/start/pricing) |
| Runway Gen-4 Image 720P／Gen-4.5 | $0.05／张；$0.12／秒 | [Runway 定价](https://docs.dev.runwayml.com/guides/pricing/) |

共 13 条官方价格预设。MiniMax TTS 按中文汉字 2、其他字符 1 估算计费字符。规格限定在目录默认模式，不把低清、无声等模式的单价套到其他模式。方舟、豆包、可灵、fal、Replicate 等未能可靠映射到当前配置的价格保持未配置，不借用邻近模型或把每百万像素价当每张价。

可按优惠修改单位、币种、单价与来源；调用时冻结估价，不回写历史价格。估算与人工录入的供应商账单分列，未知金额不当作零，失败任务也不假定免费。此版本不自动抓取全平台账单或价格，不包含 Codex 订阅账单。已有火山只读账单同步保留，使用独立账单凭据。
