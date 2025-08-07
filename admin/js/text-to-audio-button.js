import TextToSpeech from "./TextToSpeech.js";
import { getButtonContent } from "./tts/utilities.js";
import AtlasVoiceAnalytics from "./AtlasVoiceAnalytics";

// Create a class for the element
class TTSPlayButton extends HTMLElement {
    speech = null
    isProLicenseActive = false
    analytics = null
    constructor() {
        // Always call super first in constructor
        super();

        if (typeof NoSleep === 'function' && ttsObj?.is_mobile) {
            const noSleep = new NoSleep();
            window.onload = function () {
                noSleep.enable();
                console.log("NoSleep enabled");
            };
        }

        this.isProLicenseActive = window?.ttsObj?.is_pro_active;
        // Create a shadow root
        const shadow = this.attachShadow({ mode: 'open' });
        if (window.hasOwnProperty('TTS')) {
            let contents = window.TTS.contents;
            let settings = window.TTS.settings;
            let buttonIds = Object.keys(contents)
            this.analytics = new AtlasVoiceAnalytics(window.TTS.settings.postId)// Render all buttons in page have.
            for (let buttonId of buttonIds) {
                if (buttonId == this.getAttribute('data-id')) {
                    // Create div
                    const wrapper = document.createElement('div');
                    wrapper.setAttribute('class', 'wrapper');
                    wrapper.innerHTML = getButtonContent(buttonId, settings.cssClass, this.isProLicenseActive)
                    this.analytics.trackInit();
                    console.log(contents[buttonId])
                    wrapper.getElementsByClassName('tts_button')[0].addEventListener('click', function (e) {
                        let button = [...wrapper.children][0]

                        if (this.speech != null && this.speech.listenStatus == 'listen') {
                            this.speech = null
                        }
                        if (this.speech === null) {
                            let speech = new TextToSpeech(buttonId, contents[buttonId], button, window.TTS)
                            speech._init()
                            this.speech = speech.getData()
                            this.speech.callBackAfterEnd = this.callBackAfterEnd
                        } else {
                            this.speech = this.speech.getData()
                            if (this.speech.listenStatus == 'pause') {
                                this.speech.pause(this.speech.speech)
                                window.sessionStorage.setItem('tts_paused_by_intention', true);
                            } else if (this.speech.listenStatus == 'resume') {
                                this.speech.resume(this.speech.speech)
                            }
                        }
                    })
                    // Create some CSS to apply to the shadow dom
                    const style = document.createElement('style');
                    // CSS style for thsi button
                    style.textContent = `
                        #tts__listent_content_${buttonId}.tts__listent_content{ ${settings.btnStyle} transition: all 0.5s ease-in-out; }
                        #tts__listent_content_${buttonId}.tts__listent_content:hover{ ${settings.btnStyle} background-color:${ttsObj?.settings?.customize?.hoverBackgroundColor || '#f0f0f0'};}

                        #tts__listent_content_${buttonId}.tts__listent_content svg{ display:${settings.shouldDisplayIcon}; padding-right:7px !important;padding-top: 5px; }
                        #tts__listent_content_${buttonId}.tts__listent_content:hover  svg{ display:${settings.shouldDisplayIcon}; padding-right:7px !important; padding-top: 5px; } 
                    `;

                    if (settings?.customCSS) {
                        style.textContent += `
                            ${this.#htmlDecode(settings.customCSS)}
                        `;
                    }
                    // Attsch the created elements to the shadow dom
                    shadow.appendChild(style);
                    shadow.appendChild(wrapper);

                    break;
                }
            } // end loop
        }
    }

    callBackAfterEnd() {
        if (this.listenStatus === 'listen') {
            this.displayButtonText()
        }
    }

    #htmlDecode(str) {

        let txt = document.createElement("textarea");

        txt.innerHTML = str;

        return txt.value;

    }
}
document.addEventListener('DOMContentLoaded', function () {
    // Define the new element
    if (!customElements.get('tts-play-button')) {
        // console.log({ notFoundcustomElements: customElements.get('tts-play-button') })
        customElements.define('tts-play-button', TTSPlayButton)
    } else {
        console.log({ foundcustomElements: customElements.get('tts-play-button') })
    }
})
