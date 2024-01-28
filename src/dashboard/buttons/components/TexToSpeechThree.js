import { useEffect, useState } from "react";
let TextToSpeechProPlayer = null;
export default function TexToSpeechThree({ buttonId, button, buttonCSS, cssStyle = '' }) {
    const [shouldFloat, setShouldFloat] = useState(false)
    useEffect(() => {
        if (window.TextToSpeechProPlayer) {
            let contents = window.TTS.contents;
            TextToSpeechProPlayer = window.TextToSpeechProPlayer;
            new TextToSpeechProPlayer(buttonId, contents[buttonId], button, window.TTS)
        }
    }, [window.TextToSpeechProPlayer])

    useEffect(() => {
        const detectScroll = (e) => {
            let button = document.getElementById('player_content_' + buttonId);
            let postTitle = null;
            let titlePosition = 0;
            if (document.querySelector('.post-title')) {
                postTitle = document.querySelector('.post-title')
                titlePosition = postTitle.getBoundingClientRect().top;
            } else if (document.querySelector('.entry-title')) {
                postTitle = document.querySelector('.entry-title')
                titlePosition = postTitle.getBoundingClientRect().top;
            }

            let topPos = Math.floor(button.getBoundingClientRect().top);
            if (topPos < 1) {
                setShouldFloat(true)
            }

            if (titlePosition > 0) {
                setShouldFloat(false)
            }

        }


        // Test via a getter in the options object to see if the passive property is accessed
        let supportsPassive = false;
        try {
            let opts = Object.defineProperty({}, 'passive', {
                get: function () {
                    supportsPassive = true;
                }
            });
            window.addEventListener("testPassive", null, opts);
            window.removeEventListener("testPassive", null, opts);
        } catch (e) { }

        document.addEventListener('scroll', detectScroll, supportsPassive ? { passive: true } : false)
        document.addEventListener('wheel', detectScroll, supportsPassive ? { passive: true } : false)
        document.addEventListener('touchstart', detectScroll, supportsPassive ? { passive: true } : false)

        return () => {
            document.removeEventListener('scroll', detectScroll, supportsPassive ? { passive: true } : false)
            document.removeEventListener('wheel', detectScroll, supportsPassive ? { passive: true } : false)
            document.removeEventListener('touchstart', detectScroll, supportsPassive ? { passive: true } : false)

        }
    }, [])



    const getButtonHTML = () => {
        return <div className="player_content" style={shouldFloat ? {} : {
            border: '1px solid rgb(61, 61, 61)',
            borderRadius: '2px',
            overflow: 'visible !important',
        }} id={"player_content_" + buttonId}></div>;
    }

    return (
        <>
            {
                buttonCSS?.custom_css && <style>{buttonCSS?.custom_css}</style>
            }
            {
                shouldFloat ? <div className="tts__custom-position" style={{
                    border: '1px solid rgb(61, 61, 61)',
                    borderRadius: '2px',
                    overflow: 'visible !important'
                }} >{getButtonHTML()}</div> : getButtonHTML()
            }
        </>
    )
}
