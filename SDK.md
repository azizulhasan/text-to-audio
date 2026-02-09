# AtlasVoice Free Version SDK - Implementation Plan

## Context

The Text-to-Audio (AtlasVoice) WordPress plugin needs a **JavaScript SDK** so any developer can add text-to-speech to any website. The free version uses browser-side `speechSynthesis` only. The SDK works in **two modes**:
- **Standalone**: Works on any website with zero dependencies
- **Enhanced**: When WP plugin is active on another domain, SDK can send analytics data back to the WP site via authenticated REST API

**Architecture decision (pro vs free SDK):** Pro SDK will **extend** the free SDK. Free SDK is the base class, Pro SDK inherits it and adds server-side TTS providers (gTTS, Google Cloud TTS, ChatGPT). All free features are included in pro automatically via inheritance. This plan implements the **free version only**.

**PHP endpoint correction:** The REST endpoint is **ONLY for cross-domain analytics tracking** — not for fetching content or settings. Content is always read from the DOM client-side. When the SDK is on `abc.com` and the WP plugin is on `xyz.com`, the SDK sends analytics (play, pause, resume, end, listening time, device info) to `xyz.com` via WP REST API with Application Password auth.

---

## Files to Create

```
text-to-audio/
  sdk/
    atlasvoice-sdk.js                  (Main SDK - single file, no dependencies)
    atlasvoice-sdk.css                 (Default player styles)
  api/SDK/
    class-atlasvoice-sdk-endpoint.php  (TTA_SDK\AtlasVoice_SDK_Endpoint - analytics-only endpoint)
```

## Files to Modify

- `text-to-audio/composer.json` — Add `"TTA_SDK\\": "api/SDK"` PSR-4 mapping
- `text-to-audio/text-to-audio.php` — Load `AtlasVoice_SDK_Endpoint` in bootstrap

---

## Step-by-Step Implementation

### Step 1: `sdk/atlasvoice-sdk.js` — The Core JavaScript SDK

**Public API (what the developer uses):**

```js
// STANDALONE MODE - works on any website
const player = new AtlasVoice({
  contentSelector: '#article-body',        // DOM selector to read content from
  playerSelector: '#tts-player',           // DOM selector where player UI renders
  voice: 'Google UK English Female',       // optional, auto-detects if not set
  lang: 'en-GB',                           // optional, auto-detects if not set
  rate: 1,                                 // optional, default 1
  pitch: 1,                                // optional, default 1
  volume: 1,                               // optional, default 1
  highlightText: false,                    // optional, highlight current sentence
  theme: 'default',                        // optional, 'default' | 'minimal' | 'custom'
});

// Play programmatically
player.play();
player.pause();
player.resume();
player.stop();

// Get device voices & languages
player.getVoices();       // returns array of SpeechSynthesisVoice objects
player.getLanguages();    // returns unique languages from available voices

// Change settings dynamically
player.setVoice('Microsoft David - English (United States)');
player.setLang('en-US');
player.setRate(1.5);

// Read custom text (not from DOM)
player.speak('Hello, this is custom text.');

// Events
player.on('play', callback);
player.on('pause', callback);
player.on('resume', callback);
player.on('end', callback);
player.on('error', callback);
player.on('voiceschanged', callback);

// Destroy
player.destroy();


// ENHANCED MODE - SDK on abc.com, WP plugin on xyz.com
// Enables cross-domain analytics tracking only
const player = new AtlasVoice({
  contentSelector: '#article-body',
  playerSelector: '#tts-player',
  analytics: {
    enabled: true,
    wpRestUrl: 'https://xyz.com/wp-json',   // WP site with plugin active
    postId: 123,                              // post ID on the WP site
    credentials: {                            // WP Application Password auth
      username: 'sdk-user',
      password: 'XXXX XXXX XXXX XXXX XXXX XXXX'
    }
  }
});
```

**Internal Architecture of `atlasvoice-sdk.js`:**

The SDK is a self-contained IIFE/UMD module with zero dependencies. Internally it has these components:

