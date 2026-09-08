import React, { useMemo, useRef, useState } from "react";
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

// TTS-266: the two synthesis engines behind player 7, shown as separate groups
// in the voice list. Piper first because it is the one that keeps first play
// fast; the label says why rather than naming the engine, which means nothing to
// a site owner.
const ENGINE_ORDER = ["piper", "kokoro"];

const ENGINE_LABELS = {
  piper: __("Fast voices", "text-to-audio"),
  kokoro: __("Higher quality (slower to generate)", "text-to-audio"),
};

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

  const selectedVoiceEngine = useMemo(
    () => voicesForLang.find((v) => v.id === selectedVoice)?.engine || "",
    [voicesForLang, selectedVoice]
  );

  const isEnabled = !!listeningSettings?.tta__atlasvoice_cloud_enabled;

  // TTS-266: the preview plays a short pre-rendered recording of the selected
  // voice. The base URL comes from PHP (derived from TTA_ATLASVOICE_API_URL), so
  // nothing remote is hardcoded in this bundle — the mistake that had to be
  // undone for the Google and OpenAI previews in TTS-249.
  const sampleBase = window?.ttsObj?.atlasvoice_sample_base || "";
  const sampleURL = sampleBase && selectedVoice ? sampleBase + selectedVoice + ".mp3" : "";

  const sampleRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sampleError, setSampleError] = useState(false);

  const toggleSample = () => {
    const el = sampleRef.current;
    if (!el) return;
    if (el.paused) {
      setSampleError(false);
      el.play().catch(() => setSampleError(true));
    } else {
      el.pause();
    }
  };

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

                {/* TTS-266: grouped by engine, because the two are not
                    interchangeable — Piper generates roughly seven times faster
                    than Kokoro, which is the difference between a visitor
                    waiting seconds and waiting minutes on the first play. The
                    choice was previously invisible: both engines' voices sat in
                    one flat list with nothing to tell them apart. */}
                {ENGINE_ORDER.map((engine) => {
                  const group = voicesForLang.filter((v) => v.engine === engine);
                  if (!group.length) return null;

                  return (
                    <optgroup key={engine} label={ENGINE_LABELS[engine]}>
                      {group.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Form.Select>

              <Form.Text className="text-secondary d-block">
                {selectedVoiceEngine === "piper" &&
                  __(
                    "Fast voice: a long post is ready in seconds.",
                    "text-to-audio"
                  )}
                {selectedVoiceEngine === "kokoro" &&
                  __(
                    "Higher-quality voice, but roughly seven times slower to generate — a long post can take a few minutes the first time someone plays it.",
                    "text-to-audio"
                  )}
              </Form.Text>

              <Form.Text className="text-secondary">
                {__(
                  "Changing the language or voice means existing audio is regenerated on the next play — each language and voice is stored as its own file.",
                  "text-to-audio"
                )}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {/* ── Voice preview ─────────────────────────────────────────
            Only once the site owner has opted in: playing a sample is a
            request to the AtlasVoice service, and nothing should reach it
            before consent — even a request that carries no site data. */}
        {isEnabled && sampleURL && (
          <div className="d-flex align-items-center gap-3 p-2 mb-3 border rounded">
            <button
              type="button"
              onClick={toggleSample}
              className="btn btn-outline-dark rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
              style={{ width: 38, height: 38 }}
              aria-label={
                isPlaying
                  ? __("Stop the sample", "text-to-audio")
                  : __("Play a sample of this voice", "text-to-audio")
              }
            >
              <span
                className={`dashicons dashicons-controls-${isPlaying ? "pause" : "play"}`}
                aria-hidden="true"
              />
            </button>

            <div className="flex-grow-1 min-width-0">
              <div className="small fw-semibold">
                {voicesForLang.find((v) => v.id === selectedVoice)?.label
                  ? `${__("Hear", "text-to-audio")} ${
                      voicesForLang.find((v) => v.id === selectedVoice).label
                    }`
                  : __("Hear this voice", "text-to-audio")}
              </div>
              <div className="small text-secondary">
                {sampleError
                  ? __(
                      "That sample could not be played. The AtlasVoice service may be unreachable.",
                      "text-to-audio"
                    )
                  : __(
                      "A short recording, so you can choose a voice before generating anything.",
                      "text-to-audio"
                    )}
              </div>
            </div>

            {/* Hidden: the button above is the whole control. A full transport
                would offer seeking and volume for a three-second clip. */}
            <audio
              ref={sampleRef}
              src={sampleURL}
              preload="none"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setIsPlaying(false);
                setSampleError(true);
              }}
              style={{ display: "none" }}
            />
          </div>
        )}

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
