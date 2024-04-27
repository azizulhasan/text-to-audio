import { useEffect, useState } from "react";
import { shouldCallPositionFunction } from "../assets/buttonsHelper";
let TextToSpeechProPlayer = null;
export default function TextToSpeechThree({ buttonId, button, buttonCSS, cssStyle = '' }) {
    const [shouldFloat, setShouldFloat] = useState(false)
    useEffect(() => {
        // TODO: after reload while I have in customization menu. the player is getting hide.
        if (window.TextToSpeechProPlayer) {
            let contents = window?.TTS?.contents;
            TextToSpeechProPlayer = window.TextToSpeechProPlayer;
            if(contents){
                new TextToSpeechProPlayer(buttonId, contents[buttonId], button, window.TTS)
            }
        }
    }, [window.TextToSpeechProPlayer, window?.TTS?.contents])


    useEffect(() => {
        const detectScroll = (e) => {
            let button = document.getElementById('player_content_' + buttonId);
            let postTitle = null;
            let titlePosition = 0;
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
            }

            if (button) {
                if (shouldCallPositionFunction(button)) {
                    let topPos = Math.floor(button.getBoundingClientRect().top);
                    if (topPos < 1) {
                        setShouldFloat(true)
                    }
                }

                if (titlePosition > 0) {
                    setShouldFloat(false)
                }
            }
        }
        document.addEventListener('scroll', detectScroll, { passive: true })
        document.addEventListener('wheel', detectScroll, { passive: true })


        return () => {
            document.removeEventListener('scroll', detectScroll, { passive: true })
            document.removeEventListener('wheel', detectScroll, { passive: true })
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
                        .plyr--audio .plyr__controls{background-color:${buttonCSS.backgroundColor};color:${buttonCSS.color};width:${buttonCSS.width}%;}
                        .plyr--audio .plyr__control.plyr__tab-focus, .plyr--audio .plyr__control:hover, .plyr--audio .plyr__control[aria-expanded=true]{background-color:${buttonCSS.backgroundColor};color:${buttonCSS.color};}
                        .plyr--full-ui input[type=range], .plyr__volume input[type=range] {color:${buttonCSS.color};}
                        `
                    }
                    {
                        buttonCSS?.custom_css && buttonCSS?.custom_css
                    }
                </style>
            }
            {
                shouldFloat ? <div className="tts__custom-position" >{getButtonHTML()}</div> : getButtonHTML()
            }
        </>
    )
}
