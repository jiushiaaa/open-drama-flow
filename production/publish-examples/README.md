# Real production examples / 真实制作样例

Published 2026-09-12 from selected episode-one environment shots and an original procedural camera study. No source novel, third-party film, dialogue, music or full episode is included. The episode cover is published for showcasing the creator's linked work, not as a general character-asset license.

## Watch and reuse

- [Published episode on Douyin](https://v.douyin.com/rD_OP4_kMSI/) — creator-supplied video link; automated resolution was unavailable during this update.
- [Creator's published episode on Xiaohongshu](https://www.xiaohongshu.com/discovery/item/6aa5351d0000000028029cea) — external showcase, supplied by the creator; not independently played online during this documentation update.
- [Opening montage](opening-showcase.gif) — a muted 6-second GIF: source `[2,4)`, `[9,11)`, `[16,18)` seconds from the existing 20-second `opening-raw-720p.mp4`, in that order. 512×288, 8 fps; selected scenes only, not a continuous shot or quality benchmark.
- [Original whitebox camera package](whitebox-camera/README.md) — complete rendered video, source scene, pinned dependency and browser playback/scrub controls. **Not a depth-estimation dataset.**
- [Showcase file hashes](showcase-manifest.json) — provenance and verification metadata for this update.

The montage preserves existing shots; no image/video model was called for this publication. The opening overview was sampled at 3-second intervals, and the GIF was fully decoded. The last empty overview tile was unused, not a source black frame. This was not a full-episode audiovisual review.

## Publication boundary

| Material | Published? | Reason / next requirement |
| --- | --- | --- |
| Original procedural space/camera reference | Yes: video and source | Editable research example, with limitations stated. |
| Selected generated environments and episode cover | Yes | Creator-selected showcase; not a license to the underlying novel/IP. |
| Full episode | External viewing link only | No multi-gigabyte master bundled. |
| Collected films and martial-arts tutorials | No | Local source records do not establish redistribution rights. |
| Depth MP4/NPZ derived from those films/tutorials | No | Processing does not establish permission to redistribute the source-derived data. |
| Model weights, private state, keys and logs | No | Use upstream installation instructions; keep private runtime data local. |

The inspected local depth collections include movie fight excerpts and online training clips. They are **not an openly licensed dataset**. A future reusable depth pack needs source-by-source permission, an explicit distribution license, source/depth alignment, model/checkpoint details and hashes. Do not remove provenance or use depth conversion to evade a provider's input restrictions. This update leaves the local source and depth library untouched.

中文：这次只发布整理后的原创白模、生成镜头展示和作品封面。电影／教学原片及其深度文件暂不上传；需逐条确认再分发授权后，才能作为他人可直接复用的数据包公开。本地原素材与深度文件没有删除。

## Environment upscale comparison

![Synchronized matched crop: 720p source left, 4K upscale right](upscale-comparison.gif)

The inline preview uses the same four-second interval in both files: crop `(440,180,480,320)` from the 720p source and `(1320,540,1440,960)` from the 4K result. Each crop is scaled to 400×266, separated by an eight-pixel divider and encoded at 6 fps with a 96-color palette. The GIF is a compact preview, not a lossless pixel-quality benchmark; full-resolution clips remain below.

| File | Contents |
| --- | --- |
| `ending-720p-4s.mp4` | Seedance-generated environment, source interval [2,6) seconds, 1280×720 |
| `ending-upscaled-4k-4s.mp4` | Same interval after the production Real-ESRGAN-assisted upscale, 3840×2160 |
| `ending-720p-preview.jpg` | Original source at 3 seconds; README preview |
| `ending-contact-sheet.jpg` | Original source sampled at 2, 3, 4 and 5 seconds |

Both clips have no audio, run at 24 fps and have been fully decoded without errors. The contact sheet was visually inspected: environment only, no visible characters or source dialogue. This is sampling evidence, not a claim of exhaustive temporal quality assessment.

**The 4K file is an upscale, not native 4K generation.** The production recipe used Real-ESRGAN ncnn-vulkan `realesr-animevideov3`, followed by a blend with the original Lanczos-scaled picture to retain its texture. The comparison also includes video re-encoding; it is not a controlled benchmark of raw model quality.

## Reproduce the excerpt

The private source filenames were `ending-raw-720p.mp4` and `ending-4K.mp4`, each a 20-second environment shot. With your own corresponding files, use FFmpeg:

```sh
ffmpeg -n -ss 2 -i ending-raw-720p.mp4 -t 4 -an -map_metadata -1 -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart ending-720p-4s.mp4
ffmpeg -n -ss 2 -i ending-4K.mp4 -t 4 -an -map_metadata -1 -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart ending-upscaled-4k-4s.mp4
```

SHA-256:

```text
e5a68807d3d06a445011f80ddca54339f1b384621f9a0f63d94bd9ea3cd80c41  ending-720p-4s.mp4
f80e79b933d55cf59ab83514a6d66faa9e2b42f67728bb4aad5e90b150d0034d  ending-upscaled-4k-4s.mp4
991261d9eb62d6c2386b01cd5f924c35dd633ebc30980c2c43affce0d1553fa6  ending-720p-preview.jpg
297643f062ff6f19eda2a0c553d717476f7f6c7cc3b9a1e464d3ec1b88e5151d  ending-contact-sheet.jpg
```

These selected examples were authorized for repository publication. The software's MIT license does not grant rights to third-party works or model weights. No broader rights to the private episode or underlying novel are offered here.
