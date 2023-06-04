import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import TextToSpeech from './buttons/components/TextToSpeech';
import TextToSpeechTwo from './buttons/components/TextToSpeechTwo';


let app = document.getElementById("app")
if (app) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}


let buttons = [...document.querySelectorAll('.tts__listent_content')]
if (buttons.length) {
    // if (window.hasOwnProperty('TTS')) {
    buttons.map(button => {
        let buttonId = button.getAttribute('data-id')
        return ReactDOM.render(
            <TextToSpeech button={button} buttonId={buttonId} />,
            button
        )
    })
    // }
}

