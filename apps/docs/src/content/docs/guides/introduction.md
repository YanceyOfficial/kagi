---
title: Introduction
description: What is Kagi and how does it work?
---

Kagi is a **self-hosted encrypted secret management system** for developers. Think of it as a private vault for your API keys, SSH keys, environment configs, and 2FA recovery tokens.

## Core concepts

### Two-level key structure

Kagi organizes secrets in two levels:

1. **Category** — defines the *type* and *format* of a key (e.g. "OpenAI API", "AWS Credentials"). Think of it as a key template.
2. **Entry** — a per-project instance of a category (e.g. "OpenAI API for Blog Project"). Stores the encrypted value.

This lets you reuse the same category definition (with its env var name, icon, and field layout) across multiple projects.

### Key types

| Type | Description | Stored as |
|------|-------------|-----------|
| `simple` | Single environment variable | Encrypted string |
| `group` | Multi-field map (e.g. AWS keys) | Encrypted JSON object |
| `ssh` | SSH private key file | Encrypted file content |
| `json` | JSON credential file (e.g. GCP service account) | Encrypted file content |

### Encryption model

All secret values are encrypted with **AES-256-GCM** before being written to the database:

- The master key comes from the `KAGI_ENCRYPTION_KEY` environment variable (64 hex chars = 32 bytes)
- Ciphertext format: `iv:authTag:ciphertext` (all base64, colon-separated)
- The master key is never stored in the database

**Values are never returned by list or detail API endpoints.** You must call the dedicated `/reveal` endpoints explicitly to decrypt a value.

### Authentication

Kagi supports two authentication methods:

- **Browser sessions** — via Keycloak OIDC (for the web UI)
- **Access keys** — static API tokens for programmatic access (CI/CD, scripts, integrations)

Access keys use the format `kagi_<43-char-base64url>` and are passed as `Authorization: Bearer kagi_<token>`.

## What Kagi is not

- Not a secrets manager with runtime injection (like Vault or Doppler)
- Not a password manager for end users
- Not a credential rotation service

Kagi is a **developer tool** for storing and retrieving secrets programmatically, with a clean REST API and strong encryption guarantees.
