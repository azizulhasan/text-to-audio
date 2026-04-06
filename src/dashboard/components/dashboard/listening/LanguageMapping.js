import React from "react";
import { Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { __, sprintf } from "@wordpress/i18n";
import Icon from "../../Icon";
import { getLanguageFlag } from "./utils";

export default function LanguageMapping({
  multilingualActiveLanguages,
  activePluginName,
  listeningSettings,
  customizationSettings,
  currentPlayerLanguages,
  currentPlayerVoices,
  elevenLabsVoices,
  handleChange,
}) {
  if (!Object.keys(multilingualActiveLanguages).length) {
    return null;
  }

  const playerId = customizationSettings?.buttonSettings?.id;

  return (
    <div className="tta_mapping_section">
      <div className="tta_mapping_header">
        <h3 className="tta_mapping_title">
          {activePluginName} Plugin Language Mapping
        </h3>
        {!ttsObj.is_pro_active && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {sprintf(
                  /* translators: %1$s, %2$s, %3$s: plugin names (brand names, not translatable) */
                  __("Language mapping for %1$s, %2$s, %3$s plugin is available in the pro version.", "text-to-audio"),
                  "WPML",
                  "GTranslate",
                  "Polylang"
                )}
              </Tooltip>
            }
          >
            <span className="tta_lock_icon">
              <Icon name="lock" />
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
                        {__("Default Listening Language", "text-to-audio")}
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
                  {__('Select Language For{" "}', "text-to-audio")}
                  {multilingualActiveLanguages[languageCode]}
                </Form.Label>
                <Form.Select
                  onChange={(e) =>
                    handleChange(
                      e,
                      index,
                      playerId
                    )
                  }
                  name={"tta__currentPlayerLanguages"}
                  id={"tta__currentPlayerLanguages_index_" + index}
                  value={
                    listeningSettings?.tta__currentPlayerLanguages?.[
                      playerId
                    ]?.[index] ??
                    Object.keys(currentPlayerLanguages).filter(
                      (lang) => {
                        if (playerId < 3) {
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
                  <option disabled>{__("Default Listening Language", "text-to-audio")}</option>
                  {Object.keys(currentPlayerLanguages).map(
                    (langKey, idx) => {
                      return (
                        <option
                          key={idx}
                          value={
                            playerId < 3
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

              {playerId != 3 &&
                Object.keys(currentPlayerLanguages).length && (
                  <div className="tta_mapping_col">
                    <Form.Label className="tta_mapping_label">
                      {__('Select Voice For{" "}', "text-to-audio")}
                      {multilingualActiveLanguages[languageCode]}
                    </Form.Label>
                    <Form.Select
                      onChange={(e) =>
                        handleChange(
                          e,
                          index,
                          playerId
                        )
                      }
                      name={"tta__available_currentPlayerVoices"}
                      id={
                        "tta__available_currentPlayerVoices_index_" +
                        index
                      }
                      value={
                        playerId == 5
                          ? listeningSettings.tta__listening_voice
                          : (listeningSettings
                              ?.tta__available_currentPlayerVoices?.[
                              playerId
                            ]?.[index] ??
                            Object.values(currentPlayerVoices).filter(
                              (voice) => {
                                if (playerId < 3) {
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
                      <option disabled>{__("Current Player Voice", "text-to-audio")}</option>
                      {playerId == 6 ? (
                        elevenLabsVoices.map((voice, idx) => {
                          const firstName = voice.name ? voice.name.split(/[\s\-]/)[0].trim() : '';
                          const optionValue = voice.voice_id + '::' + firstName;
                          return (
                            <option key={idx} value={optionValue}>
                              {voice.name} {voice.labels?.accent ? `(${voice.labels.accent})` : ''}
                            </option>
                          );
                        })
                      ) : (
                        currentPlayerVoices.map((voice, idx) =>
                          window.hasOwnProperty("ttsObjPro") &&
                          playerId == 4 ? (
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
  );
}
