import React, { useEffect, useState } from "react";

//TODO : Need to apply onClick function to all icons and dynamic  custom class on demand
import { Close, Play, Replay, Settings, SoundWave, Speed, VoiceOver, Pause } from "../assets/icons/TTSIcons";

let speech = null
let TextToSpeechPro = null;
const TextToSpeech = ({ buttonId, button, cssStyle = '' }) => {
    const [isFirstPlayerPlay, setFirstPlayerPlay] = useState(true);
    const [isSecondPlayerPlay, setSecondPlayerPlay] = useState(false);
    const [isSettingOpen, setSettingOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSelectSpeed, setIsSelectedSpeed] = useState(false);
    const [isSelectVoice, setIsSelectedVoice] = useState(false);
    const [listenStatus, setListenStatus] = useState('listen')

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
        console.log(speech.listenStatus)
        setListenStatus(speech.listenStatus)
    }

    // TODO modiy TextToSpeech functionality by action and filter hook
    // TODO apply google text to speech for pro version.
    const handlePlayButtonClick = (e) => {
        e.preventDefault()

        let contents = window.TTS.contents;
        TextToSpeechPro = window.TextToSpeechPro;
        if (speech != null && speech.listenStatus == 'listen') {
            speech = null
            setListenStatus('listen')
        }

        if (speech === null) {
            speech = new TextToSpeechPro(buttonId, contents[buttonId], button, window.TTS)
            speech._init(callBackAfterEnd)
            setFirstPlayerPlay(false);
            setSecondPlayerPlay(true);
            setTimeout(() => {
                speech = speech.getData()
                setListenStatus(speech.listenStatus)
                console.log(speech.listenStatus)
            }, 100)
        } else {

            speech = speech.getData()
            setListenStatus(speech.listenStatus)
            if (speech.listenStatus == 'pause') {
                speech.pause(speech.speech)
                setIsPlaying(!isPlaying);
                setTimeout(() => {
                    setListenStatus(speech.listenStatus)
                }, 100)
            } else if (speech.listenStatus == 'resume') {
                speech.resume(speech.speech)
                setTimeout(() => {
                    setListenStatus(speech.listenStatus)
                }, 100)
            }
        }

    }
    return (
        <>

            <style>{cssStyle}</style>
            <div className="bg-white" >

                {/* First player */}
                {/* {isFirstPlayerPlay && ( */}
                <div className="player border shadow-custom bg-white mx-auto d-flex justify-content-between px-3 align-items-center position-relative">
                    {
                        !isSettingOpen && <div
                            className={`d-flex gap-3 justify-content-between align-items-center
                        }`}
                            style={{ height: "55px" }}
                        >

                            <div className="position-relative">
                                {
                                    (!speech || listenStatus === 'resume') && <Play onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'listen' && <Replay onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'pause' &&
                                    // <FaRegPauseCircle
                                    //     className="fs-3"
                                    //     onClick={handlePlayButtonClick}
                                    // />
                                    <Pause onClick={(e) => handlePlayButtonClick(e)} />
                                }

                                {/* {isPlaying && (
                            <div
                                className="position-absolute top-0 start-0 translate-middle spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        )} */}
                            </div>
                            {
                                listenStatus === 'listen' ? (
                                    <div className="mt-3">
                                        <p>
                                            Listen to article
                                            <span className="text-secondary"> 8 minutes</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="d-flex gap-3 justify-content-between align-items-center">
                                        <div className="audio-player">
                                            <div className="audio-controls">
                                                <div className="audio-time-start">0:00</div>
                                                <div
                                                    style={{ height: "4px", marginTop: "10px" }}
                                                    className="progress audio-progress"
                                                    role="progressbar"
                                                    aria-label="Success example"
                                                    aria-valuenow={0}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div
                                                        className="progress-bar bg-black"
                                                        style={{ width: "25%", height: "4px" }}
                                                    />
                                                </div>
                                                <div className="audio-time-end">3:45</div>
                                            </div>
                                            <div className="audio-volume"></div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    }
                    {isSettingOpen ? (
                        <>
                            <div className="d-flex gap-3 justify-content-between align-items-center" style={{ height: "55px" }} >
                                <div className="audio-player">
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
                    ) : listenStatus !== 'listen' ? (
                        <>
                            <div className="ps-2">
                                {listenStatus != 'listen' && !isSettingOpen && (
                                    <div className="border rounded-pill px-2">
                                        <Settings onClick={(e) => handleSetting(e)} />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : <SoundWave />
                    }
                </div>
            </div>
        </>
    );
};

export default TextToSpeech;