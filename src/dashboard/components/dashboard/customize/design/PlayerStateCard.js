import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import IconPicker from "./IconPicker";

const STATE_LABELS = {
  listen: () => __("Listen — initial state", "text-to-audio"),
  pause: () => __("Pause — while speaking", "text-to-audio"),
  resume: () => __("Resume — after user paused", "text-to-audio"),
  replay: () => __("Replay — after speech finished", "text-to-audio"),
};

export default function PlayerStateCard({
  stateKey,
  state,
  defaultState,
  presetSvgs,
  onChange,
  onReset,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch) => onChange({ ...state, ...patch });

  return (
    <div
      className="tta-state-card"
      style={{
        border: "1px solid #e9ecef",
        borderRadius: 6,
        padding: 12,
        background: "#fff",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong className="small">{STATE_LABELS[stateKey]?.() ?? stateKey}</strong>
        <button
          type="button"
          className="btn btn-link btn-sm p-0"
          onClick={onReset}
          title={__("Reset to default", "text-to-audio")}
        >
          ↺
        </button>
      </div>

      <div className="d-flex gap-2 align-items-start">
        <IconPicker
          value={state.icon}
          onChange={(icon) => update({ icon })}
          presetSvgs={presetSvgs}
        />
        <div style={{ flex: 1 }}>
          <Form.Control
            type="text"
            value={state.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder={defaultState?.text || ""}
          />
          <div className="small text-muted mt-1">
            {__("Empty = use factory default", "text-to-audio")}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-link btn-sm p-0 mt-2"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced
          ? __("Hide tooltip", "text-to-audio")
          : __("Show tooltip (advanced)", "text-to-audio")}
      </button>

      {showAdvanced && (
        <div className="mt-2">
          <Form.Label className="small mb-1">
            {__("Hover tooltip", "text-to-audio")}
          </Form.Label>
          <Form.Control
            type="text"
            value={state.hover}
            onChange={(e) => update({ hover: e.target.value })}
            placeholder={defaultState?.hover || ""}
          />
        </div>
      )}
    </div>
  );
}
