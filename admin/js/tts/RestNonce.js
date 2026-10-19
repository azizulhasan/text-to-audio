/**
 * TTS-343: keep the players' REST nonce valid on pages served from a page cache.
 *
 * WordPress nonces expire after 12-24 hours, but a page cache (LiteSpeed,
 * WP Rocket, a CDN) can serve the same HTML for a week. The nonce printed in
 * that page then fails every player request with 403 before the plugin runs,
 * and audio is never made. renew() asks the uncached `tta/v1/rest-nonce` route
 * for a fresh nonce and stores it where every player reads it.
 *
 * One surface for Free and Pro: Free's player imports it, and the TextToSpeech
 * bundle exposes it as TextToSpeech.RestNonce for Pro's player.
 */

// WordPress's cookie check, and the plugin's own nonce check on visitor routes.
const NONCE_ERRORS = ['rest_cookie_invalid_nonce', 'rest_forbidden'];

let renewal = null;

const RestNonce = {
    /**
     * Was this reply a refused (expired or missing) nonce?
     *
     * @param {number} status HTTP status.
     * @param {*}      body   Decoded JSON body, or null.
     * @returns {boolean}
     */
    isExpired(status, body) {
        return 403 === status && !!body && NONCE_ERRORS.includes(body.code);
    },

    /**
     * Fetch a fresh nonce and store it for Free's and Pro's players. Concurrent
     * callers share one request.
     *
     * @returns {Promise<string>} The new nonce, or '' when none could be had.
     */
    renew() {
        if (renewal) {
            return renewal;
        }

        const root = String(window.ttsObj?.api_url || window.ttsObjPro?.json_url || '/wp-json/').replace(/\/?$/, '/');

        // No X-WP-Nonce header: the expired one would make this fail too.
        renewal = fetch(root + 'tta/v1/rest-nonce', { method: 'POST', credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const nonce = data && typeof data.nonce === 'string' ? data.nonce : '';
                if (nonce) {
                    if (window.ttsObj) {
                        window.ttsObj.rest_nonce = nonce;
                    }
                    if (window.ttsObjPro) {
                        window.ttsObjPro.rest_nonce = nonce;
                    }
                }
                return nonce;
            })
            .catch(() => '')
            .finally(() => {
                renewal = null;
            });

        return renewal;
    },
};

export default RestNonce;
