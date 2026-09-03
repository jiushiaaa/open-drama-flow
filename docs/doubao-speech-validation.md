# 豆包语音接入与验收

## 当前边界

Seedance 2.5 仍负责视频与主要原生声音。豆包语音 Key 可选，独立 DPAPI 加密保存；没有它不阻止 Seedance 生产。ASR 用于对白/字幕核对，TTS 用于官方预置音色的旁白与补录。声音克隆与独立音乐生成暂未接入。

凭据验证、服务开通、真实生成与内容验收是四件不同的事。2026-09-03 的只读鉴权对照：提供的 Key 查询不存在的 ASR 任务返回 HTTP 200 / 45000000 `cannot find task`；随机无效 Key 返回 HTTP 401 / 45000010 `Invalid X-Api-Key`。这只证明通过鉴权，不证明极速 ASR/TTS 的开通与效果。文档不保存密钥。

## 真实最小验收（2026-09-03 已执行）

1. 使用 `20260903speech2` 代码，由用户在 API Key 页面保存豆包语音 Key；此次实测通过独立真实 MCP 进程执行，无模拟供应商响应。
2. 在明确命名的测试项目导入一段不含私人信息、有权使用的清晰短音频或视频。先本机播放，确认实际台词。不要发送无授权第三方录音。
3. `drama_request_speech_job`：mode=asr，指定 assetId，选取约 3–5 秒（默认 5 秒），expectedText 填实际台词。该步骤仅本机转码，不发送音频。
4. `drama_authorize_speech_job`：按用户本次要求采用 automatic 模式发送 1 次请求，无产品确认弹窗。manual 模式仍需独立 MCP 表单确认。查询结果需为 succeeded、有真实转写及时间戳，不以返回 200 代替识别成功。
5. 再申请 mode=tts，text=`你好，这是语音测试。`，预置音色、独立单次范围。检查 MP3 音轨与时长；实际试听验收仍单独保留。
6. 保留 jobId、requestId、资源 ID、请求摘要、provider code/logId、输入/输出哈希及版本。拒绝、取消、权限不足、超时均如实记录，不自动换资源或重试。

两项均返回服务成功码 `20000000`，各 1 次，0 次自动重试；授权来源如实记录为 `automatic-policy`，没有伪造 MCP 人工批准。

| 项目 | ASR | TTS |
|---|---|---|
| 输入 | 本机 SAPI 合成“你好，这是语音识别测试。”，选取 3.43 秒 | “你好，这是语音测试。” |
| jobId | `speech-mtl2pfbr-8d8ebc8c` | `speech-mtl2pglj-f7f09509` |
| requestId | `a1c72e8d-0619-47b1-ab0e-8318e898c46b` | `9aa22271-4d60-4eb7-9f6f-621eef57f857` |
| 服务日志 | `20260903131715C78F5B5E1D2E820980D2` | `2026090313171697F6C454483751DCB256` |
| 结果 | 原句完全匹配；相对时间 80–2600 ms | MP3，2.256 秒，24 kHz 单声道 |
| 资产 | `asset-mtl2pgf3-4324e742` v1 | `asset-mtl2phbf-69eccdd8` v1 |
| 输出 SHA-256 | `050cb5cdd51086f3061ff7bee3f932aa98eacbbdb6e77ee39c3ec5587fbb1cb2` | `b65aa6de83ef27db4f64bcdebf790dcf57b4684f512f7e1bb83dc4a5c4c05d72` |

ASR 输入为 WAV / 16 kHz 单声道 / 109838 字节，SHA-256 `451db69a80f619216d3fb06d0abdd71b9e6895c98e020baff38cedfa25426c89`。结果保持 `unreviewed`；未声称已经听过 TTS、通过长视频对白审核或启用所有音色。之前未成功确认的两个任务仍为 rejected/pending、attempts=0，未覆盖历史。

## 本机工程验证

语音接入时的历史基线：2026-09-03 全量测试 185/185 通过；当前版本与最新 Skill 校验见[更新说明](skill-runtime-update.md)。隔离目录与假密钥测试覆盖 DPAPI、原方舟密钥保留、跨来源/Host 校验、自动模式不弹窗、手动拒绝/取消/漏勾选零调用、模式变化失效、并发防重复、输入版本失效、后台任务、SSE 不完整响应、语音资产入库；记忆审核不受自动执行模式影响。这些测试使用供应商夹具；与上表两次真实云端调用分开计数。

## 实现范围

- API Key 页：两张独立凭据卡、可选标识、分别保存/清除、按配置显示声音方案、关闭时清空输入；不回显已保存明文。
- 凭据接口只接受本机来源；不接受任意语音服务地址，HTTP 重定向关闭。
- ASR：注册素材的视频/音频均可选，冻结源版本、哈希和片段；本机转为 16 kHz 单声道 WAV 后通过 HTTPS 发送 Base64。单任务默认 5 秒，上限 120 秒。
- TTS：固定官方音色，MP3/24 kHz，最多 500 字符。上述短句已真实生成，不代表所有音色/所有参数可用。
- 默认自动执行、可选单调用审批、进程级后台跟踪、并发防重复、错误脱敏、超时不确定态、成功输出入库并保留来源。
- 转写保留分段时间及源偏移，标记 unreviewed；不会自动进入批准记忆或通过质量审核。旁白需试听并显式绑定 `sourceAudioAssetId`，不会覆盖原音轨。

## 仍需实际创作验证

实际账单金额、TTS 试听、中文专名/嘈杂配乐下识别、长对白节奏、配音与镜头时长适配，以及不同 Seedance 模式的真实生成质量。可进入小规模真实创作验收，不应描述为所有模型能力已完整验收或无人审核交付。

官方参考：[极速 ASR](https://www.volcengine.com/docs/6561/1631584)、[TTS V3](https://www.volcengine.com/docs/6561/1598757)、[ByteDance 官方样例](https://github.com/bytedance/agentkit-samples/blob/main/skills/byted-text-to-speech/scripts/text_to_speech.py)。
