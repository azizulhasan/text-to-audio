import React, { useEffect, useRef, useState } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";

/**
 * PlayingTrendChart Component
 * Shows playing trend over time with optional comparison mode (Pro)
 *
 * @param {Object} props
 * @param {Array} props.data - Trend data array [{ date, playCount, playTime }]
 * @param {Array} props.previousData - Previous period data for comparison (Pro only)
 * @param {string} props.dateRange - Selected date range
 * @param {function} props.onDateRangeChange - Callback when date range changes
 */
export default function PlayingTrendChart({ data = [], previousData = [], dateRange = "Dec 02 - Dec 24, 2025", onDateRangeChange }) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [showComparison, setShowComparison] = useState(false);

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

    // Use real data if available, otherwise demo
    const chartData = data.length > 0 ? {
        labels: data.map(d => {
            // Format date for display
            const dateObj = new Date(d.date);
            return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }),
        playingQuantity: data.map(d => d.plays || d.playCount || 0),
        playingTime: data.map(d => Math.round((d.time || d.playTime || 0) / 60)), // Convert seconds to minutes
        previousQuantity: previousData.map(d => d.plays || d.playCount || 0),
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
    }, [showComparison, data, previousData, isProActive]);

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
                    <option value="Last 7 Days">{__("Last 7 Days", "text-to-audio")}</option>
                    <option value="Last 30 Days">{__("Last 30 Days", "text-to-audio")}</option>
                    <option value="Last 90 Days">{__("Last 90 Days", "text-to-audio")}</option>
                    <option value="Custom">{__("Custom Range", "text-to-audio")}</option>
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
