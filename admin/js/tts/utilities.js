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