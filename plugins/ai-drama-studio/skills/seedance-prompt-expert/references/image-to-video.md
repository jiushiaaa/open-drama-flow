# 首帧图生视频
选择 `videoInputMode: image-to-video`，恰好一个 `mediaReferences: [{assetId, role: "first_frame"}]`。先读[总控 Seedance 指南](../../ai-drama-producer/references/seedance-prompting.md)。

图片必须是用户希望作为实际起始画面的已验收素材，不是三视图、风格拼贴或普通身份参考。描述从这个状态开始发生的动作与摄影机运动，少重复图中已有细节。检查画幅、主体完整性和结束状态，声音通过 audioMode 显式设置。
