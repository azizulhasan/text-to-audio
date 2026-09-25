import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { __ } from "@wordpress/i18n";

import AtlasVoiceUsage from "./AtlasVoiceUsage";
import { proUrl } from "../../../proUrl";

import "./atlasvoice.css";

const HIDE_KEY = "atlasvoice_tts_card_hidden";

function isHidden() {
  try {
    return window.localStorage.getItem(HIDE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

/**
 * TTS-320: the top of the Settings tab.
 *  - Sites on the browser voice: what AtlasVoice TTS is, and a way to set it up.
 *  - Waiting for the email confirmation: say so.
 *  - Connected: this month's allowance.
 * Reads window.tta_obj.atlasvoiceTts (saved options; no call to the service).
 */
export default function AtlasVoiceSettingsCard() {
  const data = window.tta_obj?.atlasvoiceTts || null;
  const addonActive = !!window.tta_obj?.is_atlasvoice_addon_functional;
  const location = useLocation();
  const hearRequested = new URLSearchParams(location.search).get("hear") === "atlasvoice-tts";

  const [hidden, setHidden] = useState(isHidden());
  const [hear, setHear] = useState(hearRequested);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis && window.speechSynthesis.cancel(), []);

  if (!data) {
    return null;
  }

  const hide = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch (e) {
      // Private window: the card just shows again next time.
    }
    setHidden(true);
  };

  const playBrowserVoice = () => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      __("This is how your posts sound today: the voice your visitor's device has.", "text-to-audio")
    );
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (data.pending) {
    return (
      <div className="bg-white rounded p-3 mb-3 shadow-sm">
        <h3 className="tta_voice_card_title">{__("AtlasVoice TTS", "text-to-audio")}</h3>
        <p className="small mb-0">
          <span className="badge bg-warning text-dark me-2">{__("Waiting for your email", "text-to-audio")}</span>
          {__("Confirm the link we sent you. Visitors keep the browser voice until then.", "text-to-audio")}
        </p>
      </div>
    );
  }

  if (data.connected && Number(data.playerId) === 3 && data.usage && data.usage.band !== "none") {
    return (
      <div className="bg-white rounded p-3 mb-3 shadow-sm">
        <h3 className="tta_voice_card_title">{__("AtlasVoice TTS", "text-to-audio")}</h3>
        <AtlasVoiceUsage summary={data.usage} cta={data.cta} explain={false} />
        <a className="small d-inline-block mt-2" href="#/listening">{__("See usage and options", "text-to-audio")}</a>
      </div>
    );
  }

  const browserVoiceSite = Number(data.playerId) === 1 && !data.connected && !addonActive;
  if (!browserVoiceSite || (hidden && !hearRequested)) {
    return null;
  }

  return (
    <div className="tta-launch-card mb-3">
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className="tta-launch-chip">{__("NEW", "text-to-audio")}</span>
        <button type="button" className="btn btn-link p-0 small" onClick={hide}>
          {__("Hide", "text-to-audio")}
        </button>
      </div>
      <h3 className="tta_voice_card_title mt-2">{__("A natural voice for your posts, free", "text-to-audio")}</h3>
      <ul className="small">
        <li>{__("One voice for every visitor, instead of whatever their device has", "text-to-audio")}</li>
        <li>{__("100,000 characters a month free; audio is saved, so replays cost nothing", "text-to-audio")}</li>
        <li>{__("Works in every browser, even where the device has no voice for your language", "text-to-audio")}</li>
      </ul>
      <div className="d-flex flex-wrap gap-2">
        <a className="btn tta-launch-btn" href="#/listening?setup=atlasvoice-tts">
          {__("Set up AtlasVoice TTS", "text-to-audio")}
        </a>
        <button type="button" className="btn tta-launch-btn tta-outline-btn" aria-expanded={hear} onClick={() => setHear((v) => !v)}>
          {hear ? __("Hide the comparison", "text-to-audio") : __("Hear the difference", "text-to-audio")}
        </button>
      </div>
      {hear && (
        <div className="tta-compare small">
          <p className="mb-2">
            <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={playBrowserVoice}>
              {speaking ? __("Stop", "text-to-audio") : __("Play your browser voice", "text-to-audio")}
            </button>
            {__("What visitors hear today.", "text-to-audio")}
          </p>
          <p className="mb-0">
            <a href={proUrl("settings_atlasvoice_tts", "demo")} target="_blank" rel="noopener noreferrer">
              {__("Hear natural voices on our live demo page", "text-to-audio")}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
