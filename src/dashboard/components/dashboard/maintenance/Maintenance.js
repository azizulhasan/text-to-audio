/**
 * TTS-239: Maintenance tab — scan and delete orphan per-batch temp files
 * (e.g. title-1.mp3, title-2.mp3) left behind under uploads/TTA_Pro/ when
 * batch generation never finished its cleanup. The flow is:
 *
 *   1. Warning banner (destructive action).
 *   2. "Scan" — hits /tta_pro/v1/scan_orphan_temp_files, shows paginated list.
 *   3. User reviews files / selects which to delete (or selects all).
 *   4. First confirmation modal — re-states count + size.
 *   5. Second confirmation (type DELETE) — final safety net.
 *   6. Calls /tta_pro/v1/delete_orphan_temp_files; shows result.
 */
import React, { useEffect, useMemo, useState } from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";

const PER_PAGE_OPTIONS = [25, 50, 100, 200];
// TTS-239: age-threshold options — "safe" default hides files < 1h old so that
// any in-flight batch is never deleted. Shorter values are opt-in with a warning.
const AGE_THRESHOLD_OPTIONS = [
    { value: 3600, label: "1 hour (safe)" },
    { value: 600, label: "10 minutes" },
    { value: 60, label: "1 minute (include recent)" },
];
const SAFE_THRESHOLD = 3600;
const API_BASE = (window.ttsObj && window.ttsObj.api_url) || "/wp-json/";

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatTime(epoch) {
    if (!epoch) return "";
    const d = new Date(epoch * 1000);
    return d.toLocaleString();
}

