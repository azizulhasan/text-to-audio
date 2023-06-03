import TextToSpeech from "./TextToSpeech.js";
// Create a class for the element
class TTSPlayButton extends HTMLElement {
    speech = null
    constructor() {
        // Always call super first in constructor
        super();

        // Create a shadow root
        const shadow = this.attachShadow({ mode: 'open' });
        setTimeout(() => {
            let contents = window.TTS.contents;
            let settings = window.TTS.settings;
            let buttonIds = Object.keys(contents)
            // Render all buttons in page have.
            for (let buttonNo of buttonIds) {
                if (buttonNo == this.getAttribute('data-id')) {
                    // Create div
                    const wrapper = document.createElement('div');
                    wrapper.setAttribute('class', 'wrapper');
                    wrapper.innerHTML = `<button id="tts__listent_content_${buttonNo}" class="tts__listent_content  ${settings.cssClass}" type="button" title="Text To Audio:  Tap to listen post."><div class="tts_button"><span class="dashicons dashicons-controls-play"></span><span>Listen<span></div> </button>`

                    this.addEventListener('click', function (e) {
                        let button = [...wrapper.children][0]
                        if (this.speech != null && this.speech.listenStatus == 'listen') {
                            this.speech = null
                        }
                        if (this.speech === null) {
                            this.speech = new TextToSpeech(buttonNo, contents[buttonNo], button, window.TTS)
                            this.speech._init()
                        } else {

                            this.speech = this.speech.getData()
                            if (this.speech.listenStatus == 'pause') {
                                this.speech.pause(this.speech.speech)
                            } else if (this.speech.listenStatus == 'resume') {
                                this.speech.resume(this.speech.speech)
                            }
                        }
                    })
                    // Create some CSS to apply to the shadow dom
                    const style = document.createElement('style');

                    // CSS style for thsi button
                    style.textContent = `
                        #tts__listent_content_${buttonNo}.tts__listent_content{ ${settings.btnStyle}height:30px; }
                        #tts__listent_content_${buttonNo}.tts__listent_content:hover{ ${settings.btnStyle}height:30px; }
                        // #tts__listent_content_${buttonNo}.tts__listent_content .text-position{ position: absolute;padding-top: 2px; }
                        // #tts__listent_content_${buttonNo}.tts__listent_content .dashicons{ display:${settings.shouldDisplayIcon};line-height:1;font-size:25px;height:25px;width:25px; }
                        ${settings.customCSS}
                    `;

                    // Attsch the created elements to the shadow dom
                    shadow.appendChild(style);
                    shadow.appendChild(wrapper);

                    break;
                }

            }

        }, 900)


    }
}

// Define the new element
customElements.define('tts-play-button', TTSPlayButton);
