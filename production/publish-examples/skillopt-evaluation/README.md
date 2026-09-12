# Small SkillOpt production-decision experiment

This is a reproducible experiment package, **not an installed production Skill, a trained video model, or an automatic Skill updater**.

## Recorded experiment

- Upstream: [Microsoft SkillOpt](https://github.com/microsoft/SkillOpt), pinned commit `79124b37e9a6371e13b753f8bcd7adb1e493ade1`, package version 0.2.0. Its emitted summary still labels itself `skillopt-0.1.0`; the commit identifies the actual source.
- Trainer: official `ReflACTTrainer`; optimizer/target `gpt-6-astra`, low reasoning, Codex CLI backend, 1 epoch, seed 42.
- 12 synthetic structured decisions: 4 training, 4 selection-validation, 4 final-test questions. Categories: timeline mapping, media preservation, continuity and cleanup scope.
- Baseline: a snapshot of existing production rules, not a deliberately weakened prompt. `initial_skill.md` is copied verbatim; its relative links are historical text in the prompt, not a standalone navigable Skill package.
- Final-test questions are evaluated after training; their scores are not used to select the candidate. Expected answers are used by the evaluator, not added to the target prompt.

**Observed result: no optimization gain.** Baseline selection score 4/4; the training step produced no patches and was skipped. The selected Skill is byte-identical to the initial Skill. Final tests scored 4/4 for both. This confirms a small smoke test of existing rules, not improvement, video quality or generalization.

See [sanitized results](observed-result.json). No raw CLI traces, personal paths, account identifiers or provider credentials are included.

## Reproduce manually

Requires Python 3.10+, a signed-in Codex CLI with access to the configured model, and the upstream dependencies. **Running the experiment consumes model usage**, although it makes no Seedance or other media-generation calls. Different model/version/account settings constitute a different experiment.

From this repository root, clone the pinned upstream into the ignored tools directory and use an isolated environment:

```powershell
git clone https://github.com/microsoft/SkillOpt.git tools/SkillOpt
git -C tools/SkillOpt checkout 79124b37e9a6371e13b753f8bcd7adb1e493ade1
python -m venv tools/skillopt-venv
tools/skillopt-venv/Scripts/python.exe -m pip install -e tools/SkillOpt
tools/skillopt-venv/Scripts/python.exe -X utf8 production/publish-examples/skillopt-evaluation/experiment.py
```

If you already have an upstream checkout, inspect it before changing revisions. Do not overwrite unrelated work. The public runner refuses to overwrite existing result directories; local outputs are ignored by Git. No training runs automatically during plugin installation or normal tests.

Compared with the original execution script, this public copy only adds the no-overwrite guard. The config's relative `_base_` path is adjusted for its public directory. The cases and initial Skill snapshot retain their original hashes; the recorded result belongs to the original run, not a claim that this public copy was rerun against the model.

## Limitations

- Four closely related questions per split are a tiny, near-template test. There is no adversarial dataset, repeated-seed estimate or audiovisual benchmark.
- The score checks exact JSON fields/types/values, not the correctness of arbitrary real edits.
- Read-only sandbox and disabled browsing/network settings are not strong file isolation. The prompt asks the target not to use tools; answers remain in a local file readable by the host. Without a complete CLI trace audit, no physical isolation or zero-leakage guarantee is claimed.
- Optimizing text instructions is not updating model weights. No candidate from this run is merged because the selected text did not change.
- The upstream trainer's usage summary excludes the two post-training final-test evaluations; do not report that subtotal as the entire experiment's usage or price.
