# Release Test Plan — TTS-227 + TTS-231 + TTS-232

**Features:** TTS-227 (GTTS pause fix), TTS-231 (Listening.js split + Polylang), TTS-232 (Content extraction fixes)
**Branch:** `feature/TTS-227` (includes TTS-231 and TTS-232 merged in)

---

## 1. TTS-227: GTTS Player — Mid-Sentence Pause Fix

### 1.1 Basic Audio Generation
- [ ] Generate MP3 with gTTS player (player 3) on a short post (<200 chars) — should work without splitting
- [ ] Generate MP3 with a long post (>2000 chars) — should generate multiple batches and combine
- [ ] Verify MP3 plays without mid-sentence pauses
- [ ] Verify MP3 total duration is correct in the player
- [ ] Verify seeking (clicking progress bar) works correctly — jumps to the right position
- [ ] Verify audio doesn't stop/cut at chunk boundaries

### 1.2 Long Sentence Handling
- [ ] Test with a sentence >200 chars without commas — should split at word boundary, no pause
- [ ] Test with a sentence >200 chars with commas — should split at comma, natural pause
- [ ] Test with "US President Donald Trump, who told The New York Times..." (398 char sentence from ticket) — should split at commas cleanly
- [ ] Verify apostrophes work: "Trump's" should NOT read as "Trump ess"

### 1.3 Language Support
- [ ] Test English (`en`) — basic functionality
- [ ] Test English variant (`en-in`) — should use Indian English voice
- [ ] Test Arabic (`ar`) — RTL language, Arabic punctuation
- [ ] Test Chinese (`zh`) — CJK punctuation splitting (。！？)
- [ ] Test Hindi (`hi`) — Devanagari punctuation (।)
- [ ] Test French (`fr-ca`) — French Canadian voice variant
- [ ] Test a language with uppercase code from old plugin (`en-GB`, `en-IN`) — should resolve correctly

### 1.4 Backward Compatibility
- [ ] Test with old plugin version (without `site_url` in request) — should skip smart splitting, pass through to gTTS
- [ ] Test with new plugin version (with `site_url`) — should use full smart pipeline
- [ ] Verify old plugin users still get working audio (no crashes)

### 1.5 Error Handling
- [ ] Send empty content — should return 400 `{ error: "No text to speak" }`, not crash
- [ ] Send unsupported language (`xyz`) — should return 400 with error message, not crash
- [ ] Disconnect internet while generating — server should stay alive (uncaughtException handler)
- [ ] Send very long filename (>255 chars) — should be truncated by WordPress `tts_file_name()` (player 3 only)

### 1.6 Batch Combination
- [ ] Generate MP3 that produces 2+ batches from WordPress
- [ ] Verify the combined MP3 has correct total duration (not just first batch duration)
- [ ] Verify no pauses at batch join points
- [ ] Verify seeking works across batch boundaries

### 1.7 File Cleanup
- [ ] Verify MP3 files are deleted from server after 10 minutes
- [ ] Verify temp files from FFmpeg are cleaned up
- [ ] Verify debug log files are cleaned up after 24 hours (when TTS_DEBUG=true)

### 1.8 Caching
- [ ] Generate MP3 → request same file again → should return cached file (fast)
- [ ] Generate MP3 → request with `regenerate_file: true` → should create fresh file

---

## 2. TTS-232: Content Extraction Fixes

### 2.1 Shortcode Mode (Original Bug)
- [ ] Disable "Add Button Automatically" in settings
- [ ] Add `[tta_listen_btn]` shortcode to a post
- [ ] Verify TTS reads the FULL article content (not just title)
- [ ] Verify reading time shows correctly (not always "1 minute")

### 2.2 Content Extraction Fallback
- [ ] Test on a theme without `.tts_content_wrapper_X` div — should use `getContentFromCommonSelectors()` fallback
- [ ] Test with Elementor page builder content
- [ ] Test with Gutenberg blocks content
- [ ] Test with classic editor content

### 2.3 ACF Fields
- [ ] Test with ACF custom fields added to TTS content
- [ ] Test ACF field ordering with `tts_acf_custom_order` enabled
- [ ] Verify ACF repeater fields are read correctly
- [ ] Test with empty ACF field names — should be skipped

### 2.4 Per-Post CSS Selectors
- [ ] Set global CSS selectors in plugin settings
- [ ] Override with per-post CSS selectors on a specific post
- [ ] Verify per-post selectors take priority (field-by-field merge)
- [ ] Verify empty per-post fields fall back to global values

### 2.5 Unicode Smart Quotes
- [ ] Test content with smart quotes: "Trump's" → should NOT truncate
- [ ] Test on PHP 8.4+ where `wp_strip_all_tags()` decodes entities to Unicode
- [ ] Verify curly quotes `""''` are handled correctly

### 2.6 Per-Post Settings Override
- [ ] Set different settings per-post via `ttsObj.settings.settings`
- [ ] Verify per-post settings override global settings

---

## 3. TTS-231: Listening.js Split + Polylang

