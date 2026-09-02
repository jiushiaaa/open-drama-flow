# OpenDramaFlow UX Contract

## Business Context Sources

| Concern | Source | UI consequence |
|---|---|---|
| 火山方舟图片生成 | 官方 `ImageGenerations` API | 图片链接会过期，成功后立即下载本地副本 |
| 火山方舟视频生成 | 官方 `Create/GetContentsGenerationsTask` API | 创建仅代表已排队；轮询到 `succeeded` 才显示成功 |
| 付费调用 | 本项目安全策略 | 真实生成批次必须由用户审批且有调用上限 |
| Codex Image Gen | Codex 工具能力边界 | 以 Codex 可领取任务实现，不冒充本地 HTTP 模型端点 |

## System-managed Generation Profile

- 普通用户只配置火山方舟 API Key，不填写模型、Model ID、Endpoint、连接地址或生成参数。
- 系统锁定图片主生成 `Codex Image Gen`、备用图片 `Seedream 5.0 Pro`、视频 `Seedance 2.5`。
- 内置竖屏漫剧配置为 9:16、720p、无水印、不请求模型同步音频；单批图片与视频调用硬上限均为 20。
- 技术值可由 Codex/MCP 审计，但设置 API 不接受对锁定生成配置的覆盖；升级由插件版本统一迁移。

## Route Document Title Policy

单页标题固定为 `制作台 — OpenDramaFlow`。错误状态更新为 `服务不可用 — OpenDramaFlow`，不得包含密钥或项目敏感信息。

## Navigation Shell

- 桌面使用左侧栏作为唯一全局导航所有者；项目库、制作流程和镜头工作台使用同页锚点，不制造不存在的路由。
- 项目列表只切换当前本地项目，不创建、删除或修改项目数据；当前项同时用背景与 `aria-current` 表达。
- 900px 以下导航改为可横向滚动的顶部工具栏，主画布恢复文档滚动，不隐藏不可见入口。
- “开始创作”只创建空白项目，不自动写入演示脚本或触发模型调用。
- “项目新手指引”是内置文档，不是项目记录；它不进入 `projects`、任务、审批或事件数据。

## Data Lifecycle

- 项目状态使用本机 JSON 原子写入；项目删除在 MVP 不开放。
- 素材文件写入项目资产目录；导入失败不清空已有素材。
- API Key 使用 Windows CurrentUser DPAPI，存于 `%LOCALAPPDATA%\AIDramaStudio\ark.key`。
- UI、状态 API、日志、URL 和 toast 均不得出现 API Key 明文；已配置状态只显示固定长度掩码。
- 空白项目的剧本、角色、镜头、素材与成片数组均为空；产品不提供示例项目、内置故事、占位素材或假任务。

## Flow Ledger

| Flow | Pending | Success | Failure | Focus/recovery |
|---|---|---|---|---|
| 保存密钥 | 按钮忙碌并阻止重复提交 | 状态变为“已安全保存”，输入切换为固定掩码；重启后仍有效 | 表单内持久错误，保留输入 | 失败聚焦错误摘要/字段；更换时进入独立编辑态 |
| 创建真实批次 | 创建待审批记录，不调用模型 | 审批卡出现 | 表单内错误 | 审批卡提供批准/拒绝 |
| 执行真实批次 | 仅已批准批次可执行；计数受上限约束 | 每个素材/镜头独立落盘 | 批次停止并保留已成功产物 | 可查看失败原因并新建审批重试 |
| 本地合成 | 只读取已生成或已导入的真实素材 | 显示 MP4 成片链接 | 保留镜头和素材并报告失败阶段 | 修复缺失素材后重新合成 |

## Dialog Contract

- 设置对话框打开后聚焦标题或首个字段，Tab 在其中循环，Escape 可关闭并返回触发器。
- 背景设置 `inert`，长正文内部滚动，页眉和动作可达。
- 密钥默认遮罩，显隐按钮有动态中文无障碍名称。
- 清除密钥是可恢复性低但不破坏项目的警告动作，需对话框内明确按钮，不使用浏览器确认框。

## Native Control Ownership

- 设置对话框只拥有一个 API Key 密码字段；能力摘要是只读内容，不提供模型或参数控件。
- 无日期控件、模型下拉、数据表或远程搜索。

## Error and Async Policy

- 所有突变采用悲观 UI；按钮尺寸稳定，`aria-busy` 表达忙碌。
- 刷新状态请求使用 AbortController；旧响应不得覆盖新状态。
- 错误文案只显示稳定的本地错误码和恢复建议，不把供应商原始响应/密钥显示给用户。
- 真实调用超时若结果未知，先查询任务状态，不自动重复创建付费任务。
