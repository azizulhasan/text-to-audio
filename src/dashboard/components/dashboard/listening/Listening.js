import React, { useEffect, useState } from "react";
import { Col, Container, Row, Form, Button } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import { proUrl } from "../../../proUrl";
import UpgradeToPro from "../../UpgradeToPro";

// Free ships only player 1 (browser SpeechSynthesis voices). Player 2 ("Default
// Pro", also browser-based) and players 3-6 (Google Cloud / ChatGPT / ElevenLabs)
// are add-on features. Their Listening UI — provider voice settings, Pro voice
// loading, and multilingual mapping — lives entirely in the AtlasVoice add-on and
// is mounted into the #tts_listening_pro slot below when the add-on is active.
import DefaultPlayerSettings from "./tts-providers/DefaultPlayerSettings";

// Multilingual plugin basenames the add-on can map voices for (Pro feature).
const MULTILINGUAL_PLUGINS = {
  "gtranslate/gtranslate.php": "GTranslate",
  "sitepress-multilingual-cms/sitepress.php": "WPML",
  "translatepress-multilingual/index.php": "TranslatePress",
  "polylang/polylang.php": "Polylang",
};

/**
 * Detect an active multilingual plugin from the free plugin's own compatibility
 * data (ttsObj.compatible only contains active plugins). Returns the display name
 * or "" if none is active.
 */
function detectMultilingualPlugin() {
  const compatible =
    (typeof ttsObj !== "undefined" && ttsObj.compatible) || {};
  for (const basename in MULTILINGUAL_PLUGINS) {
    if (compatible[basename]) {
      return MULTILINGUAL_PLUGINS[basename];
    }
  }
  return "";
}

export default function Listening() {
  const [customizationSettings, setCustomizationSettings] = useState({});
  const [listeningSettings, setListeningSettings] = useState({
    tta__listening_voice: "Google UK English Female",
    tta__listening_pitch: 1,
    tta__listening_rate: 1,
    tta__listening_volume: 1,
    tta__listening_lang: "en-GB",
  });
  const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState({});
  const [browserVoices, setBrowserVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const addonActive =
    typeof ttsObj !== "undefined" && !!ttsObj.is_atlasvoice_addon_functional;
  // Multilingual voice mapping is an add-on feature; show the upsell only to free
  // users (no add-on). With the add-on active, mapping lives in the Pro Listening
  // island for players 2-6.
  const multilingualPlugin = !addonActive ? detectMultilingualPlugin() : "";
  const playerId = customizationSettings?.buttonSettings?.id || 1;
  // Free owns player 1 only; player >= 2 is an add-on player (rendered by the
  // add-on into the #tts_listening_pro slot below).
  const isAddonPlayer = playerId >= 2 && addonActive;

  // ── Load browser voices (player 1) ──────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      setBrowserVoices(voices);
      setFilteredVoices(voices);
      const langs = {};
      voices.forEach((v) => {
        if (v.lang) langs[v.lang] = v.lang;
      });
      setCurrentPlayerLanguages(langs);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Initial data load (settings + selected player) ──────────────────
  useEffect(() => {
    const listening = new FormData();
    listening.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/listening", listening)
      .then((res) => {
        if (res?.data) {
          setListeningSettings((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch((err) => console.log(err));

    const customize = new FormData();
    customize.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/customize", customize)
      .then((res) => {
        if (!res.data.buttonSettings) {
          res.data.buttonSettings = { id: 1 };
        } else if (!res.data.buttonSettings.id) {
          res.data.buttonSettings.id = 1;
        }
        setCustomizationSettings(res.data);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.log(err);
        setIsLoaded(true);
      });
  }, []);

  // ── Field change ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "tta__listening_lang") {
      const matched = browserVoices.filter((v) => v.lang === value);
      setFilteredVoices(matched.length ? matched : browserVoices);
    }
    setListeningSettings((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save (player 1) ─────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const formData = {};
    for (const [key, value] of form.entries()) {
      formData[key] = value;
    }
    const data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(tta_obj.api_url + "tta/v1/listening", data)
      .then((res) => {
        if (res?.data) setListeningSettings(res.data);
        toast(
          __("Listening settings saved. Now all setup done. Enjoy", "text-to-audio"),
          "info",
          { autoClose: 15000 }
        );
      })
      .catch((err) => console.log(err));
  };

  // Players 2-6 are add-on players: the add-on mounts its OWN full-width
  // Listening UI (header, provider voices, multilingual mapping, save) into this
  // slot. Render only the bare slot — no Free header or column wrapper — so there
  // is no duplicate "Listening Preferences" header and no nested/narrower column.
  if (isAddonPlayer) {
    return <div id="tts_listening_pro"></div>;
  }

  return (
    <Container>
      <Row>
        <Col xs={12} sm={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 mt-3 shadow-sm">
            <h2 className="tta_listening_title">{__("Listening Preferences", "text-to-audio")}</h2>
            <p className="tta_listening_subtitle">
              {__("Set your listening preferences with different voices and languages.", "text-to-audio")}
            </p>
          </div>

            <Form onSubmit={handleSubmit}>
              <DefaultPlayerSettings
                listeningSettings={listeningSettings}
                currentPlayerLanguages={currentPlayerLanguages}
                currentPlayerFilteredVoices={filteredVoices}
                handleChange={handleChange}
              />

              {multilingualPlugin && (
                <div
                  className="tta-card mb-3 mt-3 text-center"
                  style={{ padding: "32px 24px" }}
                >
                  <div style={{ fontSize: 30, marginBottom: 8 }} aria-hidden="true">
                    {"🌐"}
                  </div>
                  <h5 className="fw-semibold mb-2">
                    {__("Multilingual Voice Mapping — Pro Feature", "text-to-audio")}
                  </h5>
                  <p
                    className="text-secondary small mb-3 mx-auto"
                    style={{ maxWidth: 460 }}
                  >
                    {__(
                      "We detected an active translation plugin. Mapping a voice and language to each translated language is available in AtlasVoice Pro.",
                      "text-to-audio"
                    )}
                  </p>
                  <a
                    className="btn btn-primary"
                    href={proUrl('listening_tab')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "#FF7853", borderColor: "#FF7853" }}
                  >
                    {__("Upgrade to Pro", "text-to-audio")}
                  </a>
                </div>
              )}

              <div
                className="position-sticky bottom-0"
                style={{ zIndex: 1030, marginTop: "20px" }}
              >
                <Button type="submit" className="tta_btn">
                  {__("Save", "text-to-audio")}
                </Button>
              </div>
            </Form>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <UpgradeToPro showDemoCard={true} />
        </Col>
      </Row>
    </Container>
  );
}
