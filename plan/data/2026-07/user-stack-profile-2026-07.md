# User-Stack Profile — July 2026

> Source: `plan/data/2026-07/tracker-2026-07-11/tracking-details.csv` (consented telemetry payloads),
> deduped to **3,130 unique users/sites** (latest snapshot per email). Full plugin frequency table
> exported to `tracker-2026-07-11/plugin-usage-counts.csv` (10,796 distinct plugins).
> Purpose: replace compatibility guesswork with the measured stack our users actually run.

## 1. Page builders — Elementor IS the environment

| Builder | Share of sites |
|---|---|
| **Elementor** (free 40.4% + Pro 16.5%) | **~41%** (Pro overlaps free) |
| WPBakery family | ~4.5% |
| SiteOrigin | ~1.2% |
| Divi (theme 1.8% + builder 0.2%) | ~2% |
| Avada (Builder/Core) | **~0.7%** |
| Beaver Builder | ~0.7% |
| Bricks / Oxygen / Breakdance | ≲0.2% each |

**⚠ Priority correction:** TTS-260 (Avada grid bug) consumed a full ticket cycle for **0.7% of
users**, while **Elementor — 41% of the base — has no dedicated compatibility test pass.** Every
player/wrapper/markup change should be smoke-tested in Elementor *first*, before anything else.

## 2. The rest of the measured stack

- **Editor: Classic Editor 34.5% + Classic Widgets 11.1%** — a third of users don't live in
  Gutenberg. Shortcode and auto-insert paths must stay first-class; block-editor-only features
  miss ~⅓ of the base.
- **Caching:** LiteSpeed Cache **28.7%** (dominant — matches the 40.6% LiteSpeed servers),
  WP Rocket 7.5%, WP-Optimize 7.0%, W3TC 4.6%, WP Fastest Cache 4.3%, Autoptimize 3.2%,
  SiteGround Optimizer ~2.4%. `TTA_Hooks` covers exactly the right list; LiteSpeed exclusions
  protect nearly 1 in 3 users — never regress them.
- **SEO:** Yoast 37.5%, Rank Math 17.7%, AIOSEO 10.8% — SEO plugins on 2/3 of sites (content-
  marker/meta interactions worth keeping clean).
- **Commerce:** WooCommerce **15.3%** — a solid minority; relevant for AtlasAR cross-sell and
  product-page reading, but not the core audience.
- **Server/PHP:** Apache 45.6% / LiteSpeed 40.6% / nginx 9.4%. PHP: 8.2 = 27.4%, 8.1 = 21.9%,
  **7.4 = 20.3%**, 8.3 = 16.8%, 8.0 = 8.5%, 8.4+ = 5%. **One in five users is still on PHP 7.4** —
  keep the 7.4 minimum for now; PHP-8-only syntax remains off-limits.

## 3. Multilingual — the surprise leader is GTranslate

| Translation stack | Share |
|---|---|
| **GTranslate** | **14.0%** |
| Loco Translate | 6.0% |
| Polylang (free+Pro) | ~2.6% |
| TranslatePress | ~2.5% |
| WPML | ~1.5% |

The multilingual roadmap (TTS-future-multilingual refactor, TTS-231 Polylang work) targets
Polylang/WPML — but **GTranslate has 5× Polylang's install share among our users.** GTranslate
translates the page client-side/proxy-side, which means the TTS engine can read text in a language
that doesn't match the selected voice — very likely an invisible source of "wrong language/voice"
complaints from the churn data. **Add GTranslate to the compatibility matrix before deepening
Polylang/WPML work.**

## 4. Locales — half the base is non-English

en_US 49.6% · **pt_BR 7.2%** · es_ES 5.1% · en_GB 4.6% · id_ID 3.2% · de_DE 3.1% · it_IT 3.1% ·
fr_FR 2.9% · pl_PL 1.7% · tr_TR 1.4% · nl_NL 1.3% · ru_RU 1.2% · ar 1.2% · vi 1.1%

- **~50% of users run non-English WordPress** — voice/language quality is not a feature, it's half
  the market (consistent with churn finding: language gaps are a named uninstall reason).
- **Brazil (pt_BR) is the #2 market** — worth checking pt-BR voice quality + the existing pt_BR
  translation completeness ahead of other locales.

## 5. Themes — no single theme matters, but a *category* does

Top themes: Astra 6.5%, Hello Elementor 5.7%, Newspaper 2.9%, GeneratePress 2.9%, Jannah 1.9%,
Divi 1.8%, Kadence 1.6% — a long tail with nothing above 7%.
The visible cluster: **news/magazine themes** (Newspaper, Jannah, MagazinePlus, NewsUp, SmartMag
≈ 8% combined) → the ICP is **content publishers**, matching the accessibility/TTS value prop.

## 6. Ranked implications

1. **Add an Elementor smoke-test to the release checklist** (41% of users; currently untested per release).
2. **Put GTranslate into the multilingual compatibility matrix** — bigger than Polylang+WPML+TranslatePress combined.
3. **Keep Classic Editor paths first-class** (34.5%).
4. **Don't raise min PHP above 7.4 yet** (20% of base).
5. **pt_BR first** for voice/translation quality investment after English.
6. Weight future compat tickets by this table (e.g. Avada-class issues = fix-on-report, not proactive).

## Method
Latest telemetry snapshot per unique email; plugin/theme/locale/PHP extracted from serialized
payloads by regex; percentages are of 3,130 profiled users. Self-referential rows ("Text To Speech
TTS Accessibility" 90.5%) confirm parsing sanity. Plugin names as reported by WP (free/Pro
variants counted separately unless noted).
