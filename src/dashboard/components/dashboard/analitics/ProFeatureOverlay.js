import React from "react";
import { __ } from "@wordpress/i18n";

/**
 * ProFeatureOverlay Component
 * Shows an overlay with upgrade to pro message for pro-only features
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to show behind the overlay
 * @param {string} props.featureName - Name of the feature being locked
 * @param {boolean} props.showOverlay - Whether to show the overlay (typically !ttsObj.is_pro_active)
 */
export default function ProFeatureOverlay({ children, featureName = "", showOverlay = true }) {
    const proUrl = "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/";

    if (!showOverlay) {
        return <>{children}</>;
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
