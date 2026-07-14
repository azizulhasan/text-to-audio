# AtlasVoice — Manual Testing Playbook

> Living document. The user (atlasaidev) gives me "current changes + test the
> plugin", and I work through the relevant areas below one by one on the live
> staging site. This process **evolves** — append new rules as they're learned;
> never assume it's complete.

## Golden rules (read every time)

1. **Two plugins, coupled:** free `text-to-audio` + Pro `text-to-audio-pro`
   (Pro requires free). Test **free first** (free active, Pro inactive), then
   **I activate Pro myself** via `plugins.php` and test the Pro phase.
2. **Free vs Pro scope:** free covers everything **except** GTranslate/multilingual
   (free doesn't support it) and **only the default player (player 1)**; Pro
   covers **everything** — the default Pro player, players 3/4/5/6, GTranslate,
   and all StepRail/exclude features.
3. **Every time I switch the player** (Customization menu) I must go to the
   **Listening** menu and re-select the **voice + language** appropriate for that
   player — settings are per-player, not global.
4. **When a multilingual plugin is active** (currently GTranslate), I must
   configure the **multilingual language + voice mapping in the Listening menu**
   — a dedicated multilingual UI appears there only while such a plugin is
   active. Same process for every multilingual plugin (WPML, Polylang,
   TranslatePress); for now we only test GTranslate.
5. **Before testing any post**, open that post's edit page → **AtlasVoice meta
   box** → **delete all previously generated MP3s** so I test fresh generation.
6. Test **at least 2 posts** and **multiple post types** (Settings → "Allow
   Listening For Post Type" → switch between Post / Page / Product).
7. Verify in the **browser** on the live site; report what I actually observe
   (console, session storage, network, on-screen), never assume.

## Environment & links

- Staging site: `https://cors2.atlasaidev.com`
- **Test posts: never save/reuse specific post URLs** — the staging site gets
  reset and posts change day to day. At the start of every run, list the
  current posts (`/wp-json/wp/v2/posts` or the admin posts list) and, if there
  is no suitable **long** post (several thousand chars, headings + paragraphs,
  ideally a body paragraph sharing the title's opening words to exercise the
  title guard), **create a fresh one** for the run.
- Admin:
  - Plugins: https://cors2.atlasaidev.com/wp-admin/plugins.php
  - Dashboard: https://cors2.atlasaidev.com/wp-admin/admin.php?page=text-to-audio
  - All posts: https://cors2.atlasaidev.com/wp-admin/edit.php
- Staging→Live docs: https://atlasaidev.com/docs/text-to-speech/getting-started/atlasvoice-content-selector-staging-live/

## Players (provider IDs)

| ID | Provider | Tier | Frontend JS |
|----|----------|------|-------------|
| 1 | Browser TTS (free) | Free | free player |
| 2 | Google Translate TTS | Pro | TextToSpeechPro |
| 3 | Browser TTS (pro) | Pro | TextToSpeechPro |
| 4 | Google Cloud TTS | Pro | plyr |
| 5 | ChatGPT / OpenAI TTS | Pro | plyr |
| 6 | ElevenLabs TTS | Pro | plyr |

Switch player in **Customization**, then set voice/language in **Listening**
(AI provider keys are already configured on the staging site).

## Core areas to test (each run)

### A. Player playback
- For each player in scope: delete old MP3 → set voice/lang in Listening →
  load the post front end → play → confirm it reads the **post title + content**
  correctly, with no player UI text spoken.

### B. Setup wizard
- Open via the **"Setup Wizard" button on the Settings page** (free wizard when
  free active, Pro wizard when Pro active).
- Walk all steps; on the finish step verify: no "Your Setup"/"Your Pro Setup"
  summary cards, the single **"Explore all AtlasAiDev plugins"** button opens the
  in-plugin Other Plugins page, and (free finish) the **"Upgrade to Pro"** button
  is sky-blue and UTM-tagged.

### C. Multilingual (GTranslate) — Pro only
- Configure multilingual language + voice in the **Listening** menu (multilingual
  UI present because GTranslate is active).
- On a front-end post, **switch language** via the GTranslate widget, then check
  **console** and **session storage**: translated **title** is read, translated
  **content** matches the chosen language, switching **back to default** reloads
  correctly, and no player UI leaks into spoken content.

### D. StepRail / AtlasVoice Selector (on-page content selector)
- Disabled by default; enable via **Settings → "Show on-page content selector"**,
  or launch ad-hoc via a **"Pick Visually"** button (global, per-post-type, or
  per-post).
- Per-post: post edit page → **AtlasVoice metabox → "Use Own Custom CSS For The
  Post" → "Pick Visually"**.
- **Free:** can set the **content-region include selector**; the exclude tools are
  replaced by an **Upgrade CTA**.
- **Pro:** adds **exclude-by-CSS-selector, exclude-tags, exclude-phrases,
  verify-across-posts**, and per-post-type overrides.
- Confirm the chosen selector actually changes what the player reads.

### E. Staging → Live
- The AtlasVoice mode shows in the **top admin bar** (always while the front-end
  Selector is open; on all posts for admins when **Settings → "Show Staging /
  Live indicator in toolbar"** is on — this now defaults ON).
- Default mode is **Staging** (player hidden from visitors). Go live: admin bar →
  **"Go Live"** → popup → type exactly **`GO LIVE`** → OK; then confirm the
  player is visible to logged-out visitors.

### F. Post types
- In Settings → "Allow Listening For Post Type", switch to Page / Product and
  re-run the relevant playback/selector tests on that type.

## TTS-258 change checklist (current branch)

- [ ] Front-end source contains no `/wp-admin` path / no `ttsObj.pro` (privacy).
- [ ] Listening defaults stay correct when switching from an MP3 player to a
      browser player (no Speed 5.1 / Volume 0.5 / unselected Pitch).
- [ ] Pro: translated title read; content in correct language; default-language
      reload works; no player UI spoken (GTranslate).
- [ ] Finish step: summary cards gone; single "Explore all AtlasAiDev plugins"
      button → Other Plugins page; "Upgrade to Pro" sky-blue (free).
- [ ] Wizard Step 3 previews open the demo page; Step 5 preview button speaks at
      90% width with white-bg/black-text defaults (free).
- [ ] All Pro upgrade links carry UTM (`utm_medium=onboarding` in wizard,
      `plugin_admin` elsewhere; per-site `utm_content`).
- [ ] "Show Staging / Live indicator in toolbar" is ON by default.
- [ ] Docs links / "Docs" pill point to the new docs URL.

## Known harness limitations (learned)

- **`speechSynthesis` needs a real user gesture** — an automated click doesn't
  start audible playback. Verify the player by reading the console log of the
  extracted text (title + body) instead of relying on audio.
- **Admin-bar "Revert to staging" / "Go Live" use native `confirm()` dialogs**
  that freeze browser automation (CDP times out). Verify Go Live via the wizard
  ("Go Live now" → "You're live!") or have the user click through the admin-bar
  popup manually (type `GO LIVE`).
- **Settings toggles are visually-hidden checkboxes** — click the visible switch
  by coordinate, not the input; confirm state via the input's `.checked`.
- **Pro deactivation triggers a Freemius feedback modal** — choose "I rather
  wouldn't say" to deactivate without submitting.
- **Deploy/opcache lag:** cors2 may run a build behind the latest commit; verify
  the specific change is present before reporting a failure (e.g. the default-ON
  indicator wasn't effective even though the doc-links/UTM commits were).
- **GTranslate (cookie-mode) doesn't translate under automation** — Google's
  client widget won't init. Force it with `document.cookie='googtrans=/en/<lang>'`
  + reload to translate, but note this changes capture *timing* vs a real click
  (so a "translated content not read" result may be a timing artifact — confirm
  manually). To reset language, use the **widget's English option** (JS cookie
  deletion is unreliable — the cookie persists at a path JS can't clear).
- **Pro content cache** lives in sessionStorage `tts_pro_stored_content`
  (`{content, language, url, translations}`); the player logs the exact read
  text to the console — use both to verify capture.

## Release process (git flow)

**Trigger:** only run this when the user says **"start release process"** with the
version numbers. Runs for **one release at a time**, across **both** plugins
together (free `text-to-audio` and Pro `text-to-audio-pro`). The user supplies the
versions per plugin (e.g. free `2.3.2`, Pro `3.4.3`).

Do all steps, in this order. Use `GIT_MERGE_AUTOEDIT=no` so no editor opens.

1. **Finish the feature branch** (both): `git flow feature finish <TICKET>` — merges
   `feature/<TICKET>` into `develop`. If the only blocker is LF/CRLF churn on
   built/minified files, discard it with `git checkout -- <files>` first; never
   discard real changes without asking.
2. **Start the release branch** (both): `git flow release start <version>` — creates
   `release/<version>` from `develop` (free = its version, Pro = its version).
3. **Build** (both): `npm run production`.
4. **Bump the version + changelog + upgrade notice** (both):
   - Version in every version-bearing file: plugin main-file header, the version
     constant, and the readme `Stable tag`. Grep the old version to catch them all
     (exclude `vendor/`, `node_modules/`, `*-lock.json`, build output).
   - **Changelog:** add a new entry at the top, matching the existing format and
     date style. **Short, plain, human-readable — what changed for the user.** No
     technical/code detail, no file names, no ticket numbers.
   - **Upgrade notice:** a matching entry in the same plain style.
5. **Clear the production folder** (both) — remove the old contents of `production/`.
6. **Build the release zip** (both): `npm run makeZip` — creates the plugin zip
   inside `production/`.
7. **Commit** (both) with the message being **only the version string** (e.g.
   `2.3.2` for free, `3.4.3` for Pro).

**Stop after that commit.** Do NOT run `git flow release finish`, tag, or push
unless the user explicitly asks.

### Finishing & publishing the release

Only when the user explicitly asks to finish/publish (a separate step from the
build above). Do this for **both** plugins, with each plugin's version.

1. **Clean the working tree** so branch checkouts don't fail:
   - Discard LF/CRLF churn on built/minified files: `git checkout -- <files>`.
   - **Free only:** temporarily revert the local `TTA_ENABLE_RESET_UI` debug
     toggle in `text-to-audio.php` (it would block the checkout); restore it
     after the push.
2. **Finish the release:** `GIT_MERGE_AUTOEDIT=no git flow release finish -m "<version>" <version>`
   — merges `release/<version>` into **main** and **develop**, creates tag
   `<version>`, and deletes the release branch. `-m` supplies the tag message so
   no editor opens.
3. **Push everything:** `git push origin main`, `git push origin develop`,
   `git push origin --tags` (or `git push origin main develop --follow-tags`).
4. **Free only:** restore the local `TTA_ENABLE_RESET_UI` debug toggle.

## Reporting

For each area: state pass/fail with the concrete evidence (screenshot, console
line, session-storage value, network call). Group results free vs Pro.
