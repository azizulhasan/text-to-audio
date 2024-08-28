import React, {useEffect, useMemo, useState} from 'react';
import {Button, Col, Form, OverlayTrigger, Row, Tooltip} from 'react-bootstrap';
import { __ } from '@wordpress/i18n'
import {
    areAllKeysNumeric,
    getData,
    getLocalStorage,
    gttsSupportedLanguages,
    setLocalStorage
} from "../../components/context/utilities";

export default function TTSCustomizationButton({ demoSettings, handleChange, buttonLists }) {
    const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
    const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);
    const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);
    const apiURL = useMemo(() => {
        if (window.hasOwnProperty('ttsObj') && ttsObj.is_pro_active) {
            return ttsObj.api_url + ttsObj.api_namespace + "_pro/" + ttsObj.api_version + "/";
        }

        return ttsObj.api_url + ttsObj.api_namespace + "/" + ttsObj.api_version + "/";
    })
    const setVoicesAndLanguages = (voices = [], langs = [],) => {

        if (Array.isArray(voices) && voices.length) {
            setCurrentPlayerVoices(voices)
            setSpeechSynthesisVoices(voices)
        }
        if (Array.isArray(langs) && langs.length) {
            if (areAllKeysNumeric(langs)) {
                let newLangs = {};
                for (let lang of langs) {
                    newLangs[lang] = lang;
                }
                setCurrentPlayerLanguages(newLangs)

            } else {
                setCurrentPlayerLanguages(langs)
            }

        }

        if (Array.isArray(langs) && Array.isArray(voices) && voices.length) return;

        let timer = setTimeout(function handleTime() {
            timer = setTimeout(handleTime, 1000)

            if (timer > 65 || demoSettings == undefined) {
                clearTimeout(timer)
                timer = null;
            }
            if (window.hasOwnProperty('speechSynthesis') && window.speechSynthesis.getVoices().length && demoSettings?.id < 3) {
                clearTimeout(timer)
                timer = null
                setSpeechSynthesisVoices(window.speechSynthesis.getVoices())
                let newLangs = {};
                window.speechSynthesis.getVoices().map(item => {
                    if (!langs.includes(item.lang)) {
                        langs[item.lang] = item.lang;
                    }
                })
                setCurrentPlayerLanguages(langs)
                setCurrentPlayerVoices(window.speechSynthesis.getVoices())
            }
        })
    }


    useEffect(() => {
        if (window.hasOwnProperty('ttsObjPro') && ttsObjPro?.is_pro_active) {
            if (demoSettings?.id == 3) {
                let gttsLanguages = gttsSupportedLanguages();
                setCurrentPlayerLanguages(gttsLanguages)
            } else if (demoSettings?.id == 4) {
                setGoogleVoicesAndLanguages();
            }else{
                setVoicesAndLanguages()
            }

        }


    }, [demoSettings])

    const setGoogleVoicesAndLanguages = () => {
        let stored_voices = getLocalStorage(['tta__voices']);
        if (!stored_voices?.tta__voices) {
            getData(apiURL + 'voices')
                .then((res) => {
                    if (res?.voices?.length) {
                        setLocalStorage({tta__voices: res.voices})
                    } else {
                        setVoicesAndLanguages()
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            let voices = JSON.parse(stored_voices.tta__voices);
            let langs = []
            let langs2 = []

            if (voices?.voices) {
                voices = voices.voices;
            }

            voices.map(voice => {
                if (!langs.includes(voice.languageCodes[0])) {
                    langs.push(voice.languageCodes[0])
                    langs2[voice.languageCodes[0]] = voice.languageCodes[0];
                }
            })

            setVoicesAndLanguages(voices, langs)
        }
    }



    return (
        <>
            <Form.Group>
                <Form.Label htmlFor='id'>
                    {__('Select Player')}
                </Form.Label>
                <Form.Select
                    onChange={handleChange}
                    name='id'
                    id='id'
                    value={demoSettings?.id || 1}
                    aria-label='Select Player'>
                    <option disabled>
                        {__('Select Player')}
                    </option>
                    {buttonLists.map((button, index) => {
                        return (
                            <option disabled={button.disabled} key={button.id} value={button.id}>
                                {button.name}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>

            <Form.Group>
                <Form.Label htmlFor='tta__listening_lang'>Voice Language</Form.Label>
                <Form.Select
                    onChange={handleChange}
                    name='tta__listening_lang'
                    id='tta__listening_lang'
                    value={demoSettings.tta__listening_lang}
                    aria-label='Default select example'>
                    <option disabled>
                        {' '}
                        Default Listening Language
                    </option>
                    {Object.keys(currentPlayerLanguages).map((langKey, index) => {
                        return (
                            <option key={langKey}
                                    value={demoSettings?.id < 3 ? currentPlayerLanguages[langKey] : langKey}>
                                {currentPlayerLanguages[langKey]}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>

            {
                demoSettings?.id != 3 && <>
                    <Form.Group>
                        <Form.Label htmlFor='tta__listening_voice'>Voice to speak </Form.Label>
                        <Form.Select
                            onChange={handleChange}
                            name='tta__listening_voice'
                            id='tta__listening_voice'
                            value={demoSettings.tta__listening_voice}
                            aria-label='Default select example'>
                            <option disabled>
                                {' '}
                                Default Listening Voice
                            </option>
                            {currentPlayerVoices.map((voice, index) => window.hasOwnProperty('ttsObjPro') && demoSettings?.id == 4 ?
                                <option key={index} data-lang={voice?.languageCodes?.[0]}
                                        value={[voice.name, voice.ssmlGender].join('-')}>
                                    {voice.name} {'-'} {voice.ssmlGender}
                                </option> : <option key={index} data-lang={voice.lang} value={voice.name}>
                                    {voice.name}
                                </option>
                            )}
                        </Form.Select>
                    </Form.Group>
                </>
            }

            {/*{*/}
            {/*    demoSettings?.id == 3 && <Form.Group>*/}
            {/*        <Form.Label htmlFor='language'>*/}
            {/*            {__('Select Language')}*/}
            {/*        </Form.Label>*/}
            {/*        <Form.Select*/}
            {/*            onChange={handleChange}*/}
            {/*            name='language'*/}
            {/*            id='language'*/}
            {/*            value={demoSettings?.language || 'en-us'}*/}
            {/*            aria-label='Select Language'>*/}
            {/*            <option disabled>*/}
            {/*                {__('Select Language')}*/}
            {/*            </option>*/}
            {/*            {Object.keys(gttsLanguages).map((langKey, index) => {*/}
            {/*                return (*/}
            {/*                    <option key={langKey} value={langKey}>*/}
            {/*                        {gttsLanguages[langKey]}*/}
            {/*                    </option>*/}
            {/*                );*/}
            {/*            })}*/}
            {/*        </Form.Select>*/}
            {/*    </Form.Group>*/}
            {/*}*/}
        </>
    )
}