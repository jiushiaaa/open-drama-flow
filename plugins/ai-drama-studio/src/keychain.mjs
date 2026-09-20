import { spawn } from "node:child_process";

// Never put secret bytes in process arguments, shell commands, environment or logs.
function run(args, input = "") {
  return new Promise((resolve, reject) => {
    const child = spawn("/usr/bin/security", args, { stdio: ["pipe", "pipe", "pipe"], timeout: 15000 });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-4096); });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.once("error", () => reject(new Error("KEYCHAIN_UNAVAILABLE")));
    child.once("close", code => resolve({ code, stdout }));
    child.stdin.end(input, "utf8");
  });
}

export async function keychain(action, name, value = "", execute = run) {
  if (!/^[a-z0-9.-]+$/.test(name)) throw new Error("KEYCHAIN_NAME_INVALID");
  const attributes = ["-a", "OpenDramaFlow", "-s", `org.opendramaflow.${name}`];
  if (action === "protect") {
    if (!value || /[\s\x00-\x1f\x7f]/.test(value)) throw new Error("KEYCHAIN_VALUE_INVALID");
    // security's interactive command parser, not a shell. Hex avoids quoting ambiguity.
    const hex = Buffer.from(value, "utf8").toString("hex");
    const saved = await execute(["-i", "-q"], `add-generic-password -U ${attributes.join(" ")} -X ${hex}\n`);
    if (saved.code !== 0) throw new Error("KEYCHAIN_SAVE_FAILED");
    const read = await execute(["find-generic-password", ...attributes, "-w"]);
    if (read.code !== 0 || read.stdout.trimEnd() !== value) throw new Error("KEYCHAIN_SAVE_VERIFY_FAILED");
    return "";
  }
  const command = action === "clear" ? "delete-generic-password" : "find-generic-password";
  if (!["clear", "exists", "unprotect"].includes(action)) throw new Error("KEYCHAIN_ACTION_INVALID");
  const result = await execute([command, ...attributes, ...(action === "unprotect" ? ["-w"] : [])]);
  // errSecItemNotFound (-25300) is returned as exit status 44. Other failures are not 'missing'.
  if (result.code === 44 && action !== "unprotect") return action === "exists" ? false : "";
  if (result.code !== 0) throw new Error("KEYCHAIN_ACCESS_FAILED");
  return action === "exists" ? true : action === "clear" ? "" : result.stdout.trimEnd();
}
