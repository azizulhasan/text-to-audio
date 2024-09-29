import React, { useEffect, useState, useMemo } from 'react';
import { Form, Row, Col, Container } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';
import UpgradeToPro from '../../../UpgradeToPro';

export default function ChatGPTTTS({ chatGPTAPIData, currentTTSServic, setChatGPTAPIData }) {

    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        setChatGPTAPIData({ ...chatGPTAPIData, ...{ [e.target.name]: e.target.value } });
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!window.hasOwnProperty('ttsObjPro')) {
            toast(<>
                <h4>ChatGPT TTS feature is only in pro version.</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/')
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
            toast('Please Activate the Text To Speech Pro license to enjoy full features of the plugin.');
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', { autoClose: 10000 })
            return
        };

        /**
         * Get full form data and modify them for saving to database.
         */
        let form = new FormData(e.target);

        let formData = {};
        for (let [key, value] of form.entries()) {
            // if (key === '' || value === '') {
            //     toast('Please fill the  field : ' + key);
            //     return;
            // }
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
                    toast('API key is saveed successfully');
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
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    <Form onSubmit={handleSubmit}>
                        <Row className='border '>
                            <Col xs={12} sm={12} lg={12} className=''>
                                <Form.Group>
                                    <Form.Label htmlFor='chatgpt_tts_api_key'>
                                        Paste here ChatGPT TTS API key. How to get? Click <a target='_blank' href='https://platform.openai.com/api-keys'>here</a>.
                                    </Form.Label>
                                    <Form.Control
                                        type='password'
                                        id='chatgpt_tts_api_key'
                                        onChange={handleChange}
                                        value={chatGPTAPIData.chatgpt_tts_api_key}
                                        name='chatgpt_tts_api_key'
                                        placeholder='chatgpt_tts_api_key'
                                    />

                                </Form.Group>
                            </Col>
                            <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn btn-center'>
                                    Submit
                                </button>
                            </div>
                        </Row>
                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro />
                </Col>
            </Row >
        </Container>
    );
}
