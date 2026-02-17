import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * Get color intensity based on value
 */
const getHeatColor = (value, max) => {
    if (max === 0) return "rgba(229, 231, 235, 1)"; // Gray for no data

    const intensity = value / max;

    if (intensity >= 0.8) return "rgba(34, 197, 94, 1)";    // Peak - Green
    if (intensity >= 0.6) return "rgba(132, 204, 22, 1)";   // High - Light Green
    if (intensity >= 0.4) return "rgba(250, 204, 21, 1)";   // Medium - Yellow
    if (intensity >= 0.2) return "rgba(251, 146, 60, 1)";   // Low-Medium - Orange
    return "rgba(229, 231, 235, 1)";                         // Low - Gray
};

/**
 * PeakHoursHeatmap Component
 * Shows listening activity by day/hour (Pro only)
 *
 * @param {Object} props
 * @param {Object} props.data - Heatmap data { Monday: [...], Tuesday: [...], ... }
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 */
export default function PeakHoursHeatmap({
    data = {},
    rawResults = [],
    dateRange = "Last 7 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange
}) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // Standard date range options
    const standardDateRangeOptions = [
        { value: "Last 7 Days", label: __("Last 7 Days", "text-to-audio") },
        { value: "Last 30 Days", label: __("Last 30 Days", "text-to-audio") },
        { value: "Last 90 Days", label: __("Last 90 Days", "text-to-audio") },
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

    // Day names matching the API response
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const days = [
        __("Mon", "text-to-audio"),
        __("Tue", "text-to-audio"),
        __("Wed", "text-to-audio"),
        __("Thu", "text-to-audio"),
        __("Fri", "text-to-audio"),
        __("Sat", "text-to-audio"),
        __("Sun", "text-to-audio"),
    ];

    // Hour ranges to display (we'll map 24 hours to 7 slots)
    const hours = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM"];
    const hourMapping = [6, 9, 12, 15, 18, 21, 0]; // Map display slots to actual hours

    // Demo data - 7 days x 7 time slots
    const demoData = [
        [120, 180, 350, 420, 520, 180, 90],   // Mon
        [100, 200, 380, 580, 600, 320, 110],  // Tue
        [90, 280, 520, 480, 420, 350, 150],   // Wed
        [110, 260, 450, 380, 550, 380, 180],  // Thu
        [80, 190, 320, 520, 400, 620, 280],   // Fri
        [200, 350, 280, 220, 380, 580, 320],  // Sat
        [180, 380, 240, 180, 350, 620, 350],  // Sun
    ];

    // Filter and aggregate heatmap data based on component's date range
    const filteredHeatmapData = useMemo(() => {
        if (!isProActive) return null;

        // If date range matches global, use the already fetched data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);

            // Build heatmap data from filtered results
            const heatmap = {};
            dayNames.forEach((day) => {
                heatmap[day] = Array(24).fill(0);
            });

            filtered.forEach((result) => {
                const createdAt = new Date(result.created_at);
                const dayIndex = createdAt.getDay(); // 0 = Sunday, 1 = Monday, etc.
                // Convert to Monday-first (0 = Monday, 6 = Sunday)
                const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                const dayName = dayNames[adjustedDayIndex];
                const hour = createdAt.getHours();
                const analytics = result.analytics || {};
                heatmap[dayName][hour] += analytics.play?.count || 1;
            });

            return heatmap;
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, isProActive, dayNames]);

    // Use filtered data
    const displayHeatmapData = filteredHeatmapData || data;

    // Transform API data to display format
    const transformApiData = () => {
        if (!displayHeatmapData || Object.keys(displayHeatmapData).length === 0) return demoData;

        return dayNames.map((dayName) => {
            const dayData = displayHeatmapData[dayName] || Array(24).fill(0);
            // Aggregate hours into 7 time slots
            return hourMapping.map((startHour, idx) => {
                // Sum 3 hours for each slot
                const endHour = hourMapping[idx + 1] || 24;
                let sum = 0;
                for (let h = startHour; h < (idx === 6 ? startHour + 6 : endHour); h++) {
                    sum += dayData[h % 24] || 0;
                }
                return sum;
            });
        });
    };

    const displayData = isProActive && Object.keys(displayHeatmapData).length > 0 ? transformApiData() : demoData;

    // Find max value for color scaling
    const maxValue = Math.max(...displayData.flat());

    // Find peak time
    let peakDay = 0;
    let peakHour = 0;
    let peakValue = 0;

    displayData.forEach((dayData, dayIndex) => {
        dayData.forEach((value, hourIndex) => {
            if (value > peakValue) {
                peakValue = value;
                peakDay = dayIndex;
                peakHour = hourIndex;
            }
        });
    });

    const content = (
        <div className="tta_analytics_card tta_heatmap_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Peak Listening Hours", "text-to-audio")}</h3>
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

            <div className="tta_heatmap_container">
                {/* Day labels */}
                <div className="tta_heatmap_row tta_heatmap_header">
                    <div className="tta_heatmap_label"></div>
                    {days.map((day, index) => (
                        <div key={`day-${index}`} className="tta_heatmap_day_label">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                {hours.map((hour, hourIndex) => (
                    <div key={`hour-${hourIndex}`} className="tta_heatmap_row">
                        <div className="tta_heatmap_label tta_heatmap_hour_label">
                            {hour}
                        </div>
                        {displayData.map((dayData, dayIndex) => (
                            <div
                                key={`cell-${dayIndex}-${hourIndex}`}
                                className="tta_heatmap_cell"
                                style={{
                                    backgroundColor: getHeatColor(dayData[hourIndex], maxValue),
                                }}
                                title={`${days[dayIndex]} ${hour}: ${dayData[hourIndex]} plays`}
                            >
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="tta_heatmap_legend">
                <span className="tta_heatmap_legend_label">{__("Low", "text-to-audio")}</span>
                <div className="tta_heatmap_legend_scale">
                    <div className="tta_heatmap_legend_color" style={{ backgroundColor: "rgba(229, 231, 235, 1)" }}></div>
                    <div className="tta_heatmap_legend_color" style={{ backgroundColor: "rgba(251, 146, 60, 1)" }}></div>
                    <div className="tta_heatmap_legend_color" style={{ backgroundColor: "rgba(250, 204, 21, 1)" }}></div>
                    <div className="tta_heatmap_legend_color" style={{ backgroundColor: "rgba(132, 204, 22, 1)" }}></div>
                    <div className="tta_heatmap_legend_color" style={{ backgroundColor: "rgba(34, 197, 94, 1)" }}></div>
                </div>
                <span className="tta_heatmap_legend_label">{__("Peak", "text-to-audio")}</span>
            </div>

            {/* Insight */}
            <div className="tta_heatmap_insight">
                <span className="tta_insight_icon">💡</span>
                <span className="tta_insight_text">
                    {__("Insight:", "text-to-audio")} {__("Your peak listening time is", "text-to-audio")} <strong>{days[peakDay]} {hours[peakHour]}</strong>
                </span>
            </div>
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!isProActive}
            featureName={__("Peak Hours Heatmap", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
