# Security Policy

AI-PLAYGROUND is developed by **AI WONDERLAND INNOVATION** and is under active development.

## Supported versions

Security fixes are applied to the latest supported `main` branch and active production deployment built from it. Older development branches and abandoned builds are not independently supported.

## Reporting a vulnerability

Do **not** report exploitable vulnerabilities, credentials, private user data, or working attack details in a public issue or discussion.

Preferred reporting paths:

1. Use GitHub private vulnerability reporting for this repository when available.
2. Otherwise email **security@dreammakerhub.website**.

Include the affected commit or deployment if known, affected endpoint/component, impact, reproduction steps, and a minimal proof of concept when necessary. Redact real credentials and user data.

## Security-sensitive areas

Reports are especially useful when they involve:

- Wonderland-key validation or authentication/authorization bypass;
- provider credential or BYOK leakage;
- server/client boundary mistakes that expose long-lived provider keys;
- prompt/tool injection that crosses an authorization boundary;
- unsafe workflow/template import or execution;
- API rate-limit bypass or cost/resource abuse;
- cross-user project or workflow access;
- SSRF, XSS, command injection, SQL/NoSQL injection, or remote code execution;
- unsafe CORS, redirects, WebSocket/stream handling, or file processing;
- secrets exposed through logs, browser bundles, errors, or repository history.

## Secrets

Do not commit real provider keys, database credentials, access tokens, private keys, or production `.env` files. `.env.example` must contain placeholders only. Long-lived provider credentials should remain behind authenticated server routes wherever practical.

## Current hardening status

Security work is ongoing. The README documents current boundaries and remaining client-side provider integrations that still need migration behind protected server routes. This policy is a reporting and maintenance commitment, not a claim that every possible control is already implemented.
