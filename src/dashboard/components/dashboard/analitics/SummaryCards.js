import React from "react";
import { __ } from "@wordpress/i18n";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

/**
 * Format large numbers with K, M suffix
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
    }
    return num.toString();
};

/**
 * Format time in minutes/hours
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
const formatTime = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "0 Min";

    let output = totalSeconds / 60;
    let suffix = " Min";

    if (output >= 60) {
        output = output / 60;
        suffix = output > 1 ? " Hours" : " Hour";
    } else {
        suffix = output > 1 ? " Mins" : " Min";
    }

    return output.toFixed(2) + suffix;
};

/**
 * Single stat card component
 */
const StatCard = ({ label, value, change, trend, tooltip, colorClass }) => {
    // TTS-247: the period-over-period change arrow shows only when comparison
    // data is present (previous-period is injected by Pro via the analytics
    // response filter) — driven by data-presence, not a license check.
    const showChange = change !== undefined && change !== null;

    const card = (
        <div className={`tta_stat_card ${colorClass}`}>
            <div className="tta_stat_label">{label}</div>
            <div className="tta_stat_value">{value}</div>
            {showChange && (
                <div className={`tta_stat_change ${trend === "up" ? "tta_stat_change_up" : "tta_stat_change_down"}`}>
                    {trend === "up" ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                </div>
            )}
        </div>
    );

    if (tooltip) {
        return (
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tooltip-${label}`}>{tooltip}</Tooltip>}
            >
                {card}
            </OverlayTrigger>
        );
    }

    return card;
};

/**
 * SummaryCards Component
 * Displays analytics summary cards with metrics
 *
 * @param {Object} props
 * @param {Object} props.summary - Summary data object
 * @param {Object} props.previousSummary - Previous period summary for comparison (Pro only)
 * @param {string} props.dateRange - Current date range label
 */
export default function SummaryCards({ summary = {}, previousSummary = null, dateRange = "Last 7 Days" }) {
    // TTS-247/2.2.2: MP3 download is a premium player feature, so the free
    // build always reports 0 downloads. Hide the Download stat unless the
    // data-driven `download` capability is present (Pro active).
    const capabilities = (typeof ttsObj !== "undefined" && ttsObj.capabilities) || {};
    const hasDownload = !!capabilities.download;

    // Calculate percentage changes if previous data is available
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return null;
        return ((current - previous) / previous) * 100;
    };

    const getTrend = (change) => {
        if (change === null) return null;
        return change >= 0 ? "up" : "down";
    };

    // Extract values from summary
    const totalPosts = summary.totalPosts || 0;
    const totalInit = summary.totalCounts?.init || 0;
    const totalPlay = summary.totalCounts?.play || 0;
    const totalTime = summary.totalCounts?.time || 0;
    const totalPause = summary.totalCounts?.pause || 0;
    const totalDownload = summary.totalCounts?.download || 0;
    const totalEnd = summary.totalCounts?.end || 0;
    const totalInteractions = summary.totalInteractions || 0;

    // Calculate bounce rate (plays that ended before 10% - approximation using init vs end)
    const bounceRate = totalInit > 0 ? ((totalInit - totalEnd) / totalInit) * 100 : 0;

    // Previous period values for comparison (Pro feature)
    const prevInit = previousSummary?.totalCounts?.init || 0;
    const prevPlay = previousSummary?.totalCounts?.play || 0;
    const prevTime = previousSummary?.totalCounts?.time || 0;
    const prevPause = previousSummary?.totalCounts?.pause || 0;
    const prevDownload = previousSummary?.totalCounts?.download || 0;
    const prevEnd = previousSummary?.totalCounts?.end || 0;

    // Free metrics (always shown)
    const freeMetrics = [
        {
            label: __("Total Posts", "text-to-audio"),
            value: formatNumber(totalPosts),
            colorClass: "tta_stat_posts",
            tooltip: __("Total posts with TTS player", "text-to-audio"),
        },
        {
            label: __("Init", "text-to-audio"),
            value: formatNumber(totalInit),
            change: calculateChange(totalInit, prevInit),
            trend: getTrend(calculateChange(totalInit, prevInit)),
            colorClass: "tta_stat_init",
            tooltip: __("Player initialization count", "text-to-audio"),
        },
        {
            label: __("Play", "text-to-audio"),
            value: formatNumber(totalPlay),
            change: calculateChange(totalPlay, prevPlay),
            trend: getTrend(calculateChange(totalPlay, prevPlay)),
            colorClass: "tta_stat_play",
            tooltip: __("Total play button clicks", "text-to-audio"),
        },
        {
            label: __("Time (Min)", "text-to-audio"),
            value: typeof totalTime === "string" ? totalTime : formatTime(totalTime),
            change: calculateChange(
                typeof totalTime === "number" ? totalTime : 0,
                typeof prevTime === "number" ? prevTime : 0
            ),
            trend: getTrend(calculateChange(
                typeof totalTime === "number" ? totalTime : 0,
                typeof prevTime === "number" ? prevTime : 0
            )),
            colorClass: "tta_stat_time",
            tooltip: __("Total listening time", "text-to-audio"),
        },
        {
            label: __("Pause", "text-to-audio"),
            value: formatNumber(totalPause),
            change: calculateChange(totalPause, prevPause),
            trend: getTrend(calculateChange(totalPause, prevPause)),
            colorClass: "tta_stat_pause",
            tooltip: __("Total pause actions", "text-to-audio"),
        },
    ];

    // TTS-247/2.2.2: End / Bounce are computed in the free base aggregator and
    // shown for everyone. Download is premium-only (free has no MP3 download),
    // so it's added only when the `download` capability is present.
    const extraMetrics = [
        ...(hasDownload ? [{
            label: __("Download", "text-to-audio"),
            value: formatNumber(totalDownload),
            change: calculateChange(totalDownload, prevDownload),
            trend: getTrend(calculateChange(totalDownload, prevDownload)),
            colorClass: "tta_stat_download",
            tooltip: __("Total MP3 downloads", "text-to-audio"),
        }] : []),
        {
            label: __("End", "text-to-audio"),
            value: formatNumber(totalEnd),
            change: calculateChange(totalEnd, prevEnd),
            trend: getTrend(calculateChange(totalEnd, prevEnd)),
            colorClass: "tta_stat_end",
            tooltip: __("Total completions", "text-to-audio"),
        },
        {
            label: __("Bounce Rate", "text-to-audio"),
            value: `${bounceRate.toFixed(1)}%`,
            change: null, // Bounce rate change calculated differently
            trend: bounceRate > 20 ? "down" : "up", // Lower bounce is better
            colorClass: "tta_stat_bounce",
            tooltip: __("Users who didn't complete the audio", "text-to-audio"),
        },
    ];

    const displayFreeMetrics = freeMetrics;
    const displayProMetrics = extraMetrics;

    return (
        <div className="tta_summary_card">
            <div className="tta_summary_header">
                <div className="tta_summary_header_left">
                    <h3 className="tta_summary_title">
                        {__("TTS Player Analytics Summary", "text-to-audio")}
                    </h3>
                    <span className="tta_total_interactions_badge">
                        🔥 {__("Total Interactions:", "text-to-audio")} {formatNumber(totalInteractions)}
                    </span>
                </div>
                <span className="tta_timeframe_badge">{dateRange}</span>
            </div>

            <div className="tta_stat_cards_container">
                {/* Core metrics */}
                {displayFreeMetrics.map((metric, index) => (
                    <StatCard
                        key={`free-${index}`}
                        {...metric}
                    />
                ))}

                {/* Download / End / Bounce */}
                {displayProMetrics.map((metric, index) => (
                    <StatCard
                        key={`pro-${index}`}
                        {...metric}
                    />
                ))}
            </div>
        </div>
    );
}
