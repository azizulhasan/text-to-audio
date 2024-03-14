import TextToSpeech from "./TextToSpeech.js";
import { getButtonContent } from "./tts/utilities.js";

// Create a class for the element
class TTSPlayButton extends HTMLElement {
    speech = null
    isProLicenseActive = false
    constructor() {
        // Always call super first in constructor
        super();
        this.isProLicenseActive = window?.ttsObj?.is_pro_license_active;
        // Create a shadow root
        const shadow = this.attachShadow({ mode: 'open' });
        if (window.hasOwnProperty('TTS')) {
            let contents = window.TTS.contents;
            let settings = window.TTS.settings;
            let buttonIds = Object.keys(contents)
            // Render all buttons in page have.
            for (let buttonId of buttonIds) {
                if (buttonId == this.getAttribute('data-id')) {
                    // Create div
                    const wrapper = document.createElement('div');
                    wrapper.setAttribute('class', 'wrapper');
                    wrapper.innerHTML = getButtonContent(buttonId, settings.cssClass, this.isProLicenseActive)
                    console.log({ wrapper })
                    this.addEventListener('click', function (e) {
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
                        #tts__listent_content_${buttonId}.tts__listent_content{ ${settings.btnStyle}height:30px; }
                        #tts__listent_content_${buttonId}.tts__listent_content:hover{ ${settings.btnStyle}height:30px; }
                        // #tts__listent_content_${buttonId}.tts__listent_content .text-position{ position: absolute;padding-top: 2px; }
                        // #tts__listent_content_${buttonId}.tts__listent_content .dashicons{ display:${settings.shouldDisplayIcon};line-height:1;font-size:25px;height:25px;width:25px; }
                        ${this.#htmlDecode(settings.customCSS)}
                    `;
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
        console.log({ notFoundcustomElements: customElements.get('tts-play-button') })
        customElements.define('tts-play-button', TTSPlayButton)
    } else {
        console.log({ foundcustomElements: customElements.get('tts-play-button') })
    }
})
