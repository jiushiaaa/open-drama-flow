// Only production media types are admitted; upstream AI/plugin execution is not mounted.
import type { CanvasNodeData } from '@/types/canvas';
const colors: Record<string, string> = { image: '#10b981', video: '#f97316', audio: '#a855f7', text: '#78716c' };
export function getNodeDefinition(type: string) {
  return { minimapColor: colors[type], interactionToggle: false, transparentBackground: false,
    hasSourceHandle: false, forceInteractive: (_node: CanvasNodeData) => true,
    keepAspectRatio: (node: CanvasNodeData) => node.type === 'image' || node.type === 'video' };
}
