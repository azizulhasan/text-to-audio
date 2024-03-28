import React from "react";

export default function Replay({ onClick , ttsObjPro }) {
    if(ttsObjPro?.player_customizations?.[2]?.replay) {
        const parser = new DOMParser();
        // convert html string into DOM
        let document = parser.parseFromString(ttsObjPro?.player_customizations?.[2]?.replay, "image/svg+xml");
        let svgImage = <div className="tts__position-relative" onClick={onClick} dangerouslySetInnerHTML={{__html: document.documentElement.outerHTML}}></div>;
        return svgImage;

    }
    return <div className="tts__position-relative">
        <svg onClick={onClick} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
             className="fs-3 cursor-pointer" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <g fill="none">
                <path d="M0 0h24v24H0z"></path>
                <path d="M0 0h24v24H0z"></path>
                <path d="M0 0h24v24H0z"></path>
            </g>
            <path
                d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path>
        </svg></div>;
        }
