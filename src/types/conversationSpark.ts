export type ConversationSparkSource = 'ai' | 'local';

export interface ConversationSparkScenario {
  id: string;
  setting: string;
  context: string;
  theirLine: string;
  yourGoal: string;
  seedWord: string;
  source: ConversationSparkSource;
}

export interface ConversationSparkCompletion {
  prompts: string[];
  bridgeSuggestion: string;
  source: ConversationSparkSource;
}

export interface SparkScenarioResponse {
  setting: string;
  context: string;
  theirLine: string;
  yourGoal: string;
  seedWord: string;
}

export interface SparkCompletionResponse {
  prompts: string[];
  bridgeSuggestion: string;
}
