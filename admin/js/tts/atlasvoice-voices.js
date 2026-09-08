/**
 * TTS-266 — AtlasVoice Cloud (player 7) voice catalogue.
 *
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: python tools/generate_voice_catalogue.py
 * (in the synthesis service repo, with the service running).
 *
 * Declared in JS, the same way player 3 declares its language list, so the
 * dashboard and the front-end player import one shared module instead of the
 * data being localised from PHP.
 *
 * Bundled locally on purpose: listing voices must never require a request to
 * the AtlasVoice service — the admin screen has to render instantly, work
 * offline, and send nothing anywhere before the site owner has opted in.
 *
 *   engine 'piper'  — ~14x realtime on CPU; the default for a good reason
 *   engine 'kokoro' — better prosody, roughly 7x the CPU cost
 */

export const ATLASVOICE_LANGUAGES = {
    "ar-JO": "Arabic",
    "ca-ES": "Catalan",
    "cs-CZ": "Czech",
    "cy-GB": "Welsh",
    "da-DK": "Danish",
    "de-DE": "German",
    "el-GR": "Greek",
    "en-GB": "English (United Kingdom)",
    "en-US": "English (United States)",
    "es-ES": "Spanish",
    "es-MX": "Spanish (Mexico)",
    "fi-FI": "Finnish",
    "fr-FR": "French",
    "hi-IN": "Hindi",
    "hu-HU": "Hungarian",
    "hy-AM": "Armenian",
    "id-ID": "Indonesian",
    "is-IS": "Icelandic",
    "it-IT": "Italian",
    "ja-JP": "Japanese",
    "ko-KR": "Korean",
    "lv-LV": "Latvian",
    "nl-BE": "Dutch (Belgium)",
    "nl-NL": "Dutch",
    "no-NO": "Norwegian",
    "pl-PL": "Polish",
    "pt-BR": "Portuguese (Brazil)",
    "ro-RO": "Romanian",
    "ru-RU": "Russian",
    "sk-SK": "Slovak",
    "sq-AL": "Albanian",
    "sr-RS": "Serbian",
    "sv-SE": "Swedish",
    "sw-CD": "Swahili",
    "tr-TR": "Turkish",
    "vi-VN": "Vietnamese",
    "zh-CN": "Chinese",
};

