// Official API presets. Account entitlement is deliberately not inferred from a saved key.
export const VERIFIED_ON = "2026-09-20";
const vendor = (id, name, region, baseUrl, docs, credentials = ["apiKey"]) => ({ id, name, region, baseUrl, docs, credentials, verifiedOn: VERIFIED_ON });
export const VENDORS = [
  vendor("ark", "火山方舟", "国内", "https://ark.cn-beijing.volces.com/api/v3", "https://www.volcengine.com/docs/82379"),
  vendor("speech", "豆包语音", "国内", "https://openspeech.bytedance.com", "https://www.volcengine.com/docs/6561"),
  vendor("minimax-cn", "MiniMax · 国内站", "国内", "https://api.minimax.cn/v1", "https://platform.minimax.cn/docs/api-reference/api-overview"),
  vendor("minimax", "MiniMax · 国际站", "海外", "https://api.minimax.io/v1", "https://platform.minimax.io/docs/api-reference/api-overview"),
  vendor("dashscope", "阿里云百炼 · 北京", "国内", "https://dashscope.aliyuncs.com/api/v1", "https://help.aliyun.com/zh/model-studio/text-to-video-api-reference"),
  vendor("tencent", "腾讯云混元", "国内", "https://vclm.tencentcloudapi.com", "https://cloud.tencent.com/document/product/1616/107795", ["accessKey", "secretKey"]),
  vendor("kling", "可灵 · 国际 API", "海外", "https://api-singapore.klingai.com", "https://kling.ai/document-api/api/get-started/authentication"),
  vendor("zhipu", "智谱开放平台", "国内", "https://open.bigmodel.cn/api/paas/v4", "https://docs.bigmodel.cn/cn/api/introduction"),
  vendor("runway", "Runway", "海外", "https://api.dev.runwayml.com/v1", "https://docs.dev.runwayml.com/api/"),
  vendor("fal", "fal", "海外", "https://queue.fal.run", "https://docs.fal.ai/model-apis/model-endpoints/queue"),
  vendor("replicate", "Replicate", "海外", "https://api.replicate.com/v1", "https://replicate.com/docs/reference/http")
];
const profile = (id, provider, kind, model, protocol, submitPath, extra = {}) => ({ id, provider, kind, model, protocol, submitPath,
  name: `${VENDORS.find(v => v.id === provider).name} · ${model}`, inputs: ["text"], tool: "drama_prepare_provider_job", ...extra });
