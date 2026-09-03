# Brief 文件模板

第 1 阶段输入解析结果按以下格式整理为项目简报。

```markdown
# 综合设定图 Brief

## 项目信息
- 项目名：{project_name}
- 角色数：{N}
- 镜头数：{shot_count}
- 分镜格布局：{rows} 行 × {cols} 列
- 分镜画面比例：{panel_ratio}
- **视觉风格**：{style_id} {style_name}（如 S1 写实电影感）
- **风格叠加词**：{extra_style_modifiers}（若无则留空）

## 角色档案

### {角色名A}
- 参考图：{path}
- 性别/年龄：{gender}, ~{age}岁
- 发型：{hair}
- 面部特征：{face_features}
- 服装：{outfit}
- 体型：{build}
- 情绪基调：{mood}

### {角色名B}
（同上）

## 场景档案
- 环境：{environment}
- 时代背景：{era}
- 光影方案：{lighting}
- 氛围关键词：{mood_keywords}
- 色调：{color_palette}

## 分镜列表

| 镜号 | 景别 | 核心动作 | 情绪 | 在场人物 |
|------|------|---------|------|---------|
| 01   | MS   | ...     | ...  | A, B    |
| 02   | CU   | ...     | ...  | C       |
...
```
