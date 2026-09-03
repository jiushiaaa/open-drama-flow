# Completion and visual verification

Before reporting a visual task done:

1. Run `project.diagnostics`. There must be zero error-severity issues (black
   gaps, clip overlaps, missing media), or each remaining issue must be
   intentional and explained.
2. Run `project.snapshot` at the changed moments and actually inspect the
   rendered frames. For transitions, include the seam; for captions, choose a
   frame where text is visible; for grading/effects, compare representative
   moments.
3. Run `project.view` on the affected range so the user is left watching the
   result rather than hunting for it.

Report what changed in plain language and include the new duration. If
`project.edit` returns entries in `nonUndoable[]`, tell the user. Never claim
that something was checked unless it was rendered and inspected.
