import React, { useEffect, useState } from "react";
import { FaRegPauseCircle, FaRegPlayCircle } from "react-icons/fa";
import { BsSoundwave } from "react-icons/bs";
import { CiSettings } from "react-icons/ci";
import { IoCloseOutline, IoSpeedometerOutline } from "react-icons/io5";
import { MdOutlineRecordVoiceOver, MdOutlineReplay } from "react-icons/md";
// Load css
import '../assets/css/buttons.css'

let speech = null
let TextToSpeechClass = null;
const TextToSpeech = ({ buttonId, button }) => {
    const [isFirstPlayerPlay, setFirstPlayerPlay] = useState(true);
    const [isSecondPlayerPlay, setSecondPlayerPlay] = useState(false);
    const [isSettingOpen, setSettingOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSelectSpeed, setIsSelectedSpeed] = useState(false);
    const [isSelectVoice, setIsSelectedVoice] = useState(false);

    const handleSetting = () => {
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


    const callBackAfterEnd = () => {
        speech = speech.getData()
        console.log(speech.listenStatus)
    }

    // TODO need to create a TextToSpeechPro class on pro plugin
    // TODO modiy TextToSpeech functionality by action and filter hook
    // TODO apply google text to speech for pro version.



    const handlePlayButtonClick = (e) => {
        e.preventDefault()

        let contents = window.TTS.contents;
        TextToSpeechClass = window.TextToSpeech;
        if (speech != null && speech.listenStatus == 'listen') {
            speech = null
        }
        if (speech === null) {
            speech = new TextToSpeechClass(buttonId, contents[buttonId], button, window.TTS)
            speech._init(callBackAfterEnd)
            setFirstPlayerPlay(false);
            setSecondPlayerPlay(true);
        } else {

            speech = speech.getData()
            if (speech.listenStatus == 'pause') {
                speech.pause(speech.speech)
                setIsPlaying(!isPlaying);
                // setFirstPlayerPlay(true);
                // setSecondPlayerPlay(false);
            } else if (speech.listenStatus == 'resume') {
                speech.resume(speech.speech)
            }
        }
    }
    return (
        <div className="bg-white" >

            {/* First player */}
            {isFirstPlayerPlay && (
                <div className="player border shadow-custom bg-white mx-auto d-flex justify-content-between px-3 align-items-center position-relative">
                    <div
                        className={`d-flex gap-3 justify-content-between align-items-center ${isPlaying ? "spinner-border text-primary" : ""
                            }`}
                        style={{ height: "55px" }}
                    >

                        <div className="position-relative">
                            <FaRegPlayCircle
                                className="fs-3"
                                onClick={handlePlayButtonClick}
                            />
                            {/* <MdOutlineReplay /> */}
                            {isPlaying && (
                                <div
                                    className="position-absolute top-0 start-0 translate-middle spinner-border text-primary"
                                    role="status"
                                >
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-3">
                            <p>
                                Listen to article
                                <span className="text-secondary"> 8 minutes</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <BsSoundwave className="fs-3" />
                    </div>
                </div>
            )}

            {/* Second player */}
            {isSecondPlayerPlay && (
                <div className="player border shadow-custom bg-white mx-auto d-flex justify-content-between px-3 align-items-center position-relative">
                    <div
                        className="d-flex gap-3 justify-content-between align-items-center"
                        style={{ height: "55px" }}
                    >
                        {!isSettingOpen && (
                            <div>
                                {isPlaying ? (
                                    <FaRegPlayCircle
                                        className="fs-3"
                                        onClick={handlePlayButtonClick}
                                    />
                                ) : (
                                    <FaRegPauseCircle
                                        className="fs-3"
                                        onClick={handlePlayButtonClick}
                                    />
                                )}
                            </div>
                        )}
                        {isSettingOpen ? (
                            <div className="d-flex gap-3 justify-content-between align-items-center">
                                <div className="audio-player">
                                    {!isSelectSpeed && !isSelectVoice && (
                                        <div className="d-flex">
                                            <div style={{ width: '92px' }} onClick={handleChangeSpeed} className="custom-hover d-block">
                                                <div className="d-flex gap-2 border px-2 py-2 rounded-1">
                                                    <IoSpeedometerOutline className="fs-4" />
                                                    <span>Speed</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '85px', marginLeft: '12px' }} onClick={handleChangeVoice} className="custom-hover d-block">
                                                <div className="d-flex gap-2 border px-2 py-2 rounded-1">
                                                    <MdOutlineRecordVoiceOver className="fs-4" />
                                                    <span>Voice</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {isSelectSpeed && (
                                        <div className="d-flex gap-2">
                                            <div onClick={handleChangeSpeed}>
                                                <div className="border-0 mt-1">
                                                    <IoSpeedometerOutline className="fs-4" />
                                                </div>
                                            </div>
                                            <div style={{ width: '200px' }}>
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
                                                    <MdOutlineRecordVoiceOver className="fs-4" />
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
                        )}
                    </div>
                    <div className="ps-2">
                        {/* Setting icon */}
                        {!isSettingOpen ? (
                            <div className="border rounded-pill px-2 cursor-pointer">
                                <CiSettings onClick={handleSetting} className="fs-4" />
                            </div>
                        ) : (
                            <IoCloseOutline onClick={handleSetting} className="fs-4 mx-2" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextToSpeech;