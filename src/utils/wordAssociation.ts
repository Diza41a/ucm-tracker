import { WORD_ASSOCIATION_SEEDS } from '@/src/constants/wordAssociationWords';

export function normalizeAssociationWord(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function pickSeedWord(recent: string[] = []): string {
  const recentSet = new Set(recent.map((word) => word.toLowerCase()));
  const available = WORD_ASSOCIATION_SEEDS.filter((word) => !recentSet.has(word));

  if (available.length === 0) {
    return WORD_ASSOCIATION_SEEDS[Math.floor(Math.random() * WORD_ASSOCIATION_SEEDS.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

export function formatAssociationChain(chain: string[]): string {
  return chain.join(' → ');
}
