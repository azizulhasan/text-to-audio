/**
 * Utility functions for the Listening preferences page.
 */

/**
 * Get flag image URL for a language code.
 *
 * @param {string} langCode Language code (e.g. "en", "fr-FR", "ko-KR")
 * @returns {string} Flag CDN URL
 */
export const getLanguageFlag = (langCode) => {
  // Handle undefined or null langCode
  if (!langCode) {
    return `https://flagcdn.com/24x18/us.png`; // Default to US flag
  }

  const flagMap = {
    en: "us",
    "en-US": "us",
    "en-GB": "gb",
    fr: "fr",
    "fr-FR": "fr",
    de: "de",
    "de-DE": "de",
    es: "es",
    "es-ES": "es",
    it: "it",
    "it-IT": "it",
    pt: "pt",
    "pt-BR": "br",
    "pt-PT": "pt",
    ja: "jp",
    "ja-JP": "jp",
    ko: "kr",
    "ko-KR": "kr",
    ar: "sa",
  };

  const countryCode =
    flagMap[langCode] || langCode.toLowerCase().split("-")[0];
  return `https://flagcdn.com/24x18/${countryCode}.png`;
};

/**
 * Generate tick marks for the speed slider (0.1 to 10).
 *
 * @returns {number[]}
 */
export const generateSpeedTicks = () => {
  const ticks = [];
  for (let i = 0.1; i <= 10; i += 1) {
    ticks.push(i);
  }
  return ticks;
};

/**
 * Generate tick marks for the volume slider (0 to 1).
 *
 * @returns {number[]}
 */
export const generateVolumeTicks = () => {
  const ticks = [];
  for (let i = 0; i <= 1; i += 0.1) {
    ticks.push(parseFloat(i.toFixed(1)));
  }
  return ticks;
};
