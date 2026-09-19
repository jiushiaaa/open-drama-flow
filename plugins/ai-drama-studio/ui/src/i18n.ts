const labels: Record<string, string> = {
  'canvas.node.untitled': '未命名素材', 'canvas.node.renameHint': '项目素材名称',
  'canvas.node.emptyImage': '暂无图片', 'canvas.node.emptyVideo': '暂无视频',
  'canvas.node.emptyAudio': '暂无音频', 'canvas.node.audio': '音频',
  'canvas.node.editText': '暂无文本内容', 'canvas.node.generating': '生成中',
  'canvas.node.failed': '生成失败', 'canvas.node.retry': '重试',
  'canvas.node.missingPlugin': '未支持的节点', 'common.download': '下载', 'common.delete': '删除'
};
export function useTranslation() { return { t: (key: string, _options?: unknown) => labels[key] || key }; }