#### 1. `AtlasVoice` (Main Class)
```
Properties:
  - options: {}           (merged user options + defaults)
  - speechEngine: null    (SpeechEngine instance)
  - playerUI: null        (PlayerUI instance)
  - contentCleaner: null  (ContentCleaner instance)
  - voiceManager: null    (VoiceManager instance)
  - eventBus: null        (EventBus instance)
  - analytics: null       (AnalyticsTracker instance, only if analytics.enabled)
  - state: 'idle'         (idle|playing|paused)

Constructor(options):
  1. Merge options with defaults
  2. Create EventBus
  3. Create ContentCleaner
  4. Create VoiceManager → load voices from device
  5. Create SpeechEngine (wraps speechSynthesis)
  6. Create PlayerUI → render into playerSelector
  7. If options.analytics.enabled → Create AnalyticsTracker
  8. Extract & clean content from contentSelector

Methods:
  play()       → extracts content, cleans it, passes to SpeechEngine.speak()
                 → if analytics → analytics.trackPlay()
  pause()      → SpeechEngine.pause() (uses cancel-and-track pattern for Chrome)
                 → if analytics → analytics.trackPause()
  resume()     → SpeechEngine.resume() (re-speaks from tracked position)
                 → if analytics → analytics.trackResume()
  stop()       → SpeechEngine.cancel(), reset state
                 → if analytics → analytics.trackEnd()
  speak(text)  → clean text, pass to SpeechEngine
  getVoices()  → VoiceManager.getVoices()
  getLanguages() → VoiceManager.getLanguages()
  setVoice(v)  → VoiceManager.setVoice(v), SpeechEngine.setVoice(v)
  setLang(l)   → VoiceManager.setLang(l), SpeechEngine.setLang(l)
  setRate(r)   → SpeechEngine.setRate(r)
  on(event, cb) → EventBus.on(event, cb)
  destroy()    → stop, remove UI, cleanup listeners, analytics.sendAndCleanup()
```

#### 2. `SpeechEngine` (Wraps speechSynthesis)
Reuses patterns from existing `speak-tts.js` and `TextToSpeech.js`:

```
Properties:
  - synth: window.speechSynthesis
  - utterances: []
  - currentIndex: 0        (tracks current sentence for pause/resume)
  - isCanceled: false
  - timer: null             (Chrome 15-second bug workaround)
  - config: {voice, lang, rate, pitch, volume}

Methods:
  init(config)              → store config
  speak(sentences[])        → create utterance per sentence, attach listeners, speak
  pause()                   → cancel + track current position (existing pattern)
  resume()                  → re-speak from tracked position
  cancel()                  → speechSynthesis.cancel(), clear timers
  setVoice/setLang/setRate/setPitch/setVolume()
  isAndroid()               → UA check (for Chrome bug workaround)

Key behaviors (reused from existing code):
  - Chrome 15-second bug: pause/resume every 10 seconds on non-Android
  - Pause = cancel + track sentence index (existing cancel-and-resume pattern)
  - Resume = re-speak from tracked position
  - Voice loading with retry (10 attempts, 100ms delay)
```

#### 3. `ContentCleaner` (Client-side content cleanup)
Reuses patterns from existing `tta_clean_content()` and `TTA_Helper::sazitize_content()`:

```
Methods:
  clean(rawHTML):
    1. Strip HTML tags (DOMParser → textContent)
    2. Replace HTML entities (smart quotes, &amp;, &rsquo;, etc.)
    3. Remove shortcodes ([shortcode]...[/shortcode] patterns)
    4. Remove URLs (regex)
    5. Remove extra whitespace/newlines
    6. Trim
    Returns: cleaned plain text string

  splitSentences(text):
    Reuses existing pattern: split on . ? ! with pipe delimiter
    Returns: string[] of sentences
```

#### 4. `VoiceManager` (Device voices & languages)
Reuses patterns from `BrowserSupport.js`:

```
Properties:
  - voices: []              (loaded from speechSynthesis.getVoices())
  - currentVoice: null
  - currentLang: null

Methods:
  loadVoices()              → retry pattern (10 attempts) from speak-tts.js
  getVoices()               → returns full voice list from device
  getLanguages()            → extracts unique lang codes from voices
  getVoicesByLang(langCode) → filters voices by lang prefix (regex match)
  setVoice(voiceName)       → finds in voices array, sets currentVoice
  setLang(langCode)         → finds matching voice, sets currentLang
  findBestVoice(lang)       → prefix-based matching from BrowserSupport.js
  getCountryCode(lang)      → splits on '-' or '_', returns base code
```

