import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { proUrl } from "../../../proUrl";

/**
 * TTS-329: SEO & AI Search.
 *
 * Audio structured data (schema.org AudioObject, speakable, crawler links) is a
 * Pro feature. When the AtlasVoice add-on is active it mounts its own settings
 * screen into the #tts_seo_pro slot below (a React island, like Integrations).
 * Without it the free plugin shows what the feature does and a link to Pro —
 * no schema code and no settings ship in the free build.
 */
export default function SeoAiSearch() {
  const isAddonActive =
    typeof ttsObj !== "undefined" && ttsObj.is_atlasvoice_addon_functional;

  if (isAddonActive) {
    return (
      <Container fluid className="tta-container">
        <div id="tts_seo_pro"></div>
      </Container>
    );
  }

  const points = [
    __("Describes each post's MP3 to Google as an AudioObject, with its real length, language and date.", "text-to-audio"),
    __("Joins the schema of Yoast SEO, Rank Math or All in One SEO, so a page never has two descriptions.", "text-to-audio"),
    __("Speakable markup for Google Assistant, with CSS selectors you choose.", "text-to-audio"),
    __("A plain MP3 link for AI crawlers that don't run JavaScript, such as GPTBot, ClaudeBot and PerplexityBot.", "text-to-audio"),
  ];

  return (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <h2 className="fs-3 fw-bold mb-2 text-dark">
              {__("SEO & AI Search", "text-to-audio")}
            </h2>
            <p className="text-secondary m-0 small">
              {__(
                "Help Google and AI assistants find, show and cite your posts' audio.",
                "text-to-audio"
              )}
            </p>
          </div>

          <div className="tta-card mb-3" style={{ padding: "32px 28px" }}>
            <h5 className="fw-semibold mb-2">
              {__("Audio schema is available in AtlasVoice Pro", "text-to-audio")}
            </h5>
            <p className="text-secondary small mb-3">
              {__(
                "AtlasVoice Pro adds the structured data search engines and AI assistants read for your posts' MP3 audio:",
                "text-to-audio"
              )}
            </p>
            <ul className="small mb-4" style={{ paddingLeft: 18, listStyle: "disc" }}>
              {points.map((point) => (
                <li key={point} className="mb-1">
                  {point}
                </li>
              ))}
            </ul>
            <a
              className="btn btn-primary"
              href={proUrl("seo_ai_search", "pricing")}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#FF7853", borderColor: "#FF7853" }}
            >
              {__("See Pro plans", "text-to-audio")}
            </a>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
