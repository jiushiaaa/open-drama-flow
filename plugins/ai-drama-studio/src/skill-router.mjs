import { listManagedSkills, readManagedSkillInstructions } from "./skill-registry.mjs";

const ROUTING_PROFILES = {
  "minimax-film-reference-prompt-writer": {
    all: [["电影", "剧照", "影视参考"], ["提示词", "prompt", "出图", "出视频"]],
    aliases: ["电影画面怎么拍", "参考电影的光线构图运镜"]
  },
  "minimax-poster-motion-generator": {
    all: [["海报", "poster"], ["动起来", "做成视频", "动态", "微动", "标题动"]],
    aliases: ["锁版海报", "海报人物微动"]
  },
  "minimax-micro-expression-video-generator": {
    all: [["表情", "脸", "眼神", "眼睛", "嘴角", "眉毛"], ["细微", "克制", "慢慢", "轻轻", "迟疑", "情绪变化"]],
    aliases: ["只让眼睛和嘴角动", "脸部小动作", "微小情绪"]
  },
  "minimax-transcript-broll-planner": {
    all: [["口播稿", "逐字稿", "旁白稿", "讲稿", "配音稿"], ["资料画面", "配画", "补镜头", "生成镜头", "broll", "b-roll"]],
    aliases: ["什么时候切资料", "口播补画面"]
  },
  "minimax-video-deconstruct": {
    all: [["参考视频", "原视频", "样片", "这条片子"], ["照着", "拆解", "反推", "复刻", "镜头节奏", "镜头顺序"]],
    aliases: ["按原片镜头顺序", "分析机位和节奏"]
  },
  "minimax-character-scene-storyboard": {
    all: [
      ["小说", "网文", "原著", "原作", "章节"],
      ["漫改", "改编", "做成漫剧", "改成漫剧", "ai漫剧", "动态漫", "短剧"],
      ["世界观", "设定", "角色设定", "人物设定", "角色卡", "角色一致", "人物一致", "分镜", "镜头表"]
    ],
    aliases: ["小说改编成ai漫剧", "网文改编动态漫", "原著角色场景分镜"]
  },
  "minimax-vox-style-video-generator": {
    all: [["vox", "视频论文", "解释型短纪录片"], ["文章", "研究", "知识", "旁白", "拼贴"]],
    aliases: ["vox那种", "混合媒介解释片"]
  },
  "minimax-minimalist-product-ad-generator": {
    all: [
      ["产品图", "产品照片", "商品图", "实物图", "实物", "耳机", "耳麦", "音箱", "手机", "手表", "相机"],
      ["产品广告", "商品广告", "电商广告", "广告片", "产品短片", "商品短片", "投放短片"],
      ["留白", "细节特写", "材质", "高级感", "高质感", "极简", "简洁", "科技感", "竖屏", "9:16", "15秒", "十五秒"]
    ],
    aliases: ["白底产品广告", "材质细节广告", "无线耳机广告", "蓝牙耳机广告"]
  },
  "minimax-brand-stream-mg": {
    all: [["logo", "标志", "品牌符号"], ["霓虹", "流线", "线条汇聚", "线条聚拢", "能量线"]],
    aliases: ["线条最后汇成logo", "双色品牌流线"]
  },
  "minimax-co-op-game-intro-generator": {
    all: [["双人", "两个角色", "两名玩家", "player1", "player2"], ["游戏菜单", "主菜单", "游戏开场", "加载界面"]],
    aliases: ["两个人一起进入游戏", "合作游戏菜单"]
  },
  "minimax-ui-motion": {
    all: [["ui", "界面", "saas", "app页面", "网页界面"], ["状态切换", "交互流程", "展开", "动效", "动画"]],
    aliases: ["界面从登录到结果", "卡片重组"]
  },
  "minimax-digital-product-promo-generator": {
    all: [["网站", "软件", "数字产品", "app", "saas"], ["宣传片", "发布片", "功能卖点", "产品介绍"]],
    aliases: ["把真实录屏做成产品片", "软件功能宣传"]
  },
  "minimax-3d-animation-short-generator": {
    all: [["3d", "三维"], ["故事", "短片", "动画", "连续镜头"]],
    aliases: ["做成三维动画故事", "风格化3d叙事"]
  },
  "minimax-music-video-subtitle-generator": {
    all: [["歌词", "字幕", "歌词字"], ["mv", "音乐视频", "跟节拍", "卡点"]],
    aliases: ["歌词跟着音乐动", "空间歌词字幕"]
  },
  "minimax-cool-music-video": {
    all: [["说唱", "歌手", "人物表演", "时尚表演"], ["mv", "音乐短片", "复古拼贴"]],
    aliases: ["15秒表演型mv", "潮流音乐短片"]
  },
  "minimax-image-remix": {
    all: [["参考图", "这张图", "图片"], ["换内容", "重新创作", "重混", "借构图", "借配色"]],
    aliases: ["保留氛围但换主体", "学这张图的视觉感觉"]
  },
  "minimax-koc-video": {
    all: [["种草", "开箱", "测评", "真实体验", "ugc", "koc"], ["产品", "商品", "使用", "口播"]],
    aliases: ["像用户自己拍的", "创作者体验视频"]
  },
  "minimax-brand-ad": {
    all: [["品牌官方", "官方广告", "产品hero", "工艺", "材质"], ["广告", "短片", "产品", "logo"]],
    aliases: ["品牌自己发布的产品片", "产品英雄镜头"]
  }
};

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function countOccurrences(haystack, needle) {
  if (!needle || !haystack.includes(needle)) return 0;
  let count = 0;
  let cursor = 0;
  while ((cursor = haystack.indexOf(needle, cursor)) !== -1) {
    count += 1;
    cursor += needle.length;
  }
  return count;
}

