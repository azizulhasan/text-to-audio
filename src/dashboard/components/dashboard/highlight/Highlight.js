import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { Container, Row, Col, Form } from "react-bootstrap";
import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";
import Icon from "../../Icon";
import { ToggleSwitch, SettingRow } from "../settings/SettingsPrimitives";

/**
 * TTS-256 — Read-along highlight settings (speechSynthesis players 1 & 2).
 *
 * Stored in its own option (tta_highlight_settings) via tta/v1/highlight and
 * read on the front-end by admin/js/tts/highlighter.js through
 * window.ttsObj.settings.highlight.
 */
export default function Highlight() {
    const [settings, setSettings] = useState({
        tta__highlight_enabled: true,
        // Default to "sentence" — it works with ANY voice/browser. Word-level
        // modes need a local voice that fires speechSynthesis boundary events.
        tta__highlight_mode: "sentence",
        tta__highlight_word_bg: "#ffd54f",
        tta__highlight_word_color: "#202124",
        tta__highlight_sentence_bg: "#fff3b0",
        tta__highlight_dim_enabled: true,
        tta__highlight_dim_opacity: 0.7,
        tta__highlight_autoscroll: true,
    });
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const formData = new FormData();
        formData.append("method", "get");
        postWithoutImage(tta_obj.api_url + "tta/v1/highlight", formData)
            .then((res) => {
                if (res?.data && typeof res.data === "object") {
                    setSettings((prev) => ({ ...prev, ...res.data }));
                }
            })
            .catch((err) => console.log(err))
            .finally(() => setIsDataLoaded(true));
    }, []);

    const handleChange = (e) => {
        const t = e.target;
        let value = t.value;
        if (t.type === "checkbox") {
            value = t.checked;
        }
        if (!t.name) return;
        setSettings((prev) => ({ ...prev, [t.name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        const formData = new FormData();
        formData.append("fields", JSON.stringify(settings));
        formData.append("method", "post");
        postWithoutImage(tta_obj.api_url + "tta/v1/highlight", formData)
            .then((res) => {
                if (res?.data && typeof res.data === "object") {
                    setSettings((prev) => ({ ...prev, ...res.data }));
                }
                toast(__("Successfully Saved...", "text-to-audio"), "info", {
                    autoClose: 8000,
                });
            })
            .catch((err) => console.log(err))
            .finally(() => setSaving(false));
    };

    // Current player. MP3 players — 3 (Google Translate) & 5 (ChatGPT) — have no
    // word timing, so they're sentence-only: hide the mode selector + word
    // options and force "sentence". (Players 4 & 6 gain word options in Phase 2.)
    const currentPlayer = Number(
        window?.ttsObj?.player_id ??
        window?.ttsObj?.settings?.customize?.buttonSettings?.id ??
        1
    );
    const isSentenceOnlyPlayer = currentPlayer === 3 || currentPlayer === 5;
    // Players 4 (Google Cloud) & 6 (ElevenLabs) have real provider word timing, so
    // word-by-word highlighting works in every browser — no speechSynthesis caveat.
    const isWordTimedPlayer = currentPlayer === 4 || currentPlayer === 6;
    const isBrowserPlayer = currentPlayer === 1 || currentPlayer === 2;

    const enabled = !!settings.tta__highlight_enabled;
    const mode = isSentenceOnlyPlayer ? "sentence" : (settings.tta__highlight_mode || "sentence");
    const showMode = !isSentenceOnlyPlayer;
    const showWord = mode !== "sentence";
    const showSentence = mode !== "word";

    const colorInputStyle = {
        width: "48px",
        height: "32px",
        padding: "2px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        cursor: "pointer",
        background: "none",
    };

    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid className="tta-container">
                <Row>
                    <Col xs={12} lg={8}>
                        {/* Header Card */}
                        <div className="bg-white rounded p-3 mb-3 shadow-sm">
                            <h2 className="fs-3 fw-bold mb-2 text-dark">
                                {__("Read-Along Highlight", "text-to-audio")}
                            </h2>
                            <p className="text-secondary m-0 small">
                                {__(
                                    "Highlight the word and/or sentence being spoken while the post is read aloud.",
                                    "text-to-audio"
                                )}
                            </p>
                        </div>

                        {/* Player-aware note: the highlight mechanism differs by player. */}
                        {isBrowserPlayer && (
                            <div
                                className="mb-3 p-3 rounded"
                                style={{
                                    backgroundColor: "#fff3cd",
                                    border: "1px solid #ffc107",
                                    color: "#856404",
                                    fontSize: "13px",
                                }}
                            >
                                <strong>{__("speechSynthesis limitation:", "text-to-audio")}</strong>{" "}
                                {__(
                                    "Word-level highlighting relies on the browser's speechSynthesis “boundary” events, which only fire for local (offline) device voices. Remote voices (e.g. the “Google …” voices) and some browsers (notably Firefox) fire no word boundaries, so word highlighting can't track them. When that happens the player automatically falls back to sentence highlighting. Sentence highlighting works with every voice and browser — it's the recommended default.",
                                    "text-to-audio"
                                )}
                            </div>
                        )}

                        {isWordTimedPlayer && (
                            <div
                                className="mb-3 p-3 rounded"
                                style={{
                                    backgroundColor: "#d1e7dd",
                                    border: "1px solid #a3cfbb",
                                    color: "#0f5132",
                                    fontSize: "13px",
                                }}
                            >
                                <strong>{__("Precise word timing:", "text-to-audio")}</strong>{" "}
                                {__(
                                    "This player generates audio with real per-word timing, so word-by-word highlighting is accurate and works in every browser — no local-voice requirement and no fallback.",
                                    "text-to-audio"
                                )}
                            </div>
                        )}

                        {/* Settings Card */}
                        <Form onSubmit={handleSubmit}>
                            <div className="tta-card">
                                <SettingRow
                                    label={__("Enable highlighting", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__("Turn read-along highlighting on or off for the browser players.", "text-to-audio")}
                                >
                                    <ToggleSwitch
                                        checked={enabled}
                                        onChange={handleChange}
                                        name="tta__highlight_enabled"
                                        id="tta__highlight_enabled"
                                    />
                                </SettingRow>

                                {showMode && (
                                    <SettingRow
                                        label={__("Highlight mode", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("“Sentence only” works with any voice. “Word” and “Word + Sentence” need a local voice that fires boundary events, and fall back to sentence highlighting otherwise.", "text-to-audio")}
                                    >
                                        <Form.Select
                                            name="tta__highlight_mode"
                                            value={mode}
                                            onChange={handleChange}
                                            disabled={!enabled}
                                            style={{ maxWidth: "260px" }}
                                        >
                                            <option value="sentence">{__("Sentence only (recommended)", "text-to-audio")}</option>
                                            <option value="word">{__("Word only", "text-to-audio")}</option>
                                            <option value="word_sentence">{__("Word + Sentence", "text-to-audio")}</option>
                                        </Form.Select>
                                    </SettingRow>
                                )}

                                {!showMode && (
                                    <div className="mb-3 p-2 rounded" style={{ backgroundColor: "#eef6ff", border: "1px solid #b6d4fe", color: "#084298", fontSize: "13px" }}>
                                        {__("The current player uses generated audio, so read-along highlighting is sentence-level. Word-level options don't apply here.", "text-to-audio")}
                                    </div>
                                )}

                                {showWord && (
                                    <SettingRow
                                        label={__("Word highlight color", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("Background color painted behind the word currently being spoken.", "text-to-audio")}
                                    >
                                        <input
                                            type="color"
                                            name="tta__highlight_word_bg"
                                            value={settings.tta__highlight_word_bg || "#ffd54f"}
                                            onChange={handleChange}
                                            disabled={!enabled}
                                            style={colorInputStyle}
                                        />
                                    </SettingRow>
                                )}

                                {showWord && (
                                    <SettingRow
                                        label={__("Word text color", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("Text color of the spoken word, for contrast against the highlight color.", "text-to-audio")}
                                    >
                                        <input
                                            type="color"
                                            name="tta__highlight_word_color"
                                            value={settings.tta__highlight_word_color || "#202124"}
                                            onChange={handleChange}
                                            disabled={!enabled}
                                            style={colorInputStyle}
                                        />
                                    </SettingRow>
                                )}

                                {showSentence && (
                                    <SettingRow
                                        label={__("Sentence highlight color", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("Softer background painted behind the whole sentence being read.", "text-to-audio")}
                                    >
                                        <input
                                            type="color"
                                            name="tta__highlight_sentence_bg"
                                            value={settings.tta__highlight_sentence_bg || "#fff3b0"}
                                            onChange={handleChange}
                                            disabled={!enabled}
                                            style={colorInputStyle}
                                        />
                                    </SettingRow>
                                )}

                                <SettingRow
                                    label={__("Dim the rest of the article", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__("Fade the surrounding text while reading so the spoken word/sentence stands out.", "text-to-audio")}
                                >
                                    <ToggleSwitch
                                        checked={!!settings.tta__highlight_dim_enabled}
                                        onChange={handleChange}
                                        name="tta__highlight_dim_enabled"
                                        id="tta__highlight_dim_enabled"
                                        disabled={!enabled}
                                    />
                                </SettingRow>

                                {!!settings.tta__highlight_dim_enabled && (
                                    <SettingRow
                                        label={__("Dimmed text opacity", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("How visible the dimmed (non-spoken) text stays. Lower = more dimmed.", "text-to-audio")}
                                    >
                                        <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                                            <input
                                                type="range"
                                                name="tta__highlight_dim_opacity"
                                                min="0.1"
                                                max="0.85"
                                                step="0.05"
                                                value={settings.tta__highlight_dim_opacity ?? 0.4}
                                                onChange={handleChange}
                                                disabled={!enabled}
                                                style={{ width: "200px", cursor: "pointer" }}
                                            />
                                            <span style={{ minWidth: "44px" }}>
                                                {Math.round((settings.tta__highlight_dim_opacity ?? 0.4) * 100)}%
                                            </span>
                                        </div>
                                    </SettingRow>
                                )}

                                <SettingRow
                                    label={__("Auto-scroll to follow", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__("Smoothly scroll the page to keep the spoken word in view. Turn off if scrolling is distracting.", "text-to-audio")}
                                >
                                    <ToggleSwitch
                                        checked={!!settings.tta__highlight_autoscroll}
                                        onChange={handleChange}
                                        name="tta__highlight_autoscroll"
                                        id="tta__highlight_autoscroll"
                                        disabled={!enabled}
                                    />
                                </SettingRow>

                                {/* Save Button */}
                                <div
                                    className="position-sticky bottom-0"
                                    style={{
                                        zIndex: 1030,
                                        marginTop: "20px",
                                        background: "linear-gradient(to top, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0))",
                                        padding: "12px 0 8px",
                                    }}
                                >
                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className="tta_btn rounded-3 shadow-lg"
                                            disabled={saving}
                                        >
                                            {saving ? __("Saving…", "text-to-audio") : __("Save Changes", "text-to-audio")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </Col>

                    <Col xs={12} lg={4}>
                        <UpgradeToPro promotionType={"youtube"} />
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    ) : (
        <div className="tta-loading-spinner">
            <div>
                <Icon name="spinner" spin className="me-2" />
                {__("Loading...", "text-to-audio")}
            </div>
        </div>
    );
}
