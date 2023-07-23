import { useEffect } from "react";
let TextToSpeechProPlayer = null;
export default function TexToSpeechThree({ buttonId, button, cssStyle = '' }) {

    useEffect(() => {
        if (window.TextToSpeechProPlayer) {
            let contents = window.TTS.contents;
            TextToSpeechProPlayer = window.TextToSpeechProPlayer;
            new TextToSpeechProPlayer(buttonId, contents[buttonId], button, window.TTS)
        }
    }, [window.TextToSpeechProPlayer])

    return <div id="player_content"></div>;
}
