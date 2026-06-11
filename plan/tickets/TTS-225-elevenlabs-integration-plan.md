# TTS-225: ElevenLabs Text-to-Speech Integration Plan

## Overview
Integrate ElevenLabs as a new TTS provider alongside Google Cloud TTS and ChatGPT TTS. The integration follows the same patterns used by ChatGPT TTS for API key auth, MP3 generation, batch processing, and file storage.

## Branch
Both plugins: `feature/TTS-225`

---

## Phase 1: Free Plugin UI (`text-to-audio`)

### 1. Create ElevenLabs Auth Component
**New file:** `src/dashboard/components/dashboard/integrations/ElevenLabsTTS/ElevenLabsTTS.js`

- Password input field for `xi-api-key` (same pattern as ChatGPTTTS.js)
- Help link to `https://elevenlabs.io/app/settings/api-keys`
- Save/retrieve via REST endpoint `elevenlabs_tts`
- Pro version + active license validation before saving
- Writable uploads folder check

### 2. Update Integrations.js - Change to Dropdown with Token Usage
**File:** `src/dashboard/components/dashboard/integrations/Integrations.js`

**UI Change:** Replace card-toggle system with `<Form.Select>` dropdown:
- Options: "-- Select a service --", "Google Cloud TTS", "ChatGPT TTS", "ElevenLabs TTS"
- User selects ONE provider; corresponding auth component renders below
- Authenticated checkmark indicator next to service name in dropdown option

**Token Usage Display:**
- After the dropdown, show a token/character usage summary section
- For ElevenLabs: Display character usage from the ElevenLabs subscription info API (`GET /v1/user/subscription`)
  - Shows: `Characters Used / Character Limit` with a progress bar
- For ChatGPT: Show a note about OpenAI billing dashboard link
- For Google Cloud TTS: Show a note about GCP console link

### 3. Add ElevenLabs Button to Customize.js
**File:** `src/dashboard/components/dashboard/customize/Customize.js`

Add to `buttonLists` array:
```js
{ id: 6, name: "ElevenLabs TTS", object: "TextToSpeechPro", disabled: false }
```

Add validation for ID 6 in `handleSubmit`:
- Check `isElevenLabsAuthenticated` before allowing selection
- Add authentication check on mount (similar to Google Cloud / ChatGPT checks)

### 4. Add ElevenLabs Voice Settings to Listening.js
**File:** `src/dashboard/components/dashboard/listening/Listening.js`

For player ID `6`, show the following settings:

| Setting | UI Element | Range | Default |
|---------|-----------|-------|---------|
| Voice | Dropdown (fetched from ElevenLabs API) | Dynamic | First voice |
| Model | Dropdown | eleven_multilingual_v2, eleven_turbo_v2_5, eleven_flash_v2_5, eleven_v3 | eleven_multilingual_v2 |
| Output Format | Dropdown | mp3_44100_128, mp3_44100_192, mp3_44100_96, mp3_44100_64 | mp3_44100_128 |
| Stability | Slider | 0.0 - 1.0 (step 0.05) | 0.5 |
| Similarity Boost | Slider | 0.0 - 1.0 (step 0.05) | 0.75 |
| Style Exaggeration | Slider | 0.0 - 1.0 (step 0.05) | 0.0 |
| Speed | Slider | 0.7 - 1.2 (step 0.05) | 1.0 |
| Speaker Boost | Toggle (on/off) | true/false | true |

- Voice list fetched via backend proxy: `GET tta_pro/v1/elevenlabs_voices`
- Audio preview using voice's `preview_url` from API response

---

## Phase 2: Pro Plugin Backend (`text-to-audio-pro`)

### 5. Define Constants
**File:** `Includes/TTA_Pro_Constants.php`

```php
TTA_PRO_ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech/'
TTA_PRO_ELEVENLABS_TTS_DIR = TTA_PRO_AUDIO_DIR . 'elevenlabs_tts/'
TTA_PRO_ELEVENLABS_TTS_DIR_URL = TTA_PRO_AUDIO_DIR_URL . 'elevenlabs_tts/'
```

### 6. Register API Routes
**File:** `Api/TTA_Pro_Api_Routes.php`

