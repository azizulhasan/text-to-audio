import React, { useEffect, useMemo, useState } from "react";
import { Container, Form, Row, Col } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import GoogleTTS from "./GoogleCloudTTS/GoogleTTS";
import ChatGPTTTS from "./ChatGPTTTS/ChatGPTTTS";
import ElevenLabsTTS from "./ElevenLabsTTS/ElevenLabsTTS";
import { postData } from "../../context/utilities";
import UpgradeToPro from "../../UpgradeToPro";
import Icon from "../../Icon";

export default function Integrations() {
  const [currentTTSServic, setCurrentTTSServic] = useState(""); // Empty by default
  const [authenticatedServices, setAuthenticatedServices] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // TTS-249: voice-provider integrations (Google Cloud / ChatGPT / ElevenLabs) are
  // a Pro feature. In free we show a non-interactive upsell instead of the
  // configurable setup (no API-key forms / authenticate buttons shipped active).
  const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

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

  const [elevenLabsAPIData, setElevenLabsAPIData] = useState({
    elevenlabs_api_key: "",
    currentTTSServic: currentTTSServic,
  });

  const [elevenLabsUsage, setElevenLabsUsage] = useState(null);


  const [shouldCheckChatGPT, setShouldCheckChatGPT] = useState(false);

  // Handle service selection via dropdown
  const handleServiceSelect = (e) => {
    setCurrentTTSServic(e.target.value);
  };

  const getCurrentTTSService = (ttsService) => {
    setCurrentTTSServic(ttsService);
  };

  const getShouldCheckChatGPT = (val) => {
    setShouldCheckChatGPT(val);
  };


  // Check all services authentication status on mount
  useEffect(() => {
    if (ttsObj.is_pro_active) {
      let completedRequests = 0;
      const totalRequests = 3;

      const checkLoadingComplete = () => {
        completedRequests++;
        if (completedRequests === totalRequests) {
          setIsDataLoaded(true);
        }
      };

      // Check Google Cloud TTS authentication
      postData(apiURL + "get_auth_file", {}, "GET")
        .then((res) => {
          if (res?.is_authenticated) {
            setAuthenticatedServices(prev => {
              const newServices = prev.includes('google_cloud_tts') ? prev : [...prev, 'google_cloud_tts'];
              return newServices;
            });
            if (!currentTTSServic) {
              setCurrentTTSServic('google_cloud_tts');
            }
          }
        })
        .catch((err) => {
          console.log('Google TTS Auth Error:', err);
        })
        .finally(() => {
          checkLoadingComplete();
        });

      // Check ChatGPT TTS authentication
      let data = new FormData();
      data.append("method", "get");
      postData(apiURL + "chat_gpt_tts", data)
        .then((res) => {
          setChatGPTAPIData(res.data);
          if (res?.data?.chatgpt_tts_api_key && res.data.chatgpt_tts_api_key !== '') {
            setAuthenticatedServices(prev => {
              const newServices = prev.includes('chat_gpt_tts') ? prev : [...prev, 'chat_gpt_tts'];
              return newServices;
            });
            setCurrentTTSServic(prevService => {
              if (prevService === '') {
                return 'chat_gpt_tts';
              }
              return prevService;
            });
          }
        })
        .catch((err) => {
          console.log('ChatGPT TTS Auth Error:', err);
        })
        .finally(() => {
          checkLoadingComplete();
        });

      // Check ElevenLabs TTS authentication
      let elevenLabsData = new FormData();
      elevenLabsData.append("method", "get");
      postData(apiURL + "elevenlabs_tts", elevenLabsData)
        .then((res) => {
          if (res?.data) {
            setElevenLabsAPIData(res.data);
            if (res?.data?.elevenlabs_api_key && res.data.elevenlabs_api_key !== '') {
              setAuthenticatedServices(prev => {
                const newServices = prev.includes('elevenlabs_tts') ? prev : [...prev, 'elevenlabs_tts'];
                return newServices;
              });
              setCurrentTTSServic(prevService => {
                if (prevService === '') {
                  return 'elevenlabs_tts';
                }
                return prevService;
              });
            }
          }
        })
        .catch((err) => {
          console.log('ElevenLabs TTS Auth Error:', err);
        })
        .finally(() => {
          checkLoadingComplete();
        });
    } else {
      setIsDataLoaded(true);
    }
  }, []);

  // Fetch usage data when authenticated and selected
  useEffect(() => {
    if (!ttsObj.is_pro_active) return;

    if (
      currentTTSServic === "elevenlabs_tts" &&
      authenticatedServices.includes('elevenlabs_tts')
    ) {
      postData(apiURL + "elevenlabs_usage", {}, "GET")
        .then((res) => {
          if (res?.data) {
            setElevenLabsUsage(res.data);
          }
        })
        .catch((err) => {
          console.log('ElevenLabs Usage Error:', err);
        });
    }

  }, [currentTTSServic, authenticatedServices]);

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

  // Get authenticated label suffix
  const getAuthLabel = (serviceKey) => {
    if (authenticatedServices.includes(serviceKey)) {
      return ' \u2713';
    }
    return '';
  };


  // TTS-249: free build shows a locked, non-interactive upsell — the provider
  // configuration UI (dropdown + API-key forms) is only rendered when Pro is active.
  if (isDataLoaded && !isProActive) {
    return (
      <Container fluid className="tta-container">
        <Row>
          <Col xs={12} lg={8}>
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              <h2 className="fs-3 fw-bold mb-2 text-dark">{__("Integration Setup", "text-to-audio")}</h2>
              <p className="text-secondary m-0 small">
                {__("Connect premium AI voice providers to generate natural MP3 audio.", "text-to-audio")}
              </p>
            </div>
            <div className="tta-card mb-3 text-center" style={{ padding: "40px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">{"🔒"}</div>
              <h5 className="fw-semibold mb-2">{__("Voice Integrations — Pro Feature", "text-to-audio")}</h5>
              <p className="text-secondary small mb-3 mx-auto" style={{ maxWidth: 460 }}>
                {__("Google Cloud TTS, ChatGPT, and ElevenLabs integrations are available in AtlasVoice Pro. The free plugin uses your browser's built-in voices.", "text-to-audio")}
              </p>
              <a
                className="btn btn-primary"
                href="https://atlasaidev.com/plugins/text-to-speech-pro/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#FF7853", borderColor: "#FF7853" }}
              >
                {__("Upgrade to Pro", "text-to-audio")}
              </a>
            </div>
          </Col>
          <Col xs={12} lg={4}>
            <UpgradeToPro />
          </Col>
        </Row>
      </Container>
    );
  }

  return isDataLoaded ? (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          {/* Header Card */}
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <h2 className="fs-3 fw-bold mb-2 text-dark">{__("Integration Setup", "text-to-audio")}</h2>
            <p className="text-secondary m-0 small">
              {__("AtlasVoice Pro works fully fine even without Google TTS/ChatGPT integration.", "text-to-audio")}
            </p>
          </div>

          {/* TTS Service Selection Dropdown */}
          <div className="tta-card mb-3">
            <h5 className="mb-3 fw-semibold">{__("Select Voice Service", "text-to-audio")}</h5>
            <Form.Select
              value={currentTTSServic}
              onChange={handleServiceSelect}
              className="mb-3"
            >
              <option value="">{__("-- Select a service --", "text-to-audio")}</option>
              <option value="google_cloud_tts">
                {__("Google Cloud TTS", "text-to-audio")}{getAuthLabel('google_cloud_tts')}
              </option>
              <option value="chat_gpt_tts">
                {__("ChatGPT TTS", "text-to-audio")}{getAuthLabel('chat_gpt_tts')}
              </option>
              <option value="elevenlabs_tts">
                {__("ElevenLabs TTS", "text-to-audio")}{getAuthLabel('elevenlabs_tts')}
              </option>
            </Form.Select>

            {/* Token/Character Usage Section */}
            {currentTTSServic === 'elevenlabs_tts' && authenticatedServices.includes('elevenlabs_tts') && elevenLabsUsage && (
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h6 className="fw-semibold mb-2">{__("ElevenLabs Usage", "text-to-audio")}</h6>

                {/* Character quota progress bar */}
                <div className="d-flex justify-content-between mb-1">
                  <span className="small text-muted">
                    {elevenLabsUsage.character_count?.toLocaleString() || 0} / {elevenLabsUsage.character_limit?.toLocaleString() || 0} {__("characters", "text-to-audio")}
                  </span>
                  <span className="small text-muted">
                    {elevenLabsUsage.character_limit > 0
                      ? Math.round((elevenLabsUsage.character_count / elevenLabsUsage.character_limit) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${elevenLabsUsage.character_limit > 0
                        ? Math.min((elevenLabsUsage.character_count / elevenLabsUsage.character_limit) * 100, 100)
                        : 0}%`,
                      backgroundColor: '#6366f1'
                    }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  {elevenLabsUsage.tier && (
                    <span className="small text-muted">
                      {__("Plan:", "text-to-audio")} {elevenLabsUsage.tier}
                    </span>
                  )}
                  {elevenLabsUsage.next_reset && (
                    <span className="small text-muted">
                      {__("Resets:", "text-to-audio")} {elevenLabsUsage.next_reset}
                    </span>
                  )}
                </div>

                <p className="small text-muted mb-0">
                  {__("View detailed usage and billing at", "text-to-audio")}{' '}
                  <a href="https://elevenlabs.io/app/subscription" target="_blank" rel="noopener noreferrer">
                    elevenlabs.io/app/subscription
                  </a>
                </p>
              </div>
            )}

            {currentTTSServic === 'chat_gpt_tts' && authenticatedServices.includes('chat_gpt_tts') && (
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h6 className="fw-semibold mb-2">{__("OpenAI TTS Usage", "text-to-audio")}</h6>
                <p className="small text-muted mb-0">
                  {__("View detailed usage and billing at", "text-to-audio")}{' '}
                  <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer">
                    platform.openai.com/usage
                  </a>
                </p>
              </div>
            )}

            {currentTTSServic === 'google_cloud_tts' && authenticatedServices.includes('google_cloud_tts') && (
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h6 className="fw-semibold mb-2">{__("Google Cloud TTS Usage", "text-to-audio")}</h6>
                <p className="small text-muted mb-0">
                  {__("View detailed usage and billing at", "text-to-audio")}{' '}
                  <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer">
                    console.cloud.google.com/billing
                  </a>
                </p>
              </div>
            )}
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

          {/* Show ElevenLabs TTS component when selected */}
          {currentTTSServic === "elevenlabs_tts" && (
            <ElevenLabsTTS
              setElevenLabsAPIData={setElevenLabsAPIData}
              elevenLabsAPIData={elevenLabsAPIData}
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
  ) : (
    <div
      className="tta-loading-spinner"
    >
      <div>
        <Icon name="spinner" spin className="me-2" />
       {__("Loading...", "text-to-audio")}
      </div>
    </div>
  );
}
