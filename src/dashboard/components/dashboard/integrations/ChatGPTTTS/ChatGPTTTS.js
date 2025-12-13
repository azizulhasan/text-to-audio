import React, { useMemo } from 'react';
import { Form, Button } from 'react-bootstrap';
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
        <>
            {/* Authentication Card */}
            <div className="tta-card mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0 fw-semibold">Authentication</h5>
                    <Button 
                        variant="link" 
                        className="text-danger p-0 text-decoration-none"
                        onClick={() => window.open('https://www.youtube.com/watch?v=6uGPboXW2Q8', '_blank')}
                    >
                        How it works? <i className="fab fa-youtube ms-1"></i>
                    </Button>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="setting-label text-dark">
                            Paste here ChatGPT API key. How to get? Click{' '}
                            <a 
                                href="https://platform.openai.com/api-keys" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                here
                            </a>
                            .
                        </Form.Label>
                        <Form.Control
                            type="password"
                            id="chatgpt_tts_api_key"
                            onChange={handleChange}
                            value={chatGPTAPIData.chatgpt_tts_api_key}
                            name="chatgpt_tts_api_key"
                            placeholder="Enter your ChatGPT API key"
                            className="tta-textarea"
                        />
                    </Form.Group>

                    <div className="text-center">
                        <Button variant="primary" type="submit" className="tta_btn rounded-3">
                            Submit
                        </Button>
                    </div>
                </Form>
            </div>
        </>
    );
}