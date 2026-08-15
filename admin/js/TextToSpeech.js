/**
 * @see https://www.npmjs.com/package/speak-tts
 */
import Speech from "./tts/speak-tts/lib/speak-tts.js";
import BrowserSupport from './tts/BrowserSupport.js'
import {addHoverColor, getButtonSVGIcon, setSvgColorOnEvent, splitSentences} from "./tts/utilities.js";
import AtlasVoiceAnalytics from "./AtlasVoiceAnalytics";
// TTS-256: read-along highlighter — registers wp.hooks listeners on import
// (tts_high_light_text / tts_highlight_word / tts_highlight_clear).
import "./tts/highlighter.js";

export default class TextToSpeech {
    TTS = window.TTS
    browser = null
    speech = null
    speechSynthesis = window.speechSynthesis
    utterence = new SpeechSynthesisUtterance()
    speechRecognitionIsActive = true
    speechRecognition = window.speechRecognition || window.webkitSpeechRecognition
    recordStatus = 'record'
    listenStatus = 'listen'
    noticeClass = 'tta_notice'
    cofiguration = {}
    timer = null
    buttonId = null
    speakButton = null
    content = null
    ttsListeningSettings = null
    languages = []
    voices = {}
    voice = true ? "Google UK English Female" : 'Microsoft Zira - English (United States)';
    language = true ? 'en-GB' : 'en-US';
    buttonTextArr = null
    splittedSentances = ''
    isCanceled = false
    shouldCancelTimer = null
    callBackAfterEnd = null
    splitSentences = null
    playButtonNo = 1
    analytics = null
    playButtonIcon = null;
    _activeSentence = '' // TTS-256: current sentence being spoken (for onboundary)

    constructor(buttonId, content = '', button = null, TTS = window.TTS) {
        this.TTS = TTS
        this.content = content ? content : window.TTS.contents[buttonId]
        this.splittedSentances = splitSentences(content)
        this.buttonId = buttonId
        // TTS-270: prefer this button's own payload. TTS.settings is a singleton
        // written by the first button only, so per-instance text could never
        // reach buttons 2..N. Falls back to exactly today's value.
        this.buttonTextArr = this.TTS?.buttons?.[buttonId]?.textArr || this.TTS.settings.textArr
        this.speakButton = button ? button : document.getElementById(buttonId)
        this.ttsListeningSettings = this.TTS.settings.listening
        this.speech = new Speech()
        this.splitSentences = splitSentences
        this.playButtonNo = window?.TTS?.extra?.player_id ?? 1;
        this.analytics = new AtlasVoiceAnalytics(this.TTS.settings.postId)
        this.playButtonIcon = getButtonSVGIcon();

        if (typeof NoSleep === 'function' && ttsObj?.is_mobile) {
            const noSleep = new NoSleep();
            window.onload = function () {
                noSleep.enable();
                console.log("NoSleep enabled");
            };
        }
    }

    getData(shouldAsingThis = true) {
        if (shouldAsingThis) {
            window.TextToSpeech = this
        }
        return this;
    }

    /**
     * Resolve a per-state label, preferring the per-player override stored
     * under buttonTextArr.players[playerId].<state>.text and falling back to
     * the legacy flat key (TTS-241).
     */
    getStateText(state, fallback) {
        const pid = this?.playButtonNo;
        const perPlayer = this?.buttonTextArr?.players?.[pid]?.[state]?.text;
        if (perPlayer && perPlayer.length) {
            return perPlayer;
        }
        const flatKey = state + '_text';
        return this?.buttonTextArr?.[flatKey] ?? fallback;
    }

    getStateHover(state, fallback) {
        const pid = this?.playButtonNo;
        const perPlayer = this?.buttonTextArr?.players?.[pid]?.[state]?.hover;
        if (perPlayer && perPlayer.length) {
            return perPlayer;
        }
        const flatKey = state + '_hover_title';
        return this?.buttonTextArr?.[flatKey] ?? fallback;
    }

