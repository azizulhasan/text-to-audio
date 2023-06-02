// Create a class for the element
class TTSPlayButton extends HTMLElement {
    constructor() {
        // Always call super first in constructor
        super();

        // Create a shadow root
        const shadow = this.attachShadow({ mode: 'open' });
        setTimeout(() => {
            let contents = window.TTS.contents;
            let ttsSettings = window.TTS.ttsSettings;
            let buttonIds = Object.keys(contents)
            for (let buttonNo of buttonIds) {
                if (buttonNo == this.getAttribute('data-id')) {
                    // Create spans
                    const wrapper = document.createElement('div');
                    wrapper.setAttribute('class', 'wrapper');
                    wrapper.innerHTML = `<button id="tts__listent_content_${buttonNo}" class="tts__listent_content " type="button" title="Text To Audio:  Tap to listen post."><div class="tts_button"><span class="dashicons dashicons-controls-play"></span> <span> Listen<span></span></span></div> </button>`

                    // Create some CSS to apply to the shadow dom
                    const style = document.createElement('style');




                    this.addEventListener('click', function (e) {
                        console.log(e.target)
                    })

                    style.textContent = `
                #tts__listent_content_${buttonNo}.tts__listent_content{ ${ttsSettings.btn_style} }
                #tts__listent_content_${buttonNo}.tts__listent_content:hover{ ${ttsSettings.btn_style} }
                #tts__listent_content_${buttonNo}.tts__listent_content .text-position{ position: absolute;padding-top: 2px; }
                // #tts__listent_content_${buttonNo}.tts__listent_content .dashicons{ display:${ttsSettings.should_display_icon};line-height:1;font-size:25px;height:25px;width:25px; }
                ${ttsSettings.custom_css}
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
