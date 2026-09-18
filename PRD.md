# Chess vs LLM — Product Requirements Document

## Overview
A monorepo web app where a human plays chess against an OpenAI LLM. The LLM is fully responsible for move generation — no chess engine on the backend.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Package manager | pnpm | Content-addressable store, fast installs |
| Monorepo | pnpm workspaces | `apps/frontend` + `apps/backend` |
| Backend | Node.js + Fastify + TypeScript | REST API (free, MIT licensed) |
| Frontend | Vite + React + TypeScript | SPA |
| Styling | Tailwind CSS | Utility-first |
| LLM | OpenAI API (`openai` npm package) | Move generation, pay-per-token |

---

## Frontend

- Renders a chessboard (visual only — no move validation engine)
- Human plays as White
- On each human move, sends current board state + move history to the backend
- Applies the LLM's returned move to the board
- Modern, clean UI with Tailwind CSS
- Move history displayed in algebraic notation in a side panel
- **Difficulty dropdown** — player selects LLM persona before starting:
  - Beginner
  - Intermediate
  - Advanced
  - Grandmaster

---

## Out of Scope
- Move legality enforcement (LLM is trusted for valid moves)
- User accounts / persistence
- Multiplayer
- Mobile optimization (v1)
- Time limit per LLM move
