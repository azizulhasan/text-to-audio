import ReactDOM from "react-dom";
import React from "react";

import TTSLiveDemo from "./tts-live-demo/TTSLiveDemo";

/**
 * Get customize settings.
 */

let app = document.getElementById("tts_live_demo")
console.log(app)
ReactDOM.render(
    <React.StrictMode>
        <TTSLiveDemo/>
    </React.StrictMode>,
    app
);