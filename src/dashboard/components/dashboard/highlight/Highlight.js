import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { Container, Form, Button } from "react-bootstrap";
import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
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
        tta__highlight_mode: "word_sentence",
        tta__highlight_word_bg: "#ffd54f",
        tta__highlight_word_color: "#202124",
        tta__highlight_sentence_bg: "#fff3b0",
        tta__highlight_dim_enabled: true,
        tta__highlight_dim_opacity: 0.4,
        tta__highlight_autoscroll: true,
    });
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
            .catch((err) => console.log(err));
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

    const enabled = !!settings.tta__highlight_enabled;
    const mode = settings.tta__highlight_mode || "word_sentence";
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

    return (
        <Container fluid className="py-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="m-0">{__("Read-Along Highlight", "text-to-audio")}</h4>
                <Button variant="danger" onClick={handleSubmit} disabled={saving}>
                    {saving ? __("Saving…", "text-to-audio") : __("Save Changes", "text-to-audio")}
                </Button>
            </div>
            <p className="text-muted" style={{ maxWidth: "720px" }}>
                {__(
                    "Highlight the word being spoken while the browser reads a post aloud (player 1 and player 2). Word-level highlighting needs a local device voice — remote voices (e.g. “Google” voices) and some browsers fire no word-boundary events; “Sentence only” works everywhere.",
                    "text-to-audio"
                )}
            </p>

            <Form onSubmit={handleSubmit}>
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

                <SettingRow
                    label={__("Highlight mode", "text-to-audio")}
                    questionIcon={true}
                    questionTooltip={__("Word + Sentence and Word only need a local voice that fires word boundaries. Sentence only works with any voice/browser.", "text-to-audio")}
                >
                    <Form.Select
                        name="tta__highlight_mode"
                        value={mode}
                        onChange={handleChange}
                        disabled={!enabled}
                        style={{ maxWidth: "260px" }}
                    >
                        <option value="word_sentence">{__("Word + Sentence", "text-to-audio")}</option>
                        <option value="word">{__("Word only", "text-to-audio")}</option>
                        <option value="sentence">{__("Sentence only", "text-to-audio")}</option>
                    </Form.Select>
                </SettingRow>

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
                    questionTooltip={__("Fade the surrounding text while reading so the spoken word stands out.", "text-to-audio")}
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
                                max="0.7"
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

                <div className="mt-4">
                    <Button variant="danger" type="submit" disabled={saving}>
                        {saving ? __("Saving…", "text-to-audio") : __("Save Changes", "text-to-audio")}
                    </Button>
                </div>
            </Form>
        </Container>
    );
}
