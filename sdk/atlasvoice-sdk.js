/**
 * AtlasVoice SDK - Text-to-Speech JavaScript SDK
 *
 * A standalone JavaScript SDK for adding text-to-speech to any website.
 * Uses the browser's built-in speechSynthesis API.
 *
 * @version 1.0.0
 * @license GPL-3.0+
 * @see https://atlasaidev.com/
 *
 * Usage (standalone):
 *   const player = new AtlasVoice({
 *     contentSelector: '#article-body',
 *     playerSelector: '#tts-player',
 *   });
 *
 * Usage (with analytics):
 *   const player = new AtlasVoice({
 *     contentSelector: '#article-body',
 *     playerSelector: '#tts-player',
 *     analytics: {
 *       enabled: true,
 *       wpRestUrl: 'https://yoursite.com/wp-json',
 *       postId: 123,
 *       credentials: { username: 'sdk-user', password: 'XXXX XXXX XXXX' }
 *     }
 *   });
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.AtlasVoice = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. EventBus — Simple pub/sub
  // =========================================================================
  class EventBus {
    constructor() {
      this._listeners = {};
    }

    on(event, callback) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);
      return this;
    }

    off(event, callback) {
      if (!this._listeners[event]) return this;
      if (callback) {
        this._listeners[event] = this._listeners[event].filter(function (cb) {
          return cb !== callback;
        });
      } else {
        delete this._listeners[event];
      }
      return this;
    }

    emit(event, data) {
      var listeners = this._listeners[event];
      if (listeners && listeners.length) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](data);
          } catch (e) {
            console.error('[AtlasVoice] Event listener error:', e);
          }
        }
      }
      return this;
    }
  }

  // =========================================================================
  // 2. ContentCleaner — Client-side content cleanup
  //    Reuses patterns from tta_clean_content() and TTA_Helper::sazitize_content()
  // =========================================================================
  class ContentCleaner {

    /**
     * Clean raw HTML content to plain text suitable for speech.
     * @param {string} rawHTML - Raw HTML or text content
     * @returns {string} Cleaned plain text
     */
    clean(rawHTML) {
      if (!rawHTML) return '';

      var text = rawHTML;

      // 1. Strip HTML tags using DOMParser if available, otherwise regex
      if (typeof DOMParser !== 'undefined') {
        try {
          var doc = new DOMParser().parseFromString(text, 'text/html');
          // Remove script and style elements first
          var scripts = doc.querySelectorAll('script, style, noscript');
          for (var i = 0; i < scripts.length; i++) {
            scripts[i].remove();
          }
          text = doc.body.textContent || doc.body.innerText || '';
        } catch (e) {
          text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
          text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
          text = text.replace(/<[^>]+>/g, '');
        }
      } else {
        text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
        text = text.replace(/<[^>]+>/g, '');
      }

      // 2. Replace HTML entities — reuses tta_clean_content() entity mappings
      var quotationMarks = {
        '&#8216;': "'", '&#8217;': "'",
        '&rsquo;': "'", '&lsquo;': "'",
        '&#8218;': '',
        '&#8220;': '"', '&#8221;': '"',
        '&#8222;': '"',
        '&ldquo;': '"', '&rdquo;': '"',
        '&quot;': '"'
      };

      var otherMarks = {
        '&auml;': '\u00e4', '&Auml;': '\u00c4',
        '&ouml;': '\u00f6', '&Ouml;': '\u00d6',
        '&uuml;': '\u00fc', '&Uuml;': '\u00dc',
        '&szlig;': '\u00df',
        '&euro;': '\u20ac',
        '&copy;': '\u00a9',
        '&trade;': '\u2122',
        '&reg;': '\u00ae',
        '&nbsp;': ' ',
        '&mdash;': '\u2014',
        '&amp;': '&',
        '&gt;': 'greater than',
        '&lt;': 'less than',
        '&#8211;': '-',
        '&#8212;': '\u2014'
      };

      var key;
      for (key in quotationMarks) {
        if (quotationMarks.hasOwnProperty(key)) {
          text = text.split(key).join(quotationMarks[key]);
        }
      }
      for (key in otherMarks) {
        if (otherMarks.hasOwnProperty(key)) {
          text = text.split(key).join(otherMarks[key]);
        }
      }

      // 3. Remove shortcodes — [shortcode]...[/shortcode] and [shortcode attr="val"]
      text = text.replace(/\[[\w-]+(?:\s[^\]]*?)?\][\s\S]*?\[\/[\w-]+\]/g, '');
      text = text.replace(/\[[\w-]+(?:\s[^\]]*?)?\/?]/g, '');

      // 4. Remove URLs — reuses TTA_Helper::sazitize_content() URL regex
      text = text.replace(/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/gi, '');

      // 5. Remove extra whitespace/newlines — reuses clean_string() patterns
      text = text.replace(/\s{2,}/g, ' ');
      text = text.replace(/\n{2,}/g, '\n');

      // 6. Trim
      text = text.trim();

      return text;
    }

    /**
     * Split text into sentences for speaking.
     * Reuses existing pattern from utilities.js: split on . ? ! with pipe delimiter
     * @param {string} text - Plain text
     * @returns {string[]} Array of sentences
     */
    splitSentences(text) {
      if (!text) return [];
      return text
        .replace(/\.+/g, '.|')
        .replace(/\?/g, '?|')
        .replace(/!/g, '!|')
        .split('|')
        .map(function (sentence) {
          return typeof sentence === 'string' ? sentence.trim() : '';
        })
        .filter(Boolean);
    }
  }

  // =========================================================================
  // 3. VoiceManager — Device voices & languages
  //    Reuses patterns from BrowserSupport.js and speak-tts.js
  // =========================================================================
  class VoiceManager {
    constructor() {
      this.voices = [];
      this.currentVoice = null;
      this.currentLang = null;
      this._voicesLoaded = false;
    }

    /**
     * Load voices from the device with retry.
     * Reuses _loadVoices() retry pattern (10 attempts, 100ms delay) from speak-tts.js
     * @param {number} remainingAttempts
     * @returns {Promise<SpeechSynthesisVoice[]>}
     */
    loadVoices(remainingAttempts) {
      if (remainingAttempts === undefined) remainingAttempts = 10;
      var self = this;
      return this._fetchVoices().then(function (voices) {
        self.voices = voices;
        self._voicesLoaded = true;
        return voices;
      }).catch(function (error) {
        if (remainingAttempts === 0) throw error;
        return self.loadVoices(remainingAttempts - 1);
      });
    }

    /**
     * @private
     */
    _fetchVoices() {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            resolve(voices);
          } else {
            reject('Could not fetch voices');
          }
        }, 100);
      });
    }

    /**
     * Get all available voices on the device.
     * @returns {SpeechSynthesisVoice[]}
     */
    getVoices() {
      return this.voices;
    }

    /**
     * Get unique language codes from available voices.
     * @returns {string[]}
     */
    getLanguages() {
      var langMap = {};
      for (var i = 0; i < this.voices.length; i++) {
        var lang = this.voices[i].lang;
        if (lang && !langMap[lang]) {
          langMap[lang] = true;
        }
      }
      return Object.keys(langMap).sort();
    }

    /**
     * Get voices filtered by language code prefix.
     * Reuses #getFilteredVoices() from BrowserSupport.js
     * @param {string} langCode
     * @returns {SpeechSynthesisVoice[]}
     */
    getVoicesByLang(langCode) {
      var countryCode = this.getCountryCode(langCode);
      var regex = new RegExp('^' + countryCode, 'i');
      return this.voices.filter(function (voice) {
        return regex.test(voice.lang) && voice.name;
      });
    }

    /**
     * Set current voice by name.
     * @param {string} voiceName
     * @returns {boolean} true if found and set
     */
    setVoice(voiceName) {
      for (var i = 0; i < this.voices.length; i++) {
        if (this.voices[i].name === voiceName) {
          this.currentVoice = this.voices[i];
          this.currentLang = this.voices[i].lang;
          return true;
        }
      }
      return false;
    }

    /**
     * Set current language and find best matching voice.
     * @param {string} langCode
     * @returns {boolean} true if a matching voice was found
     */
    setLang(langCode) {
      this.currentLang = langCode;
      var matchingVoices = this.getVoicesByLang(langCode);
      if (matchingVoices.length > 0) {
        this.currentVoice = matchingVoices[0];
        this.currentLang = matchingVoices[0].lang;
        return true;
      }
      return false;
    }

    /**
     * Find the best voice for a given language.
     * Reuses defineVoiceAndLang() from BrowserSupport.js
     * @param {string} voice - Voice name preference
     * @param {string} lang - Language code preference
     * @returns {{voice: string, lang: string}}
     */
    findBestVoice(voice, lang) {
      var countryCode = this.getCountryCode(lang);
      var filtered = this.getVoicesByLang(countryCode);
      var resultVoice = voice;
      var resultLang = lang;

      if (filtered.length > 1) {
        // Try to find exact voice match
        for (var j = 0; j < filtered.length; j++) {
          resultLang = filtered[j].lang;
          resultVoice = filtered[j].name;
          if (voice === filtered[j].name) {
            break;
          }
        }
      } else if (filtered.length === 1) {
        resultVoice = filtered[0].name;
        resultLang = filtered[0].lang;
      }

      return { voice: resultVoice, lang: resultLang };
    }

    /**
     * Extract base country code from a locale string.
     * Reuses #getCountryCode() from BrowserSupport.js
     * @param {string} selectedLang
     * @returns {string}
     */
    getCountryCode(selectedLang) {
      if (!selectedLang) return '';
      if (selectedLang.indexOf('-') !== -1) {
        return selectedLang.split('-')[0];
      }
      if (selectedLang.indexOf('_') !== -1) {
        return selectedLang.split('_')[0];
      }
      return selectedLang;
    }
  }

  // =========================================================================
  // 4. SpeechEngine — Wraps speechSynthesis
  //    Reuses patterns from TextToSpeech.js and speak-tts.js
  // =========================================================================
  class SpeechEngine {
    constructor(eventBus) {
      this.synth = window.speechSynthesis;
      this.eventBus = eventBus;
      this.sentences = [];
      this.currentIndex = 0;
      this.isCanceled = false;
      this.timer = null;
      this.cancelTimer = null;
      this._speaking = false;
      this.config = {
        voice: null,       // SpeechSynthesisVoice object
        voiceName: '',
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1
      };
    }

    /**
     * Initialize with config.
     * @param {Object} conf
     */
    init(conf) {
      if (conf.voice) this.config.voice = conf.voice;
      if (conf.voiceName) this.config.voiceName = conf.voiceName;
      if (conf.lang) this.config.lang = conf.lang;
      if (conf.rate !== undefined) this.config.rate = parseFloat(conf.rate) || 1;
      if (conf.pitch !== undefined) this.config.pitch = parseFloat(conf.pitch) || 1;
      if (conf.volume !== undefined) this.config.volume = parseFloat(conf.volume) || 1;
    }

    /**
     * Speak an array of sentences.
     * Reuses speak-tts.js pattern: creates utterance per sentence, resolves on last onend.
     * Also implements Chrome 15-second bug workaround from TextToSpeech.js.
     * @param {string[]} sentences
     * @returns {Promise}
     */
    speak(sentences) {
      var self = this;
      this.sentences = sentences;
      this.currentIndex = 0;
      this.isCanceled = false;
      this._speaking = true;

      // Cancel any ongoing speech
      this.synth.cancel();

      return new Promise(function (resolve, reject) {
        if (!sentences || sentences.length === 0) {
          self._speaking = false;
          resolve();
          return;
        }

        var utterances = [];
        sentences.forEach(function (sentence, index) {
          var isLast = index === sentences.length - 1;
          var utterance = new SpeechSynthesisUtterance();

          // Apply config
          if (self.config.voice) utterance.voice = self.config.voice;
          if (self.config.lang) utterance.lang = self.config.lang;
          if (self.config.volume !== undefined) utterance.volume = self.config.volume;
          if (self.config.rate !== undefined) utterance.rate = self.config.rate;
          if (self.config.pitch !== undefined) utterance.pitch = self.config.pitch;

          utterance.text = sentence;

          utterance.onstart = function () {
            self.currentIndex = index;
          };

          utterance.onend = function () {
            if (isLast) {
              self._speaking = false;
              self._clearTimers();
              self.eventBus.emit('end', { utterances: utterances });
              resolve({ utterances: utterances, lastUtterance: utterance });
            }
          };

          utterance.onerror = function (e) {
            // Ignore 'interrupted' errors from cancel()
            if (e.error === 'interrupted' || e.error === 'canceled') return;
            self._speaking = false;
            self._clearTimers();
            self.eventBus.emit('error', e);
            reject({ error: e, utterances: utterances });
          };

          utterances.push(utterance);
          self.synth.speak(utterance);
        });

        // Chrome 15-second bug workaround
        // Reuses TextToSpeech.js timer logic: pause/resume every 10 seconds
        if (!self._isAndroid()) {
          self.timer = setTimeout(function pauseResumeTimer() {
            if (self.synth.speaking && !self.isCanceled) {
              self.synth.pause();
              setTimeout(function () {
                self.synth.resume();
              }, 0);
              self.timer = setTimeout(pauseResumeTimer, 10000);
            } else {
              self._clearTimers();
            }
          }, 10000);
        }
      });
    }

    /**
     * Pause speech.
     * Reuses cancel-and-track pattern from TextToSpeech.pause()
     * On desktop: pause then cancel after brief delay
     * On mobile: cancel immediately
     */
    pause() {
      var self = this;
      if (!this._isAndroid()) {
        this.synth.pause();
        this.cancelTimer = setInterval(function () {
          self.synth.cancel();
          self.isCanceled = true;
        }, 1);
      } else {
        this.synth.cancel();
        this.isCanceled = true;
      }

      this._speaking = false;
      this._clearTimer();
      this.eventBus.emit('pause', { currentIndex: this.currentIndex });
    }

    /**
     * Resume speech from tracked position.
     * Reuses cancel-and-resume pattern from TextToSpeech.resume()
     */
    resume() {
      var self = this;
      if (this.isCanceled) {
        // Re-speak from current position
        clearInterval(this.cancelTimer);
        this.cancelTimer = null;
        this._clearTimer();

        var remaining = this.sentences.slice(this.currentIndex);
        if (remaining.length > 0) {
          this._speaking = true;
          this.eventBus.emit('resume', { currentIndex: this.currentIndex });
          this.speak(remaining);
        }
      } else {
        this.synth.resume();
        clearInterval(this.cancelTimer);
        this.cancelTimer = null;
        this._speaking = true;
        this.eventBus.emit('resume', { currentIndex: this.currentIndex });

        // Restart Chrome bug workaround
        if (!this._isAndroid()) {
          var thisEngine = this;
          this.timer = setTimeout(function pauseResumeTimer() {
            if (thisEngine.synth.speaking && !thisEngine.isCanceled) {
              thisEngine.synth.pause();
              setTimeout(function () {
                thisEngine.synth.resume();
              }, 0);
              thisEngine.timer = setTimeout(pauseResumeTimer, 10000);
            } else {
              thisEngine._clearTimers();
            }
          }, 10000);
        }
      }
    }

    /**
     * Cancel all speech.
     */
    cancel() {
      this.synth.cancel();
      this.isCanceled = true;
      this._speaking = false;
      this._clearTimers();
    }

    /**
     * Check if currently speaking.
     * @returns {boolean}
     */
    speaking() {
      return this._speaking || this.synth.speaking;
    }

    // Voice/lang/rate/pitch/volume setters
    setVoice(voiceObj) {
      this.config.voice = voiceObj;
    }
    setVoiceName(name) {
      this.config.voiceName = name;
    }
    setLang(lang) {
      this.config.lang = lang;
    }
    setRate(rate) {
      this.config.rate = parseFloat(rate) || 1;
    }
    setPitch(pitch) {
      this.config.pitch = parseFloat(pitch) || 1;
    }
    setVolume(volume) {
      this.config.volume = parseFloat(volume) || 1;
    }

    /**
     * Detect Android device.
     * Reuses BrowserSupport.isAndroid()
     * @returns {boolean}
     * @private
     */
    _isAndroid() {
      var ua = navigator.userAgent.toLowerCase();
      return ua.indexOf('android') > -1;
    }

    /** @private */
    _clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }

    /** @private */
    _clearTimers() {
      this._clearTimer();
      if (this.cancelTimer) {
        clearInterval(this.cancelTimer);
        this.cancelTimer = null;
      }
    }
  }

  // =========================================================================
  // 5. PlayerUI — Renders player into container
  // =========================================================================
  class PlayerUI {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.container = null;
      this.elements = {};
      this.theme = 'default';
      this._destroyed = false;
    }

    /**
     * Render the player UI into a container element.
     * @param {HTMLElement} container
     * @param {Object} options
     */
    render(container, options) {
      if (!container) return;
      this.container = container;
      this.theme = (options && options.theme) || 'default';

      // Build player HTML
      var player = document.createElement('div');
      player.className = 'atlasvoice-player atlasvoice-theme-' + this.theme;

      // Controls row
      var controls = document.createElement('div');
      controls.className = 'atlasvoice-controls';

      // Play button
      var playBtn = document.createElement('button');
      playBtn.className = 'atlasvoice-btn atlasvoice-btn-play';
      playBtn.type = 'button';
      playBtn.title = 'Play';
      playBtn.innerHTML = this._playIcon() + ' <span class="atlasvoice-btn-text">Play</span>';
      controls.appendChild(playBtn);

      // Voice select
      var voiceGroup = document.createElement('div');
      voiceGroup.className = 'atlasvoice-select-group';
      var voiceLabel = document.createElement('label');
      voiceLabel.className = 'atlasvoice-label';
      voiceLabel.textContent = 'Voice:';
      var voiceSelect = document.createElement('select');
      voiceSelect.className = 'atlasvoice-select atlasvoice-select-voice';
      voiceSelect.title = 'Select voice';
      voiceGroup.appendChild(voiceLabel);
      voiceGroup.appendChild(voiceSelect);
      controls.appendChild(voiceGroup);

      // Language select
      var langGroup = document.createElement('div');
      langGroup.className = 'atlasvoice-select-group';
      var langLabel = document.createElement('label');
      langLabel.className = 'atlasvoice-label';
      langLabel.textContent = 'Lang:';
      var langSelect = document.createElement('select');
      langSelect.className = 'atlasvoice-select atlasvoice-select-lang';
      langSelect.title = 'Select language';
      langGroup.appendChild(langLabel);
      langGroup.appendChild(langSelect);
      controls.appendChild(langGroup);

      player.appendChild(controls);

      // Status row
      var status = document.createElement('div');
      status.className = 'atlasvoice-status';
      status.textContent = 'Ready';
      player.appendChild(status);

      container.appendChild(player);

      // Store references
      this.elements.player = player;
      this.elements.playBtn = playBtn;
      this.elements.voiceSelect = voiceSelect;
      this.elements.langSelect = langSelect;
      this.elements.status = status;

      // Bind events
      var self = this;
      playBtn.addEventListener('click', function () {
        self.eventBus.emit('ui:playbtn');
      });

      voiceSelect.addEventListener('change', function () {
        self.eventBus.emit('ui:voicechange', { value: voiceSelect.value });
      });

      langSelect.addEventListener('change', function () {
        self.eventBus.emit('ui:langchange', { value: langSelect.value });
      });
    }

    /**
     * Update UI state.
     * @param {'idle'|'playing'|'paused'} state
     */
    updateState(state) {
      if (this._destroyed || !this.elements.playBtn) return;
      var btn = this.elements.playBtn;
      var statusEl = this.elements.status;

      switch (state) {
        case 'playing':
          btn.innerHTML = this._pauseIcon() + ' <span class="atlasvoice-btn-text">Pause</span>';
          btn.title = 'Pause';
          btn.classList.add('atlasvoice-btn-active');
          if (statusEl) statusEl.textContent = 'Playing...';
          break;
        case 'paused':
          btn.innerHTML = this._resumeIcon() + ' <span class="atlasvoice-btn-text">Resume</span>';
          btn.title = 'Resume';
          btn.classList.remove('atlasvoice-btn-active');
          if (statusEl) statusEl.textContent = 'Paused';
          break;
        case 'idle':
        default:
          btn.innerHTML = this._playIcon() + ' <span class="atlasvoice-btn-text">Play</span>';
          btn.title = 'Play';
          btn.classList.remove('atlasvoice-btn-active');
          if (statusEl) statusEl.textContent = 'Ready';
          break;
      }
    }

    /**
     * Set status text.
     * @param {string} text
     */
    setStatus(text) {
      if (this.elements.status) {
        this.elements.status.textContent = text;
      }
    }

    /**
     * Populate voice dropdown.
     * @param {SpeechSynthesisVoice[]} voices
     * @param {string} [selectedVoice] - Name of the voice to select
     */
    populateVoices(voices, selectedVoice) {
      var select = this.elements.voiceSelect;
      if (!select) return;
      select.innerHTML = '';

      for (var i = 0; i < voices.length; i++) {
        var opt = document.createElement('option');
        opt.value = voices[i].name;
        opt.textContent = voices[i].name + ' (' + voices[i].lang + ')';
        if (selectedVoice && voices[i].name === selectedVoice) {
          opt.selected = true;
        }
        select.appendChild(opt);
      }
    }

    /**
     * Populate language dropdown.
     * @param {string[]} languages
     * @param {string} [selectedLang] - Language code to select
     */
    populateLanguages(languages, selectedLang) {
      var select = this.elements.langSelect;
      if (!select) return;
      select.innerHTML = '';

      for (var i = 0; i < languages.length; i++) {
        var opt = document.createElement('option');
        opt.value = languages[i];
        opt.textContent = languages[i];
        if (selectedLang && languages[i] === selectedLang) {
          opt.selected = true;
        }
        select.appendChild(opt);
      }
    }

    /**
     * Remove all DOM elements and event listeners.
     */
    destroy() {
      this._destroyed = true;
      if (this.elements.player && this.elements.player.parentNode) {
        this.elements.player.parentNode.removeChild(this.elements.player);
      }
      this.elements = {};
      this.container = null;
    }

    // SVG Icons — reuses patterns from utilities.js getButtonSVGIcon()
    _playIcon() {
      return "<svg class='atlasvoice-icon' width='16' height='16' viewBox='0 0 7 8' xmlns='http://www.w3.org/2000/svg'><polygon fill='currentColor' points='0 0 0 8 7 4'/></svg>";
    }

    _pauseIcon() {
      return "<svg class='atlasvoice-icon' width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M14 9L14 15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M10 9L10 15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>";
    }

    _resumeIcon() {
      return "<svg class='atlasvoice-icon' width='16' height='16' viewBox='0 0 7 8' xmlns='http://www.w3.org/2000/svg'><polygon fill='currentColor' points='0 0 0 8 7 4'/></svg>";
    }

    _replayIcon() {
      return "<svg class='atlasvoice-icon' width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.829 13.1103 4.9697 12.9697C5.1103 12.829 5.3011 12.75 5.5 12.75C5.6989 12.75 5.8897 12.829 6.0303 12.9697C6.171 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.5872 15.7489 7.2191 16.6945C7.8509 17.6401 8.7489 18.3771 9.7996 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.3509 15.1945 8.7191C14.2489 8.0872 13.1372 7.75 12 7.75H9.5C9.3011 7.75 9.1103 7.671 8.9697 7.5303C8.829 7.3897 8.75 7.1989 8.75 7C8.75 6.8011 8.829 6.6103 8.9697 6.4697C9.1103 6.329 9.3011 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.0138 17.1265 8.3735C18.4862 9.7331 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='currentColor'/><path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53C8.3296 7.3894 8.2507 7.1988 8.2507 7C8.2507 6.8013 8.3296 6.6107 8.47 6.47L11.47 3.47C11.6107 3.3296 11.8013 3.2507 12 3.2507C12.1988 3.2507 12.3894 3.3296 12.53 3.47C12.6704 3.6107 12.7493 3.8013 12.7493 4C12.7493 4.1988 12.6704 4.3894 12.53 4.53L10.06 7L12.53 9.47C12.6704 9.6107 12.7493 9.8013 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='currentColor'/></svg>";
    }
  }

  // =========================================================================
  // 6. AnalyticsTracker — Cross-domain analytics
  //    Reuses patterns from AtlasVoiceAnalytics.js
  // =========================================================================
  class AnalyticsTracker {
    constructor(options) {
      this.wpRestUrl = options.wpRestUrl || '';
      this.postId = options.postId || 0;
      this.credentials = options.credentials || {};
      this.userId = 0;
      this.sessionData = this._getSessionData();
      this.listeningLengthInterval = null;
      this._startTimeTracking = false;
      this.listeningLength = 0;
      this._beforeUnloadBound = this.sendSessionData.bind(this);

      // Send analytics on page unload
      window.addEventListener('beforeunload', this._beforeUnloadBound);

      // Track device info immediately
      this._trackDeviceInfo();

      // Generate unique user ID via FingerprintJS
      this.getUniqueUserId();
    }

    /**
     * Load FingerprintJS from CDN dynamically.
     * Returns a promise that resolves when the script is loaded.
     * @private
     */
    _loadFingerprintJS() {
      return new Promise(function (resolve, reject) {
        // If already loaded globally, resolve immediately
        if (typeof FingerprintJS !== 'undefined') {
          resolve(FingerprintJS);
          return;
        }

        // Check if script tag already exists (from another instance)
        var existingScript = document.querySelector('script[src*="fingerprintjs"]');
        if (existingScript) {
          // Script tag exists but may still be loading
          existingScript.addEventListener('load', function () {
            if (typeof FingerprintJS !== 'undefined') {
              resolve(FingerprintJS);
            } else {
              reject(new Error('FingerprintJS failed to load'));
            }
          });
          existingScript.addEventListener('error', function () {
            reject(new Error('FingerprintJS CDN script failed to load'));
          });
          // If already loaded (script tag present and executed)
          if (typeof FingerprintJS !== 'undefined') {
            resolve(FingerprintJS);
          }
          return;
        }

        // Dynamically create and insert script tag
        var script = document.createElement('script');
        script.src = 'https://openfpcdn.io/fingerprintjs/v4/iife.min.js';
        script.async = true;
        script.onload = function () {
          if (typeof FingerprintJS !== 'undefined') {
            resolve(FingerprintJS);
          } else {
            reject(new Error('FingerprintJS loaded but not available globally'));
          }
        };
        script.onerror = function () {
          reject(new Error('FingerprintJS CDN script failed to load'));
        };
        document.head.appendChild(script);
      });
    }

    /**
     * Get unique user ID via FingerprintJS browser fingerprinting.
     * Reuses getUniqueUserId() pattern from AtlasVoiceAnalytics.js
     */
    getUniqueUserId() {
      var self = this;
      this._loadFingerprintJS()
        .then(function (FP) {
          return FP.load();
        })
        .then(function (fp) {
          return fp.get();
        })
        .then(function (result) {
          self.userId = result.visitorId;
        })
        .catch(function (err) {
          console.warn('[AtlasVoice] FingerprintJS not available, using fallback user ID:', err.message);
          // Fallback: generate a simple random ID and persist in localStorage
          try {
            var storedId = localStorage.getItem('atlasvoice_sdk_user_id');
            if (storedId) {
              self.userId = storedId;
            } else {
              var fallbackId = 'av_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
              localStorage.setItem('atlasvoice_sdk_user_id', fallbackId);
              self.userId = fallbackId;
            }
          } catch (e) {
            self.userId = 'av_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
          }
        });
    }

    /**
     * Track play event.
     */
    trackPlay() {
      this._startTimeTracking = true;
      this._addEvent('play');
      this._trackListeningLength();
    }

    /**
     * Track pause event.
     */
    trackPause() {
      this._startTimeTracking = false;
      this._addEvent('pause');
      this._trackListeningLength();
    }

    /**
     * Track resume event.
     */
    trackResume() {
      this._startTimeTracking = true;
      this._addEvent('resume');
      this._trackListeningLength();
    }

    /**
     * Track end event.
     */
    trackEnd() {
      this._startTimeTracking = false;
      this._addEvent('end');
      this._trackListeningLength();
    }

    /**
     * Add an event to session data.
     * Reuses addEvent() from AtlasVoiceAnalytics.js
     * @param {string} eventType
     * @param {Object} data
     * @private
     */
    _addEvent(eventType, data) {
      data = data || {};

      if (eventType === 'device_info') {
        this.sessionData[eventType] = data;
        this._saveSessionData();
        return;
      }

      if (eventType === 'time') {
        this.sessionData[eventType] = {
          count: this.listeningLength,
          timestamp: new Date().toISOString()
        };
        this._saveSessionData();
        return;
      }

      var eventData;
      if (this.sessionData[eventType]) {
        var currentCount = this.sessionData[eventType].count || 0;
        eventData = {
          count: currentCount + 1,
          timestamp: new Date().toISOString()
        };
      } else {
        eventData = {
          count: 1,
          timestamp: new Date().toISOString()
        };
      }

      // Merge additional data
      var key;
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          eventData[key] = data[key];
        }
      }

      this.sessionData[eventType] = eventData;
      this._saveSessionData();
    }

    /**
     * Track listening length with interval.
     * Reuses trackListeningLength() from AtlasVoiceAnalytics.js
     * @private
     */
    _trackListeningLength() {
      var self = this;
      if (this._startTimeTracking) {
        if (!this.listeningLengthInterval) {
          this.listeningLengthInterval = setInterval(function () {
            // Restore from session if needed
            var sessionData = self._getSessionData();
            if (sessionData && sessionData.time) {
              self.listeningLength = sessionData.time.count || 0;
            }
            self.listeningLength += 1;
            self._addEvent('time');
          }, 1000);
        }
      } else {
        if (this.listeningLengthInterval) {
          clearInterval(this.listeningLengthInterval);
          this.listeningLengthInterval = null;
        }
        this.listeningLength = 0;
      }
    }

    /**
     * Collect device info.
     * Reuses getDeviceData() from AtlasVoiceAnalytics.js
     * @private
     */
    _trackDeviceInfo() {
      var info = {
        browser: null,
        platform: navigator.platform || null,
        deviceType: null,
        architecture: null,
        language: navigator.language || null,
        timeZone: this._getTimeZone(),
        country: null
      };

      // Parse browser
      var ua = navigator.userAgent || '';
      var browsers = [
        { name: 'Edge', re: /Edg\/([0-9._]+)/ },
        { name: 'Chrome', re: /Chrome\/([0-9._]+)/ },
        { name: 'Firefox', re: /Firefox\/([0-9._]+)/ },
        { name: 'Safari', re: /Version\/([0-9._]+).*Safari/ },
        { name: 'Opera', re: /OPR\/([0-9._]+)/ },
        { name: 'IE', re: /MSIE\s([0-9._]+)|Trident\/.*rv:([0-9._]+)/ }
      ];
      for (var i = 0; i < browsers.length; i++) {
        var m = ua.match(browsers[i].re);
        if (m) {
          info.browser = browsers[i].name + '_' + (m[1] || m[2] || '');
          break;
        }
      }

      // Parse OS/device
      var uaLower = ua.toLowerCase();
      if (uaLower.indexOf('windows') > -1) {
        if (uaLower.indexOf('windows nt 10.0') > -1) info.platform = 'Windows 10';
        else if (uaLower.indexOf('windows nt 11.0') > -1) info.platform = 'Windows 11';
        else info.platform = 'Windows';
        if (uaLower.indexOf('win64') > -1 || uaLower.indexOf('x64') > -1 || uaLower.indexOf('wow64') > -1) {
          info.architecture = '64-bit';
        } else {
          info.architecture = '32-bit';
        }
        info.deviceType = 'Desktop';
      } else if (uaLower.indexOf('macintosh') > -1 || uaLower.indexOf('mac os') > -1) {
        info.platform = 'macOS';
        info.deviceType = 'Desktop';
      } else if (/iphone|ipad|ipod/.test(uaLower)) {
        info.platform = 'iOS';
        info.deviceType = /ipad/.test(uaLower) ? 'Tablet' : 'Mobile';
      } else if (uaLower.indexOf('android') > -1) {
        info.platform = 'Android';
        info.deviceType = uaLower.indexOf('mobile') > -1 ? 'Mobile' : 'Tablet';
      } else if (uaLower.indexOf('linux') > -1) {
        info.platform = 'Linux';
        info.deviceType = 'Desktop';
      }

      // Override device type detection
      if (/mobi|android|iphone|ipod/i.test(ua)) {
        info.deviceType = 'Mobile';
      } else if (/ipad|tablet/i.test(ua)) {
        info.deviceType = 'Tablet';
      }

      if (!info.deviceType) info.deviceType = 'Desktop';

      this._addEvent('device_info', info);
    }

    /**
     * @private
     */
    _getTimeZone() {
      if (typeof Intl === 'object' && Intl.DateTimeFormat) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      return null;
    }

    /**
     * Send session data to WP REST API.
     * Reuses sendSessionData() from AtlasVoiceAnalytics.js
     */
    sendSessionData() {
      var sessionData = this._getSessionData();
      if (!sessionData || Object.keys(sessionData).length === 0) return;
      if (!this.wpRestUrl) return;

      var apiUrl = this.wpRestUrl.replace(/\/$/, '') + '/atlasvoice-sdk/v1/track';
      var payload = {
        user_id: this.userId,
        post_id: this.postId,
        analytics: sessionData,
        other_data: {}
      };

      var jsonData = JSON.stringify(payload);

      // Build Basic Auth header from WP Application Password
      var authHeader = '';
      if (this.credentials.username && this.credentials.password) {
        authHeader = 'Basic ' + btoa(this.credentials.username + ':' + this.credentials.password);
      }

      // Browser detection for sendBeacon vs fetch
      var uaLower = (navigator.userAgent || '').toLowerCase();
      var isFirefox = uaLower.indexOf('firefox') > -1;
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Use sendBeacon for Firefox/Safari (better during unload)
      if (navigator.sendBeacon && (isFirefox || isSafari) && !authHeader) {
        try {
          var blob = new Blob([jsonData], { type: 'application/json' });
          var success = navigator.sendBeacon(apiUrl, blob);
          if (success) {
            this._clearSessionData();
          }
        } catch (e) {
          this._sendWithFetch(apiUrl, jsonData, authHeader);
        }
      } else {
        this._sendWithFetch(apiUrl, jsonData, authHeader);
      }
    }

    /**
     * @private
     */
    _sendWithFetch(apiUrl, jsonData, authHeader) {
      var self = this;
      var headers = { 'Content-Type': 'application/json' };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: jsonData,
        keepalive: true
      }).catch(function (err) {
        console.error('[AtlasVoice] Analytics send error:', err);
      }).finally(function () {
        self._clearSessionData();
      });
    }

    /**
     * Send data and cleanup. Called on destroy.
     */
    sendAndCleanup() {
      this._startTimeTracking = false;
      if (this.listeningLengthInterval) {
        clearInterval(this.listeningLengthInterval);
        this.listeningLengthInterval = null;
      }
      this.sendSessionData();
      window.removeEventListener('beforeunload', this._beforeUnloadBound);
    }

    /** @private */
    _getSessionData() {
      try {
        var data = sessionStorage.getItem('atlasvoice_sdk_analytics_data');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    }

    /** @private */
    _saveSessionData() {
      try {
        sessionStorage.setItem('atlasvoice_sdk_analytics_data', JSON.stringify(this.sessionData));
      } catch (e) {
        // sessionStorage not available
      }
    }

    /** @private */
    _clearSessionData() {
      try {
        sessionStorage.removeItem('atlasvoice_sdk_analytics_data');
      } catch (e) {
        // ignore
      }
    }
  }

  // =========================================================================
  // 7. AtlasVoice — Main SDK Class
  // =========================================================================
  class AtlasVoice {
    /**
     * Create an AtlasVoice instance.
     * @param {Object} options
     * @param {string} options.contentSelector - CSS selector for the DOM element to read content from
     * @param {string} options.playerSelector - CSS selector for the DOM element to render player into
     * @param {string} [options.voice] - Voice name preference
     * @param {string} [options.lang] - Language code preference
     * @param {number} [options.rate=1] - Speech rate (0.1 to 10)
     * @param {number} [options.pitch=1] - Speech pitch (0 to 2)
     * @param {number} [options.volume=1] - Speech volume (0 to 1)
     * @param {boolean} [options.highlightText=false] - Highlight current sentence (future)
     * @param {string} [options.theme='default'] - Player theme ('default' | 'minimal')
     * @param {Object} [options.analytics] - Analytics configuration
     * @param {boolean} [options.analytics.enabled=false]
     * @param {string} [options.analytics.wpRestUrl]
     * @param {number} [options.analytics.postId]
     * @param {Object} [options.analytics.credentials]
     */
    constructor(options) {
      // Merge defaults
      this.options = Object.assign({
        contentSelector: '',
        playerSelector: '',
        voice: '',
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        highlightText: false,
        theme: 'default',
        analytics: {
          enabled: false,
          wpRestUrl: '',
          postId: 0,
          credentials: {}
        }
      }, options || {});

      // Ensure analytics is properly merged
      if (options && options.analytics) {
        this.options.analytics = Object.assign({
          enabled: false,
          wpRestUrl: '',
          postId: 0,
          credentials: {}
        }, options.analytics);
      }

      this.state = 'idle'; // idle | playing | paused
      this._content = '';
      this._sentences = [];

      // Create internal components
      this.eventBus = new EventBus();
      this.contentCleaner = new ContentCleaner();
      this.voiceManager = new VoiceManager();
      this.speechEngine = new SpeechEngine(this.eventBus);
      this.playerUI = new PlayerUI(this.eventBus);
      this.analytics = null;

      // Setup analytics if enabled
      if (this.options.analytics && this.options.analytics.enabled) {
        this.analytics = new AnalyticsTracker(this.options.analytics);
      }

      // Initialize
      this._init();
    }

    /**
     * @private
     */
    _init() {
      var self = this;

      // Check browser support
      if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
        console.error('[AtlasVoice] Browser does not support Web Speech API');
        return;
      }

      // Load voices
      this.voiceManager.loadVoices().then(function (voices) {
        // Find best voice match
        var bestMatch = self.voiceManager.findBestVoice(
          self.options.voice || 'Google UK English Female',
          self.options.lang || 'en-GB'
        );

        self.voiceManager.setVoice(bestMatch.voice);

        // Initialize speech engine
        self.speechEngine.init({
          voice: self.voiceManager.currentVoice,
          lang: bestMatch.lang,
          rate: self.options.rate,
          pitch: self.options.pitch,
          volume: self.options.volume
        });

        // Render player UI
        var playerContainer = self.options.playerSelector
          ? document.querySelector(self.options.playerSelector)
          : null;

        if (playerContainer) {
          self.playerUI.render(playerContainer, { theme: self.options.theme });
          self.playerUI.populateVoices(voices, bestMatch.voice);
          self.playerUI.populateLanguages(self.voiceManager.getLanguages(), bestMatch.lang);
        }

        // Extract and clean content
        self._extractContent();

        // Emit voiceschanged
        self.eventBus.emit('voiceschanged', voices);
      }).catch(function (e) {
        console.error('[AtlasVoice] Failed to load voices:', e);
      });

      // Bind internal events
      this._bindEvents();
    }

    /**
     * @private
     */
    _extractContent() {
      if (!this.options.contentSelector) return;
      var el = document.querySelector(this.options.contentSelector);
      if (el) {
        this._content = this.contentCleaner.clean(el.innerHTML);
        this._sentences = this.contentCleaner.splitSentences(this._content);

        // Update status with word count
        if (this.playerUI.elements.status) {
          var wordCount = this._content.split(/\s+/).filter(Boolean).length;
          var estimatedMins = Math.max(1, Math.round(wordCount / 150));
          this.playerUI.setStatus('Ready \u00B7 ' + wordCount + ' words \u00B7 ~' + estimatedMins + ' min');
        }
      }
    }

    /**
     * @private
     */
    _bindEvents() {
      var self = this;

      // Play button click from UI
      this.eventBus.on('ui:playbtn', function () {
        if (self.state === 'idle') {
          self.play();
        } else if (self.state === 'playing') {
          self.pause();
        } else if (self.state === 'paused') {
          self.resume();
        }
      });

      // Voice change from UI dropdown
      this.eventBus.on('ui:voicechange', function (data) {
        self.setVoice(data.value);
      });

      // Language change from UI dropdown
      this.eventBus.on('ui:langchange', function (data) {
        self.setLang(data.value);
        // Update voice dropdown with voices for this language
        var voicesForLang = self.voiceManager.getVoicesByLang(data.value);
        if (voicesForLang.length > 0) {
          self.playerUI.populateVoices(voicesForLang, voicesForLang[0].name);
        }
      });

      // Speech end
      this.eventBus.on('end', function () {
        self.state = 'idle';
        self.playerUI.updateState('idle');
        if (self.analytics) self.analytics.trackEnd();
      });

      // Speech error
      this.eventBus.on('error', function (e) {
        self.state = 'idle';
        self.playerUI.updateState('idle');
        console.error('[AtlasVoice] Speech error:', e);
      });
    }

    // === Public API ===

    /**
     * Start playing content.
     */
    play() {
      if (this._sentences.length === 0) {
        this._extractContent();
      }
      if (this._sentences.length === 0) {
        console.warn('[AtlasVoice] No content to speak');
        return;
      }

      this.state = 'playing';
      this.playerUI.updateState('playing');
      this.speechEngine.speak(this._sentences);

      if (this.analytics) this.analytics.trackPlay();
      this.eventBus.emit('play', {});
    }

    /**
     * Pause speech.
     */
    pause() {
      this.state = 'paused';
      this.playerUI.updateState('paused');
      this.speechEngine.pause();

      if (this.analytics) this.analytics.trackPause();
      this.eventBus.emit('pause', {});
    }

    /**
     * Resume speech from where it was paused.
     */
    resume() {
      this.state = 'playing';
      this.playerUI.updateState('playing');
      this.speechEngine.resume();

      if (this.analytics) this.analytics.trackResume();
      this.eventBus.emit('resume', {});
    }

    /**
     * Stop speech completely.
     */
    stop() {
      this.state = 'idle';
      this.playerUI.updateState('idle');
      this.speechEngine.cancel();

      // Reset sentences to original content
      this._extractContent();

      if (this.analytics) this.analytics.trackEnd();
      this.eventBus.emit('stop', {});
    }

    /**
     * Speak custom text (not from DOM).
     * @param {string} text
     */
    speak(text) {
      var cleaned = this.contentCleaner.clean(text);
      var sentences = this.contentCleaner.splitSentences(cleaned);
      if (sentences.length === 0) return;

      this.state = 'playing';
      this.playerUI.updateState('playing');
      this.speechEngine.speak(sentences);

      if (this.analytics) this.analytics.trackPlay();
      this.eventBus.emit('play', {});
    }

    /**
     * Get all available voices on the device.
     * @returns {SpeechSynthesisVoice[]}
     */
    getVoices() {
      return this.voiceManager.getVoices();
    }

    /**
     * Get all unique language codes from available voices.
     * @returns {string[]}
     */
    getLanguages() {
      return this.voiceManager.getLanguages();
    }

    /**
     * Get voices filtered by a language code.
     * @param {string} langCode
     * @returns {SpeechSynthesisVoice[]}
     */
    getVoicesByLang(langCode) {
      return this.voiceManager.getVoicesByLang(langCode);
    }

    /**
     * Set voice by name.
     * @param {string} voiceName
     */
    setVoice(voiceName) {
      var found = this.voiceManager.setVoice(voiceName);
      if (found) {
        this.speechEngine.setVoice(this.voiceManager.currentVoice);
        this.speechEngine.setLang(this.voiceManager.currentLang);
      }
    }

    /**
     * Set language code and auto-select best voice.
     * @param {string} langCode
     */
    setLang(langCode) {
      var found = this.voiceManager.setLang(langCode);
      if (found) {
        this.speechEngine.setVoice(this.voiceManager.currentVoice);
        this.speechEngine.setLang(this.voiceManager.currentLang);
      }
    }

    /**
     * Set speech rate.
     * @param {number} rate - 0.1 to 10
     */
    setRate(rate) {
      this.speechEngine.setRate(rate);
    }

    /**
     * Set speech pitch.
     * @param {number} pitch - 0 to 2
     */
    setPitch(pitch) {
      this.speechEngine.setPitch(pitch);
    }

    /**
     * Set speech volume.
     * @param {number} volume - 0 to 1
     */
    setVolume(volume) {
      this.speechEngine.setVolume(volume);
    }

    /**
     * Register event listener.
     * @param {string} event - 'play' | 'pause' | 'resume' | 'end' | 'stop' | 'error' | 'voiceschanged'
     * @param {Function} callback
     * @returns {AtlasVoice}
     */
    on(event, callback) {
      this.eventBus.on(event, callback);
      return this;
    }

    /**
     * Remove event listener.
     * @param {string} event
     * @param {Function} [callback]
     * @returns {AtlasVoice}
     */
    off(event, callback) {
      this.eventBus.off(event, callback);
      return this;
    }

    /**
     * Destroy the player instance, stop speech, remove UI, clean up.
     */
    destroy() {
      this.speechEngine.cancel();
      this.playerUI.destroy();

      if (this.analytics) {
        this.analytics.sendAndCleanup();
        this.analytics = null;
      }

      this.state = 'idle';
      this._content = '';
      this._sentences = [];
      this.eventBus._listeners = {};
    }
  }

  // Expose version
  AtlasVoice.VERSION = '1.0.0';

  return AtlasVoice;
}));
