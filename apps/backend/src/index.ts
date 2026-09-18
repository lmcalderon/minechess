import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { DIFFICULTIES, type Difficulty } from "./difficulty.js";
import { getLlmMove } from "./llm.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => {
  return { ok: true };
});

app.post<{ Body: { fen: string; history: string[]; difficulty: Difficulty } }>(
  "/api/move",
  {
    schema: {
      body: {
        type: "object",
        required: ["fen", "history", "difficulty"],
        properties: {
          fen: { type: "string" },
          history: { type: "array", items: { type: "string" } },
          difficulty: { type: "string", enum: DIFFICULTIES },
        },
      },
    },
  },
  async (request, reply) => {
    const { fen, history, difficulty } = request.body;
    try {
      const move = await getLlmMove({ fen, history, difficulty });
      return { move };
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
