import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Compass, Focus, Hand, MousePointer2, Maximize2, X, Minus, Plus } from 'lucide-react';
import { InfiniteCanvas } from './components/canvas/infinite-canvas';
import { CanvasNode } from './components/canvas/canvas-node';
import { Minimap } from './components/canvas/canvas-mini-map';
import { ConnectionPath } from './components/canvas/canvas-connections';
import type { CanvasNodeData, Position, ViewportTransform } from './types/canvas';
import { adaptNodes, captureLayout, type CanvasHost } from './adapter';
import './style.css';
export { adaptNodes, captureLayout } from './adapter';

const noop = () => {};

function ProductionCanvas({ host }: { host: CanvasHost }) {
  const container = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState(() => adaptNodes(host.graph, host.layout));
  const [viewport, setViewport] = useState<ViewportTransform>(() => ({ x: host.layout.viewport?.x ?? 120, y: host.layout.viewport?.y ?? 90, k: host.layout.viewport?.zoom ?? 0.78 }));
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<string[]>([]);
  const [tool, setTool] = useState<'pan' | 'select'>('pan');
  const [minimap, setMinimap] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const latest = useRef({ nodes, viewport, selected, host });
  latest.current = { nodes, viewport, selected, host };
  const cleanupGesture = useRef(noop);
  const inGesture = useRef(false);

  const save = useCallback(() => {
    const state = latest.current;
    state.host.save(captureLayout(state.nodes, state.viewport, state.host.layout));
  }, []);
  const changeViewport = useCallback((next: ViewportTransform) => {
    latest.current.viewport = next;
    setViewport(next);
    save();
  }, [save]);
  const deselect = useCallback(() => { setSelected([]); setMenu(null); }, []);
  const fit = useCallback(() => {
    const { nodes: all } = latest.current;
    const rect = container.current?.getBoundingClientRect();
    if (!rect?.width || !all.length) return;
    const left = Math.min(...all.map(n => n.position.x)), top = Math.min(...all.map(n => n.position.y));
    const width = Math.max(...all.map(n => n.position.x + n.width)) - left;
    const height = Math.max(...all.map(n => n.position.y + n.height)) - top;
    const k = Math.max(.05, Math.min(1, (rect.width - 120) / width, (rect.height - 170) / height));
    changeViewport({ k, x: (rect.width - width * k) / 2 - left * k, y: (rect.height - height * k) / 2 - top * k - 20 });
  }, [changeViewport]);

  useEffect(() => {
    if (!inGesture.current) setNodes(adaptNodes(host.graph, host.layout));
  }, [host.graph, host.layout]);
  useEffect(() => {
    const element = container.current!;
    let fitted = Object.keys(host.layout.positions || {}).length > 0;
    const observer = new ResizeObserver(() => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
      if (!fitted && element.clientWidth && element.clientHeight && latest.current.nodes.length) { fitted = true; fit(); }
    });
    observer.observe(element);
    return () => { observer.disconnect(); cleanupGesture.current(); };
  }, [fit]);

  const preview = useCallback((node: CanvasNodeData) => {
    const domain = latest.current.host.graph.nodes.find(item => item.id === node.id);
    if (domain) latest.current.host.preview(domain);
    setMenu(null);
  }, []);

  const beginDrag = useCallback((event: React.MouseEvent, id: string) => {
    if (event.button !== 0 || (event.target as Element).closest('button,input,textarea,video,audio')) return;
    event.stopPropagation(); event.preventDefault(); setMenu(null);
    const initial = latest.current;
    const additive = event.shiftKey || event.metaKey;
    const ids = additive ? [...new Set([...initial.selected, id])] : initial.selected.includes(id) ? initial.selected : [id];
    setSelected(ids);
    const x = event.clientX, y = event.clientY;
    let moved = false;
    inGesture.current = true;
    cleanupGesture.current();
    const move = (e: MouseEvent) => {
      if (!moved && Math.hypot(e.clientX - x, e.clientY - y) < 5) return;
      moved = true;
      const next = initial.nodes.map(n => ids.includes(n.id) ? { ...n, position: { x: n.position.x + (e.clientX - x) / initial.viewport.k, y: n.position.y + (e.clientY - y) / initial.viewport.k } } : n);
      latest.current.nodes = next; setNodes(next);
    };
    const finish = () => {
      cleanupGesture.current(); inGesture.current = false;
      if (moved) save();
    };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', finish); window.addEventListener('blur', finish);
    cleanupGesture.current = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', finish); window.removeEventListener('blur', finish); };
  }, [save]);

  const resize = useCallback((id: string, width: number, height: number, position?: Position) => {
    const next = latest.current.nodes.map(n => n.id === id ? { ...n, width, height, position: position || n.position } : n);
    latest.current.nodes = next; setNodes(next);
  }, []);
  const startResize = useCallback((id: string) => { inGesture.current = true; setSelected([id]); }, []);
  const finishResize = useCallback(() => { inGesture.current = false; save(); }, [save]);

  const beginSelection = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const initial = latest.current, rect = container.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left - initial.viewport.x) / initial.viewport.k;
    const y = (event.clientY - rect.top - initial.viewport.y) / initial.viewport.k;
    const base = event.shiftKey ? initial.selected : [];
    setMenu(null); setSelected(base);
    cleanupGesture.current(); inGesture.current = true;
    const move = (e: PointerEvent) => {
      const endX = (e.clientX - rect.left - initial.viewport.x) / initial.viewport.k;
      const endY = (e.clientY - rect.top - initial.viewport.y) / initial.viewport.k;
      const bounds = { x: Math.min(x, endX), y: Math.min(y, endY), width: Math.abs(endX - x), height: Math.abs(endY - y) };
      setBox(bounds);
      setSelected([...new Set([...base, ...initial.nodes.filter(n => n.position.x < bounds.x + bounds.width && n.position.x + n.width > bounds.x && n.position.y < bounds.y + bounds.height && n.position.y + n.height > bounds.y).map(n => n.id)])]);
    };
    const finish = () => { cleanupGesture.current(); inGesture.current = false; setBox(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', finish); window.addEventListener('blur', finish);
    cleanupGesture.current = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', finish); window.removeEventListener('blur', finish); };
  }, []);
  const openMenu = useCallback((event: React.MouseEvent, id: string) => {
    event.preventDefault(); event.stopPropagation(); setSelected([id]);
    const rect = container.current!.getBoundingClientRect();
    setMenu({ id, x: Math.max(8, Math.min(event.clientX - rect.left, rect.width - 200)), y: Math.max(8, Math.min(event.clientY - rect.top, rect.height - 140)) });
  }, []);
  const zoom = (k: number) => {
    const next = Math.max(.05, Math.min(5, k)), state = latest.current.viewport;
    changeViewport({ k: next, x: size.width / 2 - (size.width / 2 - state.x) * next / state.k, y: size.height / 2 - (size.height / 2 - state.y) * next / state.k });
  };
  const byId = new Map(nodes.map(n => [n.id, n]));
  const activeNode = selected.length === 1 ? byId.get(selected[0]) : null;
  return <div className="odf-canvas" onAuxClick={e => { if (e.button === 1) e.preventDefault(); }} onKeyDown={e => { if (e.key === 'Escape') { deselect(); setBox(null); } }}>
    <InfiniteCanvas containerRef={container} viewport={viewport} tool={tool} backgroundMode="dots" onViewportChange={changeViewport} onCanvasDeselect={deselect} onCanvasMouseDown={beginSelection} onDrop={e => { e.preventDefault(); host.upload([...e.dataTransfer.files]); }}>
      <svg className="odf-connections" aria-hidden="true">{host.graph.edges.map(edge => {
        const from = byId.get(edge.source), to = byId.get(edge.target);
        return from && to ? <ConnectionPath key={edge.id} connection={{ id: edge.id, fromNodeId: edge.source, toNodeId: edge.target }} from={from} to={to} active={selected.includes(from.id) || selected.includes(to.id)} onSelect={() => setSelected([from.id, to.id])} /> : null;
      })}</svg>
      {nodes.map(node => <React.Fragment key={node.id}>
        <CanvasNode data={node} scale={viewport.k} isSelected={selected.includes(node.id)} isRelated={false} isFocusRelated={false} isConnectionTarget={false} isConnecting={false} showPanel={false} showImageInfo={false} onMouseDown={beginDrag} onHoverStart={noop} onHoverEnd={noop} onConnectStart={noop} onResizeStart={startResize} onResize={resize} onResizeEnd={finishResize} onContentChange={noop} onTitleChange={noop} onViewImage={preview} onContextMenu={openMenu} />
        <button className="odf-node-label" style={{ left: node.position.x, top: node.position.y + node.height + 8, width: node.width }} title={node.title} onClick={() => preview(node)} onPointerDown={e => e.stopPropagation()}>{node.title}</button>
      </React.Fragment>)}
      {box && <div className="odf-selection" style={{ left: box.x, top: box.y, width: box.width, height: box.height }} />}
      {activeNode && <div className="odf-node-actions" style={{ left: activeNode.position.x + activeNode.width / 2, top: activeNode.position.y - 66 }} onPointerDown={e => e.stopPropagation()}>
        <button onClick={() => preview(activeNode)} title="打开完整素材"><Maximize2 size={16} />打开</button><button onClick={deselect} title="取消选择"><X size={15} /></button>
      </div>}
    </InfiniteCanvas>
    {!nodes.length && <div className="odf-empty"><img src="/assets/studio-pixel-icon.png" alt="" /><h2>从一条创作指令开始</h2><p>在 Codex 中描述目标，已入库素材会同步到这里。</p></div>}
    {minimap && <Minimap nodes={nodes} viewport={viewport} viewportSize={size} onViewportChange={changeViewport} />}
    <div className="odf-dock" aria-label="画布操作">
      <button aria-label="平移画布" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}><Hand size={18} /></button>
      <button aria-label="框选节点" aria-pressed={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 size={18} /></button><i />
      <button aria-label="小地图" aria-pressed={minimap} onClick={() => setMinimap(!minimap)}><Compass size={18} /></button>
      <button aria-label="适应内容" onClick={fit}><Focus size={18} /></button><i />
      <button aria-label="缩小" onClick={() => zoom(viewport.k / 1.15)}><Minus size={16} /></button>
      <output>{Math.round(viewport.k * 100)}%</output>
      <button aria-label="放大" onClick={() => zoom(viewport.k * 1.15)}><Plus size={16} /></button>
    </div>
    {selected.length > 1 && <div className="odf-selection-count">已选择 {selected.length} 个节点 · 拖动可整体移动</div>}
    {menu && <div className="odf-context-menu" style={{ left: menu.x, top: menu.y }} role="menu"><button role="menuitem" onClick={() => { const node = byId.get(menu.id); if (node) preview(node); }}>打开完整素材</button><button role="menuitem" onClick={deselect}>取消选择</button></div>}
    <footer className="odf-status"><span>{nodes.length} 个节点 · {host.graph.edges.length} 条关联</span><span>滚轮缩放 · 中键平移 · 双击预览</span><a href="https://github.com/basketikun/infinite-canvas" target="_blank" rel="noreferrer">infinite-canvas ↗</a></footer>
  </div>;
}

export function mountCanvas(element: HTMLElement) {
  const shadow = element.shadowRoot || element.attachShadow({ mode: 'open' });
  shadow.replaceChildren();
  const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = new URL(/* @vite-ignore */ './canvas.css', import.meta.url).href;
  const rootElement = document.createElement('div'); rootElement.id = 'react-canvas'; shadow.append(stylesheet, rootElement);
  const root = createRoot(rootElement);
  return { render(host: CanvasHost) { root.render(<ProductionCanvas key={host.key} host={host} />); }, unmount() { root.unmount(); } };
}
