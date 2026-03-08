import React, { useMemo } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';
import { __ } from "@wordpress/i18n";

export default function ElevenLabsTTS({ elevenLabsAPIData, currentTTSServic, setElevenLabsAPIData, setAuthenticatedServices }) {
    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    const handleChange = (e) => {
        setElevenLabsAPIData({ ...elevenLabsAPIData, ...{ [e.target.name]: e.target.value } });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!window.hasOwnProperty('ttsObjPro')) {
            toast(<>
                <h4>{__("ElevenLabs TTS feature is only in pro version.", "text-to-audio")}</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    {__("Learn More", "text-to-audio")}
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_pro_license_active) {
            toast(<>
                <h4>{__("ElevenLabs text to speech feature is only in pro version.", "text-to-audio")}</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    {__("Buy Now", "text-to-audio")}
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable) {
            toast(__("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", "text-to-audio"), 'error', { autoClose: 10000 })
            return
        };

        let form = new FormData(e.target);
        let formData = {};
        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }
        formData['currentTTSServic'] = currentTTSServic;
        if (formData.currentTTSServic !== 'elevenlabs_tts') {
            formData.currentTTSServic = ''
        }

        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');

        postData(apiURL + 'elevenlabs_tts', data)
            .then((res) => {
                if (res.status) {
                    toast(__('API key is saved successfully', "text-to-audio"));
                    setElevenLabsAPIData(res.data);

                    // Update authenticated services if API key is valid
                    if (res.data?.elevenlabs_api_key && res.data?.currentTTSServic === 'elevenlabs_tts') {
                        setAuthenticatedServices(prev => {
                            if (prev.includes('elevenlabs_tts')) return prev;
                            return [...prev, 'elevenlabs_tts'];
                        });
                    }
                } else {
                    toast(__('Something went wrong', "text-to-audio"));
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <div className="bg-white rounded-3 p-4 shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h4 className="mb-0 fw-bold">{__("Set ElevenLabs API key", "text-to-audio")}</h4>
            </div>

            <Form onSubmit={handleSubmit}>
                {/* Input Group with Submit Button */}
                <InputGroup className="mb-3 gap-3">
                    <Form.Control
                        type="password"
                        id="elevenlabs_api_key"
                        onChange={handleChange}
                        value={elevenLabsAPIData.elevenlabs_api_key}
                        name="elevenlabs_api_key"
                        placeholder={__("paste here elevenlabs_api_key", 'text-to-audio')}
                        className="tta_gpt_input"
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        className="tta_gpt_btn"
                    >
                        {__("Submit", "text-to-audio")}
                    </Button>
                </InputGroup>

                {/* Help text */}
                <p className="text-muted mb-0">
                    {__("How to get ElevenLabs API key?", "text-to-audio")}{' '}
                    <a
                        href="https://elevenlabs.io/app/settings/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none"
                    >
                        {__("Click here", "text-to-audio")}
                    </a>
                </p>
            </Form>
        </div>
    );
}
