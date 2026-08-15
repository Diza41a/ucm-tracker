/** Shared OpenAI-compatible client for practice minigames. */
const SPARK_AI_API_KEY = process.env.EXPO_PUBLIC_SPARK_AI_API_KEY?.trim() ?? '';

export const SPARK_AI_BASE_URL =
  process.env.EXPO_PUBLIC_SPARK_AI_BASE_URL?.trim() || 'https://api.openai.com/v1';

export const SPARK_AI_MODEL =
  process.env.EXPO_PUBLIC_SPARK_AI_MODEL?.trim() || 'gpt-4o-mini';

export function isSparkAiConfigured(): boolean {
  return SPARK_AI_API_KEY.length > 0;
}

export function parseSparkJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate);
}

export async function callSparkAi(systemPrompt: string, userPrompt: string): Promise<unknown> {
  if (!isSparkAiConfigured()) {
    throw new Error('Spark AI is not configured');
  }

  const response = await fetch(`${SPARK_AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SPARK_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: SPARK_AI_MODEL,
      temperature: 0.9,
      max_tokens: 650,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Spark AI request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Spark AI returned an empty response');
  return parseSparkJsonObject(content);
}
