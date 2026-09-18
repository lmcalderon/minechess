# LLM Chess

A human plays White against an OpenAI model playing Black. The model is fully responsible for
move generation. The backend never runs a chess engine of its own; the only chess-legality logic
in the whole system is [chess.js](https://github.com/jhlywa/chess.js) running in the browser.

Full spec in [PRD.md](./PRD.md).

## Stack

- pnpm workspaces monorepo: `apps/frontend`, `apps/backend`
- Backend: Fastify + TypeScript, `openai` npm package
- Frontend: Vite + React + TypeScript, Tailwind CSS, chess.js, react-chessboard

## Setup

Requires Node 20+ and pnpm (`npm install -g pnpm` if you don't have it).

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
```

Add your key to `apps/backend/.env`:

```
OPENAI_API_KEY=sk-...
```

Then, in two terminals:

```bash
pnpm dev:backend    # http://localhost:3000
pnpm dev:frontend   # http://localhost:5173
```

Open http://localhost:5173 and play.

## How it works

The frontend tracks the game with chess.js: it validates every White move, keeps the FEN and
move history, and detects check/checkmate/draws. After each White move it sends the current
position, move history, difficulty, and the full list of legal replies to `POST /api/move`.

The backend builds a system prompt from the chosen difficulty (Beginner through Grandmaster,
each with its own persona and sampling temperature) and calls OpenAI with a structured-output
schema. The `move` field is constrained to an `enum` of exactly the legal moves the frontend
sent over, so the response is guaranteed playable without the backend ever evaluating chess
rules itself. Each reply also includes a short line of in-character banter.

## Out of scope

Per the PRD: move legality enforcement for the LLM, user accounts, persistence, multiplayer,
mobile layout, and per-move time limits.
