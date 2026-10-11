# Backup and Rollback Procedure

**Status:** Operational baseline; not yet a verified disaster-recovery guarantee.

## Goals

- Keep a recoverable copy of source history.
- Preserve known-good release identifiers.
- Restore service quickly when a release causes a serious regression.
- Avoid exposing secrets by making backups public.

## Source-code backups

1. Treat the primary Git repository as the working source of truth.
2. Maintain a second, separately permissioned backup repository or backup destination. It must not be a public mirror if the source contains confidential code, deployment details, or private operational information.
3. Restrict write access to the backup. Use a separate access path and enable multi-factor authentication on the accounts that control it.
4. Back up Git history and release tags. Keep secrets and production environment files out of all repositories, including private backups.
5. Periodically test restoration by cloning the backup and checking that required branches, tags, and project files are present.
6. Keep a short record of the latest verified backup and the person responsible. Do not claim that a backup exists until a real backup has been created and tested.

A second repository under the same account is useful for accidental deletion but may not protect against account compromise. For stronger recovery, keep a copy in a separately controlled location and, where practical, an offline or immutable copy.

## Release checkpoints

- Use a pull request for changes rather than editing the production branch directly.
- Test the change in preview/staging when available.
- Mark each known-good release with a version tag or release record and record its commit SHA.
- Record deployment URL/ID, commit SHA, release time, verification results, and any database/configuration changes.
- Do not merge or deploy a release with an unresolved critical issue, exposed secret, or unclear source/license for required material.

## Rollback decision

Consider rollback when a new release causes serious breakage, a security regression, or loss of an essential user flow.

1. Confirm the affected deployment and scope without delaying containment of an active exposure.
2. Stop or disable the affected feature if that is safer than leaving it live.
3. Select a known-good deployment/release and confirm it is compatible with current environment variables, APIs, databases, and external services.
4. Roll back the deployment using the hosting provider's supported workflow.
5. Verify key user flows, logs, and error rates after the rollback.
6. Communicate the incident and current status to users when the impact warrants it.
7. Investigate the cause and deploy a tested fix through the normal review process.

## Important Vercel limitation

Vercel Instant Rollback can route production traffic to a previous eligible deployment. Availability depends on plan and deployment eligibility; on the Hobby plan, the documented rollback option is limited to the immediately previous production deployment. Environment variables are not rolled back with the build, and external databases/APIs may have their own state. Check the Vercel dashboard and current plan before relying on a particular recovery path.

## Database and secret changes

- Code rollback does not reverse database migrations, messages already sent, external API actions, or data already changed.
- Prefer backward-compatible database changes and maintain a separate, tested database recovery plan.
- If a credential leaked, revoke/rotate it; rolling back the code does not make a leaked credential safe.
- Do not restore a backup over current data without confirming what would be overwritten and obtaining the required authorization.

## Restore drill

At a practical interval, test that the backup can be cloned and a prior version can be identified. Record the result and fix any gaps. This document is a procedure, not evidence that backup or rollback has already been tested.