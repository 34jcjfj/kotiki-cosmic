# KOTIKI SHIELD — security baseline

Keep all credentials in Vercel Environment Variables; never commit real values in `.env` files, source code, issues, or screenshots.

## Application protections

- Owner login and recovery use server-side secret checks and constant-time comparison.
- Owner sessions are signed, expire after 30 minutes, and use an HttpOnly, Secure, SameSite=Strict cookie.
- State-changing owner endpoints require a matching HTTPS Origin; missing, malformed, insecure, or cross-site origins are rejected.
- Request bodies are size-limited before business logic is processed; oversized requests are rejected.
- Login, recovery, and webhook sending have application-level rate limits and return `Retry-After` when the local limit is reached.
- Rate-limit and audit keys use a validated, length-bounded IP from Vercel's platform-provided `x-real-ip` header when available; the app does not trust `x-forwarded-for` as a fallback. Invalid values fall back to a validated socket address or `unknown`.
- The in-memory rate-limit fallback prunes expired entries and evicts oldest entries at a fixed 5,000-entry cap to prevent unbounded memory growth under high-cardinality traffic. Logs hash the IP and never include passwords, recovery keys, cookies, or raw IP addresses.
- Session verification rejects oversized tokens and malformed Base64URL token segments before parsing.
- `vercel.json` defines security headers and a Content Security Policy.
- GitHub Actions checks JavaScript syntax, JSON configuration, helper behavior, and runs CodeQL static analysis.

## Audit monitoring and recovery

- Security events are written as structured JSON to Vercel Runtime Logs with a timestamp and a truncated SHA-256 hash of the client IP. Never log passwords, recovery keys, cookies, session tokens, webhook URLs, or message contents.
- Events include login success/failure and rate limiting, recovery success/failure and rate limiting, rejected or verified owner sessions, logout revocation outcomes, and protected Discord webhook outcomes.
- Review Vercel Runtime Logs after unexpected login prompts, logout failures, Redis errors, or suspicious admin activity. The app writes logs; it does not by itself guarantee real-time alerts or long-term retention. Configure alerting/retention in the hosting dashboard if available.
- The recovery key is an alternate way to create an owner session, not a password reset. Store it separately from the admin password. If a credential may have leaked, rotate it in Vercel and redeploy; changing the session signing secret invalidates existing sessions.
- Recovery checklist: (1) rotate the potentially exposed secret; (2) verify the production environment target; (3) redeploy; (4) check `/api/health`; (5) test login, logout, recovery, and one protected action; (6) review logs for failures. Do not paste secret values into tickets or chat.

## Important limitations

- The in-memory rate-limit fallback is best-effort only. Serverless instances do not share memory. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel for a shared limiter.
- Application rate limits do not replace an edge WAF rule. Configure and verify Vercel Firewall in the project dashboard; do not assume custom WAF rules are active unless the dashboard confirms them.
- A WAF cannot prevent a person with write access to GitHub from changing the source. Restrict repository collaborators, protect `main` with pull-request reviews/status checks where the plan allows, and review unexpected commits and deployments.
- CI checks and static analysis are safety nets, not proof that code is harmless. Review every source-changing PR and test security-sensitive flows in a preview before release.

## Before releasing security changes

1. Wait for all GitHub Actions checks, including CodeQL, to pass.
2. Confirm required production secrets exist in Vercel and are strong, unique values (session secret at least 32 bytes).
3. Confirm the production deployment is Ready and manually test owner login, logout, recovery, and admin actions.
4. Verify WAF rules in Vercel Firewall separately; repository files cannot activate dashboard-side firewall settings.

Never paste secret values into chat or commit them to this repository.
