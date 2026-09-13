# Contributing to AI-PLAYGROUND

Thanks for helping improve AI-PLAYGROUND.

AI-PLAYGROUND is a publicly viewable, source-available AI WONDERLAND INNOVATION project. The repository's `LICENSE` controls how the code may be used. Public visibility does not grant rights beyond that license.

## Before making changes

- Read `README.md` and the relevant files under `docs/`.
- Search existing issues and pull requests before introducing parallel workflow/provider architecture.
- Keep long-lived provider credentials on the server wherever practical.
- Do not commit real secrets, user data, or production `.env` files.
- Treat AI/model output and imported workflow data as untrusted input.

## Local setup

```bash
git clone https://github.com/AI-WonderLand1/AI-PLAYGROUND.git
cd AI-PLAYGROUND
npm install
cp .env.example .env
```

Verify application changes with:

```bash
npm run lint
npm run build
```

The repository does not currently define a complete automated unit/integration test suite, so pull requests should describe any additional manual verification performed.

## Pull requests

Keep changes focused and explain what changed, why it changed, how it was verified, and any security or compatibility impact.

Changes involving authentication, provider routing, billing, Supabase, user-scoped projects/workflows, streaming, uploads, or external URLs should explicitly describe authorization and failure behavior.

## Security issues

Do not open a public issue for an exploitable vulnerability. Follow `SECURITY.md` and use GitHub private vulnerability reporting or `security@dreammakerhub.website`.

## License

By submitting a contribution, you represent that you have the right to submit it and that the contribution may be incorporated into this project subject to the repository's licensing and contribution terms.
