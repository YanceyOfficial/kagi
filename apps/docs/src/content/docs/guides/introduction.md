---
title: Introduction
description: What is Kagi and how does it work?
---

Kagi is a **self-hosted encrypted secret management system** for developers. Think of it as a private vault for your API keys, environment configs, `.env` files, and 2FA recovery tokens.

## Dashboard

The dashboard gives you an at-a-glance overview of your vault — total categories, entries, and 2FA token sets, plus charts showing key type distribution and environment breakdown.

![Dashboard overview](../../../assets/screenshots/dashboard.png)

## Key management

Kagi organizes secrets in two levels:

1. **Category** — defines the _type_ and _format_ of a key (e.g. "OpenAI API", "AWS Credentials"). Think of it as a key template.
2. **Entry** — a per-project instance of a category (e.g. "OpenAI API for Blog Project"). Stores the encrypted value.

This lets you reuse the same category definition (with its env var name, icon, and field layout) across multiple projects.

![Key categories](../../../assets/screenshots/keys.png)

### Key types

| Type     | Description                     | Stored as             |
| -------- | ------------------------------- | --------------------- |
| `simple` | Single environment variable     | Encrypted string      |
| `group`  | Multi-field map (e.g. AWS keys) | Encrypted JSON object |

## Env file manager

Store encrypted `.env`, `.env.local`, `.env.production`, and `.env.development` files organized by project. Each file is encrypted at rest and can only be revealed through an explicit action.

![Env Manager](../../../assets/screenshots/envs.png)

## 2FA recovery tokens

Securely store two-factor authentication backup codes. Tokens are encrypted and can be revealed one at a time with usage tracking.

![2FA Recovery](../../../assets/screenshots/2fa.png)

## Settings

Manage your profile, view encryption details, export vault metadata, create API keys for programmatic access, and manage your account.

![Settings](../../../assets/screenshots/settings.png)

## Encryption model

All secret values are encrypted with **AES-256-GCM** before being written to the database:

- The master key comes from the `KAGI_ENCRYPTION_KEY` environment variable (64 hex chars = 32 bytes)
- Ciphertext format: `iv:authTag:ciphertext` (all base64, colon-separated)
- The master key is never stored in the database

**Values are never returned by list or detail API endpoints.** You must call the dedicated `/reveal` endpoints explicitly to decrypt a value.

## Authentication

Kagi supports two authentication methods:

- **Email / password** — simple built-in auth, no external dependencies
- **Keycloak SSO** — delegate authentication to your existing Keycloak instance
- **Access keys** — static API tokens for programmatic access (CI/CD, scripts, integrations)

Access keys use the format `kagi_<43-char-base64url>` and are passed as `Authorization: Bearer kagi_<token>`.

## What Kagi is not

- Not a secrets manager with runtime injection (like Vault or Doppler)
- Not a password manager for end users
- Not a credential rotation service

Kagi is a **developer tool** for storing and retrieving secrets programmatically, with a clean REST API and strong encryption guarantees.
