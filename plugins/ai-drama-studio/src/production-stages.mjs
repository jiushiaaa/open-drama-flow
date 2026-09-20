// Declarative production contracts. Codex directs; existing execution gates authorize.
const phases = {
  intent: { tools: ["drama_get_context_pack", "drama_update_plan"], checks: ["目标、范围和适用约束明确；不编造来源或已批准设定", "交付规格和现有调用上限已记录"], recovery: "重新读取当前计划与已批准上下文；保留既有素材。" },
  design: { tools: ["drama_route_skills", "drama_update_plan", "drama_search_shot_assets"], checks: ["设计对应当前目标，引用来源与版本可追溯", "明确需要保留的内容及不适用项"], recovery: "核对上游产物与当前计划，局部修订设计，不重新生成已验收素材。" },
  plan: { tools: ["drama_update_plan", "drama_list_tool_capabilities", "drama_list_providers"], checks: ["镜头、时长、声音和参考职责明确", "计划仅使用当前适配器支持的能力与已验收输入"], recovery: "恢复拍摄或时间线计划；调用既有 next_actions 检查门禁。" },
  assets: { tools: ["drama_search_shot_assets", "drama_inspect_asset", "drama_import_asset", "drama_request_paid_batch", "drama_authorize_and_start_paid_batch", "drama_prepare_provider_job", "drama_start_provider_job", "drama_request_speech_job", "drama_authorize_speech_job"], checks: ["素材逐项记录来源、版本、哈希及验收状态，候选不冒充母版", "已记录实际任务 ID 和调用状态；未知提交未重复付费"], recovery: "查询原任务 ID，恢复同一任务或本地后处理；不得重复提交未知结果的付费请求。" },
  edit: { tools: ["drama_edit_local_media", "drama_process_local_audio", "drama_compare_local_edits"], checks: ["时间线绑定具体素材版本与区间，无未说明的缺口", "对白、音轨、字幕及保留内容的处理有明确依据"], recovery: "复用成功素材和未变化区间，在新输出路径重新执行失败的本地步骤。" },
  review: { tools: ["drama_prepare_quality_evidence", "drama_record_quality_review", "drama_inspect_asset"], checks: ["实际检查相关画面并完成适用的运动、声音、字幕复核", "问题有时间码、具体证据和处理结果；严重问题未带病放行"], recovery: "回到具体失败镜头或区间；保留通过部分，修复后重新看听。" },
  delivery: { tools: ["drama_render_project", "drama_prepare_quality_evidence", "drama_record_quality_review", "drama_finalize_delivery"], checks: ["交付符合目标规格且复核针对最终文件", "正式交付由原有交付工具完成，不能用阶段记录代替"], recovery: "复用已有渲染；字节未变则核验原审核，变化后重审，再走原交付门禁。" }
};

const definitions = {
  drama: [
    ["source", "intent", "source-boundary", "原文区间、改编范围与批准设定"],
    ["masters", "assets", "master-manifest", "角色场景母版版本及验收依据"],
    ["shooting", "plan", "shooting-script", "逐镜事件、对白、动作、机位与衔接"],
    ["previz", "design", "previz-plan", "空间与动作预演；不需要白模时记录理由，不强制生成"],
    ["generation", "assets", "shot-manifest", "实际视频、参考绑定、任务 ID 与候选状态"],
    ["continuity", "review", "continuity-review", "身份、运动、对白、音轨、字幕与连续性证据"],
    ["delivery", "delivery", "delivery-report", "剪辑依据、最终审核与正式交付记录"]
  ],
  advertising: [
    ["product", "intent", "product-facts", "用户提供或已核验的产品事实、使用边界"],
    ["concept", "design", "ad-concept", "受众、卖点、创意与 CTA"],
    ["references", "assets", "product-manifest", "产品外形、商标、包装参考及验收状态"],
    ["shooting", "plan", "ad-script", "短镜头、文案、展示顺序与声音计划"],
    ["generation", "assets", "ad-shot-manifest", "生成结果、任务 ID 和实际使用版本"],
    ["compliance", "review", "ad-review", "产品一致性、商标、宣称、文字与声音复核"],
    ["delivery", "delivery", "delivery-report", "平台规格与最终交付证据"]
  ],
  explainer: [
    ["outline", "intent", "knowledge-outline", "已有依据与知识提纲；不新增强制网络调研阶段"],
    ["script", "plan", "narration-script", "逐字稿、术语、时长与旁白意图"],
    ["mapping", "design", "scene-map", "逐段知识与镜头、素材对应关系"],
    ["assets", "assets", "explainer-manifest", "旁白、演示与画面文件、版本、验收记录"],
    ["edit", "edit", "edit-manifest", "字幕时间线及音画同步依据"],
    ["review", "review", "fact-review", "已有依据与成片内容一致性、字幕与声音检查"],
    ["delivery", "delivery", "delivery-report", "最终成片规格与交付证据"]
  ],
  "music-video": [
    ["music", "intent", "music-brief", "音乐使用范围、节奏结构和交付目标"],
    ["concept", "design", "visual-theme", "视觉主题、风格与保留内容"],
    ["beats", "plan", "beat-plan", "分镜、节拍时间点与歌词意图"],
    ["assets", "assets", "mv-manifest", "视觉素材与声音来源、版本及验收状态"],
    ["edit", "edit", "beat-edit", "节拍剪辑、歌词与画面的时间线"],
    ["review", "review", "mv-review", "实际播放中的节奏、视觉连续性和歌词同步"],
    ["delivery", "delivery", "delivery-report", "最终规格、混音与交付记录"]
  ],
  motion: [
    ["interface", "intent", "interface-brief", "真实界面与品牌规范及来源版本"],
    ["hierarchy", "design", "information-plan", "信息层级、展示目标与阅读顺序"],
    ["timeline", "plan", "motion-plan", "时间线、转场和可读时长"],
    ["deterministic", "edit", "motion-render", "确定性动效输出或执行计划及运行依据"],
    ["optional-generation", "assets", "supplement-manifest", "必要生成镜头；无需求时明确记录无需生成，不制造占位素材"],
    ["review", "review", "motion-review", "文字可读性、界面真实性、节奏与声音复核"],
    ["delivery", "delivery", "delivery-report", "规格、最终审核与交付记录"]
  ]
};

export function stageContracts(type, labels = []) {
  const rows = definitions[type];
  if (!rows) throw new Error("PRODUCTION_TYPE_UNSUPPORTED");
  return rows.map(([id, phase, artifact, description], index) => ({
    id, label: labels[index] || id, phase,
    inputs: rows.slice(0, index).map(row => row[2]),
    produces: [{ name: artifact, description, format: "local Markdown/JSON report or manifest with exact source/version references" }],
    tools: phases[phase].tools,
    acceptance: [{ id: "content", requirement: description }, ...phases[phase].checks.map((requirement, i) => ({ id: `check-${i + 1}`, requirement }))],
    recovery: phases[phase].recovery,
    director: { skill: "ai-drama-producer", reference: "references/stage-contract.md", section: phase },
    authorization: "Existing automatic/manual, budget, image-admission, memory and delivery gates remain authoritative. No per-stage human approval added."
  }));
}

export const productionTypes = Object.keys(definitions);
