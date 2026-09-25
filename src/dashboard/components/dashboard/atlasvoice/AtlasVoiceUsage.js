import React from "react";
import { __, sprintf } from "@wordpress/i18n";

import "./atlasvoice.css";

/**
 * TTS-320: the AtlasVoice TTS monthly allowance, as Listening and Settings show
 * it. The bar is drawn here (the bundled Bootstrap gives .progress no height,
 * which hid the old bar), with a warning from 80%, a run-out date, and one
 * upgrade button.
 *
 * @param {Object}  props
 * @param {Object}  props.summary  TTA_AtlasVoice_Service::usage_summary().
 * @param {Object}  props.cta      {text, url} from upgrade_cta().
 * @param {boolean} [props.explain] Show what happens when it runs out.
 */
export function formatNumber(n) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch (e) {
    return String(n);
  }
}

/** @param {number} unix Seconds. */
export function formatDate(unix) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(new Date(unix * 1000));
  } catch (e) {
    return "";
  }
}

export default function AtlasVoiceUsage({ summary, cta, explain = true }) {
  if (!summary || summary.band === "none") {
    return null;
  }

  if (summary.band === "covered") {
    return (
      <p className="mb-0 text-secondary small">
        {__("Premium: no monthly limit on this site.", "text-to-audio")}
      </p>
    );
  }

  const band = summary.band;
  const limit = Number(summary.limit) || 0;
  const used = Math.min(Number(summary.used) || 0, limit);
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const reset = summary.resets_at ? formatDate(summary.resets_at) : "";
  const runOut = summary.run_out ? formatDate(summary.run_out) : "";

  const upgrade = cta && cta.url ? (
    <a className="btn btn-sm tta-launch-btn tta-usage-cta" href={cta.url} target="_blank" rel="noopener noreferrer">
      {cta.text}
    </a>
  ) : null;

  let alert = null;
  if (band === "heads") {
    alert = (
      <div className="tta-usage-alert tta-usage-alert--heads">
        <p>
          <strong>
            {sprintf(
              /* translators: %d: share of the monthly allowance used, e.g. 82. */
              __("%d%% used.", "text-to-audio"),
              percent
            )}
          </strong>{" "}
          {runOut
            ? sprintf(
                /* translators: %s: date the allowance is expected to run out. */
                __("At this pace it runs out around %s.", "text-to-audio"),
                runOut
              )
            : sprintf(
                /* translators: %s: date the allowance resets. */
                __("On track to last until %s.", "text-to-audio"),
                reset
              )}
        </p>
        {upgrade}
      </div>
    );
  } else if (band === "low") {
    alert = (
      <div className="tta-usage-alert tta-usage-alert--low">
        <p>
          <strong>
            {sprintf(
              /* translators: %s: characters left this month. */
              __("Only %s characters left this month.", "text-to-audio"),
              formatNumber(summary.left)
            )}
          </strong>{" "}
          {runOut
            ? sprintf(
                /* translators: %s: date the allowance is expected to run out. */
                __("At this pace they run out around %s.", "text-to-audio"),
                runOut
              )
            : ""}
        </p>
        <p>
          {sprintf(
            /* translators: %s: date the allowance resets. */
            __("After that, new and edited posts are read by the browser voice until %s. Posts that already have audio keep playing.", "text-to-audio"),
            reset
          )}
        </p>
        {upgrade}
      </div>
    );
  } else if (band === "out") {
    alert = (
      <div className="tta-usage-alert tta-usage-alert--out">
        <p>
          <strong>{__("This month’s allowance is used up.", "text-to-audio")}</strong>{" "}
          {sprintf(
            /* translators: %s: date the allowance resets. */
            __("New and edited posts are read by the browser voice until %s. Posts that already have audio keep playing.", "text-to-audio"),
            reset
          )}
        </p>
        {upgrade}
      </div>
    );
  }

  return (
    <div className="tta-usage">
      <div className="d-flex justify-content-between flex-wrap small mb-1">
        <span>
          {sprintf(
            /* translators: 1: characters used, 2: monthly allowance. */
            __("%1$s of %2$s characters used this month", "text-to-audio"),
            formatNumber(summary.used || 0),
            formatNumber(limit)
          )}
        </span>
        {reset && (
          <span className="text-secondary">
            {sprintf(
              /* translators: %s: date the allowance resets. */
              __("Resets %s", "text-to-audio"),
              reset
            )}
          </span>
        )}
      </div>
      <div
        className={`tta-usage-bar tta-usage-bar--${band}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={__("Monthly allowance used", "text-to-audio")}
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      {band === "ok" && explain && (
        <p className="small text-secondary mt-2 mb-0">
          {__("Characters are counted once, when a post’s audio is made. Replays are free.", "text-to-audio")}
        </p>
      )}

      {alert}

      {explain && band !== "ok" && (
        <details className="small mt-2">
          <summary>{__("What happens when the allowance runs out?", "text-to-audio")}</summary>
          <p className="text-secondary mb-0 mt-1">
            {sprintf(
              /* translators: %s: date the allowance resets. */
              __("Posts that already have audio keep playing. New and edited posts are read by the browser voice until %s, then get natural audio again. Nothing is deleted.", "text-to-audio"),
              reset
            )}
          </p>
        </details>
      )}
    </div>
  );
}