function findFirst(request, phrases = []) {
  return phrases.find(phrase => request.includes(normalize(phrase)));
}

function profileScore(name, normalizedRequest) {
  const profile = ROUTING_PROFILES[name];
  if (!profile) return { score: 0, signals: [] };
  let score = 0;
  const signals = [];

  for (const alias of profile.aliases || []) {
    if (!normalizedRequest.includes(normalize(alias))) continue;
    score += 24 + Math.min(normalize(alias).length, 12);
    signals.push(`alias:${alias}`);
  }

  const groupMatches = (profile.all || []).map(group => findFirst(normalizedRequest, group));
  if (groupMatches.length && groupMatches.every(Boolean)) {
    score += 42 + groupMatches.length * 7;
    signals.push(...groupMatches.map(value => `intent:${value}`));
  }

  return { score, signals };
}

function conflictAdjustment(name, normalizedRequest) {
  const has = (...phrases) => Boolean(findFirst(normalizedRequest, phrases));
  let score = 0;
  const signals = [];
  const adjust = (amount, signal) => {
    score += amount;
    signals.push(`conflict:${signal}`);
  };

  const referenceRebuild =
    has("参考视频", "原视频", "样片", "这条片子") &&
    has("照着", "复刻", "拆解", "反推", "镜头顺序", "镜头节奏", "机位");
  if (referenceRebuild && name === "minimax-video-deconstruct") adjust(75, "reference-rebuild");
  if (referenceRebuild && ["minimax-video-prompting", "minimax-film-reference-prompt-writer"].includes(name)) {
    adjust(-45, "reference-rebuild");
  }

  const uiFlow = has("ui", "界面", "页面", "saas", "app") && has("状态", "交互", "展开", "切换", "重组");
  const productNarrative = has("宣传片", "发布片", "卖点", "cta", "产品介绍", "官网展示");
  if (uiFlow && !productNarrative && name === "minimax-ui-motion") adjust(55, "ui-state-over-promo");
  if (uiFlow && !productNarrative && name === "minimax-digital-product-promo-generator") adjust(-35, "ui-state-over-promo");
  const digitalProduct = has("网站", "软件", "app", "saas", "数字产品", "网页", "录屏");
  if (productNarrative && digitalProduct && name === "minimax-digital-product-promo-generator") {
    adjust(45, "promo-over-ui-state");
  }

  const physicalProduct = has(
    "耳机", "耳麦", "耳塞", "音箱", "手机", "手表", "相机", "香水", "护肤品", "鞋", "服装", "饮料", "咖啡", "实物"
  ) || (has("产品", "商品") && !digitalProduct);
  const commerceAd = has("电商", "商品广告", "产品广告", "广告片", "广告", "投放", "产品短片", "商品短片");
  const polishedProductStyle = has(
    "简洁", "极简", "科技感", "高级感", "质感", "轻奢", "留白", "细节", "材质", "棚拍", "竖屏", "9:16", "15秒", "十五秒"
  );
  const rejectsCreatorLed = has("不要真人口播", "不要口播", "不做口播", "无需口播", "没有口播", "非口播", "不做种草", "不是测评");
  const creatorLed = !rejectsCreatorLed && has("种草", "开箱", "测评", "口播", "ugc", "koc", "用户体验", "真人实测", "手持实测");
  const lipProduct = has("口红", "唇釉", "唇泥", "唇部");
  const rejectsOfficialBrand = has("没有品牌故事", "不讲品牌故事", "不要品牌故事", "不是品牌官方", "非品牌官方");
  const officialBrand = !rejectsOfficialBrand && has("品牌官方", "官方广告", "官方产品", "产品hero", "品牌故事", "品牌宣传", "logo", "工艺");
  const polishedCommerceAd = physicalProduct && commerceAd && polishedProductStyle;
  if (polishedCommerceAd && !creatorLed && !lipProduct && !officialBrand && name === "minimax-minimalist-product-ad-generator") {
    adjust(62, "physical-product-commerce-ad");
  }
  if (polishedCommerceAd && !officialBrand && name === "minimax-brand-ad") {
    adjust(-24, "commerce-ad-over-official-brand");
  }
  if (physicalProduct && commerceAd && officialBrand && name === "minimax-brand-ad") {
    adjust(58, "official-brand-over-commerce-ad");
  }
  if (physicalProduct && commerceAd && officialBrand && name === "minimax-minimalist-product-ad-generator") {
    adjust(-34, "official-brand-over-commerce-ad");
  }

  const sourceAdaptation =
    has("小说", "网文", "原著", "原作", "章节") &&
    has("漫改", "改编", "做成漫剧", "改成漫剧", "ai漫剧", "动态漫", "短剧");
  const adaptationBible = has(
    "世界观", "设定", "角色设定", "人物设定", "角色卡", "人物关系", "角色一致", "人物一致", "不能变脸", "分镜", "镜头表"
  );
  if (sourceAdaptation && adaptationBible && name === "minimax-character-scene-storyboard") {
    adjust(70, "source-adaptation-story-bible");
  }
  if (sourceAdaptation && adaptationBible && name === "minimax-film-shot") {
    adjust(24, "source-adaptation-shot-craft");
  }

  const poster = has("海报", "poster") && has("动起来", "动态", "微动", "做成视频");
  if (poster && name === "minimax-poster-motion-generator") adjust(60, "poster-over-title-sequence");
  if (poster && ["minimax-cinematic-title-sequence", "minimax-suspense-title-sequence-generator"].includes(name)) {
    adjust(-40, "poster-over-title-sequence");
  }

  const transcript = has("口播稿", "逐字稿", "旁白稿", "讲稿", "配音稿") && has("配画", "资料画面", "补镜头", "broll", "b-roll");
  if (transcript && name === "minimax-transcript-broll-planner") adjust(65, "transcript-over-explainer");

  const lyricLed = has("歌词", "字幕") && has("mv", "音乐视频", "节拍", "卡点");
  if (lyricLed && name === "minimax-music-video-subtitle-generator") adjust(65, "lyrics-over-performance-mv");
  if (lyricLed && name === "minimax-cool-music-video") adjust(-35, "lyrics-over-performance-mv");

  return { score, signals };
}

