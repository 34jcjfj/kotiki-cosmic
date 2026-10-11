# User-Facing Change and Incident Notices

## Purpose

Users should be able to understand important changes to the tools they use. Notices must be accurate, proportionate, and avoid revealing information that could put users or systems at risk.

## What to announce

### Routine changes
For small fixes, interface improvements, or non-breaking changes:
- Add an entry to `CHANGELOG.md`.
- Summarize the change in release notes when a release is published.

### Changes that may affect users
Publish a clear notice in an appropriate visible channel when a change materially affects:
- Available features or compatibility
- How user data is collected, processed, stored, or deleted
- Permissions or account access
- Pricing or usage limits, if introduced
- Significant service interruptions or planned maintenance
- A known defect that users need to work around

Where applicable, update the relevant documentation or privacy notice before the change takes effect.

### Security incidents
If an incident may affect user data, account security, or safe use of a tool:
- Prioritize containment and accurate communication.
- Tell affected users what is known, what may be affected, and what they should do next.
- Do not speculate or claim that data was not accessed without evidence.
- Do not publish exploit steps, credentials, personal data, or details that would enable further abuse.
- Follow applicable legal and provider notification requirements, with qualified help where needed.

## Suggested notice format

**Title:** What changed  
**Date:** YYYY-MM-DD  
**Affected tool/version:** Name and version  
**Impact:** What users may notice  
**Action needed:** Clear next step, or “No action needed” if confirmed  
**Status:** Investigating / Fix in progress / Resolved  
**More information:** Link to release notes or help page

## Rollback notices

If a release is rolled back:
- Explain the user-visible issue without unnecessary technical detail.
- Say which features may be temporarily unavailable.
- State whether user action is needed.
- Post a follow-up when the issue is resolved.

Do not say “everything is fixed” until the relevant checks have passed.

## Where notices appear

Use a channel users can reasonably find, such as the tool's status/update page, release notes, or the official project announcement channel. Avoid relying only on a private developer discussion or an obscure repository commit.

## Principles

- Be clear, factual, and timely.
- Do not hide a material security or privacy impact behind vague wording.
- Do not expose personal information or confidential incident details.
- Keep a record of what was announced and when.
- Correct notices when new evidence changes what is known.