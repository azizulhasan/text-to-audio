import React, { useEffect, useMemo, useState } from "react";
import { Container, Form, Row, Col, Card } from 'react-bootstrap'
import GoogleTTS from "./GoogleCloudTTS/GoogleTTS";
import ChatGPTTTS from './ChatGPTTTS/ChatGPTTTS'
import { postData } from "../../context/utilities";
import UpgradeToPro from "../../UpgradeToPro";

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

    return (
        <Container fluid className="tta-container">
            <Row>
                <Col xs={12} lg={8}>
                    {/* Header Card */}
                    <div className="bg-white rounded p-3 mb-3 shadow-sm">
                        <h4 className="mb-2">Integration Setup</h4>
                        <p className="text-muted m-0 small">AtlasVoice Pro works fully fine even without Google TTS/ChatGPT integration.</p>
                    </div>

                    {/* Select Text To Speech Service */}
                    <div className="bg-white rounded p-3 mb-3 shadow-sm">
                        <h5 className="mb-3">Select Text To Speech Service</h5>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Card 
                                    className={`h-100 cursor-pointer ${currentTTSServic === 'google_cloud_tts' ? 'border-primary' : ''}`}
                                    onClick={() => setCurrentTTSServic('google_cloud_tts')}
                                >
                                    <Card.Body className="d-flex align-items-start">
                                        <div className="me-3">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
                                                <span className="fs-4">🔵</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <h6 className="mb-0">Google Cloud TTS</h6>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={currentTTSServic === 'google_cloud_tts'}
                                                    onChange={() => {}}
                                                    id="google_cloud_tts"
                                                />
                                            </div>
                                            <p className="text-muted small mb-0">
                                                Google Cloud Text-to-Speech converts text into natural-sounding speech using Google's AI voices.
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6}>
                                <Card 
                                    className={`h-100 cursor-pointer ${currentTTSServic === 'chat_gpt_tts' ? 'border-primary' : ''}`}
                                    onClick={() => setCurrentTTSServic('chat_gpt_tts')}
                                >
                                    <Card.Body className="d-flex align-items-start">
                                        <div className="me-3">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
                                                <span className="fs-4">💬</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <h6 className="mb-0">ChatGPT TTS</h6>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={currentTTSServic === 'chat_gpt_tts'}
                                                    onChange={() => {}}
                                                    id="chat_gpt_tts"
                                                />
                                            </div>
                                            <p className="text-muted small mb-0">
                                                ChatGPT TTS converts written text into realistic, human-like voice using OpenAI's advanced speech technology.
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* Service-specific content */}
                    {currentTTSServic !== 'chat_gpt_tts' ?
                        <GoogleTTS currentTTSServic={currentTTSServic} getShouldCheckChatGPT={getShouldCheckChatGPT} /> :
                        <ChatGPTTTS setChatGPTAPIData={setChatGPTAPIData} chatGPTAPIData={chatGPTAPIData}
                            currentTTSServic={currentTTSServic} />
                    }
                </Col>

                <Col xs={12} lg={4}>
                    <UpgradeToPro />
                </Col>
            </Row>
        </Container>
    )
}