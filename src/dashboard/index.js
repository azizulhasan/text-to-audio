import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { isFreemiusActive, postData } from "./components/context/utilities";


/**
 * is freemius active.
 */

// let ttsObjProLoadInterval = null;
// let counter = 0;
// ttsObjProLoadInterval = setInterval(function () {
//     counter++;
//     if (window?.ttsObjPro?.is_pro_active) {
//         clearInterval(ttsObjProLoadInterval)
//         postData(ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/" + 'is_pro_license_active', {}, 'GET')
//             .then((res) => {
//                 // console.log(res)
//                 console.log(res)
//                 // isFreemiusActive(res)
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     } else if (counter > 39) {
//         clearInterval(ttsObjProLoadInterval)
//     }
// }, 500)

let app = document.getElementById("tts_dashboard_ui")
if (app && window?.ttsObj?.is_admin_page && ttsObj.is_admin_page) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}


