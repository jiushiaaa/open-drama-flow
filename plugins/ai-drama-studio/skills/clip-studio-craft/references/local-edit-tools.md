# 可靠本地剪辑工具

## 分工与验收

Skill 决定叙事、剪点、眼神、动作、字幕措辞；工具负责版本锁定、确定性执行和证据。
优先使用下述 MCP 工具；MCP 未刷新时可运行 `node scripts/edit-local-media.mjs ABSOLUTE_PLAN_JSON NEW_ABSOLUTE_OUTPUT_DIRECTORY [--validate-only]`。
所有路径必须绝对，输出目录必须不存在且父目录已存在。原片不覆盖。没有模型调用、上传、自动入库或自动用户验收。
先把本页 schema 写成 JSON，再执行 validateOnly；不要每次重新拼手工 FFmpeg 命令。

## drama_edit_local_media

参数：`planPath`, `outputDirectory`, `validateOnly`（默认 false）。

计划格式：

```json
{
  "version": 1,
  "revision": "edit-001",
  "fps": 24,
  "width": 1280,
  "height": 720,
  "burnSubtitles": true,
  "clips": [{
    "id": "shot-01",
    "path": "D:/project/approved-shot.mp4",
    "sha256": "替换为核验过的64位SHA256",
    "acceptanceReference": "记录用户验收消息或批准清单位置",
    "subtitleState": "clean",
    "inFrame": 24,
    "outFrame": 264,
    "audio": "native",
    "cues": [{"startFrame": 30, "endFrame": 90, "zh": "普通话书面字幕", "en": "English subtitle."}]
  }]
}
```

- 帧范围为源片零起始、左闭右开。cues 也在源片坐标中，裁切后自动映射；分镜顺序即数组顺序。同一源片多次使用必须给不同 id。
- acceptanceReference 是执行者引用的验收依据，工具不会把这个字符串当成已完成用户审核；禁止按文件名最新自动选片。
- 当前仅支持相同整数 CFR（1–60fps）。逐段检查实际帧时间戳；拒绝 VFR、缺帧、变速或不同帧率输入。不会悄悄丢帧改速。
- 保留源音画的时间偏移，原声默认保留，缺音轨须明确 `silence`；短音轨补静音到画面长度。片段使用无损临时文件，最终 H264/AAC 编码，不能声称音频位元无损。
- `subtitleState` 为 clean/burned/unknown，必须先看图核实。已有或未知硬字幕的片不能再烧字幕；此项是声明防错，不是 OCR 检测。
- 普通话中文在上、英文在下，实际开口时刻决定 cues。字幕跨剪点、重复或重叠会报错；先调整剪点或重新核实对白，不自动剪断台词。字幕中不接受换行或样式标记。
- 输出 review.mp4、ASS/SRT、输入计划和哈希记录。每个接缝：末6帧＋首6帧拼图及约2秒带声音短片。每条字幕：出现前/首帧/末帧/消失帧拼图。未烧录时预览不含字幕。
- 查看拼图后还要正常速度播放接缝；检查动作阶段、视线对象、衣物/道具状态、音色与断词。连续性问题不能靠工具技术通过代替审核。
- 不自动插转场，不支持变速、J/L cut、多视频轨或自动纠正人物穿帮。长片会生成无损临时片，必须预留磁盘；成功后只删除本次明确创建的临时片，失败保留诊断。大工程按已批准段落导出，避免单次 MCP 长时间等待。

## drama_process_local_audio

参数 `planPath`, `outputDirectory`，计划 source 是 `{path, sha256}`。仅 measure 不写输出。

- 测量：`{operation:"measure",source,startSeconds:0,durationSeconds:7,signalLabel:"full-mix"}`。返回区间 LUFS/true peak，不自动改变响度。只有确实分离的对白才能标 isolated-dialogue。
- 母版精裁：`{operation:"extract",source,character:"角色名",acceptanceReference:"用户选择依据",sampleRate:48000,startSample:48000,endSample:144000}`。必须符合实际采样率；按解码后的样本序号裁，保留声道和采样率，输出 PCM24 WAV，核对样本数。语义仍需听音。供应商格式用现有 prepare_reference_asset 创建独立派生版本，不能替换此母版。
- 混音：`{operation:"mix",source,nativeGainDb:0,tracks:[{source:{path,sha256},atSeconds:1,inSeconds:0,durationSeconds:3,gainDb:-18,fadeSeconds:0.2,purpose:"music"}]}`。source 必须为零起始视频及原生音轨；保留视频包，原声保留，补充音乐/环境/音效按精确时间、增益和淡入淡出叠加，输出限幅并测量。purpose 为 music/ambience/foley。
- 不能默认整段消音重配，已有脚步、碗筷、击打声不重复叠加。事件落点靠正常速度听看验收，能量峰值不是语义接触点。
- 自动对白检测/自动 ducking 暂未实现；需压音乐时按对白区间拆轨设置增益及短淡变，不把整条原生混音当孤立对白进行 sidechain。

## drama_compare_local_edits

参数 previousPlanPath、nextPlanPath，以及可选 derivativesPath。
比较帧区间、源哈希、字幕、音轨策略、输出规格，输出变更区间。位置变化但内容一致可复用素材，字幕仍按新时间线重建。

4K 派生清单是数组，每项包含 sourceSha256、inFrame、outFrame、path、sha256、acceptanceReference、cleanVideo:true。核验派生文件哈希、3840×2160、帧率、帧数；仅完全相同源区间匹配。这个声明需有既往超分记录支撑，不能只看文件名。
工具只规划复用，不启动超分，不证明两段视觉一致，也不直接提升清晰度。音频和字幕从本次计划重建；最后仍核验成片时间戳与音画同步。

## 发布边界

每次结果区分 technicalPassed、visualReview、listeningReview、userAcceptance。未播放不能填已播放；工具完成不等于角色/发音/字幕已验收。锁定母版只在用户接受具体候选后升级，旧版本与修改区间保留证据。