#### 5. `PlayerUI` (Renders player into container)
```
Properties:
  - container: DOM element
  - elements: {}            (play btn, voice select, lang select, etc.)
  - theme: 'default'

Methods:
  render(container):
    Creates player HTML structure:
    ┌─────────────────────────────────────────┐
    │  ▶ Play  │  Voice: [dropdown]  │  🌐 Lang: [dropdown]  │
    │          progress / status text                         │
    └─────────────────────────────────────────┘

    Elements:
    - Play/Pause/Resume button with SVG icons
    - Voice dropdown (populated from device voices)
    - Language dropdown (populated from device languages)
    - Status text (Playing... / Paused / word count / est. duration)

  updateState(state):
    Updates button icon/text based on state (idle/playing/paused)

  populateVoices(voices):
    Fills voice dropdown with available voices

  populateLanguages(languages):
    Fills language dropdown with available languages

  onVoiceChange(callback):
    Fires when user selects a different voice from dropdown

  onLangChange(callback):
    Fires when user selects a different language from dropdown

  destroy():
    Removes all DOM elements and event listeners
```

#### 6. `AnalyticsTracker` (Cross-domain analytics — reuses AtlasVoiceAnalytics.js patterns)
```
Properties:
  - wpRestUrl: string       (e.g. 'https://xyz.com/wp-json')
  - postId: number          (post ID on the WP site)
  - credentials: {}         (username + application password for WP auth)
  - sessionData: {}         (accumulated events, stored in sessionStorage)
  - listeningLengthInterval: null
  - startTimeTracking: false

Methods:
  trackPlay()     → addEvent('play'), start listening timer
  trackPause()    → addEvent('pause'), stop listening timer
  trackResume()   → addEvent('resume'), start listening timer
  trackEnd()      → addEvent('end'), stop listening timer
  trackDeviceInfo() → collects browser, platform, deviceType, language, timezone, country

  addEvent(eventType, data):
    Reuses existing pattern from AtlasVoiceAnalytics.js:
    - If event already in sessionData → increment count, update timestamp
    - Else → set count=1, timestamp=now
    - device_info is stored as object (not count-based)
    - Saves to sessionStorage key 'atlasvoice_sdk_analytics_data'

  trackListeningLength():
    Reuses existing pattern: setInterval(1000ms) → increment time counter

  sendSessionData():
    POST to {wpRestUrl}/atlasvoice-sdk/v1/track
    Auth: Basic auth with WP Application Password (base64 encoded)
    Body: { user_id, post_id, analytics: sessionData, other_data: {} }
    Uses sendBeacon for Firefox/Safari (beforeunload), fetch+keepalive for Chrome
    Clears sessionStorage after send

  sendAndCleanup():
    Called on destroy() and beforeunload
```

**Analytics data format sent to WP (matches existing `AtlasVoice_Analytics::track()` format):**
```json
{
  "user_id": "fingerprint_hash_or_0",
  "post_id": 123,
  "analytics": {
    "play": { "count": 3, "timestamp": "2025-01-15T10:30:00.000Z" },
    "pause": { "count": 2, "timestamp": "2025-01-15T10:30:05.000Z" },
    "resume": { "count": 2, "timestamp": "2025-01-15T10:30:06.000Z" },
    "end": { "count": 1, "timestamp": "2025-01-15T10:30:30.000Z" },
    "time": { "count": 25, "timestamp": "2025-01-15T10:30:30.000Z" },
    "device_info": {
      "browser": "Chrome_120",
      "platform": "Windows 10",
      "deviceType": "Desktop",
      "architecture": "64-bit",
      "language": "en-US",
      "timeZone": "America/New_York",
      "country": "United States"
    }
  },
  "other_data": {}
}
```

#### 7. `EventBus` (Simple pub/sub)
```
Methods:
  on(event, callback)
  off(event, callback)
  emit(event, data)
```

**Module Format:** UMD (Universal Module Definition) — works with:
- `<script>` tag (exposes `window.AtlasVoice`)
- CommonJS (`require('atlasvoice-sdk')`)
- ES Modules (`import AtlasVoice from 'atlasvoice-sdk'`)

---

### Step 2: `sdk/atlasvoice-sdk.css` — Default Player Styles

Minimal, clean CSS for the player UI. Uses CSS custom properties for easy theming:

```css
:root {
  --av-primary: #184c53;
  --av-bg: #ffffff;
  --av-text: #333333;
  --av-border: #e0e0e0;
  --av-radius: 8px;
  --av-font-size: 14px;
}

.atlasvoice-player { ... }
.atlasvoice-btn { ... }
.atlasvoice-btn:hover { ... }
.atlasvoice-btn svg { ... }
.atlasvoice-select { ... }
.atlasvoice-status { ... }
```

