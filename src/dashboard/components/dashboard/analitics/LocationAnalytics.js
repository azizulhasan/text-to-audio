import React from "react";
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
 * @param {string} props.dateRange - Selected date range
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {number} props.limit - Max items to show (3 for free, unlimited for pro)
 */
export default function LocationAnalytics({ data = {}, dateRange = "Last 7 Days", onDateRangeChange, limit = 3 }) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // Demo country data
    const demoCountries = {
        Germany: 18500,
        Brazil: 69200,
        "United States": 12800,
        Vietnam: 25700,
        Switzerland: 4600,
        Bangladesh: 4600,
    };

    // Demo city data
    const demoCities = {
        "São Paulo, Brazil": 12300,
        "Ho Chi Minh, Vietnam": 8200,
        "Berlin, Germany": 6800,
        "New York, USA": 5400,
        "Munich, Germany": 4200,
        "Hanoi, Vietnam": 4100,
    };

    // Use real data if available
    const countryData = isProActive && data.countries && Object.keys(data.countries).length > 0
        ? data.countries
        : demoCountries;

    const cityData = isProActive && data.cities && Object.keys(data.cities).length > 0
        ? data.cities
        : demoCities;

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

    // Apply limit for free version
    const displayLimit = isProActive ? countryArray.length : limit;
    const displayCountries = countryArray.slice(0, displayLimit);
    const hasMoreCountries = countryArray.length > displayLimit;

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
                    <option value="Yesterday">{__("Yesterday", "text-to-audio")}</option>
                    <option value="Last 7 Days">{__("Last 7 Days", "text-to-audio")}</option>
                    <option value="Last 30 Days">{__("Last 30 Days", "text-to-audio")}</option>
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

                    {hasMoreCountries && !isProActive && (
                        <div className="tta_analytics_list_more">
                            <a
                                href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tta_view_more_link"
                            >
                                +{countryArray.length - displayLimit} {__("more", "text-to-audio")} ({__("Pro", "text-to-audio")})
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Cities Section - Pro Only */}
            {isProActive && (
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
            )}

            {/* Pro upsell for cities */}
            {!isProActive && (
                <div className="tta_location_cities_promo">
                    <span className="tta_pro_badge_small">{__("Pro", "text-to-audio")}</span>
                    <span>{__("Unlock city-level analytics", "text-to-audio")}</span>
                </div>
            )}
        </div>
    );

    return content;
}
