# OpenDramaFlow

[English](README.md)

面向 **Windows Codex Desktop** 的本地视频生产框架。由 Codex 组织规划、专业 Skill、模型调用、素材、剪辑与复核，不要求用户手动搭建节点图。

![第一集实际制作中的原创环境镜头](production/publish-examples/ending-720p-preview.jpg)

[720p 生成样例](production/publish-examples/ending-720p-4s.mp4) · [4K 放大对照](production/publish-examples/ending-upscaled-4k-4s.mp4) · [样例来源与边界](production/publish-examples/README.md)

两段为同一环境镜头的四秒无声片段。**4K 来自后期放大，不是 Seedance 原生 4K。** 完整第一集、小说原文、第三方参考电影不随仓库发布。

## 它负责什么

创作目标 → 已批准上下文 → 场次与镜头合同 → 明确用途的参考素材 → 有调用边界的任务 → 版本化素材 → 剪辑与复核 → 交付证据。

- **46 个内置 Skill**：总控加 45 个专业技能，覆盖小说前期、Seedance 提示词、连续性和后期等；自然语言、显式名称及启用开关共用目录。
- **一个 IP 一个项目**：分卷／季度、独立创作页、文件夹素材库；移动与重命名不改变资产身份，已用版本不被自动替换。
- **Codex 对话 + 无限画布**：对话留在 Codex，工作台展示真实产物、预览、播放和生产关系。
- **可恢复执行**：保存请求摘要、素材版本、调用上限、供应商任务 ID；提交状态未知时先核对原任务，不盲目重复付费。
- **分层记忆**：候选提炼与生产事实分开，批准后才能进入可信上下文；单个项目经验不自动覆盖其他作品。
- **有证据的后期**：保护认可片段、检查真实切点、字幕只映射一次；技术检查与实际看听分开记录。

## 安装

需要 Windows、Codex Desktop／CLI、Node.js 20+、npm、FFmpeg。生成需要自备服务商凭据，费用由服务商收取。

克隆仓库，在 Codex 中打开后可直接说：

> 用 scripts/install.ps1 安装这个仓库的 OpenDramaFlow 插件。检查依赖与本地市场，验证技能和 MCP，不进行付费生成。不要打断其他正在制作的任务。

也可以在仓库运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

安装器可补齐缺失依赖并注册本地插件市场。升级时若工作台正在使用，会停止安装以保护缓存；先完成活动任务再依照提示升级。更新后新开任务或重启 Codex：磁盘文件更新不等于当前任务已热加载。

工作台 **API Key** 页面配置方舟 Key；豆包语音 Key 可选。凭据使用 Windows DPAPI 保管，不提交 Git，也不通过 MCP 明文返回。

仅调试网页时：

```powershell
cd plugins\ai-drama-studio
npm ci
npm start
```

打开[本地工作台](http://127.0.0.1:4317)。仅启动 HTTP 不等于 Codex 已挂载 MCP 插件。

## 模型与工具：已接入和未接入分开

| 能力 | 当前状态与边界 |
| --- | --- |
| 图片素材 | 默认当前 Codex 内置图片生成工具；候选验收后入库。仅项目明确委托时可由 Agent 检查，不能把“自动模式”当作委托。内置工具确实不可用或用户明确要求时才用项目图片模型。 |
| Seedance 2.5 | 文生视频、首帧、首尾帧、多模态参考、视频续写、源视频编辑；图片／视频／音频引用职责、原生声音显式开关。 |
| 参数合同 | 本地 2.5 配置校验最多 30 图、10 视频、10 音频参考及 4–30 秒生成；首帧类与视频续写跟随素材比例，视频编辑使用 adaptive 比例和 duration=-1。实际账号权限、接口与素材限制仍须验证。 |
| 素材送达 | 本地已登记素材转换为模型可访问的 HTTPS 或 Ark 资产引用；按需暴露素材，不公开整个库。 |
| ASR／标准 TTS | 已接入可选豆包语音凭据。没有语音 Key 时采用 Seedance 原生声音方案；独立识别／配音不可用时明确报告，不伪造结果。 |
| FFmpeg | 本地组片、媒体检查与交付证据；MCP 不可用时，可对已认可文件执行有记录的确定性后期，不能假称已回写 MCP。 |
| SeedAudio 1.0 | 第一集通过独立制作脚本生成了已认可音乐；**尚未成为通用音乐生成 MCP 适配器**。 |
| Video Depth Anything | 已用于插件外深度参考实验。深度图不是骨架、身份模型或动作捕捉。 |
| Real-ESRGAN | 已做本地超分实践并提供对照；不是 Seedance 原生分辨率选项，也不是已内置的一键推理服务。 |

[Seedance 历史验证记录](docs/seedance-2.5-validation.md)按日期保留证据。支持输入不保证身份、运动、声音和编辑效果完全正确；视频编辑是生成式修改，不是像素精确的遮罩编辑。声音克隆、专业剪辑软件工程导出仍未接入。

## 自动执行不等于自动宣布合格

默认自动执行受当前目标与冻结调用上限约束；手动模式保留可信审批，两者都不能改变 Codex 宿主权限。

图片验收、生产记忆批准、视频质量复核是不同环节。明确委托只对对应项目与范围有效，不能把 Agent 检查记成用户逐图看过。API 成功、ASR 文本、抽帧、解码通过，各自只证明对应事实。

第一集沉淀的重点是：

- 每镜明确事件、空间状态和下一镜交接。
- 左右肢体按角色自身定义，核对接触、视线、伤势与道具。
- 局部失败局部修复，保留已认可内容。
- 以真实切点和帧区间处理字幕、对白及包装偏移。
- 分别记录技术通过、实际看听、用户认可与待验项目。

项目案例位于总控的分项目参考中，不是所有视频必须套用的风格或剧情。

[SkillOpt 小规模实验](production/publish-examples/skillopt-evaluation/README.md)：现有规则最终合成决策题 4/4 通过，未产出补丁，保留原技能，**没有观察到优化收益，也不代表视频质量提升**。仓库提供输入、可迁移脚本和脱敏结果。

## 数据与公开范围

默认状态目录：`%LOCALAPPDATA%\OpenDramaFlow\data`。

- `AI_DRAMA_DATA_DIR` 改变状态根目录。
- `AI_DRAMA_MEDIA_DIR` 可为**新**上传、生成和编辑媒体指定独立目录。
- 不自动迁移已有绝对路径；先复制、核验哈希、更新引用，再移除原件。
- 删除项目时，外部媒体保留原位，并在本地回收区保存引用恢复清单。
- 私人 `production/`、下载参考、模型检出与日志不上传；只公开明确整理的 `production/publish-examples/`。

软件许可证不授予小说、电影、音乐、肖像或第三方模型权重的权利。素材使用与再分发资格需单独确认。

## 开发与验证

```powershell
cd plugins\ai-drama-studio
npm run check
npm test
node scripts/sync-skill-manifest.mjs --check
node scripts/verify-skill-mcp.mjs
```

MCP 验证启动独立临时进程，检查技能目录与路由，**不调用付费模型**。传入安装目录可验证缓存副本；这仍不等于新 Codex 任务已完成会话内直连检查。

[本轮迭代与验证](docs/production-iteration-20260912.md) · [模型／参考来源](docs/reference-sources.md) · [工作约定](AGENTS.md) · [插件说明](plugins/ai-drama-studio/README.md) · [MIT 软件许可](LICENSE)
