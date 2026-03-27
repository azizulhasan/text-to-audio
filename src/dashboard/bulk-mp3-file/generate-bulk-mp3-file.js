import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { __ } from "@wordpress/i18n";
import "react-toastify/dist/ReactToastify.css";
import {
  postWithoutImage,
  getMultilingualActiveLanguages,
} from "../components/context/utilities";

// ─── Styles ──────────────────────────────────────────────────────────────────

const STYLES = {
  tta_wrapper: {
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "16px",
  },
  tta_pageTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tta_howItWorks: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    color: "#333",
    textDecoration: "none",
    cursor: "pointer",
    backgroundColor: "#fff",
  },
  tta_card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  tta_tableHeader: {
    backgroundColor: "#184c53",
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    gap: "10px",
  },
  tta_tableHeaderText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    flex: 1,
  },
  tta_generateBtn: (active) => ({
    backgroundColor: active ? "#e07a2f" : "#9e6b3e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 18px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: active ? "pointer" : "not-allowed",
    opacity: active ? 1 : 0.75,
    whiteSpace: "nowrap",
  }),

  // ── Row ──────────────────────────────────────────────────────────────────
  tta_row: (isChecked) => ({
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid #eee",
    backgroundColor: isChecked ? "#fff3e8" : "#fff",
    transition: "background-color 0.15s",
  }),
  tta_rowMain: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none",
    minHeight: "44px",
  },

  // ── Custom orange checkbox (Figma: orange fill when selected) ─────────────
  tta_checkboxWrapper: (isChecked) => ({
    width: "15px",
    height: "15px",
    flexShrink: 0,
    border: `2px solid ${isChecked ? "#e07a2f" : "#bbb"}`,
    borderRadius: "3px",
    backgroundColor: isChecked ? "#e07a2f" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.15s, background-color 0.15s",
    boxSizing: "border-box",
  }),
  tta_checkboxTick: {
    color: "#fff",
    fontSize: "9px",
    fontWeight: "900",
    lineHeight: 1,
    marginTop: "-1px",
  },
  // Header checkbox — white border/tick on dark teal background
  tta_headerCheckbox: (isChecked) => ({
    width: "15px",
    height: "15px",
    flexShrink: 0,
    border: `2px solid ${isChecked ? "#fff" : "rgba(255,255,255,0.55)"}`,
    borderRadius: "3px",
    backgroundColor: isChecked ? "#fff" : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.15s, background-color 0.15s",
    boxSizing: "border-box",
  }),
  tta_headerCheckboxTick: {
    color: "#184c53",
    fontSize: "9px",
    fontWeight: "900",
    lineHeight: 1,
    marginTop: "-1px",
  },

  // ── Status icon: Figma shows ⊠ (red bordered X) or ✓ (green bordered check)
  tta_statusIcon: (hasFile) => ({
    width: "20px",
    height: "20px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1.5px solid ${hasFile ? "#27ae60" : "#e74c3c"}`,
    borderRadius: "3px",
    color: hasFile ? "#27ae60" : "#e74c3c",
    fontSize: "10px",
    backgroundColor: "transparent",
  }),

  tta_rowTitle: (isChecked) => ({
    flex: 1,
    fontSize: "13.5px",
    color: "#222",
    fontWeight: isChecked ? "600" : "400",
  }),

  tta_rowActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },

  // ── Eye icon — fa-eye, Figma shows it only when file exists ──────────────
  tta_eyeIconLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    fontSize: "13px",
    textDecoration: "none",
    lineHeight: 1,
    width: "20px",
    height: "20px",
  },

  // Invisible spacer so chevron stays aligned when no eye icon
  tta_eyeIconSpacer: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    flexShrink: 0,
  },

  // ── Chevron — fa-chevron-down, rotates 180° when expanded ────────────────
  tta_chevronWrapper: (isExpanded) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    color: "#555",
    fontSize: "11px",
    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease",
    flexShrink: 0,
  }),

  // ── Expanded accordion body ───────────────────────────────────────────────
  tta_expandedBody: {
    padding: "10px 16px 14px 46px",
    borderTop: "1px solid #f0d5b8",
    backgroundColor: "#fffbf7",
  },
  tta_textarea: {
    width: "100%",
    fontSize: "13px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    resize: "vertical",
    minHeight: "100px",
    color: "#333",
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  // ── Loading modal (UNTOUCHED) ─────────────────────────────────────────────
  tta_modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  tta_modalBox: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "40px 48px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    minWidth: "320px",
  },
  tta_modalIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  tta_modalTitle: {
    fontSize: "15px",
    color: "#333",
    marginBottom: "8px",
    fontWeight: "500",
  },
  tta_modalSubtitle: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "16px",
  },
  tta_progressTrack: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  tta_progressFill: (pct) => ({
    width: `${pct}%`,
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: "4px",
    transition: "width 0.4s ease",
  }),

  tta_loadingScreen: {
    padding: "40px",
    textAlign: "center",
    color: "#555",
    fontSize: "15px",
  },
  tta_errorBanner: {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "6px",
    padding: "10px 14px",
    marginBottom: "12px",
    fontSize: "13px",
    color: "#856404",
  },
};

