/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/speak-tts/lib/speak-tts.js":
/*!*************************************************!*\
  !*** ./node_modules/speak-tts/lib/speak-tts.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _utils = __webpack_require__(/*! ./utils */ "./node_modules/speak-tts/lib/utils.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SpeakTTS =
/*#__PURE__*/
function () {
  function SpeakTTS() {
    _classCallCheck(this, SpeakTTS);

    this.browserSupport = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    this.synthesisVoice = null;
  }

  _createClass(SpeakTTS, [{
    key: "init",
    value: function init() {
      var _this = this;

      var conf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return new Promise(function (resolve, reject) {
        if (!_this.browserSupport) {
          reject('Your browser does not support Speech Synthesis');
        }

        var listeners = (0, _utils.isNil)(conf.listeners) ? {} : conf.listeners;
        var splitSentences = (0, _utils.isNil)(conf.splitSentences) ? true : conf.splitSentences;
        var lang = (0, _utils.isNil)(conf.lang) ? undefined : conf.lang;
        var volume = (0, _utils.isNil)(conf.volume) ? 1 : conf.volume;
        var rate = (0, _utils.isNil)(conf.rate) ? 1 : conf.rate;
        var pitch = (0, _utils.isNil)(conf.pitch) ? 1 : conf.pitch;
        var voice = (0, _utils.isNil)(conf.voice) ? undefined : conf.voice; // Attach event listeners

        Object.keys(listeners).forEach(function (listener) {
          var fn = listeners[listener];

          var newListener = function newListener(data) {
            fn && fn(data);
          };

          if (listener !== 'onvoiceschanged') {
            speechSynthesis[listener] = newListener;
          }
        });

        _this._loadVoices().then(function (voices) {
          // Handle callback onvoiceschanged by hand
          listeners['onvoiceschanged'] && listeners['onvoiceschanged'](voices); // Initialize values if necessary

          !(0, _utils.isNil)(lang) && _this.setLanguage(lang);
          !(0, _utils.isNil)(voice) && _this.setVoice(voice);
          !(0, _utils.isNil)(volume) && _this.setVolume(volume);
          !(0, _utils.isNil)(rate) && _this.setRate(rate);
          !(0, _utils.isNil)(pitch) && _this.setPitch(pitch);
          !(0, _utils.isNil)(splitSentences) && _this.setSplitSentences(splitSentences);
          resolve({
            voices: voices,
            lang: _this.lang,
            voice: _this.voice,
            volume: _this.volume,
            rate: _this.rate,
            pitch: _this.pitch,
            splitSentences: _this.splitSentences,
            browserSupport: _this.browserSupport
          });
        }).catch(function (e) {
          reject(e);
        });
      });
    }
  }, {
    key: "_fetchVoices",
    value: function _fetchVoices() {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var voices = speechSynthesis.getVoices();

          if ((0, _utils.size)(voices) > 0) {
            return resolve(voices);
          } else {
            return reject("Could not fetch voices");
          }
        }, 100);
      });
    }
  }, {
    key: "_loadVoices",
    value: function _loadVoices() {
      var _this2 = this;

      var remainingAttempts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
      return this._fetchVoices().catch(function (error) {
        if (remainingAttempts === 0) throw error;
        return _this2._loadVoices(remainingAttempts - 1);
      });
    }
  }, {
    key: "hasBrowserSupport",
    value: function hasBrowserSupport() {
      return this.browserSupport;
    }
  }, {
    key: "setVoice",
    value: function setVoice(voice) {
      var synthesisVoice;
      var voices = speechSynthesis.getVoices(); // set voice by name

      if ((0, _utils.isString)(voice)) {
        synthesisVoice = voices.find(function (v) {
          return v.name === voice;
        });
      } // Set the voice in conf if found


      if ((0, _utils.isObject)(voice)) {
        synthesisVoice = voice;
      }

      if (synthesisVoice) {
        this.synthesisVoice = synthesisVoice;
      } else {
        throw 'Error setting voice. The voice you passed is not valid or the voices have not been loaded yet.';
      }
    }
  }, {
    key: "setLanguage",
    value: function setLanguage(lang) {
      lang = lang.replace('_', '-'); // some Android versions seem to ignore BCP 47 and use an underscore character in language tag

      if ((0, _utils.validateLocale)(lang)) {
        this.lang = lang;
      } else {
        throw 'Error setting language. Please verify your locale is BCP47 format (http://schneegans.de/lv/?tags=es-FR&format=text)';
      }
    }
  }, {
    key: "setVolume",
    value: function setVolume(volume) {
      volume = parseFloat(volume);

      if (!(0, _utils.isNan)(volume) && volume >= 0 && volume <= 1) {
        this.volume = volume;
      } else {
        throw 'Error setting volume. Please verify your volume value is a number between 0 and 1.';
      }
    }
  }, {
    key: "setRate",
    value: function setRate(rate) {
      rate = parseFloat(rate);

      if (!(0, _utils.isNan)(rate) && rate >= 0 && rate <= 10) {
        this.rate = rate;
      } else {
        throw 'Error setting rate. Please verify your volume value is a number between 0 and 10.';
      }
    }
  }, {
    key: "setPitch",
    value: function setPitch(pitch) {
      pitch = parseFloat(pitch);

      if (!(0, _utils.isNan)(pitch) && pitch >= 0 && pitch <= 2) {
        this.pitch = pitch;
      } else {
        throw 'Error setting pitch. Please verify your pitch value is a number between 0 and 2.';
      }
    }
  }, {
    key: "setSplitSentences",
    value: function setSplitSentences(splitSentences) {
      this.splitSentences = splitSentences;
    }
  }, {
    key: "speak",
    value: function speak(data) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var text = data.text,
            _data$listeners = data.listeners,
            listeners = _data$listeners === void 0 ? {} : _data$listeners,
            _data$queue = data.queue,
            queue = _data$queue === void 0 ? true : _data$queue;
        var msg = (0, _utils.trim)(text);
        if ((0, _utils.isNil)(msg)) resolve(); // Stop current speech

        !queue && _this3.cancel(); // Split into sentences (for better result and bug with some versions of chrome)

        var utterances = [];
        var sentences = _this3.splitSentences ? (0, _utils.splitSentences)(msg) : [msg];
        sentences.forEach(function (sentence, index) {
          var isLast = index === (0, _utils.size)(sentences) - 1;
          var utterance = new SpeechSynthesisUtterance();
          if (_this3.synthesisVoice) utterance.voice = _this3.synthesisVoice;
          if (_this3.lang) utterance.lang = _this3.lang;
          if (_this3.volume) utterance.volume = _this3.volume; // 0 to 1

          if (_this3.rate) utterance.rate = _this3.rate; // 0.1 to 10

          if (_this3.pitch) utterance.pitch = _this3.pitch; //0 to 2

          utterance.text = sentence; // Attach event listeners

          Object.keys(listeners).forEach(function (listener) {
            var fn = listeners[listener];

            var newListener = function newListener(data) {
              fn && fn(data);

              if (listener === 'onerror') {
                reject({
                  utterances: utterances,
                  lastUtterance: utterance,
                  error: data
                });
              }

              if (listener === 'onend') {
                if (isLast) resolve({
                  utterances: utterances,
                  lastUtterance: utterance
                });
              }
            };

            utterance[listener] = newListener;
          });
          utterances.push(utterance);
          speechSynthesis.speak(utterance);
        });
      });
    }
  }, {
    key: "pending",
    value: function pending() {
      return speechSynthesis.pending;
    }
  }, {
    key: "paused",
    value: function paused() {
      return speechSynthesis.paused;
    }
  }, {
    key: "speaking",
    value: function speaking() {
      return speechSynthesis.speaking;
    }
  }, {
    key: "pause",
    value: function pause() {
      speechSynthesis.pause();
    }
  }, {
    key: "resume",
    value: function resume() {
      speechSynthesis.resume();
    }
  }, {
    key: "cancel",
    value: function cancel() {
      speechSynthesis.cancel();
    }
  }]);

  return SpeakTTS;
}();

