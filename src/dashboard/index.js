import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

let app = document.getElementById("tts_dashboard_ui")
if (app && window?.ttsObj?.is_admin_page && ttsObj.is_admin_page) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}
