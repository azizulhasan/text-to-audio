import React from "react";
import { __ } from "@wordpress/i18n";
import { betaUrl, betaFeedbackUrl } from "../proUrl";

/**
 * TTS-352: invitation to the AtlasVoice 2.4 beta at the top of the dashboard
 * sidebar. Most complaints were robotic or device-dependent voices; 2.4 fixes
 * them, so every Free and Pro user is asked to try it and tell us.
 *
 * Shown only before the beta line (Free < 2.4 / Pro < 3.5). Links only:
 * nothing is downloaded or switched without the owner's click (wp.org G7/8).
 */
// ttsObj.VERSION is the Pro version when Pro is functional (TTA_Admin), so
// each edition is compared against its own beta line.
const isBeforeBeta = (isPro) => {
  const [major, minor] = String(window?.ttsObj?.VERSION || "0.0").split(".").map((n) => parseInt(n, 10) || 0);
  const [betaMajor, betaMinor] = isPro ? [3, 5] : [2, 4];
  return major < betaMajor || (major === betaMajor && minor < betaMinor);
};

export default function BetaInviteCard() {
  const isPro = !!window?.ttsObj?.is_atlasvoice_addon_functional;

  if (!isBeforeBeta(isPro)) {
    return null;
  }

  return (
    <div className="tta-beta-card">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="tta-beta-badge">{__("Beta", "text-to-audio")}</span>
        <span className="tta-beta-version">{isPro ? __("AtlasVoice Pro 3.5", "text-to-audio") : __("AtlasVoice 2.4", "text-to-audio")}</span>
      </div>
      <h5 className="tta-beta-title">
        {isPro ? __("AtlasVoice Cloud, included", "text-to-audio") : __("Natural voice, now free", "text-to-audio")}
      </h5>
      <p className="tta-beta-text">
        {isPro
          ? __("380 natural voices in 47 languages, included with your Pro licence. No API key needed.", "text-to-audio")
          : __("The same natural voice on every phone, browser and computer. Free for 100,000 characters a month.", "text-to-audio")}
      </p>
      <ul className="tta-beta-list">
        {isPro ? (
          <>
            <li>{__("Many natural voices instead of one robotic voice", "text-to-audio")}</li>
            <li>{__("Same sound on every device", "text-to-audio")}</li>
          </>
        ) : (
          <>
            <li>{__("Works on iPhone and Android", "text-to-audio")}</li>
            <li>{__("Saved as MP3, no robotic device voices", "text-to-audio")}</li>
          </>
        )}
      </ul>
      <div className="d-flex gap-2 flex-wrap">
        <a className="btn btn-sm tta-beta-primary" href={betaUrl(isPro ? "pro" : "free", "sidebar_beta_card")} target="_blank" rel="noopener noreferrer">
          {isPro ? __("Join the beta", "text-to-audio") : __("Try the beta", "text-to-audio")}
        </a>
        <a className="btn btn-sm btn-outline-secondary" href={betaFeedbackUrl("sidebar_beta_feedback")} target="_blank" rel="noopener noreferrer">
          {__("Send feedback", "text-to-audio")}
        </a>
      </div>
      <p className="tta-beta-note">
        {isPro
          ? __("Install the free 2.4 beta first, then Pro 3.5.", "text-to-audio")
          : __("Your settings are kept. You can go back to 2.3 any time.", "text-to-audio")}
      </p>
    </div>
  );
}
