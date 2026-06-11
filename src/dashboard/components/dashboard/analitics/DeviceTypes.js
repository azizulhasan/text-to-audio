import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * Device icons mapping
 */
const DEVICE_ICONS = {
    smartphone: "📱",
    phone: "📱",
    mobile: "📱",
    desktop: "🖥️",
    tablet: "📱",
    phablet: "📱",
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
 * Single device item component
 */
const DeviceItem = ({ name, count, icon }) => (
    <div className="tta_analytics_list_item">
        <div className="tta_analytics_list_icon">{icon}</div>
        <span className="tta_analytics_list_name">{name}</span>
        <span className="tta_analytics_list_count">{formatCount(count)}</span>
    </div>
);

/**
 * DeviceTypes Component
 * Shows device type breakdown
 *
 * @param {Object} props
 * @param {Object} props.data - Device analytics data
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {function} props.aggregateFilteredData - Function to aggregate filtered data
 * @param {number} props.limit - Max items to show (3 for free, unlimited for pro)
 */
export default function DeviceTypes({
    data = {},
    rawResults = [],
    dateRange = "Yesterday",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    aggregateFilteredData,
    limit = 3
}) {
    // TTS-247/2.2.2: device breakdown is premium (data injected by Pro into
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

    // TTS-247: data-driven, no demo data. Device breakdown is computed in the
    // free base aggregator, so it renders with the site's real data for everyone.
    const filteredData = useMemo(() => {
        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            return aggregateFilteredData(filtered, "device");
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData]);

    // Use filtered data
    const displayData = filteredData;

    // Convert to array and sort by count
    const deviceArray = Object.entries(displayData)
        .map(([name, count]) => ({
            name: name,
            count: count,
            icon: DEVICE_ICONS[name.toLowerCase().replace(/\s+/g, "")] || DEVICE_ICONS.other,
        }))
        .sort((a, b) => b.count - a.count);

    // TTS-247: show the full real breakdown — no artificial free-tier row cap.
    const displayItems = deviceArray;

    const content = (
        <div className="tta_analytics_card tta_device_analytics_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Device Types", "text-to-audio")}</h3>
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
                    <DeviceItem
                        key={`device-${index}`}
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
            featureName={__("Device Types", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