### 3.1 Listening Settings (Split Files)
- [ ] Verify DefaultPlayerSettings loads correctly
- [ ] Verify GoogleCloudSettings loads correctly
- [ ] Verify ElevenLabsSettings loads correctly
- [ ] Verify ChatGPTSettings loads correctly
- [ ] Verify all settings save and persist after page reload

### 3.2 MultiSelect Component
- [ ] Test MultiSelect with null safety — clicking should not crash
- [ ] Verify Google TTS settings MultiSelect works

### 3.3 Polylang Compatibility
- [ ] Install/activate Polylang plugin
- [ ] Create a post in English and translate to another language
- [ ] Verify TTS detects the correct language via Polylang
- [ ] Verify audio generates in the correct language
- [ ] Test with GTranslate (if available) — multilingual detection

### 3.4 Multilingual Detection
- [ ] Test `useMultilingualDetection` hook with Polylang active
- [ ] Test without any multilingual plugin — should fall back to site language
- [ ] Verify language code mapping in `LanguageMapping.js`

---

## 4. GTTS Server (Production Deploy)

### 4.1 Server Health
- [ ] Access `https://gtts.atlasaidev.com/s` — should return `{data: "data"}`
- [ ] Verify Node.js app starts without errors
- [ ] Check `stderr.log` for any startup errors

### 4.2 API Endpoint
- [ ] POST to `/api/gtts` with valid content — should return `{ path, url }`
- [ ] POST to `/api/gtts/v2` with valid content — should return `{ path, url }`
- [ ] Verify response format matches WordPress expectation

### 4.3 FFmpeg
- [ ] Verify `ffmpeg-static` binary works on production Linux server
- [ ] Generate MP3 and verify CBR 64kbps encoding
- [ ] Verify no Xing header in generated MP3s

### 4.4 Language Resolution
- [ ] Send `en-GB` (uppercase) — should resolve to `en-gb`
- [ ] Send `en` (short code) — should work directly
- [ ] Send `cmn-hans-cn` — should resolve (V2 only)

---

## 5. Cross-Feature Integration Tests

### 5.1 gTTS Player + Content Extraction
- [ ] Use gTTS player with shortcode mode — verify full content is read with no pauses
- [ ] Use gTTS player with auto-button mode — verify full content is read
- [ ] Test gTTS with ACF fields content — verify ACF content is included in audio

### 5.2 gTTS Player + Polylang
- [ ] Switch language via Polylang → gTTS should generate audio in the correct language
- [ ] Verify language code is passed correctly from Polylang to gTTS server

### 5.3 Multiple Players
- [ ] Switch from gTTS (player 3) to Google Cloud TTS (player 4) — verify settings load
- [ ] Switch from gTTS to ChatGPT TTS (player 5) — verify settings load
- [ ] Switch back to gTTS — verify it still works

### 5.4 Bulk MP3 Generation
- [ ] Generate MP3 in bulk for multiple posts — verify all complete
- [ ] Verify `splitLongSentences` is NOT called (commented out in bulk-mp3-file.js)
- [ ] Verify batch files are combined correctly

---

## 6. WordPress Plugin UI Tests

### 6.1 Dashboard Settings
- [ ] Open plugin settings page — no JS errors in console
- [ ] Save settings — verify they persist
- [ ] Verify 81 languages show in gTTS language dropdown (updated from 46)

### 6.2 Per-Post Meta Box
- [ ] Open post editor — per-post CSS selectors meta box loads
- [ ] Toggle "Use Own CSS Selectors" — fields show/hide
- [ ] Save per-post settings — verify they persist

### 6.3 OrderableFieldSelector (ACF)
- [ ] Open Compatibility tab — ACF fields show in dual-panel selector
- [ ] Select fields → verify order numbers appear
- [ ] Move fields up/down (Pro only) — verify order changes
- [ ] Save and reload — verify order persists

---

## 7. Regression Tests

- [ ] Browser player (player 1) still works (not affected by TTS-227)
- [ ] Google Cloud TTS (player 4) still works
- [ ] ChatGPT TTS (player 5) still works
- [ ] ElevenLabs (player 6) still works
- [ ] Analytics tracking still works
- [ ] Reading time calculation still works
- [ ] Caching plugin compatibility (Autoptimize, LiteSpeed, WP Rocket) — JS not broken
- [ ] Plugin activation/deactivation — no errors
- [ ] Plugin works on PHP 7.4, 8.0, 8.1, 8.2, 8.4

---

## 8. Production Deployment Checklist

### GTTS Server
- [ ] Upload updated code to `gtts.atlasaidev.com`
- [ ] Run `npm install` on production
- [ ] Verify `ffmpeg-static` installs correctly on Linux
- [ ] Restart Node.js app
- [ ] Test `/s` health check endpoint
- [ ] Test `/api/gtts` with a sample request
- [ ] Monitor `stderr.log` for errors

### WordPress Plugins
- [ ] Update free plugin version number
- [ ] Update pro plugin version number
- [ ] Build free plugin: `npm run production`
- [ ] Build pro plugin: `npm run production`
- [ ] Create release ZIP
- [ ] Test on staging site before live deploy
- [ ] Deploy to WordPress.org (free) and Freemius (pro)
