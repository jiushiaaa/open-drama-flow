export function compareSidebarTitles(left, right) {
  return String(left?.title || "").localeCompare(String(right?.title || ""), "zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
}

export function sortSidebarCreations(items, mode = "title") {
  return [...items].sort((left, right) => {
    const pinnedOrder = Number(Boolean(right?.pinned)) - Number(Boolean(left?.pinned));
    if (pinnedOrder) return pinnedOrder;
    if (mode === "created") {
      const createdOrder = new Date(left?.createdAt || 0) - new Date(right?.createdAt || 0);
      if (Number.isFinite(createdOrder) && createdOrder) return createdOrder;
    }
    return compareSidebarTitles(left, right);
  });
}
