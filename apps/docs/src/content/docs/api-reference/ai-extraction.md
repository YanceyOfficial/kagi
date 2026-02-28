---
title: AI Extraction
description: Use AI to generate ready-to-paste .env snippets from natural language.
---

The AI extraction endpoint lets you describe a project in natural language and get a ready-to-paste `.env` file containing the secrets from your Kagi vault that the project needs.

## Privacy model

The AI **never sees your secret values**. Only key names and project names are sent to the model. Secret values are fetched and decrypted server-side after the AI selects which entries to include.

```
Your prompt → AI → [entry IDs] → server decrypts → .env file
```

The AI cannot access values it was not explicitly asked about, and the server validates all AI-selected entry IDs against your actual data (preventing injection attacks).

---

## Extract secrets

```http
POST /api/ai/extract
Content-Type: application/json
```

**Required scope:** `ai:extract`

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | yes | Natural language description of your project |

```json
{
  "prompt": "I'm building a Next.js blog that uses OpenAI for content generation and sends emails via Resend. It stores data in a Neon PostgreSQL database."
}
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8

# OpenAI API — Blog Project (production)
OPENAI_API_KEY=sk-abc123...

# Resend — Blog Notifications (production)
RESEND_API_KEY=re_...

# Neon — Blog DB (production)
DATABASE_URL=postgresql://...
```

The response is a plain-text `.env`-formatted file containing only the entries the AI determined are relevant to your project description.

### How it works

1. The server fetches all your entry metadata (names, category names — no values).
2. The prompt + entry metadata is sent to the AI model (GPT-4o-mini).
3. The AI returns a list of entry IDs that match the project description.
4. The server validates the returned IDs against your actual entries.
5. Matching entries are decrypted server-side.
6. The `.env` file is assembled and returned.

### Tips for better results

- Be specific about the services and libraries your project uses.
- Mention the environment (e.g., "production deployment" vs "local dev").
- If results are incomplete, list the services explicitly: *"I need OpenAI, Stripe, and Supabase keys."*

### Limitations

- Only `simple` and `group` key types are included in the output.
- `ssh` and `json` entries are not expressible as env vars and are omitted.
- The AI selects entries based on semantic similarity — it may miss entries with unusual names.
