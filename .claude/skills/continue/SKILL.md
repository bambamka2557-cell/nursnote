---
name: continue
description: |
  Resume interrupted work from spec.md WITHOUT re-reading the full transcript, to
  save context/tokens after a limit or in a new session. Use when the user says
  /continue, "ทำต่อ", "ดำเนินการต่อ", "continue where we left off", or otherwise
  resumes a prior task.
---

# /continue — Resume From Handoff

Pick work back up using a small curated handoff instead of the whole history. A
fresh session remembers nothing; read the minimum that lets you act correctly.

## Read only these — do NOT open the transcript

1. `spec.md` at the project root (the handoff written by /save). If it is missing,
   say so and offer to reconstruct from git + task list instead of proceeding blind.
2. `TaskList` — the persistent task list, if any.
3. Ground-truth the handoff against reality:
   - `git status -sb` and `git log --oneline -8`
   The handoff can be STALE — written before the last few actions. Where spec.md
   and git disagree, TRUST GIT and flag the mismatch; never act on the doc blindly.
4. Open only the specific files named under "Next" / "Key files" — not the tree.

## Then

- State in 3-5 lines: where things stand and the single next action you will take.
- Resume that step. Follow the project's own rules (AGENTS.md / CLAUDE.md):
  verify before claiming done, stay in scope, announce R0/R1 before doing them.
- When you finish a chunk — or sense a limit approaching — run /save to refresh the
  handoff so the resume loop stays cheap.

## Rules
- Never re-read the full conversation transcript to rebuild context — avoiding
  exactly that cost is why this skill exists.
- If spec.md is older than the latest commit, treat git + task list as the truth.
- Don't redo work already marked Done+verified unless git shows it is actually missing.
