# Kimi Setup

This Expo app now includes a reusable Kimi client in `lib/kimi.ts`.

## Official Kimi API settings

- Base URL: `https://api.moonshot.ai/v1`
- Recommended default model: `kimi-k2.5`
- Auth: `Authorization: Bearer <MOONSHOT_API_KEY>`

These settings match Moonshot's current Kimi API docs:
- https://platform.moonshot.ai/docs/overview
- https://platform.moonshot.ai/docs/guide/kimi-k2-5-quickstart

## Important security note

Do not ship your `MOONSHOT_API_KEY` inside the Expo client bundle.

In Expo, `EXPO_PUBLIC_*` variables are readable by the app at runtime, which makes them unsuitable for production secrets. The safe path is:

1. Keep the Moonshot API key on your backend or serverless function.
2. Expose a small proxy endpoint from your backend.
3. Set `EXPO_PUBLIC_KIMI_PROXY_URL` in the Expo app.
4. Call `requestKimiViaProxy(...)` from the client.

## Local env scaffold

Copy `.env.example` to `.env` and fill in the public, non-secret values you need.

Example:

```env
EXPO_PUBLIC_KIMI_BASE_URL=https://api.moonshot.ai/v1
EXPO_PUBLIC_KIMI_MODEL=kimi-k2.5
EXPO_PUBLIC_KIMI_PROXY_URL=https://your-domain.example/api/kimi/chat
```

## Usage

Secure proxy usage from the app:

```ts
import { extractKimiText, requestKimiViaProxy } from '@/lib/kimi';

const response = await requestKimiViaProxy([
  { role: 'system', content: 'You are a helpful shopping assistant.' },
  { role: 'user', content: 'Write a short Arabic caption for a red dress.' },
]);

const text = extractKimiText(response);
```

Direct usage is supported only for trusted environments where you inject `apiKey` securely at runtime:

```ts
import { extractKimiText, requestKimiChatCompletion } from '@/lib/kimi';

const response = await requestKimiChatCompletion({
  apiKey: process.env.MOONSHOT_API_KEY,
  messages: [{ role: 'user', content: 'Hello from Taqmish.' }],
});

const text = extractKimiText(response);
```
