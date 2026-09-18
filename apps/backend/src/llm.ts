import OpenAI from "openai";
import { config } from "./config.js";
import { buildSystemPrompt, TEMPERATURE_BY_DIFFICULTY, type BotTheme, type Difficulty } from "./difficulty.js";

const client = new OpenAI({ apiKey: config.openaiApiKey });

export async function getLlmMove(params: {
  fen: string;
  history: string[];
  legalMoves: string[];
  difficulty: Difficulty;
  theme: BotTheme;
}): Promise<{ move: string; banter: string }> {
  const { fen, history, legalMoves, difficulty, theme } = params;

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
      { role: "system", content: buildSystemPrompt(difficulty, theme) },
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
            analysis: {
              type: "string",
              description:
                "Brief analysis (2-4 sentences) of the position before deciding: material, threats, tactics, and why you're picking your move over the other candidates in the legal move list. Think it through here first.",
            },
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
          required: ["analysis", "move", "banter"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response had no content");
  }

  const parsed = JSON.parse(content) as { analysis: string; move: string; banter: string };
  return { move: parsed.move, banter: parsed.banter };
}
