// Presentation only: no media identity, approval or production state is changed here.
export function normalizeCanvasLayout(patch = {}, previous = {}) {
  const number = (value, fallback) => {
    const result = Number(value ?? fallback);
    if (!Number.isFinite(result)) throw new Error('CANVAS_LAYOUT_INVALID');
    return result;
  };
  const viewport = { ...previous.viewport, ...patch.viewport };
  const entries = Object.entries(patch.positions ?? previous.positions ?? {});
  if (entries.length > 5000) throw new Error('CANVAS_NODE_LIMIT');
  const positions = Object.fromEntries(entries.map(([id, value]) => {
    if (!id || id.length > 200) throw new Error('CANVAS_NODE_ID_INVALID');
    const position = { x: Math.round(number(value?.x, 0)), y: Math.round(number(value?.y, 0)) };
    for (const key of ['width', 'height']) {
      const dimension = value?.[key] ?? previous.positions?.[id]?.[key];
      if (dimension != null) position[key] = Math.round(Math.min(5000, Math.max(key === 'width' ? 220 : 160, number(dimension, 0))));
    }
    return [id, position];
  }));
  return { viewport: { x: Math.round(number(viewport.x, 120)), y: Math.round(number(viewport.y, 90)), zoom: Math.min(5, Math.max(.05, number(viewport.zoom, .78))) }, positions };
}
