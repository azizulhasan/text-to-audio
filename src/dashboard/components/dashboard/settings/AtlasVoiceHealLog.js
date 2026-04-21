/**
 * AtlasVoice Heal Log (TTS-238 C2b).
 *
 * Renders an audit trail of self-healing selector replacements. Each row
 * shows the timestamp, scope, reason (heal / revert), old → new selectors,
 * and a one-click "Revert" button that restores the previous selector via
 * POST /save-selector (reason=revert). A successful revert is itself
 * appended to the heal log — forward-only history, so the user never
 * loses the trail.
 *
 * Source: GET /wp-json/tta/v1/heal-log (admin-only; enforced server-side
 * in TTA_Api_Routes::get_route_access()). The route returns reverse-chrono
 * entries with an index field, so we pass that index back on revert to
 * avoid race conditions when multiple admins are poking at the list.
 */
import React, {useState, useEffect, useCallback} from "react";
import {__} from "@wordpress/i18n";

function formatTs(ts) {
    if (!ts) { return ""; }
    try {
        var d = new Date(ts * 1000);
        return d.toLocaleString();
    } catch (_) {
        return String(ts);
    }
}

function scopeLabel(scope) {
    if (!scope || scope === "global") { return __("Global", "text-to-audio"); }
    if (scope.indexOf("post_type:") === 0) {
        return scope.slice("post_type:".length);
    }
    return scope;
}

function reasonBadge(reason) {
    var color = reason === "revert" ? "#6c757d" : "#0d6efd";
    var label = reason === "revert"
        ? __("Reverted", "text-to-audio")
        : __("Auto-healed", "text-to-audio");
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#fff",
                background: color,
                borderRadius: "10px",
                lineHeight: "16px",
            }}
        >
            {label}
        </span>
    );
}

export default function AtlasVoiceHealLog() {
    var [entries, setEntries] = useState([]);
    var [loading, setLoading] = useState(true);
    var [error, setError] = useState("");
    var [reverting, setReverting] = useState(null);

    var fetchLog = useCallback(function () {
        var apiBase = (window.tta_obj && window.tta_obj.api_url)
            || (window.ttsObj && window.ttsObj.api_url)
            || "";
        var nonce = (window.tta_obj && window.tta_obj.rest_nonce)
            || (window.ttsObj && window.ttsObj.rest_nonce)
            || "";
        if (!apiBase) {
            setError(__("REST API base URL not available.", "text-to-audio"));
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(apiBase + "tta/v1/heal-log", {
            headers: {"X-WP-Nonce": nonce},
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                // Server returns { status: true, log: [...] } (reverse-chrono,
                // each row has an `index` field). Fall back to `entries` for
                // forward-compat in case the payload shape changes.
                var rows = (data && (data.log || data.entries)) || [];
                setEntries(Array.isArray(rows) ? rows : []);
                setError("");
                setLoading(false);
            })
            .catch(function (err) {
                setError(String(err && err.message ? err.message : err));
                setLoading(false);
            });
    }, []);

    useEffect(function () { fetchLog(); }, [fetchLog]);

    var revertEntry = useCallback(function (entry) {
        if (!entry || !entry.old_selector || !entry.new_selector) { return; }
        var confirmMsg = __(
            "Revert to the previous selector? The current selector will be replaced and the revert will be recorded in this log.",
            "text-to-audio"
        );
        if (!window.confirm(confirmMsg)) { return; }

        var apiBase = (window.tta_obj && window.tta_obj.api_url)
            || (window.ttsObj && window.ttsObj.api_url)
            || "";
        var nonce = (window.tta_obj && window.tta_obj.rest_nonce)
            || (window.ttsObj && window.ttsObj.rest_nonce)
            || "";
        if (!apiBase) { return; }

        setReverting(entry.index);

        // Extract post_type from "post_type:foo" scope; empty for global.
        var postType = "";
        if (entry.scope && entry.scope.indexOf("post_type:") === 0) {
            postType = entry.scope.slice("post_type:".length);
        }

        var body = new FormData();
        body.append("selector", entry.old_selector);
        body.append("post_type", postType);
        body.append("reason", "revert");
        body.append("old_selector", entry.new_selector);

        fetch(apiBase + "tta/v1/save-selector", {
            method: "POST",
            headers: {"X-WP-Nonce": nonce},
            body: body,
        })
            .then(function (r) { return r.json(); })
            .then(function () {
                setReverting(null);
                fetchLog();
            })
            .catch(function () {
                setReverting(null);
            });
    }, [fetchLog]);

    return (
        <div
            className="mt-3 mb-4 p-3 rounded"
            style={{background: "#fff", border: "1px solid #d6e7ea"}}
        >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div>
                    <strong className="d-block mb-1">
                        {__("Selector heal log", "text-to-audio")}
                    </strong>
                    <small className="text-muted d-block">
                        {__(
                            "When your saved selector stops matching the content (after a theme update, page builder change, etc.), AtlasVoice picks the best-scoring alternative and records the swap here. You can revert any row.",
                            "text-to-audio"
                        )}
                    </small>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={fetchLog}
                        disabled={loading}
                    >
                        {loading
                            ? __("Loading…", "text-to-audio")
                            : __("Refresh", "text-to-audio")}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger py-2 px-3 mb-2" style={{fontSize: "12px"}}>
                    {error}
                </div>
            )}

            {!loading && !error && entries.length === 0 && (
                <div className="text-muted" style={{fontSize: "13px"}}>
                    {__("No heal events yet. You'll see entries here the first time a saved selector stops matching.", "text-to-audio")}
                </div>
            )}

            {entries.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-sm align-middle" style={{fontSize: "13px"}}>
                        <thead>
                            <tr>
                                <th style={{whiteSpace: "nowrap"}}>{__("When", "text-to-audio")}</th>
                                <th>{__("Scope", "text-to-audio")}</th>
                                <th>{__("Event", "text-to-audio")}</th>
                                <th>{__("Old selector", "text-to-audio")}</th>
                                <th>{__("New selector", "text-to-audio")}</th>
                                <th style={{whiteSpace: "nowrap"}}>{__("Action", "text-to-audio")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(function (entry) {
                                return (
                                    <tr key={entry.index + "-" + entry.ts}>
                                        <td style={{whiteSpace: "nowrap"}}>
                                            {formatTs(entry.ts)}
                                        </td>
                                        <td>{scopeLabel(entry.scope)}</td>
                                        <td>{reasonBadge(entry.reason)}</td>
                                        <td>
                                            <code style={{fontSize: "11px", wordBreak: "break-all"}}>
                                                {entry.old_selector}
                                            </code>
                                        </td>
                                        <td>
                                            <code style={{fontSize: "11px", wordBreak: "break-all"}}>
                                                {entry.new_selector}
                                            </code>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={function () { revertEntry(entry); }}
                                                disabled={reverting === entry.index}
                                                title={__("Restore the old selector and record this revert in the log.", "text-to-audio")}
                                            >
                                                {reverting === entry.index
                                                    ? __("Reverting…", "text-to-audio")
                                                    : __("Revert", "text-to-audio")}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
