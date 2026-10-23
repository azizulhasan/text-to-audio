import React from "react";
import { __ } from "@wordpress/i18n";

/**
 * TTS-351: Staging / Live status and Go live (or Back to staging), as the first
 * items of the header button group, styled like What's New / Support
 * (.tta-tab-style).
 *
 * The button opens the shared dialog printed by
 * TTA\AtlasVoice\Mode::render_inline_script() (window.atlasvoiceGoLive /
 * atlasvoiceRevert), which reloads the page on success. "Test on your phone"
 * lives in the front-end staging note, where it knows which post is open.
 */
export default function StagingModeControl() {
  const isLive = (window?.tta_obj?.atlasvoice_mode || "production") === "production";

  const switchMode = () => {
    const fn = isLive ? window.atlasvoiceRevert : window.atlasvoiceGoLive;
    if (typeof fn === "function") {
      fn();
    }
  };

  return (
    <>
      <span
        className="btn d-flex align-items-center gap-2 tta-tab-style tta-mode-status"
        title={isLive
          ? __("Visitors can see and hear the player.", "text-to-audio")
          : __("Only logged-in admins can see the player.", "text-to-audio")}
      >
        <span className={`tta-mode-dot ${isLive ? "is-live" : "is-staging"}`} aria-hidden="true" />
        {isLive ? __("Live", "text-to-audio") : __("Staging", "text-to-audio")}
      </span>

      <button type="button" className="btn d-flex align-items-center gap-2 tta-tab-style" onClick={switchMode}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {isLive ? (
            <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" stroke="#F4B400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M5 13a8 8 0 0 1 8-8h6v6a8 8 0 0 1-8 8l-3-3-3-3Zm3 3-3 3m10-10h.01" stroke="#F4B400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        {isLive ? __("Back to staging", "text-to-audio") : __("Go live", "text-to-audio")}
      </button>
    </>
  );
}
