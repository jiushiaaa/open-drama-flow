# 工具目录、本地后期与费用记录

这些入口供 Codex 调用，不要求用户在画布手工接节点，不改变审批、图片入库验收或调用次数上限。

## 统一能力目录

调用 `drama_list_tool_capabilities`；原有 `drama_get_capabilities` 也返回同一份 `tools`。包含输入、输出、调用入口、依赖、限制、费用和恢复边界。目录不是选模型评分器，不覆盖用户指定模型。

| readiness | 含义 |
| --- | --- |
| `host-session-dependent` | 当前 Codex 会话必须实际挂载图片工具；插件无法代替宿主验证 |
| `credential-missing` | 缺少该服务的密钥 |
| `credential-configured-not-entitlement-verified` | 已配密钥，不证明账号有权限或当前请求必然成功 |
| `dependency-ready` | 本地命令/必要滤镜已探测；具体文件仍需验证 |
| `dependency-missing` | 缺少命令或滤镜 |
| `runtime-missing` | 尚未配置本地 Real-ESRGAN 可执行文件与权重 |
| `runtime-configured-not-inference-verified` | 已配运行文件，实际硬件推理仍需具体任务验证 |

`historicalProviderSuccess` 只引用同一模型的成功调用，不证明当前密钥/额度或所有模式可用。老调用缺少模型记录时不猜测。

默认图片仍用 Codex 会话内置工具，候选图获接受后入库；仅明确要求或已验证宿主工具不可用/失败才使用项目图片模型。不会自动触发付费能力探测。兼容字段 `deterministicEdit` 等表示适配器功能，不代表实际依赖/模型已经验证，执行前应看目录。

## 本地后期

`drama_process_local_audio({planPath, outputDirectory})` 的两个路径必须绝对。除测量外，输出目录必须不存在、父目录必须存在。新增两种 JSON 计划（哈希换成源文件实际值）：

```json
{
  "operation": "normalize",
  "source": {"path": "D:/media/dialogue.wav", "sha256": "<64位SHA-256>"},
  "targetLufs": -16,
  "truePeakDbtp": -1.5,
  "loudnessRange": 11
}
```

双遍响度归一化：先测量，再将测量值用于第二遍 loudnorm，最后重新测量输出。目标来自本次计划，不是所有平台通用标准。静音/不可测量输入拒绝归一化。`technicalTargetMet` 与试听验收分开。

```json
{
  "operation": "denoise",
  "source": {"path": "D:/media/source.mp4", "sha256": "<64位SHA-256>"},
  "reductionDb": 6,
  "noiseFloorDb": -50
}
```

FFmpeg afftdn 频谱降噪，不是人声分离或声音克隆。需显式选择对象，不默认给所有镜头降噪，以免破坏原生对白、音乐与拟音。

两者只处理首音轨，支持单/双声道、8–192kHz、最长两小时。保留采样率/声道，校验时长（30ms 容差），输出独立 PCM24 WAV、计划与 result.json，记录哈希、测量、源音轨起点和耗时。**不改视频/原文件、不裁静音、不自动混回、不自动入库。** 若源音轨起点不为零，混回视频时必须保留该偏移。试听和用户验收均保持 pending；处理完成不等于内容验收。

原有剪辑、对白区间压 BGM、样本精裁、格式派生、声音事件证据及剪辑复用继续使用现有工具，见 [本地剪辑工具](../skills/clip-studio-craft/references/local-edit-tools.md)。

### Real-ESRGAN 可恢复超分

工作台「用量与工具 → 本地超分」配置 NCNN 可执行文件、权重目录、模型、GPU 和 tile；不自动下载不明权重。也可调用 `drama_configure_upscale({runtime})`，runtime 包含 executable、modelsDirectory、model、gpu、tile。

1. `drama_create_upscale_job({sourcePath,sourceSha256,longEdge:3840,chunkFrames:120})`：准备新任务，可携带 projectId / creationId / shotId。
2. `drama_start_upscale_job({jobId})`：后台运行；相同入口恢复暂停/失败任务。
3. `drama_get_upscale_job({jobId})`：读取阶段、已完成帧、输出及哈希。
4. `drama_pause_upscale_job({jobId})`：保留已验证分块；跨进程暂停在分块边界生效。

