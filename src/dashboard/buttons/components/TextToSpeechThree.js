import {useEffect, useState} from "react";
import {shouldCallPositionFunction} from "../assets/buttonsHelper";

let TextToSpeechProPlayer = null;
let player = window?.wp ? wp.hooks.applyFilters('ttsProPlayerDesign', {
    isPlayerCustomizing: false,
    displayLabels: false
}) : {
    isPlayerCustomizing: false,
    displayLabels: false,
}
export default function TextToSpeechThree({buttonId, button, buttonCSS, cssStyle = ''}) {
    const [shouldFloat, setShouldFloat] = useState(false)
    const [buttonPosition, setButtonPosition] = useState(null)
    useEffect(() => {
        // TODO: after reload while I have in customization menu. the player is getting hide.
        if (window.TextToSpeechProPlayer) {
            let contents = window?.TTS?.contents;
            TextToSpeechProPlayer = window.TextToSpeechProPlayer;
            if (contents) {
                new TextToSpeechProPlayer(buttonId, contents[buttonId], button, window.TTS)
            }
        }
    }, [window.TextToSpeechProPlayer, window?.TTS?.contents])


    useEffect(() => {
        if (!window?.ttsObj?.settings?.settings?.tta__settings_stop_floating_button) {
            const detectScroll = (e) => {
                let button = document.getElementById('player_content_' + buttonId);
                let postTitle = null;
                let titlePosition = 0;
                // TODO:: get rid of this title position.
                if (document.querySelector('.post-title')) {
                    postTitle = document.querySelector('.post-title')
                    if (shouldCallPositionFunction(postTitle)) {
                        titlePosition = postTitle.getBoundingClientRect().top;
                    }
                } else if (document.querySelector('.entry-title')) {
                    postTitle = document.querySelector('.entry-title')
                    if (shouldCallPositionFunction(postTitle)) {
                        titlePosition = postTitle.getBoundingClientRect().top;
                    }
                } else if (document.querySelector('.wp-block-post-title')) {
                    postTitle = document.querySelector('.wp-block-post-title')
                    if (shouldCallPositionFunction(postTitle)) {
                        titlePosition = postTitle.getBoundingClientRect().top;
                    }
                } else if (document.querySelector('h1.elementor-heading-title')) {
                    postTitle = document.querySelector('h1.elementor-heading-title')
                    if (shouldCallPositionFunction(postTitle)) {
                        titlePosition = postTitle.getBoundingClientRect().top;
                    }
                }

                if (button) {
                    if (shouldCallPositionFunction(button)) {
                        let topPos = Math.floor(button.getBoundingClientRect().top);
                        if (topPos < 1 ) {
                            setShouldFloat(true)
                        }
                        // topPos
                        if (titlePosition > 0 ) {
                            setShouldFloat(false)
                        }
                    }
                }
            }
            document.addEventListener('scroll', detectScroll, {passive: true})
            document.addEventListener('wheel', detectScroll, {passive: true})


            return () => {
                document.removeEventListener('scroll', detectScroll, {passive: true})
                document.removeEventListener('wheel', detectScroll, {passive: true})
            }
        }

    }, [])
    const getButtonHTML = () => {
        return <div className="player_content" id={"player_content_" + buttonId}></div>;
    }

    return (
        <>
            {
                buttonCSS && <style>
                    {
                        `.player_content {
                            border-radius: 2px;
                            overflow: visible !important;
                        }
                        .plyr--audio {
                            z-index: 99999;
                        }
                        .plyr--audio .plyr__controls{background-color:${buttonCSS.backgroundColor};margin-top:${buttonCSS.marginTop}px;margin-bottom:${buttonCSS.marginBottom}px;margin-right:${buttonCSS.marginRight}px;margin-left:${buttonCSS.marginLeft}%;color:${buttonCSS.color};width:${buttonCSS.width}%;${player?.isPlayerCustomizing ? `display:inline-flex;` : ''}}
                        .plyr--audio .plyr__control.plyr__tab-focus, .plyr--audio .plyr__control, .plyr--audio .plyr__control:hover, .plyr--audio .plyr__control[aria-expanded=true]{background-color:${buttonCSS.backgroundColor};color:${buttonCSS.color};${player?.isPlayerCustomizing ? `display:inline-flex;align-items:center;` : ''}}
                        .plyr--full-ui input[type=range], .plyr__volume input[type=range] {color:${buttonCSS.color}${player?.isPlayerCustomizing ? `display:inline-flex;` : ''}}
                        .plyr--audio .plyr__progress .plyr__progress__buffer {background:${buttonCSS.color}}

                        ${player?.isPlayerCustomizing ? `.plyr__control svg{margin-right:5px;}` : ''}
                        `
                    }

                    {
                        buttonCSS?.custom_css && buttonCSS?.custom_css
                    }
                </style>
            }
            {
                shouldFloat ? <div className="tts__custom-position">{getButtonHTML()}</div> : getButtonHTML()
            }
        </>
    )
}
