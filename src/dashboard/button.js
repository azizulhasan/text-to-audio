import ReactDOM from "react-dom";
import TextToSpeech from './buttons/components/TextToSpeech';
import TextToSpeechThree from "./buttons/components/TextToSpeechThree";
import TextToSpeechFour from "./buttons/components/TextToSpeechFour";

window.document.addEventListener('DOMContentLoaded', function () {
    window.sessionStorage.setItem('atlasVoice__playerStartGeneratingFile', false);
});

let buttonCSS = '';

// document.addEventListener("DOMContentLoaded", function () {

const checkInterval = 500;
const maxChecks = 100; // Check for a maximum of 30 seconds
let checkCount = 0;
let timer = setInterval(loadProButton, checkInterval);
function loadProButton() {
    checkCount++;
    console.log({player_id: window?.TTS?.extra?.player_id });
    if (window?.TTS?.extra?.player_id ) {

        const playerId = window.TTS.extra.player_id;
        buttonCSS = TTS.settings.settings.customize;
        let buttons = [...document.querySelectorAll('.tts__listent_content')];

        if (buttons.length) {
            if (playerId == 2 && window.hasOwnProperty('TextToSpeechPro') ) {
                clearInterval(timer);
                timer = null;
                buttons.map(button => {
                    let buttonId = button.getAttribute('data-id');
                    return ReactDOM.render(
                        <TextToSpeech buttonCSS={buttonCSS} button={button} buttonId={buttonId} cssStyle={''}/>,
                        button
                    );
                });
            } else if (playerId > 2 &&  window?.ttsObjPro) {
                if (window.TextToSpeechProPlayer) {
                    clearInterval(timer);
                    timer = null;

                    buttons.map(button => {
                        let buttonId = button.getAttribute('data-id');
                        let buttonContent = <TextToSpeechThree button={button} buttonId={buttonId} buttonCSS={buttonCSS}
                                                               cssStyle={''}/>;

                        if (playerId > 3) {
                            buttonContent = <TextToSpeechFour button={button} buttonId={buttonId} buttonCSS={buttonCSS}
                                                              cssStyle={''}/>;
                        }

                        return ReactDOM.render(
                            buttonContent,
                            button
                        );
                    });

                }
            }
        }
    }  else if (checkCount >= maxChecks) {
        clearInterval(timer);
        console.log("Required resources for TextToSpeechPro are not available after multiple checks.");
    }
}
// });

