import OpenAI from "openai";
import { config } from "./config.js";
import { buildSystemPrompt, TEMPERATURE_BY_DIFFICULTY, type Difficulty } from "./difficulty.js";

const client = new OpenAI({ apiKey: config.openaiApiKey });

export async function getLlmMove(params: {
  fen: string;
  history: string[];
  legalMoves: string[];
  difficulty: Difficulty;
}): Promise<{ move: string; banter: string }> {
  const { fen, history, legalMoves, difficulty } = params;

  const userMessage = [
    `Current position (FEN): ${fen}`,
    `Move history so far: ${history.length > 0 ? history.join(" ") : "(none, this is the first move)"}`,
    `Legal moves (SAN): ${legalMoves.join(", ")}`,
    "Choose exactly one move from that legal move list.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: config.openaiModel,
    temperature: TEMPERATURE_BY_DIFFICULTY[difficulty],
    messages: [
      { role: "system", content: buildSystemPrompt(difficulty) },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chess_move",
        strict: true,
        schema: {
          type: "object",
          properties: {
            move: {
              type: "string",
              enum: legalMoves,
              description: "The chosen move in Standard Algebraic Notation (SAN), from the given legal move list.",
            },
            banter: {
              type: "string",
              description: "A short, in-character remark about the move or the game, matching your assigned personality.",
            },
          },
          required: ["move", "banter"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response had no content");
  }

  return JSON.parse(content) as { move: string; banter: string };
}
