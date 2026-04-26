import React, { useState, useRef, useEffect } from "react";
import { Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

/**
 * Icon picker — popover with preset grid + Custom SVG textarea.
 *
 * Value is an icon descriptor: "preset:<key>" or "custom:<svg>".
 * Calls onChange(descriptor) when user selects/edits.
 */
export default function IconPicker({ value, onChange, presetSvgs = {} }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("preset");
  const [customSvg, setCustomSvg] = useState(
    typeof value === "string" && value.startsWith("custom:") ? value.slice(7) : ""
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const renderSvg = (svg) => {
    if (!svg) return null;
    // Replace `$color` placeholder with currentColor for in-app rendering.
    const html = svg.replace(/\$color/g, "currentColor");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const currentPreview = (() => {
    if (!value) return null;
    if (value.startsWith("preset:")) return renderSvg(presetSvgs[value.slice(7)]);
    if (value.startsWith("custom:")) return renderSvg(value.slice(7));
    return renderSvg(value);
  })();

  const presetKeys = Object.keys(presetSvgs);

  return (
    <div className="tta-icon-picker" ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="tta-icon-swatch"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 40,
          height: 40,
          border: "1px solid #ced4da",
          borderRadius: 6,
          background: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title={__("Choose icon", "text-to-audio")}
      >
        {currentPreview}
      </button>

      {open && (
        <div
          className="tta-icon-popover"
          style={{
            position: "absolute",
            top: 44,
            left: 0,
            zIndex: 30,
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: 6,
            padding: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            width: 260,
          }}
        >
          <div className="d-flex gap-2 mb-2">
            <button
              type="button"
              className={`btn btn-sm ${tab === "preset" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setTab("preset")}
            >
              {__("Presets", "text-to-audio")}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tab === "custom" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setTab("custom")}
            >
              {__("Custom SVG", "text-to-audio")}
            </button>
          </div>

          {tab === "preset" && (
            <div
              className="tta-icon-presets"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
              }}
            >
              {presetKeys.map((key) => {
                const descriptor = `preset:${key}`;
                const active = value === descriptor;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      onChange(descriptor);
                      setOpen(false);
                    }}
                    title={key}
                    style={{
                      height: 44,
                      border: active ? "2px solid #0d6efd" : "1px solid #ced4da",
                      borderRadius: 4,
                      background: "#fff",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {renderSvg(presetSvgs[key])}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "custom" && (
            <div>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={__("<svg ...>...</svg>", "text-to-audio")}
                value={customSvg}
                onChange={(e) => setCustomSvg(e.target.value)}
              />
              <div className="d-flex align-items-center justify-content-between mt-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {renderSvg(customSvg)}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!customSvg.trim()}
                  onClick={() => {
                    onChange(`custom:${customSvg.trim()}`);
                    setOpen(false);
                  }}
                >
                  {__("Use this SVG", "text-to-audio")}
                </button>
              </div>
              <div className="small text-muted mt-2">
                {__("Allowed: <svg>, <g>, <path>, <circle>, <rect>, <line>, <polyline>, <polygon>, <ellipse>. Server sanitizes on save.", "text-to-audio")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
