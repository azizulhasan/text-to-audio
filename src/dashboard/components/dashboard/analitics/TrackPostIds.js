import React, { useState, useRef } from "react";
import { __ } from "@wordpress/i18n";
import { Form, Button } from "react-bootstrap";
import { MultiSelect } from "../../context/MultiSelect";
import notify from "../../context/Notify";
import ProFeatureOverlay from "./ProFeatureOverlay";
import { proUrl } from "../../../proUrl";
import AtlasVoicePlayerInsights from "../../../../../admin/js/AtlasVoicePlayerInsights";

/**
 * Format time value from seconds to readable string
 */
const formatTime = (value) => {
    if (typeof value === "string") return value;
    if (!value || isNaN(value)) return "0 Min";

    const minutes = value / 60;
    if (minutes >= 60) {
        const hours = minutes / 60;
        return hours.toFixed(2) + (hours > 1 ? " Hours" : " Hour");
    }
    return minutes.toFixed(2) + (minutes > 1 ? " Minutes" : " Minute");
};

/**
 * Calculate ratio percentage
 */
const calculateRatio = (numerator, denominator) => {
    if (!denominator || denominator === 0) return "0%";
    return ((numerator / denominator) * 100).toFixed(1) + "%";
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
    dateRange = "Last 30 Days",
    onDateRangeChange,
    analyticsEnabled = true,
}) {
    // TTS-247: data-driven (no is_atlasvoice_addon_functional gating). Per-post metrics are all
    // computed in the free base aggregator, so they show for everyone. Only the
    // custom date-range search is premium, gated by the extendedDateRange capability.
    const capabilities = (typeof ttsObj !== "undefined" && ttsObj.capabilities) || {};
    const hasExtendedRange = !!capabilities.extendedDateRange;
    // TTS-247/2.2.2: MP3 download is premium, so the free build always reports 0
    // downloads — hide the totalDownload row unless the capability is present.
    const hasDownload = !!capabilities.download;
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
        if (!hasExtendedRange && (e.target.name === "from_date" || e.target.name === "to_date")) {
            notify(
                <>
                    <h6>{__("Date Range is only available in Pro version", "text-to-audio")}</h6>
                    <a
                        href={proUrl('track_post_ids')}
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

    // Calculate derived metrics from API summary data
    const totalInit = metrics?.total_init || 0;
    const totalPlay = metrics?.total_play || 0;
    const totalPause = metrics?.total_pause || 0;
    const totalTime = metrics?.total_time || 0;
    const totalEnd = metrics?.total_end || 0;
    const totalDownload = metrics?.total_download || 0;
    const total25Percent = metrics?.total_25_percent || 0;
    const total50Percent = metrics?.total_50_percent || 0;
    const total75Percent = metrics?.total_75_percent || 0;

    // Calculate ratios
    const playClickRatio = calculateRatio(totalPlay, totalInit);
    const listenTillEndRatio = calculateRatio(totalEnd, totalPlay);
    const avgTimePerPlay = totalPlay > 0 ? (totalTime / totalPlay).toFixed(2) + " Seconds" : "0 Seconds";
    const avgPausesPerPlay = totalPlay > 0 ? (totalPause / totalPlay).toFixed(2) : "0";
    const bounceRate = calculateRatio(totalInit - totalPlay, totalInit);

    // Default metrics to display (using real data from API)
    const defaultMetrics = [
        { key: "totalInit", label: "totalInit", value: totalInit },
        { key: "totalPlay", label: "totalPlay", value: totalPlay },
        { key: "totalPause", label: "totalPause", value: totalPause },
        { key: "totalTime", label: "totalTime", value: formatTime(totalTime) },
        { key: "totalEnd", label: "totalEnd", value: totalEnd, isPro: true },
        ...(hasDownload ? [{ key: "totalDownload", label: "totalDownload", value: totalDownload, isPro: true }] : []),
        { key: "averagePlayClickRatio", label: "averagePlayClickRatio", value: playClickRatio, isPro: true },
        { key: "averageListenTillEndRatio", label: "averageListenTillEndRatio", value: listenTillEndRatio, isPro: true },
        { key: "averageListeningTimePerPlay", label: "averageListeningTimePerPlay", value: avgTimePerPlay, isPro: true },
        { key: "averagePausesPerPlay", label: "averagePausesPerPlay", value: avgPausesPerPlay, isPro: true },
    ];

    // Pro-only milestone metrics (using real data from API)
    const milestoneMetrics = [
        { key: "25_percent", label: "25% milestone", value: total25Percent, isPro: true },
        { key: "50_percent", label: "50% milestone", value: total50Percent, isPro: true },
        { key: "75_percent", label: "75% milestone", value: total75Percent, isPro: true },
        { key: "bounceRate", label: "bounceRate", value: bounceRate, isPro: true },
    ];

    // TTS-247: all metrics are free (base-aggregator data) — show every row.
    const displayMetrics = [...defaultMetrics, ...milestoneMetrics];

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
                    toastMessage={__("You've reached the selection limit.", "text-to-audio")}
                    name="tts_trackable_post_ids"
                    id="tts_trackable_post_ids"
                    selectedItems={selectedIds}
                    selectionLimit={100000}
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
                {/* Custom date-range search is premium. The post selector,
                    Post ID search and metrics table above/below stay free; only
                    these date inputs are locked behind the Pro overlay. */}
                <ProFeatureOverlay
                    compact
                    showOverlay={!hasExtendedRange}
                    featureName={__("Custom Date Range", "text-to-audio")}
                >
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
                </ProFeatureOverlay>
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
                            </div>
                            <div className="tta_table_cell">
                                {metric.value}
                            </div>
                        </div>
                    ))}

                    {/* Premium upsell — custom date-range search (shown when capability absent) */}
                    {!hasExtendedRange && (
                        <div className="tta_metrics_pro_upsell">
                            <a
                                href={proUrl('track_post_ids')}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {__("Unlock custom date-range search with Pro", "text-to-audio")} →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
