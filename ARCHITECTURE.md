# Architecture

A human plays White in the browser. An OpenAI model plays Black. The backend's only job is to
carry a position to the model and a move back. It never runs a chess engine. These three diagrams
show where that rule actually lives, what happens on the wire for a single move, and how far a
cosmetic setting actually reaches.

## Where the rules live

`chess.js`, running in the browser, is the only piece of code in the whole system that knows what
a legal chess move is. The backend deliberately carries no chess library at all. It's a relay with
a prompt template, nothing more.

```mermaid
flowchart LR
    subgraph Browser
        UI["react-chessboard<br/>drag-and-drop UI, no rules"]
        CJS["chess.js<br/>legality · FEN · history · check/mate"]
        UI --> CJS
    end

    subgraph Backend["Backend (Fastify)"]
        Route["POST /api/move<br/>builds one prompt, forwards it"]
        NoLib["∅ no chess library<br/>never evaluates legality itself"]
        Route -.-> NoLib
    end

    subgraph OpenAI
        Model["gpt-4o-mini<br/>chat.completions, structured"]
        Move["move selection<br/>+ one line of banter"]
        Model --> Move
    end

    CJS <-->|"HTTP / JSON"| Route
    Route <-->|"OpenAI API"| Model
```

Everything left of the backend can veto a move. Everything right of it can't. That empty
`∅ no chess library` box is deliberate: it's what keeps the LLM fully responsible for move
generation, rather than a chess engine hiding server-side. Removing that constraint would mean
building a second, independent legality checker in the backend, and one more place for the two to
disagree.

## Anatomy of one move

What actually crosses the wire when White moves and Black replies, including the one change that
turned "the model can suggest anything" into "the model can only return a move that exists."

```mermaid
sequenceDiagram
    participant Browser
    participant Backend
    participant OpenAI

    Note over Browser: White drags e2 → e4<br/>chess.js validates it and applies it locally
    Browser->>Backend: POST /api/move<br/>{ fen, history, legalMoves, difficulty }
    Note over Backend: Builds the system prompt<br/>persona + temperature by difficulty (1.0 → 0.2)<br/>Beginner is talkative and loose, Grandmaster is terse
    Backend->>OpenAI: chat.completions.create<br/>response_format: json_schema<br/>move.enum = legalMoves
    OpenAI-->>Backend: { move, banter }
    Backend-->>Browser: { move, banter } (relayed unchanged)
    Note over Browser: chess.js.move(move)<br/>always succeeds now, board and banter update together
```

One HTTP round trip, one OpenAI call, per move. No polling, no retries once the enum landed.

**Why the enum, not free text.** This is the arrow that changed after a real bug: the model was
free-texting a move, occasionally an illegal one (it once returned `c3` when a White pawn already
stood on c3). Passing chess.js's own `legalMoves` list into OpenAI's structured-output schema as
an `enum` turned "please pick a legal move" from a request into a guarantee, without adding a
chess engine to the backend. The field literally cannot hold anything outside that list.

## One toggle, four places

A "Bot theme" switch (Default or Minecraft) sits next to the difficulty picker. It looks like a
skin swap, and three of the four things it touches are exactly that. The fourth reaches all the
way to OpenAI.

```mermaid
flowchart TD
    Theme["Bot theme<br/>Default ↔ Minecraft"]
    Theme --> Avatars["Avatar images<br/>difficulty selector + banter bubble<br/>frontend only"]
    Theme --> Board["Board squares<br/>Minecraft: log textures, pixelated<br/>Default: plain colors<br/>frontend only"]
    Theme --> Pieces["White piece art<br/>Villager-faction set<br/>Black: not reskinned yet<br/>frontend only"]
    Theme --> Prompt["LLM system prompt<br/>travels in the /api/move request body<br/>reaches OpenAI"]

    class Prompt reachesLLM
    classDef reachesLLM fill:#f1e1cc,stroke:#a8672c,color:#5c3a12
```

Easy to assume a "theme" is purely a skin. Three of these four boxes are. The fourth means picking
Minecraft actually changes what gets sent to `chat.completions.create`, not just what gets
rendered: the model roleplays the actual mob, so the Creeper's banter references exploding and the
Chicken's clucks nervously, instead of both sounding like the same generic chess opponent in a
costume. Difficulty is the other axis: theme and difficulty combine to pick both the avatar and
the exact prompt text.

---

Source: `apps/frontend/src/App.tsx`, `apps/backend/src/llm.ts`, `apps/backend/src/difficulty.ts`,
`apps/backend/src/index.ts`.