var _default = SpeakTTS;
exports["default"] = _default;

/***/ }),

/***/ "./node_modules/speak-tts/lib/utils.js":
/*!*********************************************!*\
  !*** ./node_modules/speak-tts/lib/utils.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.trim = exports.isObject = exports.isNil = exports.isNan = exports.size = exports.isString = exports.validateLocale = exports.splitSentences = void 0;

var splitSentences = function splitSentences() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return text.replace(/\.+/g, '.|').replace(/\?/g, '?|').replace(/\!/g, '!|').split("|").map(function (sentence) {
    return trim(sentence);
  }).filter(Boolean);
};

exports.splitSentences = splitSentences;
var bcp47LocalePattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len

/**
 * Validate a locale string to test if it is bcp47 compliant
 * @param {String} locale The tag locale to parse
 * @return {Boolean} True if tag is bcp47 compliant false otherwise
 */

var validateLocale = function validateLocale(locale) {
  return typeof locale !== 'string' ? false : bcp47LocalePattern.test(locale);
};

exports.validateLocale = validateLocale;

var isString = function isString(value) {
  return typeof value === 'string' || value instanceof String;
};

exports.isString = isString;

var size = function size(value) {
  return value && Array.isArray(value) && value.length ? value.length : 0;
};

exports.size = size;

