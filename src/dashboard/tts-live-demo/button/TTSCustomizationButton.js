import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { __ } from '@wordpress/i18n'

export default function TTSCustomizationButton({ listeningBtnStyle, handleChange, buttonLists }) {
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
            {/* {
                listeningBtnStyle?.buttonSettings?.id == 3 && <Form.Group>
                    <Form.Label htmlFor='language'>
                        {__('Select Language')}
                    </Form.Label>
                    <Form.Select
                        onChange={handleChange}
                        name='language'
                        id='language'
                        value={listeningBtnStyle?.buttonSettings?.language || 'en-us'}
                        aria-label='Select Language'>
                        <option disabled>
                            {__('Select Language')}
                        </option>
                        {Object.keys(gttsLanguages).map((langKey, index) => {
                            return (
                                <option key={langKey} value={langKey}>
                                    {gttsLanguages[langKey]}
                                </option>
                            );
                        })}
                    </Form.Select>
                </Form.Group>
            } */}
        </>
    )
}