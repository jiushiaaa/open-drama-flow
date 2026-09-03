# Seedance 多参考绑定
多参考视频拆解/复刻时，先读[总控 Seedance 指南](../../ai-drama-producer/references/seedance-prompting.md)。

1. 区分身份、场景、设计、动作、风格与声音参考；只引用当前镜头真正需要的素材。
2. 每项用真实 assetId + 版本绑定到 mediaReferences，角色为 reference_image、reference_video 或 reference_audio，按类型维护稳定编号。
3. 普通角色/风格图不是首帧。指定开场图使用 image-to-video 的 first_frame；双帧约束使用 first-last-frame，不与普通参考混装。
4. 写完整起始状态、动作流、摄影机路径、声音和收束状态；相邻镜头共享身份、方向、光色与音轨意图。
5. 依赖上一镜头尾帧或视频时先等待其真实产物，分别使用 continuation 的 last-frame / video，不靠把文件名写进 Prompt 假装绑定。
6. 视频编辑必须有源视频及明确 edit 范围；只读拆解不触发生成。
7. 参数和多媒体限制由 drama_get_capabilities 与当前适配器验证。参考编号和实际请求一致，发现缺失或不兼容就修正计划，不能静默丢参考。

复刻方法只能迁移有证据的摄影与节奏；不要复制未经授权的身份、Logo 或版权内容。生成后逐段播放并听音，检查引用目标是否兑现。
