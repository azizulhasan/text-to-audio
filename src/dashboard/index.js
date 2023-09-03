import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import TextToSpeech from './buttons/components/TextToSpeech';
import TexToSpeechThree from "./buttons/components/TexToSpeechThree";

let app = document.getElementById("app")
if (app) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}




let timer = setTimeout(function loadProButton() {
    timer = setTimeout(loadProButton, 1000)
    if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && !ttsObjPro.should_activate_pro_features) {
        clearTimeout(timer)
        timer = null

        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {
            buttons.map(button => {
                let buttonId = button.getAttribute('data-id')
                // button.attachShadow({ mode: 'open' });
                return ReactDOM.render(
                    <TextToSpeech button={button} buttonId={buttonId} cssStyle={''} />,
                    button
                )

            })
        }
    } else {

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
                    <TexToSpeechThree button={button} buttonId={buttonId} cssStyle={''} />,
                    button
                )
            })

        }

    }
}, 1000)