export default function Maintenance() {
    const isProActive = Boolean(window.ttsObj && window.ttsObj.is_pro_active);

    const [isScanning, setIsScanning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [selected, setSelected] = useState({});
    const [hasScanned, setHasScanned] = useState(false);
    // TTS-239: age threshold — server-side filter for "file older than X seconds".
    // Defaults to 3600 (safe). Shorter values show a warning banner.
    const [ageThreshold, setAgeThreshold] = useState(SAFE_THRESHOLD);

    const [confirmStep, setConfirmStep] = useState(0); // 0 = closed, 1 = first confirm, 2 = type DELETE
    const [confirmText, setConfirmText] = useState("");
    const [deleteMode, setDeleteMode] = useState("selected"); // "selected" | "all"
    // TTS-239: When true, behave as if every orphan on the server is selected
    // (across all pages), without needing to materialize thousands of paths in
    // client state. Any manual toggle clears this flag and falls back to the
    // per-path `selected` map.
    const [selectAllPages, setSelectAllPages] = useState(false);

    const nonce = useMemo(
        () => (window.ttsObj && window.ttsObj.rest_nonce) || "",
        []
    );

    const allVisibleSelected = useMemo(() => {
        if (!items.length) return false;
        if (selectAllPages) return true;
        return items.every((it) => selected[it.file]);
    }, [items, selected, selectAllPages]);

    async function scan(nextPage = 1, nextPerPage = perPage, nextAge = ageThreshold) {
        if (!isProActive) return;
        setIsScanning(true);
        try {
            const url = `${API_BASE}tta_pro/v1/scan_orphan_temp_files?page=${nextPage}&per_page=${nextPerPage}&min_age_seconds=${nextAge}`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": nonce,
                },
            });
            const data = await res.json();
            if (data && data.status) {
                setItems(Array.isArray(data.data) ? data.data : []);
                setPage(data.page || nextPage);
                setPerPage(data.per_page || nextPerPage);
                setTotal(data.total || 0);
                setTotalPages(data.total_pages || 0);
                setTotalSize(data.total_size || 0);
                setHasScanned(true);
            } else {
                toast.error(
                    (data && data.message) ||
                        __("Scan failed.", "text-to-audio")
                );
            }
        } catch (e) {
            toast.error(__("Scan failed: ", "text-to-audio") + String(e));
        } finally {
            setIsScanning(false);
        }
    }

    function toggleOne(file) {
        // TTS-239: manual toggle cancels "select all across all pages" and
        // materializes current-page items into the explicit selected map.
        if (selectAllPages) {
            const materialized = {};
            items.forEach((it) => (materialized[it.file] = true));
            if (materialized[file]) {
                delete materialized[file];
            } else {
                materialized[file] = true;
            }
            setSelected(materialized);
            setSelectAllPages(false);
            return;
        }
        setSelected((s) => {
            const next = { ...s };
            if (next[file]) delete next[file];
            else next[file] = true;
            return next;
        });
    }

    function toggleAllVisible() {
        // TTS-239: any header-checkbox action clears the cross-page flag — it
        // only governs the current page.
        setSelectAllPages(false);
        if (allVisibleSelected) {
            setSelected((s) => {
                const next = { ...s };
                items.forEach((it) => delete next[it.file]);
                return next;
            });
        } else {
            setSelected((s) => {
                const next = { ...s };
                items.forEach((it) => (next[it.file] = true));
                return next;
            });
        }
    }

    function selectAllAcrossPages() {
        setSelectAllPages(true);
        setSelected({});
    }

    function clearAllSelections() {
        setSelectAllPages(false);
        setSelected({});
    }

    function startDelete(mode) {
        setDeleteMode(mode);
        setConfirmStep(1);
        setConfirmText("");
    }

    function cancelConfirm() {
        setConfirmStep(0);
        setConfirmText("");
    }

    async function runDelete() {
        if (confirmText !== "DELETE") return;
        setIsDeleting(true);
        try {
            // TTS-246: send as JSON (was FormData) so Cloudflare/WAF doesn't
            // 403 form-encoded POSTs to /wp-json/*. The PHP handler reads the
            // same param names off WP_REST_Request regardless of body encoding.
            const payload = {
                // TTS-239: pass age threshold so server-side re-scan/re-validate uses the same cutoff.
                min_age_seconds: String(ageThreshold),
            };
            if (deleteMode === "all" || (deleteMode === "selected" && selectAllPages)) {
                // TTS-239: "Delete all" OR "selected across all pages" both use
                // the server-side all=1 path so we don't ship thousands of
                // paths over the wire.
                payload.all = "1";
            } else {
                const paths = Object.keys(selected);
                if (!paths.length) {
                    toast.info(__("No files selected.", "text-to-audio"));
                    setIsDeleting(false);
                    return;
                }
                payload.paths = paths;
            }
            const res = await fetch(
                `${API_BASE}tta_pro/v1/delete_orphan_temp_files`,
                {
                    method: "POST",
                    headers: {
                        "X-WP-Nonce": nonce,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json();
            if (data && data.status) {
                toast.success(
                    `${__("Deleted", "text-to-audio")} ${data.deleted} · ${
                        __("Freed", "text-to-audio")
                    } ${formatBytes(data.freed_bytes)}`
                );
                setSelected({});
                setSelectAllPages(false);
                setConfirmStep(0);
                setConfirmText("");
                scan(1, perPage, ageThreshold);
            } else {
                toast.error(
                    (data && data.message) ||
                        __("Deletion failed.", "text-to-audio")
                );
            }
        } catch (e) {
            toast.error(__("Deletion failed: ", "text-to-audio") + String(e));
        } finally {
            setIsDeleting(false);
        }
    }

    // TTS-239: Effective selected count — "select all across all pages" counts
    // as every orphan currently on the server.
    const selectedCount = selectAllPages ? total : Object.keys(selected).length;

    if (!isProActive) {
        return (
            <div className="card mb-4">
                <div className="card-header">
                    {__("Maintenance", "text-to-audio")}
                </div>
                <div className="card-body">
                    <p>
                        {__(
                            "Maintenance tools are available with the Pro plugin active.",
                            "text-to-audio"
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="maintenance-tab" style={{ width: "100%" }}>
            {/* TTS-239: Dashboard theme forces .card to max-width 520px — override for this tab. */}
            <style>{`.maintenance-tab .card { max-width: 100% !important; width: 100% !important; }`}</style>
            <div className="card mb-4">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <div>
                        <span className="dashicons dashicons-admin-tools"></span>{" "}
                        {__("Maintenance", "text-to-audio")}
                    </div>
                </div>
                <div className="card-body">
                    <div
                        className="alert alert-warning"
                        role="alert"
                        style={{ marginBottom: 20 }}
                    >
                        <strong>
                            {__(
                                "⚠ Destructive action.",
                                "text-to-audio"
                            )}
                        </strong>{" "}
                        {__(
                            "This tool permanently deletes leftover per-batch MP3 chunks (files like title-1.mp3, title-2.mp3) from uploads/TTA_Pro/. Only files that meet all of the following are listed:",
                            "text-to-audio"
                        )}
                        <ul style={{ marginTop: 8, marginBottom: 0 }}>
                            <li>
                                {__(
                                    "Filename ends with -N.mp3 where N is a number",
                                    "text-to-audio"
                                )}
                            </li>
                            <li>
                                {__(
                                    "The final concatenated file (title.mp3) already exists in the same folder",
                                    "text-to-audio"
                                )}
                            </li>
                            <li>
                                {__(
                                    "The file is older than 1 hour (so an in-flight batch is never affected)",
                                    "text-to-audio"
                                )}
                            </li>
                            <li>
                                {__(
                                    "The file sits under wp-uploads/TTA_Pro/ (path traversal is rejected)",
                                    "text-to-audio"
                                )}
                            </li>
                        </ul>
                    </div>

                    {ageThreshold < SAFE_THRESHOLD && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                            style={{ marginBottom: 16 }}
                        >
                            <strong>{__("⚠ Reduced safety margin.", "text-to-audio")}</strong>{" "}
                            {__(
                                "You have lowered the age threshold below the 1-hour safe default. Files created by an in-flight batch could match. Only use this if no generation is currently running.",
                                "text-to-audio"
                            )}
                        </div>
                    )}

                    <div
                        className="d-flex align-items-center"
                        style={{ gap: 10, flexWrap: "wrap" }}
                    >
                        <span>
                            {__("Include files older than:", "text-to-audio")}
                        </span>
                        <select
                            className="form-select"
                            style={{ width: "auto" }}
                            value={ageThreshold}
                            disabled={isScanning || isDeleting}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setAgeThreshold(v);
                                if (hasScanned) scan(1, perPage, v);
                            }}
                        >
                            {AGE_THRESHOLD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {__(opt.label, "text-to-audio")}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={isScanning || isDeleting}
                            onClick={() => scan(1, perPage, ageThreshold)}
                        >
                            {isScanning
                                ? __("Scanning…", "text-to-audio")
                                : __("Scan for orphan files", "text-to-audio")}
                        </button>

                        {hasScanned && (
                            <>
                                <span>
                                    {__("Per page:", "text-to-audio")}
                                </span>
                                <select
                                    className="form-select"
                                    style={{ width: "auto" }}
                                    value={perPage}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setPerPage(v);
                                        scan(1, v, ageThreshold);
                                    }}
                                >
                                    {PER_PAGE_OPTIONS.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        {hasScanned && total > 0 && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    disabled={
                                        isScanning ||
                                        isDeleting ||
                                        selectedCount === 0
                                    }
                                    onClick={() => startDelete("selected")}
                                >
                                    {__(
                                        "Delete selected",
                                        "text-to-audio"
                                    )}{" "}
                                    ({selectedCount})
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={isScanning || isDeleting}
                                    onClick={() => startDelete("all")}
                                >
                                    {__(
                                        "Delete all",
                                        "text-to-audio"
                                    )}{" "}
                                    ({total})
                                </button>
                            </>
                        )}
                    </div>

                    {hasScanned && (
                        <div style={{ marginTop: 16 }}>
                            <p>
                                <strong>
                                    {__("Total orphans:", "text-to-audio")}
                                </strong>{" "}
                                {total}
                                {" · "}
                                <strong>
                                    {__("Disk usage:", "text-to-audio")}
                                </strong>{" "}
                                {formatBytes(totalSize)}
                            </p>

                            {total === 0 ? (
                                <div className="alert alert-success" role="alert">
                                    {__(
                                        "Nothing to clean — no orphan temp files found.",
                                        "text-to-audio"
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* TTS-239: Gmail-style banner for cross-page selection. */}
                                    {(allVisibleSelected || selectAllPages) &&
                                        total > items.length && (
                                            <div
                                                className="alert alert-info d-flex align-items-center justify-content-between"
                                                role="alert"
                                                style={{ marginBottom: 12 }}
                                            >
                                                {selectAllPages ? (
                                                    <>
                                                        <span>
                                                            <strong>
                                                                {__(
                                                                    "All",
                                                                    "text-to-audio"
                                                                )}{" "}
                                                                {total}{" "}
                                                                {__(
                                                                    "orphan files",
                                                                    "text-to-audio"
                                                                )}
                                                            </strong>{" "}
                                                            {__(
                                                                "across all pages are selected.",
                                                                "text-to-audio"
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-link"
                                                            onClick={clearAllSelections}
                                                        >
                                                            {__(
                                                                "Clear selection",
                                                                "text-to-audio"
                                                            )}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>
                                                            {__(
                                                                "All",
                                                                "text-to-audio"
                                                            )}{" "}
                                                            <strong>
                                                                {items.length}
                                                            </strong>{" "}
                                                            {__(
                                                                "files on this page are selected.",
                                                                "text-to-audio"
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-link"
                                                            onClick={selectAllAcrossPages}
                                                        >
                                                            {__(
                                                                "Select all",
                                                                "text-to-audio"
                                                            )}{" "}
                                                            {total}{" "}
                                                            {__(
                                                                "files across all pages",
                                                                "text-to-audio"
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                    <table className="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 32 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={allVisibleSelected}
                                                        onChange={toggleAllVisible}
                                                        aria-label="toggle all"
                                                    />
                                                </th>
                                                <th>
                                                    {__(
                                                        "File",
                                                        "text-to-audio"
                                                    )}
                                                </th>
                                                <th>
                                                    {__(
                                                        "Provider",
                                                        "text-to-audio"
                                                    )}
                                                </th>
                                                <th>
                                                    {__(
                                                        "Size",
                                                        "text-to-audio"
                                                    )}
                                                </th>
                                                <th>
                                                    {__(
                                                        "Modified",
                                                        "text-to-audio"
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((it) => (
                                                <tr key={it.file}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectAllPages ||
                                                                !!selected[it.file]
                                                            }
                                                            onChange={() =>
                                                                toggleOne(it.file)
                                                            }
                                                        />
                                                    </td>
                                                    <td
                                                        style={{
                                                            wordBreak: "break-all",
                                                            fontFamily: "monospace",
                                                            fontSize: 12,
                                                        }}
                                                        title={it.file}
                                                    >
                                                        {it.file}
                                                    </td>
                                                    <td>{it.provider}</td>
                                                    <td>{formatBytes(it.size)}</td>
                                                    <td>{formatTime(it.mtime)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {totalPages > 1 && (
                                        <div
                                            className="d-flex align-items-center"
                                            style={{ gap: 8 }}
                                        >
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                disabled={page <= 1 || isScanning}
                                                onClick={() => scan(page - 1, perPage, ageThreshold)}
                                            >
                                                {__("Previous", "text-to-audio")}
                                            </button>
                                            <span>
                                                {__("Page", "text-to-audio")}{" "}
                                                {page} / {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                disabled={
                                                    page >= totalPages || isScanning
                                                }
                                                onClick={() => scan(page + 1, perPage, ageThreshold)}
                                            >
                                                {__("Next", "text-to-audio")}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {confirmStep > 0 && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 99999,
                    }}
                    onClick={cancelConfirm}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: 560,
                            width: "90%",
                            background: "#fff",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-header">
                            <strong>
                                {__(
                                    "Confirm deletion",
                                    "text-to-audio"
                                )}
                            </strong>
                        </div>
                        <div className="card-body">
                            <p>
                                {deleteMode === "all" ? (
                                    <>
                                        {__(
                                            "You are about to permanently delete",
                                            "text-to-audio"
                                        )}{" "}
                                        <strong>
                                            {total}{" "}
                                            {__("files", "text-to-audio")}
                                        </strong>{" "}
                                        ({formatBytes(totalSize)}).
                                    </>
                                ) : (
                                    <>
                                        {__(
                                            "You are about to permanently delete",
                                            "text-to-audio"
                                        )}{" "}
                                        <strong>
                                            {selectedCount}{" "}
                                            {__("files", "text-to-audio")}
                                        </strong>
                                        .
                                    </>
                                )}
                            </p>
                            <p>
                                {__(
                                    "This cannot be undone. Server-side safety rules will re-validate each file before deletion.",
                                    "text-to-audio"
                                )}
                            </p>
                            <p style={{ marginTop: 12 }}>
                                {__(
                                    "Type ",
                                    "text-to-audio"
                                )}
                                <code>DELETE</code>
                                {__(
                                    " to confirm:",
                                    "text-to-audio"
                                )}
                            </p>
                            <input
                                type="text"
                                className="form-control"
                                value={confirmText}
                                onChange={(e) =>
                                    setConfirmText(e.target.value)
                                }
                                autoFocus
                            />
                        </div>
                        <div
                            className="card-footer d-flex justify-content-end"
                            style={{ gap: 8 }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={cancelConfirm}
                                disabled={isDeleting}
                            >
                                {__("Cancel", "text-to-audio")}
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={runDelete}
                                disabled={
                                    isDeleting || confirmText !== "DELETE"
                                }
                            >
                                {isDeleting
                                    ? __("Deleting…", "text-to-audio")
                                    : __(
                                          "Permanently delete",
                                          "text-to-audio"
                                      )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
