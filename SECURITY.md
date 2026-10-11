# KOTIKI SHIELD — security baseline

This repository uses server-side owner authentication. Keep all credentials in Vercel Environment Variables; never commit real values in `.env` files, source code, issues, or screenshots.

## Current protections in code

- Owner login and recovery use server-side secret checks and constant-time comparison.
- Owner sessions are signed, expire after 30 minutes, and use an HttpOnly, Secure, SameSite=Strict cookie.
- Authentication endpoints check the request method and same-origin policy.
- Login, recovery, and webhook sending have application-level rate limits.
- Security-relevant events are logged without raw IP addresses, passwords, recovery keys, or cookies.
- `vercel.json` defines security headers and a Content Security Policy.

## Important limitations

- The in-memory rate-limit fallback is best-effort only. Serverless instances do not share memory. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel for a shared limiter.
- Application rate limits do not replace an edge WAF rule. Configure and verify Vercel Firewall in the project dashboard; do not assume custom WAF rules are active unless the dashboard confirms them.
- A WAF cannot prevent a person with write access to GitHub from changing the source. Restrict repository collaborators, protect `main` with pull-request reviews/status checks where the plan allows, and review unexpected commits and deployments.
- CI checks are a safety net, not proof that code is harmless. Review every source-changing PR.

## Before releasing security changes

1. Run `node --test tests/security.test.js`.
2. Check syntax for all JavaScript files and validate JSON configuration.
3. Confirm required production secrets exist in Vercel and are strong, unique values (session secret at least 32 bytes).
4. Confirm the production deployment is Ready and manually test owner login, logout, recovery, and admin actions.
5. Verify WAF rules in Vercel Firewall separately; this repository file cannot activate dashboard-side firewall settings.

Never paste secret values into chat or commit them to this repository.
