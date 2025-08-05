import React, { useEffect, useMemo, useState } from "react";
import { Container, Form, Row, Col } from 'react-bootstrap'
import GoogleTTS from "./GoogleCloudTTS/GoogleTTS";
import ChatGPTTTS from './ChatGPTTTS/ChatGPTTTS'
import { postData } from "../../context/utilities";
import toast from '../../context/Notify';



export default function Integrations() {
    const [currentTTSServic, setCurrentTTSServic] = useState('google_cloud_tts')

    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    const [chatGPTAPIData, setChatGPTAPIData] = useState({
        chatgpt_tts_api_key: '',
        currentTTSServic: currentTTSServic
    })

    const [shouldCheckChatGPT, setShouldCheckChatGPT] = useState(false)
    const handleClick = (e) => {
        setCurrentTTSServic(e.target.id)
    }
    const getCurrentTTSService = (ttsService) => {
        setCurrentTTSServic(ttsService)
    }

    const getShouldCheckChatGPT = (val) => {
        setShouldCheckChatGPT(val)
    }

    useEffect(() => {
        // console.log({ttsObjPro})
        if ((ttsObj.is_pro_active && currentTTSServic === 'chat_gpt_tts') || shouldCheckChatGPT) {
            let data = new FormData();
            data.append('method', 'get');
            postData(apiURL + 'chat_gpt_tts', data)
                .then((res) => {
                    setChatGPTAPIData(res.data)
                    if (res.data?.currentTTSServic === 'chat_gpt_tts' && res?.data?.chatgpt_tts_api_key) {
                        getCurrentTTSService(res.data.currentTTSServic)
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [currentTTSServic, shouldCheckChatGPT])


    return <>
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    <div className={'text-danger'}>
                        <strong>Important Notice:</strong> <p className='text-danger d-inline'>Integrating with Google
                            Cloud Text To Speech/ChatGPT is an optional function for AtlasVoice Pro version. Without
                            integration you can still use our pro version.</p>
                    </div>
                    <Form className="py-4">
                        <Form.Group>
                            <Form.Label>
                                Select Text To Speech Service
                            </Form.Label>
                            <Form.Check
                                inline
                                label="Google Cloud TTS"
                                title="Google Cloud TTS"
                                name="group1"
                                type={'radio'}
                                className="mt-2"
                                checked={currentTTSServic === 'google_cloud_tts'}
                                id={`google_cloud_tts`}
                                onClick={handleClick}
                            />
                            <Form.Check
                                inline
                                label="ChatGPT TTS"
                                title="ChatGPT TTS"
                                name="group1"
                                type={'radio'}
                                checked={currentTTSServic === 'chat_gpt_tts'}
                                id={`chat_gpt_tts`}
                                onClick={handleClick}
                            />
                        </Form.Group>
                    </Form>
                </Col>
            </Row>
        </Container>
        {
            currentTTSServic !== 'chat_gpt_tts' ?
                <GoogleTTS currentTTSServic={currentTTSServic} getShouldCheckChatGPT={getShouldCheckChatGPT} /> :
                <ChatGPTTTS setChatGPTAPIData={setChatGPTAPIData} chatGPTAPIData={chatGPTAPIData}
                    currentTTSServic={currentTTSServic} />
        }
    </>
}