# Seedance 视频续写
选择 `videoInputMode: video-extend`，绑定已确认源视频为 reference_video，说明从其结尾继续的动作、方向、光线、速度、身份与声音。先读[总控指南](../../ai-drama-producer/references/seedance-prompting.md)。

已有镜头产物可用 continuation 的 shotId 和 source: video 建立依赖，等待上游真实完成后才绑定。source: last-frame 只继承尾帧，不是源视频续写。

描述新增情节而非重复整段原片。取得结果后判断它是新增段还是含源片的结果，核实实际时长再拼接；检查接点的动作、口型、音轨和色彩。不能承诺无限延长或自动无缝。
