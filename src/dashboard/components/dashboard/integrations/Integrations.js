import React, { useEffect, useMemo, useState } from "react";
import { Container, Form, Row, Col, Card, Badge } from "react-bootstrap";
import GoogleTTS from "./GoogleCloudTTS/GoogleTTS";
import ChatGPTTTS from "./ChatGPTTTS/ChatGPTTTS";
import { postData } from "../../context/utilities";
import UpgradeToPro from "../../UpgradeToPro";

export default function Integrations() {
  const [currentTTSServic, setCurrentTTSServic] = useState(""); // Empty by default
  const [authenticatedServices, setAuthenticatedServices] = useState([]);

  const apiURL = useMemo(() => {
    return (
      ttsObj.api_url +
      ttsObj.api_namespace +
      "_pro" +
      "/" +
      ttsObj.api_version +
      "/"
    );
  }, [window]);

  useEffect(() => {
    console.log({authenticatedServices})
  }, [authenticatedServices])

  const [chatGPTAPIData, setChatGPTAPIData] = useState({
    chatgpt_tts_api_key: "",
    currentTTSServic: currentTTSServic,
  });

  const [shouldCheckChatGPT, setShouldCheckChatGPT] = useState(false);

  // Handle service selection - toggle behavior
  const handleServiceSelect = (service) => {
    if (currentTTSServic === service) {
      // If clicking the already selected service, deselect it
      setCurrentTTSServic("");
    } else {
      // Otherwise, select the new service
      setCurrentTTSServic(service);
    }
  };

  const getCurrentTTSService = (ttsService) => {
    setCurrentTTSServic(ttsService);
  };

  const getShouldCheckChatGPT = (val) => {
    setShouldCheckChatGPT(val);
  };

  // Check both services authentication status on mount
  useEffect(() => {
    if (ttsObj.is_pro_active) {
      // Check Google Cloud TTS authentication
      postData(apiURL + "get_auth_file", {}, "GET")
        .then((res) => {
          console.log('Google TTS Auth Response:', res);
          if (res?.is_authenticated) {
            console.log('Google TTS IS authenticated - adding checkmark');
            setAuthenticatedServices(prev => {
              const newServices = prev.includes('google_cloud_tts') ? prev : [...prev, 'google_cloud_tts'];
              console.log('Updated authenticatedServices:', newServices);
              return newServices;
            });
            // Set as active service if authenticated
            setCurrentTTSServic('google_cloud_tts');
          } else {
            console.log('Google TTS NOT authenticated');
          }
        })
        .catch((err) => {
          console.log('Google TTS Auth Error:', err);
        });

      // Check ChatGPT TTS authentication  
      let data = new FormData();
      data.append("method", "get");
      postData(apiURL + "chat_gpt_tts", data)
        .then((res) => {
          console.log('ChatGPT TTS Auth Response:', res);
          setChatGPTAPIData(res.data);
          
          // Check if ChatGPT is authenticated - check for API key presence
          if (res?.data?.chatgpt_tts_api_key && res.data.chatgpt_tts_api_key !== '') {
            console.log('ChatGPT TTS IS authenticated - adding checkmark');
            setAuthenticatedServices(prev => {
              const newServices = prev.includes('chat_gpt_tts') ? prev : [...prev, 'chat_gpt_tts'];
              console.log('Updated authenticatedServices:', newServices);
              return newServices;
            });
            // Set as active service if authenticated and no other service is active
            setCurrentTTSServic(prevService => {
              // If Google TTS is already set, keep it, otherwise set ChatGPT
              if (prevService === '') {
                return 'chat_gpt_tts';
              }
              return prevService;
            });
          } else {
            console.log('ChatGPT TTS NOT authenticated');
          }
        })
        .catch((err) => {
          console.log('ChatGPT TTS Auth Error:', err);
        });
    }
  }, []);

  // Additional check when service is selected or shouldCheckChatGPT changes
  useEffect(() => {
    if (
      (ttsObj.is_pro_active && currentTTSServic === "chat_gpt_tts") ||
      shouldCheckChatGPT
    ) {
      let data = new FormData();
      data.append("method", "get");
      postData(apiURL + "chat_gpt_tts", data)
        .then((res) => {
          setChatGPTAPIData(res.data);
          if (
            res.data?.currentTTSServic === "chat_gpt_tts" &&
            res?.data?.chatgpt_tts_api_key
          ) {
            setAuthenticatedServices(prev => {
              if (prev.includes('chat_gpt_tts')) return prev;
              return [...prev, 'chat_gpt_tts'];
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currentTTSServic, shouldCheckChatGPT]);


  return (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          {/* Header Card */}
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <h2 className="fs-3 fw-bold mb-2 text-dark">Integration Setup</h2>
            <p className="text-secondary m-0 small">
              AtlasVoice Pro works fully fine even without Google TTS/ChatGPT
              integration.
            </p>
          </div>

          {/* TTS Service Selection Card */}
          <div className="tta-card mb-3">
            <h5 className="mb-3 fw-semibold">Select Text To Speech Service</h5>
            <Row>
              <Col xs={12} md={6} className="mb-3 mb-md-0">
                <div
                  className={`tts-service-card google-tts ${currentTTSServic === 'google_cloud_tts' ? 'active' : ''}`}
                  onClick={() => handleServiceSelect('google_cloud_tts')}
                >
                  <div className="d-flex align-items-start">
                    <div className="service-icon me-3">
                      <img
                        src="https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg"
                        alt="Google Cloud"
                        width="32"
                        height="32"
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="mb-1">Google Cloud TTS</h6>
                        {/* Checkbox only appears when authenticated */}
                        {authenticatedServices.includes('google_cloud_tts') && (
                          <Form.Check
                            type="checkbox"
                            checked={true}
                            onChange={() => {}}
                            className="service-checkbox"
                          />
                        )}
                      </div>
                      <p className="mb-0 text-muted small">
                        Google Cloud Text-to-Speech converts text into
                        natural-sounding speech using Google's AI voices.
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div
                  className={`tts-service-card chatgpt-tts ${currentTTSServic === 'chat_gpt_tts' ? 'active' : ''}`}
                  onClick={() => handleServiceSelect('chat_gpt_tts')}
                >
                  <div className="d-flex align-items-start">
                    <div className="service-icon me-3">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/66/OpenAI_logo_2025_%28symbol%29.svg"
                        alt="ChatGPT"
                        width="32"
                        height="32"
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="mb-1">ChatGPT TTS</h6>
                        {/* Checkbox only appears when authenticated */}
                        {authenticatedServices.includes('chat_gpt_tts') && (
                          <Form.Check
                            type="checkbox"
                            checked={true}
                            onChange={() => {}}
                            className="service-checkbox"
                          />
                        )}
                      </div>
                      <p className="mb-0 text-muted small">
                        ChatGPT TTS converts written text into realistic,
                        human-like voice using OpenAI's advanced speech
                        technology.
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Show Google TTS component when selected */}
          {currentTTSServic === "google_cloud_tts" && (
            <GoogleTTS
              setCurrentTTSServic={setCurrentTTSServic}
              getShouldCheckChatGPT={getShouldCheckChatGPT}
              setAuthenticatedServices={setAuthenticatedServices}
            />
          )}

          {/* Show ChatGPT TTS component when selected */}
          {currentTTSServic === "chat_gpt_tts" && (
            <ChatGPTTTS
              setChatGPTAPIData={setChatGPTAPIData}
              chatGPTAPIData={chatGPTAPIData}
              currentTTSServic={currentTTSServic}
              setAuthenticatedServices={setAuthenticatedServices}
            />
          )}
        </Col>

        <Col xs={12} lg={4}>
          <UpgradeToPro />
        </Col>
      </Row>
    </Container>
  );
}