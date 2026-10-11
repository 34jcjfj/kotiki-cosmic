# Security Incident Response

Use this playbook when a credential, account, deployment, user-data store, or released tool may be compromised.

## First actions

1. **Protect people and data.** If a feature is actively exposing private data or causing harm, disable the affected feature or deployment if you can do so safely.
2. **Secure access.** Revoke exposed tokens and sessions, rotate affected credentials, and remove unknown collaborators or deploy keys.
3. **Preserve useful evidence.** Record approximate times, affected services, relevant commit IDs, and actions taken. Do not copy secrets or unnecessary personal data into the incident notes.
4. **Limit scope.** Check relevant deployment logs, repository activity, account sessions, and provider alerts. Do not conduct intrusive testing against systems outside your authorization.
5. **Notify responsibly.** Inform the maintainer and, where appropriate, the hosting provider and affected users. Do not post exploit details publicly while users remain at risk.

## Triage

Record:
- Incident ID and date/time (include time zone)
- Reporter and a safe contact method
- Affected project/version/service
- Data or credentials potentially affected
- Current impact and confidence level
- Containment actions and who performed them
- Next action, owner, and target review time

## Recovery

- Patch the root cause, not only the visible symptom.
- Review logs for suspicious access while respecting privacy.
- Rotate every credential that may have been exposed, including dependent services.
- Restore from a known-good version and verify configuration before re-enabling service.
- Add a regression test or checklist item to prevent recurrence.
- Check whether user notification, deletion requests, or legally required reporting applies; involve a responsible adult and qualified professional when needed.

## Closure

Write a short post-incident review: what happened, impact, timeline, root cause, remediation, and follow-up tasks. Keep sensitive details private and retain only what is necessary.

## Important

Do not promise that no data was accessed unless evidence supports that conclusion. If scope is uncertain, state what is known and what remains unknown.