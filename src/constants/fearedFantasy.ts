export type ResponseMethod = 'curiosity' | 'challenge' | 'acceptance';

export interface ResponseMethodConfig {
  id: ResponseMethod;
  label: string;
  shortLabel: string;
  example: string;
  hint: string;
  icon: 'help-circle-outline' | 'shield-outline' | 'heart-outline';
}

export const RESPONSE_METHODS: ResponseMethodConfig[] = [
  {
    id: 'curiosity',
    label: 'Curiosity',
    shortLabel: 'Ask',
    example: 'What do you mean by that?',
    hint: 'Stay open — invite them to explain instead of defending.',
    icon: 'help-circle-outline',
  },
  {
    id: 'challenge',
    label: 'Challenge',
    shortLabel: 'Push back',
    example: "I don't think that's true.",
    hint: "Dispute the judgment calmly — you don't have to accept it.",
    icon: 'shield-outline',
  },
  {
    id: 'acceptance',
    label: 'Acceptance',
    shortLabel: 'Own it',
    example: "You're right, I didn't prepare as much as I wanted to.",
    hint: "Agree with the grain of truth — perfection isn't required.",
    icon: 'heart-outline',
  },
];

export const JUDGMENT_STARTERS = [
  'That was awkward',
  "You're trying too hard",
  'Who do you think you are?',
  'That was pathetic',
  "They think you're weird",
  "You don't belong here",
  'That was a mistake',
  "You're not good enough",
  'Everyone is judging you',
  "They can tell you're nervous",
] as const;

export const MIN_JUDGMENTS = 1;
export const MAX_JUDGMENTS = 5;

export function getResponseMethodConfig(method: ResponseMethod): ResponseMethodConfig {
  const config = RESPONSE_METHODS.find((entry) => entry.id === method);
  if (!config) throw new Error(`Unknown response method: ${method}`);
  return config;
}
