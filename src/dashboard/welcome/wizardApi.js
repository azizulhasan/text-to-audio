/**
 * Wizard API helper for REST calls.
 *
 * Sends data as FormData with `method` and `fields` params,
 * matching the existing TTA REST API convention.
 *
 * @param {string} endpoint - REST route suffix (e.g. 'settings-data', 'listening', 'customize').
 *                            Use 'settings-data' (not 'settings') — some security plugins
 *                            block any REST path ending in the exact segment "settings".
 * @param {Object} data     - Payload object to be JSON-stringified into `fields`.
 * @returns {Promise<Object>} Parsed JSON response.
 */
export const wizardFetch = async (endpoint, data) => {
    const formData = new FormData();
    formData.append('method', 'post');
    formData.append('fields', JSON.stringify(data));

    const res = await fetch(window.ttsWizardData.api_url + endpoint, {
        method: 'POST',
        body: formData,
        headers: {
            'X-WP-Nonce': window.ttsWizardData.nonce,
        },
    });

    return res.json();
};
