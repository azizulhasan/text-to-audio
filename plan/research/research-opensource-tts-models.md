# Open-Source TTS Models Research — Free for Commercial Use

**Date:** 2026-04-15
**Purpose:** Evaluate open-source TTS models that can be self-hosted and integrated as voice providers in the AtlasVoice (text-to-audio) plugin.

---

## Summary

All models listed below are free for commercial use. They can be self-hosted on a subdomain (e.g., `tts.yourdomain.com`) and called via REST API from the WordPress plugin — just like existing providers (ElevenLabs, Google, etc.).

---

## Ranked List (Best to Worst for Our Plugin)

---

### 1. Kokoro — `Apache 2.0` ★ RECOMMENDED

- **Repo:** https://github.com/remsky/Kokoro-FastAPI
- **Parameters:** 82M (very lightweight)
- **GPU Required:** No — runs on CPU only
- **VRAM:** ~2GB (or just CPU)
- **Languages:** English + multilingual
- **Voice Cloning:** Yes
- **API:** Ready-made Docker + FastAPI (OpenAI-compatible REST API)
- **Commercial Use:** Free

**Why best for our plugin:**
- Runs on a basic $5–10/mo VPS — no GPU server needed
- Has a ready-made Docker image with OpenAI-compatible endpoints
- 210x real-time speed on GPU; still usable on CPU
- Can be marketed as "Free Self-Hosted AI Voice" in Pro plugin
- Easiest integration: drop-in OpenAI TTS API compatible

**Deployment:**
```bash
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi:latest
# API endpoint: POST http://localhost:8880/v1/audio/speech
```

---

### 2. Chatterbox — `MIT` ★ BEST QUALITY

- **Repo:** https://github.com/devnen/Chatterbox-TTS-Server
- **Parameters:** 0.5B / 350M Turbo
- **GPU Required:** Recommended (also runs on CPU)
- **Languages:** 23
- **Voice Cloning:** Yes (zero-shot)
- **API:** OpenAI-compatible REST API, Docker ready
- **Commercial Use:** Free

**Why great:**
- 63.8% of listeners preferred it over ElevenLabs in blind tests
- Production-ready server with Docker, NVIDIA/AMD/CPU support
- OpenAI-compatible endpoints — easy to integrate
- Good choice for users wanting ElevenLabs-quality self-hosted voices

**Deployment:**
```bash
docker compose up  # supports GPU + CPU modes
# API endpoint: POST http://localhost:8004/v1/audio/speech
```

---

### 3. Qwen3-TTS (Alibaba) — `Apache 2.0`

- **Repo:** https://github.com/QwenLM/Qwen3-TTS / https://github.com/ValyrianTech/Qwen3-TTS_server
- **Languages:** 10 (EN, ZH, JA, KO, DE, FR, RU, PT, ES, IT)
- **Voice Cloning:** Yes
- **API:** FastAPI server available, RunPod-ready
- **GPU Required:** Yes (recommended)
- **Commercial Use:** Free

**Why good:**
- Strong multilingual support (good for international user base)
- Active community, RunPod-ready deployment
- Good for plugins targeting non-English markets

---

### 4. VoxCPM2 (OpenBMB) — `Apache 2.0`

- **Repo:** https://github.com/OpenBMB/VoxCPM
- **Parameters:** 2B
- **Languages:** 30 + 9 Chinese dialects
- **Voice Cloning:** Yes (advanced — 3 modes)
- **GPU VRAM:** 8GB minimum (RTX 3070+ or better)
- **API:** FastAPI / Nano-vLLM
- **Commercial Use:** Free

**Why ranked 4th:**
- Best language coverage and cloning quality
- But requires dedicated GPU server — expensive at scale
- Best choice only if GPU infrastructure is already available

**Hardware requirements:**
- GPU: NVIDIA 8GB VRAM+, CUDA 12.0+
- Python: 3.10–3.12, PyTorch 2.5+
- OS: Linux recommended

---

### 5. Piper TTS — `MIT`

- **Repo:** https://github.com/rhasspy/piper
- **GPU Required:** No — CPU only
- **Languages:** 30+
- **Voice Cloning:** No
- **Speed:** Real-time on CPU
- **Commercial Use:** Free

**Why useful:**
- Ultra-lightweight and stable
- Great for edge/low-cost servers
- No voice cloning, but reliable and fast
- Good fallback option

---

### 6. MeloTTS — `MIT`

- **GPU Required:** Recommended
- **Focus:** High-quality multilingual output
- **Voice Cloning:** Limited
- **Commercial Use:** Free

---

## Models to AVOID (Commercial Use Restrictions)

| Model | License | Problem |
|---|---|---|
| XTTS-v2 (Coqui) | CPML | No commercial use allowed |
| Fish Speech v1.5 | CC BY-NC | No commercial use allowed |
| Bark (Suno) | MIT (check latest) | Verify current version license |

---

## Integration Architecture

```
WordPress Plugin (PHP)
    ↓ HTTP POST (text + voice settings)
Self-Hosted API Server (subdomain: tts.domain.com)
    ↓ runs TTS model
Returns audio file (MP3/WAV)
    ↓
Plugin serves audio to visitor
```

**PHP Integration Example:**
```php
$response = wp_remote_post( 'https://tts.yourdomain.com/v1/audio/speech', [
    'body'    => json_encode([
        'model' => 'kokoro',
        'input' => $text,
        'voice' => 'af_sarah',
    ]),
    'headers' => [ 'Content-Type' => 'application/json' ],
    'timeout' => 30,
] );
$audio_data = wp_remote_retrieve_body( $response );
```

---

## Recommended Plugin Integration Strategy

1. **Phase 1:** Add **Kokoro** as first open-source provider
   - Works on basic VPS (no GPU needed)
   - Market as "Free Self-Hosted AI Voice" in Pro plugin
   - OpenAI-compatible API = easy implementation

2. **Phase 2:** Add **Chatterbox** as premium self-hosted option
   - For users wanting ElevenLabs quality at zero API cost
   - Requires GPU server on user's end

3. **Future:** Support a "Custom Self-Hosted URL" option
   - Let advanced users point to their own VoxCPM2 / Qwen3-TTS server
   - Just needs an OpenAI-compatible endpoint URL in settings

---

## Server Cost Estimates

| Setup | Cost | Suitable For |
|---|---|---|
| Basic VPS (Kokoro CPU) | $5–15/mo | Low–medium traffic |
| GPU Cloud (RunPod RTX 4090) | ~$0.20–0.50/hr | High traffic / voice cloning |
| Dedicated GPU Server | $100–300/mo | Enterprise / very high volume |

---

## Sources

- https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models
- https://www.resemble.ai/chatterbox/
- https://modal.com/blog/open-source-tts
- https://www.hyperstack.cloud/blog/case-study/popular-open-source-text-to-speech-models
- https://github.com/remsky/Kokoro-FastAPI
- https://github.com/devnen/Chatterbox-TTS-Server
- https://github.com/ValyrianTech/Qwen3-TTS_server
- https://www.spheron.network/blog/deploy-open-source-tts-gpu-cloud-2026/
- https://github.com/OpenBMB/VoxCPM