    playButtonText() {
        return this.getStateText('listen', 'Listen');
    }

    /**
     * Build the inner HTML for a single state. All four states (listen,
     * pause, resume, replay) share an identical wrapper structure so swap-
     * ping innerHTML on lifecycle events doesn't shift the button's metrics
     * (TTS-241 — fixes the "border expands on click" issue).
     *
     *   <div class="tts_button" aria-hidden="true">
     *     [icon-wrapper]
     *     <span class="tts_button_label">{text}</span>
     *   </div>
     */
    _renderStateContent(iconKey, dashicon, label) {
        const playerId = this?.playButtonNo ?? 1;
        const customSvg = this.playButtonIcon?.[playerId]?.[iconKey];
        let iconHtml = '';
        if (customSvg) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(customSvg, "image/svg+xml");
            iconHtml = doc.documentElement.outerHTML;
        } else if (dashicon) {
            iconHtml = `<span class="dashicons ${dashicon}"></span>`;
        }
        return `<div class="tts_button" aria-hidden="true">${iconHtml}<span class="tts_button_label">${label}</span></div>`;
    }

    playButtonContent() {
        return this._renderStateContent('play', 'dashicons-controls-play', this.playButtonText());
    }

    replayButtonText() {
        return this.getStateText('replay', 'Replay');
    }

    replayButtonContent() {
        return this._renderStateContent('replay', 'dashicons-image-rotate', this.replayButtonText());
    }

    pauseButtonText() {
        return this.getStateText('pause', 'Pause');
    }

    pauseButtonContent() {
        return this._renderStateContent('pause', 'dashicons-controls-pause', this.pauseButtonText());
    }

    resumeButtonText() {
        return this.getStateText('resume', 'Resume');
    }

    resumeButtonContent() {
        return this._renderStateContent('resume', 'dashicons-controls-play', this.resumeButtonText());
    }

    recordStartButtonContent() {
        return '<span class="dashicons dashicons-controls-volumeoff"></span> ' + this.buttonTextArr.start_text;
    }

    recordStopButtonConten() {
        return '<span class="dashicons dashicons-controls-volumeon"></span> ' + this.buttonTextArr.stop_text;
    }

    displayApiMissing(button_id = '', is_dashboard = false) {
        let notice = '';
        let link = '';

        if (!this.speechRecognitionIsActive) {
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
            let previousSibling =
                document.getElementById(button_id)?.previousSibling;
            if (previousSibling) {
                notice += ` Click here to <a href="https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F" target="_blank">enable</a>`;
                previousSibling.style.display = 'block';
                previousSibling.innerHTML = notice;
                setTimeout(() => {
                    document.querySelector('.tta_notice').style.display =
                        'none';
                    previousSibling.innerHTML = '';
                }, 5000);
            } else {
                link += 'This browser not supports speechSynthesis API';
                notice += `\nFollow this link to enable: \n${link}`;
                alert(notice);
            }
        } else {
            if (is_dashboard) {
                link +=
                    ttsObj.admin_url +
                    'admin.php?page=text-to-audio#/faq';
            } else {
                if (
                    location.search === '?page=text-to-audio' &&
                    location.hash === '#/customize'
                ) {
                    link +=
                        ttsObj.admin_url +
                        'admin.php?page=text-to-audio#/faq';
                } else {
                    link +=
                        'https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F';
                }
            }
            notice += `\nFollow this link to enable: \n${link}`;
            alert(notice);
        }

        return true;
    }

    /**
     * Don't display this text in pro version.
     * @param {*} listenStatus
     * @param {*} isClicked
     */
    displayButtonText(listenStatus, isClicked = false) {
        // TTS-241 NOTE: gated to player 1 (Default) only. Player 2 (Default
        // Pro) renders via the React `TextToSpeech` component, whose
        // listen/pause/resume/replay UI is driven by React state — calling
        // innerHTML swap here would destroy the React tree that owns the
        // player. Player 2's lifecycle label/icon swap is handled inside
        // that React component instead.
        if (Number(this?.playButtonNo) !== 1) {
            return;
        }
        if (!this?.speakButton?.innerHTML) {
            return;
        }
        if ('listen' === listenStatus) {
            this.speakButton.innerHTML = this.replayButtonContent();
            this.speakButton.setAttribute('title', 'Text To Audio : ' + this.getStateHover('replay', 'Click to listen post.'));
        } else if ('pause' === listenStatus) {
            this.speakButton.innerHTML = this.pauseButtonContent();
            this.speakButton.setAttribute('title', 'Text To Audio : ' + this.getStateHover('pause', this.pauseButtonText()));
        } else if ('resume' === listenStatus) {
            this.speakButton.innerHTML = this.resumeButtonContent();
            this.speakButton.setAttribute('title', 'Text To Audio : ' + this.getStateHover('resume', this.resumeButtonText()));
        }
        if (isClicked) {
            addHoverColor(this.speakButton);
        }
    }


    finishedSpeaking(speech, data = {}, cancelIntentionally = false,) {
        if (!this.speech.speaking() || cancelIntentionally) {
            console.log('End utterance ' + this.speech.speaking());
            this.listenStatus = 'listen';
            this.displayButtonText(this.listenStatus)

            // set up initial content to replacy.
            this.splittedSentances = splitSentences(window.TTS.contents[this.buttonId])
            speech.cancel();
            // TTS-256: reading finished — clear the word highlight and undim.
            wp.hooks.doAction('tts_highlight_clear', this.buttonId)
        }
        console.log("Success !", data);
        this.analytics.trackEnd();
        if (this.callBackAfterEnd) this.callBackAfterEnd()
        if (!this.browser.isAndroid()) {
            clearTimeout(this.timer);
            this.timer = null
            clearTimeout(this.shouldCancelTimer)
            this.shouldCancelTimer = null
        }
        window.sessionStorage.setItem('tts_paused_by_intention', false);
    }

    speak(speech, content = this.content, isClicked = false) {
        if(!content) {
           content =  this.content
        }
        if (!this.speech.hasBrowserSupport()) {
            this.displayApiMissing("tts__listent_content_" + this.buttonId)
            return;
        }

        // TTS-253: speechSynthesis is shared across all tabs, so another tab may have
        // left the engine stuck in a "paused" state. If we speak() while it's paused,
        // Chrome produces no audio (or resumes the other tab's leftover). Un-stick it
        // first — resume() to clear the paused flag, then cancel() to flush any queue —
        // so this play always starts cleanly from our content.
        try {
            if (window.speechSynthesis && window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                window.speechSynthesis.cancel();
            }
        } catch (e) { /* no-op */ }

        speech.setLanguage(this.browser.getLanguage())
        speech.setVoice(this.browser.getVoice())
        console.log(content)
        /**
         * 1. Microsoft edge browser has same voices(306 voices) for mobile and desktop
         * It uses the v8 engine as chrome browser.
         */
        speech
            .speak({
                text: content,
                queue: false,
                listeners: {
                    onstart: (utterance) => {
                        console.log("Start utterance");
                        this.utterence = utterance
                        // TTS-256: remember the sentence so onboundary can resolve words
                        // against it; the highlighter re-anchors on this sentence text.
                        this._activeSentence = (utterance?.currentTarget?.text) || (utterance?.target?.text) || ''
                        wp.hooks.doAction('tts_high_light_sentence', this._activeSentence, this.buttonId, splitSentences)
                    },
                    onend: (utterance) => {
                        console.log('End utterance')
                    },
                    onpause: (utterance) => {
                        console.log('Pause utterance')
                    },
                    onresume: (utterance) => {
                        console.log("Resume utterance");
                    },
                    onboundary: (e) => {
                        // TTS-256: fire one action per spoken word so the highlighter can
                        // paint it. charIndex is relative to the current sentence; some
                        // browsers omit charLength, so derive the word end by scanning to
                        // the next whitespace. Non-word boundaries (sentence) are ignored.
                        if (e && e.name && e.name !== 'word') {
                            return
                        }
                        const text = (e?.target?.text) || (e?.currentTarget?.text) || this._activeSentence || ''
                        const start = (e && typeof e.charIndex === 'number') ? e.charIndex : 0
                        let len = (e && e.charLength) ? e.charLength : 0
                        if (!len) {
                            const rest = text.slice(start)
                            const sp = rest.search(/\s|$/)
                            len = sp === -1 ? rest.length : sp
                        }
                        const word = text.slice(start, start + len)
                        if (word && word.trim()) {
                            wp.hooks.doAction('tts_highlight_word', {
                                buttonId: this.buttonId,
                                sentence: text,
                                word: word,
                                charIndex: start,
                                charLength: len,
                            })
                        }
                    }
                }
            })
            .then(data => {
                this.finishedSpeaking(speech, data)
            })
            .catch(e => {
                console.error("An error occurred :", e);
            });

        this.listenStatus = 'pause';
        this.displayButtonText(this.listenStatus, isClicked)
        this.analytics.trackPlay();
        if (!this.browser.isAndroid()) {
            let thisClass = this;
            this.timer = setTimeout(function pauseResumeTimer() {
                speech.pause();
                //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
                console.log(speech);
                // Placing the speak invocation inside a callback fixes ordering and onend issues
                setTimeout(() => {
                    speech.resume();
                }, 0);

                thisClass.timer = setTimeout(pauseResumeTimer, 13000)

                if (!speech.speaking()) {
                    clearTimeout(thisClass.timer)
                    thisClass.timer = null
                }

            }, 13000);
        }
    }

    pause(speech, isClicked = false) {
        /**
         * Desktop Chrome workaround: speechSynthesis.pause() alone is
         * unreliable on resume — the engine often refuses to continue the
         * current utterance. So we pause() for immediate UX feedback, then
         * issue cancel() once the pause has actually settled. resume() then
         * detects `isCanceled` and re-speak()s the remaining content from
         * the current sentence (see splittedSentances slicing below).
         *
         * TTS-243 — interval was 1ms (firing cancel() ~every 1ms forever
         * until cleared). One delayed cancel is enough; raised to 50ms so
         * Chrome has time to actually enter the paused state before the
         * cancel arrives. Below ~30ms the engine occasionally swallows the
         * cancel mid-transition and the next resume produces no audio.
         *
         * Still a setInterval (not setTimeout) so subsequent fires keep
         * asserting cancel() if the engine flips back to "speaking" — this
         * is defensive against Chrome's flaky pause/cancel race.
         *
         * Android takes a different path: cancel-and-restart on resume.
         */
        if (!this.browser.isAndroid()) {
            speech.pause();
            // TTS-253: window.speechSynthesis is ONE engine shared across ALL browser
            // tabs. Previously this setInterval fired cancel() every 50ms FOREVER
            // (until resume() cleared it), so a paused tab kept hammering cancel() on
            // the shared engine and corrupted playback in OTHER tabs (a 2nd post read
            // from a random spot). We still assert cancel() until the engine has truly
            // stopped — preserving the TTS-243 Chrome workaround — but then STOP, with
            // a hard cap as a backstop, so a paused tab no longer touches the engine.
            let cancelTries = 0;
            this.shouldCancelTimer = setInterval(() => {
                speech.cancel();
                this.isCanceled = true;
                cancelTries++;
                if (!speech.speaking() || cancelTries >= 20) {
                    clearInterval(this.shouldCancelTimer);
                    this.shouldCancelTimer = null;
                }
            }, 50)

        } else {
            speech.cancel();
            this.isCanceled = true;
        }

        // update current content
        let currentIndex = this.splittedSentances.indexOf(this.utterence?.target?.text || '');
        this.splittedSentances = this.splittedSentances.slice(currentIndex)
        this.content = this.splittedSentances.join(' ')

        this.listenStatus = 'resume';

        this.displayButtonText(this.listenStatus, isClicked)
        this.analytics.trackPause();
        if (!this.browser.isAndroid()) {
            clearTimeout(this.timer);
        }
    }

    resume(speech, isClicked = false) {

        if (this.isCanceled) {
            this.speak(speech, this.content)
            clearTimeout(this.shouldCancelTimer)
            if (!this.browser.isAndroid()) {
                clearTimeout(this.timer);
            }
        } else {
            speech.resume();
            clearTimeout(this.shouldCancelTimer)
        }

        this.listenStatus = 'pause';
        this.displayButtonText(this.listenStatus, isClicked)
        if (!this.browser.isAndroid()) {
            let thisClass = this;
            this.timer = setTimeout(function pauseResumeTimer() {
                speech.pause();
                //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
                console.log(speech);
                // Placing the speak invocation inside a callback fixes ordering and onend issues
                setTimeout(() => {
                    speech.resume();
                }, 0);

                thisClass.timer = setTimeout(pauseResumeTimer, 13000)

                if (!speech.speaking()) {
                    clearTimeout(thisClass.timer)
                    thisClass.timer = null
                }
            }, 13000);
        }
    }

    /**
     * Callback function will need for pro version.
     * @param {*} callBackAfterEnd
     * @param {*} isClicked
     * @returns
     */
    _init(callBackAfterEnd = null, isClicked = false) { // init speaking,
        this.callBackAfterEnd = callBackAfterEnd
        if (this.ttsListeningSettings === undefined) return;
        this.speech
            .init({
                volume: this.ttsListeningSettings.tta__listening_volume
                    ? this.ttsListeningSettings.tta__listening_volume
                    : 1, // From 0 to 1,
                // lang: lang, // It will be speaking language.
                rate: this.ttsListeningSettings.tta__listening_rate
                    ? this.ttsListeningSettings.tta__listening_rate
                    : 1, // From 0.1 to 10
                pitch: this.ttsListeningSettings.tta__listening_pitch
                    ? this.ttsListeningSettings.tta__listening_pitch
                    : 1, // From 0 to 2
                // voice: voice,
                splitSentences: true,
                listeners: {
                    onvoiceschanged: voices => {
                        // console.log(voices)
                        // this.voices = voices
                        // this function can be used in the pro version.
                    }
                }
            })
            .then(data => {
                this.voices = data.voices;
                // if (!this.browser) {
                /**
                 * Version 1.8.21
                 *
                 * From this version or some other previous version google voices are not working on chrome browser that is why
                 * the voice and language are changed by manual coding.
                 *
                 * This code is implemented from version 1.8.22
                 * 
                 * TTS-168: This code is removed.
                 * From this condition is preventing from reading other valid google voices even though 
                 * user selected voice are there in the machine. One more thing. This code is fixed for
                 * all devices, and for all browsers. So this is a weak code, because it did not cover 
                 * all situaations ( like devices, browsers check etc ). 
                 */

                // if (this.ttsListeningSettings?.tta__listening_lang?.indexOf('en') === 0 && this.ttsListeningSettings?.tta__listening_voice?.indexOf('Google') === 0) {
                //     this.ttsListeningSettings.tta__listening_lang = "en-US"
                //     this.ttsListeningSettings.tta__listening_voice = "Microsoft Zira - English (United States)"
                // }

                this.browser = new BrowserSupport(ttsObj, data.voices, this.ttsListeningSettings?.tta__listening_lang, this.ttsListeningSettings?.tta__listening_voice)

                // }
                this._prepareSpeakButton(this.speech, isClicked);
                window.sessionStorage.setItem('tts_paused_by_intention', false);
            })
            .catch(e => {
                console.error("An error occured while initializing : ", e);
            });

    }

    _prepareSpeakButton(speech, isClicked = false) {
        // Button click events
        // this.speakButton.addEventListener("click", () => {
        if (this.listenStatus == 'listen') {
            this.speak(speech, null, isClicked)
        } else if (this.listenStatus == 'pause') {
            this.pause(speech, isClicked)
        } else if (this.listenStatus == 'resume') {
            this.resume(speech, isClicked)
        }
        // });

        /**
         * When browser tab switches to another tab.
         *
         * Some users wants when they switches to another tab. TTS should be
         * autometically paused. And when they return to TTS page it should be
         * autometically start speeking again.
         *
         * On the other hand if they pause the TTS button intentionally then
         * switch to another tab. it will remain paused, untill they intentionally
         * resume it. Even though they switch to another tab and return to
         * current TTS page.
         *
         */

        document.addEventListener("visibilitychange", () => {
            // it could be either hidden or visible
            // TODO: when stop auto pause it's not reading the content properly. it stops for a few miliseconds. Fix it the release this new feature.
            let stop_autopause = window?.ttsObj?.settings?.settings?.tta__settings_stop_auto_pause_after_switching_tab ?? false;
            stop_autopause = wp.hooks.applyFilters('tta__settings_stop_auto_pause_after_switching_tab', stop_autopause);

            if ('hidden' === document.visibilityState && this.listenStatus === 'pause' && !stop_autopause) {
                this.pause(speech)
                if (this.callBackAfterEnd) this.callBackAfterEnd()
            }

            if ('visible' === document.visibilityState && this.listenStatus === 'resume' && !stop_autopause) {
                let isPausedByIntention = JSON.parse(window.sessionStorage.getItem('tts_paused_by_intention'));
                let stop_autoplay = window?.ttsObj?.settings?.settings?.tta__settings_stop_auto_playing_after_switching_tab ?? false;

                if (!isPausedByIntention && !stop_autoplay) {
                    window.sessionStorage.setItem('tts_paused_by_intention', false);
                    this.resume(speech)
                }

                if (this.callBackAfterEnd) this.callBackAfterEnd()
            }
        });
    }
}

