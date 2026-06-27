import React from "react";
import { __ } from "@wordpress/i18n";
import { proUrl as buildProUrl } from "../../../proUrl";

/**
 * ProFeatureOverlay Component
 * Shows an overlay with upgrade to pro message for pro-only features.
 *
 * Two visual modes:
 *  - default : full-card lock (blurred content + large centered "Upgrade to
 *    Pro" notice). Use when the ENTIRE card is premium (e.g. Peak Hours
 *    Heatmap, Export & Reports).
 *  - compact : small inline lock chip sized to the wrapped control. Use when
 *    only a small SUB-control of an otherwise-free card is premium (e.g. the
 *    comparison toggle, custom date inputs). The full-size notice would
 *    overflow a tiny region, so this keeps the lock proportional.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to show behind the overlay
 * @param {string} props.featureName - Name of the feature being locked
 * @param {boolean} props.showOverlay - Whether to show the overlay (data-driven, e.g. !capabilities.X)
 * @param {boolean} props.compact - Use the small inline lock chip instead of the full-card notice
 */
export default function ProFeatureOverlay({ children, featureName = "", showOverlay = true, compact = false }) {
    const proUrl = buildProUrl('pro_feature_overlay');

    if (!showOverlay) {
        return <>{children}</>;
    }

    if (compact) {
        const title = featureName
            ? `${featureName} — ${__("Pro feature. Upgrade to unlock.", "text-to-audio")}`
            : __("Pro feature. Upgrade to unlock.", "text-to-audio");

        return (
            <div className="tta_pro_feature_wrapper tta_pro_feature_wrapper_compact">
                <div className="tta_pro_feature_content tta_pro_feature_content_compact">
                    {children}
                </div>
                <a
                    href={proUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tta_pro_feature_overlay_compact"
                    title={title}
                    aria-label={title}
                >
                    <span className="tta_pro_compact_lock">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        {__("Pro", "text-to-audio")}
                    </span>
                </a>
            </div>
        );
    }

    return (
        <div className="tta_pro_feature_wrapper">
            <div className="tta_pro_feature_content">
                {children}
            </div>
            <div className="tta_pro_feature_overlay">
                <div className="tta_pro_feature_notice">
                    <div className="tta_pro_feature_icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h4 className="tta_pro_feature_title">
                        {featureName ? `${featureName} - ` : ""}{__("Pro Feature", "text-to-audio")}
                    </h4>
                    <p className="tta_pro_feature_description">
                        {__("Upgrade to Pro to unlock this feature and get access to advanced analytics.", "text-to-audio")}
                    </p>
                    <a
                        href={proUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tta_pro_feature_btn"
                    >
                        {__("Upgrade to Pro", "text-to-audio")}
                    </a>
                </div>
            </div>
        </div>
    );
}
