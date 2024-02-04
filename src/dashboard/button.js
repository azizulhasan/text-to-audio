import ReactDOM from "react-dom";
import TextToSpeech from './buttons/components/TextToSpeech';
import TexToSpeechThree from "./buttons/components/TexToSpeechThree";
import { postWithoutImage } from './components/context/utilities';


/**
 * Get customize settings.
 */
let customize = new FormData();
customize.append('method', 'get');
let buttonCSS = '';
postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
    .then((res) => {
        console.log({ res })
        buttonCSS = res.data
    })
    .catch((err) => {
        console.log(err);
    });
let timer = setTimeout(function loadProButton() {
    timer = setTimeout(loadProButton, 1000)
    if (window.hasOwnProperty('TTS') && window.hasOwnProperty('TextToSpeechPro') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.player_id == 2 && buttonCSS) {
        clearTimeout(timer)
        timer = null

        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {
            buttons.map(button => {
                let buttonId = button.getAttribute('data-id')
                // button.attachShadow({ mode: 'open' });
                return ReactDOM.render(
                    <TextToSpeech buttonCSS={buttonCSS} button={button} buttonId={buttonId} cssStyle={''} />,
                    button
                )

            })
        }
    } else if (ttsObjPro.player_id == 3 && buttonCSS) {

        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {

            if (window.TextToSpeechProPlayer) {
                clearTimeout(timer)
                timer = null
            }
            buttons.map(button => {
                let buttonId = button.getAttribute('data-id')
                // button.attachShadow({ mode: 'open' });
                return ReactDOM.render(
                    <TexToSpeechThree button={button} buttonId={buttonId} buttonCSS={buttonCSS} cssStyle={''} />,
                    button
                )
            })

        }

    }
}, 1000)