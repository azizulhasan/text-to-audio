class TextToSpeech {
    TTS = {}
    browser = null
    speech = new Speech()
    speechSynthesis = window.speechSynthesis
    utterence = new SpeechSynthesisUtterance()
    speechRecognitionIsActive = true
    speechRecognition = window.speechRecognition || window.webkitSpeechRecognition
    recordStatus = 'record'
    listenStatus = 'listen'
    noticeClass = 'tta_notice'
    cofiguration = {}
    timer = null
    buttonId = window.buttonId
    speakButton = document.getElementById("tta__listent_content_" + window.buttonId)
    content = window.ttsContent
    ttsListeningSettings = window.ttsListeningSettings
    languages = []
    voices = {}
    voice = true ? 'English United Kingdom' : "Microsoft David - English (United States)"
    language = true ? 'en_GB' : 'en-AU'
    buttonTextArr = ttsObj.buttonTextArr
    splittedSentances = splitSentences(window.ttsContent)
    isCanceled = false
    shouldCancelTimer = null
    constructor(TTS = window.TTS) {
        this.TTS = TTS
    }

    playButtonText() {
        return this.buttonTextArr.listen_text;
    }

    playButtonContent() {

        return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.playButtonText() + '<span></span></span></div>'
    }
    replayButtonText() {
        return this.buttonTextArr.replay_text;
    }
    replayButtonContent() {
        return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-image-rotate"></span> <span> ' + this.replayButtonText() + '<span></span></span></div>'
    }
    pauseButtonText() {
        return this.buttonTextArr.pause_text;
    }
    pauseButtonContent() {
        return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-pause"></span> <span> ' + this.pauseButtonText() + '<span></span></span></div>'
    }
    resumeButtonText() {
        return this.buttonTextArr.resume_text;
    }
    resumeButtonContent() {
        return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.buttonTextArr.resume_text + '<span></span></span></div>'
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

        if (!TTA.speechRecognitionIsActive) {
            notice += 'Text To Audio: Please enable speechRecognition';
        }
        if (!TTA.speechSynthesis) {
            if (notice) {
                notice += ' , speechSynthesis.';
            } else {
                notice += 'Text To Audio: Please enable speechSynthesis.';
            }
        }

        if (button_id) {
            let previousSibling =
                document.getElementById(button_id).previousSibling;
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
                link +=
                    ttsObj.admin_url +
                    'admin.php?page=text-to-audio#/docs';
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

        throw new Error(notice);
    }
    speak(speech, content = TTA.content) {
        if (!TTA.speech.hasBrowserSupport()) {
            TTA.displayApiMissing("tta__listent_content_" + window.buttonId)
            return;
        }

        speech.setLanguage(TTA.browser.getLanguage())
        speech.setVoice(TTA.browser.getVoice())
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
                        TTA.utterence = utterance
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
                if (!TTA.speech.speaking()) {
                    console.log('End utterance ' + TTA.speech.speaking());
                    TTA.speakButton.innerHTML = TTA.replayButtonContent();
                    TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.replayButtonText());
                    TTA.listenStatus = 'listen';

                    // set up initial content to replacy.
                    TTA.content = window.ttsContent;
                    TTA.splittedSentances = splitSentences(window.ttsContent)
                    speech.cancel();
                }
                console.log("Success !", data);
                if (!TTA.browser.isAndroid()) {
                    clearTimeout(TTA.timer);
                }

            })
            .catch(e => {
                console.error("An error occurred :", e);
            });


        TTA.speakButton.innerHTML = TTA.pauseButtonContent();
        TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
        TTA.listenStatus = 'pause';
        if (!TTA.browser.isAndroid()) {
            TTA.timer = setTimeout(function pauseResumeTimer() {
                speech.pause();
                //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
                console.log(speech);
                // Placing the speak invocation inside a callback fixes ordering and onend issues
                setTimeout(() => {
                    speech.resume();
                }, 0);

                TTA.timer = setTimeout(pauseResumeTimer, 10000)
            }, 10000);
        }
    }
    pause(speech) {

        /**
         * If desktop then cancel after 7/8 second
         * If mobile cancel and restart again.
         */
        if (!TTA.browser.isAndroid()) {
            speech.pause();
            TTA.shouldCancelTimer = setInterval(() => {
                speech.cancel();
                TTA.isCanceled = true;
            }, 7000)

        } else {
            speech.cancel();
            TTA.isCanceled = true;
        }

        // update current content
        let currentIndex = TTA.splittedSentances.indexOf(TTA.utterence.target.text);
        TTA.splittedSentances = TTA.splittedSentances.slice(currentIndex)
        TTA.content = TTA.splittedSentances.join(' ')

        TTA.speakButton.innerHTML = TTA.resumeButtonContent();
        TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.resumeButtonText());
        TTA.listenStatus = 'resume';
        if (!TTA.browser.isAndroid()) {
            clearTimeout(TTA.timer);
        }
    }
    resume(speech) {

        if (TTA.isCanceled) {
            TTA.speak(speech, TTA.content)
            clearTimeout(TTA.shouldCancelTimer)
            if (!TTA.browser.isAndroid()) {
                clearTimeout(TTA.timer);
            }
        } else {
            speech.resume();
            clearTimeout(TTA.shouldCancelTimer)
        }

        TTA.speakButton.innerHTML = TTA.pauseButtonContent();
        TTA.listenStatus = 'pause';
        TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
        if (!TTA.browser.isAndroid()) {
            TTA.timer = setTimeout(function pauseResumeTimer() {
                speech.pause();
                //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
                console.log(speech);
                // Placing the speak invocation inside a callback fixes ordering and onend issues
                setTimeout(() => {
                    speech.resume();
                }, 0);

                TTA.timer = setTimeout(pauseResumeTimer, 10000)
            }, 10000);
        }
    }

    _init(listening,) {

        if (TTA.ttsListeningSettings === undefined) return;
        TTA.speech
            .init({
                volume: TTA.ttsListeningSettings.tta__listening_volume
                    ? TTA.ttsListeningSettings.tta__listening_volume
                    : 1, // From 0 to 1,
                // lang: lang, // It will be speaking language.
                rate: TTA.ttsListeningSettings.tta__listening_rate
                    ? TTA.ttsListeningSettings.tta__listening_rate
                    : 1, // From 0.1 to 10
                pitch: TTA.ttsListeningSettings.tta__listening_pitch
                    ? TTA.ttsListeningSettings.tta__listening_pitch
                    : 2, // From 0 to 2
                // voice: voice,
                splitSentences: true,
                listeners: {
                    onvoiceschanged: voices => {
                        // console.log(voices)
                        // TTA.voices = voices

                        // this function can be used in the pro version.
                    }
                }
            })
            .then(data => {
                TTA.voices = data.voices;
                TTA.browser = new BrowserSupport(ttsObj, data.voices, TTA.ttsListeningSettings.tta__listening_lang, TTA.ttsListeningSettings.tta__listening_voice)
                TTA._prepareSpeakButton(TTA.speech);
            })
            .catch(e => {
                console.error("An error occured while initializing : ", e);
            });
    }

    _prepareSpeakButton(speech) {
        // Button click events
        TTA.speakButton.addEventListener("click", () => {
            if (TTA.listenStatus == 'listen') {
                TTA.speak(speech)

            } else if (TTA.listenStatus == 'pause') {
                TTA.pause(speech)

            } else if (TTA.listenStatus == 'resume') {
                TTA.resume(speech)

            }
        });

        // When browser tab switches to another tab.
        document.addEventListener("visibilitychange", () => {
            // it could be either hidden or visible
            if ('hidden' === document.visibilityState && TTA.listenStatus === 'pause') {
                TTA.pause(speech)
            }

            if ('visible' === document.visibilityState && TTA.listenStatus === 'resume') {
                TTA.resume(speech)
            }
        });
    }

}