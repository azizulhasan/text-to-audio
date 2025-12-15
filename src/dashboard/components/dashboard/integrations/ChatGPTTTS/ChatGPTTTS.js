import React, { useMemo } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';

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
                <h4>ChatGPT TTS feature is only in pro version.</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    Learn More
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_pro_license_active) {
            toast(<>
                <h4>ChatGPT text to speech feature is only in pro version.</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    Buy Now
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', { autoClose: 10000 })
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
                    toast('API key is saved successfully');
                    setChatGPTAPIData(res.data)
                } else {
                    toast('Something went wrong');
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
                <h4 className="mb-0 fw-bold">Set ChatGPT API key</h4>
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
                        placeholder="paste here chatgpt_tts_api_key"
                        className="tta_gpt_input"
                    />
                    <Button 
                        variant="primary" 
                        type="submit"
                        className="tta_gpt_btn"
                    >
                        Submit
                    </Button>
                </InputGroup>

                {/* Help text */}
                <p className="text-muted mb-0">
                    How to get chatGPT API key?{' '}
                    <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none"
                    >
                        Click here
                    </a>
                </p>
            </Form>
        </div>
    );
}