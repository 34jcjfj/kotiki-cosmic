# KOTIKI X LABS — Secure Development Standard

**Status:** Initial working standard  
**Applies to:** Websites, utilities, bots, APIs, automation, and other tools explicitly maintained as project releases.  
**Purpose:** Reduce avoidable security and privacy risks. This checklist does not certify a project as secure.

## 1. Access and repository protection

- Give each collaborator the minimum access needed; remove access when it is no longer needed.
- Keep production deployment credentials separate from source code and development credentials.
- Protect the default branch with pull requests and checks where the repository plan and settings allow it.
- Review changes before release; do not merge untrusted code solely because it builds.
- Keep an owner/maintainer and a recovery path documented.

## 2. Secrets and configuration

- Never commit API keys, access tokens, passwords, private keys, session cookies, or production environment files.
- Use hosting-provider environment variables or a dedicated secrets manager.
- Keep a safe example file such as `.env.example` with placeholder values only.
- If a secret is exposed, treat it as compromised: revoke/rotate it, review usage, and remove it from active code. Deleting a file from the latest commit does not erase its Git history.
- Never ask users to paste passwords, tokens, or private keys into issues or chat.

## 3. Dependencies and code

- Prefer maintained packages from trusted sources; pin or lock dependencies when the ecosystem supports it.
- Review new dependencies, their permissions, license, maintenance status, and known vulnerabilities.
- Apply security updates after testing compatibility.
- Avoid evaluating arbitrary user input as code, shell commands, SQL, HTML, or template expressions.
- Validate inputs at trust boundaries and encode output for its destination.
- Use parameterized database queries and established authentication/session libraries rather than improvised security mechanisms.
- Do not store passwords in plain text. Use established password hashing and authentication systems if accounts are needed.

## 4. Web and API protections

- Enforce authorization on the server for every protected operation; hiding a button in the UI is not access control.
- Use HTTPS for production traffic.
- Restrict CORS to required origins; do not use wildcard origins with credentialed requests.
- Apply rate limits and sensible request-size limits to public endpoints.
- Avoid exposing stack traces, internal paths, environment values, or sensitive identifiers to users.
- Use secure cookie settings and appropriate CSRF protection when cookie-based sessions and cross-site requests make it necessary.
- Do not add security headers blindly; test compatibility with the actual site and deployment.

## 5. Privacy and user content

- Collect only data needed for a stated feature.
- Explain what is collected, why, where it is processed, and how a user can request deletion where applicable.
- Do not log passwords, tokens, private messages, or unnecessary personal data.
- Set a retention period for logs and submitted content.
- Do not upload user-submitted files or run submitted code automatically without a separately reviewed threat model and isolation design.

## 6. AI features

- Treat prompts, files, retrieved pages, and tool outputs as untrusted input.
- Do not put secrets in prompts or expose them in model output.
- Require explicit authorization for consequential actions such as sending messages, changing accounts, deleting data, or spending money.
- Limit tool permissions; confirm high-impact actions with the user.
- Test prompt injection, data leakage, abuse, and failure cases before release.

## 7. Release gates

A release must not proceed while a known critical issue remains unresolved, a required secret is exposed, or the maintainer cannot explain the source and license of included code/assets. Use `docs/RELEASE-CHECKLIST.md` before publishing.

## 8. Incident handling

Follow `docs/INCIDENT-RESPONSE.md`. Prioritize protecting users and revoking compromised credentials over preserving uptime.

## 9. Exceptions

Record the reason, risk, mitigation, owner, and expiry date for any exception. A temporary exception must not silently become permanent.

## 10. Limits

Following this standard reduces risk but cannot guarantee security, legal compliance, uninterrupted availability, or freedom from third-party claims. Adapt it to each tool's actual architecture and applicable law.