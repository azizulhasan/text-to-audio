import React, { useEffect, useState, useMemo } from "react";
import {
  Col,
  Container,
  Row,
  Form,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  postWithoutImage,
  getData,
  setLocalStorage,
  getLocalStorage,
  gttsSupportedLanguages,
  areAllKeysNumeric,
  chatGPTLanguages,
} from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";

export default function Listening() {
  const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
  const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);
  const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);
  const [customizationSettings, setCustomizationSettings] = useState({});
  const [languageMissingMessage, setLanguageMissingMessage] = useState("");
  const [currentPlayerFilteredVoices, setCurrentPlayerFilteredVoices] =
    useState([]);

  const [listeningSettings, setListeningSettings] = useState({
    tta__listening_voice: "Google UK English Female",
    tta__listening_pitch: 1,
    tta__listening_rate: 1,
    tta__listening_volume: 1,
    tta__listening_lang: "en-GB",
    tta__listening_activeLanguages_mapping: {},
    tta__multilingualActiveLanguages: {},
    tta__currentPlayerLanguages: {},
    tta__available_currentPlayerVoices: {},
    tta__listening_voice_model: "tts-1",
  });

  const [baseMP3File, setBaseMP3File] = useState(
    "https://cloud.google.com/text-to-speech/docs/audio/en-GB-Chirp-HD-F.wav"
  );

  const apiURL = useMemo(() => {
    if (window.hasOwnProperty("ttsObj") && ttsObj.is_pro_active) {
      return (
        ttsObj.api_url +
        ttsObj.api_namespace +
        "_pro/" +
        ttsObj.api_version +
        "/"
      );
    }
    return (
      ttsObj.api_url + ttsObj.api_namespace + "/" + ttsObj.api_version + "/"
    );
  });

  useEffect(() => {
    if (
      window.hasOwnProperty("ttsObj") &&
      ttsObj.is_pro_active &&
      customizationSettings?.buttonSettings?.id == 5
    ) {
      setBaseMP3File("https://cdn.openai.com/API/docs/audio/alloy.wav");
      const audio_wav = document.getElementById("tts_audio_wav");
      const audio_mp3 = document.getElementById("tts_audio_mp3");
      const audio_tag = document.getElementById("tts_audio_tag");

      audio_wav.src = "https://cdn.openai.com/API/docs/audio/alloy.wav";
      audio_mp3.src = "https://cdn.openai.com/API/docs/audio/alloy.wav";
      audio_tag.load();
    }
  }, [customizationSettings]);

  const [multilingualActiveLanguages, setMultilingualActiveLanguages] =
    useState([]);
  const [isListeningSettingsLoaded, setIsListeningSettingsLoaded] =
    useState(false);

  useEffect(() => {
    if (window?.ttsObjPro?.compatible?.["gtranslate/gtranslate.php"]) {
      let gtranslateActiveLanguages =
        ttsObjPro?.compatible?.["gtranslate/gtranslate.php"]?.allowed_languages;
      const languageObject = {};
      for (const langCode of gtranslateActiveLanguages) {
        languageObject[langCode] = langCode;
      }
      setMultilingualActiveLanguages(languageObject);
      setListeningSettings({
        ...listeningSettings,
        ...{ tta__listening_activeLanguages_mapping: languageObject },
      });
    } else if (
      window?.ttsObjPro?.compatible?.[
        "sitepress-multilingual-cms/sitepress.php"
      ]
    ) {
      let gtranslateActiveLanguages =
        ttsObjPro?.compatible?.["sitepress-multilingual-cms/sitepress.php"]
          ?.active_languages;
      const languageObject = {};
      let active_languages = Object.keys(gtranslateActiveLanguages);
      for (const langCode of active_languages) {
        languageObject[langCode] =
          gtranslateActiveLanguages[langCode].english_name;
      }
      setMultilingualActiveLanguages(languageObject);
      setListeningSettings({
        ...listeningSettings,
        ...{ tta__listening_activeLanguages_mapping: languageObject },
      });
    } else if (
      window?.ttsObjPro?.compatible?.["translatepress-multilingual/index.php"]
    ) {
      let activeLanguages =
        ttsObjPro?.compatible?.["translatepress-multilingual/index.php"]?.data;
      const languageObject = {};
      for (const langCode of activeLanguages) {
        languageObject[langCode] = langCode;
      }
      setMultilingualActiveLanguages(languageObject);
      setListeningSettings({
        ...listeningSettings,
        ...{ tta__listening_activeLanguages_mapping: languageObject },
      });
    }
  }, [window?.ttsObjPro]);

  const setGoogleVoicesAndLanguages = () => {
    let stored_voices = getLocalStorage(["tta__voices"]);
    let languageHelper = null;
    if (typeof TTSProLanguageHelper === "function") {
      languageHelper = new TTSProLanguageHelper();
    }
    if (!stored_voices?.tta__voices) {
      getData(apiURL + "voices")
        .then((res) => {
          if (res?.voices?.length) {
            setLocalStorage({ tta__voices: JSON.stringify(res.voices) });
          }
          if (res?.voices?.voices?.length) {
            setLocalStorage({ tta__voices: JSON.stringify(res.voices.voices) });
          } else {
            setVoicesAndLanguages();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      let voices = JSON.parse(stored_voices.tta__voices);
      let langs = [];
      let langs2 = {};

      try {
        voices = JSON.parse(voices);
      } catch (error) {
        console.log({ catch_voices: voices });
      }

      if (voices?.voices) {
        voices = voices.voices;
      }

      voices.map((voice) => {
        if (!langs.includes(voice.languageCodes[0])) {
          langs.push(voice.languageCodes[0]);
          let languageName = voice.languageCodes[0];
          if (languageHelper) {
            languageName = languageHelper.getLangByCode(languageName);
          }
          langs2[voice.languageCodes[0]] = languageName;
        }
      });

      setVoicesAndLanguages(voices, langs2);
    }
  };

  useEffect(() => {
    if (
      window.hasOwnProperty("ttsObj") &&
      ttsObj?.gctts_is_authenticated == 1
    ) {
      setGoogleVoicesAndLanguages();
    } else {
      setVoicesAndLanguages();
    }

    let data2 = new FormData();
    data2.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/listening", data2)
      .then((res) => {
        setListeningSettings({
          ...res.data,
        });
      })
      .catch((err) => {
        console.log(err);
      });

    let customize = new FormData();
    customize.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/customize", customize)
      .then((res) => {
        if (!res.data?.buttonSettings?.id) {
          res.data.buttonSettings.id = 1;
        }
        setCustomizationSettings(res.data);
        setIsListeningSettingsLoaded(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (customizationSettings?.buttonSettings?.id < 3) {
      setVoicesAndLanguages();
    }
    if (customizationSettings?.buttonSettings?.id == 5) {
      setGPTVoicesAndLanguages();
    }
  }, [customizationSettings]);

  const setGPTVoicesAndLanguages = () => {
    const names = {
      alloy: "alloy",
      echo: "echo",
      fable: "fable",
      onyx: "onyx",
      nova: "nova",
      shimmer: "shimmer",
    };
    setCurrentPlayerVoices(Object.keys(names));
    setCurrentPlayerFilteredVoices(Object.keys(names));
    setSpeechSynthesisVoices(Object.keys(names));
  };

  const setVoicesAndLanguages = (voices = [], langs = []) => {
    if (Array.isArray(voices) && voices.length) {
      setCurrentPlayerVoices(voices);
      setCurrentPlayerFilteredVoices(voices);
      setSpeechSynthesisVoices(voices);
    }
    if (Array.isArray(langs) && langs.length) {
      if (areAllKeysNumeric(langs)) {
        let newLangs = {};
        for (let lang of langs) {
          newLangs[lang] = lang;
        }
        setCurrentPlayerLanguages(newLangs);
      } else {
        setCurrentPlayerLanguages(langs);
      }
    } else {
      setCurrentPlayerLanguages(langs);
    }

    if (Object.keys(langs).length && Array.isArray(voices) && voices.length)
      return;

    let timer = setTimeout(function handleTime() {
      timer = setTimeout(handleTime, 1000);

      if (timer > 500 || customizationSettings?.buttonSettings == undefined) {
        clearTimeout(timer);
        timer = null;
      }
      if (
        window.hasOwnProperty("speechSynthesis") &&
        window.speechSynthesis.getVoices().length &&
        customizationSettings?.buttonSettings?.id < 3
      ) {
        clearTimeout(timer);
        timer = null;
        setSpeechSynthesisVoices(window.speechSynthesis.getVoices());
        let newLangs = {};
        window.speechSynthesis.getVoices().map((item) => {
          if (!langs.includes(item.lang)) {
            langs[item.lang] = item.lang;
          }
        });
        setCurrentPlayerLanguages(langs);
        setCurrentPlayerVoices(window.speechSynthesis.getVoices());
        setCurrentPlayerFilteredVoices(window.speechSynthesis.getVoices());
      }
    });
  };

  useEffect(() => {
    if (window.hasOwnProperty("ttsObjPro") && ttsObjPro?.is_pro_active) {
      if (customizationSettings?.buttonSettings?.id == 3) {
        let gttsLanguages = gttsSupportedLanguages();
        setCurrentPlayerLanguages(gttsLanguages);
        setLanguageMissingMessage("");
      } else if (customizationSettings?.buttonSettings?.id == 5) {
        let languages = chatGPTLanguages();
        setCurrentPlayerLanguages(languages);
        setLanguageMissingMessage("");
      } else if (customizationSettings?.buttonSettings?.id < 3) {
        setLanguageMissingMessage(
          "Looking for another language? Please select the another player from customization menu. Your language may be appear."
        );
      } else if (customizationSettings?.buttonSettings?.id == 4) {
        setGoogleVoicesAndLanguages();
        setLanguageMissingMessage("");
      }
    }
  }, [customizationSettings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(e.target);

    let formData = {};
    for (let [key, value] of form.entries()) {
      if (key === "" || value === "") {
        toast("Please fill the  field : " + key);
        return;
      }
      if (
        key === "tta__available_currentPlayerVoices" ||
        "tta__currentPlayerLanguages" === key ||
        "tta__multilingualActiveLanguages" === key
      ) {
        if (!ttsObj.is_pro_active) {
          formData[key] = {};
          continue;
        }

        if (!formData?.[key]) {
          formData[key] = {};
        }
        if (!Object.keys(formData?.[key]).length) {
          formData[key][customizationSettings?.buttonSettings?.id] = [];
        }
        formData[key][customizationSettings?.buttonSettings?.id].push(value);
      } else {
        formData[key] = value;
      }
    }
    formData.tta__available_currentPlayerVoices = {
      ...listeningSettings.tta__available_currentPlayerVoices,
      ...formData.tta__available_currentPlayerVoices,
    };

    formData.tta__currentPlayerLanguages = {
      ...listeningSettings.tta__currentPlayerLanguages,
      ...formData.tta__currentPlayerLanguages,
    };

    formData.tta__multilingualActiveLanguages = {
      ...listeningSettings.tta__multilingualActiveLanguages,
      ...formData.tta__multilingualActiveLanguages,
    };

    let data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(tta_obj.api_url + "tta/v1/listening", data)
      .then((res) => {
        setListeningSettings(res.data);
        toast("Listening settings saved. Now all setup done. Enjoy", "info", {
          autoClose: 15000,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleChange = (e, index = "", player_id = "") => {
    if (
      e.target.name === "tta__listening_lang" &&
      customizationSettings?.buttonSettings?.id == 4
    ) {
      let filteredVoices = speechSynthesisVoices.filter((voice) => {
        return voice.languageCodes[0] == e.target.value;
      });
      if (filteredVoices.length === 1) {
        setListeningSettings({
          ...listeningSettings,
          ...{ ["tta__listening_voice"]: filteredVoices[0].languageCodes[0] },
        });
      }
      setCurrentPlayerFilteredVoices(filteredVoices);
    }

    if (
      e.target.name === "tta__listening_voice" &&
      customizationSettings?.buttonSettings?.id > 3
    ) {
      let currentVoice = e.target.value;
      let baseURL = "https://cloud.google.com/text-to-speech/docs/audio/";
      if (customizationSettings?.buttonSettings?.id == 5) {
        baseURL = "https://cdn.openai.com/API/docs/audio/";
      }
      currentVoice = currentVoice.replace(/-(MALE|FEMALE)$/, "");

      let wavFileName = baseURL + currentVoice + ".wav";
      let mp3FileName = baseURL + currentVoice + ".mp3";
      const audio_wav = document.getElementById("tts_audio_wav");
      const audio_mp3 = document.getElementById("tts_audio_mp3");
      const audio_tag = document.getElementById("tts_audio_tag");

      audio_wav.src = wavFileName;
      audio_mp3.src = mp3FileName;
      audio_tag.load();
      audio_tag.play();
    }

    let listeningSettingsCloned = structuredClone(listeningSettings);

    if (
      e.target.name === "tta__available_currentPlayerVoices" ||
      "tta__currentPlayerLanguages" === e.target.name ||
      "tta__multilingualActiveLanguages" === e.target.name
    ) {
      if (!listeningSettingsCloned?.[e.target.name]?.[player_id]) {
        if (!Object.keys(listeningSettingsCloned[e.target.name]).length) {
          listeningSettingsCloned[e.target.name] = {};
        }
        listeningSettingsCloned[e.target.name][player_id] = [];
      }
      listeningSettingsCloned[e.target.name][player_id][index] = e.target.value;
      if ("tta__multilingualActiveLanguages" != e.target.name) {
        setListeningSettings(listeningSettingsCloned);
      }
    } else {
      setListeningSettings({
        ...listeningSettings,
        ...{ [e.target.name]: e.target.value },
      });
    }
  };

  const getActiveMultingualPluginName = () => {
    let activePluginName = "";
    if (
      window?.ttsObjPro?.compatible?.[
        "sitepress-multilingual-cms/sitepress.php"
      ]
    ) {
      activePluginName = "WPML";
    } else if (window?.ttsObjPro?.compatible?.["gtranslate/gtranslate.php"]) {
      activePluginName = "Gtranslate";
    } else if (
      window?.ttsObjPro?.compatible?.["translatepress-multilingual/index.php"]
    ) {
      activePluginName = "TranslatePress";
    }
    return activePluginName;
  };

  return (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          {/* Header Card */}
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <h2 className="fs-3 fw-bold mb-2 text-dark">
              Listening Preferences
            </h2>
            <p className="text-secondary m-0 small">
              Set your listening preferences with different voices and
              languages.
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* Default Voice Language Section */}
            <div className="tta-card mb-3">
              <h5 className="mb-3 fw-semibold">Default Voice Language</h5>
              <Row className="align-items-center">
                <Col xs={12} md={10}>
                  <div className="tta-language-selector">
                    <div className="d-flex align-items-center">
                      <div className="tta-flag-icon me-3">
                        <img
                          src="https://flagcdn.com/w40/us.png"
                          alt="English"
                          width="32"
                          height="24"
                        />
                      </div>
                      <div className="flex-grow-1">
                        <span className="fw-medium">English (US)</span>
                        <i className="bi bi-check-circle-fill text-primary ms-2"></i>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={2} className="text-end">
                  <Button
                    variant="link"
                    className="tta-search-btn"
                    onClick={() =>
                      document.getElementById("tta__listening_lang").focus()
                    }
                  >
                    <i className="bi bi-search"></i>
                    Search here to change it
                  </Button>
                </Col>
              </Row>
              <Form.Select
                onChange={handleChange}
                name="tta__listening_lang"
                id="tta__listening_lang"
                value={listeningSettings.tta__listening_lang}
                className="mt-3 d-none"
              >
                <option disabled>Default Listening Language</option>
                {Object.keys(currentPlayerLanguages).map((langKey, index) => {
                  return (
                    <option
                      key={langKey}
                      value={
                        customizationSettings?.buttonSettings?.id < 3
                          ? currentPlayerLanguages[langKey]
                          : langKey
                      }
                    >
                      {currentPlayerLanguages[langKey]}
                    </option>
                  );
                })}
              </Form.Select>
              {languageMissingMessage && (
                <p className="text-primary small mt-2 mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  {languageMissingMessage}
                </p>
              )}
            </div>

            {/* Language Mapping Section - Multilingual */}
            {Object.keys(multilingualActiveLanguages).length > 0 && (
              <div className="tta-card mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0 fw-semibold">
                    {getActiveMultingualPluginName()} Plugin Language Mapping
                  </h5>
                  {!ttsObj.is_pro_active && (
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          Language mapping for WPML, GTranalate plugin is
                          available in the pro version.
                        </Tooltip>
                      }
                    >
                      <Button className="m-0 p-0 text-dark bg-light border-0">
                        <i className="fas fa-lock" />
                      </Button>
                    </OverlayTrigger>
                  )}
                </div>

                {Object.keys(multilingualActiveLanguages).map(
                  (languageCode, index) => (
                    <div key={index} className="tta-language-mapping-row">
                      <Row className="align-items-center mb-3">
                        <Col xs={12} md={4}>
                          <div className="tta-language-code-box">
                            <span className="tta-language-code">
                              {languageCode}
                            </span>
                          </div>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Select
                            onChange={(e) =>
                              handleChange(
                                e,
                                index,
                                customizationSettings?.buttonSettings?.id
                              )
                            }
                            name="tta__currentPlayerLanguages"
                            value={
                              listeningSettings?.tta__currentPlayerLanguages?.[
                                customizationSettings?.buttonSettings?.id
                              ]?.[index] ??
                              Object.keys(currentPlayerLanguages).filter(
                                (lang) => {
                                  if (
                                    customizationSettings?.buttonSettings?.id <
                                    3
                                  ) {
                                    return currentPlayerLanguages[
                                      lang
                                    ].startsWith(languageCode);
                                  }
                                  return lang.startsWith(languageCode);
                                }
                              )[0]
                            }
                            className="tta-language-select"
                          >
                            <option disabled>
                              Select Language for{" "}
                              {multilingualActiveLanguages[languageCode]}
                            </option>
                            {Object.keys(currentPlayerLanguages).map(
                              (langKey, idx) => {
                                return (
                                  <option
                                    key={idx}
                                    value={
                                      customizationSettings?.buttonSettings
                                        ?.id < 3
                                        ? currentPlayerLanguages[langKey]
                                        : langKey
                                    }
                                  >
                                    {currentPlayerLanguages[langKey]}
                                  </option>
                                );
                              }
                            )}
                          </Form.Select>
                        </Col>
                        {customizationSettings?.buttonSettings?.id != 3 &&
                          Object.keys(currentPlayerLanguages).length > 0 && (
                            <Col xs={12} md={4}>
                              <Form.Select
                                onChange={(e) =>
                                  handleChange(
                                    e,
                                    index,
                                    customizationSettings?.buttonSettings?.id
                                  )
                                }
                                name="tta__available_currentPlayerVoices"
                                value={
                                  customizationSettings?.buttonSettings?.id == 5
                                    ? listeningSettings.tta__listening_voice
                                    : (listeningSettings
                                        ?.tta__available_currentPlayerVoices?.[
                                        customizationSettings?.buttonSettings
                                          ?.id
                                      ]?.[index] ??
                                      Object.values(currentPlayerVoices).filter(
                                        (voice) => {
                                          if (
                                            customizationSettings
                                              ?.buttonSettings?.id < 3
                                          ) {
                                            return voice?.lang?.startsWith(
                                              languageCode
                                            );
                                          }
                                          return voice?.name?.startsWith(
                                            languageCode
                                          );
                                        }
                                      )[0]?.name)
                                }
                                className="tta-language-select"
                              >
                                <option disabled>Select Voice</option>
                                {currentPlayerVoices.map((voice, idx) =>
                                  window.hasOwnProperty("ttsObjPro") &&
                                  customizationSettings?.buttonSettings?.id ==
                                    4 ? (
                                    <option
                                      key={idx}
                                      value={[
                                        voice.name,
                                        voice.ssmlGender,
                                      ].join("-")}
                                    >
                                      {voice.name} - {voice.ssmlGender}
                                    </option>
                                  ) : (
                                    <option key={idx} value={voice.name}>
                                      {voice?.name || voice}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            </Col>
                          )}
                      </Row>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Voice Settings (Hidden but functional) */}
            <div className="d-none">
              {customizationSettings?.buttonSettings?.id != 3 && (
                <Form.Select
                  onChange={handleChange}
                  name="tta__listening_voice"
                  id="tta__listening_voice"
                  value={listeningSettings.tta__listening_voice}
                >
                  <option disabled>Default Listening Voice</option>
                  {currentPlayerFilteredVoices.map((voice, index) =>
                    window.hasOwnProperty("ttsObjPro") &&
                    customizationSettings?.buttonSettings?.id == 4 ? (
                      <option
                        key={index}
                        value={[voice.name, voice.ssmlGender].join("-")}
                      >
                        {voice.name} - {voice.ssmlGender}
                      </option>
                    ) : customizationSettings?.buttonSettings?.id == 5 ? (
                      <option key={index} value={voice}>
                        {voice}
                      </option>
                    ) : (
                      <option key={index} value={voice.name}>
                        {voice.name}
                      </option>
                    )
                  )}
                </Form.Select>
              )}

              {customizationSettings?.buttonSettings?.id == 5 && (
                <Form.Select
                  onChange={handleChange}
                  name="tta__listening_voice_model"
                  value={listeningSettings.tta__listening_voice_model}
                >
                  <option disabled>Default Listening Model</option>
                  <option value="tts-1">TTS-1</option>
                  <option value="tts-1-hd">TTS-1 HD</option>
                </Form.Select>
              )}

              {(customizationSettings?.buttonSettings?.id < 3 ||
                customizationSettings?.buttonSettings?.id == 5) && (
                <Form.Control
                  type="text"
                  name="tta__listening_rate"
                  onChange={handleChange}
                  value={listeningSettings.tta__listening_rate}
                />
              )}

              {customizationSettings?.buttonSettings?.id < 3 && (
                <>
                  <Form.Select
                    onChange={handleChange}
                    name="tta__listening_pitch"
                    value={listeningSettings.tta__listening_pitch}
                  >
                    <option disabled>Default Listening Pitch</option>
                    {[0, 1, 2].map((pitch, index) => {
                      return (
                        <option key={index} value={pitch}>
                          {pitch}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Control
                    type="text"
                    name="tta__listening_volume"
                    onChange={handleChange}
                    value={listeningSettings.tta__listening_volume}
                  />
                </>
              )}

              {customizationSettings?.buttonSettings?.id > 3 && (
                <audio id="tts_audio_tag" controls>
                  <source
                    id="tts_audio_wav"
                    src={baseMP3File}
                    type="audio/wav"
                  />
                  <source
                    id="tts_audio_mp3"
                    src={baseMP3File}
                    type="audio/mpeg"
                  />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>

            {/* Save Button */}
            <div
              className="position-sticky bottom-0"
              style={{ zIndex: 1030, marginTop: "20px" }}
            >
              <div className="text-center mt-4">
                <button type="submit" className="tta_btn rounded-3">
                  Save
                </button>
              </div>
            </div>
          </Form>
        </Col>

        <Col xs={12} lg={4}>
          <UpgradeToPro />
        </Col>
      </Row>
    </Container>
  );
}
