# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly.

**Do not** open a public GitHub issue for security bugs.

1. Contact the maintainer directly via email (see repository owner info).
2. Describe the vulnerability, affected component, steps to reproduce, and potential impact.
3. Allow reasonable time for a fix before any public disclosure.

## Secrets Policy

- **Never** commit secrets, API keys, passwords, or tokens to the repository.
- All environment variables must live in `.env` / `.env.local` files, which are in `.gitignore`.
- If a secret is accidentally committed, rotate it immediately and rewrite git history or treat the secret as compromised.

### Required secrets (must be set in production environment, NOT in code):
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (minimum 32 bytes, generate with `openssl rand -hex 32`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET` (if OAuth is enabled)

## Dependency Audit

Run before every production deploy:
```bash
npm audit
```

Any `high` or `critical` vulnerabilities must be resolved before deploying.

## IOC Scan

A local IOC scanner is available to check for known compromise indicators:
```bash
node scripts/ioc-scan.js
```

Run it after pulling code from remote, before every build, or as part of CI.

## Logging Policy

All server-side logging **must** go through the centralized logger (`src/lib/logger.ts`). Raw `console.*` calls are forbidden in production code.

### Rules

| What | Rule |
|---|---|
| Passwords, tokens, secrets | **Never** log. The logger's `redact()` strips known keys automatically, but avoid passing them in the first place. |
| User emails, phones, names (PII) | **Never** include in log messages. Log opaque identifiers (e.g. `bookingId`) instead. |
| IP addresses | Allowed in `warn`-level security events only (rate-limit blocks). Do not pair with email/name. |
| Request bodies | **Never** log raw request bodies. |
| Error objects | Pass as second argument to `logger.error()` — stacks are stripped automatically in production. |
| `debug` / `info` | Suppressed in production (`NODE_ENV=production`). Safe for development flow tracing. |
| `warn` | Always on. Use for security-relevant events: failed auth, invalid tokens, rate-limit triggers. |
| `error` | Always on. Use for caught exceptions and unexpected failures. |

### Redacted keys (automatic)

`password`, `pass`, `token`, `secret`, `authorization`, `cookie`, `set-cookie`, `database_url`, `nextauth_secret`, `jwt`, `refresh`, `access`, `api_key`, `client_secret`, `smtp_pass`, `smtp_user`, `mail_from`, `oldpassword`, `newpassword`

### Audit

Scan for stray `console.*` calls before every deploy:
```bash
npm run lint:logs
```
