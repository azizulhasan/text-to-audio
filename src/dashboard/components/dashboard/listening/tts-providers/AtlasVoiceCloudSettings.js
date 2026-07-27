import React, { useMemo } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

// TTS-266: the catalogue is a shared JS module (same approach player 3 uses for
// its language list), not data localised from PHP — so the dashboard and the
// front-end player read exactly the same source.
import {
  ATLASVOICE_LANGUAGES,
  getAtlasVoiceLanguages,
  getAtlasVoicesForLanguage,
} from "../../../../../../admin/js/tts/atlasvoice-voices";

/**
 * TTS-266 — Listening settings for player 7 (AtlasVoice Cloud).
 *
 * Player 1 reads voices from window.speechSynthesis, which is exactly the
 * device-dependency this player exists to remove. So this panel is driven by a
 * catalogue bundled in the plugin (ttsObj.atlasVoiceVoices) — no external
 * request is made just to render the screen, which also keeps wp.org
 * Guideline 7 satisfied: nothing leaves the site until the owner opts in below
 * AND a visitor actually plays something.
 */

export default function AtlasVoiceCloudSettings({
  listeningSettings,
  handleChange,
}) {
  const languages = useMemo(() => getAtlasVoiceLanguages(), []);

  /**
   * Existing sites arrive here carrying player 1's values — a bare language like
   * "en" and a browser voice name like "Google UK English Female" — neither of
   * which exists in this catalogue. Resolve both to something real, otherwise
   * the selects silently show the wrong language and an empty voice list.
   */
  const selectedLang = useMemo(() => {
    const saved = listeningSettings?.tta__listening_lang || "";
    if (languages.includes(saved)) return saved;

    // "en" -> first "en-*" in the catalogue.
    const base = String(saved).split(/[-_]/)[0].toLowerCase();
    const match = languages.find((l) => l.split("-")[0].toLowerCase() === base);

    return match || languages[0] || "en-US";
  }, [listeningSettings?.tta__listening_lang, languages]);

  const voicesForLang = useMemo(
    () => getAtlasVoicesForLanguage(selectedLang),
    [selectedLang]
  );

  const selectedVoice = useMemo(() => {
    const saved = listeningSettings?.tta__listening_voice || "";
    const known = voicesForLang.some((v) => v.id === saved);

    return known ? saved : voicesForLang[0]?.id || "";
  }, [listeningSettings?.tta__listening_voice, voicesForLang]);

  const isEnabled = !!listeningSettings?.tta__atlasvoice_cloud_enabled;

  return (
    <>
      {/* ── Consent ─────────────────────────────────────────────────── */}
      <div className="tta-card mb-3 p-3">
        <h5 className="fw-semibold mb-2">
          {__("AtlasVoice Cloud", "text-to-audio")}
        </h5>
        <p className="text-secondary small mb-3">
          {__(
            "This player generates the audio once on the AtlasVoice service and stores the MP3 on your own server, so every visitor hears exactly the same voice on every browser, operating system and device.",
            "text-to-audio"
          )}
        </p>

        <Form.Check
          type="checkbox"
          id="tta__atlasvoice_cloud_enabled"
          name="tta__atlasvoice_cloud_enabled"
          className="mb-2"
          checked={isEnabled}
          onChange={(e) =>
            handleChange({
              target: {
                name: "tta__atlasvoice_cloud_enabled",
                value: e.target.checked ? "1" : "",
              },
            })
          }
          label={__(
            "Enable AtlasVoice Cloud (required before any audio can be generated)",
            "text-to-audio"
          )}
        />
        {/* A checkbox posts nothing when unchecked, so mirror the value in a
            hidden field — otherwise turning the setting OFF would never save. */}
        <input
          type="hidden"
          name="tta__atlasvoice_cloud_enabled"
          value={isEnabled ? "1" : ""}
        />

        <p className="text-secondary small mb-0">
          {__(
            "When enabled, the text of a post is sent to the AtlasVoice service to be converted into audio. The generated file is deleted from our servers within 20 minutes; the copy on your site is yours to keep. Nothing is sent until you enable this.",
            "text-to-audio"
          )}
        </p>
      </div>

      {/* ── Language + voice ────────────────────────────────────────── */}
      <div className="tta-card mb-3 p-3">
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3" controlId="tta__listening_lang">
              <Form.Label>{__("Language", "text-to-audio")}</Form.Label>
              <Form.Select
                name="tta__listening_lang"
                value={selectedLang}
                onChange={handleChange}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {ATLASVOICE_LANGUAGES[lang] || lang}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group className="mb-3" controlId="tta__listening_voice">
              <Form.Label>{__("Voice", "text-to-audio")}</Form.Label>
              <Form.Select
                name="tta__listening_voice"
                value={selectedVoice}
                onChange={handleChange}
              >
                {voicesForLang.length === 0 && (
                  <option value="">
                    {__("No voice available for this language", "text-to-audio")}
                  </option>
                )}
                {voicesForLang.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-secondary">
                {__(
                  "Changing the language or voice means existing audio is regenerated on the next play — each language and voice is stored as its own file.",
                  "text-to-audio"
                )}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-0" controlId="tta__listening_rate">
          <Form.Label>
            {__("Speed", "text-to-audio")}{" "}
            <span className="text-secondary">
              ({listeningSettings?.tta__listening_rate || 1}x)
            </span>
          </Form.Label>
          <Form.Range
            name="tta__listening_rate"
            min="0.5"
            max="2"
            step="0.1"
            value={listeningSettings?.tta__listening_rate || 1}
            onChange={handleChange}
          />
        </Form.Group>
      </div>
    </>
  );
}
