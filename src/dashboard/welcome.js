import React from "react";
import ReactDOM from "react-dom";
import WelcomeWizard from "./welcome/WelcomeWizard";
import { setLocaleData } from '@wordpress/i18n';

/**
 * Sync WordPress translations with bundled @wordpress/i18n
 */
if (window.wp && window.wp.i18n && window.wp.i18n.getLocaleData) {
    try {
        const wpLocaleData = window.wp.i18n.getLocaleData('text-to-audio');
        if (wpLocaleData && Object.keys(wpLocaleData).length > 0) {
            setLocaleData(wpLocaleData, 'text-to-audio');
        }
    } catch (error) {
        // Silently handle translation sync errors
    }
}

const app = document.getElementById("tts_welcome_wizard");
if (app) {
    ReactDOM.render(
        <React.StrictMode>
            <WelcomeWizard />
        </React.StrictMode>,
        app
    );
}
