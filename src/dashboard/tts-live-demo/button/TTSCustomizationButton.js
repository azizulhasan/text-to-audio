import React, { useState } from 'react';
import {Button, Col, Form, OverlayTrigger, Row, Tooltip} from 'react-bootstrap';
import { __ } from '@wordpress/i18n'

export default function TTSCustomizationButton({ demoSettings, handleChange, buttonLists }) {
    let gttsLanguages = {
        "af": "Afrikaans",
        "sq": "Albanian",
        "ar": "Arabic",
        "hy": "Armenian",
        "ca": "Catalan",
        "zh": "Chinese",
        "zh-cn": "Chinese (Mandarin/China)",
        "zh-tw": "Chinese (Mandarin/Taiwan)",
        "zh-yue": "Chinese (Cantonese)",
        "hr": "Croatian",
        "cs": "Czech",
        "da": "Danish",
        "nl": "Dutch",
        "en": "English",
        "en-au": "English (Australia)",
        "en-uk": "English (United Kingdom)",
        "en-us": "English (United States)",
        "eo": "Esperanto",
        "fi": "Finnish",
        "fr": "French",
        "de": "German",
        "el": "Greek",
        "ht": "Haitian Creole",
        "hi": "Hindi",
        "hu": "Hungarian",
        "is": "Icelandic",
        "id": "Indonesian",
        "it": "Italian",
        "ja": "Japanese",
        "ko": "Korean",
        "la": "Latin",
        "lv": "Latvian",
        "mk": "Macedonian",
        "no": "Norwegian",
        "pl": "Polish",
        "pt": "Portuguese",
        "pt-br": "Portuguese (Brazil)",
        "ro": "Romanian",
        "ru": "Russian",
        "sr": "Serbian",
        "sk": "Slovak",
        "es": "Spanish",
        "es-es": "Spanish (Spain)",
        "es-us": "Spanish (United States)",
        "sw": "Swahili",
        "sv": "Swedish",
        "ta": "Tamil",
        "th": "Thai",
        "tr": "Turkish",
        "vi": "Vietnamese",
        "cy": "Welsh"
    }
    const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
    const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);



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
                    value={demoSettings?.buttonSettings?.id || 1}
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
                                    value={demoSettings?.buttonSettings?.id < 3 ? currentPlayerLanguages[langKey] : langKey}>
                                {currentPlayerLanguages[langKey]}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>

            {
                demoSettings?.buttonSettings?.id != 3 && <>
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
                            {currentPlayerVoices.map((voice, index) => window.hasOwnProperty('ttsObjPro') && demoSettings?.buttonSettings?.id == 4 ?
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
            {/*    demoSettings?.buttonSettings?.id == 3 && <Form.Group>*/}
            {/*        <Form.Label htmlFor='language'>*/}
            {/*            {__('Select Language')}*/}
            {/*        </Form.Label>*/}
            {/*        <Form.Select*/}
            {/*            onChange={handleChange}*/}
            {/*            name='language'*/}
            {/*            id='language'*/}
            {/*            value={demoSettings?.buttonSettings?.language || 'en-us'}*/}
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