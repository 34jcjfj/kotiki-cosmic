# Pre-release Checklist

Complete this checklist for every public release. Mark an item N/A only with a brief reason.

## Scope and quality
- [ ] Change description and version are recorded.
- [ ] The release was tested in a non-production environment where practical.
- [ ] Critical user flows work; errors and empty states were checked.
- [ ] No unrelated changes were bundled into the release.

## Code and dependencies
- [ ] New code and assets have known sources and compatible licenses.
- [ ] Dependencies are maintained and checked for known vulnerabilities.
- [ ] No suspicious obfuscated code or unexpected install/build scripts were introduced.
- [ ] Input validation, output encoding, authorization, and error handling were reviewed where relevant.

## Secrets and deployment
- [ ] No tokens, passwords, private keys, cookies, or real environment files are included.
- [ ] Production secrets are stored in the hosting provider's protected settings.
- [ ] The deployed environment and required variables are documented without revealing values.
- [ ] Deployment permissions are limited to the people and services that need them.

## Privacy and user safety
- [ ] Data collection is necessary and explained to users.
- [ ] Logs avoid secrets and unnecessary personal information.
- [ ] File uploads, external links, AI tools, and third-party APIs were checked if used.
- [ ] Destructive or high-impact actions require appropriate authorization and confirmation.

## Release readiness
- [ ] Relevant automated checks pass.
- [ ] A maintainer reviewed the final change.
- [ ] Known limitations and rollback steps are recorded.
- [ ] A route for reporting problems is available.
- [ ] If the release creates a significant new risk, the risk is fixed or documented with an owner and deadline.

**Do not release** if a secret is exposed, a critical security issue is unresolved, rights to essential assets are unclear, or the release cannot be rolled back safely.