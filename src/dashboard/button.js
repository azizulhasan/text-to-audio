import ReactDOM from "react-dom";
import TextToSpeech from './buttons/components/TextToSpeech';
import TextToSpeechThree from "./buttons/components/TextToSpeechThree";
import TextToSpeechFour from "./buttons/components/TextToSpeechFour";
import {postWithoutImage} from './components/context/utilities';

/**
 * Get customize settings.
 */
let customize = new FormData();
customize.append('method', 'get');
let buttonCSS = '';

let timer = setTimeout(function loadProButton() {
    timer = setTimeout(loadProButton, 1)
    if (window.hasOwnProperty('TTS') && window.hasOwnProperty('TextToSpeechPro') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.player_id == 2) {
        clearTimeout(timer)
        timer = null
        buttonCSS = TTS.settings.settings.customize;
        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {
            buttons.map(button => {
                let buttonId = button.getAttribute('data-id')
                // button.attachShadow({ mode: 'open' });
                return ReactDOM.render(
                    <TextToSpeech buttonCSS={buttonCSS} button={button} buttonId={buttonId} cssStyle={''}/>,
                    button
                )

            })
        }
    } else if (window.hasOwnProperty('TTS') && ttsObjPro.player_id > 2) {
        buttonCSS = TTS.settings.settings.customize;
        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {

            if (window.TextToSpeechProPlayer) {
                clearTimeout(timer)
                timer = null
            }
            buttons.map(button => {
                let buttonId = button.getAttribute('data-id')
                // button.attachShadow({ mode: 'open' });
                let buttonContent = <TextToSpeechThree button={button} buttonId={buttonId} buttonCSS={buttonCSS}
                                                       cssStyle={''}/>
                if (ttsObjPro.player_id > 3) {
                    buttonContent =
                        <TextToSpeechFour button={button} buttonId={buttonId} buttonCSS={buttonCSS} cssStyle={''}/>
                }

                return ReactDOM.render(
                    buttonContent,
                    button
                )
            })

        }

    }
}, 1)