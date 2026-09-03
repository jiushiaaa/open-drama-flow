# Skill 标识与执行规则更新（2026-09-03）

本版插件：`0.1.0+codex.20260903skillnames1`。45 个内置 Skill = 1 个总控 + 44 个专业技能。

## 本次迁移

- 44 个专业目录、SKILL.md 的 name、agents/openai.yaml、目录表、路由、显式调用、跨目录引用和完整性清单已统一为无供应商前缀的标识。
- 界面默认调用写成 `$ai-drama-studio:技能名`，避免去前缀后与 Codex 系统的同名 skill-creator 等技能产生歧义；插件内短名称路由仍可用。
- 多模态提示词专家使用 `seedance-prompt-expert`；单点动态视觉使用 `seedance-visual-design`。正文与参考资料按当前 Seedance 2.5 合同编写，移除旧平台来源说明、私有调用方法和旧模型默认参数。
- 旧平台的重导入脚本已删除；现在只在项目内维护专业内容，不会从旧源目录覆盖优化。
- 旧标识只在隔离的兼容模块和兼容回归测试中出现，用来迁移开关与解析历史引用；不进入新目录或正常对外技能列表，也不代表模型调用。
- 开关迁移保留 false、未知的用户自建项和其他配置；新旧键同时存在时以已保存的新键为准。首次真实改写前备份，重复执行不重复修改。
- 历史生产记录、冻结请求与审批摘要不改写。读取时解析为新名；仅名称等价的更新不增加方案版本、不使已有素材或成片失效。

## 当前执行合同

默认 automatic：用户要求制作时，在明确目标、素材与冻结调用上限内自动推进；只要分析、方案或提示词时不生成。manual 或用户指定的审核仍有效。不能扩大预算或绕过宿主权限。

图片默认 Codex 内置 image2：库外候选 → 会话展示 → 用户接受确切图片 → 项目入库。内置不可用、失败或用户指定时才使用项目图片模型。automatic 不取消图片验收和生产记忆批准。

视频 request 冻结 → authorize-and-start 执行；resume 仅恢复既有 waiting 任务。Seedance 专业指南区分六种模式、真实参考职责与顺序、显式声音、连续链、提示词驱动编辑和实际媒体审片。不得把适配器支持写成账号侧所有组合均已付费验证，或把局部编辑写成像素锁定。

ASR 与标准音色 TTS 已接入，依赖实际配置/权限；没有语音 Key 可用 Seedance 原生声音。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入未接入。常规剪辑、字幕和混音使用 FFmpeg。

教育视频、字体/Logo/口播包装、追踪风格和解释视频的深层资料同步移除不存在的节点字段、旧参数和强制问询流程；保留专业创作方法与实际质量检查。

## 维护与升级

在插件目录执行：

```powershell
node scripts/sync-skill-presentation.mjs
node scripts/sync-skill-runtime.mjs
node scripts/sync-skill-manifest.mjs --check
node scripts/sync-skill-presentation.mjs --check
node scripts/sync-skill-runtime.mjs --check
npm run check
npm test
```

- presentation 同步目录名、触发说明和 UI 展示，不覆盖专业正文。
- runtime 同步共用合同，不重新导入旧平台资料。
- `SKILL_MANIFEST.json` 覆盖总控与专业技能全部文件的 SHA-256；内容变化后刷新，验收用 --check。
- `node scripts/migrate-skill-settings.mjs --check` 只检查开关是否待迁移；去掉 --check 后备份并迁移。Windows 安装器会执行这一过程。
- 安装新版本后重启 Codex Desktop。当前运行进程不能视为已热加载；使用新 MCP 进程核验列表、路由、开关与文件读取。此次迁移本身不调用付费模型或改动生产素材。
- Windows 升级前需关闭占用旧缓存的 Codex/工作台进程；安装器检测到已安装且工作台正在运行时，会在任何文件改动前停止，避免缓存被部分清除。不要手动强删正在使用的缓存目录。

## 本版验收结果

- 全量测试 202/202 通过，45 个 Skill 格式校验通过，共用合同与展示信息同步检查无差异。
- 源码与新安装缓存分别以独立真实 MCP 进程验证：45 个 Skill、每套 176 项路由检查、停用兼容检查均通过，供应商调用为 0。
- 新安装缓存与仓库插件 444 个非依赖文件一致，SHA-256 差异为 0。工作台首页 HTTP 200，技能列表旧前缀数量为 0。
- 当前本机开关已检查，无需改写；旧格式 false、双键冲突、用户自建项与冻结生产历史的兼容性由隔离测试覆盖。

维护入口：[总控执行规则](../plugins/ai-drama-studio/skills/ai-drama-producer/references/execution-contract.md)、[图片验收合同](../plugins/ai-drama-studio/skills/ai-drama-producer/references/image-asset-contract.md)、[Seedance 提示词指南](../plugins/ai-drama-studio/skills/ai-drama-producer/references/seedance-prompting.md)。
