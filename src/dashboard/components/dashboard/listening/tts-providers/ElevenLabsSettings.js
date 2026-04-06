import React from "react";
import { Col, Row, Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { getLanguageFlag } from "../utils";

export default function ElevenLabsSettings({
  listeningSettings,
  currentPlayerLanguages,
  elevenLabsVoices,
  handleChange,
  baseMP3File,
}) {
  return (
    <>
      {/* Voice Language, Voice to Speak, and Model - Three Columns */}
      <Row className="mb-3">
        <Col xs={12} md={4}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Voice Language", "text-to-audio")}</h3>
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
                <option disabled>{__("Default Listening Language", "text-to-audio")}</option>
                {Object.keys(currentPlayerLanguages).map((langKey) => (
                  <option key={langKey} value={langKey}>
                    {currentPlayerLanguages[langKey]}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>

        <Col xs={12} md={4}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Voice to speak", "text-to-audio")}</h3>
            <Form.Select
              onChange={handleChange}
              name="tta__listening_voice"
              id="tta__listening_voice"
              value={listeningSettings.tta__listening_voice}
              className="tta_orange_speak_select"
            >
              <option disabled>{__("Default Listening Voice", "text-to-audio")}</option>
              {elevenLabsVoices.map((voice, index) => {
                const firstName = voice.name ? voice.name.split(/[\s\-]/)[0].trim() : '';
                const optionValue = voice.voice_id + '::' + firstName;
                return (
                  <option key={index} value={optionValue}>
                    {voice.name} {voice.labels?.accent ? `(${voice.labels.accent})` : ''}
                  </option>
                );
              })}
            </Form.Select>
          </div>
        </Col>

        <Col xs={12} md={4}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Model", "text-to-audio")}</h3>
            <Form.Select
              onChange={handleChange}
              name="tta__elevenlabs_model"
              id="tta__elevenlabs_model"
              value={listeningSettings.tta__elevenlabs_model}
              className="tta_orange_speak_select"
            >
              <option value="eleven_multilingual_v2">{__("Multilingual v2", "text-to-audio")}</option>
              <option value="eleven_turbo_v2_5">{__("Turbo v2.5", "text-to-audio")}</option>
              <option value="eleven_flash_v2_5">{__("Flash v2.5", "text-to-audio")}</option>
              <option value="eleven_v3">{__("Eleven v3", "text-to-audio")}</option>
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* Output Format */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Output Format", "text-to-audio")}</h3>
            <Form.Select
              onChange={handleChange}
              name="tta__elevenlabs_output_format"
              id="tta__elevenlabs_output_format"
              value={listeningSettings.tta__elevenlabs_output_format}
              className="tta_orange_speak_select"
            >
              <option value="mp3_44100_128">{__("MP3 44100Hz 128kbps (Default)", "text-to-audio")}</option>
              <option value="mp3_44100_192">{__("MP3 44100Hz 192kbps", "text-to-audio")}</option>
              <option value="mp3_44100_96">{__("MP3 44100Hz 96kbps", "text-to-audio")}</option>
              <option value="mp3_44100_64">{__("MP3 44100Hz 64kbps", "text-to-audio")}</option>
              <option value="mp3_22050_32">{__("MP3 22050Hz 32kbps", "text-to-audio")}</option>
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* Stability Slider */}
      <div className="tta_chatgpt_speed_card">
        <Form.Group className="mb-4">
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">
              {__("Stability", "text-to-audio")}
            </Form.Label>
            <span className="tta_chatgpt_slider_value">
              {listeningSettings.tta__elevenlabs_stability}
            </span>
          </div>
          <div className="tta_slider_container">
            <Form.Range
              min="0"
              max="1"
              step="0.05"
              name="tta__elevenlabs_stability"
              id="tta__elevenlabs_stability"
              onChange={handleChange}
              value={listeningSettings.tta__elevenlabs_stability}
              className="tta_chatgpt_slider"
            />
          </div>
          <div className="tta_chatgpt_slider_labels">
            <span>{__("More variable", "text-to-audio")}</span>
            <span>{__("More stable", "text-to-audio")}</span>
          </div>
        </Form.Group>

        {/* Similarity Boost Slider */}
        <Form.Group className="mb-4">
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">
              {__("Similarity Boost", "text-to-audio")}
            </Form.Label>
            <span className="tta_chatgpt_slider_value">
              {listeningSettings.tta__elevenlabs_similarity_boost}
            </span>
          </div>
          <div className="tta_slider_container">
            <Form.Range
              min="0"
              max="1"
              step="0.05"
              name="tta__elevenlabs_similarity_boost"
              id="tta__elevenlabs_similarity_boost"
              onChange={handleChange}
              value={listeningSettings.tta__elevenlabs_similarity_boost}
              className="tta_chatgpt_slider"
            />
          </div>
          <div className="tta_chatgpt_slider_labels">
            <span>{__("Low", "text-to-audio")}</span>
            <span>{__("High", "text-to-audio")}</span>
          </div>
        </Form.Group>

        {/* Style Exaggeration Slider */}
        <Form.Group className="mb-4">
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">
              {__("Style Exaggeration", "text-to-audio")}
            </Form.Label>
            <span className="tta_chatgpt_slider_value">
              {listeningSettings.tta__elevenlabs_style}
            </span>
          </div>
          <div className="tta_slider_container">
            <Form.Range
              min="0"
              max="1"
              step="0.05"
              name="tta__elevenlabs_style"
              id="tta__elevenlabs_style"
              onChange={handleChange}
              value={listeningSettings.tta__elevenlabs_style}
              className="tta_chatgpt_slider"
            />
          </div>
          <div className="tta_chatgpt_slider_labels">
            <span>{__("None", "text-to-audio")}</span>
            <span>{__("Exaggerated", "text-to-audio")}</span>
          </div>
        </Form.Group>

        {/* Speed Slider */}
        <Form.Group className="mb-4">
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">
              {__("Speed", "text-to-audio")}
            </Form.Label>
            <span className="tta_chatgpt_slider_value">
              {listeningSettings.tta__elevenlabs_speed}
            </span>
          </div>
          <div className="tta_slider_container">
            <Form.Range
              min="0.7"
              max="1.2"
              step="0.05"
              name="tta__elevenlabs_speed"
              id="tta__elevenlabs_speed"
              onChange={handleChange}
              value={listeningSettings.tta__elevenlabs_speed}
              className="tta_chatgpt_slider"
            />
          </div>
          <div className="tta_chatgpt_slider_labels">
            <span>0.7</span>
            <span>1.0</span>
            <span>1.2</span>
          </div>
        </Form.Group>

        {/* Speaker Boost Toggle */}
        <Form.Group className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <Form.Label className="tta_slider_label mb-0">
              {__("Speaker Boost", "text-to-audio")}
            </Form.Label>
            <Form.Check
              type="switch"
              id="tta__elevenlabs_speaker_boost"
              name="tta__elevenlabs_speaker_boost"
              checked={listeningSettings.tta__elevenlabs_speaker_boost === true || listeningSettings.tta__elevenlabs_speaker_boost === 'true'}
              onChange={(e) => {
                handleChange({
                  target: {
                    name: "tta__elevenlabs_speaker_boost",
                    value: e.target.checked,
                  },
                });
              }}
            />
          </div>
        </Form.Group>
      </div>

      {/* Audio Player */}
      <div className="tta_chatgpt_audio_player_card">
        <audio
          id="tts_audio_tag"
          controls
          className="tta_chatgpt_audio_player"
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
          {__("Your browser does not support the audio element.", "text-to-audio")}
        </audio>
      </div>
    </>
  );
}