// ─── Small reusable sub-components ───────────────────────────────────────────

/**
 * Uses WordPress Admin's already-loaded FontAwesome (always present in WP admin).
 * Renders <i class="fa fa-{name}"> — no extra dependency needed.
 */
const FAIcon = ({ name, style }) => (
  <i className={`fa fa-${name}`} aria-hidden="true" style={style} />
);

/**
 * Custom checkbox styled to match Figma:
 * - headerStyle=true  → white border/tick on dark teal header
 * - headerStyle=false → orange fill when checked, grey border when unchecked
 */
const OrangeCheckbox = ({ checked, onChange, headerStyle }) => {
  const wrapStyle = headerStyle
    ? STYLES.tta_headerCheckbox(checked)
    : STYLES.tta_checkboxWrapper(checked);
  const tickStyle = headerStyle
    ? STYLES.tta_headerCheckboxTick
    : STYLES.tta_checkboxTick;

  return (
    <div
      style={wrapStyle}
      onClick={(e) => {
        e.stopPropagation();
        onChange && onChange();
      }}
    >
      {checked && <span style={tickStyle}>✓</span>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// Module-level mutable reference — mirrors latest postContents without useRef
// (same concept as getElementById: a direct mutable pointer outside React state)
let _postContents = {};

export default function GenerateBulkMp3File({ selectedLang }) {
  // ── State ─────────────────────────────────────────────────────────────────

  const [postContents, setPostContents] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [selectedPosts, setSelectedPosts] = useState({});
  const [allSelected, setAllSelected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [currentBatchLabel, setCurrentBatchLabel] = useState("");
  const [generationError, setGenerationError] = useState("");

  // ── Data load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const url = new URLSearchParams(window.location.search);
        const post_ids = url.get("atlasvoice_mp3_file").split(",");

        const formData = new FormData();
        formData.append("method", "get");
        formData.append("post_ids", post_ids);

        const res = await postWithoutImage(
          ttsObjPro.api_url + "tta_pro/v1/get_bulk_post_content",
          formData,
        );

        if (res.status) {
          setPostContents(res.data);
          _postContents = res.data;
          setIsDataLoaded(true);

          const sel = {};
          Object.keys(res.data).forEach((id) => {
            sel[id] = false;
          });
          setSelectedPosts(sel);
        }
      } catch (err) {
        console.error("[BulkMP3] Failed to load post contents:", err);
      }
    })();
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleContentChange = (e) => {
    const id = e.target.id;
    const value = e.target.value;
    const cloned = structuredClone(_postContents);
    cloned[id].contents[1] = value;
    setPostContents(cloned);
  };

  const toggleExpand = (pid) =>
    setExpandedPosts((prev) => ({ ...prev, [pid]: !prev[pid] }));

  const toggleSelect = (pid) => {
    setSelectedPosts((prev) => {
      const next = { ...prev, [pid]: !prev[pid] };
      setAllSelected(Object.values(next).every(Boolean));
      return next;
    });
  };

  const toggleSelectAll = () => {
    const next = !allSelected;
    setAllSelected(next);
    const sel = {};
    Object.keys(_postContents).forEach((id) => {
      sel[id] = next;
    });
    setSelectedPosts(sel);
  };

  const anySelected = Object.values(selectedPosts).some(Boolean);

  // ── Apply generated URL (stale-closure safe) ──────────────────────────────

  function applyGeneratedURL(mp3File, pid) {
    const cloned = structuredClone(_postContents);
    const postSettings = cloned[pid];
    const file_url_key = postSettings.extra[1].file_url_key;

    postSettings.settings.fileURLs = {
      [file_url_key]: mp3File,
      ...postSettings.settings.fileURLs,
    };

    cloned[pid] = postSettings;
    _postContents = cloned;
    setPostContents(cloned);
  }

  // ── Main generation handler ───────────────────────────────────────────────

  const handleGenerate = async () => {
    const contents = _postContents;
    if (!Object.keys(contents).length) return;

    const postsToGenerate = anySelected
      ? Object.keys(contents).filter((id) => selectedPosts[id])
      : Object.keys(contents);

    if (!postsToGenerate.length) return;

    setGenerationError("");
    setIsGenerating(true);
    setGeneratedCount(0);
    setTotalToGenerate(postsToGenerate.length);

    let successCount = 0;

    for (let i = 0; i < postsToGenerate.length; i++) {
      const pid = postsToGenerate[i];
      const postSettings = structuredClone(_postContents[pid]);

      setCurrentBatchLabel(
        __(
          `Batch no. ${i + 1} out of ${postsToGenerate.length}.`,
          "text-to-audio",
        ),
      );

      try {
        // FIX #1: No `await` on constructor — it's synchronous
        /* eslint-disable no-undef */
        const bulkMP3File = new BulkMP3File(postSettings);
        /* eslint-enable no-undef */

        let mp3File = null;

        if (bulkMP3File.fileURL) {
          mp3File = bulkMP3File.fileURL;
        } else {
          const playerId = String(ttsObjPro.player_id);

          if (playerId === "3") {
            mp3File = await bulkMP3File.init_gtts(1);
          } else if (playerId === "4") {
            mp3File = await bulkMP3File.init_gctts(1);
          } else if (playerId === "5") {
            mp3File = await bulkMP3File.init_chat_gpt(1);
          } else {
            console.warn(
              `[BulkMP3] Unrecognised player_id "${ttsObjPro.player_id}" for post ${pid}. Skipping.`,
            );
          }
        }

        if (mp3File) {
          successCount++;
          applyGeneratedURL(mp3File, pid);
          setGeneratedCount(successCount);
        }
      } catch (err) {
        // FIX #4: Per-post error — loop continues, modal doesn't freeze
        console.error(`[BulkMP3] Error generating MP3 for post ${pid}:`, err);
        setGenerationError(
          __(
            `Error on "${_postContents[pid]?.extra[1]?.title ?? pid}": ${err.message ?? err}. Remaining posts will still be processed.`,
            "text-to-audio",
          ),
        );
      }
    }

    setIsGenerating(false);

    if (successCount === postsToGenerate.length) {
      alert(__("All MP3 Files Generated", "text-to-audio"));
    } else if (successCount > 0) {
      alert(
        __(
          `${successCount} of ${postsToGenerate.length} MP3 files generated. Check the console for errors.`,
          "text-to-audio",
        ),
      );
    } else {
      alert(
        __(
          "MP3 generation failed. Please check your TTS API settings and try again.",
          "text-to-audio",
        ),
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isDataLoaded) {
    return (
      <div style={STYLES.tta_loadingScreen}>
        {__("Loading…", "text-to-audio")}
      </div>
    );
  }

  const progressPct =
    totalToGenerate > 0
      ? Math.round((generatedCount / totalToGenerate) * 100)
      : 0;

  return (
    <React.Fragment>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* ── Loading modal (UNTOUCHED as requested) ────────────────── */}
      {isGenerating && (
        <div style={STYLES.tta_modalOverlay}>
          <div style={STYLES.tta_modalBox}>
            <div style={STYLES.tta_modalIcon}>🎵</div>
            <div style={STYLES.tta_modalTitle}>
              {__("Generating mp3 file, please wait a while…", "text-to-audio")}
            </div>
            <div style={STYLES.tta_modalSubtitle}>{currentBatchLabel}</div>
            <div style={STYLES.tta_progressTrack}>
              <div style={STYLES.tta_progressFill(progressPct)} />
            </div>
          </div>
        </div>
      )}

      {/*
       * REQUIRED hidden mount point — BulkMP3File class calls:
       *   document.getElementById('player_content_1').append(audioEl)
       * NEVER remove this div or generation will throw:
       *   "Cannot read properties of null (reading 'append')"
       */}
      <div id="player_content_1" style={{ display: "none" }} />

      <div style={STYLES.tta_wrapper}>
        {/* ── Error banner ─────────────────────────────────────────── */}
        {generationError && (
          <div style={STYLES.tta_errorBanner}>{generationError}</div>
        )}

        {/* ── Main card ────────────────────────────────────────────── */}
        <div style={STYLES.tta_card}>
          {/* ── Table header row ───────────────────────────────────── */}
          <div style={STYLES.tta_tableHeader}>
            <OrangeCheckbox
              checked={allSelected}
              onChange={toggleSelectAll}
              headerStyle={true}
            />
            <span style={STYLES.tta_tableHeaderText}>
              {__("All Post Title", "text-to-audio")}
            </span>
            <button
              style={STYLES.tta_generateBtn(anySelected && !isGenerating)}
              onClick={handleGenerate}
              disabled={!anySelected || isGenerating}
            >
              {isGenerating
                ? __("Generating…", "text-to-audio")
                : __("Generate MP3 File", "text-to-audio")}
            </button>
          </div>

          {/* ── Post rows ──────────────────────────────────────────── */}
          {Object.keys(postContents).map((pid) => {
            const postData = postContents[pid];
            const title = postData.extra[1].title;
            const file_url_key = postData.extra[1].file_url_key;
            const content = postData.contents[1];
            const urls = postData.settings.fileURLs;
            const postURL = postData.settings.postURL;
            const hasFile = Object.keys(urls).includes(file_url_key);
            const isExpanded = !!expandedPosts[pid];
            const isChecked = !!selectedPosts[pid];

            return (
              <div key={pid} style={STYLES.tta_row(isChecked)}>
                {/* ── Row header ─────────────────────────────── */}
                <div
                  style={STYLES.tta_rowMain}
                  onClick={() => toggleExpand(pid)}
                >
                  {/* Orange checkbox */}
                  <OrangeCheckbox
                    checked={isChecked}
                    onChange={() => toggleSelect(pid)}
                  />

                  {/* Status icon: bordered box with fa-times (red) or fa-check (green) */}
                  <div style={STYLES.tta_statusIcon(hasFile)}>
                    <FAIcon name={hasFile ? "check" : "times"} />
                  </div>

                  {/* Post title */}
                  <span style={STYLES.tta_rowTitle(isChecked)}>{title}</span>

                  {/* Right side: eye icon + chevron */}
                  <div style={STYLES.tta_rowActions}>
                    {/*
                     * Eye icon (fa-eye): only visible when MP3 file exists.
                     * Invisible spacer keeps chevron perfectly aligned otherwise.
                     */}
                    {hasFile && postURL ? (
                      <a
                        href={postURL}
                        target="_blank"
                        rel="noreferrer"
                        style={STYLES.tta_eyeIconLink}
                        onClick={(e) => e.stopPropagation()}
                        title={__("View post", "text-to-audio")}
                      >
                        <FAIcon name="eye" />
                      </a>
                    ) : (
                      <span style={STYLES.tta_eyeIconSpacer} />
                    )}

                    {/* Chevron: fa-chevron-down, rotates 180° when expanded */}
                    <span style={STYLES.tta_chevronWrapper(isExpanded)}>
                      <FAIcon name="chevron-down" />
                    </span>
                  </div>
                </div>

                {/* ── Accordion expanded body ─────────────────── */}
                {isExpanded && (
                  <div style={STYLES.tta_expandedBody}>
                    <textarea
                      id={pid}
                      value={content}
                      onChange={handleContentChange}
                      onPaste={handleContentChange}
                      rows={6}
                      style={STYLES.tta_textarea}
                      placeholder={__(
                        `Site language is ${selectedLang ?? ""}. Paste translated content here to generate an MP3 in a different language.`,
                        "text-to-audio",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}