Two themes via classes: `.atlasvoice-theme-default`, `.atlasvoice-theme-minimal`

---

### Step 3: `api/SDK/class-atlasvoice-sdk-endpoint.php` — Cross-Domain Analytics Endpoint

**Purpose:** Receives analytics data from the JS SDK running on external sites. This is the **only** purpose — no content or settings serving.

**Class:** `TTA_SDK\AtlasVoice_SDK_Endpoint`

**Namespace:** `atlasvoice-sdk/v1`

**Single Route:**

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/track` | WP Application Password (Basic Auth) | Receives analytics data from SDK on external sites |

**Auth mechanism:** WordPress Application Passwords (built-in since WP 5.6). Cross-domain requests can't use nonce-based auth (nonces are tied to logged-in sessions). The SDK sends `Authorization: Basic base64(username:app_password)` header. WP automatically authenticates this for REST API requests.

**Permission check:** The endpoint verifies the authenticated user has `read` capability (any valid WP user). This prevents unauthenticated abuse while being permissive enough for SDK-specific users.

**CORS:** Adds `Access-Control-Allow-Origin` header for cross-domain requests. The allowed origin can be configured via `atlasvoice_sdk_allowed_origins` filter.

**`POST /atlasvoice-sdk/v1/track` — receives same format as existing `tta/v1/track`:**

Request body:
```json
{
  "user_id": "fingerprint_or_id",
  "post_id": 123,
  "analytics": { "play": {"count":1,"timestamp":"..."}, ... },
  "other_data": {}
}
```

**Internal logic:** Reuses `AtlasVoice_Analytics::track()` method directly — the existing track method in `api/AtlasVoice_Analytics.php` already handles:
- Creating/updating rows in `{prefix}_atlasvoice_analytics` table
- Merging analytics counts
- Handling device_info specially
- Creating table if not exists

```php
namespace TTA_SDK;

use TTA_Api\AtlasVoice_Analytics;

class AtlasVoice_SDK_Endpoint {
    private $namespace = 'atlasvoice-sdk/v1';
    private $analytics;

    public function __construct() {
        $this->analytics = new AtlasVoice_Analytics();
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('rest_api_init', [$this, 'add_cors_headers']);
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/track', [
            'methods'             => 'POST',
            'callback'            => [$this->analytics, 'track'],  // Reuses existing track()
            'permission_callback' => [$this, 'check_sdk_permission'],
        ]);
    }

    public function check_sdk_permission($request) {
        // WP Application Password auth is handled automatically by WP core
        // Just verify the user is authenticated and has 'read' capability
        if (!is_user_logged_in() || !current_user_can('read')) {
            return new \WP_Error(
                'rest_forbidden',
                'Authentication required. Use WordPress Application Password.',
                ['status' => 401]
            );
        }
        return true;
    }

    public function add_cors_headers() {
        $allowed_origins = apply_filters('atlasvoice_sdk_allowed_origins', ['*']);
        // Add CORS headers for preflight and actual requests
    }
}
```

---

### Step 4: Update `composer.json`

**File:** `text-to-audio/composer.json`

Add PSR-4 mapping:
```json
"TTA_SDK\\": "api/SDK"
```

Run `composer dump-autoload`.

---

### Step 5: Update `text-to-audio.php` Bootstrap

**File:** `text-to-audio/text-to-audio.php`

Add SDK endpoint initialization inside `TTA_Init::run()` `init` action callback (line ~251), after `new TTA_Api_Routes();`:

```php
// SDK Analytics endpoint for cross-domain tracking
if ( class_exists( \TTA_SDK\AtlasVoice_SDK_Endpoint::class ) ) {
    new \TTA_SDK\AtlasVoice_SDK_Endpoint();
}
```

---

## Key Code Reuse from Existing Plugin

| SDK Component | Reuses Pattern From | Source File |
|---------------|-------------------|-------------|
| `SpeechEngine.speak()` | `TextToSpeech.speak()` | `admin/js/TextToSpeech.js` |
| `SpeechEngine` Chrome bug workaround | `TextToSpeech.speak()` timer logic | `admin/js/TextToSpeech.js` |
| `SpeechEngine.pause()` cancel-and-track | `TextToSpeech.pause()` | `admin/js/TextToSpeech.js` |
| `SpeechEngine` voice loading retry | `Speech._loadVoices()` | `admin/js/tts/speak-tts/lib/speak-tts.js` |
| `ContentCleaner.splitSentences()` | `splitSentences()` | `admin/js/tts/utilities.js` |
| `ContentCleaner.clean()` | `tta_clean_content()` pattern (JS version) | `includes/helpers.php` (reimplemented in JS) |
| `VoiceManager.findBestVoice()` | `BrowserSupport.defineVoiceAndLang()` | `admin/js/tts/BrowserSupport.js` |
| `VoiceManager.getCountryCode()` | `BrowserSupport.#getCountryCode()` | `admin/js/tts/BrowserSupport.js` |
| `PlayerUI` SVG icons | `getButtonSVGIcon()` | `admin/js/tts/utilities.js` |
| `PlayerUI` hover color | `addHoverColor()` / `setSvgColorOnEvent()` | `admin/js/tts/utilities.js` |
| `AnalyticsTracker` event tracking | `AtlasVoiceAnalytics` class | `admin/js/AtlasVoiceAnalytics.js` |
| `AnalyticsTracker` device info | `getDeviceData()` method | `admin/js/AtlasVoiceAnalytics.js` |
| `AnalyticsTracker` sendBeacon/fetch | `sendSessionData()` method | `admin/js/AtlasVoiceAnalytics.js` |
| `AnalyticsTracker` listening timer | `trackListeningLength()` method | `admin/js/AtlasVoiceAnalytics.js` |
| PHP endpoint track logic | `AtlasVoice_Analytics::track()` | `api/AtlasVoice_Analytics.php` |