var isNan = function isNan(value) {
  return typeof value === "number" && isNaN(value);
};

exports.isNan = isNan;

var isNil = function isNil(value) {
  return value === null || value === undefined;
};

exports.isNil = isNil;

var isObject = function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
};

exports.isObject = isObject;

var trim = function trim(value) {
  return isString(value) ? value.trim() : '';
};

exports.trim = trim;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************************!*\
  !*** ./admin/js/text-to-audio.js ***!
  \***********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var speak_tts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! speak-tts */ "./node_modules/speak-tts/lib/speak-tts.js");
 // const ttaGetData = async (url = '', data = {}) => {
// 	// Default options are marked with *
// 	const response = await fetch(url, {
// 		// headers: {
// 		//   "Content-Type": "application/json",
// 		// },
// 		method: 'POST', // *GET, POST, PUT, DELETE, etc.
// 		body: data, // body data type must match "Content-Type" header
// 	});
// 	const responseData = await response.json(); // parses JSON response into native JavaScript objects
// 	return responseData;
// };
// let recordSettings = {}
// let recordData = new FormData();
// ttaGetData(text_to_audio_obj.json_url + 'tta/v1/record', recordData)
// 	.then((res) => {
// 		recordSettings = res.data;
// 		recognition.continuous = recordSettings.is_record_continously
// 			? recordSettings.is_record_continously
// 			: true;
// 		recognition.lang = recordSettings.tta__recording__lang
// 			? recordSettings.tta__recording__lang
// 			: 'en-US';
// 		localStorage.setItem(
// 			'tta__sentence_delimiter',
// 			recordSettings.tta__sentence_delimiter,
// 		);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

var TTA = {
  speechSynthesis: true,
  utterence: new SpeechSynthesisUtterance(),
  speechRecognitionIsActive: true,
  speechRecognition: window.speechRecognition || window.webkitSpeechRecognition,
  recordStatus: 'record',
  listenStatus: 'listen',
  noticeClass: 'tta_notice',
  timer: null,
  speakButton: document.getElementById("tta__listent_content_1"),
  conntent: document.getElementById("content_1").innerHTML,
  languages: null,
  voices: null,
  // pauseResumeTimer: () => {
  // 	speechSynthesis.pause();
  // 	//IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
  // 	console.log(TTA.utterence);
  // 	// Placing the speak invocation inside a callback fixes ordering and onend issues
  // 	setTimeout(() => {
  // 		speechSynthesis.resume();
  // 	}, 0);
  // 	timer = setTimeout(TTA.pauseResumeTimer, 10000)
  // },
  buttonTextArr: text_to_audio_obj.buttonTextArr,
  playButtonText: function playButtonText() {
    return this.buttonTextArr.listen_text;
  },
  playButtonContent: function playButtonContent() {
    return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.playButtonText() + '<span></span></span></div>';
  },
  replayButtonText: function replayButtonText() {
    return this.buttonTextArr.replay_text;
  },
  replayButtonContent: function replayButtonContent() {
    return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-image-rotate"></span> <span> ' + this.replayButtonText() + '<span></span></span></div>';
  },
  pauseButtonText: function pauseButtonText() {
    return this.buttonTextArr.pause_text;
  },
  pauseButtonContent: function pauseButtonContent() {
    return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-pause"></span> <span> ' + this.pauseButtonText() + '<span></span></span></div>';
  },
  resumeButtonText: function resumeButtonText() {
    return this.buttonTextArr.resume_text;
  },
  resumeButtonContent: function resumeButtonContent() {
    return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.buttonTextArr.resume_text + '<span></span></span></div>';
  },
  recordStartButtonContent: function recordStartButtonContent() {
    return '<span class="dashicons dashicons-controls-volumeoff"></span> ' + this.buttonTextArr.start_text;
  },
  recordStopButtonConten: function recordStopButtonConten() {
    return '<span class="dashicons dashicons-controls-volumeon"></span> ' + this.buttonTextArr.stop_text;
  },
  displayApiMissing: function displayApiMissing() {
    var button_id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var is_dashboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var notice = '';
    var link = '';

    if (!this.TTA.speechRecognitionIsActive) {
      notice += 'Text To Audio: Please enable speechRecognition';
    }

    if (!this.speechSynthesis) {
      if (notice) {
        notice += ' , speechSynthesis.';
      } else {
        notice += 'Text To Audio: Please enable speechSynthesis.';
      }
    }

    if (button_id) {
      var previousSibling = document.getElementById(button_id).previousSibling;

      if (previousSibling) {
        notice += " Click here to <a href=\"https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F\" target=\"_blank\">enable</a>";
        previousSibling.style.display = 'block';
        previousSibling.innerHTML = notice;
        setTimeout(function () {
          document.querySelector('.tta_notice').style.display = 'none';
          previousSibling.innerHTML = '';
        }, 5000);
      } else {
        link += text_to_audio_obj.admin_url + 'admin.php?page=text-to-audio#/docs';
        notice += "\nFollow this link to enable: \n".concat(link);
        alert(notice);
      }
    } else {
      if (is_dashboard) {
        link += text_to_audio_obj.admin_url + 'admin.php?page=text-to-audio#/docs';
      } else {
        if (location.search === '?page=text-to-audio' && location.hash === '#/customize') {
          link += text_to_audio_obj.admin_url + 'admin.php?page=text-to-audio#/docs';
        } else {
          link += 'https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F';
        }
      }

      notice += "\nFollow this link to enable: \n".concat(link);
      alert(notice);
    }

    throw new Error(notice);
  }
}; // let Speech = require("speak-tts");

