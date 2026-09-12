# Real production examples / 真实制作样例

Published 2026-09-12 from an original environment shot made during episode-one production. No source novel, third-party film, dialogue, music or full episode is included.

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
