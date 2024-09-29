import React, { useEffect, useState } from "react";

//TODO : Need to apply onClick function to all icons and dynamic  custom class on demand
import { Close, Play, Replay, Settings, SoundWave, Speed, VoiceOver, Pause } from "../assets/icons/TTSIcons";
import { shouldCallPositionFunction } from "../assets/buttonsHelper";

let speech = null
let TextToSpeechPro = null;
const TextToSpeech = ({ buttonId, button, cssStyle = '', buttonCSS = {}, buttonLiveCSS = {} }) => {
    const [isFirstPlayerPlay, setFirstPlayerPlay] = useState(true);
    const [isSecondPlayerPlay, setSecondPlayerPlay] = useState(false);
    const [isSettingOpen, setSettingOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSelectSpeed, setIsSelectedSpeed] = useState(false);
    const [isSelectVoice, setIsSelectedVoice] = useState(false);
    const [listenStatus, setListenStatus] = useState('listen')
    const [decreamentInterval, setDecreamentInterval] = useState(null)
    const [increamentInterval, setInreamentInterval] = useState(null)
    const [increamentDeadline, setIncreamentDeadline] = useState(0)
    const [increamentedTime, setIncreamentedTime] = useState(0)
    const [decreamentDeadline, setDecreamentDeadline] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isResumed, setIsResumed] = useState(false)
    const [progressbarValue, setProgressbarValue] = useState(0)
    const [shouldFloat, setShouldFloat] = useState(false)


    const handleSetting = (e) => {
        e.preventDefault()
        setSettingOpen(!isSettingOpen);
    };

    const handleChangeSpeed = () => {
        setIsSelectedSpeed(!isSelectSpeed);
        setIsSelectedVoice(false); // Hide the voice button
    };

    const handleChangeVoice = () => {
        setIsSelectedVoice(!isSelectVoice);
        setIsSelectedSpeed(false); // Hide the speed button
    };


    /**
     * After reading text callback for redesing button
     */
    const callBackAfterEnd = () => {
        speech = speech.getData()
        setListenStatus(speech.listenStatus)
    }

    const pauseButton = (speech, finishIntentionally = false) => {
        speech.pause(speech.speech)
        if (finishIntentionally) {
            speech.finishedSpeaking(speech.speech, {}, finishIntentionally);
        }
        setIsPlaying(!isPlaying);
        clearInterval(decreamentInterval);
        clearInterval(increamentInterval);
        setTimeout(() => {
            setListenStatus(speech.listenStatus)
        }, 100)
    }

    const resumeButton = (speech) => {
        speech.resume(speech.speech)
        let deadline = new Date(Date.parse(new Date()) + decreamentDeadline);
        getDecreamentTime(deadline)
        getIncreamentTime(increamentDeadline, increamentedTime)
        setTimeout(() => {
            setListenStatus(speech.listenStatus)
        }, 100)
    }


    useEffect(() => {
        if (speech) {
            speech.onAValueChanged((newValue) => {
                if ('listen' === newValue) {
                    pauseButton(speech, true)
                    speech = null
                    setListenStatus(newValue)
                }
            });
        }
    }, [speech])

    // TODO modiy TextToSpeech functionality by action and filter hook
    // TODO apply google text to speech for pro version.
    const handlePlayButtonClick = (e) => {
        e.preventDefault()
        let contents = window.TTS.contents;
        // in the customization menu of dhashboard set initail text.
        if (document.getElementById('tta__demo_text_for_play')) {
            let text = document.getElementById('tta__demo_text_for_play').value;
            contents[buttonId] = text
        }
        TextToSpeechPro = window.TextToSpeechPro;
        if (speech != null && speech.listenStatus == 'listen') {
            speech = null
            setListenStatus('listen')
        }
        if (speech === null) {
            if (TextToSpeechPro?.TTS) {
                speech = new window.TextToSpeechPro2(buttonId, contents[buttonId], button, window.TTS)
            } else {
                speech = new TextToSpeechPro(buttonId, contents[buttonId], button, window.TTS)
            }


            speech._init(callBackAfterEnd)
            setFirstPlayerPlay(false);
            setSecondPlayerPlay(true);
            getIncreamentTime()
            getDecreamentTime()
            setTimeout(() => {
                speech = speech.getData()
                setListenStatus(speech.listenStatus)
            }, 100)
        } else {
            speech = speech.getData()
            setListenStatus(speech.listenStatus)
            if (speech.listenStatus == 'pause') {
                pauseButton(speech)
            } else if (speech.listenStatus == 'resume') {
                resumeButton(speech)
            }
        }

    }


    /**
     * 
     * @param {*} time 
     * @returns 
     */
    const getIncreamentTime = (increamentDeadline = null, increamentedTime = 0) => {
        // The data/time we want to countdown to
        let deadline;
        if (!increamentDeadline) {
            let readingTime = window?.TTS.settings?.readingTime
            deadline = 1000 * 60 * parseInt(readingTime);
            setIncreamentDeadline(deadline)

        } else {
            deadline = increamentDeadline
        }
        let t = increament_time_remaining(deadline)
        setIncreamentDeadline(t.total)

        let timer;
        let now = increamentedTime;
        let timeleft = 0;
        function updateIncreamentTime() {
            setIncreamentedTime(now)
            setProgressbarProgress(now)
            timeleft = now + 1000
            if (document.getElementById('audio_time_start')) {
                document.getElementById('audio_time_start').innerHTML = getFormattedTime(now).formatted;
                // Display the message when countdown is over
                if (timeleft > t.total) {
                    clearInterval(timer);
                    // TODO: match with settings if minute and second extension will be added.
                    document.getElementById('audio_time_start').innerHTML = '00:00'
                }
            } else {
                clearInterval(timer);
            }
            now = timeleft
        }
        updateIncreamentTime()
        // Run timer every second
        timer = setInterval(updateIncreamentTime, 1000);
        setInreamentInterval(timer)
    }

    const setProgressbarProgress = (now) => {
        let time = window?.TTS.settings?.readingTime
        let totalTime = 1000 * 60 * parseInt(time)
        if (now) {
            let progressbarPercent = getPercentage(now, totalTime)
            setProgressbarValue(progressbarPercent)
        }

    }

    const getPercentage = (x, y) => {
        return Math.floor((x / y) * 100);
    }

    /**
     * 
     * @param {*} endtime date string
     * @returns 
     */
    function increament_time_remaining(endtime, shouldCreate = false) {
        let t = 0;
        if (shouldCreate) {
            t = 1000 * 60 * parseInt(endtime);
        } else {
            t = endtime
        }

        return getFormattedTime(t);
    }

    /**
     * 
     * @param {*} time 
     * @returns 
     */
    const getDecreamentTime = (decreamentDeadline = null) => {

        // The data/time we want to countdown to
        let deadline;
        if (!decreamentDeadline) {
            let readingTime = window?.TTS.settings?.readingTime
            deadline = new Date().getTime() + (1000 * 60 * parseInt(readingTime));
            setDecreamentDeadline(deadline)
        } else {
            deadline = decreamentDeadline
        }

        let timer;
        function updateDecreamentTime() {
            // Calculating the days, hours, minutes and seconds left
            let t = decreament_time_remaining(deadline)
            // console.log(t)
            setDecreamentDeadline(t.total)
            if (document.getElementById('audio_time_end')) {
                document.getElementById('audio_time_end').innerHTML = t.formatted;
                // Display the message when countdown is over
                if (t.total <= 0) {
                    clearInterval(timer);
                    document.getElementById('audio_time_end').innerHTML = decreament_time_remaining(readingTime, false, true).formatted
                }
            } else {
                clearInterval(timer);
            }
        }

        updateDecreamentTime()
        // Run timer every second
        timer = setInterval(updateDecreamentTime, 1000);
        setDecreamentInterval(timer)

    }


    /**
     * 
     * @param {*} endtime date string
     * @returns 
     */
    function decreament_time_remaining(endtime, shouldParse = false, shouldCreate = false) {
        let t = 0;
        if (shouldCreate) {
            t = 1000 * 60 * parseInt(endtime);
        } else {
            if (shouldParse) {
                t = Date.parse(endtime) - Date.parse(new Date())
            } else {
                t = endtime - Date.parse(new Date())
            }
        }


        return getFormattedTime(t);
    }

    /**
     * 
     * @param {*} t 
     * @returns 
     */
    const getFormattedTime = (t) => {
        let seconds = Math.floor((t / 1000) % 60);
        let minutes = Math.floor((t / 1000 / 60) % 60);
        // TODO: match with settings if minute and second extension will be added.
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        let tObj = { 'total': t, 'minutes': minutes, 'seconds': seconds }
        tObj.formatted = tObj.minutes + ":" + tObj.seconds;

        return tObj;
    }

    const getButtonHTML = () => {
        return (
            <div id="tts_button_should_float">
                {/* First player */}
                {/* {isFirstPlayerPlay && ( */}
                <div className="tts__player tts__border tts__shadow-custom  tts__mx-auto tts__d-flex tts__justify-content-between tts__px-3 tts__align-items-center tts__position-relative">
                    {
                        !isSettingOpen && <div
                            className="tts__d-flex tts__gap-3 tts__justify-content-between tts__align-items-center"
                            style={{ height: "55px" }}
                        >

                                {
                                    (!speech || listenStatus === 'resume') && <Play ttsObjPro={ttsObjPro}  onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'listen' && <Replay ttsObjPro={ttsObjPro} onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'pause' && <Pause ttsObjPro={ttsObjPro} onClick={(e) => handlePlayButtonClick(e)} />
                                }

                                {/* {isPlaying && (
                                    <div
                                        className="position-absolute top-0 start-0 translate-middle spinner-border text-primary"
                                        role="status"
                                    >
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                )} */}
                            {
                                listenStatus === 'listen' && window.hasOwnProperty('TTS') && <div className="tts__align-items-center">
                                    <span>{window.TTS.settings.textArr.listen_text}</span>
                                </div>
                            }
                            {
                                listenStatus !== 'listen' && window.hasOwnProperty('TTS') && <div className="tts__d-flex tts__gap-3  tts__justify-content-between tts__align-items-center">
                                    <div className="tts__audio-player">
                                        <div className="tts__audio-controls">
                                            <div className="tts__audio-time-start" id="audio_time_start">00:00</div>
                                            <div
                                                className="tts__progress tts__audio-progress"
                                                role="progressbar"
                                                aria-label="Success example"
                                                aria-valuenow={0}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                style={{ height: '5px' }}
                                            >
                                                <div
                                                    className="tts__progress-bar"
                                                    style={{ backgroundColor: buttonCSS.color, height: '5px', width: `${progressbarValue}%` }}
                                                />
                                            </div>
                                            <div className="tts__audio-time-end" id="audio_time_end">00:00</div>
                                        </div>
                                        <div className="tts__audio-volume"></div>
                                    </div>
                                </div>
                            }

                        </div>

                    }
                    {/* {isSettingOpen ? (
                        <>
                            <div className="d-flex gap-3 justify-content-between align-items-center" style={{ height: "55px" }} >
                                <div className="tts__audio-player">
                                    {!isSelectSpeed && !isSelectVoice && (
                                        <div className="d-flex pl-3">
                                            <div onClick={handleChangeSpeed} className="custom-hover d-block">
                                                <div className="d-flex gap-2 border px-2 py-1 rounded-1">
                                                    <Speed onClick={(e) => handleChangeSpeed(e)} />
                                                    <span>Speed</span>
                                                </div>
                                            </div>
                                            <div onClick={handleChangeVoice} className="custom-hover d-block ms-3">
                                                <div className="d-flex gap-2 border px-2 py-1 rounded-1">
                                                    < VoiceOver onClick={(e) => handleChangeVoice(e)} />
                                                    <span>Voice</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {isSelectSpeed && (
                                        <div className="d-flex gap-2">
                                            <div className="d-block" onClick={handleChangeSpeed}>
                                                <div className="border-0">
                                                    <Speed onClick={(e) => handleChangeSpeed(e)} />
                                                </div>
                                            </div>
                                            <div className="d-block" style={{ width: '200px' }}>
                                                <select className="form-select">
                                                    <option value="slow">speed 0.8x</option>
                                                    <option value="normal">speed 1.0x</option>
                                                    <option value="fast">speed 1.2x</option>
                                                    <option value="more_fast">speed 1.5x</option>
                                                    <option value="very_fast">speed 2.0x</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {isSelectVoice && (
                                        <div className="d-flex gap-2">
                                            <div onClick={handleChangeVoice}>
                                                <div className="border-0 mt-1">
                                                    < VoiceOver onClick={(e) => handleChangeVoice(e)} />
                                                </div>
                                            </div>
                                            <div style={{ width: '200px' }}>
                                                <select className="form-select">
                                                    <option value="abir">Abir</option>
                                                    <option value="sami">Sami</option>
                                                    <option value="jami">Jami</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <div className="audio-volume"></div>
                                </div>
                            </div>
                            <Close onClick={(e) => handleSetting(e)} />
                        </>
                    ) : <SoundWave />} */}

                    {/**
                    //TODO implement this in the future to change voice and reading speed.
                       listenStatus !== 'listen' ? (
                        <>
                            <div className="ps-2">
                                {listenStatus != 'listen' && !isSettingOpen && (
                                    <div className="border rounded-pill px-2">
                                        <Settings onClick={(e) => handleSetting(e)} />
                                    </div>
                                )}
                            </div>
                        </>
                    ) 
                */}
                    <div className="tts__ps-3">
                        <SoundWave />
                    </div>
                </div>
            </div>
        )
    }


    useEffect(() => {
        if(!window?.ttsObj?.settings?.settings?.tta__settings_stop_floating_button) {
            const detectScroll = (e) => {
                let button = document.getElementById('tts_button_should_float');
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
        }


    }, [])

    return (
        <>
            {

                buttonCSS && <style>
                    {
                        `#tts_button_should_float{ background-color: ${buttonCSS?.backgroundColor};color:${buttonCSS.color};width:${buttonCSS.width}%;}
                        #tts_button_should_float div:nth-child(1){ color:${buttonCSS.color};}
                        .atlasvoice_player_button svg {cursor:pointer;}
                        `
                    }
                    {
                        buttonCSS?.custom_css && buttonCSS?.custom_css
                    }
                </style>
            }
            {
                shouldFloat ? <div className={'tts__custom-position_bottom_right'} >{getButtonHTML()}</div> : getButtonHTML()
            }
        </>
    );
};

export default TextToSpeech;