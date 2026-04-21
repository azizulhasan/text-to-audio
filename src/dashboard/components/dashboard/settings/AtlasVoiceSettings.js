/**
 * AtlasVoice Settings (TTS-238 — new system).
 *
 * All new-system (post-opt-in) settings UI lives here. This sub-component
 * is intentionally isolated from the legacy extraction fields so the two
 * systems can evolve independently:
 *
 *   - Opt-in is OFF (default): legacy extraction runs unchanged. This
 *     component still renders the opt-in toggle itself (so the user can
 *     turn it on), but nothing else.
 *   - Opt-in is ON: the visual content picker launcher appears. PR-B will
 *     grow this block into the full wizard (scope chooser, rule chips,
 *     diff preview, 5s listen sample). PR-C will add the staging /
 *     production mode toggle and the migration flow.
 *
 * Legacy extraction controls (Include / Exclude CSS, Exclude HTML Tags,
 * Exclude Texts) stay in LegacyExtractionSettings.js.
 */
import React from "react";
import {__} from "@wordpress/i18n";
import {SettingRow, ToggleSwitch} from "./SettingsPrimitives";
import AtlasVoiceHealLog from "./AtlasVoiceHealLog";

export default function AtlasVoiceSettings({settings, handleChange}) {
    return (
        <>
            {/* Master opt-in toggle. When OFF (default) the whole new system
                stays dormant — zero new assets on the frontend, zero new
                UI beyond this toggle itself. */}
            <SettingRow
                label={__("Use AtlasVoice Extractor (Beta)", 'text-to-audio')}
                questionIcon={true}
                questionTooltip={__(
                    "Opt-in to the new JS-based content extractor with a visual picker. Leave off to keep the current extraction behavior unchanged.",
                    'text-to-audio'
                )}
            >
                <ToggleSwitch
                    checked={settings.tta__settings_use_atlasvoice_extractor}
                    onChange={(e) => handleChange(e)}
                    name="tta__settings_use_atlasvoice_extractor"
                    id="tta__settings_use_atlasvoice_extractor"
                />
            </SettingRow>

            {/* Visual Content Picker launcher + Diff preview launcher — both
                gated on opt-in so they only appear for users who have chosen
                to use the new system. */}
            {settings.tta__settings_use_atlasvoice_extractor && (
                <div
                    className="mt-3 mb-4 p-3 rounded"
                    style={{background: "#f0f7f8", border: "1px solid #d6e7ea"}}
                >
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <strong className="d-block mb-1">
                                {__("AtlasVoiceSelector — Visual Content Picker", "text-to-audio")}
                            </strong>
                            <small className="text-muted d-block">
                                {__(
                                    "Click the button, then point at the text region on your live post. We'll learn a stable selector automatically — no CSS knowledge needed.",
                                    "text-to-audio"
                                )}
                            </small>
                            {settings.atlasvoice_saved_selector && (
                                <small className="d-block mt-1">
                                    <strong>{__("Saved:", "text-to-audio")}</strong>{" "}
                                    <code>{settings.atlasvoice_saved_selector}</code>
                                </small>
                            )}
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => {
                                    const url = ttsObj.latest_post_preview_url;
                                    if (!url) {
                                        alert(__("No preview URL available. Publish a post first.", "text-to-audio"));
                                        return;
                                    }
                                    const sep = url.indexOf("?") === -1 ? "?" : "&";
                                    window.open(url + sep + "atlasvoice-diff=1", "_blank", "noopener");
                                }}
                                title={__("Open the latest post and compare the new AtlasVoice extraction against the legacy wrapper output side by side.", "text-to-audio")}
                            >
                                {__("Preview extraction (new vs old)", "text-to-audio")}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    const url = ttsObj.latest_post_preview_url;
                                    if (!url) {
                                        alert(__("No preview URL available. Publish a post first.", "text-to-audio"));
                                        return;
                                    }
                                    const sep = url.indexOf("?") === -1 ? "?" : "&";
                                    window.open(url + sep + "atlasvoice-picker=1", "_blank", "noopener");
                                }}
                            >
                                {__("Pick content area on live post", "text-to-audio")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Heal log — only rendered when opt-in is ON. Pulls the last 50
                selector replacements from /heal-log and lets the user revert
                any row. Forward-only history: reverts are themselves logged. */}
            {settings.tta__settings_use_atlasvoice_extractor && (
                <AtlasVoiceHealLog />
            )}
        </>
    );
}
