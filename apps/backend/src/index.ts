import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { BOT_THEMES, DIFFICULTIES, type BotTheme, type Difficulty } from "./difficulty.js";
import { getLlmMove } from "./llm.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => {
  return { ok: true };
});

app.post<{
  Body: { fen: string; history: string[]; legalMoves: string[]; difficulty: Difficulty; theme: BotTheme };
}>(
  "/api/move",
  {
    schema: {
      body: {
        type: "object",
        required: ["fen", "history", "legalMoves", "difficulty", "theme"],
        properties: {
          fen: { type: "string" },
          history: { type: "array", items: { type: "string" } },
          legalMoves: { type: "array", items: { type: "string" }, minItems: 1 },
          difficulty: { type: "string", enum: DIFFICULTIES },
          theme: { type: "string", enum: BOT_THEMES },
        },
      },
    },
  },
  async (request, reply) => {
    const { fen, history, legalMoves, difficulty, theme } = request.body;
    try {
      const { move, banter } = await getLlmMove({ fen, history, legalMoves, difficulty, theme });
      return { move, banter };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "Failed to get a move from the LLM" };
    }
  },
);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
