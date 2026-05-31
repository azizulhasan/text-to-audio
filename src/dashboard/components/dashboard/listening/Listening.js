import React, { useEffect, useState, useMemo } from "react";
import {
  Col,
  Container,
  Row,
  Form,
  Button,
} from "react-bootstrap";
import { __ } from "@wordpress/i18n";

import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";

// Hooks
import useVoiceLoader from "./hooks/useVoiceLoader";
import useMultilingualDetection from "./hooks/useMultilingualDetection";

// TTS Provider Components
import DefaultPlayerSettings from "./tts-providers/DefaultPlayerSettings";
import GoogleCloudSettings from "./tts-providers/GoogleCloudSettings";
import ChatGPTSettings from "./tts-providers/ChatGPTSettings";
import ElevenLabsSettings from "./tts-providers/ElevenLabsSettings";

// Multilingual
import LanguageMapping from "./LanguageMapping";
import { getLanguageFlag } from "./utils";

export default function Listening() {
  const [customizationSettings, setCustomizationSettings] = useState({});
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
    tta__listening_instructions: "",
    tta__listening_instruction_preset: "native",
    tta__elevenlabs_model: "eleven_multilingual_v2",
    tta__elevenlabs_output_format: "mp3_44100_128",
    tta__elevenlabs_stability: "",
    tta__elevenlabs_similarity_boost: "",
    tta__elevenlabs_style: "",
    tta__elevenlabs_speed: 1.0,
    tta__elevenlabs_speaker_boost: true,
  });

  // TTS-249: no hardcoded remote preview URL in the free bundle (wp.org Guideline 8).
  // Pro voice previews use the provider-supplied preview_url at runtime.
  const [baseMP3File, setBaseMP3File] = useState("");
  const [isListeningSettingsLoaded, setIsListeningSettingsLoaded] =
    useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────
  const {
    currentPlayerVoices,
    currentPlayerLanguages,
    currentPlayerFilteredVoices,
    speechSynthesisVoices,
    elevenLabsVoices,
    languageMissingMessage,
    setCurrentPlayerFilteredVoices,
    setGPTVoicesAndLanguages,
    setGoogleVoicesAndLanguages,
    setVoicesAndLanguages,
    setElevenLabsVoicesAndLanguages,
    addElevenLabsVoice,
  } = useVoiceLoader(customizationSettings, listeningSettings.tta__listening_voice_model);

  const { multilingualActiveLanguages, activePluginName } =
    useMultilingualDetection();

  // ── Audio preview effect ───────────────────────────────────────────
  useEffect(() => {
    console.log({
      pro: ttsObj.is_atlasvoice_addon_functional,
      id: customizationSettings?.buttonSettings?.id,
    });
    // TTS-249: removed the hardcoded cdn.openai.com sample preview (Guideline 8).

    if (
      window.hasOwnProperty("ttsObj") &&
      ttsObj.is_atlasvoice_addon_functional &&
      customizationSettings?.buttonSettings?.id == 6 &&
      elevenLabsVoices.length > 0
    ) {
      const firstVoice = elevenLabsVoices[0];
      if (firstVoice?.preview_url) {
        setBaseMP3File(firstVoice.preview_url);
        const audio_wav = document.getElementById("tts_audio_wav");
        const audio_mp3 = document.getElementById("tts_audio_mp3");
        const audio_tag = document.getElementById("tts_audio_tag");

        if (audio_wav && audio_mp3 && audio_tag) {
          audio_wav.src = firstVoice.preview_url;
          audio_mp3.src = firstVoice.preview_url;
          audio_tag.load();
        }
      }
    }
  }, [customizationSettings, elevenLabsVoices]);

  // ── Initial data load ──────────────────────────────────────────────
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
        if (!res.data.buttonSettings) {
          res.data.buttonSettings = { id: 1 };
        } else if (!res.data.buttonSettings.id) {
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

  // ── Refetch ElevenLabs voices when listening language changes ──────
  useEffect(() => {
    if (
      window.hasOwnProperty("ttsObj") &&
      ttsObj.is_atlasvoice_addon_functional &&
      customizationSettings?.buttonSettings?.id == 6 &&
      listeningSettings.tta__listening_lang
    ) {
      setElevenLabsVoicesAndLanguages(listeningSettings.tta__listening_lang);
    }
  }, [
    customizationSettings?.buttonSettings?.id,
    listeningSettings.tta__listening_lang,
  ]);

  // ── Sync multilingual languages to listening settings ──────────────
  useEffect(() => {
    if (Object.keys(multilingualActiveLanguages).length) {
      setListeningSettings((prev) => ({
        ...prev,
        tta__listening_activeLanguages_mapping: multilingualActiveLanguages,
      }));
    }
  }, [multilingualActiveLanguages]);

  // ── Form submit ────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(e.target);

    let formData = {};
    for (let [key, value] of form.entries()) {
      if (key === "" || value === "") {
        toast(__("Please fill the  field : ", "text-to-audio") + key);
        return;
      }
      if (
        key === "tta__available_currentPlayerVoices" ||
        "tta__currentPlayerLanguages" === key ||
        "tta__multilingualActiveLanguages" === key
      ) {
        if (!ttsObj.is_atlasvoice_addon_functional) {
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
        toast(__("Listening settings saved. Now all setup done. Enjoy", "text-to-audio"), "info", {
          autoClose: 15000,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // ── Field change handler ───────────────────────────────────────────
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
      // ElevenLabs uses preview_url from the voice object
      if (customizationSettings?.buttonSettings?.id == 6) {
        const voiceIdPart = e.target.value.split('::')[0];
        const selectedVoice = elevenLabsVoices.find(v => v.voice_id === voiceIdPart);
        if (selectedVoice?.preview_url) {
          const audio_wav = document.getElementById("tts_audio_wav");
          const audio_mp3 = document.getElementById("tts_audio_mp3");
          const audio_tag = document.getElementById("tts_audio_tag");

          if (audio_wav && audio_mp3 && audio_tag) {
            audio_wav.src = selectedVoice.preview_url;
            audio_mp3.src = selectedVoice.preview_url;
            audio_tag.load();
            audio_tag.play();
          }
        }
      }
      // TTS-249: removed hardcoded cloud.google.com / cdn.openai.com sample preview
      // URLs (wp.org Guideline 8). Google/OpenAI dashboard voice previews are no
      // longer played from remote docs samples bundled in the plugin; ElevenLabs
      // continues to use its API-provided preview_url above.
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

  // ── Derived values ─────────────────────────────────────────────────
  const playerId = customizationSettings?.buttonSettings?.id;
  const isDefaultPlayer = playerId < 3;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Container>
      <Row>
        <Col xs={12} sm={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 mt-3 shadow-sm">
            <h2 className="tta_listening_title">{__("Listening Preferences", "text-to-audio")}</h2>
            <p className="tta_listening_subtitle">
              {__("Set your listening preferences with different voices and languages.", "text-to-audio")}
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {isDefaultPlayer ? (
              <DefaultPlayerSettings
                listeningSettings={listeningSettings}
                currentPlayerLanguages={currentPlayerLanguages}
                currentPlayerFilteredVoices={currentPlayerFilteredVoices}
                handleChange={handleChange}
              />
            ) : playerId == 3 || playerId == 4 ? (
              <GoogleCloudSettings
                listeningSettings={listeningSettings}
                customizationSettings={customizationSettings}
                currentPlayerLanguages={currentPlayerLanguages}
                currentPlayerFilteredVoices={currentPlayerFilteredVoices}
                handleChange={handleChange}
                baseMP3File={baseMP3File}
              />
            ) : playerId == 5 ? (
              <ChatGPTSettings
                listeningSettings={listeningSettings}
                setListeningSettings={setListeningSettings}
                currentPlayerLanguages={currentPlayerLanguages}
                currentPlayerFilteredVoices={currentPlayerFilteredVoices}
                handleChange={handleChange}
                baseMP3File={baseMP3File}
                getLanguageFlag={getLanguageFlag}
                onModelChange={(model) => setGPTVoicesAndLanguages(model)}
              />
            ) : playerId == 6 ? (
              <ElevenLabsSettings
                listeningSettings={listeningSettings}
                setListeningSettings={setListeningSettings}
                currentPlayerLanguages={currentPlayerLanguages}
                elevenLabsVoices={elevenLabsVoices}
                addElevenLabsVoice={addElevenLabsVoice}
                handleChange={handleChange}
                baseMP3File={baseMP3File}
              />
            ) : null}

            <LanguageMapping
              multilingualActiveLanguages={multilingualActiveLanguages}
              activePluginName={activePluginName}
              listeningSettings={listeningSettings}
              customizationSettings={customizationSettings}
              currentPlayerLanguages={currentPlayerLanguages}
              currentPlayerVoices={currentPlayerVoices}
              elevenLabsVoices={elevenLabsVoices}
              handleChange={handleChange}
            />

            <div
              className="position-sticky bottom-0"
              style={{ zIndex: 1030, marginTop: "20px" }}
            >
              <div className="">
                <Button type="submit" className="tta_btn">
                  {__('Save', 'text-to-audio')}
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
