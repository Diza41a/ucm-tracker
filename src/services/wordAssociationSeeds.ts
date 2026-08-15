import { callSparkAi, isSparkAiConfigured } from '@/src/services/sparkAi';
import { pickSeedWord } from '@/src/utils/wordAssociation';

function normalizeSeedWord(value: string): string {
  const word = value.trim().toLowerCase().split(/\s+/)[0] ?? '';
  return word.replace(/[^a-z'-]/g, '');
}

function parseAiSeed(raw: unknown, recent: string[]): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as { seedWord?: unknown; words?: unknown };

  const candidates: string[] = [];
  if (typeof data.seedWord === 'string') {
    candidates.push(data.seedWord);
  }
  if (Array.isArray(data.words)) {
    for (const item of data.words) {
      if (typeof item === 'string') candidates.push(item);
    }
  }

  const recentSet = new Set(recent.map((word) => word.toLowerCase()));
  for (const candidate of candidates) {
    const normalized = normalizeSeedWord(candidate);
    if (normalized && !recentSet.has(normalized)) {
      return normalized;
    }
  }

  return null;
}

async function generateAiSeedWord(recent: string[] = []): Promise<string | null> {
  const avoid =
    recent.length > 0
      ? `Avoid these recent words: ${recent.slice(0, 12).join(', ')}.`
      : 'Pick something fresh.';

  const raw = await callSparkAi(
    `You pick single-word prompts for conversation word-association practice.
Return JSON only: { "seedWord": "..." }
Rules:
- exactly one common lowercase English noun (or short gerund like "running")
- easy to link to in small talk (places, feelings, hobbies, food, social life, daily life)
- not obscure, not offensive, not a proper noun
${avoid}`,
    'Generate one association seed word.'
  );

  return parseAiSeed(raw, recent);
}

/** AI seed when configured, otherwise a random word from the built-in pool. */
export async function resolveSeedWord(recent: string[] = []): Promise<string> {
  if (isSparkAiConfigured()) {
    try {
      const aiSeed = await generateAiSeedWord(recent);
      if (aiSeed) return aiSeed;
    } catch {
      // fall through to local pool
    }
  }

  return pickSeedWord(recent);
}

/** Fetch a batch of AI seeds to grow the local rotation (best-effort). */
export async function generateAiSeedWordBatch(
  count: number,
  recent: string[] = []
): Promise<string[]> {
  if (!isSparkAiConfigured()) return [];

  try {
    const raw = await callSparkAi(
      `You pick word-association seed words for conversation practice.
Return JSON only: { "words": ["...", "..."] }
Each word: one common lowercase English noun, conversation-friendly, distinct from each other.
No proper nouns, nothing offensive or obscure.`,
      `Generate ${count} different seed words. ${recent.length ? `Avoid: ${recent.join(', ')}` : ''}`
    );

    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { words?: unknown }).words)) {
      return [];
    }

    const recentSet = new Set(recent.map((word) => word.toLowerCase()));
    const seen = new Set<string>();
    const words: string[] = [];

    for (const item of (raw as { words: unknown[] }).words) {
      if (typeof item !== 'string') continue;
      const normalized = normalizeSeedWord(item);
      if (!normalized || recentSet.has(normalized) || seen.has(normalized)) continue;
      seen.add(normalized);
      words.push(normalized);
    }

    return words;
  } catch {
    return [];
  }
}
