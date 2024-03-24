/**
 * 
 * @param {*} value 
 * @returns 
 */
export const isString = function isString(value) {
    return typeof value === 'string' || value instanceof String;
};

/**
 * 
 * @param {*} value 
 * @returns 
 */
export const trim = function (value) {
    return isString(value) ? value.trim() : '';
};

/**
 * 
 * @param {*} text 
 * @returns 
 */
export const splitSentences = function splitSentences(text = '') {

    return text.replace(/\.+/g, '.|').replace(/\?/g, '?|').replace(/\!/g, '!|').split("|").map(function (sentence) {
        return trim(sentence);
    }).filter(Boolean);
};


export const getButtonContent = (buttonId, cssClass, isProLicenseActive) => {
    // return wp.hooks.applyFilters('tts__listening_button', `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="Text To Audio:  Tap to listen post."><div class="tts_button"><span class="dashicons dashicons-controls-play"></span><span>Listen<span></div> </button>`, buttonId)
    let buttonText = ttsObj?.buttonTextArr?.listen_text ?? 'Listen';

    if(ttsObj?.player_customizations?.[1]?.play) {
        const parser = new DOMParser();
        // convert html string into DOM
        let document = parser.parseFromString(ttsObj?.player_customizations?.[1]?.play, "image/svg+xml");
        let icon = `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="Text To Audio:  Tap to listen post."><div className="tts_button">${document.documentElement.outerHTML}</div> <span>`;
        return icon + ' ' + buttonText + '<span></span></span></div>';
    }

    return `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="Text To Audio:  Tap to listen post."><div class="tts_button"><span class="dashicons dashicons-controls-play"></span><span>${buttonText}<span></div> </button>`;
}