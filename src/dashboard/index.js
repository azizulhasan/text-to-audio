import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import TextToSpeech from './buttons/components/TextToSpeech';
import { bootstrapCSS } from "./buttons/assets/css/bootstrap";

let app = document.getElementById("app")
if (app) {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        app
    );

}


// Create a class for the element
class TTSPlayButton extends HTMLElement {
    speech = null
    isProLicenseActive = false

    constructor() {
        // Always call super first in constructor
        super();
        //         this.isProLicenseActive = window.ttsObj.is_pro_license_active;
        //         // Create a shadow root
        //         // setTimeout(() => {
        //         // Render all buttons in page have.
        //         // for (let buttonId of buttonIds) {
        //         //     if (buttonId == this.getAttribute('data-id')) {
        //         //         // Create div
        //         //         const wrapper = document.createElement('div');
        //         //         wrapper.setAttribute('class', 'wrapper');

        //         //         wrapper.innerHTML = getButtonContent(buttonId, settings.cssClass, this.isProLicenseActive)

        //         //         // this.addEventListener('click', function (e) {
        //         //         //     let button = [...wrapper.children][0]
        //         //         //     if (this.speech != null && this.speech.listenStatus == 'listen') {
        //         //         //         this.speech = null
        //         //         //     }
        //         //         //     if (this.speech === null) {
        //         //         //         this.speech = new TextToSpeech(buttonId, contents[buttonId], button, window.TTS)
        //         //         //         this.speech._init()
        //         //         //     } else {

        //         //         //         this.speech = this.speech.getData()
        //         //         //         if (this.speech.listenStatus == 'pause') {
        //         //         //             this.speech.pause(this.speech.speech)
        //         //         //         } else if (this.speech.listenStatus == 'resume') {
        //         //         //             this.speech.resume(this.speech.speech)
        //         //         //         }
        //         //         //     }
        //         //         // })
        //         //         // Create some CSS to apply to the shadow dom
        //         //         const style = document.createElement('style');

        //         //         // CSS style for thsi button
        //         //         style.textContent = `
        //         //             #tts__listent_content_${buttonId}.tts__listent_content{ ${settings.btnStyle}height:30px; }
        //         //             #tts__listent_content_${buttonId}.tts__listent_content:hover{ ${settings.btnStyle}height:30px; }
        //         //             // #tts__listent_content_${buttonId}.tts__listent_content .text-position{ position: absolute;padding-top: 2px; }
        //         //             // #tts__listent_content_${buttonId}.tts__listent_content .dashicons{ display:${settings.shouldDisplayIcon};line-height:1;font-size:25px;height:25px;width:25px; }
        //         //             ${settings.customCSS}
        //         //         `;

        //         //         // Attsch the created elements to the shadow dom
        //         //         shadow.appendChild(style);
        //         //         shadow.appendChild(wrapper);

        //         //         break;
        //         //     }
        //         // } // end loop


        let buttons = [...document.querySelectorAll('.tts__listent_content')]
        if (buttons.length) {
            buttons.map(button => {
                const shadow = button.attachShadow({ mode: 'open' });
                let buttonId = button.getAttribute('data-id')

                // const wrapper = document.createElement('div');
                // wrapper.setAttribute('class', 'wrapper');


                return ReactDOM.render(
                    <TextToSpeech button={button} buttonId={buttonId} />,
                    button.shadowRoot
                )

                // console.log(wrapper)
                // console.log(shadow)
                // const style = document.createElement('style');

                // CSS style for thsi button
                // style.textContent = ` `;

                // Attsch the created elements to the shadow dom
                // shadow.appendChild(style);
                return shadow.appendChild(wrapper);

            })
        }




        //         // }, 900) // end setTimeout
    }
}

// // Define the new element
// customElements.define('tts-play-button', TTSPlayButton);



