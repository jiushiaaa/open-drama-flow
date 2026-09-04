# 前期制片清单数据结构

三个核验脚本读取同一个 UTF-8 JSON 文件。路径应由当前项目返回，不硬编码用户目录。

```json
{
  "schemaVersion": "1.0",
  "project": {
    "id": "project-id",
    "title": "作品名",
    "volumeId": "volume-id",
    "volumeTitle": "卷或世界名"
  },
  "source": {
    "path": "absolute-or-project-relative-path",
    "sha256": "64-lowercase-hex",
    "chapterIds": ["C001", "C002"]
  },
  "episodes": [
    {
      "id": "E01",
      "title": "集名",
      "sourceChapterIds": ["C001"],
      "script": {"path": "...", "sha256": "...", "status": "approved"},
      "directorOverview": {"path": "...", "sha256": "...", "status": "approved"},
      "promptPackage": {"path": "...", "sha256": "...", "status": "approved"},
      "shotCount": 42,
      "durationSeconds": 1500
    }
  ],
  "assets": [
    {
      "id": "asset-id",
      "name": "approved-image.png",
      "kind": "image",
      "path": "...",
      "sha256": "...",
      "status": "approved",
      "scope": "series|volume|episode",
      "libraryEligible": true,
      "libraryImported": true,
      "approvalEvidence": "approval-record-id",
      "required": true
    }
  ],
  "audits": {"unresolved": []},
  "production": {
    "targetPlatform": "platform",
    "aspectRatio": "16:9",
    "resolution": "720p",
    "language": "zh-CN",
    "audioPlanStatus": "approved",
    "subtitlePlanStatus": "approved",
    "callCap": 100,
    "videoStarted": false
  },
  "approvals": {"videoStartApproved": false}
}
```

## 状态值

- `draft`、`candidate`、`pending-review`、`rejected`、`superseded`：不得作为正式项目资产。
- `approved`：用户已批准的精确版本。
- `verified-source`：只允许用于原文快照、机械索引和可验证摘录。

## 路径与哈希

脚本会对存在的文件重新计算 SHA-256。相对路径以清单所在目录为基准。不存在、哈希格式错误或实际哈希不一致都会阻断开拍就绪。
