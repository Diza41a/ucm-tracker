import type {
  ConversationSparkCompletion,
  ConversationSparkScenario,
  SparkCompletionResponse,
  SparkScenarioResponse,
} from '@/src/types/conversationSpark';
import { pickSeedWord } from '@/src/utils/wordAssociation';

import { callSparkAi, isSparkAiConfigured } from './sparkAi';

export { isSparkAiConfigured } from './sparkAi';

const LOCAL_SCENARIOS: Omit<SparkScenarioResponse, 'seedWord'>[] = [
  {
    setting: 'Neighborhood coffee shop, Saturday morning',
    context: 'A stranger in line comments on the busy rush.',
    theirLine: 'Every time I come here the line is insane — do you come often?',
    yourGoal: 'Turn queue small talk into something personal without oversharing.',
  },
  {
    setting: 'Office kitchen, mid-afternoon',
    context: 'A coworker from another team is making tea beside you.',
    theirLine: 'Long day — feels like this week is never going to end.',
    yourGoal: 'Acknowledge their mood and open a real exchange, not just commiseration.',
  },
  {
    setting: 'Dog park bench, early evening',
    context: 'Another owner sits down while your dogs play.',
    theirLine: 'Yours has so much energy — how old are they?',
    yourGoal: 'Move from pet talk to something you could remember about them next time.',
  },
  {
    setting: 'Bookstore aisle, quiet weekday',
    context: 'Someone picks up the book you were browsing.',
    theirLine: 'Have you read anything else by this author?',
    yourGoal: 'Share an honest take and invite their perspective without lecturing.',
  },
  {
    setting: 'Grocery store checkout line',
    context: 'The person behind you notices something in your cart.',
    theirLine: 'Oh, I have been wanting to try that — is it any good?',
    yourGoal: 'Give a quick useful answer, then steer toward a natural follow-up question.',
  },
  {
    setting: 'Gym stretching area after a class',
    context: 'Someone who was in the same class catches your eye.',
    theirLine: 'That last set was brutal — do you do this class often?',
    yourGoal: 'Bond over the shared experience and learn one thing about them.',
  },
  {
    setting: 'Bus stop, light rain',
    context: 'A stranger comments on the weather while you wait.',
    theirLine: 'Of course it starts raining right when I forgot my umbrella.',
    yourGoal: 'Use the moment to be lightly humorous and see if they engage.',
  },
  {
    setting: 'House party kitchen, crowded',
    context: 'You end up beside someone you have not met yet, both reaching for drinks.',
    theirLine: 'Do you know whose place this is? I think I came with the wrong group.',
    yourGoal: 'Help them feel at ease and find common ground with the host or guests.',
  },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSeedWord(value: string): string {
  const word = value.trim().toLowerCase().split(/\s+/)[0] ?? '';
  return word.replace(/[^a-z'-]/g, '');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseScenarioResponse(raw: unknown): SparkScenarioResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<SparkScenarioResponse>;
  if (
    !isNonEmptyString(data.setting) ||
    !isNonEmptyString(data.context) ||
    !isNonEmptyString(data.theirLine) ||
    !isNonEmptyString(data.yourGoal) ||
    !isNonEmptyString(data.seedWord)
  ) {
    return null;
  }

  const seedWord = normalizeSeedWord(data.seedWord);
  if (!seedWord) return null;

  return {
    setting: data.setting.trim(),
    context: data.context.trim(),
    theirLine: data.theirLine.trim(),
    yourGoal: data.yourGoal.trim(),
    seedWord,
  };
}

function parseCompletionResponse(raw: unknown): SparkCompletionResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<SparkCompletionResponse>;
  if (!isNonEmptyString(data.bridgeSuggestion) || !Array.isArray(data.prompts)) return null;

  const prompts = data.prompts
    .filter((item): item is string => isNonEmptyString(item))
    .map((item) => item.trim())
    .slice(0, 4);

  if (prompts.length === 0) return null;

  return {
    bridgeSuggestion: data.bridgeSuggestion.trim(),
    prompts,
  };
}

function buildLocalScenario(recentSeeds: string[] = []): ConversationSparkScenario {
  const template = pickRandom(LOCAL_SCENARIOS);

  return {
    id: createId(),
    ...template,
    seedWord: pickSeedWord(recentSeeds),
    source: 'local',
  };
}

export async function generateSparkScenario(
  recentSeeds: string[] = []
): Promise<ConversationSparkScenario> {
  if (!isSparkAiConfigured()) {
    return buildLocalScenario(recentSeeds);
  }

  try {
    const raw = await callSparkAi(
      `You create realistic social practice scenarios for conversation-skills training.
Return JSON only with keys: setting, context, theirLine, yourGoal, seedWord.
- setting: where this happens (one short phrase)
- context: who is involved and what is going on (1 sentence)
- theirLine: a natural line they say to start small talk (1 sentence)
- yourGoal: what the trainee should practice (1 sentence)
- seedWord: one common lowercase noun to start a word-association chain, related to the scene
Keep scenarios everyday, plausible, and varied. Avoid corporate jargon.`,
      'Generate one fresh conversation spark scenario.'
    );

    const parsed = parseScenarioResponse(raw);
    if (!parsed) throw new Error('Invalid AI scenario shape');

    return {
      id: createId(),
      ...parsed,
      source: 'ai',
    };
  } catch {
    return buildLocalScenario(recentSeeds);
  }
}

function buildLocalCompletion(
  scenario: ConversationSparkScenario,
  chain: string[]
): ConversationSparkCompletion {
  if (chain.length < 2) {
    return {
      prompts: [
        `Picture ${scenario.setting.toLowerCase()}. They say: "${scenario.theirLine}" — respond with one calm sentence before you pivot.`,
      ],
      bridgeSuggestion: scenario.yourGoal,
      source: 'local',
    };
  }

  const first = chain[0];
  const last = chain[chain.length - 1];
  const pivot = chain[Math.floor(chain.length / 2)];

  return {
    bridgeSuggestion: `From "${first}" to "${last}", aim for a transition that fits: ${scenario.context.toLowerCase()}`,
    prompts: [
      `Setting: ${scenario.setting}. After they say "${scenario.theirLine}", answer briefly, then bridge through "${first}" toward "${pivot}".`,
      `Practice one follow-up question that uses "${last}" while staying aligned with your goal: ${scenario.yourGoal.toLowerCase()}`,
      `Say the whole path out loud — ${chain.join(' → ')} — as if you are still in the scene, not explaining the exercise.`,
    ],
    source: 'local',
  };
}

export async function generateSparkCompletion(
  scenario: ConversationSparkScenario,
  chain: string[]
): Promise<ConversationSparkCompletion> {
  if (!isSparkAiConfigured()) {
    return buildLocalCompletion(scenario, chain);
  }

  try {
    const raw = await callSparkAi(
      `You coach someone practicing real-world conversation transitions.
Return JSON only with keys: bridgeSuggestion, prompts.
- bridgeSuggestion: one sentence describing a natural conversational bridge in this scene
- prompts: array of 3 short instructions for speaking out loud (each references the scene and word chain)
Keep prompts actionable and specific to the situation.`,
      JSON.stringify({
        scenario: {
          setting: scenario.setting,
          context: scenario.context,
          theirLine: scenario.theirLine,
          yourGoal: scenario.yourGoal,
        },
        wordChain: chain,
      })
    );

    const parsed = parseCompletionResponse(raw);
    if (!parsed) throw new Error('Invalid AI completion shape');

    return {
      ...parsed,
      source: 'ai',
    };
  } catch {
    return buildLocalCompletion(scenario, chain);
  }
}
