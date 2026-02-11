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
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

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

    // Demo data
    const demoData = {
        android: 18500,
        windows: 69200,
        ios: 12800,
        mac: 25700,
        other: 4600,
    };

    // Filter and aggregate data based on component's date range
    const filteredData = useMemo(() => {
        if (!isProActive) return demoData;

        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return Object.keys(data).length > 0 ? data : demoData;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            const aggregated = aggregateFilteredData(filtered, "os");
            return Object.keys(aggregated).length > 0 ? aggregated : demoData;
        }

        return Object.keys(data).length > 0 ? data : demoData;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData, isProActive]);

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

    // Apply limit for free version
    const displayLimit = isProActive ? osArray.length : limit;
    const displayItems = osArray.slice(0, displayLimit);
    const hasMore = osArray.length > displayLimit;

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

                {/* Show "more" indicator for free version */}
                {hasMore && !isProActive && (
                    <div className="tta_analytics_list_more">
                        <a
                            href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tta_view_more_link"
                        >
                            +{osArray.length - displayLimit} {__("more", "text-to-audio")} ({__("Pro", "text-to-audio")})
                        </a>
                    </div>
                )}
            </div>
        </div>
    );

    // No overlay needed for this component, but show limited data for free
    return content;
}