function _init() {
  var speech = new speak_tts__WEBPACK_IMPORTED_MODULE_0__["default"]();
  speech.init({
    volume: 0.5,
    lang: "en-GB",
    rate: 1,
    pitch: 1,
    //'voice':'Google UK English Male',
    //'splitSentences': false,
    listeners: {
      onvoiceschanged: function onvoiceschanged(voices) {
        console.log("Voices changed", voices);
      }
    }
  }).then(function (data) {
    console.log("Speech is ready", data); // if (listeningSettings) {
    // 	TTA.utterence.voice = voices.filter(
    // 		(voice, i) => voice.name === listeningSettings.tta__listening_voice,
    // 	)[0];
    // } else {

    TTA.voices = data.voices; // }
    // _addVoicesList(data.voices);

    _prepareSpeakButton(speech);
  })["catch"](function (e) {
    console.error("An error occured while initializing : ", e);
  }); // This will require for later.
  // const text = speech.hasBrowserSupport()
  // 	? "Hurray, your browser supports speech synthesis"
  // 	: "Your browser does NOT support speech synthesis. Try using Chrome of Safari instead !";
  // document.getElementById("support").innerHTML = text;
}

function _prepareSpeakButton(speech) {
  TTA.speakButton.addEventListener("click", function () {
    var language = TTA.voices[0].lang;
    var voice = TTA.voices[0].name;
    if (language) speech.setLanguage(language);
    if (voice) speech.setVoice(voice);
    speech.speak({
      text: TTA.conntent,
      queue: false,
      listeners: {
        onstart: function onstart() {
          console.log("Start utterance");
        },
        onend: function onend() {
          console.log('End utterance');
          TTA.speakButton.innerHTML = TTA.replayButtonContent();
          TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.replayButtonText());
          TTA.listenStatus = 'listen';
        },
        onresume: function onresume() {
          console.log("Resume utterance");
        },
        onboundary: function onboundary(event) {
          console.log(event.name + " boundary reached after " + event.elapsedTime + " milliseconds.");
        }
      }
    }).then(function (data) {
      console.log("Success !", data);
    })["catch"](function (e) {
      console.error("An error occurred :", e);
    });
  });
  TTA.speakButton.addEventListener("click", function () {
    if (TTA.listenStatus == 'listen') {
      TTA.speakButton.innerHTML = TTA.pauseButtonContent();
      TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
      TTA.listenStatus = 'pause';
    } else if (TTA.listenStatus == 'pause') {
      speech.pause();
      TTA.speakButton.innerHTML = TTA.resumeButtonContent();
      TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.resumeButtonText());
      TTA.listenStatus = 'resume';
    } else if (TTA.listenStatus == 'resume') {
      speech.resume();
      TTA.speakButton.innerHTML = TTA.pauseButtonContent();
      TTA.listenStatus = 'pause';
      TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
    }
  });
}

_init();

window.tta = TTA;
})();

/******/ })()
;