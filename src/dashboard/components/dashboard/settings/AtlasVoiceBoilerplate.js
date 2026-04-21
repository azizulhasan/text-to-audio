/**
 * AtlasVoice Boilerplate Suggestions (TTS-238 C3c).
 *
 * Renders the output of the nightly BoilerplateDetector as a list of
 * action chips. Each chip shows the detected sentence, the frequency
 * badge (e.g. "7/20 posts"), and a toggle to add/remove it from the
 * player's exclusion list.
 *
 * Data flow:
 *   - GET /boilerplate-suggestions on mount → { suggestions, excluded, generated_at }
 *   - "Re-scan now" button → POST /boilerplate-suggestions (inline detector run)
 *   - Exclude / Un-exclude button → POST /boilerplate-exclude
 *
 * Chips marked as already-excluded (present in `excluded[]`) render with
 * a muted style and a "Remove" button instead of "Exclude". This keeps
 * the UI coherent after a re-scan where previously-excluded phrases may
 * re-appear in the suggestion list.
 */
import React, {useCallback, useEffect, useState} from "react";
import {__} from "@wordpress/i18n";

function fmtWhen(ts) {
    if (!ts) { return __("never", "text-to-audio"); }
    try {
        var d = new Date(ts * 1000);
        return d.toLocaleString();
    } catch (_) {
        return String(ts);
    }
}

function getApiBase() {
    return (window.tta_obj && window.tta_obj.api_url)
        || (window.ttsObj && window.ttsObj.api_url)
        || "";
}
function getNonce() {
    return (window.tta_obj && window.tta_obj.rest_nonce)
        || (window.ttsObj && window.ttsObj.rest_nonce)
        || "";
}

export default function AtlasVoiceBoilerplate() {
    var [loading, setLoading] = useState(true);
    var [refreshing, setRefreshing] = useState(false);
    var [suggestions, setSuggestions] = useState([]);
    var [excluded, setExcluded] = useState([]);
    var [generatedAt, setGeneratedAt] = useState(0);
    var [sampleSize, setSampleSize] = useState(0);
    var [busyText, setBusyText] = useState(null);
    var [error, setError] = useState("");

    var applyResponse = useCallback(function (data) {
        if (!data) { return; }
        setSuggestions(data.suggestions || []);
        setExcluded(data.excluded || []);
        setGeneratedAt(data.generated_at || 0);
        setSampleSize(data.sample_size || 0);
    }, []);

    var fetchSuggestions = useCallback(function () {
        var base = getApiBase();
        if (!base) { setError(__("REST API base URL not available.", "text-to-audio")); setLoading(false); return; }
        setLoading(true);
        fetch(base + "tta/v1/boilerplate-suggestions", {
            headers: {"X-WP-Nonce": getNonce()},
        })
            .then(function (r) { return r.json(); })
            .then(function (data) { applyResponse(data); setError(""); setLoading(false); })
            .catch(function (err) {
                setError(String(err && err.message ? err.message : err));
                setLoading(false);
            });
    }, [applyResponse]);

    useEffect(function () { fetchSuggestions(); }, [fetchSuggestions]);

    var refreshNow = useCallback(function () {
        var base = getApiBase();
        if (!base) { return; }
        setRefreshing(true);
        fetch(base + "tta/v1/boilerplate-suggestions", {
            method: "POST",
            headers: {"X-WP-Nonce": getNonce()},
        })
            .then(function (r) { return r.json(); })
            .then(function (data) { applyResponse(data); setRefreshing(false); })
            .catch(function () { setRefreshing(false); });
    }, [applyResponse]);

    var toggleExclude = useCallback(function (text, alreadyExcluded) {
        var base = getApiBase();
        if (!base) { return; }
        setBusyText(text);
        var body = new FormData();
        body.append("text", text);
        body.append("action", alreadyExcluded ? "remove" : "add");
        fetch(base + "tta/v1/boilerplate-exclude", {
            method: "POST",
            headers: {"X-WP-Nonce": getNonce()},
            body: body,
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.excluded) { setExcluded(data.excluded); }
                setBusyText(null);
            })
            .catch(function () { setBusyText(null); });
    }, []);

    return (
        <div
            className="mt-3 mb-4 p-3 rounded"
            style={{background: "#fff", border: "1px solid #d6e7ea"}}
        >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div>
                    <strong className="d-block mb-1">
                        {__("Detected boilerplate (beta)", "text-to-audio")}
                    </strong>
                    <small className="text-muted d-block">
                        {__(
                            "Sentences that repeat across your posts — usually newsletter CTAs, related-posts intros, share buttons. Exclude the ones you don't want the player to read aloud.",
                            "text-to-audio"
                        )}
                    </small>
                    <small className="text-muted d-block mt-1">
                        {__("Last scanned:", "text-to-audio")}{" "}
                        <strong>{fmtWhen(generatedAt)}</strong>
                        {sampleSize > 0 && (
                            <>
                                {" · "}
                                {__("Sampled", "text-to-audio")} <strong>{sampleSize}</strong> {__("posts", "text-to-audio")}
                            </>
                        )}
                    </small>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={refreshNow}
                        disabled={refreshing || loading}
                    >
                        {refreshing
                            ? __("Scanning…", "text-to-audio")
                            : __("Re-scan now", "text-to-audio")}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger py-2 px-3 mb-2" style={{fontSize: "12px"}}>
                    {error}
                </div>
            )}

            {!loading && !error && suggestions.length === 0 && (
                <div className="text-muted" style={{fontSize: "13px"}}>
                    {__(
                        "No repeating boilerplate detected yet. The detector runs nightly — or click Re-scan now to try immediately.",
                        "text-to-audio"
                    )}
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="d-flex flex-column gap-2" style={{fontSize: "13px"}}>
                    {suggestions.map(function (s, idx) {
                        var isExcluded = excluded.indexOf(s.text) !== -1;
                        var pct = s.frequency ? Math.round(s.frequency * 100) : 0;
                        return (
                            <div
                                key={idx + "-" + (s.text || "").slice(0, 20)}
                                className="d-flex align-items-start gap-2 p-2 rounded"
                                style={{
                                    background: isExcluded ? "#e9ecef" : "#f8f9fa",
                                    border: "1px solid #dee2e6",
                                    opacity: isExcluded ? 0.7 : 1,
                                }}
                            >
                                <div
                                    style={{
                                        flex: "0 0 auto",
                                        minWidth: "72px",
                                        textAlign: "center",
                                        padding: "2px 6px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#fff",
                                        background: pct >= 50 ? "#b02a37" : (pct >= 40 ? "#b8860b" : "#0d6efd"),
                                        borderRadius: "4px",
                                    }}
                                    title={__("Posts where this sentence appeared", "text-to-audio")}
                                >
                                    {s.post_count}/{s.sample_total}
                                    <div style={{fontSize: "9px", opacity: 0.85}}>{pct}%</div>
                                </div>
                                <div style={{flex: "1 1 auto", minWidth: 0}}>
                                    <div
                                        style={{
                                            wordBreak: "break-word",
                                            textDecoration: isExcluded ? "line-through" : "none",
                                        }}
                                    >
                                        {s.text}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${isExcluded ? "btn-outline-secondary" : "btn-outline-danger"}`}
                                    onClick={function () { toggleExclude(s.text, isExcluded); }}
                                    disabled={busyText === s.text}
                                >
                                    {busyText === s.text
                                        ? __("Saving…", "text-to-audio")
                                        : (isExcluded
                                            ? __("Remove", "text-to-audio")
                                            : __("Exclude", "text-to-audio"))}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
