# Production stages, decisions and knowledge

Use for the five video production types: `drama`, `advertising`, `explainer`, `music-video`, `motion`. Standalone images and bounded local postproduction do not need an invented end-to-end video workflow. No mandatory network-research stage is added.

## Control and persistence

1. Read current state, scoped approved context and `drama_get_next_actions`. Select the matching `drama_select_production_workflow` contract. Its `stageContracts` contain exact stage IDs, required input/output names, tool suggestions, acceptance criteria and recovery instructions. The legacy `stages` labels are only display text.
2. Read `drama_get_production_progress` for the exact project, creation and type. Resume at its first incomplete stage, subject to existing execution gates. Do not change workflow type to hide unfinished work. When a requested type change is material, record the decision and preserve the previous history.
3. Produce each stage's local Markdown/JSON report or manifest. Reuse real files and accepted media; do not copy full media into reports or create sample content just to satisfy a stage. Record exact asset IDs/versions, source paths/hashes, task IDs and time ranges where applicable. Existing approved work can be documented retrospectively after rechecking it, without regeneration or fabricated historical approvals.
4. Record a checkpoint using the current `planRevision`, stable `requestKey`, declared artifact names, absolute paths and SHA-256 hashes. Supply each returned acceptance criterion ID with an observation and `evidenceNames` referencing submitted artifacts. All criteria must pass for `complete`; when blocked, record `blocked`, the observed issue and a concrete `resumeNote`. A justified optional operation can be absent, but its report must explain why; never manufacture an unnecessary model call.
5. Re-read progress after changes. Checkpoints are append-only. An earlier replacement invalidates dependent checkpoints; changed files or plan revisions require rechecking/re-recording evidence. Reuse unchanged accepted outputs and original provider task IDs. A new `requestKey` records a new observation; repeating a key with changed content is rejected.

Stage evidence is **Agent-reported**, not independent semantic verification. Hash validation proves the report file is current, not that the described media was watched. This layer never approves an image, activates memory, increases a budget, changes execution mode, starts generation or finalizes delivery. Actual production still uses the existing tools and gates in [workflow-contract.md](workflow-contract.md).

## Stage direction

Read only the phase relevant to the selected stage, together with its routed specialist Skill.

### intent

Distill the user's objective, source boundaries, delivery specification and constraints. Distinguish provided facts, approved settings and unresolved choices. For adaptations, retain chapter/source ranges. Use existing information; this phase does not require online research. Record limits already authorized, not a new inferred spending allowance.

### design

Translate intent into a concrete visual or narrative treatment. Explain how the selected style, hierarchy, references or spatial plan serves this production. Preserve accepted masters. For optional whitebox work, decide whether spatial uncertainty justifies it; a documented omission is valid.

### plan

Map content to ordered shots or timeline events, including action, camera, duration, dialogue/audio/subtitles, reference roles and what must remain unchanged. Check live adapter limits before planning generation. Persist actual brief/shots with `drama_update_plan`; a stage report is not a replacement for the production plan.

### assets

Locate existing accepted material first. When generation is needed, use the existing frozen request/call-limit flow. Codex built-in image generation remains primary, with the existing image-admission boundary. Record actual candidate/accepted status, source versions and provider IDs. Poll the original ID after uncertain submission; a missing download is not permission to generate again.

### edit

Build a version-bound timeline with exact source intervals, retained content, transitions and explicit sound/subtitle intent. Run deterministic local tools where applicable. Preserve originals and use a new output location for repairs. A successful render is a technical result, not proof of quality.

### review

Actually inspect applicable visuals, full-speed movement, identity, continuity, dialogue, sound and subtitles. Link observations to timestamps and exact output versions. Missing playback/listening capability remains an unresolved check, not a pass. Record affected intervals and fixes; do not automatically waive serious issues after a fixed number of retries.

### delivery

Use existing rendering, quality-evidence, review and finalization tools. Bind the report to their real output and SHA-256 delivery record. A checkpoint cannot declare a candidate delivered. Local delivery does not authorize uploading or publishing.

## Decision log

Use `drama_record_production_decision` for meaningful choices: a treatment, reference, provider, edit repair, recovery strategy or cost tradeoff. Do not log every trivial tool action.

- Supply `type`, `stageId`, current `planRevision`, unique `requestKey`, `category`, `subject`, considered `options`, `selected` and `reason`.
- Each option has an `id`, `description` and `reason`; every unselected option also needs `rejectedBecause`. One option is valid when there was genuinely no alternative—do not invent comparisons or numeric confidence. Optional confidence is the Agent's assessment, not measured model reliability.
- `costImpact.status` is `unknown`, `estimate` or `no-additional-provider-call`, always with a `basis`. Only `estimate` has `amountDelta` and ISO `currency`; negative estimates can describe savings. Unknown is not zero; local compute and host costs are not implied free. The tool separately freezes the existing ledger summary, without combining estimated and billed amounts.
- Hash-bound local `evidence` is optional. Use `supersedes` for a correction; the original remains. Records are scoped to the creation and are **not user approval or approved memory**. Execute any selected action through its own authorized tool.
- Never include credentials in notes, options, evidence or cost sources.

## Three knowledge layers

1. **Capability:** `drama_list_tool_capabilities`, live provider capabilities and `drama_select_production_workflow` describe what exists and its actual constraints. Code validates parameters, state, versions, budgets and permissions.
2. **Production:** this director contract, the total-producer contracts and routed specialist Skills guide creative decisions and review. Codex is the orchestrator; neither manifests nor checkpoints run a second autonomous planner.
3. **Technical:** read the selected tool's `knowledgeRefs` through `drama_read_production_knowledge`. References return their content hash; load only what the current task needs, not every Skill or manual. These are implementation knowledge, not new capabilities or authority to rewrite Skills.

The same file can serve multiple tools; no duplicate knowledge pack is required. Instructions are not automatically promoted into project memory. Current user scope and live adapter limits take precedence over examples in technical references.
