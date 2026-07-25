# July "Install Surge" — Source Investigation (RESOLVED: tracking artifact)

> Master-plan item **#1 (P0)** — investigated 2026-07-15. **Verdict: the surge is NOT new-user
> acquisition. It is existing installed sites re-appearing in the tracker.** The earlier
> install-trend claim ("~70 genuinely new installs/day, ≈$75–80/day") is **withdrawn**.

## Evidence (three independent checks)

1. **Plugin versions betray the cohort.** A real new install always gets the latest version
   (2.3.2/2.3.3). But of 417 July-surge tracking rows, **~220 run OLD versions** — 2.1.x, 1.9.x,
   1.8.x, down to 1.4.x/1.5.x (years old). Those are long-existing sites, not new users.
   (June/May cohorts show the same long-tail — normal for *tracking events*, impossible for
   *new installs*.)
2. **80% of "new" emails exist in older data.** 308 of 385 surge emails appear in the March 2026
   tracker export / merged history / pre-July uninstall records. The earlier "83% never seen"
   check compared only against rows id ≥ 26635 — but the March export proves **TTS rows exist
   below id 26635 too**, so the incremental window hid the history.
3. **wp.org shows no acquisition event.** Daily downloads Jul 1–7: ~86–200 (baseline); spikes only
   on release days (Jul 8 = 2.3.3 rollout, Jul 11 = 2.3.4) — classic update spikes. Ratings grew
   just +5 in a month (85→90). No discovery/viral event anywhere.

## What actually happened (best hypothesis — needs founder confirmation)

Something around **July 4–5** caused a mass re-fire of tracking events across the existing install
base — including sites on ancient versions that did NOT update. Since those sites' client code
didn't change, the trigger is almost certainly **server-side or time-based**:

- (a) a change on **track.atlasaidev.com** (tracker plugin / API accepting or re-recording pings it
  previously deduped) — *founder was recently editing this codebase*;
- (b) a **time-based notice/consent re-show** built into the lib (the `tta_reshow_*` /
  next-show-time mechanics) that crossed its threshold across the base simultaneously;
- (c) a cron/scheduled re-report in the AtlasAiDev lib.

**❓ Founder question:** did you change anything on track.atlasaidev.com (tracker plugin, API file,
DB, dedupe logic) around July 4–5? That answer picks (a) vs (b/c).

## Consequences (already applied)

1. **Real acquisition baseline stays ~2–5 consented installs/day** — the funnel did NOT recover.
   The two-year install decline stands as the true trend.
2. **No ~$75–80/day upside** — scoreboard target changed; the July 14 sales ($59×2) are normal
   volume, not surge-driven.
3. **Renewal-rescue (item #2) is now the top P0** — with no acquisition tailwind, stopping the
   32%-renewal decay is the highest-value revenue work, followed by the activation-hour package.
4. **Data hygiene rule:** rows below id 26635 include AtlasAiDev TTS rows (not only WebAppick's) —
   dedupe/"is this user new?" checks must include `plan/data/archive-2026-03/` exports.
   Duplicate-row inflation also explains part of monthly "install" counts in the trend analysis —
   treat tracker rows as *events*, unique emails as *users*, always.
5. **Silver lining:** the artifact proves a large, silent, still-active install base on old
   versions (sites on 1.5–2.1 still alive in 2026). They are reachable via the in-plugin
   announcement channel (item #13) — legitimately, without email.
