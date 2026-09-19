// Type subset from infinite-canvas; reference submission stays in OpenDramaFlow.
export type CanvasResourceReference = {
  id: string; nodeId: string; kind: 'image' | 'video' | 'audio' | 'text';
  label: string; title: string; previewUrl?: string; text?: string; active: boolean;
};
