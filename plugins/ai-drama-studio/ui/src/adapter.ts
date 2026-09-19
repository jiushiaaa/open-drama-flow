import { CanvasNodeType, type CanvasNodeData, type ViewportTransform } from './types/canvas';

export type DomainNode = { id: string; kind: string; title: string; body?: string; meta?: string; mediaKind?: string; mediaUrl?: string; posterUrl?: string; assetId?: string; x: number; y: number; width: number; height: number };
export type Layout = { viewport?: { x: number; y: number; zoom: number }; positions?: Record<string, { x: number; y: number; width?: number; height?: number }> };
export type CanvasHost = {
  key: string;
  graph: { nodes: DomainNode[]; edges: { id: string; source: string; target: string }[] };
  layout: Layout;
  save: (layout: Layout) => void;
  preview: (node: DomainNode) => void;
  upload: (files: File[]) => void;
};

export function adaptNodes(graph: CanvasHost['graph'], layout: Layout): CanvasNodeData[] {
  return graph.nodes.map(node => {
    const saved = layout.positions?.[node.id];
    const type = node.mediaUrl && ['image', 'video', 'audio'].includes(node.mediaKind || '') ? node.mediaKind as CanvasNodeType : CanvasNodeType.Text;
    return { id: node.id, type, title: node.title,
      position: { x: saved?.x ?? node.x, y: saved?.y ?? node.y },
      width: saved?.width || node.width, height: saved?.height || node.height,
      metadata: { content: type === CanvasNodeType.Text ? `${node.kind}\n${node.title}\n\n${node.body || ''}` : node.mediaUrl, posterUrl: node.posterUrl, interactive: true } };
  });
}

export function captureLayout(nodes: CanvasNodeData[], viewport: ViewportTransform, previous: Layout): Layout {
  const positions = { ...previous.positions };
  for (const node of nodes) positions[node.id] = { x: Math.round(node.position.x), y: Math.round(node.position.y), width: Math.round(node.width), height: Math.round(node.height) };
  return { viewport: { x: Math.round(viewport.x), y: Math.round(viewport.y), zoom: viewport.k }, positions };
}
