/**
 * Scope Accordion (TTS-238 D27.3 - D27.6).
 *
 * Replaces the flat list of four legacy CSS-selector fields with a
 * per-scope accordion. The first item is "Global" (always shown,
 * expanded by default). One additional collapsed item appears per
 * enabled post type, Pro only.
 *
 * Each accordion body contains:
 *   - An optional "Manual post" input (slug or post ID) used by the
 *     Pick Visually button to choose where the picker lands.
 *   - For Free + Global: a Pro-upgrade banner explaining that the
 *     three exclude fields are ignored on save.
 *   - The four legacy fields (Include / Exclude CSS / Exclude tags /
 *     Exclude texts).
 *
 * The accordion header carries a single "Pick Visually" button on the
 * right that opens the picker scoped correctly via URL params:
 *   - Global  : ?atlasvoice_picker=1&scope=global
 *   - Per-type: ?atlasvoice_picker=1&scope=post_type:<slug>
 *
 * Per-type values are stored under the new
 * `tta__settings_atlasvoice_per_type_overrides` key as { <slug>:
 * { tta__settings_css_selectors, tta__settings_exclude_*: ... } }.
 * Global values keep using the existing four legacy keys directly.
 *
 * Free + global excludes:
 *   - Banner shown above the four fields.
 *   - "Pro" pill next to each gated label.
 *   - On Save (parent component handles the POST), Free strips the
 *     three exclude fields. We surface the toast via a custom event
 *     dispatched from this component.
 */

import React, {useMemo, useState} from "react";
import {__} from "@wordpress/i18n";
import {Accordion, Form, useAccordionButton} from "react-bootstrap";

const FIELDS = [
    {
        key: "tta__settings_css_selectors",
        label: __("Include Content By CSS Selectors", "text-to-audio"),
        placeholder: __("e.g. div.entry-content (multi-line allowed)", "text-to-audio"),
        proGated: false,
    },
    {
        key: "tta__settings_exclude_content_by_css_selectors",
        label: __("Exclude Content By CSS Selectors", "text-to-audio"),
        placeholder: __("e.g. .share-bar, .related-posts", "text-to-audio"),
        proGated: true,
    },
    {
        key: "tta__settings_exclude_tags",
        label: __("Exclude HTML Tags To Speak", "text-to-audio"),
        placeholder: __("Pipe-separated. e.g. blockquote|figure", "text-to-audio"),
        proGated: true,
    },
    {
        key: "tta__settings_exclude_texts",
        label: __("Exclude Texts To Speak", "text-to-audio"),
        placeholder: __("Pipe-separated. e.g. Read more...|Advertisement", "text-to-audio"),
        proGated: true,
    },
];

const upgradeUrl = () =>
    (typeof window !== "undefined" && window.ttsObj && window.ttsObj.upgrade_url) ||
    "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/";

/**
 * Resolve the URL of the post the picker should open on. Manual input
 * wins (post id or slug); otherwise we fall back to /step-rail/sample-url.
 */
async function resolvePickerUrl(scopeKind, postType, manualInput) {
    const apiBase = (window.ttsObj && window.ttsObj.api_url) || "/wp-json/";
    const nonce =
        (window.wpApiSettings && window.wpApiSettings.nonce) ||
        (window.ttsObj && window.ttsObj.rest_nonce) ||
        "";
    const headers = {"X-WP-Nonce": nonce};

    // 1. Manual override
    if (manualInput && manualInput.trim() !== "") {
        const trimmed = manualInput.trim();
        if (/^\d+$/.test(trimmed)) {
            const r = await fetch(apiBase + "wp/v2/posts/" + trimmed, {credentials: "same-origin", headers});
            if (r.ok) {
                const j = await r.json();
                if (j && j.link) return j.link;
            }
        } else {
            const r = await fetch(
                apiBase + "wp/v2/posts?slug=" + encodeURIComponent(trimmed) + "&_fields=link,id",
                {credentials: "same-origin", headers}
            );
            if (r.ok) {
                const j = await r.json();
                if (Array.isArray(j) && j[0] && j[0].link) return j[0].link;
            }
        }
        throw new Error(__("Could not find a post matching that ID or slug.", "text-to-audio"));
    }

    // 2. Sample-url fallback
    let q = "?scope=" + (scopeKind === "post_type" ? "post_type" : "global");
    if (scopeKind === "post_type" && postType) q += "&post_type=" + encodeURIComponent(postType);
    const r = await fetch(apiBase + "tta/v1/step-rail/sample-url" + q, {credentials: "same-origin", headers});
    const j = await r.json();
    if (j && j.url) return j.url;
    throw new Error(__("No published post available to launch the picker on.", "text-to-audio"));
}

