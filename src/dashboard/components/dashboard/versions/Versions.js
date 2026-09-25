import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { __, sprintf } from "@wordpress/i18n";

import "../atlasvoice/atlasvoice.css";

/**
 * TTS-320: Versions — go back to an earlier version when an update breaks
 * something. Permanent from the release that introduced it.
 *
 * The server (TTA_Rollback::plan) decides, for this site, whether each older
 * version is safe, works with changes, or is blocked; this screen only shows
 * that and runs the steps. With Pro installed the two plugins roll back as a
 * pair, Pro first (Pro through its own route).
 */
// admin-ajax, like WordPress's own plugin updates (Pro's licensing SDK loads only in wp-admin).
async function request(action, fields = {}) {
  const body = new FormData();
  body.append("action", action);
  body.append("nonce", window.tta_obj?.rollback?.nonce || "");
  Object.entries(fields).forEach(([key, value]) => body.append(key, String(value)));

  const res = await fetch(window.tta_obj?.rollback?.ajaxUrl || "/wp-admin/admin-ajax.php", {
    method: "POST",
    credentials: "same-origin",
    body,
  });
  const json = await res.json().catch(() => null);
  if (!json || !json.success) {
    throw new Error(json?.data?.message || __("Something went wrong. Please try again.", "text-to-audio"));
  }
  return json.data;
}

const STATUS = {
  safe: { className: "tta-status--safe", label: () => __("Safe", "text-to-audio") },
  changes: { className: "tta-status--changes", label: () => __("Works, with changes", "text-to-audio") },
  blocked: { className: "tta-status--blocked", label: () => __("Blocked", "text-to-audio") },
};