/**
 * TTS-263 — selection playback for the speechSynthesis players (1 & 2).
 *
 * The floating selection control (admin/js/tts/selection-control.js) fires
 * `tts_listen_selection` with the selected text; this handler speaks it. The
 * MP3 players (3-6) have their own subscriber in Pro that seeks the audio
 * instead — this one bails for them.
 *
 * A dedicated per-button speaker instance is reused for selections rather than
 * the button's own instance, so the play button's pause/resume state machine is
 * never fought over; any in-flight full-post read is stopped and its button
 * reset to "listen" first. Because the read-along highlight hooks fire from
 * speak() as usual, the selection also highlights while it's read (when
 * highlighting is enabled).
 */
if (typeof window !== 'undefined' && window.wp && window.wp.hooks && !window.__ttsSelectionSpeakReady) {
    window.__ttsSelectionSpeakReady = true;
    const selectionSpeakers = {};

    wp.hooks.addAction('tts_listen_selection', 'tts/selection-speak', (payload) => {
        const playerId = parseInt(window?.ttsObj?.player_id ?? window?.TTS?.extra?.player_id ?? 1, 10);
        if (playerId !== 1 && playerId !== 2) {
            return; // MP3 players are handled by the Pro subscriber
        }
        if (!payload || !payload.text || !payload.text.trim()) {
            return;
        }

        // The normal read gets pronunciation aliases applied server-side; the
        // selection is raw DOM text, so apply the same aliases here.
        let text = payload.text;
        const aliasData = window?.ttsObj?.settings?.aliases;
        const aliases = aliasData ? Object.values(aliasData) : [];
        for (const alias of aliases) {
            if (alias && alias.actual_text) {
                text = text.split(alias.actual_text).join(alias.to_read ?? '');
            }
        }

        // Stop an in-flight full-post read cleanly: speak({queue:false}) would
        // cancel its audio anyway, but its button/timers must be reset too or
        // the play button is left saying "Pause" with nothing playing.
        const cur = window.TextToSpeech;
        if (cur instanceof TextToSpeech && cur.speech && cur.listenStatus && cur.listenStatus !== 'listen') {
            try {
                cur.speech.cancel();
            } catch (e) { /* no-op */ }
            clearTimeout(cur.timer);
            clearInterval(cur.shouldCancelTimer);
            cur.timer = null;
            cur.shouldCancelTimer = null;
            cur.listenStatus = 'listen';
            cur.displayButtonText('listen');
            const original = window.TTS?.contents?.[cur.buttonId];
            if (original) {
                cur.content = original;
                cur.splittedSentances = splitSentences(original);
            }
        }

        // One hidden speaker per button, reused across selections (so repeated
        // selections don't stack per-instance visibilitychange listeners).
        let speaker = selectionSpeakers[payload.buttonId];
        if (speaker && speaker.browser) {
            speaker.content = text;
            speaker.splittedSentances = splitSentences(text);
            speaker.listenStatus = 'listen';
            speaker.speak(speaker.speech, text, false);
        } else {
            // Detached dummy button: keeps the constructor's getElementById
            // fallback from grabbing a page element and lets displayButtonText
            // no-op — the selection speaker must never repaint the play button.
            speaker = new TextToSpeech(payload.buttonId, text, document.createElement('button'), window.TTS);
            selectionSpeakers[payload.buttonId] = speaker;
            speaker._init(null, false);
        }
    });
}