function PickButton({scopeKind, postType, manualInput, label}) {
    const [busy, setBusy] = useState(false);
    return (
        <button
            type="button"
            className="btn btn-sm btn-dark"
            disabled={busy}
            onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setBusy(true);
                try {
                    const targetUrl = await resolvePickerUrl(scopeKind, postType, manualInput);
                    const u = new URL(targetUrl, window.location.origin);
                    u.searchParams.set("atlasvoice_picker", "1");
                    u.searchParams.set(
                        "scope",
                        scopeKind === "post_type" ? "post_type:" + postType : "global"
                    );
                    window.open(u.toString(), "_blank");
                } catch (err) {
                    window.alert((err && err.message) || __("Picker launch failed.", "text-to-audio"));
                } finally {
                    setBusy(false);
                }
            }}
            title={label}
        >
            <span style={{marginRight: 6}}>&#9654;</span>
            {busy ? __("Opening…", "text-to-audio") : __("Pick Visually", "text-to-audio")}
        </button>
    );
}

function ProBanner() {
    return (
        <div
            className="alert alert-warning d-flex align-items-start gap-2 mb-3"
            style={{fontSize: "13px", padding: "10px 12px"}}
        >
            <span style={{fontSize: "18px", lineHeight: 1, marginRight: "4px"}}>&#9889;</span>
            <div>
                <strong>{__("Excludes are a Pro feature", "text-to-audio")}</strong>
                <div className="mt-1">
                    {__(
                        "You can type into all four fields below, but only Include Content By CSS Selectors saves on Free. The other three are ignored until you upgrade.",
                        "text-to-audio"
                    )}
                </div>
                <a
                    href={upgradeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-warning mt-2"
                >
                    {__("Upgrade to Pro", "text-to-audio")} &rarr;
                </a>
            </div>
        </div>
    );
}

function ProPill() {
    return (
        <span
            className="badge bg-secondary ms-2"
            style={{fontSize: "10px", verticalAlign: "middle"}}
            title={__(
                "Pro feature — value won't be saved on Free. Upgrade to enable.",
                "text-to-audio"
            )}
        >
            {__("Pro", "text-to-audio")}
        </span>
    );
}

/**
 * Custom accordion header that keeps the Pick Visually button as a real
 * sibling of the toggle (instead of nested inside Accordion.Header's
 * own <button>, which is invalid HTML and swallows the click).
 */
function ScopeHeader({eventKey, headerLeft, scopeKind, postType, manualInput}) {
    const toggle = useAccordionButton(eventKey);
    return (
        <h2 className="accordion-header">
            <div
                className="d-flex align-items-center justify-content-between w-100"
                style={{paddingRight: "12px"}}
            >
                <button
                    type="button"
                    className="accordion-button collapsed"
                    onClick={toggle}
                    style={{flex: 1, background: "transparent", boxShadow: "none"}}
                >
                    <span style={{fontWeight: 600}}>
                        {headerLeft}
                        {scopeKind === "post_type" && (
                            <span className="badge bg-info ms-2" style={{fontSize: "10px"}}>
                                {__("Pro", "text-to-audio")}
                            </span>
                        )}
                    </span>
                </button>
                <div style={{marginLeft: "12px"}}>
                    <PickButton
                        scopeKind={scopeKind}
                        postType={postType}
                        manualInput={manualInput}
                        label={
                            scopeKind === "global"
                                ? __("Pick visually for the global rule", "text-to-audio")
                                : __("Pick visually for this post type", "text-to-audio")
                        }
                    />
                </div>
            </div>
        </h2>
    );
}

/**
 * One accordion section. `scopeKind` is "global" or "post_type".
 * For per-type, also pass `postType`. The component knows where to
 * read/write each field based on those.
 */
function ScopeSection({scopeKind, postType, settings, handleChange, isPro}) {
    const [manualInput, setManualInput] = useState("");

    // Read current values for the four fields out of the right slot.
    const overrides =
        (settings && settings.tta__settings_atlasvoice_per_type_overrides) || {};
    const typeBag = (overrides[postType] && typeof overrides[postType] === "object") ? overrides[postType] : {};

    const readField = (key) => {
        if (scopeKind === "global") return settings[key] != null ? settings[key] : "";
        return typeBag[key] != null ? typeBag[key] : "";
    };

    // Synthetic event compatible with Settings.js::handleChange. The
    // existing handler reads e.target.name / e.target.value and probes
    // e.target.getAttribute('type') for checkboxes — provide a stub so
    // it doesn't throw when value is an object.
    const dispatchChange = (name, value) => {
        handleChange({
            target: {
                name: name,
                value: value,
                getAttribute: () => null,
            },
        });
    };

    const writeField = (key, value) => {
        if (scopeKind === "global") {
            dispatchChange(key, value);
            return;
        }
        // Per-type: read-modify-write the override map.
        const next = {...overrides};
        const slot = {...(next[postType] || {})};
        slot[key] = value;
        next[postType] = slot;
        dispatchChange("tta__settings_atlasvoice_per_type_overrides", next);
    };

    const headerLeft =
        scopeKind === "global"
            ? __("Global", "text-to-audio")
            : __("Post type:", "text-to-audio") + " " + postType;

    const showProBanner = scopeKind === "global" && !isPro;
    const eventKey = scopeKind === "global" ? "global" : "pt:" + postType;

    return (
        <Accordion.Item eventKey={eventKey}>
            <ScopeHeader
                eventKey={eventKey}
                headerLeft={headerLeft}
                scopeKind={scopeKind}
                postType={postType}
                manualInput={manualInput}
            />
            <Accordion.Body>
                {/* Manual post input */}
                <Form.Group className="mb-3">
                    <Form.Label className="small text-muted mb-1">
                        {__("Manual post (optional)", "text-to-audio")}
                    </Form.Label>
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder={__("Slug or post ID — leave blank to use a sample", "text-to-audio")}
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                    />
                </Form.Group>

                {showProBanner && <ProBanner />}

                {FIELDS.map((f) => (
                    <Form.Group className="mb-3" key={f.key}>
                        <Form.Label className="setting-label">
                            {f.label}
                            {f.proGated && !isPro && <ProPill />}
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder={f.placeholder}
                            value={readField(f.key) || ""}
                            onChange={(e) => writeField(f.key, e.target.value)}
                        />
                    </Form.Group>
                ))}
            </Accordion.Body>
        </Accordion.Item>
    );
}

export default function ScopeAccordion({settings, handleChange}) {
    const isPro = !!(typeof ttsObj !== "undefined" && ttsObj.is_pro_active);

    const enabledPostTypes = useMemo(() => {
        const raw = settings && settings.tta__settings_allow_listening_for_post_types;
        return Array.isArray(raw) ? raw : [];
    }, [settings]);

    return (
        <div className="mb-4">
            <Accordion defaultActiveKey="global" alwaysOpen={false}>
                <ScopeSection
                    scopeKind="global"
                    settings={settings}
                    handleChange={handleChange}
                    isPro={isPro}
                />
                {isPro &&
                    enabledPostTypes.map((slug) => (
                        <ScopeSection
                            key={slug}
                            scopeKind="post_type"
                            postType={slug}
                            settings={settings}
                            handleChange={handleChange}
                            isPro={isPro}
                        />
                    ))}
            </Accordion>
        </div>
    );
}
