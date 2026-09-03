# Vox 风格解释视频

这是 OpenDramaFlow 的解释型视频工作流，由 Codex 主导选题、查证、脚本、分镜、素材、生成、剪辑与复核。完整步骤见 [WORKFLOW.md](WORKFLOW.md)。

默认在已明确的目标与冻结上限内自动执行。模型与素材规则：

- 图片用 Codex 内置 image2 生成库外候选，用户验收后入库。
- 视频用当前 Seedance 2.5 适配器；参数、参考角色与声音开关见[工具合同](references/runtime-tools-contract.md)。
- 配置豆包语音时可使用 ASR / 标准音色 TTS；未配置时用 Seedance 原生声音并听音检查。
- 没有独立音乐生成。需要 BGM 时使用获授权音轨，或将配乐方向写入原生声音的视频请求。
- 剪辑、字幕、音轨对齐由本地 FFmpeg 确定性处理。价格不写死，耗用受冻结上限约束。

保留 2.5D 分层拼贴、图解、档案感与信息层级的创作方法；不强制每段补齐固定文字量，不把模型调用成功当作质量审核通过。

[视觉与写作指南](references/vox-style-guide.md) · [合成指南](references/ffmpeg-assembly.md)

原有 [MIT 许可](LICENSE) 与版权声明保留。