/**
 * Load text to speech after DOMContentLoaded in free version.
 */
if (window?.ttsObj?.is_atlasvoice_addon_functional) {
    window.TextToSpeech = TextToSpeech;
} else {
    window.document.addEventListener('DOMContentLoaded', function () {
        window.TextToSpeech = TextToSpeech;
    })
}

/**
 * This potion of the code will only applied in the dashboard.
 * When plugin dashboard with open.
 */
let urlParams = new URLSearchParams('page=text-to-audio').toString()
if ('page=text-to-audio' === urlParams) {
    let timerDashboar;
    timerDashboar = setInterval(() => {
        if (window.hasOwnProperty('ttsObj') && ttsObj.is_dashboard) {
            declare_init_content()
            clearInterval(timerDashboar)
            timerDashboar = null
        }
    }, 1000)

    function declare_init_content() {
        let ttsSettings = {
            listening: {
                tta__listening_lang: "en-GB",
                tta__listening_voice: "Google UK English Female",
                tta__listening_pitch: "1",
                tta__listening_rate: "1",
                tta__listening_volume: "1"
            },
            cssClass: "",
            btnStyle: "background-color:#ee6d6d;color:#ffffff;width:100%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;",
            textArr: {
                listen_text: "Listen",
                pause_text: "Pause",
                resume_text: "Resume",
                replay_text: "Replay",
                start_text: "Start",
                stop_text: "Start"
            },
            shouldDisplayIcon: "inline-block"
        }

        var ttsCurrentButtonNo = 1;
        var ttsCurrentContent = '';
        if (window.hasOwnProperty('TTS')) { // add content if a page have multiple button
            var prevContent = window.TTS.contents[ttsCurrentButtonNo - 1]
            if (prevContent !== ttsCurrentContent) { // don't repeat same content
                window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
            }

        } else { // add content for the if a page have one button
            window.TTS = {}
            window.TTS.contents = {}
            window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
        }

        // add settings
        if (!window.TTS.hasOwnProperty('settings')) {
            window.TTS.settings = ttsSettings
            window.TTS.settings.readingTime = 1;
        }
    }

}

