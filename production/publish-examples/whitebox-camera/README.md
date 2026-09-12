# Original space/camera reference / 原创空间运镜白模

This is an existing Codex-authored Three.js experiment, not a new model generation. It uses procedural boxes, columns, rings and camera curves—no downloaded film, actor capture, texture or model weight is included.

![Six-second camera preview](preview.gif)

[Download the full 20-second reference](space-camera-reference.mp4): 1280×720, 24 fps, 480 frames, no audio. This is **rendered geometry, not Video Depth Anything output**. Gray color is a layout placeholder, not a calibrated depth value.

## Use the existing video

Download `space-camera-reference.mp4` and assign it a **camera/space** reference role in a compatible video-generation request. Supply your own appearance images and prompt. Inspect returned motion and geometry; the reference is not a hard constraint and is not approved fight choreography.

## Inspect or adapt the source

The included source and dependency lock are copied from the original experiment. Three.js itself is not bundled.

```sh
npm ci
python -m http.server 4328 --bind 127.0.0.1
```

Open `http://127.0.0.1:4328/preview.html` to play or scrub the original camera path. `vision-camera-v1.js` defines the geometry and a `renderAt(t)` function, with seconds in `[0,20]`. `vision-camera-v1.html` is the original static-at-zero render entrypoint; `preview.html` adds a small playback control without changing the scene.

Run these commands from this folder, not the private production root. Close the server with Ctrl+C when finished. The MP4 is a preserved render, not automatically re-rendered by the browser viewer.

## Evidence and limits

- Original private file: `CH02-vision-camera-whitebox-v1.mp4`; published copy is byte-identical. Hashes are in [the publication manifest](../showcase-manifest.json).
- The reference and GIF were fully decoded. A five-time-point overview was visually inspected; this does not certify every frame or downstream Seedance quality.
- Use this procedural camera study as an editable starting point. It does not contain skeletal motion capture, collision/contact solving, measured real-world space or metric depth.
- Source code is covered by the repository's MIT software license; Three.js retains its upstream MIT license. The maintainer permits use and adaptation of this procedural whitebox video for production-workflow experiments. This grants no rights to the novel, episode, third-party films or model weights.

中文：提供的是已经渲染好的原创空间机位参考和对应源码，可直接下载作运镜参考，也可在本地播放、拖动时间条检查并修改代码。它不是深度估计数据，不是动作捕捉，不能保证生成模型精确复现。电影原片和从电影处理出的深度素材没有一起公开。
