---
title: Overview
description: Base URL, authentication, error format, and OpenAPI spec.
---

## Base URL

All API endpoints are relative to your Kagi instance URL:

```
https://<your-kagi-host>/api
```

In local development:

```
http://localhost:3000/api
```

## Authentication

All endpoints (except `GET /api/openapi`) require authentication. Two methods are supported:

### Access key (recommended for automation)

Pass your access key as a Bearer token:

```http
Authorization: Bearer kagi_<your-key>
```

Access keys carry [scopes](/authentication/scopes/) that control which endpoints they can reach.

### Browser session

The web UI uses cookie-based sessions via Keycloak OIDC. Session-authenticated requests have full access and bypass scope checks.

## OpenAPI spec

The machine-readable OpenAPI 3.1.0 spec is available at:

```
GET /api/openapi
```

No authentication is required. You can import this URL into Postman, Insomnia, Scalar, or any compatible tool.

## Content type

All request and response bodies use JSON:

```http
Content-Type: application/json
```

## Error format

All errors return a JSON object with an `error` string:

```json
{
  "error": "Not found"
}
```

### Common status codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content (successful delete) |
| 400 | Bad request — see `error` for details |
| 401 | Unauthorized — missing or invalid credentials |
| 403 | Forbidden — valid credentials but insufficient scope |
| 404 | Resource not found (or not owned by you) |
| 500 | Internal server error |

## Pagination

The current API returns all results without pagination. For large datasets, filter client-side.

## Privacy guarantees

- **Encrypted values are never returned** by list or detail endpoints.
- To read a secret value, call the dedicated `POST /reveal` endpoint explicitly.
- The AI extraction endpoint sends only key **names** to the AI model — never values.

## Rate limiting

No rate limiting is enforced by default in the self-hosted version. Apply your own rate limiting at the reverse-proxy level (e.g., nginx, Caddy) if needed.
