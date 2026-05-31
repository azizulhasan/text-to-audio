import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * OS icons mapping
 */
const OS_ICONS = {
    android: "🤖",
    windows: "🪟",
    ios: "🍎",
    mac: "🍏",
    linux: "🐧",
    other: "❓",
};

/**
 * Format count with K/M suffix
 */
const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
};

/**
 * Single OS item component
 */
const OSItem = ({ name, count, icon }) => (
    <div className="tta_analytics_list_item">
        <div className="tta_analytics_list_icon">{icon}</div>
        <span className="tta_analytics_list_name">{name}</span>
        <span className="tta_analytics_list_count">{formatCount(count)}</span>
    </div>
);

/**
 * OSAnalytics Component
 * Shows operating system breakdown
 *
 * @param {Object} props
 * @param {Object} props.data - OS analytics data { android: 100, windows: 200, ... }
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {function} props.aggregateFilteredData - Function to aggregate filtered data
 * @param {number} props.limit - Max items to show (3 for free, unlimited for pro)
 */
export default function OSAnalytics({
    data = {},
    rawResults = [],
    dateRange = "Last 7 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    aggregateFilteredData,
    limit = 3
}) {
    // TTS-247/2.2.2: the OS breakdown is a premium feature whose data is
    // injected by Pro into aggregated_insights. Driven by the data-driven
    // `audience` capability flag (not is_atlasvoice_addon_functional). When absent, the whole
    // card is locked behind the "Upgrade to Pro" overlay (same as Heatmap).
    const capabilities = (typeof ttsObj !== "undefined" && ttsObj.capabilities) || {};
    const hasAudience = !!capabilities.audience;

    // Standard date range options
    const standardDateRangeOptions = [
        { value: "Yesterday", label: __("Yesterday", "text-to-audio") },
        { value: "Last 7 Days", label: __("Last 7 Days", "text-to-audio") },
        { value: "Last 30 Days", label: __("Last 30 Days", "text-to-audio") },
    ];

    // Build dropdown options dynamically - add globalDateRange if not in standard options
    const dateRangeOptions = useMemo(() => {
        const options = [...standardDateRangeOptions];
        const globalOptionExists = standardDateRangeOptions.some(
            (option) => option.value === globalDateRange
        );
        if (!globalOptionExists && globalDateRange) {
            options.unshift({ value: globalDateRange, label: globalDateRange });
        }
        return options;
    }, [globalDateRange]);

    // TTS-247: data-driven, no demo data. OS breakdown is computed in the free
    // base aggregator, so it renders with the site's real data for everyone.
    const filteredData = useMemo(() => {
        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            return aggregateFilteredData(filtered, "os");
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData]);

    // Use filtered data
    const displayData = filteredData;

    // Convert to array and sort by count
    const osArray = Object.entries(displayData)
        .map(([name, count]) => {
            const strippedName = name.replace(/[0-9__. ]/g, "");
            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                count: count,
                icon: OS_ICONS[strippedName.toLowerCase()] || OS_ICONS.other,
            }
        })
        .sort((a, b) => b.count - a.count);

    // TTS-247: show the full real breakdown — no artificial free-tier row cap.
    const displayItems = osArray;

    const content = (
        <div className="tta_analytics_card tta_os_analytics_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("OS", "text-to-audio")}</h3>
                <Form.Select
                    className="tta_date_select"
                    value={dateRange}
                    onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
                    size="sm"
                >
                    {dateRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
            </div>

            <div className="tta_analytics_list">
                {displayItems.map((item, index) => (
                    <OSItem
                        key={`os-${index}`}
                        name={item.name}
                        count={item.count}
                        icon={item.icon}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!hasAudience}
            featureName={__("OS Breakdown", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
