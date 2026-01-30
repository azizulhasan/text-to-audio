import React, { useMemo } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';
import { __ } from "@wordpress/i18n";

export default function ChatGPTTTS({ chatGPTAPIData, currentTTSServic, setChatGPTAPIData, setAuthenticatedServices }) {
    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    const handleChange = (e) => {
        setChatGPTAPIData({ ...chatGPTAPIData, ...{ [e.target.name]: e.target.value } });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!window.hasOwnProperty('ttsObjPro')) {
            toast(<>
                <h4>{__("ChatGPT TTS feature is only in pro version.", "text-to-audio")}</h4>
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
                <h4>{__("ChatGPT text to speech feature is only in pro version.","text-to-audio")}</h4>
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
        if (formData.currentTTSServic !== 'chat_gpt_tts') {
            formData.currentTTSServic = ''
        }

        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');

        postData(apiURL + 'chat_gpt_tts', data)
            .then((res) => {
                if (res.status) {
                    toast(__('API key is saved successfully', "text-to-audio"));
                    setChatGPTAPIData(res.data);

                    // Update authenticated services if API key is valid
                    if (res.data?.chatgpt_tts_api_key && res.data?.currentTTSServic === 'chat_gpt_tts') {
                        setAuthenticatedServices(prev => {
                            if (prev.includes('chat_gpt_tts')) return prev;
                            return [...prev, 'chat_gpt_tts'];
                        });
                    }
                } else {
                    toast(__('Something went wrong',"text-to-audio"));
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <div className="bg-white rounded-3 p-4 shadow-sm">
            {/* Header with YouTube link */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h4 className="mb-0 fw-bold">{__("Set ChatGPT API key","text-to-audio")}</h4>
                <Button 
                    variant="link" 
                    className="text-danger p-0 text-decoration-none d-flex align-items-center"
                    onClick={() => window.open('https://www.youtube.com/watch?v=6uGPboXW2Q8', '_blank')}
                >
                    <i className="fab fa-youtube fs-4"></i>
                </Button>
            </div>

            <Form onSubmit={handleSubmit}>
                {/* Input Group with Submit Button */}
                <InputGroup className="mb-3 gap-3">
                    <Form.Control
                        type="password"
                        id="chatgpt_tts_api_key"
                        onChange={handleChange}
                        value={chatGPTAPIData.chatgpt_tts_api_key}
                        name="chatgpt_tts_api_key"
                        placeholder={__("paste here chatgpt_tts_api_key", 'text-to-audio')}
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
                    {__("How to get chatGPT API key?","text-to-audio")}{' '}
                    <a 
                        href="https://platform.openai.com/api-keys" 
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