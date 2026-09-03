# Seedance 视频编辑与保留
绑定真实源视频为 reference_video，使用 `videoInputMode: video-edit`，写 `edit: {startSeconds, endSeconds, instruction, preserve}`。先读[总控指南](../../ai-drama-producer/references/seedance-prompting.md)。

先查看源视频并核验时间范围。明确旧对象、新对象、所在位置、发生时间，及要保持的角色、动作、摄影机路径、空间、光线、遮挡和声音。
示例：只把源视频 2–5 秒桌面上的白杯改为深蓝杯，保持人物手部动作、其余物体及运镜。

这是带源视频和时间说明的提示词引导编辑，不是掩膜或逐像素保留 API。结果另存版本，对照范围内改动和范围外漂移；精确 Logo/字幕优先确定性合成。达不到保留要求就标记不通过，不升级为“已成功局部编辑”。
