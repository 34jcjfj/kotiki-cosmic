# KOTIKI X-HELP — Security and Service Notices

Status: proposal / implementation specification. This document does not mean that a notification system is already live.

## Purpose

KOTIKI X-HELP should be the official place for verified security incident updates, service disruptions, important product changes, and privacy-policy notices across KOTIKI projects. Public notices should be clear, calm, timestamped, and understandable to non-technical users.

## Notice types

- **Service update** — a feature changed, maintenance is planned, or a release was published.
- **Service disruption** — a confirmed outage or degraded feature.
- **Security investigation** — suspicious activity is being investigated; no breach should be claimed unless confirmed.
- **Security incident** — an incident has been confirmed and the affected service and known impact can be stated responsibly.
- **Privacy update** — the privacy notice or data-handling practice changed, with an effective date and a plain-language summary.
- **Incident resolved** — mitigation and recovery steps are complete, with any remaining risks or follow-up actions stated.

## Severity and publication rules

1. Publish only information supported by evidence and approved by the project owner or designated incident lead.
2. Distinguish **suspected**, **under investigation**, **confirmed**, and **resolved**. Never present suspicion as a confirmed data breach.
3. Do not publish passwords, tokens, private user data, internal logs, unpatched vulnerability details, or step-by-step exploit information.
4. For a confirmed incident, state what service is affected, what is known about impact, when the notice was updated, what the team is doing, and what users should do (if anything).
5. If the scope is not yet known, say so plainly and commit to posting the next update when meaningful verified information is available. Do not promise a recovery time that has not been verified.
6. Keep a dated history of edits. Correct mistakes transparently rather than silently rewriting important incident updates.
7. If the website itself may be compromised, use a separate trusted communication channel to publish updates. Do not rely solely on the potentially affected site.

## Suggested notice format

- **Title**
- **Status:** investigating / confirmed / monitoring / resolved
- **Affected service(s)**
- **First observed (UTC)**
- **Last updated (UTC)**
- **What we know**
- **What users should do**
- **What the team is doing**
- **Next update:** a time only if the team can reasonably commit to it
- **Incident reference:** a non-sensitive identifier

## Example — confirmed incident

> **Security incident under response — [service name]**
>
> Status: confirmed, investigation and containment in progress.
>
> We confirmed a security incident affecting [specific service]. We are investigating its scope and have not yet verified all potential impacts. We have taken [verified containment action] and are working to restore normal operation safely.
>
> At this time, [state only verified facts]. We will update this notice as we confirm more information. Please follow [official trusted channel] for updates. Do not send passwords, verification codes, or private documents to anyone claiming to offer support.

This example is a template only. It must not be published as a real incident report unless its statements are true and verified.

## Operational requirements before launch

- Assign a named role responsible for approving notices.
- Provide a public status/history page and an alternative channel for emergencies.
- Restrict publishing access; keep credentials out of source code and logs.
- Record who published or edited a notice and when.
- Test the notice workflow and rollback process before enabling it for real users.
- Confirm applicable privacy and breach-notification obligations with a qualified adult/legal professional when necessary.

## Important limitation

A status page can communicate incidents; it does not detect intrusions by itself. Automated detection, alerting, access controls, logging, and an incident-response process must exist separately and be tested.
