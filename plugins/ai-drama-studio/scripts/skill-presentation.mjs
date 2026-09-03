// The catalog owns canonical names and current presentation metadata.
export const entrypointIntro = "本能力按项目运行时执行，保留专业制作决策、质量标准和参考资料。模型与工具以实际能力清单为准；文件完整性由技能清单校验。";

export function updateEntrypointPresentation(content, entry) {
  return content
    .replace(/^name:.*$/m, `name: ${entry.name}`)
    .replace(/^description:.*$/m, `description: ${entry.description}`)
    .replace(/^# .+$/m, `# ${entry.label}`)
    .replace(/^本能力按项目运行时执行.*$/m, entrypointIntro);
}

export function updateOpenaiYaml(content, entry) {
  const shortDescription = entry.description.length <= 64
    ? entry.description
    : entry.description.split("；")[0] + "。";
  if (shortDescription.length < 25 || shortDescription.length > 64) {
    throw new Error(`Invalid UI description length: ${entry.name}`);
  }
  const fields = {
    display_name: entry.label,
    short_description: shortDescription,
    default_prompt: `使用 $ai-drama-studio:${entry.name}，根据我提供的素材与要求完成${entry.label}，并核验所需工具与交付结果。`
  };
  let yaml = content || "interface:\n";
  if (!/^interface:\s*$/m.test(yaml)) throw new Error(`Missing interface: ${entry.name}`);
  for (const [key, value] of Object.entries(fields)) {
    const line = `  ${key}: ${JSON.stringify(value)}`;
    const pattern = new RegExp(`^  ${key}:.*$`, "m");
    yaml = pattern.test(yaml) ? yaml.replace(pattern, () => line) : yaml.replace(/^interface:\s*$/m, match => `${match}\n${line}`);
  }
  return yaml.trimEnd() + "\n";
}
