# 字体、Logo 与口播包装

把主体、字体、图形、空间、镜头、光影和声音共同编排成 Seedance 2.5 视频。目标是有内容依据的标题包装和动态海报，不是给原图推进后随意放一个词。

## 总控与执行边界

遵守[总控执行规则](../../ai-drama-producer/references/execution-contract.md)，默认 automatic；不依赖其他平台的 media-agent、task 派单或固定设置卡。已有约束直接继承，低风险细节记录合理默认；只有内容、原片保留范围、必现文案或授权存在关键缺口时才问。

先查 drama_get_capabilities，再保存自然语言 videoPrompt 与独立 ShotSpec：videoInputMode、duration、videoParameters、mediaReferences、audioMode。参数使用当前适配器合法值，不写死 2K 或未知字符上限。request 冻结后 authorize-and-start；改提示词先更新计划和冻结摘要，不能临派单偷偷改写用户指定文案。

口播可按真实授权源视频做 prompt-guided video-edit；需要逐像素保留原片、准确字幕或可重复替换品牌文字时使用确定性后期叠加。不能把 Seedance 编辑承诺为区域外像素不变，也不能禁止 FFmpeg 字幕、排版、裁切和混音。若请求的具体效果没有已接入执行能力，明确边界。

## 1. 读取相关专业参考

按需要读下面的制作语法和一种主风格；来源或约束变化时重读，不强制同一文件反复读取：

- [执行语法](seedance-execution-grammar.md)：文案、构图状态、时间轴与检查。
- [主体系统](subject-packaging-system.md)：身份、空间与原片保留范围。
- [字体系统](typography-system-library.md)：字体角色、配色、组件和动态语法。
- [音乐方向](music-direction-library.md)：声音材料与 cue；不是独立音乐生成接口。
- [清新可爱](style-fresh-cute.md)、[科技粒子](style-tech-particle.md)、[炫酷艺术](style-cool-art.md)、[暗黑胶片故障](style-dark-pop-glitch.md)、[海报大字拼贴](style-poster-collage.md)。
- 口播包装使用主体系统的口播分支。

## 2. 事实与制作设置

记录素材类型和真实 assetId/版本，主体、Logo/产品结构、人物身份、空间、准确文字、实际对白、原片比例和是否有声。不要从文件名猜身份或把参考比例冒充用户指定成片比例。

制作设置分开记录：
- 原片处理：重新创作、提示词编辑或确定性保留；说明不同保真边界。
- 空间：保留原空间、重建编辑空间、混合局部布景。
- 主体：产品、人物、Logo、场景或混合，确定主要注意力对象。
- 规格：用户时长/画幅、当前合法分辨率、声音模式及授权额度。
- 风格：主媒介、字体结构、图形材料和运动语法。
- 文字：用户逐字文本或根据已核实事实提炼的文案，语言和白名单。
- 声音：原生生成、保留原声、真实参考音频、独立已配置 TTS 或无声。

这些是创作记录，不是额外 API 字段。实际附件分别绑定 reference_image/reference_video/reference_audio；首尾帧走其独立模式。生成新图必须先在库外经用户验收。

## 3. 文案先行与版式

按 FACTS_FOR_COPY → SCENE_PACKAGING_COPY → COPY_TRACE → COPY_DECK → TEXT_WHITELIST：
先从事实形成连贯介绍词，再提炼屏幕语言，并可回指具体依据。禁止从主体名、风格名或“上线/启动/未来”拼出无事实支撑的口号。介绍词不必整段上屏。

确定 Display A 主标题、Display B 次级标题、Utility 信息层。选 2–4 个主要动作机制，标明每个状态的进入、停留、退出、注意力对象和可读窗口；图形组件为内容服务，不要所有元素同时乱动。产品保护层锁定外形、材质、Logo 和结构，不将其当无意义装饰。

口播 CAPTION_TRACK 一次呈现一个意群，长句可折 1–2 行。KEYWORD_HERO_TRACK 只突出真实重点；EVIDENCE_CARD_TRACK 的截图/画面必须有来源并与台词对应。小窗、推近、音效和版式换位按节奏必要性规划，不设每 15 秒固定次数。精确台词优先使用用户稿或真实 ASR 结果；ASR 仍需核对原音。

## 4. 编译、执行与验收

模型提示词按可见主体、真实参考职责、局部时间状态、字形/材质、动作、声音和不变项组织，保留用户准确文字。程序参数不要埋入提示词冒充生效。

声音模式显式设置：provider-native 生成声音，none 静音；真实音轨保留/替换按当前 source-asset/post 合同绑定。需要原声音画精确对齐时，后期使用实际音轨，不把文字“保持原声”当成已复制。

在当前范围内按总控执行。播放检查文字可读、产品与人物身份、布局、运动、对白和音轨。失败需说明具体问题；在剩余额度和策略允许范围修复，否则报告边界，不暗中增加调用。交付真实文件和审核记录，不以提示词完整或任务返回成功代替验收。
