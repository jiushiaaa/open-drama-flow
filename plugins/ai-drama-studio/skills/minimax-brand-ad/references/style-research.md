# 品牌广告轻量风格 Research

仅在 `brand-ad` 为单条、15 秒以内的广告补风格或产品氛围参考时读取。复用 TVC 的“缺口判断 → 一次搜索 → 用户选图 → 一次分析 → 下游引用”骨架，但不创建 Stage、Research 文档、Plan 合同或多轮审核。

**交互预算：**执行搜索的正常路径停顿三次：先确认是否搜索，再从 5–6 张候选中自由选择 1 张或多张，最后在常规生成前确认创意与分镜。选择不搜索时跳过搜索与选图；用户已明确要求搜索、明确拒绝搜索、明确只用已有参考或授权代选时，跳过对应的重复确认。

## 1. 快速门禁

- 路线选定后默认主动提出 Research，并在搜索前用一次 `question` 让用户决定，不静默搜索，也不让用户自己外出找图。只有用户已明确要求搜索、明确拒绝搜索，或明确只使用已上传参考时才跳过该问题。
- `question` 使用清楚的二选一语义：“是否先搜索一轮风格参考图？搜索后会提供 5–6 张候选供你自由选择，后续风格、运镜和品牌区分会更稳，但会多一个选图环节，整体链路与耗时更长；不搜索会更快，但仅根据当前 brief 或已有参考推导风格，稳定性和品牌区分度可能较弱。”选项为“搜索参考图”和“不搜索，直接制作”。
- 用户选择搜索后才执行；选择不搜索时记录 `research_mode: skipped_by_user` 并继续创意，不重复劝说。用户已明确要求搜索或明确拒绝时，不再重复询问。
- 用户已给参考但没有明确排除搜索时，把问题改为“是否再搜索一轮补充风格参考”；选择搜索后只围绕现有参考未覆盖的关键维度编 query，选择不搜索时直接使用现有参考。
- 品类、目标时长和画幅已足以编 query 时，不为“高级还是科技”、成片形态、旁白、CTA 或其他非搜索阻塞项增加问题。
- Research 只补风格与品类氛围。产品型号、包装、Logo、文字、卖点和指标仍只信用户素材或官方来源。
- 明确的新品牌/原创概念没有 Logo 或包装时，直接以“概念片”边界搜索；概念字标、概念包装和不可作为官方标识的说明并入生成前确认，不先单独询问是否继续。

## 2. 一次搜索，保留 5–6 张候选

从已核验的品类、品牌定位、已选路线、平台/画幅和卖点编译 **3–4 个互有差异但都符合 brief 的英文 query**。各方向必须在空间、光线、材质或镜头语法上有实质差异，不只是换颜色。每个 query 使用：

```text
{specific product category} {direction-specific art direction} commercial editorial style frame {concrete light/material/composition mechanism}
```

使用一次批量调用，保持原搜索覆盖度：

```text
联网图片检索（须核验来源与授权）(
  queries=[{query: "<English query>", num: 5}, ...],
  max_images_per_query=5,
  min_dimension=1200
)
```

- `fast_search_budget_s: 45` 是主 Agent 的内部计时预算，不是 `联网图片检索（须核验来源与授权）` 入参；到时使用当前最佳结果，不为凑数量扩 query。
- 禁止单独使用 `moodboard`、`aesthetic`、`cinematic`、`4k`、“高级感”或“氛围感”作为 query。
- 预筛时不调用 `本地媒体核验（view_image、ffprobe 或 FFmpeg）`。剔除重复、低分辨率、拼贴/缩略图、纯 Logo/字卡、无关品类和只靠明星/他牌身份成立的图。
- 每张候选默认同时提供可迁移风格和可承载产品的空间/氛围；只有品牌视觉过程或未来系统蒙太奇路线可使用不出现产品空间的纯视觉系统图。
- 跨 query 去重并过滤后保留 5–6 张差异明确的候选；同轮可靠候选不足 5 张时展示当前全部有效项，不补弱相关图。整批为空时才允许改写一次 query。

## 3. 一屏展示，自由选择

1. 用一次 `drama_update_plan（写入项目实体）(items[])` 把 5–6 张候选作为独立媒体节点写入画布，稳定编号 `brand_direction_01..06`；不创建 Research 文档。
2. 用简短文字列出每张图的“方向名 + 一句可见差异 + 适用原因”，请用户在画布自由选择任意 1 张或多张并回复“选好了”；不规定必须单选，也不要求固定选满几张。
3. 用户回复后调用一次 `drama_get_state（读取当前项目选择与状态）`，把所有已选节点的真实 `node_id` 和 path 写入参考集合。选择为空时只提醒至少选择一张或明确改为不使用 Research，不重新搜索。
4. 用户已明确授权主 Agent 代选时，选择与品牌事实和路线最匹配的一张或多张，记录 `selection_mode: delegated`，跳过这次选择停顿。

## 4. 只分析已选图

只对全部已选图执行一次批量 `本地媒体核验（view_image、ffprobe 或 FFmpeg）`，逐张提取：成像与镜头质感、构图/机位/负空间、光比/高光/阴影、色彩结构、空间层次、材质和产品摆位，以及可转成运镜/转场/节奏的动态暗示。同时逐张记录不得迁移的人脸、人物身份、产品外观、Logo、包装、文字和案例专属道具。不分析未选候选，不猜测无来源 HEX，不重复读图。

收敛为一个轻量 `Style Reference Capsule`：

```yaml
selected_direction_refs:
  - { node_id, path, contributes, prohibited_transfer }
selection_mode: user_selected | delegated | user_provided
style_keywords_en: [6-8 concrete observable phrases]
style_prompt: <1 executable sentence>
camera_motion_profile: <start/path/end and pace>
transition_profile: <1-2 material/action-triggered mechanisms>
```

风格词必须可观察，例如 `precise hard rim light`、`low-saturation mineral palette`、`macro condensation texture`、`slow axial dolly with abrupt hero stop`；禁止只写 `premium`、`cinematic`、`stylish`、`high-end`。

## 5. 直接进入创意确认与 旧 H3

1. 把品牌/产品事实与 `Style Reference Capsule` 组合为 `Brand Direction Lock`：2–3 个带 `evidence` 和 `status: verified | creative_interpretation` 的品牌特质，以及唯一 `visual_thesis`、`camera_grammar`、`rhythm_curve`、`transition_profile` 和“开场钩子 → 品牌/产品证明 → 视觉揭示 → 品牌收束”的 `script_spine`。参考图不能反推新的品牌故事、口号或卖点。
2. 不为 Research 结果新增一次确认。立即把已选图、`Brand Direction Lock`、时间码分镜、文字与声音放进本 Skill 原有的生成前确认；用户确认后直接生成。
3. 每个镜头写新的品牌或产品信息，并用主体动作、材质反应、环境反馈或空间关系推进；不能只换景别、重复产品慢转或用泛化运镜填时长。
4. 先把旧 旧 H3 意图改写成连续自然语言，再通过审批链调用 Seedance 2.5 时，把 `selected_direction_refs[*].path` 全部放入 `reference_image_paths`，逐张映射为对应 `@图片N` 并写清各自风格贡献与禁止迁移内容；同时写入收敛后的风格词、运镜和转场。未选候选图、纯文字风格词或画布缩略图不得替代真实 path。
