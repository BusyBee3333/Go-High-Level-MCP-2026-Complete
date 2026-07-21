# Repository Agent Rules

## Publish durable project work

When an agent creates or changes a non-sensitive artifact that is reusable, directly applicable to this project, practical to maintain, and likely to help another agent, GitHub publication is part of the default definition of done.

- Publish durable code, tests, migrations, schemas, setup documentation, sanitized runbooks, and reusable templates to the correct repository.
- Validate the artifact, document how it is used, stage only the intended files, commit on a scoped branch, push it, and open a draft pull request unless the owner asks for a different GitHub workflow.
- Do not leave valuable project work only in a local scratch path when a sanitized, maintainable version belongs in source control.
- Do not publish temporary exploration, generated captures, raw vendor exports, unnecessary binaries, duplicate local copies, or work unrelated to the repository.
- Use the repository that owns the artifact. Never put private work in a public repository merely to make it discoverable.

## Public-repository safety boundary

This repository is public. GitHub publication never overrides privacy, security, or production-safety rules.

- Never commit `glbjj-docs/` or `glbjj-build/`.
- Never commit customer or prospect PII, conversation transcripts, health or billing details, private business metrics, contact identifiers, raw API or UI captures, secrets, tokens, credentials, `.env` files, or private keys.
- If a reusable tool exists only in a private operational directory, extract a generalized and sanitized version into an appropriate tracked path. Keep the private original untracked.
- Before every commit and push, run `git status --porcelain`, inspect the staged diff, and verify that no private path or sensitive pattern is staged. Stage explicit paths in a mixed worktree and never force-add ignored files.

## GitHub is not production

Publishing a branch or draft pull request does not authorize a production deployment, merge, outbound message, workflow publish, database migration, live configuration change, or campaign send. Those actions retain their existing approval and verification gates.
