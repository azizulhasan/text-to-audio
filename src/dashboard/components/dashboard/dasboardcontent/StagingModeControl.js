import React, { useState } from "react";
import { __ } from "@wordpress/i18n";
import { Button, Modal } from "react-bootstrap";
import qrcode from "qrcode-generator";
import { postData } from "../../context/utilities";

/**
 * TTS-351: Staging / Live pill for the dashboard header, with Go live (or
 * Back to staging) and, in staging, "Test on your phone".
 *
 * Go live / Back to staging open the shared dialog printed by
 * TTA\AtlasVoice\Mode::render_inline_script() (window.atlasvoiceGoLive /
 * atlasvoiceRevert), which reloads the page on success.
 */
export default function StagingModeControl() {
  const isLive = (window?.tta_obj?.atlasvoice_mode || "production") === "production";
  const [showPhone, setShowPhone] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const switchMode = () => {
    const fn = isLive ? window.atlasvoiceRevert : window.atlasvoiceGoLive;
    if (typeof fn === "function") {
      fn();
    }
  };

  const openPhonePreview = async () => {
    setShowPhone(true);
    setError("");
    setCopied(false);
    setLoading(true);
    try {
      const res = await postData(`${ttsObj.api_url}tta/v1/preview-link`, undefined);
      if (res && res.status && res.url) {
        const qr = qrcode(0, "M");
        qr.addData(res.url);
        qr.make();
        setPreview({ url: res.url, qr: qr.createDataURL(5, 8) });
      } else {
        setError((res && res.message) || __("The preview link could not be created. Please try again.", "text-to-audio"));
      }
    } catch (e) {
      setError(__("The preview link could not be created. Please try again.", "text-to-audio"));
    }
    setLoading(false);
  };

  const copyLink = () => {
    if (preview && navigator.clipboard) {
      navigator.clipboard.writeText(preview.url).then(() => setCopied(true));
    }
  };

  return (
    <div className="tta-mode-control d-flex align-items-center gap-2 ms-3 flex-wrap">
      <span className={`tta-mode-pill ${isLive ? "is-live" : "is-staging"}`}>
        <span className="tta-mode-dot" aria-hidden="true" />
        {isLive ? __("Live", "text-to-audio") : __("Staging", "text-to-audio")}
      </span>

      <button type="button" className="btn btn-sm tta-mode-btn" onClick={switchMode}>
        {isLive ? __("Back to staging", "text-to-audio") : __("Go live", "text-to-audio")}
      </button>

      {!isLive && (
        <button type="button" className="btn btn-sm tta-mode-btn tta-mode-btn--ghost" onClick={openPhonePreview}>
          {__("Test on your phone", "text-to-audio")}
        </button>
      )}

      <Modal show={showPhone} onHide={() => setShowPhone(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "18px" }}>{__("Test the player on your phone", "text-to-audio")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && <p className="m-0">{__("Creating your private link…", "text-to-audio")}</p>}
          {error && <p className="m-0 text-danger">{error}</p>}
          {preview && !loading && (
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <img src={preview.qr} alt={__("QR code for the private preview link", "text-to-audio")} width="180" height="180" />
              <div style={{ flex: "1 1 200px" }}>
                <p className="mb-2">{__("Scan this code with your phone's camera. Your newest post opens with the player, even though you're not logged in there.", "text-to-audio")}</p>
                <p className="mb-2 text-muted" style={{ fontSize: "13px" }}>{__("The link is private and works for 24 hours. Visitors without it still see nothing until you go live.", "text-to-audio")}</p>
                <Button variant="outline-secondary" size="sm" onClick={copyLink}>
                  {copied ? __("Link copied", "text-to-audio") : __("Copy link", "text-to-audio")}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
