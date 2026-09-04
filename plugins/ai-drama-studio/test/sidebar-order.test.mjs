import assert from "node:assert/strict";
import test from "node:test";
import { sortSidebarCreations } from "../public/sidebar-order.js";

const creations = [
  { id: "12", title: "E12《终焉》", createdAt: "2026-09-04T00:02:00.000Z" },
  { id: "2", title: "E02《一个月，三百万》", createdAt: "2026-09-04T00:03:00.000Z" },
  { id: "10", title: "E10《巴蛇与鹿》", createdAt: "2026-09-04T00:01:00.000Z" },
  { id: "1", title: "E01《大枪落幕》", createdAt: "2026-09-04T00:04:00.000Z" }
];

test("sidebar creations default to natural title order", () => {
  assert.deepEqual(sortSidebarCreations(creations).map(item => item.id), ["1", "2", "10", "12"]);
  assert.deepEqual(creations.map(item => item.id), ["12", "2", "10", "1"]);
});

test("sidebar creations can follow ascending creation order", () => {
  assert.deepEqual(sortSidebarCreations(creations, "created").map(item => item.id), ["10", "12", "2", "1"]);
});

test("pinned creations remain first in either sidebar order", () => {
  const items = creations.map(item => item.id === "12" ? { ...item, pinned: true } : item);
  assert.equal(sortSidebarCreations(items, "title")[0].id, "12");
  assert.equal(sortSidebarCreations(items, "created")[0].id, "12");
});
