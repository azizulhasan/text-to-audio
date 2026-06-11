=== Text To Speech TTS Accessibility ===
Contributors: atlasaidev, hasanazizul
Donate link: http://atlasaidev.com/
Tags: accessibility, speech, tts, text to speech, text to audio
Requires at least: 5.6
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 2.2.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.txt

Free text to speech with browser voices + premium AI voices from Google, OpenAI & ElevenLabs. Add an audio player to any WordPress post.

== Description ==

**AtlasVoice — Text To Speech TTS Accessibility** is a user-friendly text-to-speech plugin for WordPress and WooCommerce. Convert any post, page, or product description into natural-sounding audio with one click. The free version uses the browser's built-in speechSynthesis engine — no account, no API key, no registration. Upgrade to Pro for AtlasVoice's own AI voice engine, **Google Cloud TTS**, **OpenAI TTS**, or **ElevenLabs TTS**.

**No Registration, No Account, No API required for the free version.**

### How It Works

1. Install & activate — the audio player appears automatically on selected post types.
2. Choose a voice — free browser voice, or a Pro AI provider (Google, OpenAI, ElevenLabs, AtlasVoice TTS Pro).
3. Customize and publish.

### Free Version — Key Features

* 20–300+ browser voices via the browser's built-in [speechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
* Shortcode `[atlasvoice]` and a Gutenberg block.
* Analytics dashboard — play counts, pause events, engagement.
* Text aliases — replace abbreviations with spoken equivalents.
* Unlimited TTS — no character limits, no monthly quotas.
* Full customization — color, size, border, hover, custom CSS.
* Cross-device — works on desktop, tablet, mobile.
* Custom post types — WooCommerce, ACF, CPT UI, Toolset Types.
* Caching/multilingual compatible — Autoptimize, LiteSpeed, WP Rocket, W3TC, SG Optimizer, WPML, Polylang, TranslatePress.

### AtlasVoice Pro adds

