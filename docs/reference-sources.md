# Model and reference source index

Checked 2026-09-12. This index links upstream projects rather than redistributing their weights, dependencies or third-party input films. Local success is not proof of every upstream capability.

| Source | Role in this project | Boundary |
| --- | --- | --- |
| [Video Depth Anything](https://github.com/DepthAnything/Video-Depth-Anything) | Depth-reference production experiments | Estimates depth; not articulated pose, identity or fighting-contact reconstruction. Consult the upstream license and checkpoint terms separately. |
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | Model-assisted production upscaling | Upscaled pixels are not native high-resolution capture or guaranteed recovered detail. |
| [Real-ESRGAN ncnn Vulkan](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan) | Local executable used by production runners | Requires its own installation and model files; not shipped as part of the plugin. |
| [Higgsfield short-film pipeline](https://higgsfield.ai/blog/ai-short-film-pipeline) | Comparative workflow study | Inspiration for identity, spatial planning and sound-first decisions; no Higgsfield adapter or Soul ID training is implied. |

For a depth experiment, follow the upstream environment/checkpoint instructions and use your own authorized source video. Its documented offline entrypoint is:

```sh
python run.py --input_video input.mp4 --output_dir outputs --encoder vitl
```

Register the source hash, exact model/checkpoint, settings and produced files in your private production manifest. Treat the result as a reference to inspect, not automatically approved production memory. Do not upload a downloaded film or its depth derivatives merely because the processing software is open source.

The producer's [scoped reference cases](../plugins/ai-drama-studio/skills/ai-drama-producer/references/project-profiles/guhuoniao-reference-learning.md) preserve observations and their limits. Private filenames/hashes may identify evidence; the files themselves and personal-machine locations are not published. Only [curated original examples](../production/publish-examples/README.md) accompany this release.
