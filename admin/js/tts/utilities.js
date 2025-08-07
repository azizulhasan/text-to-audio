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
    let buttonText = window?.ttsObj?.buttonTextArr?.listen_text ?? 'Listen';
    let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.listen_hover_title ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.listen_hover_title : 'Text To Audio: Click to listen post.';

    if (window?.ttsObj?.player_customizations?.[1]?.play) {
        const parser = new DOMParser();
        // convert html string into DOM
        let document = parser.parseFromString(ttsObj?.player_customizations?.[1]?.play, "image/svg+xml");
        let icon = `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="${buttonHoverTitle}"><div class="tts_button">${document.documentElement.outerHTML}</div> <span>`;
        icon += buttonText + '<span></span></span>';
        icon += `<select >
            <option value="en-US">US</option>
            <option value="en-UK">US</option>
            <option value="en-AU">AU</option>
            <option value="en-IN">IN</option>
        </select>
        `;
        console.log(speechSynthesis.getVoices());

        return icon + '</div>';
    }

    return `<button id="tts__listent_content_${buttonId}" class="tts__listent_content  ${cssClass}" type="button" title="${buttonHoverTitle}"><div class="tts_button"><span class="dashicons dashicons-controls-play"></span><span>${buttonText}<span></div> </button>`;
}