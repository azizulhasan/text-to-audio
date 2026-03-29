import React from "react";
import { Col, Row, Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

import {
  CHATGPT_CLASSIC_VOICES,
  GPT4O_MINI_TTS_VOICES,
  chatGPTInstructionPresets,
} from "../../../context/utilities";

const MODELS = [
  {
    value: "tts-1",
    title: __("TTS-1", "text-to-audio"),
    description: __("Standard quality, low latency", "text-to-audio"),
    pricing: __("$15.00 / 1M characters", "text-to-audio"),
  },
  {
    value: "tts-1-hd",
    title: __("TTS-1 HD", "text-to-audio"),
    description: __("High definition audio quality", "text-to-audio"),
    pricing: __("$30.00 / 1M characters", "text-to-audio"),
  },
  {
    value: "gpt-4o-mini-tts",
    title: __("GPT-4o Mini TTS", "text-to-audio"),
    description: __("Best quality with voice instructions support", "text-to-audio"),
    pricing: __("~$0.60 / 1M input tokens + $12.00 / 1M output tokens", "text-to-audio"),
  },
];

export default function ChatGPTSettings({
  listeningSettings,
  setListeningSettings,
  currentPlayerLanguages,
  currentPlayerFilteredVoices,
  handleChange,
  baseMP3File,
  getLanguageFlag,
  onModelChange,
}) {
  const isGpt4oMini = listeningSettings.tta__listening_voice_model === "gpt-4o-mini-tts";

  const currentLanguageName =
    currentPlayerLanguages[listeningSettings.tta__listening_lang] ||
    listeningSettings.tta__listening_lang ||
    "English";

  const presets = chatGPTInstructionPresets(currentLanguageName);

  // Derive the effective preset from the actual instructions text.
  // If no preset key is saved, check whether the instructions match a known
  // preset value. When they don't (and are non-empty) fall back to "custom".
  const effectivePreset = (() => {
    const savedPreset = listeningSettings.tta__listening_instruction_preset;
    if (savedPreset) return savedPreset;

    const currentInstructions = (listeningSettings.tta__listening_instructions || "").trim();
    if (!currentInstructions) return "native";

    const matched = presets.find((p) => p.key !== "custom" && p.value === currentInstructions);
    return matched ? matched.key : "custom";
  })();

  const handleModelSelect = (modelValue) => {
    handleChange({
      target: {
        name: "tta__listening_voice_model",
        value: modelValue,
      },
    });
    if (typeof onModelChange === "function") {
      onModelChange(modelValue);
    }
  };

  const handlePresetChange = (e) => {
    const presetKey = e.target.value;
    const preset = presets.find((p) => p.key === presetKey);
    setListeningSettings({
      ...listeningSettings,
      tta__listening_instruction_preset: presetKey,
      tta__listening_instructions: preset ? preset.value : "",
    });
  };

  const handleInstructionsChange = (e) => {
    setListeningSettings({
      ...listeningSettings,
      tta__listening_instructions: e.target.value,
      tta__listening_instruction_preset: "custom",
    });
  };

  return (
    <>
      {/* Row 1: Voice Model - Radio Cards */}
      <div className="tta_chatgpt_speed_card mb-3">
        <h3 className="tta_voice_card_title mb-3">
          {__("Voice Model", "text-to-audio")}
        </h3>
        <Row>
          {MODELS.map((model) => (
            <Col xs={12} md={4} key={model.value}>
              <label
                className={`tta_model_card ${
                  listeningSettings.tta__listening_voice_model === model.value
                    ? "tta_model_card_selected"
                    : ""
                }`}
                style={{
                  display: "block",
                  padding: "16px",
                  border:
                    listeningSettings.tta__listening_voice_model === model.value
                      ? "2px solid #FF7853"
                      : "1px solid #dcdcde",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor:
                    listeningSettings.tta__listening_voice_model === model.value
                      ? "#FFF5F2"
                      : "#fff",
                  marginBottom: "12px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="radio"
                    name="tta__listening_voice_model"
                    value={model.value}
                    checked={listeningSettings.tta__listening_voice_model === model.value}
                    onChange={() => handleModelSelect(model.value)}
                    style={{ accentColor: "#FF7853" }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    {model.title}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px 24px" }}>
                  {model.description}
                </p>
                <p style={{ fontSize: "11px", color: "#999", margin: "0 0 0 24px" }}>
                  {model.pricing}
                </p>
              </label>
            </Col>
          ))}
        </Row>
      </div>

      {/* Row 2: Voice Language + Voice to Speak */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">
              {__("Voice Language", "text-to-audio")}
            </h3>
            <div className="tta_voice_select_wrapper">
              <img
                src={getLanguageFlag(
                  Object.keys(currentPlayerLanguages).find(
                    (key) => key === listeningSettings.tta__listening_lang
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
                <option disabled>
                  {__("Default Listening Language", "text-to-audio")}
                </option>
                {Object.keys(currentPlayerLanguages).map((langKey) => (
                  <option key={langKey} value={langKey}>
                    {currentPlayerLanguages[langKey]}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>

        <Col xs={12} md={6}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">
              {__("Voice to Speak", "text-to-audio")}
            </h3>
            <Form.Select
              onChange={handleChange}
              name="tta__listening_voice"
              id="tta__listening_voice"
              value={listeningSettings.tta__listening_voice}
              className="tta_orange_speak_select"
            >
              <option disabled>
                {__("Default Listening Voice", "text-to-audio")}
              </option>
              {currentPlayerFilteredVoices.map((voice, index) => (
                <option key={index} data-lang={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* Row 3: Voice Instructions (only for gpt-4o-mini-tts) */}
      {isGpt4oMini && (
        <div className="tta_chatgpt_speed_card mb-3">
          <h3 className="tta_voice_card_title mb-3">
            {__("Voice Instructions", "text-to-audio")}
          </h3>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            {__(
              "Guide how the voice should sound. Instructions are sent to the AI model to control accent, tone, and speaking style.",
              "text-to-audio"
            )}
          </p>

          <Form.Group className="mb-3">
            <Form.Label className="tta_slider_label">
              {__("Instruction Preset", "text-to-audio")}
            </Form.Label>
            <Form.Select
              value={effectivePreset}
              onChange={handlePresetChange}
              className="tta_orange_speak_select"
            >
              {presets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="tta_slider_label">
              {__("Instructions", "text-to-audio")}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="tta__listening_instructions"
              id="tta__listening_instructions"
              value={listeningSettings.tta__listening_instructions || ""}
              onChange={handleInstructionsChange}
              placeholder={__(
                "Enter custom instructions for the voice...",
                "text-to-audio"
              )}
              style={{ fontSize: "13px" }}
            />
          </Form.Group>
        </div>
      )}

      {/* Row 4: Voice Speed */}
      <div className="tta_chatgpt_speed_card">
        <Form.Group>
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">
              {__("Voice Speed", "text-to-audio")}
            </Form.Label>
            <span className="tta_chatgpt_slider_value">
              {listeningSettings.tta__listening_rate}
            </span>
          </div>
          <div className="tta_slider_container">
            <Form.Range
              min="0.25"
              max="4.0"
              step="0.25"
              name="tta__listening_rate"
              id="tta__listening_rate"
              onChange={handleChange}
              value={listeningSettings.tta__listening_rate}
              className="tta_chatgpt_slider"
            />
            <div className="tta_chatgpt_slider_ticks">
              {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0].map(
                (tick, index) => (
                  <div key={index} className="tta_slider_tick"></div>
                )
              )}
            </div>
          </div>
          <div className="tta_chatgpt_slider_labels">
            <span>0.25</span>
            <span>0.5</span>
            <span>1.0</span>
            <span>1.5</span>
            <span>2.0</span>
            <span>2.5</span>
            <span>3.0</span>
            <span>3.5</span>
            <span>4.0</span>
          </div>
        </Form.Group>
      </div>

      {/* Row 5: Audio Player */}
      <div className="tta_chatgpt_audio_player_card">
        <audio id="tts_audio_tag" controls className="tta_chatgpt_audio_player">
          <source id="tts_audio_wav" src={baseMP3File} type="audio/wav" />
          <source id="tts_audio_mp3" src={baseMP3File} type="audio/mpeg" />
          {__(
            "Your browser does not support the audio element.",
            "text-to-audio"
          )}
        </audio>
      </div>
    </>
  );
}
