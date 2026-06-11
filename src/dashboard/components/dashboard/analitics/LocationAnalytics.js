import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

/**
 * Country flag emojis mapping
 */
const COUNTRY_FLAGS = {
    germany: "🇩🇪",
    brazil: "🇧🇷",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    vietnam: "🇻🇳",
    switzerland: "🇨🇭",
    bangladesh: "🇧🇩",
    india: "🇮🇳",
    uk: "🇬🇧",
    "united kingdom": "🇬🇧",
    france: "🇫🇷",
    spain: "🇪🇸",
    italy: "🇮🇹",
    japan: "🇯🇵",
    china: "🇨🇳",
    canada: "🇨🇦",
    australia: "🇦🇺",
    russia: "🇷🇺",
    mexico: "🇲🇽",
    netherlands: "🇳🇱",
    other: "🌍",
};

/**
 * Get country flag
 */
const getFlag = (country) => {
    const key = country.toLowerCase();
    return COUNTRY_FLAGS[key] || COUNTRY_FLAGS.other;
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
 * Single location item component
 */
const LocationItem = ({ name, count, flag }) => (
    <div className="tta_location_list_item">
        <span className="tta_location_flag">{flag}</span>
        <span className="tta_location_name">{name}</span>
        <span className="tta_location_count">{formatCount(count)}</span>
    </div>
);

/**
 * LocationAnalytics Component
 * Shows geographic distribution of listeners
 *
 * @param {Object} props
 * @param {Object} props.data - Location data { countries: {}, cities: {} }
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {function} props.aggregateFilteredData - Function to aggregate filtered data
 * @param {number} props.limit - Max items to show (3 for free, unlimited for pro)
 */
export default function LocationAnalytics({
    data = {},
    rawResults = [],
    dateRange = "Last 7 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    aggregateFilteredData,
    limit = 3
}) {
    // TTS-247/2.2.2: location breakdown (countries + cities) is premium (data
    // injected by Pro into aggregated_insights). Locked behind the full-card
    // overlay when the data-driven `audience` capability is absent.
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

    // TTS-247: data-driven, no demo data. Country + city breakdowns are computed
    // in the free base aggregator, so they render with real data for everyone.
    const { countryData, cityData } = useMemo(() => {
        // If date range matches global, use the already aggregated data
        if (dateRange === globalDateRange) {
            return {
                countryData: data.countries || {},
                cityData: data.cities || {},
            };
        }

        // Otherwise, filter and re-aggregate from raw results
        if (filterResultsByDateRange && aggregateFilteredData && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);
            return {
                countryData: aggregateFilteredData(filtered, "country"),
                cityData: aggregateFilteredData(filtered, "city"),
            };
        }

        return {
            countryData: data.countries || {},
            cityData: data.cities || {},
        };
    }, [data, rawResults, dateRange, globalDateRange, filterResultsByDateRange, aggregateFilteredData]);

    // Convert countries to array and sort
    const countryArray = Object.entries(countryData)
        .map(([name, count]) => ({
            name,
            count,
            flag: getFlag(name),
        }))
        .sort((a, b) => b.count - a.count);

    // Convert cities to array and sort
    const cityArray = Object.entries(cityData)
        .map(([name, count]) => ({
            name,
            count,
            flag: "🏙️",
        }))
        .sort((a, b) => b.count - a.count);

    // TTS-247: show the full real country list — no artificial free-tier cap.
    const displayCountries = countryArray;

    const content = (
        <div className="tta_analytics_card tta_location_analytics_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Location", "text-to-audio")}</h3>
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

            {/* Countries Section */}
            <div className="tta_location_section">
                <h4 className="tta_location_section_title">{__("Top Countries", "text-to-audio")}</h4>
                <div className="tta_location_list">
                    {displayCountries.map((item, index) => (
                        <LocationItem
                            key={`country-${index}`}
                            name={item.name}
                            count={item.count}
                            flag={item.flag}
                        />
                    ))}

                </div>
            </div>

            {/* Cities Section — real city data from the base aggregator */}
            <div className="tta_location_section tta_location_cities">
                <h4 className="tta_location_section_title">{__("Top Cities", "text-to-audio")}</h4>
                <div className="tta_location_list tta_location_cities_list">
                    {cityArray.slice(0, 6).map((item, index) => (
                        <LocationItem
                            key={`city-${index}`}
                            name={item.name}
                            count={item.count}
                            flag={item.flag}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!hasAudience}
            featureName={__("Location", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
