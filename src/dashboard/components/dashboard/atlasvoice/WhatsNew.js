import React from "react";
import { __ } from "@wordpress/i18n";

import "./atlasvoice.css";

/** One "seen" flag per plugin version, so the dot comes back with each release. */
const seenKey = () => `atlasvoice_whats_new_seen_${window.tta_obj?.VERSION || ""}`;

/**
 * TTS-320: What's New, inside the plugin. Plain text for the site owner; the
 * full changelog stays one link away on WordPress.org.
 *
 * @param {Object}   props
 * @param {Function} props.onClose
 */
export default function WhatsNew({ onClose }) {
  const addonActive = !!window.tta_obj?.is_atlasvoice_addon_functional;
  const tts = window.tta_obj?.atlasvoiceTts || {};
  const canSetUp = !addonActive && !tts.connected && Number(tts.playerId) === 1;

  return (
    <div className="tta-whats-new" role="dialog" aria-label={__("What's New", "text-to-audio")}>
      <h4>{__("What's new", "text-to-audio")}</h4>

      <div className="tta-whats-new__entry">
        <strong>{__("AtlasVoice TTS: a natural voice, free", "text-to-audio")}</strong>
        <div className="text-secondary">
          {addonActive
            ? __("Included in your Pro licence: no monthly limit on the sites it covers.", "text-to-audio")
            : __("100,000 characters a month free. Each post is saved as an MP3, so every visitor hears the same voice.", "text-to-audio")}
        </div>
        {canSetUp && (
          <a className="btn btn-sm tta-launch-btn mt-2" href="#/listening?setup=atlasvoice-tts" onClick={onClose}>
            {__("Set it up", "text-to-audio")}
          </a>
        )}
      </div>

      <div className="tta-whats-new__entry">
        <strong>{__("Warnings before the allowance runs out", "text-to-audio")}</strong>
        <div className="text-secondary">
          {__("A warning at 95% and a notice when it runs out, so posts never switch voice without you knowing.", "text-to-audio")}
        </div>
      </div>

      {window.tta_obj?.canRollback && (
        <div className="tta-whats-new__entry">
          <strong>{__("Versions: roll back in one click", "text-to-audio")}</strong>
          <div className="text-secondary">
            {__("If an update breaks something, go back to an earlier version. Settings and audio files are kept.", "text-to-audio")}
          </div>
        </div>
      )}

      <div className="tta-whats-new__entry d-flex justify-content-between align-items-center">
        <a href="https://wordpress.org/plugins/text-to-audio/#developers" target="_blank" rel="noopener noreferrer">
          {__("Full changelog on WordPress.org", "text-to-audio")}
        </a>
        <button type="button" className="btn btn-link p-0" onClick={onClose}>
          {__("Close", "text-to-audio")}
        </button>
      </div>
    </div>
  );
}

WhatsNew.isSeen = () => {
  try {
    return window.localStorage.getItem(seenKey()) === "1";
  } catch (e) {
    return true;
  }
};

WhatsNew.markSeen = () => {
  try {
    window.localStorage.setItem(seenKey(), "1");
  } catch (e) {
    // Private window: the dot just shows again.
  }
};
