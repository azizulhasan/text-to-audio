"use strict";

// Object.defineProperty(exports, "__esModule", {
//   value: true
// });

// exports.trim = exports.isObject = exports.isNil = exports.isNan = exports.size = exports.isString = exports.validateLocale = exports.splitSentences = void 0;

// TTS-252: delegate to the shared abbreviation/number-aware splitter so the audio
// utterance chunks match the highlighter (admin/js/tts/utilities.js) exactly.
// speak-tts.js calls _utils.splitSentences, so it must stay on the default export.
import { splitSentences as sharedSplitSentences } from '../../sentence-splitter.js';

export const splitSentences = sharedSplitSentences;

export const bcp47LocalePattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len

/**
 * Validate a locale string to test if it is bcp47 compliant
 * @param {String} locale The tag locale to parse
 * @return {Boolean} True if tag is bcp47 compliant false otherwise
 */

export const validateLocale = function validateLocale(locale) {
  return typeof locale !== 'string' ? false : bcp47LocalePattern.test(locale);
};


export const isString = function isString(value) {
  return typeof value === 'string' || value instanceof String;
};


export const size = function size(value) {
  return value && Array.isArray(value) && value.length ? value.length : 0;
};


export const isNan = function isNan(value) {
  return typeof value === "number" && isNaN(value);
};



export const isNil = function isNil(value) {
  return value === null || value === undefined;
};



export const isObject = function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
};


export const trim = function trim(value) {
  return isString(value) ? value.trim() : '';
};

const _utils = {
  trim, isNan, isNil, isObject, size, isString, splitSentences, validateLocale
}
export default _utils;
