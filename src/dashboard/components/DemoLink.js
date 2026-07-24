import React from "react";
import { __ } from "@wordpress/i18n";
import { proUrl } from "../proUrl";

/**
 * TTS-264 — reusable "watch the live Pro demo" link.
 *
 * One styled surface so every demo call-to-action across the dashboard looks and
 * links identically — always to the Pro demo page via proUrl(content, 'demo'),
 * with a distinct per-location utm_content for attribution.
 *
 * Free-users only: renders null once the Pro add-on is active (mirrors the other
 * upgrade surfaces, which all gate on is_atlasvoice_addon_functional).
 *
 * @param {string} content  utm_content slug for this call site (e.g. 'customize_players').
 * @param {string} [label]  link text; defaults to "See the Pro demo".
 * @param {'inline'|'block'|'nav'} [variant='inline']
 *        inline → teal outline pill (next to a control);
 *        block  → full-width outline button (sidebar cards);
 *        nav    → light text link for the dark top-nav bar.
 * @param {object} [style]  extra inline styles merged last.
 */
export default function DemoLink({ content, label, variant = "inline", style = {} }) {
  const isProActive =
    (typeof ttsObj !== "undefined" && ttsObj.is_atlasvoice_addon_functional) ||
    (typeof tta_obj !== "undefined" && tta_obj.is_atlasvoice_addon_functional);
  if (isProActive) {
    return null;
  }

  const text = label || __("See the Pro demo", "text-to-audio");

  if (variant === "nav") {
    return (
      <a
        href={proUrl(content, "demo")}
        target="_blank"
        rel="noopener noreferrer"
        className="btn d-flex align-items-center gap-2 tta-tab-style"
        style={style}
      >
        <span aria-hidden="true" style={{ fontSize: "11px" }}>{"▶"}</span>
        {text}
      </a>
    );
  }

  const isBlock = variant === "block";
  const base = {
    display: isBlock ? "flex" : "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "1px solid #184c53",
    color: "#184c53",
    background: "transparent",
    borderRadius: isBlock ? "6px" : "16px",
    padding: isBlock ? "10px" : "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    textDecoration: "none",
    lineHeight: 1.2,
    ...style,
  };

  return (
    <a
      href={proUrl(content, "demo")}
      target="_blank"
      rel="noopener noreferrer"
      style={base}
    >
      <span aria-hidden="true" style={{ fontSize: "10px" }}>{"▶"}</span>
      {text}
    </a>
  );
}
