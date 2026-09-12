"""Small real SkillOpt training run. No video generation and no production mutation."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import sys

from skillopt.config import load_config, flatten_config
from skillopt.engine.trainer import ReflACTTrainer
from skillopt.envs.base import EnvAdapter
from skillopt.model.codex_backend import chat_target

ROOT = Path(__file__).resolve().parent


def score(answer: str, expected: dict) -> tuple[int, float]:
    try:
        clean = answer.strip()
        if clean.startswith("```"):
            clean = "\n".join(clean.splitlines()[1:-1])
        value = json.loads(clean)
        if not isinstance(value, dict) or set(value) != set(expected):
            return 0, 0.0
        matches = [type(value[k]) is type(v) and value[k] == v for k, v in expected.items()]
        return int(all(matches)), sum(matches) / len(matches)
    except (ValueError, TypeError):
        return 0, 0.0


class ProductionDecisions(EnvAdapter):
    analyst_workers = 1
    failure_only = False
    minibatch_size = 4
    edit_budget = 2

    def __init__(self):
        self.splits = json.loads((ROOT / "cases.json").read_text(encoding="utf-8"))
        ids = [row["id"] for rows in self.splits.values() for row in rows]
        if len(ids) != len(set(ids)):
            raise ValueError("Overlapping split identifiers")

    def build_train_env(self, batch_size, seed, **kwargs):
        return self.splits["train"][:batch_size]

    def build_eval_env(self, env_num, split, seed, **kwargs):
        return self.splits["validation" if split == "valid_seen" else "test"][:env_num]

    def get_task_types(self):
        return ["timeline", "preservation", "continuity", "cleanup"]

    def rollout(self, env_manager, skill_content, out_dir, **kwargs):
        dest = Path(out_dir)
        dest.mkdir(parents=True, exist_ok=True)
        results = []
        for item in env_manager:
            system = ("This is a closed-book production-decision evaluation. Do not use tools, read files, "
                      "browse, or perform any real edits. Answer only the supplied problem with a JSON object. "
                      "Use exact requested field names/types. The skill below is guidance, not proof that any "
                      "operation has already happened.\n\n" + skill_content)
            answer, usage = chat_target(system, item["question"], retries=1, timeout=150, stage="production_eval")
            hard, soft = score(answer, item["expected"])
            taskdir = dest / "predictions" / item["id"]
            taskdir.mkdir(parents=True, exist_ok=True)
            (taskdir / "conversation.json").write_text(json.dumps([
                {"role": "system", "content": system},
                {"role": "user", "content": item["question"]},
                {"role": "assistant", "content": answer},
            ], ensure_ascii=False, indent=2), encoding="utf-8")
            result = {"id": item["id"], "hard": hard, "soft": soft,
                      "predicted_answer": answer, "question": item["question"],
                      "task_description": item["question"], "task_type": item["category"],
                      "reference_text": "Evaluator expected structured result: " + json.dumps(item["expected"]),
                      "n_turns": 1, "usage": usage}
            results.append(result)
            print(f"{dest.name}/{item['id']}: hard={hard} soft={soft:.2f}", flush=True)
        (dest / "rollouts.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        return results


def main():
    if any((ROOT / name).exists() for name in ("run-v1", "test-initial", "test-best")):
        raise RuntimeError("Previous results exist; use a fresh experiment directory, do not overwrite them")
    cfg = flatten_config(load_config(str(ROOT / "config.yaml")))
    cfg["codex_exec_path"] = shutil.which("codex")
    if not cfg["codex_exec_path"]:
        raise RuntimeError("Codex CLI unavailable")
    os.environ["CODEX_WORKING_DIRECTORY"] = str(ROOT / "isolated")
    (ROOT / "isolated").mkdir(exist_ok=True)
    cfg["skill_init"] = str(ROOT / "initial_skill.md")
    cfg["out_root"] = str(ROOT / "run-v1")
    inputs = [ROOT / "cases.json", ROOT / "config.yaml", ROOT / "initial_skill.md"]
    hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
    (ROOT / "input-hashes.json").write_text(json.dumps(hashes, indent=2), encoding="utf-8")
    adapter = ProductionDecisions()
    summary = ReflACTTrainer(cfg, adapter).train()
    # Only after training: evaluate initial and selected skill on the untouched final test set.
    initial = (ROOT / "initial_skill.md").read_text(encoding="utf-8")
    best = (ROOT / "run-v1" / "best_skill.md").read_text(encoding="utf-8")
    test_initial = adapter.rollout(adapter.splits["test"], initial, ROOT / "test-initial")
    test_best = adapter.rollout(adapter.splits["test"], best, ROOT / "test-best")
    mean = lambda rows: sum(r["hard"] for r in rows) / len(rows)
    report = {"upstream_commit": "79124b37e9a6371e13b753f8bcd7adb1e493ade1", "summary": summary,
              "test_initial": mean(test_initial), "test_selected": mean(test_best),
              "initial_skill_sha256": hashlib.sha256(initial.encode()).hexdigest(),
              "selected_skill_sha256": hashlib.sha256(best.encode()).hexdigest(),
              "limitations": "12 synthetic decision cases, 4 train/4 validation/4 final test; not a visual animation benchmark. Single run, no claim of generalization or improved video quality."}
    (ROOT / "experiment-result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
