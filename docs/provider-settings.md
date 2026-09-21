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
| 方舟 Seedream 5.0 Lite（`doubao-seedream-5-0-260128`） | ¥0.22／张；`5-0-lite-260128` 为同模型官方别名，不套用到 Pro | [方舟定价](https://docs.volcengine.com/docs/ark/model-pricing?lang=zh) |
| 方舟 Seedance 2.5 · 480P／720P | 无视频输入 ¥70／百万 Token；有视频输入 ¥42／百万 Token | [方舟定价](https://docs.volcengine.com/docs/ark/model-pricing?lang=zh) |
| 方舟 Seedance 2.5 · 1080P 价格参考 | 无视频输入 ¥77／百万 Token；有视频输入 ¥46／百万 Token；预设价格不代表当前生成参数已支持该分辨率 | [方舟定价](https://docs.volcengine.com/docs/ark/model-pricing?lang=zh) |
| 豆包 ASR 极速版／TTS 2.0／SeedAudio 1.0 | ¥4.50／小时；¥3／万字符；¥1／分钟 | [豆包语音定价](https://docs.volcengine.com/docs/DoubaoVoice/Billinginstructions-21?lang=zh) |
| MiniMax 国内 image-01／Hailuo 2.3 768P 6 秒／speech-2.8-hd | ¥0.025／张；¥2／次；¥3.50／万计费字符 | [国内定价](https://platform.minimax.cn/docs/guides/pricing-paygo) |
| MiniMax 国际对应三项 | $0.0035／张；$0.28／次；$100／百万计费字符 | [国际定价](https://platform.minimax.io/docs/guides/pricing-paygo) |
| 百炼北京 Wanx turbo／Wan 2.7 720P | ¥0.14／张；¥0.60／秒 | [百炼定价](https://help.aliyun.com/zh/model-studio/model-pricing) |
| 腾讯混元生图 Lite | ¥0.099／张，阶梯首档 | [腾讯定价](https://cloud.tencent.com/document/product/1729/105925) |
| 腾讯混元生视频 720P · 5 秒 | ¥1.80／次（1.5 学分 × 后付费 ¥1.20／学分） | [腾讯视频定价](https://cloud.tencent.com/document/product/1616/118994) |
| 可灵 Image 3.0 1K／Video 3.0 720P 无声 | $0.028／张；$0.084／秒 | [图片](https://kling.ai/document-api/pricing/base/image)、[视频](https://kling.ai/document-api/pricing/base/video) |
| 智谱 GLM-Image／CogVideoX-3 | ¥0.10／次；¥1／次 | [智谱定价](https://docs.bigmodel.cn/cn/guide/start/pricing) |
| Runway Gen-4 Image 720P／Gen-4.5 | $0.05／张；$0.12／秒 | [Runway 定价](https://docs.dev.runwayml.com/guides/pricing/) |
| fal Wan 2.2 A14B · 480P／580P／720P | $0.04／$0.06／$0.08 每秒；计费秒数为 `num_frames / 16` | [fal Wan](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video) |
| fal FLUX Schnell | $0.003／百万像素，每张输出图向上取整；1024×1024 为 2 个计费单位 | [fal FLUX](https://fal.ai/models/fal-ai/flux/schnell) |
| Replicate FLUX Schnell | $0.003／张，与 fal 的像素计费独立 | [Replicate 官方说明](https://replicate.com/blog/flux-state-of-the-art-image-generation) |

价格核验于 **2026-09-21**，共 **31 条规格规则**，覆盖全部 22 个内置能力配置（豆包语音细分为 ASR、TTS、音乐）。预设自动生效，无需用户先保存。MiniMax TTS 按中文汉字 2、其他字符 1 估算；豆包按字符计数。账号资源包、赠送额度、阶梯折扣和已结束的活动不自动推断；可按自己的优惠修改。

Seedance 2.5 按分辨率与视频输入区分单价，声音开关不改变该版本单价。调用时冻结单价，完成后按接口返回的 `usage.completion_tokens` 计算估算，不拿输出秒数冒充 Token，也不忽略视频输入的最低计费门槛。fal FLUX 根据返回的输出宽高计算像素数量；SeedAudio 使用返回的变速前原始音频时长。等待这些用量时显示“等待计费用量”，不显示为“未定价”。

可按优惠修改单位、币种、单价与来源，规格优惠只覆盖该规格且只影响之后提交的调用。已冻结价格的任务即使跨重启，也继续使用原价。用量详情仅展示请求数、预估成本、每日趋势和调用／供应商／模型统计，模型定价折叠在表格底部。供应商使用目录中的真实名称，模型选项随供应商联动；选择后按“确认”应用，“重置”清空所有条件。日期按 UTC 自然日包含首尾两天，无消费记录的模型显示空表，切换统计标签不重新请求数据。

历史费用补算接口 `POST /api/usage/backfill` 保留给 Agent 在用户要求时调用，前端不再提供按钮。补算使用当前价格及已保存用量，保留原记录和依据，不重算已有价格、不产生模型调用；失败或未完成任务不补算，缺少用量的金额仍留空。实账记录与账单接口在后台保留，不与估算相加；用量页不展示实账或录入操作。此版本不自动抓取全平台账单或价格，不包含 Codex 订阅账单。已有火山只读账单同步保留，使用独立账单凭据。
