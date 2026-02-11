import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";

/**
 * PlayingTrendChart Component
 * Shows playing trend over time with optional comparison mode (Pro)
 *
 * @param {Object} props
 * @param {Array} props.data - Trend data array [{ date, playCount, playTime }]
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {Array} props.previousData - Previous period data for comparison (Pro only)
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 */
export default function PlayingTrendChart({
    data = [],
    rawResults = [],
    previousData = [],
    dateRange = "Dec 02 - Dec 24, 2025",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange
}) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [showComparison, setShowComparison] = useState(false);
    const [previousTrendData, setPreviousTrendData] = useState([]);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

    // Standard date range options
    const standardDateRangeOptions = [
        { value: "Last 7 Days", label: __("Last 7 Days", "text-to-audio") },
        { value: "Last 30 Days", label: __("Last 30 Days", "text-to-audio") },
        { value: "Last 90 Days", label: __("Last 90 Days", "text-to-audio") },
        { value: "Custom", label: __("Custom Range", "text-to-audio") },
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

    /**
     * Fetch previous period trend data when comparison is enabled
     */
    const fetchPreviousPeriodData = useCallback(async () => {
        if (!isProActive || !showComparison) return;

        // Calculate previous period dates
        const now = new Date();
        let daysBack = 30;

        switch (dateRange) {
            case "Yesterday":
                daysBack = 1;
                break;
            case "Last 7 Days":
                daysBack = 7;
                break;
            case "Last 30 Days":
                daysBack = 30;
                break;
            case "Last 90 Days":
                daysBack = 90;
                break;
            default:
                daysBack = 30;
        }

        const previousToDate = new Date(now);
        previousToDate.setDate(previousToDate.getDate() - daysBack);
        const previousFromDate = new Date(previousToDate);
        previousFromDate.setDate(previousFromDate.getDate() - daysBack);

        const fromDateStr = previousFromDate.toISOString().split("T")[0];
        const toDateStr = previousToDate.toISOString().split("T")[0];

        setIsLoadingPrevious(true);

        try {
            const response = await fetch(
                `${tta_obj.api_url}tta/v1/trend_data?date_range=Custom&from_date=${fromDateStr}&to_date=${toDateStr}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                    },
                }
            );
            const result = await response.json();

            if (result.status && result.data) {
                setPreviousTrendData(result.data);
            }
        } catch (error) {
            console.error("Error fetching previous period data:", error);
        } finally {
            setIsLoadingPrevious(false);
        }
    }, [isProActive, showComparison, dateRange]);

    // Fetch previous period data when comparison is toggled on
    useEffect(() => {
        if (showComparison && isProActive) {
            fetchPreviousPeriodData();
        } else {
            setPreviousTrendData([]);
        }
    }, [showComparison, isProActive, dateRange, fetchPreviousPeriodData]);

    // Demo data
    const demoData = {
        labels: Array.from({ length: 23 }, (_, i) => `Dec ${i + 2}`),
        playingQuantity: [
            2400, 1800, 1500, 2200, 2700, 3200, 3800, 4200, 4600,
            4800, 4200, 3800, 3200, 2800, 2200, 1600, 1200, 900,
            800, 1200, 1800, 2400, 2200
        ],
        playingTime: [
            1800, 2200, 2600, 2400, 2000, 1800, 2200, 2800, 3400,
            3800, 4200, 4600, 4800, 4600, 4200, 3800, 3200, 2800,
            2600, 3200, 3800, 4400, 5000
        ],
        previousQuantity: [
            2100, 1600, 1300, 2000, 2400, 2900, 3500, 3900, 4300,
            4500, 3900, 3500, 2900, 2500, 1900, 1400, 1000, 700,
            600, 1000, 1600, 2200, 2000
        ],
    };

    // Filter and aggregate trend data based on component's date range
    const filteredTrendData = useMemo(() => {
        if (!isProActive) return null;

        // If date range matches global, use the already fetched data
        if (dateRange === globalDateRange) {
            return data;
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);

            // Group by date and aggregate
            const dateGroups = {};
            filtered.forEach((result) => {
                const dateKey = result.created_at.split(" ")[0]; // Get just the date part
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = { plays: 0, time: 0 };
                }
                const analytics = result.analytics || {};
                dateGroups[dateKey].plays += analytics.play?.count || 0;
                dateGroups[dateKey].time += analytics.time?.count || 0;
            });

            // Convert to array and sort by date
            return Object.entries(dateGroups)
                .map(([date, counts]) => ({
                    date,
                    plays: counts.plays,
                    time: counts.time,
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return data;
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, isProActive]);

    // Use filtered data or original data
    const displayTrendData = filteredTrendData || data;

    // Calculate previous period data based on fetched data or props
    const previousPeriodData = useMemo(() => {
        if (!isProActive || !showComparison) return [];

        // Use fetched previous trend data first
        if (previousTrendData && previousTrendData.length > 0) {
            return previousTrendData.map(d => d.plays || d.playCount || 0);
        }

        // If previousData is provided from parent, use it
        if (previousData && previousData.length > 0) {
            return previousData.map(d => d.plays || d.playCount || 0);
        }

        return [];
    }, [isProActive, showComparison, previousTrendData, previousData]);

    // Use real data if available, otherwise demo
    const chartData = displayTrendData.length > 0 ? {
        labels: displayTrendData.map(d => {
            // Format date for display
            const dateObj = new Date(d.date);
            return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }),
        playingQuantity: displayTrendData.map(d => d.plays || d.playCount || 0),
        playingTime: displayTrendData.map(d => Math.round((d.time || d.playTime || 0) / 60)), // Convert seconds to minutes
        previousQuantity: previousPeriodData,
    } : demoData;

    // Initialize/Update Chart
    useEffect(() => {
        if (!chartRef.current || !window.Chart) return;

        // Destroy existing chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");

        const datasets = [
            {
                label: __("Playing Quantity", "text-to-audio"),
                data: chartData.playingQuantity,
                borderColor: "#FF6B6B",
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#FF6B6B",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                fill: true,
            },
            {
                label: __("Playing Time (min)", "text-to-audio"),
                data: chartData.playingTime,
                borderColor: "#4ECDC4",
                backgroundColor: "rgba(78, 205, 196, 0.1)",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#4ECDC4",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                fill: true,
            },
        ];

        // Add comparison dataset for Pro users
        if (isProActive && showComparison && chartData.previousQuantity.length > 0) {
            datasets.push({
                label: __("Previous Period", "text-to-audio"),
                data: chartData.previousQuantity,
                borderColor: "#9E9E9E",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: "#9E9E9E",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                fill: false,
            });
        }

        chartInstanceRef.current = new window.Chart(ctx, {
            type: "line",
            data: {
                labels: chartData.labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20,
                            font: {
                                size: 13,
                                family: "'Inter', sans-serif",
                            },
                        },
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        titleColor: "#1f2937",
                        bodyColor: "#6b7280",
                        borderColor: "#e5e7eb",
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ": " + context.parsed.y.toLocaleString();
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif",
                            },
                            color: "#6b7280",
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 12,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "#f3f4f6",
                            drawBorder: false,
                        },
                        ticks: {
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif",
                            },
                            color: "#6b7280",
                            callback: function (value) {
                                if (value >= 1000) {
                                    return (value / 1000) + "K";
                                }
                                return value;
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
    }, [showComparison, displayTrendData, previousPeriodData, isProActive]);

    return (
        <div className="tta_analytics_card tta_trend_chart_card">
            <div className="tta_card_header">
                <div className="tta_chart_header_left">
                    <h3 className="tta_section_title">{__("Playing Trend Analysis", "text-to-audio")}</h3>

                    {/* Comparison toggle - Pro only */}
                    {isProActive && (
                        <div className="tta_comparison_toggle">
                            <Form.Check
                                type="checkbox"
                                id="comparison-toggle"
                                label={__("Compare with Previous Period", "text-to-audio")}
                                checked={showComparison}
                                onChange={(e) => setShowComparison(e.target.checked)}
                                className="tta_comparison_checkbox"
                            />
                        </div>
                    )}
                </div>

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

            {/* Comparison not available notice for free users */}
            {!isProActive && (
                <div className="tta_comparison_promo">
                    <span className="tta_pro_badge_small">{__("Pro", "text-to-audio")}</span>
                    <span>{__("Enable comparison with previous period", "text-to-audio")}</span>
                </div>
            )}

            <div className="tta_chart_container" style={{ height: "400px", position: "relative" }}>
                <canvas ref={chartRef} id="playingTrendChart"></canvas>
            </div>

            {/* Chart Legend Info */}
            <div className="tta_chart_legend_info">
                <div className="tta_legend_info_item">
                    <span className="tta_legend_dot" style={{ backgroundColor: "#FF6B6B" }}></span>
                    <span>{__("Quantity vs Date", "text-to-audio")}</span>
                </div>
                <div className="tta_legend_info_item">
                    <span className="tta_legend_dot" style={{ backgroundColor: "#4ECDC4" }}></span>
                    <span>{__("Playing Quantity", "text-to-audio")}</span>
                </div>
                <div className="tta_legend_info_item">
                    <span className="tta_legend_dot" style={{ backgroundColor: "#4ECDC4" }}></span>
                    <span>{__("Playing Time(min)", "text-to-audio")}</span>
                </div>
            </div>
        </div>
    );
}
