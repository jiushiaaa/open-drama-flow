# OpenDramaFlow canvas island

React 19 + TypeScript, built with Vite and Tailwind. Only the canvas is React;
the project library, asset tools, credentials and production backend remain OpenDramaFlow.

## Build

```sh
cd plugins/ai-drama-studio/ui
npm ci
npm run build
```

Commit `public/canvas-ui/` with source changes. The installed plugin serves these
prebuilt local files; users do not need a second development server or a UI build.
Run `npm test` in the plugin root after rebuilding (the bundle adapter is tested).
The stylesheet lives inside a Shadow DOM so Tailwind's reset cannot change the
existing project/asset/Skill pages.

## Upstream and adaptations

Source: [basketikun/infinite-canvas](https://github.com/basketikun/infinite-canvas),
MIT, pinned to `d213a74614e0e4bd8a26383d1e1e907249e9c61b`.
The full upstream license is in `LICENSE.infinite-canvas`; runtime notices ship
in `public/canvas-ui/THIRD-PARTY-LICENSES.txt`. The canvas footer retains a visible
author/project link.

Copied source files under `src/`:

- `components/canvas/infinite-canvas.tsx`: upstream pan/zoom/grid; `overflow-clip`
  prevents focus scrolling from silently displacing the coordinate system.
- `components/canvas/canvas-node.tsx`: native node frame, selection, resize,
  text/image/video/audio rendering. Read-only host defaults disable inline title
  and text mutation and unsupported connection handles. Full preview routes back
  to the existing asset viewer. Video uses lazy loading and an optional same-shot
  reference poster, preventing many large MP4s from preloading at once.
- `components/canvas/canvas-mini-map.tsx`, `canvas-connections.tsx`:
  upstream minimap and Bezier connections.
- `components/canvas/canvas-resource-mention-textarea.tsx`,
  `lib/keyboard-event.ts`, `lib/canvas-theme.ts`, `types/canvas.ts`:
  supporting native components/types; metadata adds a host poster URL.

Host-written files: `adapter.ts`, `entry.tsx`, `style.css`, the light-theme,
translation and built-in-type adapters. The compact action dock follows the
upstream floating-toolbar design but exposes only operations supported here.
No upstream chat, accounts, API keys, model provider, plugin execution, or
localForage project store is included. This is a component integration, not a
claim of whole-product feature parity.

Coordinates and optional dimensions persist under existing creation canvas data.
Asset IDs, version references, approval and production state do not change.
Single-click selects; drag moves; double-click or a filename opens the existing
viewer. Native video/audio controls play media. Default blank drag pans; the
pointer tool box-selects. Shift adds nodes. Middle mouse pans, wheel zooms 5–500%.
Relations remain host-produced, not user-edited provenance. No paid calls occur
in the canvas bundle.
