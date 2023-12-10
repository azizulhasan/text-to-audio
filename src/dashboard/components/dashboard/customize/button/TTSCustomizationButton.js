import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { __ } from '@wordpress/i18n'

export default function TTSCustomizationButton({ listeningBtnStyle, handleChange, buttonLists }) {

    let voiceAccents = [
        'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D'
    ]
    const chatGPTTTSOptions = {
        models: {
            "tts-1": "Standard",
            "tts-1-hd": "HD",
        },
        voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
        outputFormat: ["mp3", "wav"],
        sampleRateHertzOptions: [24000, 16000, 48000],
        speeds: [0.5, 1.0, 1.5],
        pitchOptions: [-1, 0, 1],
        volumeGainDbOptions: [-3, 0, 3],
        languages: {
            "af-ZA": "Afrikaans",
            "ar-SA": "Arabic",
            "hy-AM": "Armenian",
            "az-AZ": "Azerbaijani",
            "be-BY": "Belarusian",
            "bs-BA": "Bosnian",
            "bg-BG": "Bulgarian",
            "ca-ES": "Catalan",
            "cmn-CN": "Chinese",
            "hr-HR": "Croatian",
            "cs-CZ": "Czech",
            "da-DK": "Danish",
            "nl-NL": "Dutch",
            "en-US": "English",
            "et-EE": "Estonian",
            "fi-FI": "Finnish",
            "fr-FR": "French",
            "gl-ES": "Galician",
            "de-DE": "German",
            "el-GR": "Greek",
            "he-IL": "Hebrew",
            "hi-IN": "Hindi",
            "hu-HU": "Hungarian",
            "is-IS": "Icelandic",
            "id-ID": "Indonesian",
            "it-IT": "Italian",
            "ja-JP": "Japanese",
            "kn-IN": "Kannada",
            "kk-KZ": "Kazakh",
            "ko-KR": "Korean",
            "lv-LV": "Latvian",
            "lt-LT": "Lithuanian",
            "mk-MK": "Macedonian",
            "ms-MY": "Malay",
            "mr-IN": "Marathi",
            "mi-NZ": "Maori",
            "ne-NP": "Nepali",
            "nb-NO": "Norwegian",
            "fa-IR": "Persian",
            "pl-PL": "Polish",
            "pt-PT": "Portuguese",
            "ro-RO": "Romanian",
            "ru-RU": "Russian",
            "sr-RS": "Serbian",
            "sk-SK": "Slovak",
            "sl-SI": "Slovenian",
            "es-ES": "Spanish",
            "sw-KE": "Swahili",
            "sv-SE": "Swedish",
            "tl-PH": "Tagalog",
            "ta-IN": "Tamil",
            "th-TH": "Thai",
            "tr-TR": "Turkish",
            "uk-UA": "Ukrainian",
            "ur-PK": "Urdu",
            "vi-VN": "Vietnamese",
            "cy-GB": "Welsh",
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
                    value={listeningBtnStyle?.buttonSettings?.id || 1}
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
        </>
    )
}