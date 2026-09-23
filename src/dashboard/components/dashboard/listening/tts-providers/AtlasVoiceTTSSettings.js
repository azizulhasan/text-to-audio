import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, ProgressBar, Alert, Spinner } from "react-bootstrap";
import { __, sprintf } from "@wordpress/i18n";

import { GTTS_LANGUAGES } from "../gttsLanguages";

/**
 * TTS-314: Listening settings for player 3 (AtlasVoice TTS).
 *
 * Two parts: connecting the site to the AtlasVoice service (consent + email,
 * wp.org Guideline 7 — nothing is sent before this), and the one language posts
 * are read in. The service meters a monthly allowance; this screen only shows it.
 */
const endpoint = () => String(window.tta_obj?.api_url || window.ttsObj?.api_url || "/wp-json/") + "tta/v1/atlasvoice_service";

async function call(method, body) {
  const res = await fetch(endpoint(), {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-WP-Nonce": window.ttsObj?.rest_nonce || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch (e) {
    return String(n);
  }
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(new Date(iso));
  } catch (e) {
    return iso;
  }
}

function UsageBlock({ state }) {
  const usage = state.usage || {};
  const premium = usage.chars_limit === null || state.plan === "premium";

  if (premium) {
    return (
      <p className="mb-0 text-secondary small">
        {__("Premium plan: no monthly limit.", "text-to-audio")}
      </p>
    );
  }

  if (typeof usage.chars_limit !== "number") {
    return null;
  }

  const used = Math.min(usage.chars_used || 0, usage.chars_limit);
  const percent = usage.chars_limit ? Math.round((used / usage.chars_limit) * 100) : 0;

  return (
    <div>
      <div className="d-flex justify-content-between small mb-1">
        <span>
          {sprintf(
            /* translators: 1: characters used, 2: monthly allowance. */
            __("%1$s of %2$s characters used this month", "text-to-audio"),
            formatNumber(usage.chars_used || 0),
            formatNumber(usage.chars_limit)
          )}
        </span>
        {usage.resets_at && (
          <span className="text-secondary">
            {sprintf(
              /* translators: %s: date the allowance resets. */
              __("Resets %s", "text-to-audio"),
              formatDate(usage.resets_at)
            )}
          </span>
        )}
      </div>
      <ProgressBar now={percent} variant={percent >= 100 ? "danger" : percent >= 80 ? "warning" : "success"} aria-label={__("Monthly allowance used", "text-to-audio")} />
      {state.exhausted && (
        <Alert variant="warning" className="mt-3 mb-0 small">
          {__("This month's allowance is used up. Posts that already have audio keep playing; new or edited posts are read by the browser voice until it resets.", "text-to-audio")}
        </Alert>
      )}
    </div>
  );
}

export default function AtlasVoiceTTSSettings({ listeningSettings, handleChange }) {
  const [state, setState] = useState(null);
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    call("GET")
      .then((res) => {
        if (res?.data) {
          setState(res.data);
          setEmail(res.data.email || "");
        }
      })
      .catch(() => setError(__("Could not load the AtlasVoice TTS status.", "text-to-audio")));
  }, []);

  const connect = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await call("POST", { consent, email });
      if (res?.status) {
        setState(res.data);
      } else {
        setError(res?.message || __("Could not connect. Please try again.", "text-to-audio"));
      }
    } catch (e) {
      setError(__("Could not connect. Please try again.", "text-to-audio"));
    }
    setBusy(false);
  };

  const disconnect = async () => {
    setBusy(true);
    const res = await call("DELETE").catch(() => null);
    if (res?.data) {
      setState(res.data);
      setConsent(false);
    }
    setBusy(false);
  };

  const language = listeningSettings.tta__listening_lang || "";
  const languageKnown = Object.keys(GTTS_LANGUAGES).some((code) => code.toLowerCase() === String(language).toLowerCase());

  return (
    <>
      <div className="tta_voice_card mb-3">
        <h3 className="tta_voice_card_title">{__("AtlasVoice TTS", "text-to-audio")}</h3>

        {!state && !error && <Spinner animation="border" size="sm" role="status" />}

        {state && !state.connected && (
          <>
            <p className="small mb-2">
              {__("Reads your posts with a natural Google voice and saves each post's audio as an MP3 on your site, so every phone and browser plays the same audio.", "text-to-audio")}
            </p>
            <p className="small text-secondary mb-3">
              {__("To make the audio, the text of a post is sent to the AtlasVoice service the first time someone plays it, together with your site address. The free plan includes a monthly allowance.", "text-to-audio")}
            </p>

            <Form.Group className="mb-3" controlId="atlasvoice_service_email">
              <Form.Label className="small fw-semibold">{__("Email for service notices", "text-to-audio")}</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>

            <Form.Check
              className="mb-3 small"
              id="atlasvoice_service_consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              label={
                <span>
                  {__("I agree to send post text to the AtlasVoice service to create audio.", "text-to-audio")}{" "}
                  <a href={state.termsUrl} target="_blank" rel="noopener noreferrer">{__("Terms", "text-to-audio")}</a>
                  {" · "}
                  <a href={state.privacyUrl} target="_blank" rel="noopener noreferrer">{__("Privacy", "text-to-audio")}</a>
                </span>
              }
            />

            <Button className="tta_btn" type="button" disabled={!consent || !email || busy} onClick={connect}>
              {busy ? __("Connecting…", "text-to-audio") : __("Connect", "text-to-audio")}
            </Button>
          </>
        )}

        {state && state.connected && state.pendingApproval && (
          <Alert variant="warning" className="small">
            {sprintf(
              /* translators: %s: email address of the AtlasVoice account. */
              __("Waiting for approval. %s already has an AtlasVoice account, so we emailed it a link to approve this site. Until then posts are read by the browser voice.", "text-to-audio"),
              state.email
            )}
          </Alert>
        )}

        {state && state.connected && (
          <>
            <p className="small mb-3">
              {state.pendingApproval
                ? <span className="badge bg-warning text-dark me-2">{__("Waiting for approval", "text-to-audio")}</span>
                : <span className="badge bg-success me-2">{__("Connected", "text-to-audio")}</span>}
              {state.plan === "premium" ? __("Premium plan", "text-to-audio") : __("Free plan", "text-to-audio")}
              {state.keyPrefix && <span className="text-secondary ms-2">{sprintf(/* translators: %s: start of the site key. */ __("Key %s…", "text-to-audio"), state.keyPrefix)}</span>}
            </p>
            <UsageBlock state={state} />
            <Button variant="link" className="p-0 mt-3 small" type="button" disabled={busy} onClick={disconnect}>
              {__("Disconnect", "text-to-audio")}
            </Button>
          </>
        )}

        {error && <Alert variant="danger" className="mt-3 mb-0 small">{error}</Alert>}
      </div>

      <Row className="mb-3">
        <Col xs={12} md={6}>
          <div className="tta_voice_card">
            <h3 className="tta_voice_card_title">{__("Voice Language", "text-to-audio")}</h3>
            <Form.Select
              onChange={handleChange}
              name="tta__listening_lang"
              id="tta__listening_lang"
              value={languageKnown ? Object.keys(GTTS_LANGUAGES).find((c) => c.toLowerCase() === language.toLowerCase()) : ""}
              className="tta_orange_voice_select"
            >
              <option value="" disabled>{__("Choose a language", "text-to-audio")}</option>
              {Object.entries(GTTS_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </Form.Select>
            <p className="small text-secondary mt-2 mb-0">
              {__("Posts are read in this language.", "text-to-audio")}
            </p>
          </div>
        </Col>
      </Row>
    </>
  );
}