| Route | Method | Callback | Access |
|-------|--------|----------|--------|
| `/elevenlabs` | POST | `elevenlabs()` | Frontend (nonce) |
| `/elevenlabs_tts` | POST | `elevenlabs_tts_callback()` | Admin only |
| `/elevenlabs_voices` | GET | `get_elevenlabs_voices()` | Admin only |

### 7. Implement `elevenlabs()` Method (MP3 Generation)
Same pattern as `chat_gpt()` method:

1. Decode request body (title, content, path, settings, post_id, user_id)
2. Set `$file_full_path = TTA_PRO_ELEVENLABS_TTS_DIR . $path`
3. Delete already generated files if regenerating
4. Get API key: `get_option('elevenlabs_tts')['elevenlabs_api_key']`
5. Transient lock: `mp3_generation_lock__post_id__{$post_id}`
6. Check if audio already generated
7. API call via `wp_remote_post()`:
   ```php
   wp_remote_post(TTA_PRO_ELEVENLABS_API_URL . $voice_id . '?output_format=' . $output_format, [
       'body' => json_encode([
           'text'           => $content,
           'model_id'       => $settings['model_id'],
           'voice_settings' => [
               'stability'        => $settings['stability'],
               'similarity_boost' => $settings['similarity_boost'],
               'style'            => $settings['style'],
               'speed'            => $settings['speed'],
               'use_speaker_boost'=> $settings['use_speaker_boost'],
           ],
       ]),
       'headers' => [
           'Content-Type' => 'application/json',
           'xi-api-key'   => $api_key,
       ],
       'timeout'   => 120,
       'sslverify' => false,
   ]);
   ```
8. Response body = raw MP3 binary -> `TTA_Pro_Helper::write_file()`
9. Same batch combining logic as `chat_gpt()`
10. Optional Google Cloud Storage backup
11. Return file URL

### 8. Implement `elevenlabs_tts_callback()` (API Key Management)
```php
// POST: save
update_option('elevenlabs_tts', $fields);
// GET: retrieve
get_option('elevenlabs_tts');
```

### 9. Implement `get_elevenlabs_voices()` (Voice List Proxy)
```php
wp_remote_get('https://api.elevenlabs.io/v1/voices', [
    'headers' => ['xi-api-key' => $api_key],
]);
```
Returns voice list to frontend.

### 10. Add `init_elevenlabs()` to plyr.js
**File:** `Assets/js/plyr.js`

- Same batch processing pattern as `init_chat_gpt()`
- Endpoint: `'elevenlabs'`
- Settings from `getSettings()`:
  ```js
  if (this.player_id == 6 && this?.TTS?.extra) {
      settings.voice_id = this?.TTS?.extra[this.buttonId]?.voice;
      settings.model_id = ttsObj.settings.listening?.tta__elevenlabs_model;
      settings.stability = ttsObj.settings.listening?.tta__elevenlabs_stability;
      settings.similarity_boost = ttsObj.settings.listening?.tta__elevenlabs_similarity_boost;
      settings.style = ttsObj.settings.listening?.tta__elevenlabs_style;
      settings.speed = ttsObj.settings.listening?.tta__elevenlabs_speed;
      settings.use_speaker_boost = ttsObj.settings.listening?.tta__elevenlabs_speaker_boost;
      settings.output_format = ttsObj.settings.listening?.tta__elevenlabs_output_format;
  }
  ```
- Player ID 6 routing in the init dispatcher

---

## Phase 3: WordPress i18n
- All user-facing strings in free plugin: `__('string', 'text-to-audio')`
- All user-facing strings in pro plugin: `__('string', 'text-to-audio')` (uses same text domain per TTA_PRO_TEXT_DOMAIN)

---

## Files Modified Summary

| Plugin | File | Change |
|--------|------|--------|
| Free | `integrations/ElevenLabsTTS/ElevenLabsTTS.js` | **NEW** - Auth component |
| Free | `integrations/Integrations.js` | Dropdown UI + token usage |
| Free | `customize/Customize.js` | Add button ID 6 + validation |
| Free | `listening/Listening.js` | Voice settings for ID 6 |
| Pro | `Includes/TTA_Pro_Constants.php` | Add 3 ElevenLabs constants |
| Pro | `Api/TTA_Pro_Api_Routes.php` | Add 3 routes + 3 methods |
| Pro | `Assets/js/plyr.js` | Add `init_elevenlabs()` + routing |
