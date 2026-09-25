import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

import AtlasVoiceTTSSettings from "../listening/tts-providers/AtlasVoiceTTSSettings";
import { pickAtlasVoiceLanguage } from "../listening/gttsLanguages";
import { postWithoutImage } from "../../context/utilities";

import "./atlasvoice.css";

/**
 * TTS-320: shown in Listening on sites that read posts with the browser voice.
 * Connecting here switches the player to AtlasVoice TTS; visitors keep the
 * browser voice until the owner confirms the email (the site serves player 1
 * until the service can make audio).
 *
 * @param {Object}   props
 * @param {Object}   props.customizationSettings Saved customize settings.
 * @param {Object}   props.listeningSettings     Saved listening settings.
 * @param {boolean}  [props.openOnLoad]          Opened from the admin notice.
 */
export default function AtlasVoiceTtsOffer({ customizationSettings, listeningSettings, openOnLoad = false }) {
  const [open, setOpen] = useState(openOnLoad);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const switchPlayer = async () => {
    setSwitching(true);
    setError("");
    try {
      const customize = new FormData();
      customize.append("method", "post");
      customize.append(
        "fields",
        JSON.stringify({
          ...customizationSettings,
          buttonSettings: { ...(customizationSettings.buttonSettings || {}), id: 3 },
        })
      );
      await postWithoutImage(tta_obj.api_url + "tta/v1/customize", customize);

      const listening = new FormData();
      listening.append("method", "post");
      listening.append(
        "fields",
        JSON.stringify({
          ...listeningSettings,
          tta__listening_lang: pickAtlasVoiceLanguage(listeningSettings.tta__listening_lang),
        })
      );
      await postWithoutImage(tta_obj.api_url + "tta/v1/listening", listening);

      window.location.reload();
    } catch (e) {
      setError(__("Connected, but the player could not be switched. Choose AtlasVoice TTS in Customization.", "text-to-audio"));
      setSwitching(false);
    }
  };

  if (open) {
    return (
      <div className="mb-3">
        <AtlasVoiceTTSSettings
          listeningSettings={listeningSettings}
          handleChange={() => {}}
          onConnected={switchPlayer}
          showLanguage={false}
        />
        {switching && <p className="small text-secondary">{__("Switching your player to AtlasVoice TTS…", "text-to-audio")}</p>}
        {error && <p className="small text-danger">{error}</p>}
        <Button variant="link" className="p-0 small" type="button" onClick={() => setOpen(false)} disabled={switching}>
          {__("Keep the browser voice", "text-to-audio")}
        </Button>
      </div>
    );
  }

  return (
    <div className="tta-launch-card mb-3">
      <span className="tta-launch-chip">{__("NEW · FREE", "text-to-audio")}</span>
      <h3 className="tta_voice_card_title mt-2">{__("AtlasVoice TTS", "text-to-audio")}</h3>
      <p className="small mb-3">
        {__("Your visitors hear their own device’s voice. It changes between Chrome, Safari and Android, and some languages have no voice at all. AtlasVoice TTS reads every post in one natural voice, free for 100,000 characters a month.", "text-to-audio")}
      </p>
      <div className="d-flex flex-wrap gap-2">
        <Button className="tta-launch-btn" type="button" onClick={() => setOpen(true)}>
          {__("Switch to AtlasVoice TTS", "text-to-audio")}
        </Button>
        <a className="btn tta-launch-btn tta-outline-btn" href="#/?hear=atlasvoice-tts">
          {__("Hear it first", "text-to-audio")}
        </a>
      </div>
    </div>
  );
}
