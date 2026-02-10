import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * Single funnel stage component
 */
const FunnelStage = ({ label, count, percentage, color, maxWidth = 100 }) => {
    const barWidth = Math.max(percentage, 5); // Minimum 5% width for visibility

    return (
        <div className="tta_funnel_stage">
            <div className="tta_funnel_stage_label">
                <span className="tta_funnel_stage_name">{label}</span>
                <span className="tta_funnel_stage_count">
                    {count.toLocaleString()}
                </span>
            </div>
            <div className="tta_funnel_bar_container">
                <div
                    className="tta_funnel_bar"
                    style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                    }}
                >
                    <span className="tta_funnel_percentage">{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
};

/**
 * EngagementFunnel Component
 * Shows the user journey funnel from Init to End (Pro only)
 *
 * @param {Object} props
 * @param {Object} props.data - Analytics data containing funnel metrics
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {function} props.aggregateFilteredData - Function to aggregate filtered data
 */
export default function EngagementFunnel({
    data = {},
    rawResults = [],
    dateRange = "Last 30 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    aggregateFilteredData
}) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // Filter and aggregate funnel data based on component's date range
    const filteredFunnelData = useMemo(() => {
        if (!isProActive) return null;

        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            return aggregateFilteredData(filtered, "funnel");
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData, isProActive]);

    // Use filtered data
    const displayFunnelData = filteredFunnelData || data;

    // Extract funnel data
    const totalInit = displayFunnelData.init || 0;
    const totalPlay = displayFunnelData.play || 0;
    const total25 = displayFunnelData["25_percent"] || displayFunnelData.quarter || 0;
    const total50 = displayFunnelData["50_percent"] || displayFunnelData.half || 0;
    const total75 = displayFunnelData["75_percent"] || displayFunnelData.threeQuarter || 0;
    const totalEnd = displayFunnelData.end || 0;

    // Calculate percentages based on init (100%)
    const calculatePercentage = (value) => {
        if (totalInit === 0) return 0;
        return (value / totalInit) * 100;
    };

    // Funnel stages with colors
    const stages = [
        {
            label: __("Init", "text-to-audio"),
            count: totalInit,
            percentage: 100,
            color: "#4CAF50",
        },
        {
            label: __("Play", "text-to-audio"),
            count: totalPlay,
            percentage: calculatePercentage(totalPlay),
            color: "#8BC34A",
        },
        {
            label: __("25%", "text-to-audio"),
            count: total25,
            percentage: calculatePercentage(total25),
            color: "#CDDC39",
        },
        {
            label: __("50%", "text-to-audio"),
            count: total50,
            percentage: calculatePercentage(total50),
            color: "#FFC107",
        },
        {
            label: __("75%", "text-to-audio"),
            count: total75,
            percentage: calculatePercentage(total75),
            color: "#FF9800",
        },
        {
            label: __("End", "text-to-audio"),
            count: totalEnd,
            percentage: calculatePercentage(totalEnd),
            color: "#FF5722",
        },
    ];

    // Demo data for non-pro users
    const demoStages = [
        { label: __("Init", "text-to-audio"), count: 18200, percentage: 100, color: "#4CAF50" },
        { label: __("Play", "text-to-audio"), count: 15800, percentage: 87, color: "#8BC34A" },
        { label: __("25%", "text-to-audio"), count: 12100, percentage: 66, color: "#CDDC39" },
        { label: __("50%", "text-to-audio"), count: 9400, percentage: 52, color: "#FFC107" },
        { label: __("75%", "text-to-audio"), count: 6800, percentage: 37, color: "#FF9800" },
        { label: __("End", "text-to-audio"), count: 4700, percentage: 26, color: "#FF5722" },
    ];

    const displayStages = isProActive ? stages : demoStages;

    const content = (
        <div className="tta_analytics_card tta_engagement_funnel_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Engagement Funnel", "text-to-audio")}</h3>
                <Form.Select
                    className="tta_date_select"
                    value={dateRange}
                    onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
                    size="sm"
                >
                    <option value="Last 7 Days">{__("Last 7 Days", "text-to-audio")}</option>
                    <option value="Last 30 Days">{__("Last 30 Days", "text-to-audio")}</option>
                    <option value="Last 90 Days">{__("Last 90 Days", "text-to-audio")}</option>
                </Form.Select>
            </div>

            <div className="tta_funnel_container">
                {displayStages.map((stage, index) => (
                    <FunnelStage
                        key={`funnel-${index}`}
                        {...stage}
                    />
                ))}
            </div>

            {/* Drop-off insights */}
            {isProActive && totalInit > 0 && (
                <div className="tta_funnel_insights">
                    <div className="tta_funnel_insight_item">
                        <span className="tta_insight_label">{__("Play Rate:", "text-to-audio")}</span>
                        <span className="tta_insight_value">
                            {calculatePercentage(totalPlay).toFixed(1)}%
                        </span>
                    </div>
                    <div className="tta_funnel_insight_item">
                        <span className="tta_insight_label">{__("Completion Rate:", "text-to-audio")}</span>
                        <span className="tta_insight_value">
                            {calculatePercentage(totalEnd).toFixed(1)}%
                        </span>
                    </div>
                    <div className="tta_funnel_insight_item">
                        <span className="tta_insight_label">{__("Biggest Drop:", "text-to-audio")}</span>
                        <span className="tta_insight_value tta_insight_warning">
                            {__("50% → 75%", "text-to-audio")}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!isProActive}
            featureName={__("Engagement Funnel", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
