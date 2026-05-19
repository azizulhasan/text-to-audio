/**
 * Wizard API helper for REST calls.
 *
 * TTS-246: Sends payloads as `application/json` (was FormData). Cloudflare and
 * other front-of-site WAFs were rejecting our form-encoded POSTs to /wp-json/*
 * with HTML 403 pages — surfacing as a bogus "Unexpected token '<'" JS error
 * in the wizard. The REST handlers still call `json_decode($request['fields'])`
 * server-side, so the wire shape (`method` + JSON-stringified `fields`) is
 * preserved; only the transport encoding changed.
 *
 * @param {string} endpoint - REST route suffix (e.g. 'settings', 'listening', 'customize').
 * @param {Object} data     - Payload object to be JSON-stringified into `fields`.
 * @returns {Promise<Object>} Parsed JSON response.
 */
export const wizardFetch = async (endpoint, data) => {
    const body = JSON.stringify({
        method: 'post',
        fields: JSON.stringify(data),
    });

    const res = await fetch(window.ttsWizardData.api_url + endpoint, {
        method: 'POST',
        body,
        headers: {
            'X-WP-Nonce': window.ttsWizardData.nonce,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    // TTS-246: WAFs return HTML 403/5xx interstitials. Surface a useful payload
    // instead of throwing a JSON parse error in the UI.
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
        try { return await res.json(); } catch (e) { /* fall through */ }
    }
    const text = await res.text().catch(() => '');
    if (!res.ok) {
        return {
            status: false,
            httpStatus: res.status,
            code: 'non_json_response',
            message:
                res.status === 403
                    ? 'Request blocked (HTTP 403). A firewall may be rejecting REST writes.'
                    : `Unexpected response (HTTP ${res.status}).`,
            body: text.slice(0, 500),
        };
    }
    return { status: true, raw: text };
};