export default function Versions() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const [plan, setPlan] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(query.get("mode") || "");
  const [selected, setSelected] = useState(query.get("version") || "");
  const [confirmed, setConfirmed] = useState(false);
  const [pauseAuto, setPauseAuto] = useState(true);
  const [run, setRun] = useState(null); // {steps: [{id, label, state}], error, done}

  const load = () => {
    setLoadError("");
    request("tta_rollback_plan")
      .then((data) => setPlan(data))
      .catch((e) => setLoadError(e.message));
  };

  useEffect(load, []);

  const modes = plan?.modes || {};
  const activeMode = modes[mode] ? mode : modes.both ? "both" : "free";
  const rows = modes[activeMode] || [];

  // Keep a valid, unblocked selection: the recommended row by default.
  const selectedRow = useMemo(() => {
    const row = rows.find((r) => r.version === selected && r.status !== "blocked");
    return row || rows.find((r) => r.recommended) || null;
  }, [rows, selected]);

  useEffect(() => setConfirmed(false), [activeMode, selectedRow?.version]);

  const choose = (nextMode, version) => {
    setMode(nextMode);
    setSelected(version || "");
  };

  const toggleAutoUpdate = (plugin, on) => {
    request("tta_rollback_auto_update", { plugin, on })
      .then((data) => setPlan(data))
      .catch((e) => setLoadError(e.message));
  };

  const start = async () => {
    if (!selectedRow) {
      return;
    }
    const installed = plan.installed;
    const target = selectedRow.target;
    const steps = [];
    // Pro first: an older Pro still runs with the newer AtlasVoice, not the other way round.
    if (installed.pro && target.pro && target.pro !== installed.pro.version) {
      steps.push({
        id: "pro",
        label: sprintf(/* translators: %s: version. */ __("Roll back AtlasVoice Pro to %s", "text-to-audio"), target.pro),
        version: target.pro,
        state: "wait",
      });
    }
    if (target.free && target.free !== installed.free.version) {
      steps.push({
        id: "free",
        label: sprintf(/* translators: %s: version. */ __("Roll back AtlasVoice to %s", "text-to-audio"), target.free),
        version: target.free,
        state: "wait",
      });
    }

    const state = { steps, error: "", done: false, label: selectedRow.label };
    setRun({ ...state });

    for (const step of steps) {
      step.state = "now";
      setRun({ ...state, steps: [...steps] });
      try {
        await request(plan.actions[step.id], { version: step.version, confirmed, pause_auto: pauseAuto });
        step.state = "done";
      } catch (e) {
        step.state = "failed";
        state.error = e.message;
        setRun({ ...state, steps: [...steps] });
        return;
      }
      setRun({ ...state, steps: [...steps] });
    }

    setRun({ ...state, steps: [...steps], done: true });
  };

  // ------------------------------------------------------------------ render

  const header = (
    <div className="bg-white rounded p-3 mb-3 mt-3 shadow-sm">
      <h2 className="tta_listening_title">{__("Versions", "text-to-audio")}</h2>
      <p className="tta_listening_subtitle mb-0">
        {__("Did something stop working after an update? Go back to an earlier version. Each version is checked against your site first, and only versions that will not break it can be picked.", "text-to-audio")}
      </p>
    </div>
  );

  if (!plan) {
    return (
      <Container>
        {header}
        {loadError ? (
          <Alert variant="warning">
            {loadError}{" "}
            <Button variant="link" className="p-0 align-baseline" onClick={load}>{__("Try again", "text-to-audio")}</Button>
          </Alert>
        ) : (
          <Spinner animation="border" size="sm" role="status" />
        )}
      </Container>
    );
  }

  const installedList = Object.entries(plan.installed);

  return (
    <Container>
      <Row>
        <Col xs={12} lg={9}>
          {header}

          <div className="bg-white rounded p-3 mb-3 shadow-sm small">
            <div className="d-flex flex-wrap gap-4">
              {installedList.map(([id, item]) => (
                <div key={id}>
                  <strong>{item.label} {item.version}</strong>
                  <div className="text-secondary">
                    {item.autoUpdate ? __("Auto-updates on", "text-to-audio") : __("Auto-updates off", "text-to-audio")}{" · "}
                    <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => toggleAutoUpdate(id, !item.autoUpdate)}>
                      {item.autoUpdate ? __("Turn off", "text-to-audio") : __("Turn on", "text-to-audio")}
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <strong>{sprintf(/* translators: %s: PHP version. */ __("PHP %s", "text-to-audio"), plan.site.php)}</strong>
                <div className="text-secondary">{sprintf(/* translators: %s: WordPress version. */ __("WordPress %s", "text-to-audio"), plan.site.wordpress)}</div>
              </div>
            </div>
          </div>

          {(plan.vcs || []).length > 0 && (
            <Alert variant="warning" className="small">
              {__("This plugin's folder is a version-control checkout (Git or SVN). Rolling back replaces the whole folder, which would delete the repository, so it is turned off here. Update it with your version control instead.", "text-to-audio")}
            </Alert>
          )}

          {Object.values(plan.errors || {}).map((message) => (
            <Alert variant="warning" key={message}>
              {message}{" "}
              <Button variant="link" className="p-0 align-baseline" onClick={load}>{__("Try again", "text-to-audio")}</Button>
            </Alert>
          ))}

          {run ? (
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              <h3 className="tta_voice_card_title">
                {run.done
                  ? sprintf(/* translators: %s: versions, e.g. "AtlasVoice 2.3.16". */ __("Rolled back to %s", "text-to-audio"), run.label)
                  : sprintf(/* translators: %s: versions, e.g. "AtlasVoice 2.3.16". */ __("Rolling back to %s", "text-to-audio"), run.label)}
              </h3>
              <ul className="tta-steps">
                {run.steps.map((step) => (
                  <li key={step.id} className={step.state === "done" ? "is-done" : step.state === "now" ? "is-now" : ""}>
                    <span aria-hidden="true">
                      {step.state === "done" ? "✓" : step.state === "now" ? <Spinner animation="border" size="sm" /> : step.state === "failed" ? "✕" : "·"}
                    </span>
                    {step.label}
                  </li>
                ))}
              </ul>
              {!run.done && !run.error && (
                <p className="small text-secondary mt-2 mb-0">
                  {__("WordPress puts the site in maintenance mode for a few seconds while the files are swapped, as with any update.", "text-to-audio")}
                </p>
              )}
              {run.error && (
                <Alert variant="danger" className="mt-3 mb-0 small">
                  {run.error}{" "}
                  {run.steps.some((s) => s.state === "done") && __("The steps marked ✓ finished; nothing else was changed.", "text-to-audio")}
                </Alert>
              )}
              {run.done && (
                <Alert variant="success" className="mt-3 mb-0 small">
                  <p className="mb-2">{__("Done. Your settings, audio files and analytics were kept.", "text-to-audio")}</p>
                  {pauseAuto && (
                    <p className="mb-2">
                      {__("Auto-updates for AtlasVoice are paused, so WordPress won't reinstall the newer version overnight. When a fixed version is out, update from Dashboard › Updates.", "text-to-audio")}
                    </p>
                  )}
                  <p className="mb-2">{__("If you use a caching plugin, clear its cache now so visitors get the matching player files.", "text-to-audio")}</p>
                  <Button className="tta-launch-btn" onClick={() => window.location.reload()}>{__("Reload this page", "text-to-audio")}</Button>{" "}
                  <a href="https://atlasaidev.com/contact-us/" target="_blank" rel="noopener noreferrer">{__("Tell us what went wrong", "text-to-audio")}</a>
                </Alert>
              )}
            </div>
          ) : (
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              {modes.both && (
                <div className="mb-3">
                  <div className="fw-semibold small mb-1">{__("What to roll back", "text-to-audio")}</div>
                  <div className="tta-segment" role="radiogroup" aria-label={__("What to roll back", "text-to-audio")}>
                    {[
                      ["both", __("Both (recommended)", "text-to-audio")],
                      ["pro", __("Only AtlasVoice Pro", "text-to-audio")],
                      ["free", __("Only AtlasVoice", "text-to-audio")],
                    ].map(([id, label]) => (
                      <button key={id} type="button" role="radio" aria-checked={activeMode === id} onClick={() => choose(id)}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="small text-secondary mt-1">
                    {__("With Pro installed, the two plugins must stay a matching pair. \"Both\" rolls them back together, to versions released together.", "text-to-audio")}
                  </div>
                </div>
              )}

              {rows.length === 0 && !Object.keys(plan.errors || {}).length && (
                <p className="small mb-0">{__("There is no older version to go back to.", "text-to-audio")}</p>
              )}

              {rows.map((row) => {
                const blocked = row.status === "blocked";
                const isSelected = selectedRow && selectedRow.version === row.version;
                const status = STATUS[row.status] || STATUS.safe;
                return (
                  <label key={row.version} className={`tta-versions-row${isSelected ? " is-selected" : ""}${blocked ? " is-blocked" : ""}`}>
                    <input
                      type="radio"
                      name="tta_rollback_version"
                      checked={!!isSelected}
                      disabled={blocked}
                      onChange={() => setSelected(row.version)}
                    />
                    <span className="flex-grow-1">
                      <span className="d-flex flex-wrap gap-2 align-items-center">
                        <strong>{row.label}</strong>
                        <span className={`tta-status ${status.className}`}>{status.label()}</span>
                        {row.recommended && <span className="badge bg-success">{__("Recommended", "text-to-audio")}</span>}
                      </span>
                      {blocked && row.blocks.map((block, i) => (
                        <span key={i} className="d-block tta-versions-why">
                          {block.text}{" "}
                          {block.fix && (
                            <Button variant="link" size="sm" className="p-0 align-baseline" onClick={(e) => { e.preventDefault(); choose(block.fix.mode, block.fix.version); }}>
                              {block.fix.label}
                            </Button>
                          )}
                        </span>
                      ))}
                    </span>
                  </label>
                );
              })}

              {selectedRow && (
                <div className="border rounded p-3 mt-3 small">
                  <h4 className="h6">
                    {sprintf(/* translators: %s: versions, e.g. "AtlasVoice 2.3.16". */ __("Before you roll back to %s", "text-to-audio"), selectedRow.label)}
                  </h4>
                  {selectedRow.changes.length > 0 && (
                    <div className="tta-usage-alert tta-usage-alert--heads mt-2">
                      <p><strong>{__("What will change on your site", "text-to-audio")}</strong></p>
                      <ul className="mb-0 ps-3">
                        {selectedRow.changes.map((text) => <li key={text}>{text}</li>)}
                      </ul>
                    </div>
                  )}
                  <ul className="text-secondary mt-2 ps-3">
                    {selectedRow.notes.map((text) => <li key={text}>{text}</li>)}
                  </ul>
                  {selectedRow.changes.length > 0 && (
                    <Form.Check
                      id="tta_rollback_confirm"
                      className="mb-2"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      label={__("I understand what will change", "text-to-audio")}
                    />
                  )}
                  <Form.Check
                    id="tta_rollback_pause"
                    className="mb-3"
                    checked={pauseAuto}
                    onChange={(e) => setPauseAuto(e.target.checked)}
                    label={__("Pause auto-updates for AtlasVoice, so WordPress does not reinstall the newer version tonight", "text-to-audio")}
                  />
                  <Button className="tta-launch-btn" disabled={(plan.vcs || []).length > 0 || (selectedRow.changes.length > 0 && !confirmed)} onClick={start}>
                    {sprintf(/* translators: %s: versions, e.g. "AtlasVoice 2.3.16". */ __("Roll back to %s", "text-to-audio"), selectedRow.label)}
                  </Button>
                </div>
              )}

              <p className="small text-secondary mt-3 mb-0">
                {modes.both
                  ? __("AtlasVoice versions come from WordPress.org. Pro versions come from the AtlasVoice service after it checks your licence. The same checks run again on the server before anything is replaced.", "text-to-audio")
                  : __("Versions come from WordPress.org. Nothing is downloaded until you press Roll back, and the same checks run again on the server first.", "text-to-audio")}
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
