/**
 * Sully M1 via the OpenAI-compatible Chat Completions endpoint (docs.sully.ai/sully-m1).
 * Server only. Never log the request or response body: both contain note text.
 */
export class M1Error extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`M1 ${status} ${code}`);
  }
}

export type M1Usage = { prompt_tokens?: number; completion_tokens?: number };

export async function m1Json(
  system: string,
  user: string,
  maxTokens = 3000,
  timeoutMs = 35_000,
): Promise<{ content: string; usage?: M1Usage }> {
  const accountId = process.env.SULLY_ACCOUNT_ID;
  const apiKey = process.env.SULLY_API_KEY;
  if (!accountId || !apiKey) throw new M1Error(500, "missing_keys");
  const base = process.env.SULLY_API_BASE_URL || "https://api.sully.ai";

  const res = await fetch(`${base}/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      model: "sully-m1",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      // Reasoning tokens count toward the limit; with reasoning on, M1 can spend the whole
      // budget thinking and return an empty answer.
      reasoning_effort: "none",
      max_completion_tokens: maxTokens,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: { code?: string } };
      code = body?.error?.code || code;
    } catch {
      // ignore
    }
    throw new M1Error(res.status, code);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: M1Usage };
  return { content: body?.choices?.[0]?.message?.content ?? "", usage: body?.usage };
}
