/**
 * TTS-266 — AtlasVoice Cloud (player 7) voice catalogue.
 *
 * Declared in JS, the same way player 3 declares its language list in the add-on
 * (Assets/js/translation/languages.js), so the dashboard and the front-end
 * player import one shared module instead of the data being localised from PHP.
 *
 * Bundled locally on purpose: listing voices must never require a request to the
 * AtlasVoice service — the admin screen has to render instantly, work offline,
 * and send nothing anywhere before the site owner has opted in.
 *
 * Keep in sync with the engines registered in the service (app/engines.py).
 *
 *   engine  'piper'  — ~14x realtime on CPU, broad language coverage
 *   engine  'kokoro' — better prosody, roughly 7x the CPU cost
 */

export const ATLASVOICE_LANGUAGES = {
    "en-US": "English (United States)",
    "en-GB": "English (United Kingdom)",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "it-IT": "Italian",
    "hi-IN": "Hindi",
    "pt-BR": "Portuguese (Brazil)",
};

export const ATLASVOICE_VOICES = [
    // Kokoro
    { id: "af_heart", label: "Heart (Female)", lang: "en-US", gender: "female", engine: "kokoro" },
    { id: "am_michael", label: "Michael (Male)", lang: "en-US", gender: "male", engine: "kokoro" },
    { id: "bf_emma", label: "Emma (Female)", lang: "en-GB", gender: "female", engine: "kokoro" },
    { id: "bm_george", label: "George (Male)", lang: "en-GB", gender: "male", engine: "kokoro" },
    { id: "ef_dora", label: "Dora (Female)", lang: "es-ES", gender: "female", engine: "kokoro" },
    { id: "em_alex", label: "Alex (Male)", lang: "es-ES", gender: "male", engine: "kokoro" },
    { id: "ff_siwis", label: "Siwis (Female)", lang: "fr-FR", gender: "female", engine: "kokoro" },
    { id: "if_sara", label: "Sara (Female)", lang: "it-IT", gender: "female", engine: "kokoro" },
    { id: "im_nicola", label: "Nicola (Male)", lang: "it-IT", gender: "male", engine: "kokoro" },
    { id: "hf_alpha", label: "Alpha (Female)", lang: "hi-IN", gender: "female", engine: "kokoro" },
    { id: "pf_dora", label: "Dora (Female)", lang: "pt-BR", gender: "female", engine: "kokoro" },
    { id: "pm_alex", label: "Alex (Male)", lang: "pt-BR", gender: "male", engine: "kokoro" },

    // Piper
    { id: "en_US-amy-medium", label: "Amy (Female)", lang: "en-US", gender: "female", engine: "piper" },
    { id: "pt_BR-faber-medium", label: "Faber (Male)", lang: "pt-BR", gender: "male", engine: "piper" },
];

/** Languages that actually have at least one voice, in catalogue order. */
export const getAtlasVoiceLanguages = () => {
    const seen = [];
    ATLASVOICE_VOICES.forEach((v) => {
        if (v.lang && !seen.includes(v.lang)) seen.push(v.lang);
    });
    return seen;
};

/** Voices available for a language code, e.g. "pt-BR". */
export const getAtlasVoicesForLanguage = (lang) =>
    ATLASVOICE_VOICES.filter((v) => v.lang === lang);

export default ATLASVOICE_VOICES;
