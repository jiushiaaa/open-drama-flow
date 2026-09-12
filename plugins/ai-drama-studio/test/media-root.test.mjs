import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("separate media storage supports upload, preview, versioned editing and recoverable deletion", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-media-root-"));
  process.env.AI_DRAMA_DATA_DIR = path.join(root, "state");
  process.env.AI_DRAMA_MEDIA_DIR = path.join(root, "media");
  const { handler } = await import("../src/http-server.mjs");
  const { readState, mutateState } = await import("../src/store.mjs");
  const { deleteProject } = await import("../src/workflow.mjs");
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(route, method, body) {
    const response = await fetch(base + route, { method, ...(body instanceof FormData
      ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
    const result = await response.json();
    assert.ok(response.ok, JSON.stringify(result));
    return result;
  }
  try {
    const { project } = await request("/api/projects", "POST", { title: "Storage regression" });
    const form = new FormData();
    form.set("projectId", project.id);
    form.set("file", new File(["# Original"], "notes.md", { type: "text/markdown" }));
    const { asset } = await request("/api/assets/import", "POST", form);
    assert.equal(await (await fetch(base + asset.mediaUrl)).text(), "# Original");
    const { asset: revision } = await request(`/api/projects/${project.id}/assets/${asset.id}/content`, "PUT", { content: "# Revised" });
    assert.equal(await (await fetch(base + revision.mediaUrl)).text(), "# Revised");
    const stored = (await readState()).projects.find(item => item.id === project.id);
    assert.equal(stored.assets.length, 2);
    for (const item of stored.assets) {
      assert.ok(path.resolve(item.localPath).startsWith(path.resolve(process.env.AI_DRAMA_MEDIA_DIR) + path.sep));
    }
    assert.equal(await fs.readFile(stored.assets[0].localPath, "utf8"), "# Original");

    // Being registered does not make an arbitrary path outside approved roots public.
    const outside = path.join(root, "outside.md");
    await fs.writeFile(outside, "private");
    await mutateState(state => state.projects.find(item => item.id === project.id).assets.push({ ...stored.assets[0], id: "outside-test", localPath: outside }));
    assert.equal((await fetch(base + "/media/assets/outside-test")).ok, false);

    const deleted = await deleteProject(project.id);
    for (const item of stored.assets) assert.ok(deleted.retainedMediaPaths.includes(item.localPath));
    assert.equal(await fs.readFile(stored.assets[0].localPath, "utf8"), "# Original");
    const manifestName = (await fs.readdir(deleted.recoverablePath)).find(name => name.startsWith("deleted-project-recovery"));
    const recovery = JSON.parse(await fs.readFile(path.join(deleted.recoverablePath, manifestName), "utf8"));
    assert.equal(recovery.project.id, project.id);
    assert.deepEqual(recovery.retainedMediaPaths, deleted.retainedMediaPaths);
    assert.equal((await readState()).projects.length, 0);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
