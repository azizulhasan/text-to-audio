import React from "react";
import { __ } from "@wordpress/i18n";
import { betaUrl, betaFeedbackUrl } from "../proUrl";

/**
 * TTS-352: invitation to the AtlasVoice 2.4 beta at the top of the dashboard
 * sidebar. Most complaints were robotic or device-dependent voices; 2.4 fixes
 * them, so every Free and Pro user is asked to try it and tell us. Kept to one
 * headline and one line so it reads in a few seconds (owner, 2026-10-23).
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
    <div className="tta-promo-card tta-beta-card">
      <span className="tta-promo-tag tta-beta-tag">
        {isPro ? __("New · Pro 3.5 beta", "text-to-audio") : __("New · 2.4 beta", "text-to-audio")}
      </span>
      <h5 className="tta-promo-title">
        {isPro ? __("380 natural voices, included", "text-to-audio") : __("Natural voice, now free", "text-to-audio")}
      </h5>
      <p className="tta-promo-text">
        {isPro
          ? __("AtlasVoice Cloud with your licence. No API key.", "text-to-audio")
          : __("Same voice on every phone and browser.", "text-to-audio")}
      </p>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <a className="btn btn-sm tta-promo-btn tta-beta-btn" href={betaUrl(isPro ? "pro" : "free", "sidebar_beta_card")} target="_blank" rel="noopener noreferrer">
          {isPro ? __("Join the beta", "text-to-audio") : __("Try the beta", "text-to-audio")}
        </a>
        <a className="tta-promo-link tta-beta-link" href={betaFeedbackUrl("sidebar_beta_feedback")} target="_blank" rel="noopener noreferrer">
          {__("Send feedback", "text-to-audio")}
        </a>
      </div>
    </div>
  );
}
