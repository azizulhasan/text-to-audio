// TTS-239: Cloudflare Rocket Loader intercepts dynamically-injected <script>
// tags, which breaks webpack's JSONP chunk loading ("ChunkLoadError: Loading
// chunk X failed"). Tagging every script element with data-cfasync="false"
// tells Rocket Loader to skip them, so webpack's load callback fires normally.
// Must run BEFORE any lazy import / publicPath resolution.
(function () {
    if (typeof document === 'undefined' || !document.createElement) return;
    const origCreateElement = document.createElement.bind(document);
    document.createElement = function (tagName, options) {
        const el = options ? origCreateElement(tagName, options) : origCreateElement(tagName);
        try {
            if (typeof tagName === 'string' && tagName.toLowerCase() === 'script') {
                el.setAttribute('data-cfasync', 'false');
            }
        } catch (e) { /* noop */ }
        return el;
    };
})();

// Must be first import — sets __webpack_public_path__ for lazy-loaded chunks.
import './publicPath';

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
// import { isFreemiusActive, postData } from "./components/context/utilities";
import { setLocaleData } from '@wordpress/i18n';

/**
 * Sync WordPress translations with bundled @wordpress/i18n
 * This ensures React components use the translations loaded by WordPress
 */
if (window.wp && window.wp.i18n && window.wp.i18n.getLocaleData) {
    try {
        const wpLocaleData = window.wp.i18n.getLocaleData('text-to-audio');
        if (wpLocaleData && Object.keys(wpLocaleData).length > 0) {
            setLocaleData(wpLocaleData, 'text-to-audio');
            console.log(wpLocaleData)
            console.log('✅ Dashboard translations loaded:', Object.keys(wpLocaleData.messages || {}).length, 'strings');
        }
    } catch (error) {
        console.error('Translation sync error:', error);
    }
}


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


