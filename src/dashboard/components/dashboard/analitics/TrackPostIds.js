import React, { useState, useRef } from "react";
import { __ } from "@wordpress/i18n";
import { Form, Button } from "react-bootstrap";
import { MultiSelect } from "../../context/MultiSelect";
import notify from "../../context/Notify";
import AtlasVoicePlayerInsights from "../../../../../admin/js/AtlasVoicePlayerInsights";

/**
 * Format time value
 */
const formatTime = (value) => {
    if (typeof value === "string") return value;
    if (!value || isNaN(value)) return "0 Min";

    const minutes = value / 60;
    if (minutes >= 60) {
        return (minutes / 60).toFixed(2) + " Hours";
    }
    return minutes.toFixed(2) + " Min";
};

/**
 * TrackPostIds Component
 * Allows tracking specific post IDs and viewing their metrics
 *
 * @param {Object} props
 * @param {Object} props.postIds - Available post IDs
 * @param {Array} props.selectedIds - Currently selected post IDs
 * @param {function} props.onSelectionChange - Callback when selection changes
 * @param {Object} props.metrics - Metrics data for selected posts
 * @param {string} props.dateRange - Selected date range
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {boolean} props.analyticsEnabled - Whether analytics is enabled
 */
export default function TrackPostIds({
    postIds = {},
    selectedIds = [],
    onSelectionChange,
    metrics = null,
    dateRange = "Dec 27 - Jan 03, 2025",
    onDateRangeChange,
    analyticsEnabled = true,
}) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;
    const [searchParams, setSearchParams] = useState({});
    const [searchedMetrics, setSearchedMetrics] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const insightsContainerRef = useRef(null);

    // Handle search input change
    const handleSearchChange = (e) => {
        if (!analyticsEnabled) {
            notify(__("Please enable analytics first.", "text-to-audio"), "error");
            return;
        }

        // Check date range restriction for free users
        if (!isProActive && (e.target.name === "from_date" || e.target.name === "to_date")) {
            notify(
                <>
                    <h6>{__("Date Range is only available in Pro version", "text-to-audio")}</h6>
                    <a
                        href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tta_btn"
                        style={{ marginTop: "10px", display: "inline-block", padding: "8px 16px" }}
                    >
                        {__("Buy Now", "text-to-audio")}
                    </a>
                </>,
                "info",
                { autoClose: 10000 }
            );
            return;
        }

        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value,
        });
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();

        if (!analyticsEnabled) {
            notify(__("Please enable analytics first.", "text-to-audio"), "error");
            return;
        }

        if (!searchParams.post_id && !searchParams.from_date && !searchParams.to_date) {
            notify(__("Please provide a Post ID or date range.", "text-to-audio"), "error");
            return;
        }

        setIsSearching(true);

        // Clear previous results
        if (insightsContainerRef.current) {
            insightsContainerRef.current.innerHTML = "";
        }

        // Create insights instance
        new AtlasVoicePlayerInsights(searchParams, "dashboard");

        setSearchedMetrics({
            post_id: searchParams.post_id,
            from_date: searchParams.from_date,
            to_date: searchParams.to_date,
        });
    };

    // Clear search
    const clearSearch = () => {
        setSearchParams({});
        setSearchedMetrics(null);
        setIsSearching(false);
        if (insightsContainerRef.current) {
            insightsContainerRef.current.innerHTML = "";
        }
    };

    // Default metrics to display
    const defaultMetrics = [
        { key: "totalInit", label: "totalInit", value: metrics?.totalInit || 14 },
        { key: "totalPlay", label: "totalPlay", value: metrics?.totalPlay || 8 },
        { key: "totalPause", label: "totalPause", value: metrics?.totalPause || 4 },
        { key: "totalTime", label: "totalTime", value: formatTime(metrics?.totalTime) || "0.75 Minute" },
        { key: "totalEnd", label: "totalEnd", value: metrics?.totalEnd || 7, isPro: true },
        { key: "totalDownload", label: "totalDownload", value: metrics?.totalDownload || 1, isPro: true },
        { key: "averagePlayClickRatio", label: "averagePlayClickRatio", value: metrics?.playClickRatio || "57.4%", isPro: true },
        { key: "averageListenTillEndRatio", label: "averageListenTillEndRatio", value: metrics?.listenTillEndRatio || "87.50%", isPro: true },
        { key: "averageListeningTimePerPlay", label: "averageListeningTimePerPlay", value: metrics?.avgTimePerPlay || "5.63 Seconds", isPro: true },
        { key: "averagePausesPerPlay", label: "averagePausesPerPlay", value: metrics?.avgPauses || "0.50", isPro: true },
    ];

    // Pro-only milestone metrics
    const milestoneMetrics = [
        { key: "25_percent", label: "25% milestone", value: metrics?.["25_percent"] || 12, isPro: true },
        { key: "50_percent", label: "50% milestone", value: metrics?.["50_percent"] || 10, isPro: true },
        { key: "75_percent", label: "75% milestone", value: metrics?.["75_percent"] || 8, isPro: true },
        { key: "bounceRate", label: "bounceRate", value: metrics?.bounceRate || "8.2%", isPro: true },
    ];

    // Combine metrics, filtering for free users
    const displayMetrics = isProActive
        ? [...defaultMetrics, ...milestoneMetrics]
        : defaultMetrics.filter(m => !m.isPro);

    return (
        <div className="tta_analytics_card tta_track_posts_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Track Post IDs", "text-to-audio")}</h3>
                <span className="tta_date_range_small">{dateRange}</span>
            </div>

            {/* Post selector */}
            <div className="tta_multiselect_wrapper">
                <Form.Label className="tta_form_label">
                    {selectedIds.includes("all") ? "all" : selectedIds.length + " selected"}{" "}
                    {selectedIds.length > 0 && (
                        <span className="tta_remove_tag" onClick={() => onSelectionChange && onSelectionChange([])}>×</span>
                    )}
                </Form.Label>
                <MultiSelect
                    toastMessage={__("Tracking more than 5 post IDs is a Pro feature", "text-to-audio")}
                    name="tts_trackable_post_ids"
                    id="tts_trackable_post_ids"
                    selectedItems={selectedIds}
                    selectionLimit={isProActive ? 999 : 5}
                    options={postIds}
                    onChange={onSelectionChange}
                />
            </div>

            {/* Search section */}
            <div className="tta_search_section">
                <Form.Control
                    type="number"
                    name="post_id"
                    placeholder={__("Post ID", "text-to-audio")}
                    value={searchParams.post_id || ""}
                    onChange={handleSearchChange}
                    className="tta_search_input"
                    disabled={!analyticsEnabled}
                />
                <div className="tta_date_inputs">
                    <Form.Control
                        type="date"
                        name="from_date"
                        value={searchParams.from_date || ""}
                        onChange={handleSearchChange}
                        className="tta_search_input"
                        disabled={!analyticsEnabled}
                    />
                    <Form.Control
                        type="date"
                        name="to_date"
                        value={searchParams.to_date || ""}
                        onChange={handleSearchChange}
                        className="tta_search_input"
                        disabled={!analyticsEnabled}
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    className="tta_search_btn"
                    disabled={!analyticsEnabled}
                >
                    {__("Search", "text-to-audio")}
                </Button>
                {searchedMetrics && (
                    <Button
                        onClick={clearSearch}
                        className="tta_search_btn"
                        variant="secondary"
                        style={{ marginLeft: "10px" }}
                    >
                        {__("Clear", "text-to-audio")}
                    </Button>
                )}
            </div>

            {/* Search results info */}
            {searchedMetrics && (
                <div className="tta_search_info">
                    <strong>{__("Showing results for:", "text-to-audio")}</strong>
                    {searchedMetrics.post_id && ` ${__("Post ID:", "text-to-audio")} ${searchedMetrics.post_id}`}
                    {searchedMetrics.from_date && ` | ${__("From:", "text-to-audio")} ${searchedMetrics.from_date}`}
                    {searchedMetrics.to_date && ` | ${__("To:", "text-to-audio")} ${searchedMetrics.to_date}`}
                </div>
            )}

            {/* Insights container for dynamic results */}
            <div
                ref={insightsContainerRef}
                id="atlasVoice_analytics"
                className="tta_insights_container"
            ></div>

            {/* Default metrics table - only show when no search */}
            {!searchedMetrics && (
                <div className="tta_metrics_table">
                    <div className="tta_table_row tta_table_header_row">
                        <div className="tta_table_cell">{__("Metric", "text-to-audio")}</div>
                        <div className="tta_table_cell">{__("Value", "text-to-audio")}</div>
                    </div>
                    {displayMetrics.map((metric, index) => (
                        <div key={`metric-${index}`} className="tta_table_row">
                            <div className="tta_table_cell">
                                {metric.label}
                                {metric.isPro && !isProActive && (
                                    <span className="tta_pro_badge_inline">{__("Pro", "text-to-audio")}</span>
                                )}
                            </div>
                            <div className="tta_table_cell">
                                {metric.isPro && !isProActive ? "--" : metric.value}
                            </div>
                        </div>
                    ))}

                    {/* Show pro upsell for additional metrics */}
                    {!isProActive && (
                        <div className="tta_metrics_pro_upsell">
                            <a
                                href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {__("Unlock 10+ more metrics with Pro", "text-to-audio")} →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