---

## Implementation Order

1. **`sdk/atlasvoice-sdk.js`** — The JS SDK (largest piece, self-contained)
    - EventBus → ContentCleaner → VoiceManager → SpeechEngine → PlayerUI → AnalyticsTracker → AtlasVoice (main)
2. **`sdk/atlasvoice-sdk.css`** — Player styles
3. **`api/SDK/class-atlasvoice-sdk-endpoint.php`** — WP REST endpoint for cross-domain analytics only
4. **`composer.json`** update + `composer dump-autoload`
5. **`text-to-audio.php`** bootstrap update

---

## Verification Plan

1. **Standalone mode (no WordPress):** Create a plain HTML file, include `atlasvoice-sdk.js` + `atlasvoice-sdk.css`, init with `contentSelector` pointing to a `<div>` with text → player renders, play button works, voice/language dropdowns populated from device
2. **Voice listing:** Call `player.getVoices()` → returns device voices array
3. **Language listing:** Call `player.getLanguages()` → returns unique language codes
4. **Programmatic API:** `player.play()`, `player.pause()`, `player.resume()`, `player.stop()` all work
5. **Custom text:** `player.speak('Hello world')` speaks the text
6. **Events:** `player.on('play', fn)` fires on play, `player.on('end', fn)` fires on completion
7. **Voice/lang change via dropdown:** Select different voice → speech uses new voice
8. **Analytics (cross-domain):** Enable analytics with WP credentials → on play/pause/end, data accumulates in sessionStorage → on page unload, sends POST to `/atlasvoice-sdk/v1/track` → verify row appears in `{prefix}_atlasvoice_analytics` table
9. **REST endpoint auth:** Request without auth → 401 error. Request with valid Application Password → 200 success
10. **CORS:** SDK on different domain sends analytics → preflight OPTIONS succeeds, POST goes through
11. **Existing plugin untouched:** All `tta/v1` routes still work, existing players unaffected
12. **Chrome bug:** Play long text (>15 seconds) → speech doesn't cut off (pause/resume timer active)
13. **Destroy:** `player.destroy()` removes UI, stops speech, sends remaining analytics, cleans up all listeners

---

## Pro SDK Extension Point (future — not implemented now)

The free SDK (`AtlasVoice`) is designed so the pro SDK can extend it:

```js
// Future pro SDK structure:
class AtlasVoicePro extends AtlasVoice {
  constructor(options) {
    super(options);
    // Add server-side TTS providers
    this.gTTSEngine = new GTTSEngine(options);
    this.gCloudEngine = new GoogleCloudEngine(options);
    this.chatGPTEngine = new ChatGPTEngine(options);
  }
  // Override play() to route to appropriate engine based on player_id
}
```
