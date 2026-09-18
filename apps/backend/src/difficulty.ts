export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Grandmaster"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const TEMPERATURE_BY_DIFFICULTY: Record<Difficulty, number> = {
  Beginner: 1.0,
  Intermediate: 0.8,
  Advanced: 0.5,
  Grandmaster: 0.2,
};

const PERSONA_BY_DIFFICULTY: Record<Difficulty, string> = {
  Beginner:
    "Play like a beginner chess player (around 800 Elo): favor simple, natural-looking moves, don't calculate deep tactics, and occasionally make a mistake a novice would make.",
  Intermediate:
    "Play like a casual club player (around 1400 Elo): sound opening principles and basic tactics, but you sometimes miss deeper combinations.",
  Advanced:
    "Play like a strong club player (around 2000 Elo): solid opening theory, accurate tactics, and sound strategic plans, but not flawless.",
  Grandmaster:
    "Play at grandmaster strength: find the objectively strongest move given deep calculation and precise evaluation.",
};

export function buildSystemPrompt(difficulty: Difficulty): string {
  return `You are playing a game of chess as Black against a human opponent playing White. ${PERSONA_BY_DIFFICULTY[difficulty]}`;
}