function scoreEntry(entry, request) {
  const normalizedRequest = normalize(request);
  const directName = normalize(entry.name.replace(/^minimax-/, ""));
  const normalizedLabel = normalize(entry.label);
  let score = directName && normalizedRequest.includes(directName) ? 80 : 0;
  const matches = [];
  const signals = [];
  if (normalizedLabel && normalizedRequest.includes(normalizedLabel)) {
    score += 34;
    signals.push(`label:${entry.label}`);
  }
  for (const keyword of entry.keywords || []) {
    const normalizedKeyword = normalize(keyword);
    const occurrences = countOccurrences(normalizedRequest, normalizedKeyword);
    if (!occurrences) continue;
    score += (12 + Math.min(normalizedKeyword.length, 14)) * occurrences;
    matches.push(keyword);
  }
  for (const exclusion of entry.excludes || []) {
    if (normalizedRequest.includes(normalize(exclusion))) {
      score -= 36;
      signals.push(`exclude:${exclusion}`);
    }
  }
  const profile = profileScore(entry.name, normalizedRequest);
  const conflict = conflictAdjustment(entry.name, normalizedRequest);
  score += profile.score + conflict.score;
  signals.push(...profile.signals, ...conflict.signals);
  return { score, matches, signals };
}

export async function routeSkills(request, maxResults = 3) {
  const limit = Math.min(Math.max(Number.parseInt(maxResults, 10) || 3, 1), 5);
  const skills = await listManagedSkills({ enabledOnly: true });
  const producer = skills.find(skill => skill.name === "ai-drama-producer");
  const ranked = skills
    .filter(skill => skill.name !== "ai-drama-producer")
    .map(entry => ({ entry, ...scoreEntry(entry, request) }))
    .filter(item => item.score >= 14)
    .sort((left, right) => right.score - left.score || left.entry.name.localeCompare(right.entry.name))
    .slice(0, limit);

  const selected = ranked.length
    ? ranked
    : producer
      ? [{ entry: producer, score: 0, matches: [], signals: ["fallback:producer"] }]
      : [];
  const margin = ranked.length > 1 ? ranked[0].score - ranked[1].score : ranked[0]?.score || 0;
  const confidence = !ranked.length
    ? "fallback"
    : ranked[0].score >= 60 && margin >= 12
      ? "high"
      : ranked[0].score >= 30
        ? "medium"
        : "low";

  return {
    request: String(request || ""),
    fallback: !ranked.length,
    confidence,
    ambiguous: ranked.length > 1 && margin < 12,
    selected: await Promise.all(selected.map(async item => ({
      name: item.entry.name,
      label: item.entry.label,
      description: item.entry.description,
      origin: item.entry.origin,
      author: item.entry.author,
      score: item.score,
      matchedKeywords: item.matches,
      matchedSignals: item.signals,
      instructions: await readManagedSkillInstructions(item.entry)
    })))
  };
}

export async function listSkills() {
  return listManagedSkills();
}
