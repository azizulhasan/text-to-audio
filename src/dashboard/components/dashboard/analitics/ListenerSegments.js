import React, { useEffect, useRef, useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";

/**
 * ListenerSegments Component
 * Shows New vs Returning listeners pie chart (Pro only)
 *
 * @param {Object} props
 * @param {Object} props.data - Listener segments data
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 */
export default function ListenerSegments({
    data = {},
    rawResults = [],
    dateRange = "Last 30 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange
}) {
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
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // TTS-247: data-driven, no demo data. New-vs-returning split is computed in
    // the free base aggregator, so it renders with real data for everyone.
    const filteredSegmentsData = useMemo(() => {
        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-calculate from raw results
        if (filterResultsByDateRange && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            // Calculate new vs returning users from filtered results
            const userIds = new Set();
            const newUsers = new Set();
            const returningUsers = new Set();

            filtered.forEach((result) => {
                const userId = result.user_id;
                if (!userIds.has(userId)) {
                    newUsers.add(userId);
                    userIds.add(userId);
                } else {
                    returningUsers.add(userId);
                }
            });

            return {
                new_users: newUsers.size,
                returning_users: returningUsers.size,
                avgSessions: filtered.length / (newUsers.size + returningUsers.size) || 0,
            };
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange]);

    // Use filtered data
    const displaySegmentData = filteredSegmentsData || data;

    // Extract data - API returns { new_users, returning_users }
    const newListeners = displaySegmentData.new_users || displaySegmentData.newListeners || 0;
    const returningListeners = displaySegmentData.returning_users || displaySegmentData.returningListeners || 0;
    const totalListeners = newListeners + returningListeners;

    // Calculate percentages from real data (0 when there is no data yet)
    const displayNewPercentage = totalListeners > 0 ? (newListeners / totalListeners) * 100 : 0;
    const displayReturningPercentage = totalListeners > 0 ? (returningListeners / totalListeners) * 100 : 0;

    const displayData = {
        newListeners,
        returningListeners,
        avgSessions: displaySegmentData.avgSessions || 0,
    };

    // Initialize Chart
    useEffect(() => {
        if (!chartRef.current || !window.Chart) return;

        // Destroy existing chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");

        chartInstanceRef.current = new window.Chart(ctx, {
            type: "doughnut",
            data: {
                labels: [
                    __("New Listeners", "text-to-audio"),
                    __("Returning", "text-to-audio"),
                ],
                datasets: [
                    {
                        data: [displayNewPercentage, displayReturningPercentage],
                        backgroundColor: ["#4ECDC4", "#FF6B6B"],
                        borderWidth: 0,
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "65%",
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            },
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [displayNewPercentage, displayReturningPercentage]);

    const content = (
        <div className="tta_analytics_card tta_listener_segments_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Listener Segments", "text-to-audio")}</h3>
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

            <div className="tta_segments_content">
                {/* Pie Chart */}
                <div className="tta_segments_chart_wrapper">
                    <canvas ref={chartRef} id="listenerSegmentsChart"></canvas>
                </div>

                {/* Legend */}
                <div className="tta_segments_legend">
                    <div className="tta_legend_item">
                        <span className="tta_legend_color" style={{ backgroundColor: "#4ECDC4" }}></span>
                        <span className="tta_legend_label">{__("New:", "text-to-audio")}</span>
                        <span className="tta_legend_value">{displayNewPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="tta_legend_item">
                        <span className="tta_legend_color" style={{ backgroundColor: "#FF6B6B" }}></span>
                        <span className="tta_legend_label">{__("Returning:", "text-to-audio")}</span>
                        <span className="tta_legend_value">{displayReturningPercentage.toFixed(0)}%</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="tta_segments_stats">
                    <div className="tta_segment_stat">
                        <span className="tta_segment_stat_label">{__("New Listeners:", "text-to-audio")}</span>
                        <span className="tta_segment_stat_value">
                            {displayData.newListeners.toLocaleString()}
                        </span>
                    </div>
                    <div className="tta_segment_stat">
                        <span className="tta_segment_stat_label">{__("Returning:", "text-to-audio")}</span>
                        <span className="tta_segment_stat_value">
                            {displayData.returningListeners.toLocaleString()}
                        </span>
                    </div>
                    <div className="tta_segment_stat">
                        <span className="tta_segment_stat_label">{__("Avg Sessions/User:", "text-to-audio")}</span>
                        <span className="tta_segment_stat_value">
                            {displayData.avgSessions.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return content;
}
