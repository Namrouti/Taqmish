const DEFAULT_KIMI_BASE_URL = 'https://api.moonshot.ai/v1';
const DEFAULT_KIMI_MODEL = 'kimi-k2.5';

export type KimiRole = 'system' | 'user' | 'assistant';

export type KimiMessage = {
  role: KimiRole;
  content: string;
};

export type KimiRequestOptions = {
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  messages: KimiMessage[];
  model?: string;
  temperature?: number;
};

type KimiChoice = {
  index: number;
  message?: {
    role?: KimiRole;
    content?: string;
  };
};

type KimiCompletionResponse = {
  choices?: KimiChoice[];
  error?: {
    message?: string;
  };
};

export function getKimiConfig() {
  return {
    baseUrl: process.env.EXPO_PUBLIC_KIMI_BASE_URL ?? DEFAULT_KIMI_BASE_URL,
    model: process.env.EXPO_PUBLIC_KIMI_MODEL ?? DEFAULT_KIMI_MODEL,
    proxyUrl: process.env.EXPO_PUBLIC_KIMI_PROXY_URL ?? null,
  };
}

function getKimiEndpoint(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as KimiCompletionResponse;
    return payload.error?.message ?? `Kimi request failed with status ${response.status}.`;
  } catch {
    return `Kimi request failed with status ${response.status}.`;
  }
}

export async function requestKimiChatCompletion({
  apiKey,
  baseUrl = getKimiConfig().baseUrl,
  maxTokens,
  messages,
  model = getKimiConfig().model,
  temperature,
}: KimiRequestOptions) {
  if (!apiKey?.trim()) {
    throw new Error(
      'Missing Moonshot API key. Pass apiKey from a secure backend or call Kimi through a proxy URL.'
    );
  }

  const response = await fetch(getKimiEndpoint(baseUrl), {
    body: JSON.stringify({
      max_tokens: maxTokens,
      messages,
      model,
      temperature,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as KimiCompletionResponse;
}

export async function requestKimiViaProxy(
  messages: KimiMessage[],
  options?: {
    maxTokens?: number;
    model?: string;
    proxyUrl?: string;
    temperature?: number;
  }
) {
  const config = getKimiConfig();
  const proxyUrl = options?.proxyUrl ?? config.proxyUrl;

  if (!proxyUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_KIMI_PROXY_URL. Point it to your backend endpoint that securely calls Moonshot.'
    );
  }

  const response = await fetch(proxyUrl, {
    body: JSON.stringify({
      maxTokens: options?.maxTokens,
      messages,
      model: options?.model ?? config.model,
      temperature: options?.temperature,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as KimiCompletionResponse;
}

export function extractKimiText(response: KimiCompletionResponse) {
  return response.choices?.[0]?.message?.content?.trim() ?? '';
}
