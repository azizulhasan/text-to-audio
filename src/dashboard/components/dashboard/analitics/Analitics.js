import React, { useEffect, useState, useCallback } from "react";
import {
    Button,
    Col,
    Container,
    Form,
    Row,
} from "react-bootstrap";
import UpgradeToPro from "../../UpgradeToPro";
import { postWithoutImage } from "../../context/utilities";
import { __ } from "@wordpress/i18n";
import toast from "../../context/Notify";

// Import all analytics components
import {
    SummaryCards,
    EngagementFunnel,
    ListenerSegments,
    OSAnalytics,
    DeviceTypes,
    BrowserAnalytics,
    LocationAnalytics,
    PlayingTrendChart,
    PeakHoursHeatmap,
    TrackPostIds,
    PopularPosts,
    ExportSection,
    GlobalDateRangePicker,
} from "./index";

export default function Analytics() {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // State
    const [analytics, setAnalytics] = useState({
        tts_enable_analytics: false,
        tts_trackable_post_ids: [],
    });
    const [postIds, setPostIds] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [summary, setSummary] = useState({});
    const [mostPopularPosts, setMostPopularPosts] = useState([]);
    const [popularPostsIds, setPopularPostsIds] = useState([]);
    const [rawAnalyticsData, setRawAnalyticsData] = useState([]);

    // Aggregated data from API
    const [aggregatedData, setAggregatedData] = useState(null);
    const [previousPeriodData, setPreviousPeriodData] = useState(null);
    const [isAggregatedLoading, setIsAggregatedLoading] = useState(false);

    // Raw results for client-side filtering
    const [rawResults, setRawResults] = useState([]);

    // Global date range state
    const [globalDateRange, setGlobalDateRange] = useState("Last 30 Days");
    const [globalFromDate, setGlobalFromDate] = useState(null);
    const [globalToDate, setGlobalToDate] = useState(null);

    // Date range states for different sections (synced with global by default)
    const [summaryDateRange, setSummaryDateRange] = useState("Last 30 Days");
    const [osDateRange, setOsDateRange] = useState("Last 30 Days");
    const [deviceDateRange, setDeviceDateRange] = useState("Last 30 Days");
    const [browserDateRange, setBrowserDateRange] = useState("Last 30 Days");
    const [locationDateRange, setLocationDateRange] = useState("Last 30 Days");
    const [funnelDateRange, setFunnelDateRange] = useState("Last 30 Days");
    const [segmentsDateRange, setSegmentsDateRange] = useState("Last 30 Days");
    const [trendDateRange, setTrendDateRange] = useState("Last 30 Days");
    const [heatmapDateRange, setHeatmapDateRange] = useState("Last 30 Days");
    const [popularDateRange, setPopularDateRange] = useState("Last 30 Days");

    // Processed analytics data
    const [osData, setOsData] = useState({});
    const [deviceData, setDeviceData] = useState({});
    const [browserData, setBrowserData] = useState({});
    const [locationData, setLocationData] = useState({ countries: {}, cities: {} });
    const [funnelData, setFunnelData] = useState({});
    const [segmentsData, setSegmentsData] = useState({});
    const [trendData, setTrendData] = useState([]);
    const [heatmapData, setHeatmapData] = useState({});

    /**
     * Filter raw results by date range (client-side)
     * @param {Array} results - Raw analytics results
     * @param {string} dateRange - Date range preset (Yesterday, Last 7 Days, etc.)
     * @returns {Array} Filtered results
     */
    const filterResultsByDateRange = useCallback((results, dateRange) => {
        if (!results || results.length === 0) return [];

        const now = new Date();
        let fromDate = null;
        let toDate = new Date(now);

        switch (dateRange) {
            case "Yesterday":
                fromDate = new Date(now);
                fromDate.setDate(fromDate.getDate() - 1);
                fromDate.setHours(0, 0, 0, 0);
                toDate = new Date(fromDate);
                toDate.setHours(23, 59, 59, 999);
                break;
            case "Last 7 Days":
                fromDate = new Date(now);
                fromDate.setDate(fromDate.getDate() - 7);
                fromDate.setHours(0, 0, 0, 0);
                break;
            case "Last 30 Days":
                fromDate = new Date(now);
                fromDate.setDate(fromDate.getDate() - 30);
                fromDate.setHours(0, 0, 0, 0);
                break;
            case "Last 90 Days":
                fromDate = new Date(now);
                fromDate.setDate(fromDate.getDate() - 90);
                fromDate.setHours(0, 0, 0, 0);
                break;
            default:
                // Default to all data (Last 30 Days)
                fromDate = new Date(now);
                fromDate.setDate(fromDate.getDate() - 30);
                fromDate.setHours(0, 0, 0, 0);
        }

        return results.filter((result) => {
            const createdAt = new Date(result.created_at);
            return createdAt >= fromDate && createdAt <= toDate;
        });
    }, []);

    /**
     * Re-aggregate filtered results for a specific data type
     * @param {Array} filteredResults - Filtered raw results
     * @param {string} dataType - Type of data to aggregate (os, device, browser, country, city, funnel, segments)
     * @returns {Object} Aggregated data
     */
    const aggregateFilteredData = useCallback((filteredResults, dataType) => {
        const aggregated = {};

        filteredResults.forEach((result) => {
            const analytics = result.analytics || {};

            switch (dataType) {
                case "os":
                    if (analytics.platform) {
                        const value = analytics.platform.value || analytics.platform;
                        aggregated[value] = (aggregated[value] || 0) + 1;
                    }
                    break;
                case "device":
                    if (analytics.deviceType) {
                        const value = analytics.deviceType.value || analytics.deviceType;
                        aggregated[value] = (aggregated[value] || 0) + 1;
                    }
                    break;
                case "browser":
                    if (analytics.browser) {
                        const value = analytics.browser.value || analytics.browser;
                        aggregated[value] = (aggregated[value] || 0) + 1;
                    }
                    break;
                case "country":
                    if (analytics.country) {
                        const value = analytics.country.value || analytics.country;
                        aggregated[value] = (aggregated[value] || 0) + 1;
                    }
                    break;
                case "city":
                    if (analytics.city) {
                        const value = analytics.city.value || analytics.city;
                        aggregated[value] = (aggregated[value] || 0) + 1;
                    }
                    break;
                case "funnel":
                    ["init", "play", "25_percent", "50_percent", "75_percent", "end"].forEach((key) => {
                        if (analytics[key]) {
                            aggregated[key] = (aggregated[key] || 0) + (analytics[key].count || 0);
                        }
                    });
                    break;
                case "segments":
                    // Track unique vs returning users based on visit patterns
                    // This is simplified - real implementation would need user tracking
                    break;
                default:
                    break;
            }
        });

        return aggregated;
    }, []);

    /**
     * Get filtered and aggregated data for a component
     * @param {string} dataType - Type of data
     * @param {string} dateRange - Date range for filtering
     * @returns {Object} Filtered and aggregated data
     */
    const getFilteredData = useCallback((dataType, dateRange) => {
        if (dateRange === globalDateRange) {
            // Use already aggregated data if date range matches global
            switch (dataType) {
                case "os":
                    return osData;
                case "device":
                    return deviceData;
                case "browser":
                    return browserData;
                case "country":
                    return locationData.countries;
                case "city":
                    return locationData.cities;
                case "funnel":
                    return funnelData;
                case "segments":
                    return segmentsData;
                default:
                    return {};
            }
        }

        // Filter and re-aggregate for different date range
        const filteredResults = filterResultsByDateRange(rawResults, dateRange);
        return aggregateFilteredData(filteredResults, dataType);
    }, [globalDateRange, rawResults, osData, deviceData, browserData, locationData, funnelData, segmentsData, filterResultsByDateRange, aggregateFilteredData]);

    /**
     * Format time from seconds to readable string
     */
    function getTotalTime(totalSeconds) {
        let output = totalSeconds / 60;
        let summeryString = " Minute";

        if (output > 1) {
            summeryString = " Minutes";
        }

        if (output > 60) {
            summeryString = " Hour";
            output = output / 60;
            if (output > 1) {
                summeryString = " Hours";
            }
        }

        output = output.toFixed(2);
        output += summeryString;
        return output;
    }

    /**
     * Summarize analytics data
     */
    function summarizeAnalytics(data) {
        const summaryObj = {
            totalPosts: data.length,
            totalCounts: {
                init: 0,
                play: 0,
                time: 0,
                pause: 0,
                download: 0,
                end: 0,
            },
            totalInteractions: 0,
        };

        data.forEach((entry) => {
            const events = entry.analytics;
            for (const event in events) {
                if (summaryObj.totalCounts.hasOwnProperty(event)) {
                    summaryObj.totalCounts[event] += events[event].count || 0;
                }
            }
        });

        summaryObj.totalCounts.time = getTotalTime(summaryObj.totalCounts.time);
        const totalCounts = Object.values(summaryObj.totalCounts);
        summaryObj.totalInteractions = totalCounts.reduce((acc, val, currentIndex) => {
            if (currentIndex === 2) return acc; // Skip time
            if (typeof val === "string") return acc;
            return acc + val;
        }, 0);

        return summaryObj;
    }

    /**
     * Fetch aggregated insights from API
     */
    const fetchAggregatedInsights = useCallback(async (dateRange = "Last 30 Days", fromDate = null, toDate = null) => {
        setIsAggregatedLoading(true);
        try {
            let url = `${tta_obj.api_url}tta/v1/aggregated_insights?date_range=${encodeURIComponent(dateRange)}`;

            // Add custom dates if provided
            if (dateRange === "Custom" && fromDate && toDate) {
                url += `&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                },
            });
            const result = await response.json();

            if (result.status && result.data) {
                setAggregatedData(result.data);
                setPreviousPeriodData(result.previous);

                // Store raw results for client-side filtering
                if (result.raw_results) {
                    setRawResults(result.raw_results);
                }

                // Update individual state from aggregated data
                setOsData(result.data.os || {});
                setDeviceData(result.data.device || {});
                setBrowserData(result.data.browser || {});
                setLocationData({
                    countries: result.data.country || {},
                    cities: result.data.city || {},
                });
                setFunnelData({
                    init: result.data.summary?.total_init || 0,
                    play: result.data.summary?.total_play || 0,
                    "25_percent": result.data.summary?.total_25_percent || 0,
                    "50_percent": result.data.summary?.total_50_percent || 0,
                    "75_percent": result.data.summary?.total_75_percent || 0,
                    end: result.data.summary?.total_end || 0,
                });
                setSegmentsData(result.data.segments || {});

                // Update summary
                if (result.data.summary) {
                    const summaryData = {
                        totalPosts: result.data.summary.total_posts,
                        totalCounts: {
                            init: result.data.summary.total_init,
                            play: result.data.summary.total_play,
                            time: getTotalTime(result.data.summary.total_time),
                            pause: result.data.summary.total_pause,
                            download: result.data.summary.total_download,
                            end: result.data.summary.total_end,
                        },
                        totalInteractions: result.data.summary.total_interactions,
                    };
                    setSummary(summaryData);
                }

                // Update popular posts
                if (result.data.posts) {
                    const posts = Object.values(result.data.posts).map((post) => ({
                        post_id: post.post_id,
                        title: post.title,
                        totalScore: post.interactions,
                    }));
                    setMostPopularPosts(posts);
                }
            }
        } catch (error) {
            console.error("Error fetching aggregated insights:", error);
        } finally {
            setIsAggregatedLoading(false);
        }
    }, []);

    /**
     * Fetch trend data for charts
     */
    const fetchTrendData = useCallback(async (dateRange = "Last 30 Days", fromDate = null, toDate = null) => {
        try {
            let url = `${tta_obj.api_url}tta/v1/trend_data?date_range=${encodeURIComponent(dateRange)}`;

            // Add custom dates if provided
            if (dateRange === "Custom" && fromDate && toDate) {
                url += `&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                },
            });
            const result = await response.json();

            if (result.status && result.data) {
                setTrendData(result.data);
            }
        } catch (error) {
            console.error("Error fetching trend data:", error);
        }
    }, []);

    /**
     * Fetch heatmap data (Pro only)
     */
    const fetchHeatmapData = useCallback(async (dateRange = "Last 30 Days", fromDate = null, toDate = null) => {
        if (!isProActive) return;

        try {
            let url = `${tta_obj.api_url}tta/v1/heatmap_data?date_range=${encodeURIComponent(dateRange)}`;

            // Add custom dates if provided
            if (dateRange === "Custom" && fromDate && toDate) {
                url += `&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                },
            });
            const result = await response.json();

            if (result.status && result.data) {
                setHeatmapData(result.data);
            }
        } catch (error) {
            console.error("Error fetching heatmap data:", error);
        }
    }, [isProActive]);

    /**
     * Export analytics as CSV (Pro only)
     */
    const handleExportCSV = useCallback(async (dateRange = "Last 999 Days") => {
        if (!isProActive) return;
        if(globalDateRange){
            dateRange = globalDateRange;
        }

        try {
            const response = await fetch(
                `${tta_obj.api_url}tta/v1/export_csv?date_range=${encodeURIComponent(dateRange)}`,
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
                // Decode base64 and trigger download
                const csvContent = atob(result.data);
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", result.filename || "analytics.csv");
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast(__("CSV exported successfully!", "text-to-audio"), "success");
            }
        } catch (error) {
            console.error("Error exporting CSV:", error);
            toast(__("Error exporting CSV", "text-to-audio"), "error");
        }
    }, [isProActive]);

    /**
     * Export analytics as PDF (Pro only)
     */
    const handleExportPDF = useCallback(async (dateRange = "Last 999 Days") => {
        if (!isProActive) return;
        if (globalDateRange) {
            dateRange = globalDateRange;
        }

        try {
            let url = `${tta_obj.api_url}tta/v1/export_pdf?date_range=${encodeURIComponent(dateRange)}`;

            // Add custom dates if provided
            if (dateRange === "Custom" && globalFromDate && globalToDate) {
                url += `&from_date=${encodeURIComponent(globalFromDate)}&to_date=${encodeURIComponent(globalToDate)}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                },
            });
            const result = await response.json();

            if (result.status && result.data) {
                // Decode base64 HTML content
                const htmlContent = atob(result.data);

                // Create a new window for printing as PDF
                const printWindow = window.open("", "_blank", "width=800,height=600");

                if (printWindow) {
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();

                    // Wait for content to load then trigger print dialog
                    printWindow.onload = function () {
                        setTimeout(() => {
                            printWindow.print();
                            // Note: User can save as PDF from print dialog
                        }, 250);
                    };

                    toast(__("PDF report opened. Use 'Save as PDF' in the print dialog.", "text-to-audio"), "success");
                } else {
                    // Fallback: download as HTML if popup is blocked
                    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
                    const link = document.createElement("a");
                    const blobUrl = URL.createObjectURL(blob);
                    link.setAttribute("href", blobUrl);
                    link.setAttribute("download", result.filename?.replace(".pdf", ".html") || "analytics-report.html");
                    link.style.visibility = "hidden";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);

                    toast(__("Report downloaded as HTML. Open in browser and print to save as PDF.", "text-to-audio"), "info");
                }
            } else {
                toast(result.message || __("Failed to generate PDF report.", "text-to-audio"), "error");
            }
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast(__("Error exporting PDF", "text-to-audio"), "error");
        }
    }, [isProActive, globalDateRange, globalFromDate, globalToDate]);


    /**
     * Process analytics data for various charts (fallback for old data)
     */
    function processAnalyticsData(data) {
        const os = {};
        const device = {};
        const browser = {};
        const countries = {};
        const cities = {};
        const funnel = { init: 0, play: 0, "25_percent": 0, "50_percent": 0, "75_percent": 0, end: 0 };

        data.forEach((entry) => {
            const analytics = entry.analytics || {};

            // Process OS data
            if (analytics.platform) {
                const platform = analytics.platform.value || analytics.platform;
                os[platform] = (os[platform] || 0) + 1;
            }

            // Process device data
            if (analytics.deviceType) {
                const deviceType = analytics.deviceType.value || analytics.deviceType;
                device[deviceType] = (device[deviceType] || 0) + 1;
            }

            // Process browser data
            if (analytics.browser) {
                const browserName = analytics.browser.value || analytics.browser;
                browser[browserName] = (browser[browserName] || 0) + 1;
            }

            // Process country data
            if (analytics.country) {
                const country = analytics.country.value || analytics.country;
                countries[country] = (countries[country] || 0) + 1;
            }

            // Process city data
            if (analytics.city) {
                const city = analytics.city.value || analytics.city;
                cities[city] = (cities[city] || 0) + 1;
            }

            // Process funnel data
            Object.keys(funnel).forEach((key) => {
                if (analytics[key]) {
                    funnel[key] += analytics[key].count || 0;
                }
            });
        });

        setOsData(os);
        setDeviceData(device);
        setBrowserData(browser);
        setLocationData({ countries, cities });
        setFunnelData(funnel);
    }

    /**
     * Get popular posts from analytics data
     */
    function getPopularPosts(data) {
        const uniquePosts = data.reduce((acc, post) => {
            const existing = acc.find((p) => p.post_id === post.post_id);
            if (!existing) {
                acc.push(post);
            }
            return acc;
        }, []);

        return uniquePosts
            .map((post) => {
                const { post_id, analytics } = post;
                const totalScore = Object.values(analytics).reduce((sum, event) => {
                    if (event?.count) {
                        return sum + event.count;
                    }
                    return sum;
                }, 0);
                return { post_id, totalScore };
            })
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, isProActive ? 50 : 10);
    }

    // Load initial data
    useEffect(() => {
        let formData = new FormData();
        formData.append("method", "get");
        postWithoutImage(tta_obj.api_url + "tta/v1/latest_posts", formData).then(
            (res) => {
                setPostIds(res.data);
            }
        );

        // Fetch aggregated insights from new API endpoint
        fetchAggregatedInsights(globalDateRange, globalFromDate, globalToDate);

        // Fetch trend data
        fetchTrendData(globalDateRange, globalFromDate, globalToDate);

        // Fetch heatmap data (Pro only)
        if (isProActive) {
            fetchHeatmapData(globalDateRange, globalFromDate, globalToDate);
        }
    }, [fetchAggregatedInsights, fetchTrendData, fetchHeatmapData, isProActive]);

    // Refetch data when global date range changes
    useEffect(() => {
        if (analytics.tts_enable_analytics) {
            fetchAggregatedInsights(globalDateRange, globalFromDate, globalToDate);
        }
    }, [globalDateRange, globalFromDate, globalToDate, analytics.tts_enable_analytics, fetchAggregatedInsights]);

    useEffect(() => {
        if (analytics.tts_enable_analytics) {
            fetchTrendData(globalDateRange, globalFromDate, globalToDate);
        }
    }, [globalDateRange, globalFromDate, globalToDate, analytics.tts_enable_analytics, fetchTrendData]);

    useEffect(() => {
        if (analytics.tts_enable_analytics && isProActive) {
            fetchHeatmapData(globalDateRange, globalFromDate, globalToDate);
        }
    }, [globalDateRange, globalFromDate, globalToDate, analytics.tts_enable_analytics, isProActive, fetchHeatmapData]);

    // Load analytics settings
    useEffect(() => {
        if (Object.keys(postIds).length) {
            let formData = new FormData();
            formData.append("method", "get");
            postWithoutImage(
                tta_obj.api_url + "tta/v1/get_analytics_settings",
                formData
            )
                .then((res) => {
                    setAnalytics({
                        ...analytics,
                        ...res.data,
                    });
                    setSelectedIds(res.data.tts_trackable_post_ids || []);
                    setIsDataLoaded(true);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [postIds]);

    // Handlers
    const handleSelectionChange = (newSelectedIds) => {
        setSelectedIds(newSelectedIds);
    };

    const handleChange = (e) => {
        let value = "";
        if (e.target.getAttribute("type") === "checkbox") {
            value = e.target.checked;
        }

        if (!e.target.name) return;

        setAnalytics({
            ...analytics,
            [e.target.name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedAnalytics = {
            ...analytics,
            tts_trackable_post_ids: selectedIds,
        };

        let formData = new FormData();
        formData.append("analytics", JSON.stringify(updatedAnalytics));
        formData.append("method", "post");
        postWithoutImage(
            tta_obj.api_url + "tta/v1/save_analytics_settings",
            formData
        )
            .then((res) => {
                if (res?.data) {
                    setAnalytics({
                        ...analytics,
                        ...res.data,
                    });
                }
                toast(__("Successfully Saved.", "text-to-audio"), "info", {
                    autoClose: 2500,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    // Custom Toggle Switch Component
    const ToggleSwitch = ({ checked, onChange, name, id, disabled }) => (
        <label className={`custom-switch ${disabled ? "switch-disabled" : ""}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                name={name}
                id={id}
                disabled={disabled}
            />
            <span className="switch-track">
                <span className="switch-thumb"></span>
            </span>
        </label>
    );

    /**
     * Handle global date range change
     * This updates the global date range and triggers data fetching for all components
     */
    const handleGlobalDateRangeChange = useCallback(({ dateRange, fromDate, toDate }) => {
        setGlobalDateRange(dateRange);
        setGlobalFromDate(fromDate);
        setGlobalToDate(toDate);

        // Update all component date ranges to sync with global
        setSummaryDateRange(dateRange);
        setOsDateRange(dateRange);
        setDeviceDateRange(dateRange);
        setBrowserDateRange(dateRange);
        setLocationDateRange(dateRange);
        setFunnelDateRange(dateRange);
        setSegmentsDateRange(dateRange);
        setTrendDateRange(dateRange);
        setHeatmapDateRange(dateRange);
        setPopularDateRange(dateRange);

        // Fetch all data with new date range
        if (analytics.tts_enable_analytics) {
            fetchAggregatedInsights(dateRange, fromDate, toDate);
            fetchTrendData(dateRange, fromDate, toDate);
            if (isProActive) {
                fetchHeatmapData(dateRange, fromDate, toDate);
            }
        }
    }, [analytics.tts_enable_analytics, isProActive, fetchAggregatedInsights, fetchTrendData, fetchHeatmapData]);

    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid>
                <Row>
                    <Col xs={12} lg={8}>
                        {/* Analytics Header Card */}
                        <div className="tta_analytics_header_card">
                            <div className="tta_analytics_header_content">
                                <div className="tta_analytics_header_left">
                                    <h2 className="tta_analytics_title">{__("Analytics", "text-to-audio")}</h2>
                                    <ToggleSwitch
                                        checked={analytics.tts_enable_analytics}
                                        onChange={handleChange}
                                        name="tts_enable_analytics"
                                        id="tts_enable_analytics"
                                    />
                                </div>
                                <div className="tta_analytics_header_right">
                                    {/* Export buttons - visible only for Pro */}
                                    {isProActive && analytics.tts_enable_analytics && (
                                        <ExportSection
                                            onExportCSV={handleExportCSV}
                                            onExportPDF={handleExportPDF}
                                            dateRange={globalDateRange}
                                            fromDate={globalFromDate}
                                            toDate={globalToDate}
                                        />
                                    )}
                                    <GlobalDateRangePicker
                                        dateRange={globalDateRange}
                                        fromDate={globalFromDate}
                                        toDate={globalToDate}
                                        onDateRangeChange={handleGlobalDateRangeChange}
                                    />
                                </div>
                            </div>
                            <p className="tta_analytics_subtitle">
                                {__("Track and analyze your TTS player engagement to understand listener behavior.", "text-to-audio")}
                            </p>
                        </div>

                        {/* Show content only when analytics is enabled */}
                        {analytics.tts_enable_analytics ? (
                            <Form onSubmit={handleSubmit}>
                                {/* Summary Cards */}
                                {Object.keys(summary).length > 0 && (
                                    <SummaryCards
                                        summary={summary}
                                        previousSummary={previousPeriodData?.summary}
                                        dateRange={summaryDateRange}
                                        onDateRangeChange={setSummaryDateRange}
                                        isLoading={isAggregatedLoading}
                                    />
                                )}

                                {/* Engagement Funnel & Listener Segments Row */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12} md={6}>
                                        <EngagementFunnel
                                            data={funnelData}
                                            rawResults={rawResults}
                                            dateRange={funnelDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setFunnelDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            aggregateFilteredData={aggregateFilteredData}
                                        />
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <ListenerSegments
                                            data={segmentsData}
                                            rawResults={rawResults}
                                            dateRange={segmentsDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setSegmentsDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                        />
                                    </Col>
                                </Row>

                                {/* OS, Device Types, Browser Row */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12} md={4}>
                                        <OSAnalytics
                                            data={osData}
                                            rawResults={rawResults}
                                            dateRange={osDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setOsDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            aggregateFilteredData={aggregateFilteredData}
                                            limit={3}
                                        />
                                    </Col>
                                    <Col xs={12} md={4}>
                                        <DeviceTypes
                                            data={deviceData}
                                            rawResults={rawResults}
                                            dateRange={deviceDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setDeviceDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            aggregateFilteredData={aggregateFilteredData}
                                            limit={3}
                                        />
                                    </Col>
                                    <Col xs={12} md={4}>
                                        <BrowserAnalytics
                                            data={browserData}
                                            rawResults={rawResults}
                                            dateRange={browserDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setBrowserDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            aggregateFilteredData={aggregateFilteredData}
                                        />
                                    </Col>
                                </Row>

                                {/* Location Analytics */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12}>
                                        <LocationAnalytics
                                            data={locationData}
                                            rawResults={rawResults}
                                            dateRange={locationDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setLocationDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            aggregateFilteredData={aggregateFilteredData}
                                            limit={3}
                                        />
                                    </Col>
                                </Row>

                                {/* Playing Trend Chart */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12}>
                                        <PlayingTrendChart
                                            data={trendData}
                                            rawResults={rawResults}
                                            previousData={previousPeriodData?.trend || []}
                                            dateRange={trendDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={(range) => {
                                                setTrendDateRange(range);
                                            }}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                        />
                                    </Col>
                                </Row>

                                {/* Peak Hours Heatmap */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12}>
                                        <PeakHoursHeatmap
                                            data={heatmapData}
                                            rawResults={rawResults}
                                            dateRange={heatmapDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={(range) => {
                                                setHeatmapDateRange(range);
                                            }}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                        />
                                    </Col>
                                </Row>

                                {/* Track Post IDs and Popular Posts */}
                                <Row className="tta_analytics_row">
                                    <Col xs={12} md={6}>
                                        <TrackPostIds
                                            postIds={postIds}
                                            selectedIds={selectedIds}
                                            onSelectionChange={handleSelectionChange}
                                            analyticsEnabled={analytics.tts_enable_analytics}
                                            metrics={aggregatedData?.summary}
                                            dateRange={globalDateRange}
                                        />
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <PopularPosts
                                            posts={mostPopularPosts}
                                            rawResults={rawResults}
                                            dateRange={popularDateRange}
                                            globalDateRange={globalDateRange}
                                            onDateRangeChange={setPopularDateRange}
                                            filterResultsByDateRange={filterResultsByDateRange}
                                            limit={isProActive ? 10 : 3}
                                        />
                                    </Col>
                                </Row>

                                {/* Save Button */}
                                <div className="tta_save_button_wrapper">
                                    <Button type="submit" className="tta_btn">
                                        {__("Save", "text-to-audio")}
                                    </Button>
                                </div>
                            </Form>
                        ) : (
                            <>
                                 {/*Show message when analytics is disabled */}
                                <div className="tta_analytics_disabled_message">
                                    <div className="tta_disabled_content">
                                        <div className="tta_disabled_icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 3v18h18" />
                                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                                            </svg>
                                        </div>
                                        <h3>{__("Analytics is Currently Disabled", "text-to-audio")}</h3>
                                        <p>
                                            {__("Enable analytics using the toggle above to start tracking your TTS player interactions and view detailed metrics.", "text-to-audio")}
                                        </p>
                                    </div>
                                </div>
                                {/* Save Button */}
                                <div className="tta_save_button_wrapper">
                                    <Button type="button" onClick={e=>{handleSubmit(e)}} className="tta_btn">
                                        {__("Save", "text-to-audio")}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Col>

                    <Col xs={12} lg={4}>
                        <UpgradeToPro promotionType="analytics" />
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    ) : (
        <div className="tta_loading_container">
            <div className="tta_loading_spinner">
                <div className="tta_spinner"></div>
                <h1>{__("Loading...", "text-to-audio")}</h1>
            </div>
        </div>
    );
}
