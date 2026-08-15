import { JUDGMENT_STARTERS } from '@/src/constants/fearedFantasy';
import { callSparkAi, isSparkAiConfigured } from '@/src/services/sparkAi';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function parseJudgmentsPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const judgments = (payload as { judgments?: unknown }).judgments;
  if (!Array.isArray(judgments)) return [];

  return judgments
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, 5);
}

export function getLocalJudgmentSuggestions(action: string, count = 3): string[] {
  const normalizedAction = action.trim().toLowerCase();
  const pool = [...JUDGMENT_STARTERS];

  if (normalizedAction.includes('speak') || normalizedAction.includes('talk')) {
    pool.unshift('Your voice sounds shaky', 'Nobody cares what you have to say');
  }
  if (normalizedAction.includes('ask') || normalizedAction.includes('date')) {
    pool.unshift('They will reject you publicly', 'You look desperate');
  }

  return shuffle([...new Set(pool)]).slice(0, count);
}

export async function suggestFearedJudgments(action: string): Promise<string[]> {
  const trimmedAction = action.trim();
  if (!trimmedAction) return [];

  if (!isSparkAiConfigured()) {
    return getLocalJudgmentSuggestions(trimmedAction);
  }

  try {
    const payload = await callSparkAi(
      `You help people practice the Feared Fantasy exercise from social-confidence coaching.
Return JSON only: { "judgments": string[] } with 3-4 items.
Each judgment must be a specific negative thought someone might think or say — short, blunt, in second person or as overheard criticism.
Avoid vague words like "judgment" or "criticism". Examples: "That was awkward", "You're trying too hard".`,
      `Feared action: "${trimmedAction}"`
    );

    const judgments = parseJudgmentsPayload(payload);
    if (judgments.length > 0) return judgments;
  } catch {
    // Fall back to local suggestions when AI fails.
  }

  return getLocalJudgmentSuggestions(trimmedAction);
}
