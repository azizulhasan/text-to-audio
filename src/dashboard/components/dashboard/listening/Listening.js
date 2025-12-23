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
      // Initialize an empty object
      const languageObject = {};

      // Populate the object using a loop
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

      // Initialize an empty object
      const languageObject = {};
      let active_languages = Object.keys(gtranslateActiveLanguages);

      // Populate the object using a loop
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

      // Initialize an empty object
      const languageObject = {};

      // Populate the object using a loop
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

    /**
     * Set listening data.
     */
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

    /**
     * Get customize settings.
     */
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

  /**
   * Handle form Submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
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
  /**
   * handle change
   * @param {*} e
   */
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
    // Map language codes to country codes for flags
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

  return (
    <Container>
      <Row>
        <Col xs={12} sm={12} lg={8}>
          <div className="tta_listening_header">
            <h2 className="tta_listening_title">Listening Preferences</h2>
            <p className="tta_listening_subtitle">
              Set your listening preferences with different voices and
              languages.
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* Default Voice Language Section */}
            <div className="tta_preference_section">
              <div className="tta_section_header">
                <label className="tta_section_label">
                  Default Voice Language
                  {customizationSettings?.buttonSettings?.id == 4 && (
                    <span className="tta_pro_badge">PRO</span>
                  )}
                </label>
              </div>

              <div className="tta_language_selector_wrapper">
                <div className="tta_language_display">
                  <img
                    src={getLanguageFlag(listeningSettings.tta__listening_lang)}
                    alt="flag"
                    className="tta_language_flag"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="tta_language_name">
                    {getCurrentLanguageName()}
                  </span>
                  <Button
                    variant="link"
                    className="tta_language_check_btn"
                    onClick={() => setSearchQuery("")}
                  >
                    ✓
                  </Button>
                </div>

                <InputGroup className="tta_search_wrapper">
                  <InputGroup.Text className="tta_search_icon">
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search here to change it"
                    className="tta_search_input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                {searchQuery && (
                  <div className="tta_language_dropdown">
                    {Object.keys(filteredLanguages).length > 0 ? (
                      Object.keys(filteredLanguages).map((langKey, index) => (
                        <div
                          key={index}
                          className="tta_language_option"
                          onClick={() => {
                            handleChange({
                              target: {
                                name: "tta__listening_lang",
                                value:
                                  customizationSettings?.buttonSettings?.id < 3
                                    ? filteredLanguages[langKey]
                                    : langKey,
                              },
                            });
                            setSearchQuery("");
                          }}
                        >
                          <img
                            src={getLanguageFlag(langKey)}
                            alt="flag"
                            className="tta_language_flag"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <span>{filteredLanguages[langKey]}</span>
                        </div>
                      ))
                    ) : (
                      <div className="tta_no_results">No languages found</div>
                    )}
                  </div>
                )}

                <Form.Select
                  onChange={handleChange}
                  name="tta__listening_lang"
                  id="tta__listening_lang"
                  value={listeningSettings.tta__listening_lang}
                  className="tta_hidden_select"
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
              </div>

              {languageMissingMessage && (
                <div className="tta_info_message">
                  <i className="fas fa-info-circle"></i>
                  {languageMissingMessage}
                </div>
              )}
            </div>

            {/* Voice to Speak Section */}
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
                      window.hasOwnProperty("ttsObjPro") &&
                      customizationSettings?.buttonSettings?.id == 4 ? (
                        <option
                          key={index}
                          data-lang={voice?.languageCodes?.[0]}
                          value={[voice.name, voice.ssmlGender].join("-")}
                        >
                          {voice.name} {"-"} {voice.ssmlGender}
                        </option>
                      ) : customizationSettings?.buttonSettings?.id == 5 ? (
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

            {/* Voice Model Section for ChatGPT */}
            {customizationSettings?.buttonSettings?.id == 5 && (
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
            )}

            {/* Voice Speed Slider */}
            {(customizationSettings?.buttonSettings?.id < 3 ||
              customizationSettings?.buttonSettings?.id == 5) && (
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
                      min={
                        customizationSettings?.buttonSettings?.id == 5
                          ? "0.25"
                          : "0.1"
                      }
                      max={
                        customizationSettings?.buttonSettings?.id == 5
                          ? "4.0"
                          : "10"
                      }
                      step="0.1"
                      name="tta__listening_rate"
                      id="tta__listening_rate"
                      onChange={handleChange}
                      value={listeningSettings.tta__listening_rate}
                      className="tta_slider"
                    />
                    <div className="tta_slider_labels">
                      <span className="tta_slider_label_start">
                        {customizationSettings?.buttonSettings?.id == 5
                          ? "0.25"
                          : "0.1"}
                      </span>
                      <span className="tta_slider_label_end">
                        {customizationSettings?.buttonSettings?.id == 5
                          ? "4.0"
                          : "10.0"}
                      </span>
                    </div>
                  </div>
                </Form.Group>
              </div>
            )}

            {/* Voice Volume and Pitch for Default Player */}
            {customizationSettings?.buttonSettings?.id < 3 && (
              <>
                <div className="tta_preference_section">
                  <Form.Group>
                    <div className="tta_slider_header">
                      <Form.Label className="tta_form_label">
                        Voice Volume
                      </Form.Label>
                      <span className="tta_slider_value">
                        {listeningSettings.tta__listening_volume}
                      </span>
                    </div>
                    <div className="tta_slider_wrapper">
                      <Form.Range
                        min="0"
                        max="1"
                        step="0.1"
                        name="tta__listening_volume"
                        id="tta__listening_volume"
                        onChange={handleChange}
                        value={listeningSettings.tta__listening_volume}
                        className="tta_slider"
                      />
                      <div className="tta_slider_labels">
                        <span className="tta_slider_label_start">0</span>
                        <span className="tta_slider_label_end">1.0</span>
                      </div>
                    </div>
                  </Form.Group>
                </div>

                <div className="tta_preference_section">
                  <Form.Group>
                    <Form.Label className="tta_form_label">
                      Voice Pitch
                    </Form.Label>
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
                      {[0, 1, 2].map((pitch, index) => {
                        return (
                          <option key={index} value={pitch}>
                            {pitch}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </div>
              </>
            )}

            {/* Language Mapping Section */}
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
                                className="tta_mapping_select"
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
                            className="tta_mapping_select"
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
                                className="tta_mapping_select"
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

                      <Button variant="link" className="tta_delete_mapping_btn">
                        <i className="fas fa-times"></i>
                      </Button>
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