export const ATLASVOICE_VOICES = [
    // Arabic
    { id: "ar_JO-kareem-medium", label: "Kareem", lang: "ar-JO", gender: "unknown", engine: "piper" },
    // Catalan
    { id: "ca_ES-upc_ona-medium", label: "Upc Ona", lang: "ca-ES", gender: "unknown", engine: "piper" },
    // Czech
    { id: "cs_CZ-jirka-medium", label: "Jirka", lang: "cs-CZ", gender: "unknown", engine: "piper" },
    { id: "cs_CZ-kasandra-medium", label: "Kasandra", lang: "cs-CZ", gender: "unknown", engine: "piper" },
    // Welsh
    { id: "cy_GB-bu_tts-medium", label: "Bu Tts", lang: "cy-GB", gender: "unknown", engine: "piper" },
    { id: "cy_GB-gwryw_gogleddol-medium", label: "Gwryw Gogleddol", lang: "cy-GB", gender: "unknown", engine: "piper" },
    // Danish
    { id: "da_DK-talesyntese-medium", label: "Talesyntese", lang: "da-DK", gender: "unknown", engine: "piper" },
    // German
    { id: "de_DE-mls-medium", label: "Mls", lang: "de-DE", gender: "unknown", engine: "piper" },
    { id: "de_DE-thorsten-medium", label: "Thorsten", lang: "de-DE", gender: "unknown", engine: "piper" },
    // Greek
    { id: "el_GR-joy-medium", label: "Joy", lang: "el-GR", gender: "unknown", engine: "piper" },
    { id: "el_GR-rapunzelina-medium", label: "Rapunzelina", lang: "el-GR", gender: "unknown", engine: "piper" },
    // English (United Kingdom)
    { id: "en_GB-alan-medium", label: "Alan", lang: "en-GB", gender: "unknown", engine: "piper" },
    { id: "bf_emma", label: "Emma (Female)", lang: "en-GB", gender: "female", engine: "kokoro" },
    { id: "bm_george", label: "George (Male)", lang: "en-GB", gender: "male", engine: "kokoro" },
    // English (United States)
    { id: "en_US-amy-medium", label: "Amy", lang: "en-US", gender: "unknown", engine: "piper" },
    { id: "af_heart", label: "Heart (Female)", lang: "en-US", gender: "female", engine: "kokoro" },
    { id: "am_michael", label: "Michael (Male)", lang: "en-US", gender: "male", engine: "kokoro" },
    // Spanish
    { id: "es_ES-davefx-medium", label: "Davefx", lang: "es-ES", gender: "unknown", engine: "piper" },
    { id: "em_alex", label: "Alex (Male)", lang: "es-ES", gender: "male", engine: "kokoro" },
    { id: "ef_dora", label: "Dora (Female)", lang: "es-ES", gender: "female", engine: "kokoro" },
    // Spanish (Mexico)
    { id: "es_MX-ald-medium", label: "Ald", lang: "es-MX", gender: "unknown", engine: "piper" },
    // Finnish
    { id: "fi_FI-harri-medium", label: "Harri", lang: "fi-FI", gender: "unknown", engine: "piper" },
    // French
    { id: "fr_FR-mls-medium", label: "Mls", lang: "fr-FR", gender: "unknown", engine: "piper" },
    { id: "fr_FR-siwis-medium", label: "Siwis", lang: "fr-FR", gender: "unknown", engine: "piper" },
    { id: "ff_siwis", label: "Siwis (Female)", lang: "fr-FR", gender: "female", engine: "kokoro" },
    // Hindi
    { id: "hi_IN-pratham-medium", label: "Pratham", lang: "hi-IN", gender: "unknown", engine: "piper" },
    { id: "hi_IN-priyamvada-medium", label: "Priyamvada", lang: "hi-IN", gender: "unknown", engine: "piper" },
    { id: "hf_alpha", label: "Alpha (Female)", lang: "hi-IN", gender: "female", engine: "kokoro" },
    { id: "hm_omega", label: "Omega (Male)", lang: "hi-IN", gender: "male", engine: "kokoro" },
    // Hungarian
    { id: "hu_HU-anna-medium", label: "Anna", lang: "hu-HU", gender: "unknown", engine: "piper" },
    { id: "hu_HU-berta-medium", label: "Berta", lang: "hu-HU", gender: "unknown", engine: "piper" },
    // Armenian
    { id: "hy_AM-gor-medium", label: "Gor", lang: "hy-AM", gender: "unknown", engine: "piper" },
    // Indonesian
    { id: "id_ID-news_tts-medium", label: "News Tts", lang: "id-ID", gender: "unknown", engine: "piper" },
    // Icelandic
    { id: "is_IS-bui-medium", label: "Bui", lang: "is-IS", gender: "unknown", engine: "piper" },
    { id: "is_IS-salka-medium", label: "Salka", lang: "is-IS", gender: "unknown", engine: "piper" },
    // Italian
    { id: "it_IT-paola-medium", label: "Paola", lang: "it-IT", gender: "unknown", engine: "piper" },
    { id: "it_IT-serena-medium", label: "Serena", lang: "it-IT", gender: "unknown", engine: "piper" },
    { id: "im_nicola", label: "Nicola (Male)", lang: "it-IT", gender: "male", engine: "kokoro" },
    { id: "if_sara", label: "Sara (Female)", lang: "it-IT", gender: "female", engine: "kokoro" },
    // Japanese
    { id: "jf_alpha", label: "Alpha (Female)", lang: "ja-JP", gender: "female", engine: "kokoro" },
    // Korean
    { id: "ko_KR-kss-medium", label: "Kss", lang: "ko-KR", gender: "unknown", engine: "piper" },
    // Latvian
    { id: "lv_LV-aivars-medium", label: "Aivars", lang: "lv-LV", gender: "unknown", engine: "piper" },
    // Dutch (Belgium)
    { id: "nl_BE-nathalie-medium", label: "Nathalie", lang: "nl-BE", gender: "unknown", engine: "piper" },
    // Dutch
    { id: "nl_NL-alex-medium", label: "Alex", lang: "nl-NL", gender: "unknown", engine: "piper" },
    // Norwegian
    { id: "no_NO-nvcc-medium", label: "Nvcc", lang: "no-NO", gender: "unknown", engine: "piper" },
    { id: "no_NO-talesyntese-medium", label: "Talesyntese", lang: "no-NO", gender: "unknown", engine: "piper" },
    // Polish
    { id: "pl_PL-darkman-medium", label: "Darkman", lang: "pl-PL", gender: "unknown", engine: "piper" },
    { id: "pl_PL-gosia-medium", label: "Gosia", lang: "pl-PL", gender: "unknown", engine: "piper" },
    // Portuguese (Brazil)
    { id: "pt_BR-cadu-medium", label: "Cadu", lang: "pt-BR", gender: "unknown", engine: "piper" },
    { id: "pt_BR-faber-medium", label: "Faber", lang: "pt-BR", gender: "unknown", engine: "piper" },
    { id: "pm_alex", label: "Alex (Male)", lang: "pt-BR", gender: "male", engine: "kokoro" },
    { id: "pf_dora", label: "Dora (Female)", lang: "pt-BR", gender: "female", engine: "kokoro" },
    // Romanian
    { id: "ro_RO-mihai-medium", label: "Mihai", lang: "ro-RO", gender: "unknown", engine: "piper" },
    // Russian
    { id: "ru_RU-denis-medium", label: "Denis", lang: "ru-RU", gender: "unknown", engine: "piper" },
    { id: "ru_RU-dmitri-medium", label: "Dmitri", lang: "ru-RU", gender: "unknown", engine: "piper" },
    // Slovak
    { id: "sk_SK-lili-medium", label: "Lili", lang: "sk-SK", gender: "unknown", engine: "piper" },
    // Albanian
    { id: "sq_AL-edon-medium", label: "Edon", lang: "sq-AL", gender: "unknown", engine: "piper" },
    // Serbian
    { id: "sr_RS-serbski_institut-medium", label: "Serbski Institut", lang: "sr-RS", gender: "unknown", engine: "piper" },
    // Swedish
    { id: "sv_SE-alma-medium", label: "Alma", lang: "sv-SE", gender: "unknown", engine: "piper" },
    { id: "sv_SE-lisa-medium", label: "Lisa", lang: "sv-SE", gender: "unknown", engine: "piper" },
    // Swahili
    { id: "sw_CD-lanfrica-medium", label: "Lanfrica", lang: "sw-CD", gender: "unknown", engine: "piper" },
    // Turkish
    { id: "tr_TR-dfki-medium", label: "Dfki", lang: "tr-TR", gender: "unknown", engine: "piper" },
    // Vietnamese
    { id: "vi_VN-vais1000-medium", label: "Vais1000", lang: "vi-VN", gender: "unknown", engine: "piper" },
    // Chinese
    { id: "zh_CN-huayan-medium", label: "Huayan", lang: "zh-CN", gender: "unknown", engine: "piper" },
    { id: "zf_xiaobei", label: "Xiaobei (Female)", lang: "zh-CN", gender: "female", engine: "kokoro" },
];

/** Languages that have at least one voice, in display order. */
export function getAtlasVoiceLanguages() {
    return Object.keys(ATLASVOICE_LANGUAGES);
}

/** Voices for one language, fast engine first. */
export function getAtlasVoicesForLanguage(language) {
    return ATLASVOICE_VOICES.filter((voice) => voice.lang === language);
}