支持无旋转元数据、可确定帧数的 CFR 视频，最长两小时；放大倍数 >1 且 ≤4，长边最高 3840。源文件、可执行文件和权重哈希冻结。恢复时重新核对分块哈希、帧数、尺寸和解码；已完成分块无需重跑模型。所有音轨流复制并校验解码音频哈希，不覆盖原片，不自动入库或批准视觉质量。VFR、特殊容器或不兼容音轨需先明确转换方案，不能静默丢音轨。运行期需要足够缓存空间，已验证分块的临时 PNG 自动清理。

这是**本地托管任务**，不是云端 Real-ESRGAN 服务；云托管超分供应商尚未接入。模型与运行时需单独安装，4K 不代表恢复出真实原生 4K 细节。

## 制作流程与镜头素材检索

`drama_select_production_workflow({type})` 支持 drama、advertising、explainer、music-video、motion，返回阶段清单和已启用专业 Skill。随后用现有 `drama_update_plan` 保存实际 brief、拍摄脚本和镜头；选择流程不会创建示例素材或批准记忆。

`drama_search_shot_assets({projectId,creationId,shotId,query,kind,limit})` 根据镜头归属、固定版本引用、文件描述/标签排序，并返回匹配理由、版本、SHA-256、实际文件哈希核对和验收状态。默认排除候选与过期素材，隔离其他世界和创作页私有资产。不是视觉向量搜索或自动动作识别；用 `drama_inspect_asset` 读取并真正查看/试听后再选择参考。未记录验收的导入资产保持 acceptance-unspecified，不自动变成批准素材。

## 多供应商

默认依然是 Codex 内置图片、方舟 Seedance 和豆包语音。工作台「用量与工具 → 供应商与 API Key」可保存路由偏好及 fal / Replicate 密钥；密钥仅保存在 Windows DPAPI 凭据文件，不进入项目状态、日志或版本库。方舟、豆包语音仍在原 API Key 面板。

| 适配器 | 本版输入 | 结果 |
| --- | --- | --- |
| 方舟 Seedance | 现有高级参考/任务类型，按实时能力校验 | 视频 |
| fal Wan 2.2 | 仅文本；17–161 帧、16 fps；480p / 580p / 720p | 视频候选 |
| fal FLUX Schnell | 仅文本；一张 | 图片候选 |
| Replicate FLUX Schnell | 仅文本；一张 | 图片候选 |

新增供应商的操作链：`drama_list_providers` → `drama_prepare_provider_job` → `drama_start_provider_job` → `drama_get_provider_job({refresh:true})` → `drama_download_provider_output` → 查看验收 → 原有导入/镜头绑定流程。prepare 参数包含 projectId、可选 creationId / shotId、稳定 requestKey、profile、prompt、aspectRatio、maxCalls:1；fal 视频可设 frames / resolution。图片必须另传 imageFallbackReason 与 fallbackEvidence，不能因配了 Key 就替换宿主图片工具。

新任务冻结 prompt、参数、制作方案摘要和单次调用上限；manual 使用可信 MCP 确认，automatic 按已授权任务执行。提交前持久化预约，网络超时后标记 submission-unknown，绝不自动重发。已知任务仅按原 ID 查询；下载失败不触发新生成。结果留在项目库外候选区，明确验收后才可导入。云供应商没有返回任务 ID 的不确定提交需要在供应商控制台核对，不能新建 requestKey 绕过这一要求。

选择 fal 视频后，旧 Ark 批次入口会提示正确工具，不会偷偷继续调用 Ark；已冻结的原任务不受新偏好影响。其他供应商不继承 Seedance 的参考图、编辑或声音能力，不支持的输入不能静默丢弃。未提供新供应商 Key 时只能验证接口模拟，不宣称账号实测成功。

## 费用记录

`drama_get_cost_report` 按 projectId / creationId / shotId 筛选。复用现有 providerCalls ID、请求摘要和供应商任务 ID，不创建第二套提交机制。

