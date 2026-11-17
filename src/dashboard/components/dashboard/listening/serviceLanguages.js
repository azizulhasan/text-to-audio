/**
 * TTS-378: the natural voice's languages as AtlasVoice Cloud lists them now.
 *
 * The service is the one that knows which voices exist. The site passes its
 * list on (`tta/v1/cloud/voices`, TTA\Cloud\Voices); the list that ships with
 * the plugin (gttsLanguages.js) is used until the answer is there and whenever
 * the service cannot give one.
 *
 * No React and no WordPress here, so the rules can be tested on their own.
 */

/** The engine of the natural voice on AtlasVoice Cloud. */
export const NATURAL_ENGINE = "gtts";

/** The site's route for the voices the service offers. */
export const VOICES_ROUTE = "tta/v1/cloud/voices";

/**
 * The languages in the site's answer, code => name, in the order of the names.
 *
 * @param {Object} answer What the site returned: { source, voices: [ { language, name } ] }.
 * @return {Object|null} code => name, or null for "use the plugin's own list".
 */
export function languageMapFromAnswer(answer) {
  if (!answer || answer.source !== "service" || !Array.isArray(answer.voices)) {
    return null;
  }

  const found = [];
  const seen = new Set();
  for (const voice of answer.voices) {
    const code = typeof voice?.language === "string" ? voice.language.trim() : "";
    if (!code || seen.has(code)) {
      continue;
    }
    seen.add(code);
    found.push([code, typeof voice.name === "string" && voice.name.trim() ? voice.name.trim() : code]);
  }

  if (!found.length) {
    return null;
  }

  found.sort((a, b) => a[1].localeCompare(b[1]));

  const map = {};
  for (const [code, name] of found) {
    map[code] = name;
  }
  return map;
}

/**
 * The address of the voices route, for a site with or without pretty permalinks.
 *
 * @param {string} apiUrl The site's REST root, e.g. "https://site/wp-json/" or "https://site/?rest_route=/".
 * @return {string}
 */
export function voicesUrl(apiUrl) {
  const root = String(apiUrl || "/wp-json/");

  return root + VOICES_ROUTE + (root.includes("?") ? "&" : "?") + "engine=" + NATURAL_ENGINE;
}

/**
 * The code in a list that a saved language stands for: the same code, whatever its case.
 *
 * @param {string} language  The saved language.
 * @param {Object} languages code => name.
 * @return {string} A code of the list, or "" when the list does not have it.
 */
export function codeInList(language, languages) {
  const wanted = String(language || "").toLowerCase();

  return wanted ? Object.keys(languages || {}).find((code) => code.toLowerCase() === wanted) || "" : "";
}

/**
 * Asks the site for the service's list.
 *
 * @param {string}   apiUrl  The site's REST root.
 * @param {string}   nonce   The wp_rest nonce.
 * @param {Function} fetchFn fetch, or a stand-in for it.
 * @return {Promise<Object|null>} code => name, or null. Never rejects.
 */
export async function readServiceLanguages(apiUrl, nonce, fetchFn) {
  try {
    const res = await fetchFn(voicesUrl(apiUrl), {
      method: "GET",
      credentials: "same-origin",
      headers: { "X-WP-Nonce": nonce || "" },
    });
    if (!res || !res.ok) {
      return null;
    }
    return languageMapFromAnswer(await res.json());
  } catch (e) {
    return null;
  }
}
