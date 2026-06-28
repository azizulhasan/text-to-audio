import React from "react";
import { Col, Row, Form, Button } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import Icon from "../../../Icon";
import { getLanguageFlag, generateSpeedTicks, generateVolumeTicks } from "../utils";

export default function DefaultPlayerSettings({
  listeningSettings,
  currentPlayerLanguages,
  currentPlayerFilteredVoices,
  handleChange,
}) {
  return (
    <>
      {/* Voice Language and Voice to Speak - Side by Side */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Voice Language", "text-to-audio")}</h3>
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
                <option disabled>{__("Default Listening Language", "text-to-audio")}</option>
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
            <h3 className="tta_voice_card_title">{__("Voice to speak", "text-to-audio")}</h3>
            <Form.Select
              onChange={handleChange}
              name="tta__listening_voice"
              id="tta__listening_voice"
              value={listeningSettings.tta__listening_voice}
              className="tta_orange_speak_select"
            >
              <option disabled>{__("Default Listening Voice", "text-to-audio")}</option>
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
              {__("Voice Speed", "text-to-audio")}
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
              value={listeningSettings.tta__listening_rate ?? 1}
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
              {__("Voice Volume", "text-to-audio")}
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
              value={listeningSettings.tta__listening_volume ?? 1}
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
        <Form.Label className="tta_pitch_label">{__("Voice Pitch", "text-to-audio")}</Form.Label>
        <div className="tta_pitch_buttons">
          {["Lower", "Normal", "Higher"].map((label, idx) => (
            <Button
              key={idx}
              type="button"
              className={`tta_pitch_btn ${
                (listeningSettings.tta__listening_pitch ?? 1) == idx
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
              {(listeningSettings.tta__listening_pitch ?? 1) == idx && (
                <span className="tta_pitch_check">
                  <Icon name="circle" />
                </span>
              )}
            </Button>
          ))}
        </div>
        <Form.Select
          onChange={handleChange}
          name="tta__listening_pitch"
          id="tta__listening_pitch"
          value={listeningSettings.tta__listening_pitch ?? 1}
          className="tta_hidden_select"
        >
          <option disabled>{__("Default Listening Pitch", "text-to-audio")}</option>
          {[0, 1, 2].map((pitch, index) => (
            <option key={index} value={pitch}>
              {pitch}
            </option>
          ))}
        </Form.Select>
      </div>
    </>
  );
}
