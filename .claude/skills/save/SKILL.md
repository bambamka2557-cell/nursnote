---
name: save
description: |
  Write a compact session handoff to spec.md so /continue can resume without
  re-reading the transcript. Use before a likely context/usage limit, at the end
  of a work chunk, or when the user says /save, "save progress", "เซฟงาน", or
  "checkpoint".
---

# /save — Session Handoff Writer

Capture just enough state that a fresh session — which remembers nothing — can
pick the work back up by reading ONE small file instead of the whole transcript.
Optimize for the next session's token budget: complete but lean.

## Steps

1. Ground the state in reality first — do not write from memory alone:
   - `git status -sb` and `git log --oneline -8`
   - `TaskList` (if the session used a task list)
2. Write / overwrite `spec.md` at the project root with exactly these sections,
   kept SHORT (aim under one page — brevity is the entire point):

   ```
   # <project> — Handoff (updated <absolute date + time>)

   ## Goal
   One or two lines: what this stretch of work is trying to achieve.

   ## Done
   - What is finished AND verified this session (say "verified how": build/test/
     live-check). Don't list unverified work here.

   ## Next
   - Immediate next steps, most important first. Concrete enough to act on
     without re-asking: file paths, function names, exact commands.

   ## Key files & decisions
   - path — why it matters / what was decided. Include decisions the code does
     not show (why X over Y), with absolute dates.

   ## Git
   - branch · last commit hash+subject · pushed? · any uncommitted files.

   ## Open / blocked
   - Anything waiting on the user, external state, or still unverified.
   ```

3. Leave the task list intact (do not delete) — /continue reads it too.
4. Report the path written and a 3-line summary. Do NOT commit spec.md unless the
   user asks — it is a working scratch file, not a deliverable.

## Rules
- Lean, not lossy: drop narration and dead ends; keep decisions, paths, next steps.
- Absolute dates only, never "yesterday" / "just now".
- If something is unverified, put it under "Open / blocked" — never imply done.
- One file, one purpose. Don't copy content into MEMORY.md; link with [[name]] if needed.
