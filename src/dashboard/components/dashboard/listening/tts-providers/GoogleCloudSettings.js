import React from "react";
import { Col, Row, Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { getLanguageFlag } from "../utils";

export default function GoogleCloudSettings({
  listeningSettings,
  customizationSettings,
  currentPlayerLanguages,
  currentPlayerFilteredVoices,
  handleChange,
  baseMP3File,
}) {
  const playerId = customizationSettings?.buttonSettings?.id;

  return (
    <>
      {/* Voice Language and Voice to Speak - Side by Side */}
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

        {playerId == 4 && (
          <Col xs={12} md={6}>
            <div className="tta_voice_card">
              <h3 className="tta_voice_card_title">{__("Voice to speak", "text-to-audio")}</h3>
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
      {playerId == 4 && (
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
            {__("Your browser does not support the audio element.", "text-to-audio")}
          </audio>
        </div>
      )}
    </>
  );
}
