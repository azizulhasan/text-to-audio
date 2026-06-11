# `plan/` — index

Planning notes, ticket designs, growth strategy, research, and one-off scripts. Code lives in the rest of the repo; this folder is for the thinking that precedes it.

## Subfolders

| Folder | What's in it |
|---|---|
| `tickets/` | Per-ticket design notes & release test plans (TTS-XXX). Shipped and in-flight. |
| `roadmap/` | Future / not-yet-started work. Architecture refactors, future features, reusable blueprints. |
| `growth/` | Business strategy, analytics reports, demo content, churn / abandon-rate plans. |
| `email/` | Email campaign plans (Mailchimp journeys, review prompts). |
| `compliance/` | GDPR, telemetry enrichment, deactivation form, privacy. |
| `research/` | Competitor analysis, open-source model research. |
| `docs-drafts/` | Drafts of user-facing documentation that may later move to atlasaidev.com/docs/. |
| `data/` | CSVs and analysis PHP scripts for the `azizyzjn_tracker` database. |
| `scripts/` | One-off Node.js scripts for blog / SEO / GA4 automation. |

## Conventions

- Ticket plans use the `TTS-NNN-short-slug.md` naming pattern.
- Files named `TTS-future-*` are explicitly roadmap items, not active tickets.
- Release test plans cover one or more shipped tickets and live alongside them in `tickets/`.
- The `business-analytics-report.md` in `growth/` is the canonical source of truth for plugin install / churn / uninstall-reason analytics (sourced from `track.atlasaidev.com`).
