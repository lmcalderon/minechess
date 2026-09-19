# Project instructions

## Writing style

Before finalizing any new prose meant for a human reader (README, ARCHITECTURE.md, code comments,
UI copy, published artifacts), **actually invoke the `humanizer` skill** (`.claude/skills/humanizer`)
on it, rather than self-checking from memory for the handful of patterns you remember (em dashes,
"isn't X, it's Y"). Memory-based self-checking has repeatedly missed real issues in this project
(punchy ad-copy fragments, among others) that the skill's full checklist would have caught.

This does not apply to backend prompt strings meant for the LLM (e.g. `apps/backend/src/difficulty.ts`)
or to `PRD.md` (the user's own original document); it applies only to text a human is meant to read.
