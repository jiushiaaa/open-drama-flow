# 首尾帧双约束
选择 `videoInputMode: first-last-frame`，恰好绑定 first_frame 与 last_frame 各一张，不混入普通参考角色。先读[总控 Seedance 指南](../../ai-drama-producer/references/seedance-prompting.md)。

先检查两图身份、光照、空间与起止姿态能否在给定时长连接。写清动作路径、中间接触、运镜与最终停稳，不要求瞬移。输出尺寸按当前参数合同校验，不凭图像比例推断接口设置。

生成后对照真实首尾帧和中间运动；“双约束”不等于像素精确匹配，也不等于下一镜头自动继承上一镜头。
