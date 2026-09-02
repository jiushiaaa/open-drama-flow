# OpenDramaFlow UX Contract

## Business Context Sources

| Concern | Source | UI consequence |
|---|---|---|
| 火山方舟图片生成 | 官方 `ImageGenerations` API | 图片链接会过期，成功后立即下载本地副本 |
| 火山方舟视频生成 | 官方 `Create/GetContentsGenerationsTask` API | 创建仅代表已排队；轮询到 `succeeded` 才显示成功 |
| 付费调用 | 本项目安全策略 | 真实生成批次必须由用户逐批审批，批准量按当前项目实际缺失镜头计算 |
| Codex Image Gen | Codex 工具能力边界 | 以 Codex 可领取任务实现，不冒充本地 HTTP 模型端点 |

## System-managed Generation Profile

- 普通用户只配置火山方舟 API Key，不填写模型、Model ID、Endpoint、连接地址或生成参数。
- 系统锁定图片主生成 `Codex Image Gen`、备用图片 `Seedream 5.0 Pro`、视频 `Seedance 2.5`。
- 内置竖屏漫剧配置为 9:16、720p、无水印、不主动请求模型同步音频；模型返回的真实源音轨会在剪辑中保留。
- 不设置跨项目累计上限或任意固定硬上限。每张审批卡只批准当前项目尚缺的付费图片与视频镜头数；Codex Image Gen 不计入 Ark 图片付费调用。
- Seedance 只能读取可访问的 HTTPS/方舟 Asset 地址，不能直接读取 Codex 本地图。插件会为本地图片按需启动独立、随机令牌、限时的 HTTPS 素材桥；桥接暂不可用时批次进入可恢复等待态，按原审批续跑。已创建的 Seedance 任务只查询原任务，不自动重复付费提交；`drama_attach_image_remote_url` 仍作为外部对象存储/方舟 Asset 的可选覆盖入口。
- 技术值可由 Codex/MCP 审计，但设置 API 不接受对锁定生成配置的覆盖；升级由插件版本统一迁移。

## Route Document Title Policy

桌面路由使用 `项目库`、`项目详情`、`创作画板`、`Skill`、`项目新手指引` 加 ` — OpenDramaFlow`。错误状态不得包含密钥或项目敏感信息。

## Navigation Shell

- 桌面使用左侧栏作为唯一全局导航所有者；`#project-library`、`#project`、`#workspace`、`#skills`、`#project-guide` 是独立的本地页面状态，不提供账号/登录区和手机端导航。
- 项目库只呈现真实项目卡，支持搜索、排序、重命名和可恢复删除；选择项目先进入项目详情，再从创作页进入创作画板。
- 当前全局入口与当前项目同时用背景和 `aria-current` 表达；本产品面向 PC 桌面版，不把移动端适配作为交付范围。
- “开始创作”只创建空白项目，不自动写入演示脚本或触发模型调用。
- “项目新手指引”是内置文档，不是项目记录；它不进入 `projects`、任务、审批或事件数据。

## Plugin Lifecycle and Distribution

- 当前开发版通过本机 local marketplace 安装，插件代码、MCP 配置、数据和加密密钥都属于当前 Windows 设备与用户，不随 Codex 账号自动同步到其他电脑。
- Codex 加载插件 MCP 时会同时检查并启动 `127.0.0.1:4317` 工作台；端口上已存在本项目服务时复用，不重复启动。
- 自动启动本地 HTTP 服务不等于强制切换 Codex 当前页面。Codex 可从 MCP 状态读取工作台 URL，再由用户或 Codex 在侧栏打开。

## Data Lifecycle

- 项目状态使用本机 JSON 原子写入；删除项目时移动到本机 `.trash` 目录，避免直接擦除。
- 素材文件写入项目资产目录；导入失败不清空已有素材。
- API Key 使用 Windows CurrentUser DPAPI，存于 `%LOCALAPPDATA%\AIDramaStudio\ark.key`。
- UI、状态 API、日志、URL 和 toast 均不得出现 API Key 明文；已配置状态只显示固定长度掩码。
- 空白项目的剧本、角色、镜头、素材与成片数组均为空；产品不提供示例项目、内置故事、占位素材或假任务。

## Flow Ledger

| Flow | Pending | Success | Failure | Focus/recovery |
|---|---|---|---|---|
| 保存密钥 | 按钮忙碌并阻止重复提交 | 状态变为“已安全保存”，输入切换为固定掩码；重启后仍有效 | 表单内持久错误，保留输入 | 失败聚焦错误摘要/字段；更换时进入独立编辑态 |
| 创建真实批次 | 创建待审批记录，不调用模型 | 审批卡出现 | 表单内错误 | 审批卡提供批准/拒绝 |
| 执行真实批次 | 仅已批准批次可执行；计数受本批次明确批准量约束 | 每个素材/镜头独立落盘 | 批次停止并保留已成功产物 | 可查看失败原因并新建审批重试 |
| 本地合成 | 只读取已生成或已导入的真实素材 | 输出保留真实源音轨并烧录中文字幕的 MP4 | 保留镜头和素材并报告失败阶段 | 修复缺失素材后重新合成 |

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