AI voice providers (AtlasVoice TTS Pro, Google Cloud, OpenAI, ElevenLabs), bulk MP3 generation, downloadable MP3 audio, Google Cloud Storage backup, JSON-LD audio schema, scheduled email reports, advanced analytics. See [AtlasVoice Pro](https://atlasaidev.com/plugins/text-to-speech-pro/).

### Useful Links

[Pro](https://atlasaidev.com/plugins/text-to-speech-pro/) · [Pricing](https://atlasaidev.com/pricing/) · [Demo](https://atlasaidev.com/plugins/text-to-speech-pro/demo/) · [Docs](https://atlasaidev.com/docs/) · [Tutorials](https://www.youtube.com/@atlasaidev) · [Contact](http://atlasaidev.com/contact-us/)

== Installation ==

1. From your WordPress admin, go to **Plugins > Add New**. Search for "Text To Speech TTS Accessibility". Click **Install Now** and then **Activate**.
2. Alternatively, download the plugin from the WordPress Plugin Repository, go to **Plugins > Add New > Upload Plugin**, upload the zip file, and activate it.
3. Go to the **Text To Speech** menu in your admin sidebar and configure your settings.
4. The audio player will appear automatically on your selected post types.

**For Pro version:**

5. Purchase [AtlasVoice Pro](https://atlasaidev.com/plugins/text-to-speech-pro/) and install it as an add-on alongside the free version.
6. Go to **Integration** menu to connect your preferred AI voice provider (Google Cloud TTS, OpenAI, or ElevenLabs).
7. Go to **Customization** menu to select your preferred player style.
8. Go to **Listening** menu to choose your voice, language, speed, and pitch settings.


== Frequently Asked Questions ==

= Does Text To Speech support all Android phones? =
Yes, Text To Speech supports all Android phones. The free version uses the browser's [speechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis), which varies by browser and device. Voices and languages may differ depending on the browser used. The [Pro version](https://atlasaidev.com/plugins/text-to-speech-pro/) eliminates this limitation by using server-side AI voice providers (Google Cloud, OpenAI, ElevenLabs), delivering consistent, high-quality audio across all devices and browsers.

= Does Text To Speech support my language? =
The Pro version supports [81+ languages](https://wordpress.org/plugins/text-to-audio/#:~:text=PRO%20SUPPORTED%20LANGUAGES%3A) with premium AI voices. Google Cloud TTS supports 90+ languages, and ElevenLabs offers multilingual voice models. The free version supports languages available through your [browser's speech synthesis engine](https://wordpress.org/plugins/text-to-audio/#:~:text=based%20on%20device.-,SUPPORTED%20LANGUAGES,-%3A).

= Does it work with WooCommerce? =
Yes! AtlasVoice works on all WooCommerce pages — product pages, shop pages, and any page with WooCommerce content. Product descriptions, custom fields (via ACF), and any visible text can be converted to audio. Bulk MP3 generation also works for WooCommerce products.

= What is Google Cloud Text To Speech and how do I set it up? =
[Google Cloud Text To Speech](https://cloud.google.com/text-to-speech) is Google's premium AI voice service offering 300+ voices across 90+ languages, including Neural2 and WaveNet voice types. To set it up: (1) Create a Google Cloud account, (2) Enable the Text-to-Speech API, (3) Create a service account and download the JSON key file, (4) Upload the JSON file in **AtlasVoice > Integration > Google Cloud TTS**. Google Cloud TTS is a paid service — you will be billed by Google based on the number of characters processed.

= What is ChatGPT (OpenAI) Text To Speech? =
[OpenAI Text To Speech](https://platform.openai.com/docs/guides/text-to-speech/overview) offers natural-sounding AI voices powered by the same technology behind ChatGPT. Choose from 6 voices (Alloy, Echo, Fable, Nova, Onyx, Shimmer) with Standard (tts-1) or HD (tts-1-hd) quality. To set it up: (1) Create an OpenAI account, (2) Generate an API key, (3) Enter the API key in **AtlasVoice > Integration > ChatGPT TTS**. OpenAI TTS is a paid service — you will be billed by OpenAI based on usage.

= What is ElevenLabs Text To Speech? =
[ElevenLabs](https://elevenlabs.io/) offers the most realistic AI voices available, with human-like intonation, emotion, and expression. Access 100+ premium voices with fine-tuning controls for stability, similarity boost, style exaggeration, and speed. To set it up: (1) Create an ElevenLabs account, (2) Get your API key from your profile, (3) Enter the API key in **AtlasVoice > Integration > ElevenLabs TTS**. ElevenLabs TTS is a paid service — you will be billed by ElevenLabs based on character usage.

= Can I back up MP3 files to Google Cloud Storage? =
Yes! The Google Cloud Storage backup feature works with **all** TTS providers — Google Cloud TTS, ChatGPT TTS, AtlasVoice TTS Pro, and ElevenLabs TTS. Even if you use ElevenLabs for voice generation, you can store the MP3 files in Google Cloud Storage. You need to configure a Google Cloud service account JSON file with Storage Admin permissions from the **Integration** menu.

= Does audio content help with SEO? =
Yes! Audio content improves SEO in several ways: (1) **Increased dwell time** — visitors stay longer on pages with audio, which is a positive Google ranking signal. (2) **Reduced bounce rate** — audio engagement keeps users on your site. (3) **Audio Schema markup** (Pro) — AtlasVoice generates JSON-LD structured data that helps search engines understand your audio content, potentially enabling rich results in Google Search. (4) **Accessibility compliance** — Google increasingly favors accessible websites in its rankings.

= Is this plugin WCAG / ADA compliant? =
AtlasVoice helps your website meet WCAG 2.1 (Web Content Accessibility Guidelines) and ADA (Americans with Disabilities Act) requirements by providing audio alternatives to text content. This is a key component of web accessibility, especially for users with visual impairments, dyslexia, or cognitive disabilities.

= Can I use different AI voices on different posts? =
The voice and language settings from the **Listening** menu apply globally. However, you can override the voice and language for individual posts using the shortcode: `[atlasvoice lang="en-GB" voice="Google UK English"]`. This gives you the flexibility to use different voices for different content.

= Does Text To Speech support multilingual plugins? =
Yes, the [Pro version](https://atlasaidev.com/plugins/text-to-speech-pro/) fully supports **WPML**, **TranslatePress**, **GTranslate**, and **Polylang**. The audio player automatically detects language changes and adjusts the voice accordingly.

= Does Text To Speech support custom post types? =
Yes, both the free and [Pro version](https://atlasaidev.com/plugins/text-to-speech-pro/) support custom post types. The plugin integrates with ACF (Advanced Custom Fields), Custom Post Type UI, and Toolset Types.

= Content is missing from the audio playback. How do I fix it? =
You have several options: (1) **Enable "Read Content from DOM"** in Settings — this reads content directly from the page, capturing dynamically generated content. (2) **Add CSS Selectors** (Pro) — target specific elements to include in playback. (3) **Use filters** — add content programmatically via the `tta__content_description` filter. (4) **Use the shortcode** — wrap specific content with `[atlasvoice]Your content here[/atlasvoice]`.

= Can I exclude certain words or HTML tags from being read aloud? =
Yes! In the [Pro version](https://atlasaidev.com/plugins/text-to-speech-pro/): (1) Go to **Settings > Exclude Texts To Speak** to exclude specific words or phrases (separate with pipe |). (2) Go to **Settings > Exclude Tag's Content** to skip content inside specific HTML tags like `code` or `blockquote` (separate with pipe |). (3) Exclude by post ID, category, or tag for broader content control.

= How do I add a button in the Gutenberg block editor? =
Open the Gutenberg block editor, search for the "Customize Button" block, add it to your content, and customize the appearance (color, background, width, CSS).

= How do I change the button text? =
**Method 1 — Shortcode:** `[atlasvoice listen_text="Listen" pause_text="Pause" resume_text="Resume" replay_text="Replay"]`

**Method 2 — Filter (overrides shortcode):**
`
add_filter('tta__button_text_arr', 'tta__button_text_arr_callback');
function tta__button_text_arr_callback($text_arr) {
	return [
		'listen_text' => 'Listen',
		'pause_text'  => 'Pause',
		'resume_text' => 'Resume',
		'replay_text' => 'Replay',
		'listen_hover_title' => 'Click to listen',
		'pause_hover_title' => 'Click to pause',
		'resume_hover_title' => 'Click to resume',
		'replay_hover_title' => 'Click to replay',
	];
}
`

= How do I change the button background and text color? =
Go to the **Customization** menu in the plugin dashboard to adjust button background color, text color, hover effects, and border radius. You can also customize these via the Gutenberg "Customize Button" block.

= How do I change voice and language via shortcode? =
Use the `lang` and `voice` attributes: `[atlasvoice lang="en-GB" voice="Google UK English"]`

= Where do I report security bugs found in this plugin? =
Please report security bugs through the [Patchstack Vulnerability Disclosure Program](https://patchstack.com/database/vdp/e8df1af0-74f2-41c7-bb59-d72a3898e234). The Patchstack team will assist with verification, CVE assignment, and notify the developers.


== Screenshots ==
1. Default audio player on a blog post.
2. Default Pro audio player with enhanced controls.
3. AtlasVoice TTS Pro modern audio player with progress bar and download.
4. Settings page with content controls, exclusions, and post type selection.
5. Post editor with individual TTS content customization.
6. Integration menu — Google Cloud TTS, ChatGPT TTS, and ElevenLabs TTS setup.
7. Customization menu — choose from 6 player styles.
8. Listening menu — voice, language, speed, pitch, and ElevenLabs advanced controls.
9. Player customization — colors, width, border radius, and margin settings.
10. Analytics dashboard — engagement funnel, device types, and listening trends.
11. Bulk MP3 generation from the WordPress posts list.
12. Google Cloud Storage backup configuration.
13. ElevenLabs usage tracking with character count and subscription details.
14. Multilingual support GTranslate/WPML/TranslatePress
15. Analytics CSV, PDF, Email Schedule, Custom Search, Summery
16. Analytics Location, Top Cities, Playing Trend.
17. Analytics Peak Listening Hours, Popular Post.
18. Text to Speech Aliases
19. Add ACF Fields To Posts



== Source code ==

The complete, unminified source code for this plugin is published on
GitHub at https://github.com/azizulhasan/text-to-audio under the
GPLv3 license (the same license as the distributed plugin). The git
tag matching the wp.org plugin version (for example, tag `2.1.20`
for plugin version 2.1.20) reflects the exact source used to produce
the wp.org release ZIP.



== External services ==

This plugin connects to a number of third-party services. Each one is
described below — what it is, what data is sent, when it is contacted,
and links to the provider's Terms of Use and Privacy Policy.

= AtlasAiDev Tracker (track.atlasaidev.com) =

**Off by default. Opt-in.** Nothing is sent to this service unless the
site administrator explicitly opts in to usage tracking from the
consent notice shown by the plugin. The choice is stored in the
WordPress option `text-to-audio_allow_tracking` (`'yes'` to enable,
`'no'` / unset to disable) and can be revoked at any time, after which
no further requests are made.

When opted-in, the service receives usage telemetry — plugin version,
active WordPress / PHP version, site language, which AtlasVoice
features are enabled, the site name and URL, the administrator email,
and the site's outbound public IP address (resolved via icanhazip.com;
see the Geolocation entry below for that provider's links). This is
used by AtlasAiDev to understand which features matter to users and to
prioritise improvements. No website visitor / listener data is sent to
this service.

Service provided by AtlasAiDev:
- Terms and Conditions: https://atlasaidev.com/terms-and-conditions/
- Privacy Policy: https://atlasaidev.com/privacy-policy/

= AtlasAiDev plugin catalog (raw.githubusercontent.com) =

When the site administrator opens the "Other AtlasAiDev Plugins" admin
page (and only then), the plugin fetches a small JSON catalog from
`https://raw.githubusercontent.com/atlasaidev/plugins/main/plugins.json`
so the listing reflects the current set of AtlasAiDev plugins without
needing a plugin update for every catalog change. The fetch is gated
to that admin screen, requires the `manage_options` capability, and
the screen shows an on-page notice describing the request before the
user sees the catalog. No user or site data is sent beyond standard
HTTP headers added by WordPress. The catalog is cached locally for
24 hours.

Service provided by GitHub, Inc.:
- Terms of Service: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement

= Translation downloads (api.github.com, raw.githubusercontent.com) =

To keep the plugin ZIP small, translation files (`.mo`) are not
bundled — they are downloaded on demand from the public translation
repository at `https://github.com/azizulhasan/atlasaidev-translations`.

The plugin contacts two GitHub endpoints:

1. `https://api.github.com/repos/azizulhasan/atlasaidev-translations/contents/atlasvoice/<locale>` — to list the available files for the active site locale.
2. `https://raw.githubusercontent.com/azizulhasan/atlasaidev-translations/main/atlasvoice/<file>` — to fetch each `.mo` file referenced by that listing.

The only data sent is the WordPress locale code (for example `es_ES`,
`pt_BR`) as part of the URL. No user-identifying information, site
URL, or admin email is transmitted. The download is triggered:

* On plugin activation, for the site's current locale.
* When the site language is changed in **Settings → General**.
* The plugin skips the download entirely if a `.mo` for the locale
  already exists in the plugin's `languages/` folder.

Service provided by GitHub, Inc.:
- Terms of Service: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement

= Geolocation lookups (ip-api.com, ipinfo.io, icanhazip.com) =

**Off by default. Opt-in.** No request is ever sent to any of these
services until the site administrator turns on the **"Show listener
location in analytics"** toggle inside **AtlasVoice → Analytics**
(visible only once the parent "Enable analytics" toggle is on). When
the toggle is off, the dashboard simply shows "Unknown" for location
fields and the helpers below short-circuit before any network call.

When enabled, the analytics dashboard displays where listeners are
located by resolving the listener's public IP address to country /
region / city via:

1. `https://icanhazip.com/` — used once per session to determine the
   site's outbound public IP, so the rest of the plugin can call the
   geolocation services with the right address.
2. `http://ip-api.com/json/<ip>` — primary geolocation lookup.
3. `https://ipinfo.io/<ip>/json` — fallback when ip-api.com returns an
   error or rate-limits.

Only the listener's IP address is sent. Geolocation responses are
stored against the play event in the local analytics table.

Services:
- ip-api.com — Terms: https://ip-api.com/docs/legal, Privacy: https://members.ip-api.com/privacy-policy
- ipinfo.io — Terms: https://ipinfo.io/terms-of-service, Privacy: https://ipinfo.io/privacy-policy
- icanhazip.com — https://major.io/p/a-new-future-for-icanhazip/

== Changelog ==

### TRANSLATION REQUEST
We are looking for people to help translate this plugin. If you can help, we would love to hear from you.
Help us and the WordPress community translate the plugin. [Contact us](http://atlasaidev.com/contact-us/) and we'll guide you through the process.


= 2.2.4 ( 11 Jun 2026 ) =
Fixed : Plyr-backed Pro player (players 3-6) could appear blank/invisible until the first user interaction on sites running Perfmatters with the "Remove Unused CSS" (RUCSS) feature enabled. Perfmatters was rewriting our two stylesheets (`text-to-audio-pro.css`, `plyr.min.css`) to `data-pmdelayedstyle` and only swapping the real `href` back after a mousemove / scroll / touch, so the widget rendered without any styles in the meantime.
Improved : `TTA_Hooks::init_cache_compatibility()` now also subscribes to `perfmatters_rucss_excluded_stylesheets` so the TTS/Pro stylesheets stay as ordinary `<link href>` tags at page load.

= 2.2.3 ( 31 May 2026 ) =
Improved : The Dashboard widget's "Minutes Listened" and "Top Post Today" statistics are now shown to every user (previously hidden unless the premium add-on was active).
Improved : Removed the remaining audio-file features from the free plugin — the AudioObject (JSON-LD) schema generator and all MP3 file-URL handling now live entirely in the AtlasVoice Pro add-on, because they require a generated audio file that the free browser-voice player does not produce. The free plugin no longer contains any functionality that is limited unless the add-on is active.
Improved : The premium voice-provider integrations (Google Cloud TTS, ChatGPT, ElevenLabs) — their setup screen, API-key forms, and authentication checks — now live entirely in the AtlasVoice Pro add-on. The free plugin shows an upgrade prompt in their place; no provider or API-key code ships in the free build.
Improved : Player responsiveness — the player now flows with your theme's content width on all screen sizes.
Improved : The Listening tab's premium voice settings — provider voices, voice/language selection for the AI players, and the multilingual voice-to-language mapping — now live entirely in the AtlasVoice Pro add-on. The free plugin keeps the default browser-voice player's listening settings and, when a translation plugin (GTranslate, WPML/SitePress, TranslatePress, Polylang) is detected, shows an upgrade prompt in place of the mapping UI.
Fixed : After the AtlasVoice Pro add-on is deactivated, the Customize tab now reliably reverts a previously selected premium player back to the Default player and saves it. Previously the saved premium player id stayed selected, so "Default" could not be re-saved.
Improved : Analytics now tracks all your posts — the previous 20-post tracking cap has been removed from both the dashboard and the setup wizard. New and existing installs default to tracking every post.
Added : If the AtlasVoice Pro add-on is active but older than the version that hosts the screens moved out of the free plugin, the dashboard now shows a notice prompting you to update the add-on so those screens keep working.

= 2.2.2 ( 31 May 2026 ) =
Improved : Custom button CSS now uses the WordPress Customizer's built-in "Additional CSS" panel (Appearance → Customize → Additional CSS) instead of a separate plugin field. Any CSS you previously saved in the plugin's Custom CSS box is migrated there automatically on update — nothing to re-enter.
Improved : The player now renders in the normal page DOM (light DOM) so your theme styles and Customizer Additional CSS apply to it directly.
Improved : Moved all remaining inline `<style>` and `<script>` output to properly enqueued stylesheets and scripts, for full WordPress.org plugin-guideline compliance and better caching-plugin compatibility.
Improved : Retired the legacy player markup and redundant wrapper elements, leaving a flatter, lighter player structure.

= 2.2.1 ( 24 May 2026 ) =
Improved : Removed ~1,100 lines of premium-feature code from `api/AtlasVoice_Analytics.php` that the free build no longer needs — the heatmap, CSV/PDF export, scheduled-report save/get, and PDF-render handlers now live exclusively in AtlasVoice Pro 3.3.0 under the `tta_pro/v1/` REST namespace. No behavior change for free users; the free dashboard continues to show heatmap / export / scheduled-report sections only when Pro is active.
Improved : Trimmed three legacy / vestigial handlers from the free analytics class (`track_old`, `insights_old`, `report`, plus deprecated `send_test_report`, `generate_and_send_report`, and `build_report_email` shims) that no live code path was calling.
Improved : Updated `TTA_Api_Routes` doc comments to point to the correct `tta_pro/v1/` namespace for the premium analytics endpoints.

= 2.2.0 ( 22 May 2026 ) =
Improved : The free plugin is now fully functional on its own — premium player options, button positions, voice integrations, and advanced analytics are presented as upgrade prompts instead of locked controls.
Fixed : Removed external sample-audio requests from the dashboard; previews now use your browser's built-in voices.

= 2.1.20 ( 15 May 2026 ) =
Improved : Plugin card titles on the "Other AtlasAiDev Plugins" page now prefer the canonical WordPress.org title (via the public plugin info API), so cards mirror the wp.org listing instead of locally-configured names.
Added : New-brand fallback names (AtlasAI, AtlasML) for sibling plugins when WordPress.org returns no name.
Added : "Start Trial" CTA button on every sibling plugin card; the TTS card itself still shows the plain "Learn More" link.

= 2.1.19 ( 10 May 2026 ) =
Fixed : running schema for free version issue fixed.
Fixed : invalid schema issue fixed.

= 2.1.18 ( 03 May 2026 ) =
Fixed : Default Pro player visual countdown now correctly pauses on tab switch and resumes from the saved position (previously it kept ticking after auto-pause and reset to 0 on auto-resume).
Fixed : Default Pro player no longer auto-resumes after the user intentionally clicks pause and switches tabs (intent flag now set on the React click handler, matching the free button).
Improved : Inline documentation for the Chrome SpeechSynthesis pause/cancel workaround in `admin/js/TextToSpeech.js` and the React → speech-engine bridge in the Default Pro component.
Improved : `pause()` cancel-interval raised from 1ms to 50ms so Chrome has time to enter the paused state before cancel fires (previously could be swallowed mid-transition).
Fixed : Build script `npm run copyProButton` was writing the synced bundle to a nested folder the Pro plugin never read; now drops it directly in the destination.

= 2.1.17 ( 26 Apr 2026 ) =
Added : Customize → "Button Texts & Icons" section for Default and Default Pro players — edit per-state text (Listen / Pause / Resume / Replay), pick from 8 icon presets or paste custom SVG, set hover tooltips, and reset per-state or all at once.
Added : Live preview on the Customize page now renders the same DOM and CSS as the front-end button and is functional via the SpeechSynthesis API for the Default player.
Added : ElevenLabs voice search auto-resolves a 20-character voice ID typed into the search box (fetches `/elevenlabs_voice` and selects/previews the result).
Improved : ElevenLabs voice list is now language-scoped (cache key `tts_elevenlabs_voices_{lang}`); switching language fires exactly one fetch, reloads with hot cache fire none.
Improved : Default Pro front-end button now honors user-customized `border`, `border-radius`, `height` and `font-size` from the Design Customization settings (previously fell back to defaults).
Improved : Per-player icon swap on lifecycle events (Listen → Pause → Resume → Replay) honors saved per-player custom SVGs on both front-end and dashboard preview.
Fixed : Right-click on the Default-player button no longer renders a thin black rectangle around the wrapper (host-element focus outline suppressed via `:host(:focus)` rule).
Fixed : Sound-wave icon on Default Pro no longer overflows past the button's right border (`box-sizing: border-box` on `.tts__player`).
Fixed : Clicking the Default Pro front-end button no longer destroys the React-rendered player tree (`displayButtonText` gated to player 1 only — player 2 swaps state via React).
Fixed : Default Pro icons now render correctly across all four lifecycle states (resume state was previously aliased to listen).
Fixed : CDN/CORS detector now reports script failures correctly — the previous HEAD verification was itself CORS-blocked on the exact failure mode we needed to detect, suppressing the admin notice.
Removed : Accent dropdown from the Listening tab (ElevenLabs voice library has at most one accent per language; `accent_locale` no longer needed).

= 2.1.16 ( 18 Apr 2026 ) =
Improved : Content extraction with better special character and whitespace handling.
Improved : CSS selector exclusion for more precise content selection.
Improved : UTF-8 and multilingual content safety in text processing.
Improved : Bulk MP3 generation reliability and script loading.
Added : AtlasAiDev plugins discovery page.
Added : Maintenance tab (Pro-only) for cleaning up orphan per-batch temp MP3 files.
Added : CDN / CORS troubleshooting guide in the Docs tab with Apache and nginx snippets.
Added : Automatic CDN/CORS detector — warns you in the dashboard when a visitor's browser blocks our scripts on your CDN.
Added : ElevenLabs support in Bulk MP3 generation.
Fixed : Figure / figcaption / aside text no longer leaks into generated audio.
Fixed : Stale Cloudflare MP3 cache — audio URLs now include filemtime cache-buster.
Fixed : Cloudflare Rocket Loader breaking lazy-loaded dashboard chunks.
Fixed : Dashboard crash when switching between players with different voice schemas.
Fixed : CORS-alert endpoint now validates URL before throttle check, returning proper 400 errors.

= 2.1.15 ( 15 Apr 2026 ) =
Fixed : Memory exhausted issue fixed.
Fixed : Double track issue fixed.


= 2.1.14 ( 06 Apr 2026 ) =
Added : Expanded language support to 81 languages for AtlasVoice TTS Pro player.
Added : Polylang multilingual plugin compatibility.
Added : Per-post CSS selector override for custom content selection.
Added : ACF custom field reading order with drag-and-drop reordering.
Added : Automatic content detection for popular themes and page builders.
Improved : Listening settings page split into organized sections.
Improved : Per-post CSS selectors meta box with cleaner design.
Fixed : Content not reading full article when using shortcode mode.
Fixed : Smart quote characters breaking content on PHP 8.4+.
Tested : WordPress 7.0 compatibility.

= 2.1.13 ( 29 Mar 2026 ) =
Added : GPT-4o-mini-TTS voice provider integration with ChatGPT settings UI.
Added : Admin bar toggle setting to show/hide AtlasVoice on/off toggle on front-end pages.
Added : Dashboard widget toggle setting to show/hide Quick Stats widget on the admin dashboard.
Added : Translation support for German (de_DE), French (fr_FR), and Dutch (nl_NL).
Added : On-demand translation download system from GitHub.
Added : Cache compatibility for Perfmatters and Flying Press optimization plugins.
Improved : Centralized cache plugin compatibility into a single method supporting 9 plugins.
Improved : LiteSpeed Cache compatibility — added CSS exclusion and JS defer exclusion filters.
Improved : SG Optimizer compatibility — added CSS minify/combine and JS async exclusion filters.
Improved : Autoptimize compatibility — added CSS exclusion filter.
Improved : WP Rocket compatibility — added delay JS exclusion filter.
Fixed : Milestone notice dismiss not working properly.
Fixed : Duplicate save_post/delete_post hook registrations removed.

= 2.1.12 ( 17 Mar 2026 ) =
Fixed : PHP 7.x parse error caused by named argument syntax in define() call.

= 2.1.11 ( 15 Mar 2026 ) =
Added : "Hear the Difference" wizard step with audio previews for all 5 TTS providers (Browser, GTTS, Google Cloud, ChatGPT, ElevenLabs).
Added : Language-specific preview text for 68 languages in the setup wizard voice step.
Added : ElevenLabs demo audio support in Customize tab.
Added : "Delete Data on Uninstall" toggle with enhanced uninstall cleanup.
Improved : Dashboard code splitting — 66% bundle size reduction using React.lazy() and Suspense.

= 2.1.10 ( 13 Mar 2026 ) =
Fixed: pro activation issue fixed.


= 2.1.9  ( 12 Mar 2026 )  =
Added : Welcome setup wizard with 5 steps (post types, voice, customize, analytics, finish) for new users.
Added : Setup wizard voice step auto-selects the language matching your WordPress site locale.
Added : Smart WordPress.org review prompt for free users after 10+ plays and 7+ days of active usage.
Added : Export/Reports UI exposed in free version with Pro upsell banner.
Improved : Replaced 1.2 MB Font Awesome bundle with a lightweight 3 KB inline SVG icon system.
Improved : Added focus trap and focus restoration to settings modal for WCAG 2.1 AA accessibility.
Improved : Added database indexes on analytics table for faster query performance.
Improved : Optimized autoload flags across all plugin options to reduce memory usage on every page load.
Fixed : Scheduled email reports not firing due to timezone mismatch in cron scheduling.
Changed : Email report sending moved to Pro plugin for better architecture separation.

= 2.1.8  ( 10 Mar 2026 )  =
Added : Plugin translation for Portuguese.
Added : Plugin translation for Italian.
Added : Pro version activation issue fixed.


= 2.1.7  ( 05 Mar 2026 )  =
Added :  ElevenLabs TTS integration added for pro version.
Added :  Google Cloud Storage backup support for all TTS providers (Google Cloud TTS, ChatGPT TTS, ElevenLabs TTS, AtlasVoice TTS Pro).
Added :  Real-time usage tracking for ElevenLabs TTS subscription.
Fixed :  Gtranslate plugin translation issue solved.
Fixed :  Improved Multilingual.
Fixed :  MP3 file delete issue solved.


= 2.1.6  ( 28 Feb 2026 )  =
Added :  Enable TTS Status added in Settings.
Improved :  AtlasVoice Gutenberg block improved.


= 2.1.5  ( 21 Feb 2026 )  =
Added :  Plugins Menu added.
Fixed :  License activation issue fixed.
Fixed :  Old UI for player option missing issue fixed.
Fixed :  Listening menu UI missing issue fixed.


= 2.1.4  ( 17 Feb 2026 )  =
Added :  New UI for Default player.
Added :  Old UI back option added for Default player.
Added :  New Analytics UI introduced.
Added :  Select language, voice, pitch, mute option added in Default player.
Fixed :  Missing Customization UI added.
Fixed :  Content split issue fixed. (Pro)
Fixed :  Player floating issue for all themes. (Pro)


= 2.1.3  ( 10 Feb 2026 )  =
Fixed :  MP3 player loading issue fixed.
Added :  Default Pro player progress bar clickable.
Added :  Default Pro player UI improved.
Added :  Select language, voice, pitch, mute option added in Default Pro player.


= 2.1.2  ( 28 Jan 2026 )  =
Fixed :  Count issue fixed in TTA_Helper class.
Added :  Filter system added in posts list page.
Added :  Whether MP3 is generated column added. (Pro)
Added :  TTS enabled or not column added.
Introduced :  New UI introduced for Aliases.
Updated :  Freemius version update.
Fixed :  Duplicate post issue fixed.


= 2.1.1  ( 18 Jan 2026 )  =
Added :  ID attribute support for shortcode `[atlasvoice id='post_id']`.
Added :  Audio Schema markup for pro version (SEO).
Added :  Read Content from DOM feature. (Pro)


= 2.1.0  ( 13 Jan 2026 )  =
Improved :  Integration menu UI improved.
Improved :  Customization menu UI improved.
Improved :  Listening menu UI improved.


= 2.0.1  ( 28 December 2025 )  =
Notice added :  Translation help notice.
Notice added :  Holiday deal notice.


= 2.0.0  ( 13 December 2025 )  =
Introduced :  Complete new UI introduced.


== Upgrade Notice ==

= 2.2.4 =
Fixes the Pro player (players 3-6) showing as blank until first mouse movement on sites using Perfmatters' Remove Unused CSS (RUCSS) feature. Update recommended if you use Perfmatters.

= 2.2.3 =
Dashboard stats now show for all users. Audio-file features and the AI voice-provider integrations moved entirely to the AtlasVoice Pro add-on; nothing in the free plugin is gated behind the add-on anymore.

= 2.2.2 =
Custom button CSS moves to the WordPress Customizer's "Additional CSS" panel and is migrated automatically — nothing to re-enter. The player now renders in the normal page DOM, and all inline styles/scripts are properly enqueued for WordPress.org compliance.

= 2.2.1 =
Code-cleanup release: removed ~1,100 lines of unused premium-feature code from the free analytics class. No behavior change for free users; AtlasVoice Pro 3.3.0+ now owns those handlers under its own REST namespace.

= 2.2.0 =
The free plugin is now fully functional standalone; premium features show as upgrade prompts. Dashboard no longer makes external sample-audio requests.

