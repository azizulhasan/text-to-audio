import { useState } from "react";
import { Container, Form, Row, Col } from 'react-bootstrap'
import GoogleTTS from "./GoogleCloudTTS/GoogleTTS";
import ChatGPTTTS from './ChatGPTTTS/ChatGPTTTS'


export default function Integrations() {
    const [currentTTSServic, setCurrentTTSServic] = useState('')
    const handleClick = (e) => {
        setCurrentTTSServic(e.target.id)
    }
    const getCurrentTTSService = (ttsService) => {
        setCurrentTTSServic(ttsService)
    }
    return <>
      <Container>
        <Row>
            <Col xs={12} sm={12} lg={8}>
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
                        checked={currentTTSServic !== 'chatgpt_tts'}
                        id={`google_cloud_tts`}
                        onClick={handleClick}
                    />
                    <Form.Check
                        inline
                        label="ChatGPT TTS(soon)"
                        title="ChatGPT TTS(soon)"
                        name="group1"
                        type={'radio'}
                        checked={currentTTSServic === 'chatgpt_tts'}
                        id={`chatgpt_tts`}
                        onClick={handleClick}
                        disabled
                    />
                </Form.Group>
            </Form>
            </Col>
        </Row>
        </Container>
        {
            currentTTSServic !== 'chatgpt_tts' ? <GoogleTTS getCurrentTTSService={getCurrentTTSService} currentTTSServic={currentTTSServic} /> : <ChatGPTTTS getCurrentTTSService={getCurrentTTSService} currentTTSServic={currentTTSServic} />
        }
    </>
}