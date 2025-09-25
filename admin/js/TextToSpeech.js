/**
 * @see https://www.npmjs.com/package/speak-tts
 */
import Speech from "./tts/speak-tts/lib/speak-tts.js";
import BrowserSupport from './tts/BrowserSupport.js'
import {addHoverColor, getButtonSVGIcon, setSvgColorOnEvent, splitSentences} from "./tts/utilities.js";
import AtlasVoiceAnalytics from "./AtlasVoiceAnalytics";

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

    constructor(buttonId, content = '', button = null, TTS = window.TTS) {
        this.TTS = TTS
        this.content = content ? content : window.TTS.contents[buttonId]
        this.splittedSentances = splitSentences(content)
        this.buttonId = buttonId
        this.buttonTextArr = this.TTS.settings.textArr
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

    playButtonText() {
        return this?.buttonTextArr?.listen_text ?? 'Listen';
    }

    playButtonContent() {
        let icon = '<div class="tts_button"><span class="dashicons dashicons-controls-play"></span> <span>';
        if (this.playButtonIcon?.[1]?.play) {
            const parser = new DOMParser();
            // convert html string into DOM
            let document = parser.parseFromString(this.playButtonIcon?.[1]?.play, "image/svg+xml");
            icon = `<div class="tts_button">${document.documentElement.outerHTML}</div><span>`;
        }

        return icon + ' ' + this.playButtonText() + '</span></span></div>'
    }

    replayButtonText() {
        return this?.buttonTextArr?.replay_text ?? 'Replay';
    }

    replayButtonContent() {
        let icon = '<div class="tts_button"><span class="dashicons dashicons-image-rotate"></span> <span>';
        if (this.playButtonIcon?.[1]?.replay) {
            const parser = new DOMParser();
            // convert html string into DOM
            let document = parser.parseFromString(this.playButtonIcon?.[1]?.replay, "image/svg+xml");

            icon = `<div class="tts_button">${document.documentElement.outerHTML}</div><span>`;
        }

        return icon + ' ' + this.replayButtonText() + '<span></span></span></div>'

    }

    pauseButtonText() {
        return this?.buttonTextArr?.pause_text ?? 'Pause';
    }

    pauseButtonContent() {
        let icon = '<div class="tts_button"><span class="dashicons dashicons-controls-pause"></span> <span>';
        if (this.playButtonIcon?.[1]?.pause) {
            const parser = new DOMParser();
            // convert html string into DOM
            let document = parser.parseFromString(this.playButtonIcon?.[1]?.pause, "image/svg+xml");
            icon = `<div class="tts_button">${document.documentElement.outerHTML}</div><span>`;
        }

        return icon + ' ' + this.pauseButtonText() + '<span></span></span></div>'


    }

    resumeButtonText() {
        return this?.buttonTextArr?.resume_text ?? 'Resume';
    }

    resumeButtonContent() {
        let icon = '<div class="tts_button"><span class="dashicons dashicons-controls-play"></span> <span>';

        if (this.playButtonIcon?.[1]?.resume) {
            const parser = new DOMParser();
            // convert html string into DOM
            let document = parser.parseFromString(this.playButtonIcon?.[1]?.resume, "image/svg+xml");
            icon = `<div class="tts_button">${document.documentElement.outerHTML}</div><span>`;
        }
        icon =  icon + ' ' + this.resumeButtonText() + '<span></span></span></div>'

        return icon;
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
                    'admin.php?page=text-to-audio#/docs';
            } else {
                if (
                    location.search === '?page=text-to-audio' &&
                    location.hash === '#/customize'
                ) {
                    link +=
                        ttsObj.admin_url +
                        'admin.php?page=text-to-audio#/docs';
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
        if (this?.playButtonNo == 1 && this?.speakButton?.innerHTML) {
            if ('listen' === listenStatus) {
                this.speakButton.innerHTML = this.replayButtonContent();
                let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.replay_hover_title ?? 'Click to listen post.';
                this.speakButton.setAttribute('title', 'Text To Audio : ' + buttonHoverTitle);
            } else if ('pause' === listenStatus) {
                this.speakButton.innerHTML = this.pauseButtonContent();
                let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.pause_hover_title ?? this.pauseButtonText();
                this.speakButton.setAttribute('title', 'Text To Audio : ' + buttonHoverTitle);
            } else if ('resume' === listenStatus) {
                this.speakButton.innerHTML = this.resumeButtonContent();
                let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.resume_hover_title ?? this.resumeButtonText();
                this.speakButton.setAttribute('title', 'Text To Audio : ' + buttonHoverTitle);
            }
            if(isClicked) {
                setSvgColorOnEvent(this.speakButton)
            }
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

    speak(speech, content = this.content) {
        if (!this.speech.hasBrowserSupport()) {
            this.displayApiMissing("tts__listent_content_" + this.buttonId)
            return;
        }
        speech.setLanguage(this.browser.getLanguage())
        speech.setVoice(this.browser.getVoice())

        /**
         * 1. Microsoft edge browser has same voices(306 voices) for mobile and desktop
         * It uses the v8 engine as chrome browser.
         *
         *
         *
         */
        speech
            .speak({
                text: content,
                queue: false,
                listeners: {
                    onstart: (utterance) => {
                        console.log("Start utterance");
                        this.utterence = utterance
                        wp.hooks.doAction('tts_high_light_text', utterance.currentTarget.text, this.buttonId, splitSentences)
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
                    onboundary: utterance => {
                        // console.log(
                        // 	utterance.name +
                        // 	" boundary reached after " +
                        // 	utterance.elapsedTime +
                        // 	" milliseconds."
                        // );
                        // console.log(utterance)
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
        this.displayButtonText(this.listenStatus)
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

                thisClass.timer = setTimeout(pauseResumeTimer, 10000)

                if (!speech.speaking()) {
                    clearTimeout(thisClass.timer)
                    thisClass.timer = null
                }

            }, 10000);
        }
    }

    pause(speech, isClicked = false) {
        /**
         * If desktop then cancel after 7/8 second
         * If mobile cancel and restart again.
         */
        if (!this.browser.isAndroid()) {
            speech.pause();
            this.shouldCancelTimer = setInterval(() => {
                speech.cancel();
                this.isCanceled = true;
            }, 1)

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

                thisClass.timer = setTimeout(pauseResumeTimer, 10000)

                if (!speech.speaking()) {
                    clearTimeout(thisClass.timer)
                    thisClass.timer = null
                }
            }, 10000);
        }
    }

    /**
     * Callback function will need for pro version.
     * @param {*} callBackAfterEnd
     * @returns
     */
    _init(callBackAfterEnd = null) { // init speaking, 
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
                this._prepareSpeakButton(this.speech);
                window.sessionStorage.setItem('tts_paused_by_intention', false);
            })
            .catch(e => {
                console.error("An error occured while initializing : ", e);
            });

    }

    _prepareSpeakButton(speech) {
        // Button click events
        // this.speakButton.addEventListener("click", () => {
        if (this.listenStatus == 'listen') {
            this.speak(speech)
        } else if (this.listenStatus == 'pause') {
            this.pause(speech)
        } else if (this.listenStatus == 'resume') {
            this.resume(speech)
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
        console.log({ status: this.listenStatus, settings: this.ttsListeningSettings })

        document.addEventListener("visibilitychange", () => {
            // it could be either hidden or visible
            // TODO: when stop auto pause it's not reading the content properly. it stops for a few miliseconds. Fix it the release this new feature.
            let stop_autopause = window?.ttsObj?.settings?.settings?.tta__settings_stop_auto_pause_after_switching_tab ?? false;
            console.log(stop_autopause)
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
 * Load text to speech after DOMContentLoaded in free version.
 */
if (window?.ttsObj?.is_pro_active) {
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
            customCSS: "",
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

