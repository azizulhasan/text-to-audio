import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * Browser icons mapping
 */
const BROWSER_ICONS = {
    chrome: "🌐",
    firefox: "🦊",
    safari: "🧭",
    edge: "📘",
    opera: "🔴",
    ie: "📎",
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
 * Calculate percentage
 */
const calculatePercentage = (count, total) => {
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(0);
};

/**
 * Single browser item component with progress bar
 */
const BrowserItem = ({ name, count, percentage, icon }) => (
    <div className="tta_browser_list_item">
        <div className="tta_browser_info">
            <span className="tta_browser_icon">{icon}</span>
            <span className="tta_browser_name">{name}</span>
        </div>
        <div className="tta_browser_stats">
            <span className="tta_browser_count">{formatCount(count)}</span>
            <span className="tta_browser_percentage">({percentage}%)</span>
        </div>
    </div>
);

/**
 * BrowserAnalytics Component
 * Shows browser breakdown (Pro only)
 *
 * @param {Object} props
 * @param {Object} props.data - Browser analytics data
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {function} props.aggregateFilteredData - Function to aggregate filtered data
 */
export default function BrowserAnalytics({
    data = {},
    rawResults = [],
    dateRange = "Last 7 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    aggregateFilteredData
}) {
    // TTS-247/2.2.2: browser breakdown is premium (data injected by Pro into
    // aggregated_insights). Locked behind the full-card overlay when the
    // data-driven `audience` capability is absent.
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

    // TTS-247: data-driven, no demo data. Browser breakdown is computed in the
    // free base aggregator, so it renders with the site's real data for everyone.
    const filteredData = useMemo(() => {
        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            return aggregateFilteredData(filtered, "browser");
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData]);

    // Use filtered data
    const displayData = filteredData;

    // Calculate total
    const total = Object.values(displayData).reduce((sum, val) => sum + val, 0);

    // Convert to array and sort by count
    const browserArray = Object.entries(displayData)
        .map(([name, count]) => {
            const strippedName = name.replace(/[0-9__.]/g, "");
            return {
                name: name,
                count: count,
                percentage: calculatePercentage(count, total),
                icon: BROWSER_ICONS[strippedName.toLowerCase()] || BROWSER_ICONS.other,
            }
        })
        .sort((a, b) => b.count - a.count);

    const content = (
        <div className="tta_analytics_card tta_browser_analytics_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Browser", "text-to-audio")}</h3>
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

            <div className="tta_browser_list">
                {browserArray.map((item, index) => (
                    <BrowserItem
                        key={`browser-${index}`}
                        name={item.name}
                        count={item.count}
                        percentage={item.percentage}
                        icon={item.icon}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!hasAudience}
            featureName={__("Browser", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
