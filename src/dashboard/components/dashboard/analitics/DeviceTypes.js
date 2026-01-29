import React from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";

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
 * @param {string} props.dateRange - Selected date range
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {number} props.limit - Max items to show (3 for free, unlimited for pro)
 */
export default function DeviceTypes({ data = {}, dateRange = "Yesterday", onDateRangeChange, limit = 3 }) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // Demo data
    const demoData = {
        "Smart Phone": 18500,
        Desktop: 69200,
        Tablet: 12800,
        Phablet: 25700,
        Other: 4600,
    };

    // Use real data if pro, otherwise demo
    const displayData = isProActive && Object.keys(data).length > 0 ? data : demoData;

    // Convert to array and sort by count
    const deviceArray = Object.entries(displayData)
        .map(([name, count]) => ({
            name: name,
            count: count,
            icon: DEVICE_ICONS[name.toLowerCase().replace(/\s+/g, "")] || DEVICE_ICONS.other,
        }))
        .sort((a, b) => b.count - a.count);

    // Apply limit for free version
    const displayLimit = isProActive ? deviceArray.length : limit;
    const displayItems = deviceArray.slice(0, displayLimit);
    const hasMore = deviceArray.length > displayLimit;

    return (
        <div className="tta_analytics_card tta_device_analytics_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Device Types", "text-to-audio")}</h3>
                <Form.Select
                    className="tta_date_select"
                    value={dateRange}
                    onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
                    size="sm"
                >
                    <option value="Yesterday">{__("Yesterday", "text-to-audio")}</option>
                    <option value="Last 7 Days">{__("Last 7 Days", "text-to-audio")}</option>
                    <option value="Last 30 Days">{__("Last 30 Days", "text-to-audio")}</option>
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

                {/* Show "more" indicator for free version */}
                {hasMore && !isProActive && (
                    <div className="tta_analytics_list_more">
                        <a
                            href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tta_view_more_link"
                        >
                            +{deviceArray.length - displayLimit} {__("more", "text-to-audio")} ({__("Pro", "text-to-audio")})
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
