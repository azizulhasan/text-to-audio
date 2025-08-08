import TextToSpeech from "./TextToSpeech.js";
import { getButtonContent, getCountryCode, getFilteredVoices } from "./tts/utilities.js";
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
                    let speechClass = this
                    console.log(wrapper.getElementsByClassName('tts_button'))
                    wrapper.getElementsByClassName('tts_button')[0].addEventListener('click', function (e) {
                        let button = [...wrapper.children][0]

                        if (speechClass.speech != null && speechClass.speech.listenStatus == 'listen') {
                            speechClass.speech = null
                        }
                        if (speechClass.speech === null) {
                            let speech = new TextToSpeech(buttonId, contents[buttonId], button, window.TTS)
                            speech._init()
                            speechClass.speech = speech.getData()
                            speechClass.speech.callBackAfterEnd = speechClass.callBackAfterEnd
                        } else {
                            speechClass.speech = speechClass.speech.getData()
                            if (speechClass.speech.listenStatus == 'pause') {
                                speechClass.speech.pause(speechClass.speech.speech)
                                window.sessionStorage.setItem('tts_paused_by_intention', true);
                            } else if (speechClass.speech.listenStatus == 'resume') {
                                speechClass.speech.resume(speechClass.speech.speech)
                            }
                        }
                    })

                    this.getVoiceOptions(wrapper, buttonId, window.TTS.settings.listening.tta__listening_lang)



                    // const script = document.createElement('script');
                    // let setVoices = setInterval(() => {
                    //     if (window.speechSynthesis.getVoices().length
                    //         && document.getElementById('tts_current_player_voices_' + buttonId)) {
                    //         clearInterval(setVoices);
                    //         setVoices = null
                    //         document.getElementById('tts_current_player_voices_' + buttonId).innerHTML = `
                    //             <option value='en-US'>US</option>
                    //         `
                    //         console.log(window.speechSynthesis.getVoices())
                    //     }

                    // }, 100)



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



    getVoiceOptions(wrapper, buttonId, langCode) {
        let countryCode = getCountryCode(langCode)
        let filteredVoices = getFilteredVoices(countryCode)
        console.log(filteredVoices)
        for (let i = 0; i < filteredVoices.length; i++) {
            const option = document.createElement('option');
            option.value = filteredVoices[i].lang;   // value attribute
            option.text = filteredVoices[i].name;    // visible text
            wrapper.querySelector('#tts_current_player_voices_' + buttonId).appendChild(option);
        }

        wrapper.querySelector('#tts_current_player_voices_' + buttonId).style.display = 'block';

    }
}
document.addEventListener('DOMContentLoaded', function () {



    let setVoices = setInterval(() => {
        if (window.speechSynthesis.getVoices().length) {
            clearInterval(setVoices);
            setVoices = null
            console.log(window.speechSynthesis.getVoices())
            // Define the new element
            if (!customElements.get('tts-play-button')) {
                // console.log({ notFoundcustomElements: customElements.get('tts-play-button') })
                customElements.define('tts-play-button', TTSPlayButton)
            } else {
                console.log({ foundcustomElements: customElements.get('tts-play-button') })
            }
        }

    }, 100)
})
