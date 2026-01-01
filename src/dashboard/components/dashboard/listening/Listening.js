import React, { useEffect, useState, useMemo } from "react";
import {
  Col,
  Container,
  Row,
  Form,
  Button,
  Tooltip,
  OverlayTrigger,
  InputGroup,
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
  const [searchQuery, setSearchQuery] = useState("");

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
    console.log({
      pro: ttsObj.is_pro_active,
      id: customizationSettings?.buttonSettings?.id,
    });
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

      console.log(languageObject);
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
          console.log(res?.voices?.voices);
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
        console.log({ dta: res.data.buttonSettings.id });
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
      console.log({ customizationSettings, timer });

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
    console.log(formData);
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

  const getLanguageFlag = (langCode) => {
    const flagMap = {
      en: "us",
      "en-US": "us",
      "en-GB": "gb",
      fr: "fr",
      "fr-FR": "fr",
      "fr-CA": "ca",
      de: "de",
      "de-DE": "de",
      es: "es",
      "es-ES": "es",
      it: "it",
      "it-IT": "it",
      pt: "pt",
      "pt-PT": "pt",
      "pt-BR": "br",
      nl: "nl",
      "nl-NL": "nl",
      "nl-BE": "be",
      ru: "ru",
      "ru-RU": "ru",
      "zh-CN": "cn",
      "zh-TW": "tw",
      ja: "jp",
      "ja-JP": "jp",
      ko: "kr",
      "ko-KR": "kr",
      ar: "sa",
    };

    const countryCode =
      flagMap[langCode] || langCode.toLowerCase().split("-")[0];
    return `https://flagcdn.com/24x18/${countryCode}.png`;
  };

  const getCurrentLanguageName = () => {
    const currentLang = listeningSettings.tta__listening_lang;
    return currentPlayerLanguages[currentLang] || currentLang;
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return currentPlayerLanguages;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.keys(currentPlayerLanguages).forEach((langKey) => {
      const langName = currentPlayerLanguages[langKey].toLowerCase();
      const langCode = langKey.toLowerCase();

      if (langName.includes(query) || langCode.includes(query)) {
        filtered[langKey] = currentPlayerLanguages[langKey];
      }
    });

    return filtered;
  }, [currentPlayerLanguages, searchQuery]);

  // Check if this is Default or Default Pro player (id < 3)
  const isDefaultPlayer = customizationSettings?.buttonSettings?.id < 3;

  // Generate tick marks for sliders
  const generateSpeedTicks = () => {
    const ticks = [];
    for (let i = 0.1; i <= 10; i += 1) {
      ticks.push(i);
    }
    return ticks;
  };

  const generateVolumeTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 1; i += 0.1) {
      ticks.push(parseFloat(i.toFixed(1)));
    }
    return ticks;
  };

  return (
    <Container>
      <Row>
        <Col xs={12} sm={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 mt-3 shadow-sm">
            <h2 className="tta_listening_title">Listening Preferences</h2>
            <p className="tta_listening_subtitle">
              Set your listening preferences with different voices and
              languages.
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* For Default and Default Pro - use new 2-column layout */}
            {isDefaultPlayer ? (
              <>
                {/* Voice Language and Voice to Speak - Side by Side */}
                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <div className="tta_voice_card">
                      <h3 className="tta_voice_card_title">Voice Language</h3>
                      <div className="tta_voice_select_wrapper">
                        <img
                          src={getLanguageFlag(listeningSettings.tta__listening_lang)}
                          alt="flag"
                          className="tta_voice_flag"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <Form.Select
                          onChange={handleChange}
                          name="tta__listening_lang"
                          id="tta__listening_lang"
                          value={listeningSettings.tta__listening_lang}
                          className="tta_orange_voice_select"
                        >
                          <option disabled>Default Listening Language</option>
                          {Object.keys(currentPlayerLanguages).map((langKey) => (
                            <option key={langKey} value={currentPlayerLanguages[langKey]}>
                              {currentPlayerLanguages[langKey]}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="tta_voice_card">
                      <h3 className="tta_voice_card_title">Voice to speak</h3>
                      <Form.Select
                        onChange={handleChange}
                        name="tta__listening_voice"
                        id="tta__listening_voice"
                        value={listeningSettings.tta__listening_voice}
                        className="tta_orange_speak_select"
                      >
                        <option disabled>Default Listening Voice</option>
                        {currentPlayerFilteredVoices.map((voice, index) => (
                          <option
                            key={index}
                            data-lang={voice.lang}
                            value={voice.name}
                          >
                            {voice.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>
                </Row>

                {/* Voice Speed and Voice Volume - Combined in one card */}
                <div className="tta_sliders_card">
                  <Form.Group className="mb-4">
                    <div className="tta_slider_header">
                      <Form.Label className="tta_slider_label">
                        Voice Speed
                      </Form.Label>
                      <span className="tta_slider_value">
                        {listeningSettings.tta__listening_rate}
                      </span>
                    </div>
                    <div className="tta_slider_container">
                      <Form.Range
                        min="0.1"
                        max="10"
                        step="0.1"
                        name="tta__listening_rate"
                        id="tta__listening_rate"
                        onChange={handleChange}
                        value={listeningSettings.tta__listening_rate}
                        className="tta_new_slider"
                      />
                      <div className="tta_slider_ticks">
                        {generateSpeedTicks().map((tick, index) => (
                          <div key={index} className="tta_slider_tick"></div>
                        ))}
                      </div>
                    </div>
                    <div className="tta_slider_labels">
                      <span>0.1</span>
                      <span>1.0</span>
                      <span>2.0</span>
                      <span>3.0</span>
                      <span>4.0</span>
                      <span>5.0</span>
                      <span>6.0</span>
                      <span>7.0</span>
                      <span>8.0</span>
                      <span>9.0</span>
                      <span>10.0</span>
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <div className="tta_slider_header">
                      <Form.Label className="tta_slider_label">
                        Voice Volume
                      </Form.Label>
                      <span className="tta_slider_value">
                        {listeningSettings.tta__listening_volume}
                      </span>
                    </div>
                    <div className="tta_slider_container">
                      <Form.Range
                        min="0"
                        max="1"
                        step="0.1"
                        name="tta__listening_volume"
                        id="tta__listening_volume"
                        onChange={handleChange}
                        value={listeningSettings.tta__listening_volume}
                        className="tta_new_slider"
                      />
                      <div className="tta_slider_ticks">
                        {generateVolumeTicks().map((tick, index) => (
                          <div key={index} className="tta_slider_tick"></div>
                        ))}
                      </div>
                    </div>
                    <div className="tta_slider_labels">
                      <span>0.1</span>
                      <span>0.1</span>
                      <span>0.2</span>
                      <span>0.3</span>
                      <span>0.4</span>
                      <span>0.5</span>
                      <span>0.6</span>
                      <span>0.7</span>
                      <span>0.8</span>
                      <span>0.9</span>
                      <span>1.0</span>
                    </div>
                  </Form.Group>
                </div>

                {/* Voice Pitch */}
                <div className="tta_pitch_card">
                  <Form.Label className="tta_pitch_label">Voice Pitch</Form.Label>
                  <div className="tta_pitch_buttons">
                    {["Lower", "Normal", "Higher"].map((label, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        className={`tta_pitch_btn ${
                          listeningSettings.tta__listening_pitch == idx
                            ? "tta_pitch_btn_active"
                            : ""
                        }`}
                        onClick={() =>
                          handleChange({
                            target: {
                              name: "tta__listening_pitch",
                              value: idx,
                            },
                          })
                        }
                      >
                        {label}
                        {listeningSettings.tta__listening_pitch == idx && (
                          <span className="tta_pitch_check">
                            <i className="fas fa-circle"></i>
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                  <Form.Select
                    onChange={handleChange}
                    name="tta__listening_pitch"
                    id="tta__listening_pitch"
                    value={listeningSettings.tta__listening_pitch}
                    className="tta_hidden_select"
                  >
                    <option disabled>Default Listening Pitch</option>
                    {[0, 1, 2].map((pitch, index) => (
                      <option key={index} value={pitch}>
                        {pitch}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </>
            ) : (
              <>
                {/* For AtlasVoice TTS Pro (id == 3) and Google Cloud TTS (id == 4) - use new layout */}
                {(customizationSettings?.buttonSettings?.id == 3 || customizationSettings?.buttonSettings?.id == 4) ? (
                  <>
                    {/* Voice Language and Voice to Speak - Side by Side */}
                    <Row className="mb-3">
                      <Col xs={12} md={6}>
                        <div className="tta_voice_card">
                          <h3 className="tta_voice_card_title">
                            Voice Language
                            {customizationSettings?.buttonSettings?.id == 4 && (
                              <span className="tta_pro_badge ml-2">PRO</span>
                            )}
                          </h3>
                          <div className="tta_voice_select_wrapper">
                            <img
                              src={getLanguageFlag(
                                Object.keys(currentPlayerLanguages).find(
                                  key => key === listeningSettings.tta__listening_lang
                                ) || listeningSettings.tta__listening_lang
                              )}
                              alt="flag"
                              className="tta_voice_flag"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <Form.Select
                              onChange={handleChange}
                              name="tta__listening_lang"
                              id="tta__listening_lang"
                              value={listeningSettings.tta__listening_lang}
                              className="tta_orange_voice_select"
                            >
                              <option disabled>Default Listening Language</option>
                              {Object.keys(currentPlayerLanguages).map((langKey) => (
                                <option key={langKey} value={langKey}>
                                  {currentPlayerLanguages[langKey]}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        </div>
                      </Col>

                      {customizationSettings?.buttonSettings?.id == 4 && (
                        <Col xs={12} md={6}>
                          <div className="tta_voice_card">
                            <h3 className="tta_voice_card_title">Voice to speak</h3>
                            <Form.Select
                              onChange={handleChange}
                              name="tta__listening_voice"
                              id="tta__listening_voice"
                              value={listeningSettings.tta__listening_voice}
                              className="tta_orange_speak_select"
                            >
                              <option disabled>Default Listening Voice</option>
                              {currentPlayerFilteredVoices.map((voice, index) => (
                                <option
                                  key={index}
                                  data-lang={voice?.languageCodes?.[0]}
                                  value={[voice.name, voice.ssmlGender].join("-")}
                                >
                                  {voice.name} {"-"} {voice.ssmlGender}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        </Col>
                      )}
                    </Row>

                    {/* Audio Player - Blue styling for Google TTS */}
                    {customizationSettings?.buttonSettings?.id == 4 && (
                      <div className="tta_google_audio_player_card">
                        <audio
                          id="tts_audio_tag"
                          controls
                          className="tta_google_audio_player"
                        >
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
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* For ChatGPT TTS (id == 5) - use original layout */}
                    <div className="tta_voice_card mb-3">
                      <h3 className="tta_voice_card_title">
                        Default Voice Language
                      </h3>
                      <div className="tta_voice_select_wrapper">
                        <img
                          src={getLanguageFlag(
                            Object.keys(currentPlayerLanguages).find(
                              key => key === listeningSettings.tta__listening_lang
                            ) || listeningSettings.tta__listening_lang
                          )}
                          alt="flag"
                          className="tta_voice_flag"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <Form.Select
                          onChange={handleChange}
                          name="tta__listening_lang"
                          id="tta__listening_lang"
                          value={listeningSettings.tta__listening_lang}
                          className="tta_orange_voice_select"
                        >
                          <option disabled>Default Listening Language</option>
                          {Object.keys(currentPlayerLanguages).map((langKey) => (
                            <option key={langKey} value={langKey}>
                              {currentPlayerLanguages[langKey]}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>

                    {customizationSettings?.buttonSettings?.id != 3 && (
                      <div className="tta_preference_section">
                        <Form.Group>
                          <Form.Label className="tta_form_label">
                            Voice to speak
                          </Form.Label>
                          <Form.Select
                            onChange={handleChange}
                            name="tta__listening_voice"
                            id="tta__listening_voice"
                            value={listeningSettings.tta__listening_voice}
                            className="tta_form_select"
                          >
                            <option disabled>Default Listening Voice</option>
                            {currentPlayerFilteredVoices.map((voice, index) =>
                              customizationSettings?.buttonSettings?.id == 5 ? (
                                <option key={index} data-lang={voice} value={voice}>
                                  {voice}
                                </option>
                              ) : (
                                <option
                                  key={index}
                                  data-lang={voice.lang}
                                  value={voice.name}
                                >
                                  {voice.name}
                                </option>
                              )
                            )}
                          </Form.Select>
                        </Form.Group>

                        {customizationSettings?.buttonSettings?.id > 3 && (
                          <div className="tta_audio_player_wrapper">
                            <audio
                              id="tts_audio_tag"
                              controls
                              className="tta_audio_player"
                            >
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
                          </div>
                        )}
                      </div>
                    )}

                    {customizationSettings?.buttonSettings?.id == 5 && (
                      <>
                        <div className="tta_preference_section">
                          <Form.Group>
                            <Form.Label className="tta_form_label">
                              Voice Model
                            </Form.Label>
                            <Form.Select
                              onChange={handleChange}
                              name="tta__listening_voice_model"
                              id="tta__listening_voice_model"
                              value={listeningSettings.tta__listening_voice_model}
                              className="tta_form_select"
                            >
                              <option disabled>Default Listening Model</option>
                              <option value="tts-1">TTS-1</option>
                              <option value="tts-1-hd">TTS-1 HD</option>
                            </Form.Select>
                          </Form.Group>
                        </div>

                        <div className="tta_preference_section">
                          <Form.Group>
                            <div className="tta_slider_header">
                              <Form.Label className="tta_form_label">
                                Voice Speed
                              </Form.Label>
                              <span className="tta_slider_value">
                                {listeningSettings.tta__listening_rate}
                              </span>
                            </div>
                            <div className="tta_slider_wrapper">
                              <Form.Range
                                min="0.25"
                                max="4.0"
                                step="0.1"
                                name="tta__listening_rate"
                                id="tta__listening_rate"
                                onChange={handleChange}
                                value={listeningSettings.tta__listening_rate}
                                className="tta_slider"
                              />
                              <div className="tta_slider_labels">
                                <span className="tta_slider_label_start">0.25</span>
                                <span className="tta_slider_label_end">4.0</span>
                              </div>
                            </div>
                          </Form.Group>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Language Mapping Section - unchanged */}
            {Object.keys(multilingualActiveLanguages).length > 0 && (
              <div className="tta_mapping_section">
                <div className="tta_mapping_header">
                  <h3 className="tta_mapping_title">
                    {getActiveMultingualPluginName()} Plugin Language Mapping
                  </h3>
                  {!ttsObj.is_pro_active && (
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          Language mapping for WPML, GTranslate plugin is
                          available in the pro version.
                        </Tooltip>
                      }
                    >
                      <span className="tta_lock_icon">
                        <i className="fas fa-lock" />
                      </span>
                    </OverlayTrigger>
                  )}
                </div>

                {Object.keys(multilingualActiveLanguages).map(
                  (languageCode, index) => (
                    <div key={index} className="tta_language_mapping_card">
                      <div className="tta_mapping_row">
                        <div className="tta_mapping_col">
                          <Form.Group>
                            <Form.Label className="tta_mapping_label">
                              {multilingualActiveLanguages[languageCode]}
                            </Form.Label>
                            <div className="tta_mapping_input_wrapper">
                              <img
                                src={getLanguageFlag(languageCode)}
                                alt="flag"
                                className="tta_mapping_flag"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <Form.Select
                                onChange={handleChange}
                                name={"tta__multilingualActiveLanguages"}
                                id={
                                  "tta__multilingualActiveLanguages_index_" +
                                  index
                                }
                                value={languageCode}
                                className="tta_orange_select"
                              >
                                <option disabled>
                                  Default Listening Language
                                </option>
                                {Object.keys(multilingualActiveLanguages).map(
                                  (langCode, idx) => {
                                    return (
                                      <option key={idx} value={langCode}>
                                        {multilingualActiveLanguages[langCode]}
                                      </option>
                                    );
                                  }
                                )}
                              </Form.Select>
                            </div>
                          </Form.Group>
                        </div>

                        <div className="tta_mapping_col">
                          <Form.Label className="tta_mapping_label">
                            Select Language For{" "}
                            {multilingualActiveLanguages[languageCode]}
                          </Form.Label>
                          <Form.Select
                            onChange={(e) =>
                              handleChange(
                                e,
                                index,
                                customizationSettings?.buttonSettings?.id
                              )
                            }
                            name={"tta__currentPlayerLanguages"}
                            id={"tta__currentPlayerLanguages_index_" + index}
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
                            className="tta_orange_select"
                          >
                            <option disabled>Default Listening Language</option>
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
                        </div>

                        {customizationSettings?.buttonSettings?.id != 3 &&
                          Object.keys(currentPlayerLanguages).length && (
                            <div className="tta_mapping_col">
                              <Form.Label className="tta_mapping_label">
                                Select Voice For{" "}
                                {multilingualActiveLanguages[languageCode]}
                              </Form.Label>
                              <Form.Select
                                onChange={(e) =>
                                  handleChange(
                                    e,
                                    index,
                                    customizationSettings?.buttonSettings?.id
                                  )
                                }
                                name={"tta__available_currentPlayerVoices"}
                                id={
                                  "tta__available_currentPlayerVoices_index_" +
                                  index
                                }
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
                                className="tta_orange_select"
                              >
                                <option disabled>Current Player Voice</option>
                                {currentPlayerVoices.map((voice, idx) =>
                                  window.hasOwnProperty("ttsObjPro") &&
                                  customizationSettings?.buttonSettings?.id ==
                                    4 ? (
                                    <option
                                      key={idx}
                                      data-lang={voice?.languageCodes?.[0]}
                                      value={[
                                        voice.name,
                                        voice.ssmlGender,
                                      ].join("-")}
                                    >
                                      {voice.name} {"-"} {voice.ssmlGender}
                                    </option>
                                  ) : (
                                    <option
                                      key={idx}
                                      data-lang={voice.lang}
                                      value={voice.name}
                                    >
                                      {voice?.name || voice}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            </div>
                          )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div
              className="position-sticky bottom-0"
              style={{ zIndex: 1030, marginTop: "20px" }}
            >
              <div className="">
                <Button type="submit" className="tta_btn">
                  Save
                </Button>
              </div>
            </div>
          </Form>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <UpgradeToPro />
        </Col>
      </Row>
    </Container>
  );
}