export const PROFILES = [
  profile("ark-seedream", "ark", "image", "doubao-seedream-5-0-260128", "ark-image", "/images/generations"),
  profile("ark", "ark", "video", "doubao-seedance-2-5-260628", "native", "/contents/generations/tasks", { name: "火山方舟 · Seedance 2.5", default: true, inputs: ["text", "image", "video", "audio"], tool: "drama_request_paid_batch" }),
  profile("speech", "speech", "audio", "configured-speech-profile", "native", "", { name: "豆包语音 · ASR / TTS / Music", inputs: ["text", "audio"], default: true, tool: "drama_request_speech_job" }),
  profile("minimax-image", "minimax", "image", "image-01", "minimax-image", "/image_generation"),
  profile("minimax-video", "minimax", "video", "MiniMax-Hailuo-2.3", "minimax-video", "/video_generation", { specification: "768P · 6 秒；16:9", duration: 6 }),
  profile("minimax-tts", "minimax", "audio", "speech-2.8-hd", "minimax-tts", "/t2a_v2", { specification: "独立 TTS · 系统音色；不克隆" }),
  profile("minimax-cn-image", "minimax-cn", "image", "image-01", "minimax-image", "/image_generation"),
  profile("minimax-cn-video", "minimax-cn", "video", "MiniMax-Hailuo-2.3", "minimax-video", "/video_generation", { specification: "768P · 6 秒；16:9", duration: 6 }),
  profile("minimax-cn-tts", "minimax-cn", "audio", "speech-2.8-hd", "minimax-tts", "/t2a_v2", { specification: "独立 TTS · 系统音色；不克隆" }),
  profile("dashscope-image", "dashscope", "image", "wanx2.1-t2i-turbo", "dashscope-image", "/services/aigc/text2image/image-synthesis"),
  profile("dashscope-video", "dashscope", "video", "wan2.7-t2v", "dashscope-video", "/services/aigc/video-generation/video-synthesis", { specification: "720P · 5 秒 · 原生声音", duration: 5 }),
  profile("tencent-image", "tencent", "image", "TextToImageLite", "tencent-image", "/", { baseUrl: "https://aiart.tencentcloudapi.com", specification: "混元生图 Lite · 阶梯首档" }),
  profile("tencent-video", "tencent", "video", "SubmitHunyuanToVideoJob", "tencent-video", "/", { specification: "720P · 服务默认时长；16:9" }),
  profile("kling-image", "kling", "image", "kling-v3", "kling-image", "/v1/images/generations", { specification: "1K · 单张" }),
  profile("kling-video", "kling", "video", "kling-3.0", "kling-video", "/text-to-video/kling-3.0", { specification: "720P · 5 秒 · 单镜头 · 无声", duration: 5 }),
  profile("zhipu-image", "zhipu", "image", "glm-image", "openai-image", "/images/generations", { specification: "1280×1280 / 1728×960 / 960×1728" }),
  profile("zhipu-video", "zhipu", "video", "cogvideox-3", "zhipu-video", "/videos/generations", { specification: "横竖屏 1080P / 方形 1024 · 5 秒 · quality · 原生声音", duration: 5 }),
  profile("runway-image", "runway", "image", "gen4_image", "runway-image", "/text_to_image", { specification: "720P" }),
  profile("runway-video", "runway", "video", "gen4.5", "runway-video", "/text_to_video", { specification: "720P · 5 秒", duration: 5 }),
  profile("fal-wan", "fal", "video", "fal-ai/wan/v2.2-a14b/text-to-video", "fal-video", "/fal-ai/wan/v2.2-a14b/text-to-video"),
  profile("fal-flux", "fal", "image", "fal-ai/flux/schnell", "fal-image", "/fal-ai/flux/schnell"),
  profile("replicate-flux", "replicate", "image", "black-forest-labs/flux-schnell", "replicate-image", "/models/black-forest-labs/flux-schnell/predictions")
];
const price = (id, currency, unit, rate, source) => {
  const p = PROFILES.find(p => p.id === id);
  return { provider: p.provider, profile: id, kind: `${p.provider}-${p.kind}`, model: p.model, currency, unit, rate, source,
    recordedAt: VERIFIED_ON, specification: p.specification || "目录默认规格", preset: true };
};
export const PRICE_PRESETS = [
  price("minimax-cn-image", "CNY", "image", 0.025, "https://platform.minimax.cn/docs/guides/pricing-paygo"),
  price("minimax-cn-video", "CNY", "request", 2, "https://platform.minimax.cn/docs/guides/pricing-paygo"),
  price("minimax-cn-tts", "CNY", "character", 0.00035, "https://platform.minimax.cn/docs/guides/pricing-paygo"),
  price("minimax-image", "USD", "image", 0.0035, "https://platform.minimax.io/docs/guides/pricing-paygo"),
  price("minimax-video", "USD", "request", 0.28, "https://platform.minimax.io/docs/guides/pricing-paygo"),
  price("minimax-tts", "USD", "character", 0.0001, "https://platform.minimax.io/docs/guides/pricing-paygo"),
  price("dashscope-image", "CNY", "image", 0.14, "https://help.aliyun.com/zh/model-studio/model-pricing"),
  price("dashscope-video", "CNY", "second", 0.6, "https://help.aliyun.com/zh/model-studio/model-pricing"),
  price("tencent-image", "CNY", "image", 0.099, "https://cloud.tencent.com/document/product/1729/105925"),
  price("zhipu-image", "CNY", "request", 0.1, "https://docs.bigmodel.cn/cn/guide/start/pricing"),
  price("zhipu-video", "CNY", "request", 1, "https://docs.bigmodel.cn/cn/guide/start/pricing"),
  price("runway-image", "USD", "image", 0.05, "https://docs.dev.runwayml.com/guides/pricing/"),
  price("runway-video", "USD", "second", 0.12, "https://docs.dev.runwayml.com/guides/pricing/")
];
export const SPEECH_PRICE_MODELS = [
  { provider: "speech", kind: "asr", model: "volc.bigasr.auc_turbo", unit: "second" },
  { provider: "speech", kind: "tts", model: "seed-tts-2.0", unit: "character" },
  { provider: "speech", kind: "music", model: "seed-audio-1.0", unit: "request" }
];
export const CUSTOM_PROTOCOLS = ["openai-image", "minimax-image", "minimax-video", "minimax-tts", "dashscope-image", "dashscope-video", "runway-image", "runway-video", "kling-image", "kling-video", "fal-image", "fal-video", "replicate-image"];
