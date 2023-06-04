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


let button = document.getElementById('tts-pro-play-button')
if (button) {
  console.log(window.tta_obj);
  ReactDOM.render(
    <TextToSpeech />,
    button
  )
}

