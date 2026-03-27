# Task 7.2 — Product Demo Video & Interactive Demo

**Status:** Ready for implementation
**Priority:** High — Demo page gets 4,896 views but has no video
**Estimated Impact:** Significant conversion rate improvement on demo page

---

## Part A: Product Demo Video (90-second narrated screencast)

### Concept: "The Plugin That Demos Itself"

Use AtlasVoice's own ElevenLabs integration to narrate the demo video. This is meta-marketing — the product quality IS the demo.

### Video Script

**Format:** Screen recording with ElevenLabs AI narration
**Duration:** ~90 seconds
**Resolution:** 1920x1080 (record at 2x, export at 1080p for crisp text)
**Voice:** ElevenLabs — use a warm, professional voice (e.g., "Rachel" or "Adam")

---

#### SCENE 1 — Hook (0:00–0:08)
**Screen:** Split-screen showing a blog post WITHOUT audio vs WITH the AtlasVoice player
**Narration:**
> "What if every visitor could listen to your content instead of reading it? Meet AtlasVoice — text-to-speech for WordPress, in under 60 seconds."

**Text overlay:** "AtlasVoice — Text to Speech for WordPress"

---

#### SCENE 2 — Install & Zero-Config (0:08–0:22)
**Screen:** WordPress admin → Plugins → Add New → Search "AtlasVoice" → Install → Activate
**Narration:**
> "Install from WordPress.org, activate, and you're done. No API keys, no configuration, no sign-ups. AtlasVoice works out of the box with free browser voices."

**Key moment:** Show the setup wizard completing automatically
**Text overlay:** "Zero Configuration Required"

---

#### SCENE 3 — Audio Player on Live Post (0:22–0:35)
**Screen:** Navigate to a published blog post → show the audio player appearing
**Narration:**
> "Every post and page instantly gets a play button. Your visitors tap once to listen. It works on desktop, tablet, and mobile — every device, every browser."

**Action:** Click play, let audio play for 3 seconds
**Text overlay:** "Works on Every Device"

---

#### SCENE 4 — "Hear the Difference" (0:35–0:55)
**Screen:** Show the "Hear the Difference" wizard step or a custom comparison
**Narration:**
> "Free browser voices are good. But Pro voices are remarkable. Listen to the difference."

**Action:** Play browser voice for 3 seconds → pause → play ElevenLabs voice for 3 seconds
**Narration (after comparison):**
> "Google Cloud, ChatGPT, and ElevenLabs — over 200 premium AI voices in 65 languages, all from one plugin."

**Text overlay:** "200+ AI Voices | 65+ Languages | 4 Engines"

---

#### SCENE 5 — Analytics Dashboard (0:55–1:05)
**Screen:** Show the AtlasVoice analytics dashboard with play counts, popular posts, listening time
**Narration:**
> "Built-in analytics show you exactly how visitors use audio — which posts they listen to, how long they stay, and what drives engagement."

**Text overlay:** "Built-in Analytics"

---

#### SCENE 6 — Pricing & CTA (1:05–1:20)
**Screen:** Show pricing page briefly → WordPress.org install button
**Narration:**
> "AtlasVoice is free forever with browser voices. Premium AI voices start at just $59 a year — that's less than $5 a month. No SaaS subscriptions, no per-character fees."

**Text overlay:** "Free Forever | Pro from $59/year"

---

#### SCENE 7 — Closing (1:20–1:30)
**Screen:** Plugin logo + WordPress.org URL
**Narration:**
> "AtlasVoice. Let your content speak for itself."

**Text overlay:**
```
AtlasVoice
wordpress.org/plugins/text-to-audio
★★★★★ 4.8 rating | 315,000+ downloads
```

---

### Video Production Checklist

- [ ] Set up a clean WordPress site for recording (or use cors2.atlasaidev.com)
- [ ] Install a clean blog theme (Twenty Twenty-Four or similar)
- [ ] Create 3-4 sample blog posts with real content
- [ ] Generate the ElevenLabs narration audio file using the script above
- [ ] Screen record at 1920x1080 using OBS Studio or similar
- [ ] Edit with text overlays using a video editor (DaVinci Resolve is free)
- [ ] Export as MP4 (H.264) at 1080p, target file size < 50MB
- [ ] Upload to YouTube (for WordPress.org embed)
- [ ] Create a WebM version for self-hosting on atlasaidev.com

### Generate Narration Using Your Own Plugin

```bash
# Use ElevenLabs API directly to generate the narration
# Voice: "Rachel" (voice_id: 21m00Tcm4TlvDq8ikWAM) or pick from your voices list

curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What if every visitor could listen to your content instead of reading it? Meet AtlasVoice — text-to-speech for WordPress, in under 60 seconds.",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }' \
  --output scene1_narration.mp3
```

Generate each scene's narration separately for easier editing, then combine in the video editor.

---

## Part B: Interactive WordPress Playground Demo

### Concept

Embed a live WordPress instance (via WordPress Playground) with AtlasVoice pre-installed on the demo page. Visitors can try the plugin without installing anything.

### blueprint.json

Create this file at `.wordpress-org/blueprint.json` (WordPress.org will automatically show a "Preview" button):

