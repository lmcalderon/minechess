import OpenAI from "openai";
import { config } from "./config.js";
import { buildSystemPrompt, TEMPERATURE_BY_DIFFICULTY, type Difficulty } from "./difficulty.js";

const client = new OpenAI({ apiKey: config.openaiApiKey });

const MOVE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    move: {
      type: "string",
      description: "The next move in Standard Algebraic Notation (SAN), e.g. 'Nf3', 'e4', 'O-O'.",
    },
  },
  required: ["move"],
  additionalProperties: false,
} as const;

export async function getLlmMove(params: {
  fen: string;
  history: string[];
  difficulty: Difficulty;
}): Promise<string> {
  const { fen, history, difficulty } = params;

  const userMessage = [
    `Current position (FEN): ${fen}`,
    `Move history so far: ${history.length > 0 ? history.join(" ") : "(none, this is the first move)"}`,
    "What is your move?",
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
        schema: MOVE_RESPONSE_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response had no content");
  }

  const parsed = JSON.parse(content) as { move: string };
  return parsed.move;
}
