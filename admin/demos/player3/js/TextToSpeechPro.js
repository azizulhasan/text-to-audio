
import TTSCompatibality from './compatibality/TTSCompabality'
/**
 * Define TextToSpeechPro class if TextToSpeech class exists.
 */
class TextToSpeechPro extends TextToSpeech {
    buttonId
    title = ''
    contents = ''
    path = ''
    storedContent = ''
    compatible = {}
    constructor(buttonId, content = '', button = null, TTS = window.TTS) {
        super(buttonId, content, button, TTS);
        this.buttonId = buttonId
        this.#setTitle(TTS)
        this.#setPath(TTS)
        this.content = content
        this.storedContent = this.#getStoredContent(this.content);
        //TODO highlight the text in the future.
        // wp.hooks.addAction('tts_high_light_text', 'ttsPro', this.highlightText, 10, 2)
        this.#thirdPartyPluginCompatible()
        this._handlers = [];
        this.proxy = new Proxy(this, {
            set: (target, prop, value) => {
                if (prop === 'listenStatus' && target.listenStatus !== value) {
                    target.listenStatus = value;
                    target.triggerHandlers();
                }
                return true;
            },
        });

    }

    onAValueChanged(handler) {
        this._handlers.push(handler);
    }

    triggerHandlers() {
        for (const handler of this._handlers) {
            handler(this.listenStatus);
        }
    }

    #getStoredContent(content) {

        let storedContent = JSON.parse(window.sessionStorage.getItem('tts_stored_content'))
        if (!storedContent?.url || storedContent?.url !== window.location.href) {
            window.sessionStorage.setItem('tts_stored_content', JSON.stringify({
                content: content,
                url: window.location.href
            }))
        }

        storedContent = JSON.parse(window.sessionStorage.getItem('tts_stored_content'));
        return storedContent?.content ? storedContent?.content : "";
    }

    #highlightText(tempText, buttonId, splitSentences) {

        let tempText2 = tempText
        if (!tempText) {
            return;
        }

        let htmlArr = [...document.querySelector('.tts_content_wrapper_' + buttonId).children]

        for (let i = 0; i < htmlArr.length; i++) {
            let current = htmlArr[i]
            let currentText = current.innerText;
            tempText = tempText2;
            let currentTextArr = splitSentences(currentText)
            if (currentTextArr.includes(tempText)) {
                current.style.background = 'red';
                break;
            } else {
                current.removeAttribute('style')
            }
        }

        tempText = ''
    }

    // #declare_init_content() {
    //     let tts_data = {
    //         listening: {
    //             tta__listening_lang: "en-US",
    //             tta__listening_voice: "Microsoft David - English (United States)",
    //             tta__listening_pitch: "1",
    //             tta__listening_rate: "1",
    //             tta__listening_volume: "1"
    //         },
    //         cssClass: "",
    //         btnStyle: "background-color:#ee6d6d;color:#ffffff;width:100%;border:0;display:block;border-radius:4px;text-decoration:none;cursor:pointer;",
    //         textArr: {
    //             listen_text: "Listen",
    //             pause_text: "Pause",
    //             resume_text: "Resume",
    //             replay_text: "Replay",
    //             start_text: "Start",
    //             stop_text: "Start"
    //         },
    //         customCSS: "",
    //         shouldDisplayIcon: "inline-block"
    //     }

    //     var ttsCurrentButtonNo = 1;
    //     var ttsCurrentContent = 'test data data';
    //     var ttsListening = tts_data.listening;
    //     var ttsCSSClass = tts_data.cssClass;
    //     var ttsBtnStyle = tts_data.btnStyle;
    //     var ttsTextArr = tts_data.textArr;
    //     var ttsCustomCSS = tts_data.customCSS;
    //     var ttsShouldDisplayIcon = tts_data.shouldDisplayIcon;
    //     var ttsSettings = {
    //         listening: ttsListening,
    //         cssClass: ttsCSSClass,
    //         btnStyle: ttsBtnStyle,
    //         textArr: ttsTextArr,
    //         customCSS: ttsCustomCSS,
    //         shouldDisplayIcon: ttsShouldDisplayIcon
    //     };


    //     if (window.hasOwnProperty('TTS')) { // add content if a page have multiple button
    //         var prevContent = window.TTS.contents[ttsCurrentButtonNo - 1]
    //         if (prevContent !== ttsCurrentContent) { // don't repeat same content
    //             window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
    //         }

    //     } else { // add content for the if a page have one button
    //         window.TTS = {}
    //         window.TTS.contents = {}
    //         window.TTS.contents[ttsCurrentButtonNo] = ttsCurrentContent;
    //     }

    //     // add settings
    //     if (!window.TTS.hasOwnProperty('settings')) {
    //         window.TTS.settings = ttsSettings
    //     }
    // }
    #setPath(tts) {
        if (tts?.extra) {
            this.path = tts.extra[this.buttonId].date
        }
    }
    #setTitle(tts) {
        if (tts?.extra) {
            this.title = tts.extra[this.buttonId].title
        } else {
            this.title = 'Demo Content'
        }
        this.title = this.title.replace(/[^a-zA-Z ]/g, "");
        this.title = this.title.split(' ').join('_')
        this.title = this.title + "__lang=" + tts.settings.listening.tta__listening_lang
        this.title = this.title + "__voice=" + tts.settings.listening.tta__listening_voice
    }

    #thirdPartyPluginCompatible() {
        this.compatible = new TTSCompatibality(this)
    }

    getData(shouldAsingThis = true) {
        if (shouldAsingThis) {
            window.TextToSpeechPro = this
        }
        return this;
    }
}

window.TextToSpeechPro = TextToSpeechPro
window.TextToSpeechPro2 = TextToSpeechPro


document.addEventListener("DOMContentLoaded", function () {
    let id;
    id = setInterval(() => {
        if (window.speechSynthesis.getVoices().length !== 0) {
            let buttons = [...document.querySelectorAll('.tts__listent_content')]

            if (buttons.length) {
                buttons.map(button => {
                    let buttonId = button.getAttribute('data-id')
                    new TextToSpeechPro(buttonId, window.TTS.contents[buttonId], button, window.TTS)

                })
            }

            clearInterval(id);
        }
    }, 10);

});




