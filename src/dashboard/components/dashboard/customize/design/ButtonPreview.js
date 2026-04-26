import React, { useState, useMemo } from "react";
import { Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

const STATE_KEYS = ["listen", "pause", "resume", "replay"];

/**
 * ButtonPreview — TTS-241
 *
 * Live, in-memory preview of the Default / Default Pro player button. Reads
 * the user's current draft (`buttonTexts.players[playerId][state]`) so the
 * label and icon update immediately as they edit, and offers a state
 * selector so the user can flip through Listen / Pause / Resume / Replay
 * without having to actually run the synthesizer.
 */
export default function ButtonPreview({
  buttonTexts,
  playerId,
  buttonStyle,
}) {
  const [state, setState] = useState("listen");

  const players = buttonTexts?.players || {};
  const defaults = buttonTexts?.defaults?.[playerId] || {};
  const presetSvgs = buttonTexts?.preset_svgs || {};
  const stateData = (players[playerId] && players[playerId][state]) || defaults[state] || { text: "", icon: "" };

  const iconHtml = useMemo(() => {
    const desc = stateData.icon || "";
    if (desc.startsWith("preset:")) {
      return presetSvgs[desc.slice(7)] || "";
    }
    if (desc.startsWith("custom:")) {
      return desc.slice(7);
    }
    return desc;
  }, [stateData.icon, presetSvgs]);

  return (
    <div className="tta-button-preview">
      <div className="d-flex align-items-center justify-content-end mb-2 gap-2">
        <span className="small text-muted">{__("Preview state:", "text-to-audio")}</span>
        <Form.Select
          size="sm"
          value={state}
          onChange={(e) => setState(e.target.value)}
          style={{ width: "auto" }}
        >
          {STATE_KEYS.map((sk) => (
            <option key={sk} value={sk}>
              {sk[0].toUpperCase() + sk.slice(1)}
            </option>
          ))}
        </Form.Select>
      </div>

      <button
        type="button"
        className="tta_listen-button"
        style={{
          ...buttonStyle,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxSizing: "border-box",
          cursor: "default",
        }}
        title={stateData.hover || ""}
        onClick={(e) => e.preventDefault()}
      >
        {iconHtml ? (
          <span
            className="tta-preview-icon"
            style={{ display: "inline-flex", alignItems: "center" }}
            dangerouslySetInnerHTML={{ __html: iconHtml }}
          />
        ) : null}
        <span className="tta-preview-label">{stateData.text || ""}</span>
      </button>
    </div>
  );
}