let buttons = [...document.querySelectorAll('.tts__listent_content')]
if (buttons.length) {
    buttons.map(button => {
        let buttonId = button.getAttribute('data-id')
        // button.attachShadow({ mode: 'open' });
        let style = `:host {
                --bs - blue: #0d6efd;
            --bs-indigo: #6610f2;
            --bs-purple: #6f42c1;
            --bs-pink: #d63384;
            --bs-red: #dc3545;
            --bs-orange: #fd7e14;
            --bs-yellow: #ffc107;
            --bs-green: #198754;
            --bs-teal: #20c997;
            --bs-cyan: #0dcaf0;
            --bs-white: #fff;
            --bs-gray: #6c757d;
            --bs-gray-dark: #343a40;
            --bs-gray-100: #f8f9fa;
            --bs-gray-200: #e9ecef;
            --bs-gray-300: #dee2e6;
            --bs-gray-400: #ced4da;
            --bs-gray-500: #adb5bd;
            --bs-gray-600: #6c757d;
            --bs-gray-700: #495057;
            --bs-gray-800: #343a40;
            --bs-gray-900: #212529;
            --bs-primary: #0d6efd;
            --bs-secondary: #6c757d;
            --bs-success: #198754;
            --bs-info: #0dcaf0;
            --bs-warning: #ffc107;
            --bs-danger: #dc3545;
            --bs-light: #f8f9fa;
            --bs-dark: #212529;
            --bs-primary-rgb: 13, 110, 253;
            --bs-secondary-rgb: 108, 117, 125;
            --bs-success-rgb: 25, 135, 84;
            --bs-info-rgb: 13, 202, 240;
            --bs-warning-rgb: 255, 193, 7;
            --bs-danger-rgb: 220, 53, 69;
            --bs-light-rgb: 248, 249, 250;
            --bs-dark-rgb: 33, 37, 41;
            --bs-white-rgb: 255, 255, 255;
            --bs-black-rgb: 0, 0, 0;
            --bs-body-color-rgb: 33, 37, 41;
            --bs-body-bg-rgb: 255, 255, 255;
            --bs-font-sans-serif: system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif,
            'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
            'Noto Color Emoji';
            --bs-font-monospace: SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
            --bs-gradient: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0)
            );
            --bs-body-font-family: var(--bs-font-sans-serif);
            --bs-body-font-size: 1rem;
            --bs-body-font-weight: 400;
            --bs-body-line-height: 1.5;
            --bs-body-color: #212529;
            --bs-body-bg: #fff;
}

            *,
            *::before,
            *::after {
                box - sizing: border-box;
}

            @media (prefers-reduced-motion: no-preference) {
	:root {
                scroll - behavior: smooth;
	}
}

            body {
                margin: 0;
            font-family: var(--bs-body-font-family);
            font-size: var(--bs-body-font-size);
            font-weight: var(--bs-body-font-weight);
            line-height: var(--bs-body-line-height);
            color: var(--bs-body-color);
            text-align: var(--bs-body-text-align);
            background-color: var(--bs-body-bg);
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

            hr {
                margin: 1rem 0;
            color: inherit;
            background-color: currentColor;
            border: 0;
            opacity: 0.25;
}

            hr:not([size]) {
                height: 1px;
}

            h6,
            .h6,
            h5,
            .h5,
            h4,
            .h4,
            h3,
            .h3,
            h2,
            .h2,
            h1,
            .h1 {
                margin - top: 0;
            margin-bottom: 0.5rem;
            font-weight: 500;
            line-height: 1.2;
}

            h1,
            .h1 {
                font - size: calc(1.375rem + 1.5vw);
}
            @media (min-width: 1200px) {
                h1,
	.h1 {
                font - size: 2.5rem;
	}
}

            h2,
            .h2 {
                font - size: calc(1.325rem + 0.9vw);
}
            @media (min-width: 1200px) {
                h2,
	.h2 {
                font - size: 2rem;
	}
}

            h3,
            .h3 {
                font - size: calc(1.3rem + 0.6vw);
}
            @media (min-width: 1200px) {
                h3,
	.h3 {
                font - size: 1.75rem;
	}
}

            h4,
            .h4 {
                font - size: calc(1.275rem + 0.3vw);
}
            @media (min-width: 1200px) {
                h4,
	.h4 {
                font - size: 1.5rem;
	}
}

            h5,
            .h5 {
                font - size: 1.25rem;
}

            h6,
            .h6 {
                font - size: 1rem;
}

            p {
                margin - top: 0;
            margin-bottom: 1rem;
}

            abbr[title],
            abbr[data-bs-original-title] {
                -webkit - text - decoration: underline dotted;
            text-decoration: underline dotted;
            cursor: help;
            -webkit-text-decoration-skip-ink: none;
            text-decoration-skip-ink: none;
}

            address {
                margin - bottom: 1rem;
            font-style: normal;
            line-height: inherit;
}

            ol,
            ul {
                padding - left: 2rem;
}

            ol,
            ul,
            dl {
                margin - top: 0;
            margin-bottom: 1rem;
}

            ol ol,
            ul ul,
            ol ul,
            ul ol {
                margin - bottom: 0;
}

            dt {
                font - weight: 700;
}

            dd {
                margin - bottom: 0.5rem;
            margin-left: 0;
}

            blockquote {
                margin: 0 0 1rem;
}

            b,
            strong {
                font - weight: bolder;
}

            small,
            .small {
                font - size: 0.875em;
}

            mark,
            .mark {
                padding: 0.2em;
            background-color: #fcf8e3;
}

            sub,
            sup {
                position: relative;
            font-size: 0.75em;
            line-height: 0;
            vertical-align: baseline;
}

            sub {
                bottom: -0.25em;
}

            sup {
                top: -0.5em;
}

            a {
                color: #0d6efd;
            text-decoration: underline;
}
            a:hover {
                color: #0a58ca;
}

            a:not([href]):not([class]),
            a:not([href]):not([class]):hover {
                color: inherit;
            text-decoration: none;
}

            pre,
            code,
            kbd,
            samp {
                font - family: var(--bs-font-monospace);
            font-size: 1em;
            direction: ltr ;
            unicode-bidi: bidi-override;
}

            pre {
                display: block;
            margin-top: 0;
            margin-bottom: 1rem;
            overflow: auto;
            font-size: 0.875em;
}
            pre code {
                font - size: inherit;
            color: inherit;
            word-break: normal;
}

            code {
                font - size: 0.875em;
            color: #d63384;
            word-wrap: break-word;
}
a > code {
                color: inherit;
}

            kbd {
                padding: 0.2rem 0.4rem;
            font-size: 0.875em;
            color: #fff;
            background-color: #212529;
            border-radius: 0.2rem;
}
            kbd kbd {
                padding: 0;
            font-size: 1em;
            font-weight: 700;
}

            figure {
                margin: 0 0 1rem;
}

            img,
            svg {
                vertical - align: middle;
}

            table {
                caption - side: bottom;
            border-collapse: collapse;
}

            caption {
                padding - top: 0.5rem;
            padding-bottom: 0.5rem;
            color: #6c757d;
            text-align: left;
}

            th {
                text - align: inherit;
            text-align: -webkit-match-parent;
}

            thead,
            tbody,
            tfoot,
            tr,
            td,
            th {
                border - color: inherit;
            border-style: solid;
            border-width: 0;
}

            label {
                display: inline-block;
}

            button {
                border - radius: 0;
}

            button:focus:not(:focus-visible) {
                outline: 0;
}

            input,
            button,
            select,
            optgroup,
            textarea {
                margin: 0;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
}

            button,
            select {
                text - transform: none;
}

            [role='button'] {
                cursor: pointer;
}

            select {
                word - wrap: normal;
}
            select:disabled {
                opacity: 1;
}

            [list]::-webkit-calendar-picker-indicator {
                display: none;
}

            button,
            [type='button'],
            [type='reset'],
            [type='submit'] {
                -webkit - appearance: button;
}
            button:not(:disabled),
            [type='button']:not(:disabled),
            [type='reset']:not(:disabled),
            [type='submit']:not(:disabled) {
                cursor: pointer;
}

            ::-moz-focus-inner {
                padding: 0;
            border-style: none;
}

            textarea {
                resize: vertical;
}

            fieldset {
                min - width: 0;
            padding: 0;
            margin: 0;
            border: 0;
}

            legend {
                float: left;
            width: 100%;
            padding: 0;
            margin-bottom: 0.5rem;
            font-size: calc(1.275rem + 0.3vw);
            line-height: inherit;
}
            @media (min-width: 1200px) {
                legend {
                font - size: 1.5rem;
	}
}
            legend + * {
                clear: left;
}

            ::-webkit-datetime-edit-fields-wrapper,
            ::-webkit-datetime-edit-text,
            ::-webkit-datetime-edit-minute,
            ::-webkit-datetime-edit-hour-field,
            ::-webkit-datetime-edit-day-field,
            ::-webkit-datetime-edit-month-field,
            ::-webkit-datetime-edit-year-field {
                padding: 0;
}

            ::-webkit-inner-spin-button {
                height: auto;
}

            [type='search'] {
                outline - offset: -2px;
            -webkit-appearance: textfield;
}


            ::-webkit-search-decoration {
                -webkit - appearance: none;
}

            ::-webkit-color-swatch-wrapper {
                padding: 0;
}

            ::file-selector-button {
                font: inherit;
}

            ::-webkit-file-upload-button {
                font: inherit;
            -webkit-appearance: button;
}

            output {
                display: inline-block;
}

            iframe {
                border: 0;
}

            summary {
                display: list-item;
            cursor: pointer;
}

            progress {
                vertical - align: baseline;
}

            [hidden] {
                display: none !important;
}

            .lead {
                font - size: 1.25rem;
            font-weight: 300;
}

            .display-1 {
                font - size: calc(1.625rem + 4.5vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 1 {
                font - size: 5rem;
	}
}

            .display-2 {
                font - size: calc(1.575rem + 3.9vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 2 {
                font - size: 4.5rem;
	}
}

            .display-3 {
                font - size: calc(1.525rem + 3.3vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 3 {
                font - size: 4rem;
	}
}

            .display-4 {
                font - size: calc(1.475rem + 2.7vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 4 {
                font - size: 3.5rem;
	}
}

            .display-5 {
                font - size: calc(1.425rem + 2.1vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 5 {
                font - size: 3rem;
	}
}

            .display-6 {
                font - size: calc(1.375rem + 1.5vw);
            font-weight: 300;
            line-height: 1.2;
}
            @media (min-width: 1200px) {
	.display - 6 {
                font - size: 2.5rem;
	}
}

            .list-unstyled {
                padding - left: 0;
            list-style: none;
}

            .list-inline {
                padding - left: 0;
            list-style: none;
}

            .list-inline-item {
                display: inline-block;
}
            .list-inline-item:not(:last-child) {
                margin - right: 0.5rem;
}

            .initialism {
                font - size: 0.875em;
            text-transform: uppercase;
}

            .blockquote {
                margin - bottom: 1rem;
            font-size: 1.25rem;
}
.blockquote > :last-child {
                margin - bottom: 0;
}

            .blockquote-footer {
                margin - top: -1rem;
            margin-bottom: 1rem;
            font-size: 0.875em;
            color: #6c757d;
}
            .blockquote-footer::before {
                content: '— ';
}

            .img-fluid {
                max - width: 100%;
            height: auto;
}

            .img-thumbnail {
                padding: 0.25rem;
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            max-width: 100%;
            height: auto;
}

            .figure {
                display: inline-block;
}


            #root {
                max - width: 1280px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
            background-color: #FCFCFC;
}

            .shadow-custom {
                box - shadow: rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px;
            border-radius: 8px;
}

            .custom-hover:hover {
                background - color: #F2F2F2;
            cursor: pointer;
}

            .audio-controls {
                display: grid;
            grid-template-columns: 1fr 9fr 1fr;
            gap: 20px;
}

            .cursor-pointer {
                cursor: pointer;
}

            .audio-progress {
                height: 4px;
}

            .audio-progress .progress-bar {
                background - color: black;
}
            .custom-position{
                position: fixed;
            top:80%;
            right: 5%;
            width: 455px;
}
            .custom-position2{
                position: fixed;
            top:80%;
            left: 5%;
            width: 455px;
}
            .adjusted-position{
                position: relative;
            top:-300px;
            width: 300px;
            height:300px;
            overflow: scroll;
}
            .adjusted-position1{
                position: relative;
            top:-300px;
            width: 300px;
            height:70px;
            overflow: hidden;
}
            .adjusted-position1{
                position: relative;
            top:-300px;
            width: 300px;
            height:70px;
            overflow: hidden;
}
            .custom-font-size{
                font - size: 10px;
}
            .custom-content{
                padding: 10px;
            background-color: whitesmoke;
            cursor: pointer;
}
            .custom-content:hover {
                background - color: rgb(113, 113, 108);
            color: rgb(242, 243, 243);
}
            .verticle-align{
                transform: rotate(90deg);
  
}
            .normal-background{
                background - color:rgb(94, 222, 94);
}
            .fast-background{
                background - color:rgb(255, 136, 0);
}
            .very-fast-background{
                background - color:rgb(240, 14, 14);
}
            .slow-background{
                background - color:rgb(145, 158, 44);
}
            @media (max-width: 575.98px) {
  .custom - position{
                position: fixed;
            top:50%;
            right: 1%;
            width: 320px;
  }
}

            @media (min-width: 576px) and (max-width: 767.98px) {
  .custom - position{
                position: fixed;
            top:50%;
            right: 1%;
            width: 380px;
  }
}

            @media (min-width: 768px) and (max-width: 1199.98px) {
  .custom - position{
                position: fixed;
            top:50%;
            right: 1%;
            width: 420px;
  }
}
`
        return ReactDOM.render(
            <TextToSpeech button={button} buttonId={buttonId} cssStyle={style} />,
            button
        )

    })
}