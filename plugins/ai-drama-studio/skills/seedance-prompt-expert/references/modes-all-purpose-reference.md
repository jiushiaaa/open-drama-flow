# Seedance 多模态参考
先读[总控 Seedance 指南](../../ai-drama-producer/references/seedance-prompting.md)，选择 `multimodal-reference`。每个媒体项写真实 assetId 和 reference_image / reference_video / reference_audio；不混入 first_frame 或 last_frame。

参考职责必须明确：
- 图片：某个人物身份、产品结构、场景空间、色彩或文字布局。
- 视频：只借运动、运镜、节奏或编辑源内容；需要声音时单独说明其音轨用途。
- 音频：节奏、环境或声音特征。可按当前能力使用音频参考，不硬性要求同时附图；引用音频不保证逐样本复制。

提示词按有序编号逐项描述用途、保持项与允许变化项，再写初态、动作、运镜、终态、对白/声音。不使用另一供应商的专用 subject_definitions / retention_analysis 结构作为接口字段。

多人各自绑定，不用匿名参考混合脸。风格图不得覆盖产品或角色身份。参考是否足够应按实际可见/可听证据判断，而不是凭文件名。