```json
{
    "$schema": "https://playground.wordpress.net/blueprint-schema.json",
    "landingPage": "/wp-admin/admin.php?page=text-to-audio",
    "preferredVersions": {
        "php": "8.0",
        "wp": "latest"
    },
    "features": {
        "networking": true
    },
    "plugins": [
        "text-to-audio"
    ],
    "steps": [
        {
            "step": "login",
            "username": "admin",
            "password": "password"
        },
        {
            "step": "setSiteOptions",
            "options": {
                "blogname": "AtlasVoice Demo",
                "blogdescription": "Text-to-Speech for WordPress"
            }
        },
        {
            "step": "installPlugin",
            "pluginData": {
                "resource": "wordpress.org/plugins",
                "slug": "text-to-audio"
            },
            "options": {
                "activate": true
            }
        },
        {
            "step": "importWxr",
            "file": {
                "resource": "url",
                "url": "https://raw.githubusercontent.com/WordPress/theme-test-data/master/themeunittestdata.wordpress.xml"
            }
        },
        {
            "step": "runPHP",
            "code": "<?php require_once 'wordpress/wp-load.php'; update_option('tta_settings_data', array('listening' => array('player_id' => '3'), 'tta__settings_enable_button_for_post_types' => array('post' => 'post', 'page' => 'page'))); ?>"
        }
    ]
}
```

### Embed on atlasaidev.com Demo Page

```html
<!-- Interactive Demo Embed -->
<div style="max-width: 1200px; margin: 40px auto;">
    <h2 style="text-align: center; margin-bottom: 8px;">
        Try AtlasVoice Right Now — No Install Needed
    </h2>
    <p style="text-align: center; color: #666; margin-bottom: 24px;">
        This is a live WordPress instance with AtlasVoice installed. Click around, try it out!
    </p>
    <iframe
        src="https://playground.wordpress.net/?blueprint-url=https://wordpress.org/plugins/wp-json/plugins/v1/plugin/text-to-audio/blueprint.json"
        style="width: 100%; height: 700px; border: 2px solid #e0e0e0; border-radius: 12px;"
        allow="clipboard-read; clipboard-write"
        loading="lazy"
    ></iframe>
</div>
```

**Alternative — Direct Playground URL:**
```
https://playground.wordpress.net/#{"landingPage":"/wp-admin/admin.php?page=text-to-audio","plugins":["text-to-audio"],"features":{"networking":true},"steps":[{"step":"login"}]}
```

### Playground Limitations to Note

- Browser TTS (Player ID 3) works perfectly in Playground — best for demo
- Google Cloud/ElevenLabs/ChatGPT won't work (requires API keys)
- Audio file generation won't persist (ephemeral filesystem)
- Networking must be enabled for the plugin to check updates

---

## Part C: Where to Place the Video & Interactive Demo

### Priority Placement Locations

| Location | What to Embed | Expected Impact |
|----------|--------------|-----------------|
| **atlasaidev.com/demo/** | Video + Interactive Playground | Highest — 4,896 views, zero video currently |
| **WordPress.org plugin page** | YouTube video link in description | High — first impression for most users |
| **atlasaidev.com pricing page** | 30s excerpt of video (scenes 4-6) | Medium — reduces purchase hesitation |
| **atlasaidev.com homepage** | Full video as hero section | Medium — sets professional tone |
| **Blog comparison posts** | Relevant video clips | Low-medium — supports content marketing |
| **YouTube channel** | Full video + shorter clips | SEO — ranks for "WordPress TTS plugin" |

### WordPress.org Plugin Description Update

Add to the plugin's `readme.txt` description section:

```
== Description ==

[youtube https://www.youtube.com/watch?v=YOUR_VIDEO_ID]

**AtlasVoice** converts your WordPress content to natural-sounding audio...
```

WordPress.org automatically renders YouTube links as embedded players.

---

## Part D: Thumbnail & Social Assets

### YouTube Thumbnail (1280x720)

Design elements:
- Left side: WordPress logo + AtlasVoice logo
- Right side: Screenshot of audio player on a blog post
- Text: "WordPress Text-to-Speech in 60 Seconds"
- Brand color: #FF7853 as accent
- Dark background for contrast

### Social Media Clips

Cut the 90s video into shorter clips:
1. **15s Instagram/TikTok:** Scene 2 (install) + Scene 3 (player appears) — "Zero to audio in 60 seconds"
2. **30s Twitter/X:** Scene 4 (hear the difference) — "Free vs Pro voices"
3. **60s LinkedIn:** Scenes 1-4 — professional demo for decision makers

---

## Implementation Timeline

| Step | Action | Time Estimate |
|------|--------|---------------|
| 1 | Write final narration script (refine above) | 1 hour |
| 2 | Generate ElevenLabs narration audio | 30 min |
| 3 | Set up clean demo site for recording | 1 hour |
| 4 | Screen record all scenes | 2 hours |
| 5 | Video editing (DaVinci Resolve) | 3-4 hours |
| 6 | Create blueprint.json and test Playground | 1 hour |
| 7 | Upload video to YouTube | 30 min |
| 8 | Embed on demo page + WordPress.org | 1 hour |
| 9 | Create social clips | 2 hours |
| **Total** | | **~12 hours** |

---

## Success Metrics

Track these after launch:
- Demo page bounce rate (should decrease)
- Demo page → pricing page click-through rate (should increase)
- WordPress.org "Preview" button clicks (new metric from Playground)
- YouTube video views and watch-through rate
- Install rate change from demo page visitors
