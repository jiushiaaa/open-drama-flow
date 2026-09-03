# 只有尾帧时的边界
当前 Harness 没有独立 last-frame-only 模式。只有一张目标尾帧时，不伪造接口、不把它改标为首帧。

若用户需要严格起止约束，先取得起始图；新增图片仍走内置 image2 库外候选与用户验收，再用 first-last-frame。
若只是结尾构图参考，可以说明限制后以 reference_image 使用 multimodal-reference，并在提示词描述最终构图。不能把这一方案说成硬尾帧条件。
