import React, { useState, useMemo, useEffect, useRef } from "react";
import { Col, Row, Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { getData } from "../../../context/utilities";
import { getLanguageFlag } from "../utils";

const MODEL_LABELS = {
  eleven_multilingual_v2: "Multilingual v2",
  eleven_turbo_v2_5: "Turbo v2.5",
  eleven_turbo_v2: "Turbo v2",
  eleven_flash_v2_5: "Flash v2.5",
  eleven_flash_v2: "Flash v2",
  eleven_v2_flash: "v2 Flash",
  eleven_v2_5_flash: "v2.5 Flash",
  eleven_v3: "Eleven v3",
};

const FALLBACK_MODELS = [
  "eleven_multilingual_v2",
  "eleven_turbo_v2_5",
  "eleven_flash_v2_5",
  "eleven_v3",
];

const playPreview = (url) => {
  if (!url) return;
  const audio_wav = document.getElementById("tts_audio_wav");
  const audio_mp3 = document.getElementById("tts_audio_mp3");
  const audio_tag = document.getElementById("tts_audio_tag");
  if (!audio_wav || !audio_mp3 || !audio_tag) return;
  audio_wav.src = url;
  audio_mp3.src = url;
  audio_tag.load();
  audio_tag.play().catch(() => {});
};

export default function ElevenLabsSettings({
  listeningSettings,
  setListeningSettings,
  currentPlayerLanguages,
  elevenLabsVoices,
  addElevenLabsVoice,
  handleChange,
  baseMP3File,
}) {
  const [voiceSearch, setVoiceSearch] = useState("");
  const [manualVoiceId, setManualVoiceId] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // Track which voice-tuning sliders the user has touched in this session.
  // Once touched we stop auto-seeding from voice.settings on voice change.
  const editedRef = useRef({ stability: false, similarity_boost: false, style: false });

  const proApiURL = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      window.hasOwnProperty("ttsObj") &&
      window.ttsObj?.is_atlasvoice_addon_functional
    ) {
      return (
        window.ttsObj.api_url +
        window.ttsObj.api_namespace +
        "_pro/" +
        window.ttsObj.api_version +
        "/"
      );
    }
    return "";
  }, []);

  // Resolve selected voice object from listeningSettings.tta__listening_voice
  // (stored as `voice_id::FirstName`).
  const selectedVoiceId = useMemo(() => {
    const raw = listeningSettings.tta__listening_voice || "";
    return raw.split("::")[0] || "";
  }, [listeningSettings.tta__listening_voice]);

  const selectedVoice = useMemo(
    () => elevenLabsVoices.find((v) => v.voice_id === selectedVoiceId),
    [elevenLabsVoices, selectedVoiceId]
  );

  const langIso = useMemo(
    () =>
      (listeningSettings.tta__listening_lang || "")
        .toLowerCase()
        .split(/[-_]/)[0] || "",
    [listeningSettings.tta__listening_lang]
  );

  // verified_languages filtered by selected language.
  const verifiedForLang = useMemo(() => {
    const entries = selectedVoice?.verified_languages || [];
    if (!langIso) return entries;
    return entries.filter((v) => (v.language || "").toLowerCase() === langIso);
  }, [selectedVoice, langIso]);

  // Available models for this voice+language (unique model_ids).
  const availableModels = useMemo(() => {
    const ids = Array.from(
      new Set(verifiedForLang.map((v) => v.model_id).filter(Boolean))
    );
    return ids.length ? ids : FALLBACK_MODELS;
  }, [verifiedForLang]);

  // ── Sync: if current model isn't in availableModels, switch to first ──
  useEffect(() => {
    if (!selectedVoice) return;
    if (!availableModels.includes(listeningSettings.tta__elevenlabs_model)) {
      handleChange({
        target: {
          name: "tta__elevenlabs_model",
          value: availableModels[0],
        },
      });
    }
  }, [availableModels, selectedVoice]);

  // ── Seed voice-tuning sliders from voice.settings (if user hasn't edited) ──
  useEffect(() => {
    const vs = selectedVoice?.settings;
    if (!vs || !setListeningSettings) return;
    setListeningSettings((prev) => {
      const next = { ...prev };
      if (vs.stability !== undefined && !editedRef.current.stability) {
        next.tta__elevenlabs_stability = vs.stability;
      }
      if (
        vs.similarity_boost !== undefined &&
        !editedRef.current.similarity_boost
      ) {
        next.tta__elevenlabs_similarity_boost = vs.similarity_boost;
      }
      if (vs.style !== undefined && !editedRef.current.style) {
        next.tta__elevenlabs_style = vs.style;
      }
      return next;
    });
  }, [selectedVoiceId]);

  // ── Voice search ─────────────────────────────────────────────────────
  const filteredElevenLabsVoices = useMemo(() => {
    const q = voiceSearch.trim().toLowerCase();
    if (!q) return elevenLabsVoices;
    return elevenLabsVoices.filter((v) => {
      const name = (v.name || "").toLowerCase();
      const accent = (v.labels?.accent || "").toLowerCase();
      const gender = (v.labels?.gender || "").toLowerCase();
      const desc = (v.labels?.description || "").toLowerCase();
      const id = (v.voice_id || "").toLowerCase();
      return (
        name.includes(q) ||
        accent.includes(q) ||
        gender.includes(q) ||
        desc.includes(q) ||
        id.includes(q)
      );
    });
  }, [elevenLabsVoices, voiceSearch]);

  // ── Fetch a voice by ID, inject into list, select, and play preview ──
  const resolveAndSelectVoiceId = (voiceId, { onError, onDone } = {}) => {
    const trimmed = (voiceId || "").trim();
    if (!trimmed || !proApiURL) {
      onDone && onDone();
      return;
    }
    getData(
      `${proApiURL}elevenlabs_voice?voice_id=${encodeURIComponent(trimmed)}`
    )
      .then((res) => {
        if (!res?.status || !res?.voice?.voice_id) {
          onError && onError(res?.message || __("Voice not found.", "text-to-audio"));
          return;
        }
        const voice = res.voice;
        if (typeof addElevenLabsVoice === "function") {
          addElevenLabsVoice(voice, listeningSettings.tta__listening_lang);
        }
        const firstName = (voice.name || "Custom").split(/[\s\-]/)[0].trim();
        handleChange({
          target: {
            name: "tta__listening_voice",
            value: `${voice.voice_id}::${firstName || "Custom"}`,
          },
        });
        playPreview(voice.preview_url);
      })
      .catch((err) => {
        console.log("elevenlabs_voice error:", err);
        onError && onError(__("Failed to fetch voice.", "text-to-audio"));
      })
      .finally(() => onDone && onDone());
  };

  // ── Manual voice-ID form: "Use" button ───────────────────────────────
  const applyManualVoiceId = () => {
    const trimmed = manualVoiceId.trim();
    if (!trimmed) return;
    setManualError("");
    setManualLoading(true);
    resolveAndSelectVoiceId(trimmed, {
      onError: (msg) => setManualError(msg),
      onDone: () => {
        setManualLoading(false);
        setManualVoiceId("");
      },
    });
  };

  // ── Auto-resolve: if the user pastes a 20-char voice ID into the
  //    search box, fetch it so preview plays even when the voice isn't
  //    in the current language-filtered shared-voice list (or lacks a
  //    preview_url). Debounced to avoid spamming the API. ─────────────
  const autoResolvedRef = useRef(new Set());
  useEffect(() => {
    const q = voiceSearch.trim();
    if (!/^[A-Za-z0-9]{20}$/.test(q)) return;
    if (autoResolvedRef.current.has(q)) return;

    const existing = elevenLabsVoices.find((v) => v.voice_id === q);
    if (existing && existing.preview_url) {
      // Already have full data for this voice — just select + play it.
      autoResolvedRef.current.add(q);
      const firstName = (existing.name || "Custom")
        .split(/[\s\-]/)[0]
        .trim();
      handleChange({
        target: {
          name: "tta__listening_voice",
          value: `${existing.voice_id}::${firstName || "Custom"}`,
        },
      });
      playPreview(existing.preview_url);
      return;
    }

    const timer = setTimeout(() => {
      autoResolvedRef.current.add(q);
      resolveAndSelectVoiceId(q);
    }, 400);
    return () => clearTimeout(timer);
  }, [voiceSearch, elevenLabsVoices]);

  // ── Slider change: mark edited so we stop re-seeding ─────────────────
  const handleSliderChange = (e) => {
    const key = e.target.name;
    if (key === "tta__elevenlabs_stability") editedRef.current.stability = true;
    if (key === "tta__elevenlabs_similarity_boost")
      editedRef.current.similarity_boost = true;
    if (key === "tta__elevenlabs_style") editedRef.current.style = true;
    handleChange(e);
  };

  const voiceHas = (key) => selectedVoice?.settings?.[key] !== undefined;

  return (
    <>
      {/* Voice Language, Voice to Speak, and Model */}
      <Row className="mb-3">
        <Col xs={12} md={4}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Voice Language", "text-to-audio")}</h3>
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
            <Form.Control
              type="search"
              className="mb-2"
              placeholder={__("Search voices by name, accent, gender…", "text-to-audio")}
              value={voiceSearch}
              onChange={(e) => setVoiceSearch(e.target.value)}
            />
            <Form.Select
              onChange={handleChange}
              name="tta__listening_voice"
              id="tta__listening_voice"
              value={listeningSettings.tta__listening_voice}
              className="tta_orange_speak_select"
            >
              <option disabled>{__("Default Listening Voice", "text-to-audio")}</option>
              {filteredElevenLabsVoices.map((voice, index) => {
                const firstName = voice.name ? voice.name.split(/[\s\-]/)[0].trim() : "";
                const optionValue = voice.voice_id + "::" + firstName;
                return (
                  <option key={voice.voice_id || index} value={optionValue}>
                    {voice.name} {voice.labels?.accent ? `(${voice.labels.accent})` : ""}
                  </option>
                );
              })}
            </Form.Select>
            <div className="mt-2">
              <Form.Label className="small text-muted mb-1">
                {__("Or paste a voice ID (overrides selection)", "text-to-audio")}
              </Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder={__("e.g. 21m00Tcm4TlvDq8ikWAM", "text-to-audio")}
                  value={manualVoiceId}
                  onChange={(e) => setManualVoiceId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyManualVoiceId();
                    }
                  }}
                  disabled={manualLoading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={applyManualVoiceId}
                  disabled={manualLoading || !manualVoiceId.trim()}
                >
                  {manualLoading ? __("Loading…", "text-to-audio") : __("Use", "text-to-audio")}
                </button>
              </div>
              {manualError ? (
                <div className="text-danger small mt-1">{manualError}</div>
              ) : null}
            </div>
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
              {availableModels.map((id) => (
                <option key={id} value={id}>
                  {MODEL_LABELS[id] || id}
                </option>
              ))}
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

      {/* Voice-tuning sliders — rendered only if the selected voice defines them */}
      <div className="tta_chatgpt_speed_card">
        {voiceHas("stability") ? (
          <Form.Group className="mb-4">
            <div className="tta_slider_header">
              <Form.Label className="tta_slider_label">{__("Stability", "text-to-audio")}</Form.Label>
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
                onChange={handleSliderChange}
                value={listeningSettings.tta__elevenlabs_stability}
                className="tta_chatgpt_slider"
              />
            </div>
            <div className="tta_chatgpt_slider_labels">
              <span>{__("More variable", "text-to-audio")}</span>
              <span>{__("More stable", "text-to-audio")}</span>
            </div>
          </Form.Group>
        ) : null}

        {voiceHas("similarity_boost") ? (
          <Form.Group className="mb-4">
            <div className="tta_slider_header">
              <Form.Label className="tta_slider_label">{__("Similarity Boost", "text-to-audio")}</Form.Label>
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
                onChange={handleSliderChange}
                value={listeningSettings.tta__elevenlabs_similarity_boost}
                className="tta_chatgpt_slider"
              />
            </div>
            <div className="tta_chatgpt_slider_labels">
              <span>{__("Low", "text-to-audio")}</span>
              <span>{__("High", "text-to-audio")}</span>
            </div>
          </Form.Group>
        ) : null}

        {voiceHas("style") ? (
          <Form.Group className="mb-4">
            <div className="tta_slider_header">
              <Form.Label className="tta_slider_label">{__("Style Exaggeration", "text-to-audio")}</Form.Label>
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
                onChange={handleSliderChange}
                value={listeningSettings.tta__elevenlabs_style}
                className="tta_chatgpt_slider"
              />
            </div>
            <div className="tta_chatgpt_slider_labels">
              <span>{__("None", "text-to-audio")}</span>
              <span>{__("Exaggerated", "text-to-audio")}</span>
            </div>
          </Form.Group>
        ) : null}

        {/* Speed is a user-level preference — always render */}
        <Form.Group className="mb-4">
          <div className="tta_slider_header">
            <Form.Label className="tta_slider_label">{__("Speed", "text-to-audio")}</Form.Label>
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

        {/* Speaker Boost is a user-level preference — always render */}
        <Form.Group className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <Form.Label className="tta_slider_label mb-0">
              {__("Speaker Boost", "text-to-audio")}
            </Form.Label>
            <Form.Check
              type="switch"
              id="tta__elevenlabs_speaker_boost"
              name="tta__elevenlabs_speaker_boost"
              checked={
                listeningSettings.tta__elevenlabs_speaker_boost === true ||
                listeningSettings.tta__elevenlabs_speaker_boost === "true"
              }
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
        <audio id="tts_audio_tag" controls className="tta_chatgpt_audio_player">
          <source id="tts_audio_wav" src={baseMP3File} type="audio/wav" />
          <source id="tts_audio_mp3" src={baseMP3File} type="audio/mpeg" />
          {__("Your browser does not support the audio element.", "text-to-audio")}
        </audio>
      </div>
    </>
  );
}
