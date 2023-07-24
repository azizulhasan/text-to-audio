import { useEffect, useState } from "react";
let TextToSpeechProPlayer = null;
export default function TexToSpeechThree({ buttonId, button, cssStyle = '' }) {
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
            let button = document.getElementById('player_content');
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
        document.addEventListener('scroll', detectScroll)
        document.addEventListener('wheel', detectScroll)

        return () => {
            document.removeEventListener('scroll', detectScroll)
            document.removeEventListener('wheel', detectScroll)
        }
    }, [])

    const getButtonHTML = () => {
        return <div style={shouldFloat ? {} : {
            border: '1px solid rgb(61, 61, 61)',
            borderRadius: '2px',
            overflow: 'visible !important'
        }} id="player_content"></div>;
    }

    return (
        <>
            {
                cssStyle && <style>{cssStyle}</style>
            }
            {
                shouldFloat ? <div className="custom-position" >{getButtonHTML()}</div> : getButtonHTML()
            }
        </>
    )
}