1. `drama_set_cost_price({rule})`：只有用户提供/确认价格来源才配置估算价，不内置猜测价格。
2. 原有调用预约自动冻结价格和请求数量，未配价格也保存 requestedQuantities；它不同于供应商实际 usage。后改价格不改旧记录。已获取的供应商数值用量在下载/导入前记录，后处理失败不会丢失这些证据；响应没有用量时保持未知。
3. `drama_record_cost_settlement({callId,receipt})`：实际账单到手后再对账；不把用量或估算冒充实际扣费。

rule 字段：kind、精确 model、ISO 三字母 currency、unit、rate、source。语音 model 使用目录的资源 ID 或音乐模型 ID。

| kind | 可用 unit | 数量 |
| --- | --- | --- |
| seedream-image | request / image | 单次 / 1 张 |
| seedance-video | request / second | 单次 / 请求秒数 |
| asr | request / second | 单次 / 输入片段秒数 |
| tts | request / character | 单次 / 文本 JavaScript length |
| music | request | 单次；生成时长事前未知 |
| fal-image / replicate-image | request / image | 单次 / 1 张 |
| fal-video | request / second | 单次 / 帧数除以 16 |

这些是估算单位，不是供应商实际计费声明。简单按秒估算不覆盖分辨率、参考媒体、Token、声音开关等差异；本版不抓取价目表或做外币换算，精确费用以账单为准。

receipt 字段：receiptId、currency、amount、source。每张记录表示**该调用的累计净额**，不是追加费用。同 ID 同内容幂等，冲突拒绝。退款/修正用新 ID 与修正后净额，历史保留，汇总取最新值。来源由操作方提供，工具不连接账单 API 验真，不应记录敏感凭证。

报表按币种分别列 estimated、actual、unreconciledEstimate，**不能将三列相加**。actual 只包含已对账部分，要一起看 unreconciledCalls。失败/取消/不确定调用不默认免费；未配置价格显示 price-not-configured，老记录显示 historical-unknown，不按新价追溯。

原 charged 字段指调用次数消耗，不是货币扣款。Codex 宿主订阅/图片费用不在插件账本内。本地后期输出记录 API 费 0、计算费未知和耗时，尚未合入跨任务硬件成本总账。费用记录不新增预算，也不替代现有上限、审批或不确定提交恢复规则。

费用与原项目调用记录一起保存在本机；当前删除项目也会清除对应调用记录。需要长期财务留档时，删除项目前先保存费用报表。

### 工作台费用页面与账户账单

「用量与工具」提供统计卡片、按币种的每日趋势（UTC）、请求日志分页、供应商/模型汇总、日期筛选、定价编辑和逐次凭据核账。不是 CC Switch 的 Codex Token 账单镜像：插件无法凭空知道宿主订阅成本。未知费用不显示为已扣费零元。

可选「火山引擎账户账单」使用具有 `ListBillDetail` 只读权限的独立 AK / SK，**不是 Ark 生成 API Key**。手动同步或显式开启工作台运行期间每六小时同步，账期留空跟随当月。失败保留上次成功结果；分页不完整不显示部分金额为总额。只保留必要费用字段，不保存账户姓名等响应信息。

账户账单采用供应商 `PayableAmount`，有延迟，可能包含其他云产品；单独展示，不把它猜测分摊到镜头、不与本地估算相加。当前只有火山账户账单适配，fal / Replicate 账单仍需按凭据核对。自动拉取价格、汇率换算、Codex 历史用量扫描尚未实现。

接口依据：[fal Queue](https://fal.ai/docs/documentation/model-apis/inference/queue)、[fal Wan](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video/api)、[fal FLUX](https://fal.ai/models/fal-ai/flux/schnell/api)、[Replicate 官方模型](https://replicate.com/docs/topics/models/official-models)、[火山费用 API](https://www.volcengine.com/docs/6269/1127842)、[火山官方 SDK](https://github.com/volcengine/volcengine-python-sdk)。

## 验证边界

回归使用临时目录、合成媒体和模拟供应商，验证真实 FFmpeg 处理、状态和记账行为，不证明真人对白质量或账号当前费用。正式素材仍需正常速度播放/试听。
