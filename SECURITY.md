# Security Policy

Kagi stores encrypted secrets. Security issues are taken seriously — please disclose responsibly.

## Supported Versions

Kagi is a self-hosted application distributed as source code. Only the latest commit on `master` receives security fixes. If you are running an older version, please update before reporting.

| Version | Supported |
|---------|-----------|
| latest (`master`) | yes |
| older commits | no |

## Encryption Model

For context when evaluating reports:

- All secret values are encrypted with **AES-256-GCM** before being written to the database.
- Ciphertext format: `iv:authTag:ciphertext` (all base64, colon-separated).
- The master key (`KAGI_ENCRYPTION_KEY`) is supplied via environment variable and never stored in the database.
- Secret values are **never** returned by list or detail API endpoints — only via explicit `POST /api/entries/[id]/reveal` or `POST /api/2fa/[id]/reveal`, which require an authenticated session and ownership check.
- AI extraction is privacy-preserving: the model receives only key names and project names, never plaintext values.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report via one of:

1. **GitHub private security advisory** (preferred): [https://github.com/YanceyOfficial/kagi/security/advisories/new](https://github.com/YanceyOfficial/kagi/security/advisories/new)
2. **Email**: yanceyofficial@gmail.com — use the subject line `[kagi] Security Vulnerability`.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- The component affected (auth, encryption, API route, etc.)
- Any suggested mitigations if you have them

You can expect an acknowledgement within **48 hours** and a status update within **7 days**. We will coordinate a fix and disclosure timeline with you.

## Scope

Items that are in scope:

- Authentication/authorization bypass
- Encryption weaknesses or key exposure
- API routes that leak `encryptedValue` or plaintext secrets
- Session fixation or privilege escalation
- Injection vulnerabilities (SQL, command, etc.)

Items that are **out of scope**:

- Vulnerabilities requiring physical access to the server
- Misconfiguration of the operator's Keycloak or PostgreSQL instance
- Vulnerabilities in upstream dependencies (report those to the respective project)
- Self-XSS or issues requiring the attacker to have admin access
