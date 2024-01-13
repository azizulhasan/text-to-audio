import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { isFreemiusActive, postData } from "./components/context/utilities";


/**
 * is freemius active.
 */
postData(ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/" + 'is_pro_license_active', {}, 'GET')
    .then((res) => {
        // isFreemiusActive(res)
    })
    .catch((err) => {
        console.log(err);
    });


let app = document.getElementById("tts_dashboard_ui")
if (app && window?.ttsObj?.is_admin_page && ttsObj.is_admin_page) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}


