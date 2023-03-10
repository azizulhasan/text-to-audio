var isString = function isString(value) {
    return typeof value === 'string' || value instanceof String;
};

var trim = function trim(value) {
    return isString(value) ? value.trim() : '';
};

let sentences = TTA.conntent.replace(/\.+/g, '.|').replace(/\?/g, '?|').replace(/\!/g, '!|').split("|").map(function (sentence) {
    return trim(sentence);
}).filter(Boolean)
console.log(sentences)