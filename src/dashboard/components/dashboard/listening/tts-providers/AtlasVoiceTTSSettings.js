import React, { useEffect, useState } from "react";
import { Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import { __, sprintf } from "@wordpress/i18n";

import { GTTS_LANGUAGES } from "../gttsLanguages";
import AtlasVoiceUsage from "../../atlasvoice/AtlasVoiceUsage";

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

export default function AtlasVoiceTTSSettings({ listeningSettings, handleChange, onConnected, showLanguage = true }) {
  const [state, setState] = useState(null);
  const [consent, setConsent] = useState(false);
  // Optional and unticked by default (opt-in only).
  const [shareDiagnostics, setShareDiagnostics] = useState(false);
  const [showCollected, setShowCollected] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  // The site is registered to another email: offer to move it (proves control of the site).
  const [takeoverOffer, setTakeoverOffer] = useState(null);
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
      const res = await call("POST", { consent, email, share_diagnostics: shareDiagnostics });
      if (res?.status) {
        setState(res.data);
        setTakeoverOffer(null);
        onConnected && onConnected(res.data);
      } else if (res?.code === "project_exists" && res?.takeover) {
        setTakeoverOffer({ ownerHint: res.ownerHint || "" });
      } else {
        setError(res?.message || __("Could not connect. Please try again.", "text-to-audio"));
      }
    } catch (e) {
      setError(__("Could not connect. Please try again.", "text-to-audio"));
    }
    setBusy(false);
  };

  // Move this site to the email above: the service checks a one-time code this
  // site publishes, so only someone who runs the site can do it.
  const moveSite = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await call("POST", { consent, email, takeover: true, share_diagnostics: shareDiagnostics });
      if (res?.status) {
        setState(res.data);
        setTakeoverOffer(null);
        onConnected && onConnected(res.data);
      } else {
        setError(res?.message || __("Could not move the site. Please try again.", "text-to-audio"));
      }
    } catch (e) {
      setError(__("Could not move the site. Please try again.", "text-to-audio"));
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

        {state && !state.connected && state.keyRevoked && (
          <Alert variant="warning" className="small">
            <strong>{__("This site was disconnected.", "text-to-audio")}</strong>{" "}
            {__("Its key was revoked in your AtlasVoice dashboard, so posts are read by the browser voice. Press Connect below to get a new key.", "text-to-audio")}
          </Alert>
        )}

        {state && !state.connected && (
          <>
            <p className="small mb-2">
              {__("Reads your posts with a natural Google voice and saves each post's audio as an MP3 on your site, so every phone and browser plays the same audio.", "text-to-audio")}
            </p>
            <p className="small text-secondary mb-2">
              {__("The first time someone plays a post, its text and your site address are sent to the AtlasVoice service to make the audio. The free plan includes a monthly allowance.", "text-to-audio")}
            </p>

            <div className="small mb-3 p-3 rounded border bg-light">
              <strong className="d-block mb-1">{__("Your content stays yours", "text-to-audio")}</strong>
              <ul className="mb-0 ps-3">
                <li>{__("We never store your post text. It is used once, to create the audio, and then discarded.", "text-to-audio")}</li>
                <li>{__("We never sell it, reuse it or use it to train AI. It goes only to Google's voice engine, to be read aloud.", "text-to-audio")}</li>
                <li>{__("The MP3 is saved on your own site. Our temporary copy is deleted within minutes.", "text-to-audio")}</li>
                <li>{__("We keep only what the service needs: your site address, the email below, and usage records (characters, language and post ID, never the text).", "text-to-audio")}</li>
              </ul>
            </div>

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

            {state.diagnostics?.offer && (
              <div className="mb-3 small">
                <Form.Check
                  id="atlasvoice_share_diagnostics"
                  checked={shareDiagnostics}
                  onChange={(e) => setShareDiagnostics(e.target.checked)}
                  label={__("Help improve AtlasVoice by sharing non-sensitive diagnostic data and usage information (optional). You can turn this off at any time.", "text-to-audio")}
                />
                <Button variant="link" size="sm" className="p-0 ms-4 small" type="button" aria-expanded={showCollected} onClick={() => setShowCollected((v) => !v)}>
                  {showCollected ? __("Hide what we collect", "text-to-audio") : __("What we collect", "text-to-audio")}
                </Button>
                {showCollected && (
                  <div className="text-secondary ms-4 mt-1">
                    <ul className="mb-1 ps-3">
                      {state.diagnostics.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    {__("No sensitive data is tracked.", "text-to-audio")}
                  </div>
                )}
              </div>
            )}

            <Button className="tta_btn" type="button" disabled={!consent || !email || busy} onClick={connect}>
              {busy ? __("Connecting…", "text-to-audio") : __("Connect", "text-to-audio")}
            </Button>
          </>
        )}

        {state && state.connected && state.pendingApproval && (
          <Alert variant="warning" className="small">
            {/* The owner must act in their inbox: say what to open and what to click. */}
            <strong>{__("One step left: approve this site from your email.", "text-to-audio")}</strong>
            <ol className="mb-2 mt-2 ps-3">
              <li>
                {sprintf(
                  /* translators: 1: email address of the AtlasVoice account, 2: email subject. */
                  __("Open the inbox of %1$s and find the email “%2$s” (check spam too).", "text-to-audio"),
                  state.email,
                  __("Approve a new site for your AtlasVoice account", "text-to-audio")
                )}
              </li>
              <li>{__("Click Approve in that email.", "text-to-audio")}</li>
              <li>{__("Come back here and reload this page.", "text-to-audio")}</li>
            </ol>
            <div>
              {sprintf(
                /* translators: %s: email address of the AtlasVoice account. */
                __("Why: %s already has an AtlasVoice account, so its owner must allow each new site. Until then, posts are read by the browser voice.", "text-to-audio"),
                state.email
              )}{" "}
              {state.dashboardUrl && (
                <a href={`${state.dashboardUrl}/projects`} target="_blank" rel="noreferrer">
                  {__("You can also approve it in your AtlasVoice dashboard, under Projects.", "text-to-audio")}
                </a>
              )}
            </div>
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
            {state.licenseSeatsFull && state.plan !== "premium" && (
              <Alert variant="warning" className="small">
                {__("Your AtlasVoice Pro licence is already used on all the sites it covers, so this site stays on the Free allowance.", "text-to-audio")}{" "}
                {__("Remove the licence from another site, or upgrade to a licence with more sites. This site becomes Premium within an hour of a seat being free.", "text-to-audio")}
                <div className="mt-2">
                  <a href={`${String(state.dashboardUrl || `${String(state.serviceUrl || "").replace(/\/+$/, "")}/app`).replace(/\/+$/, "")}/projects`} target="_blank" rel="noopener noreferrer">{__("Manage your sites", "text-to-audio")}</a>
                  {" · "}
                  <a href="https://atlasaidev.com/text-to-speech-pro/" target="_blank" rel="noopener noreferrer">{__("Upgrade the licence", "text-to-audio")}</a>
                </div>
              </Alert>
            )}
            <AtlasVoiceUsage summary={state.usageSummary} cta={state.upgradeCta} />
            <Button variant="link" className="p-0 mt-3 small" type="button" disabled={busy} onClick={disconnect}>
              {__("Disconnect", "text-to-audio")}
            </Button>
          </>
        )}

        {takeoverOffer && state && !state.connected && (
          <Alert variant="warning" className="mt-3 mb-0 small">
            <strong>
              {takeoverOffer.ownerHint
                ? sprintf(
                    /* translators: %s: masked email of the account that registered this site, e.g. a•••@gmail.com. */
                    __("This site is already connected to another AtlasVoice account (%s).", "text-to-audio"),
                    takeoverOffer.ownerHint
                  )
                : __("This site is already connected to another AtlasVoice account.", "text-to-audio")}
            </strong>
            <div className="mt-1">
              {sprintf(
                /* translators: %s: the email address entered above. */
                __("If you run this site, you can move it to %s. We confirm you control the site with a one-time check; its old key stops working and the old address is told.", "text-to-audio"),
                email
              )}
            </div>
            <Button className="tta_btn mt-2" type="button" disabled={!consent || !email || busy} onClick={moveSite}>
              {busy ? __("Checking the site…", "text-to-audio") : __("Move this site to my email", "text-to-audio")}
            </Button>
          </Alert>
        )}
        {error && <Alert variant="danger" className="mt-3 mb-0 small">{error}</Alert>}
      </div>

      {showLanguage && (
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
      )}
    </>
  );
}
