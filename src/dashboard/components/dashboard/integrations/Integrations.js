import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import UpgradeToPro from "../../UpgradeToPro";
import { proUrl } from "../../../proUrl";

/**
 * TTS-250: Voice-provider integrations (Google Cloud TTS, ChatGPT, ElevenLabs)
 * are a Pro-only feature — they configure server-side AI voices that generate
 * MP3 audio, which the free browser-SpeechSynthesis player does not use.
 *
 * The provider setup UI (API-key forms, authentication, usage panels) has been
 * removed from the free plugin entirely. When the AtlasVoice add-on is active it
 * mounts its OWN provider UI into the #tts_integrations_pro slot below (a React
 * island, the same pattern as the customize preview). When the add-on is absent
 * the free plugin shows a static upsell and nothing else — no provider code, no
 * API-key fields ship in the free build.
 */
export default function Integrations() {
  const isAddonActive =
    typeof ttsObj !== "undefined" && ttsObj.is_atlasvoice_addon_functional;

  return (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <h2 className="fs-3 fw-bold mb-2 text-dark">
              {__("Integration Setup", "text-to-audio")}
            </h2>
            <p className="text-secondary m-0 small">
              {__(
                "Connect premium AI voice providers to generate natural MP3 audio.",
                "text-to-audio"
              )}
            </p>
          </div>

          {isAddonActive ? (
            /* The active AtlasVoice add-on mounts its provider configuration
               UI into this slot (React island). The free plugin ships none of
               that code. */
            <div id="tts_integrations_pro"></div>
          ) : (
            <div
              className="tta-card mb-3 text-center"
              style={{ padding: "40px 24px" }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">
                {"🔒"}
              </div>
              <h5 className="fw-semibold mb-2">
                {__("Voice Integrations — Pro Feature", "text-to-audio")}
              </h5>
              <p
                className="text-secondary small mb-3 mx-auto"
                style={{ maxWidth: 460 }}
              >
                {__(
                  "Google Cloud TTS, ChatGPT, and ElevenLabs integrations are available in AtlasVoice Pro. The free plugin uses your browser's built-in voices.",
                  "text-to-audio"
                )}
              </p>
              <a
                className="btn btn-primary"
                href={proUrl('integrations', 'product')}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#FF7853", borderColor: "#FF7853" }}
              >
                {__("Upgrade to Pro", "text-to-audio")}
              </a>
            </div>
          )}
        </Col>
        <Col xs={12} lg={4}>
          <UpgradeToPro />
        </Col>
      </Row>
    </Container>
  );
}
