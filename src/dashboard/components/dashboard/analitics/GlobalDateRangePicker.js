import React, { useState, useRef, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { Button, Form, Dropdown } from "react-bootstrap";
import toast from "../../context/Notify";

/**
 * GlobalDateRangePicker Component
 * Provides a global date range picker for the analytics dashboard
 *
 * @param {Object} props
 * @param {string} props.dateRange - Current selected date range preset
 * @param {string} props.fromDate - Custom start date
 * @param {string} props.toDate - Custom end date
 * @param {function} props.onDateRangeChange - Callback when date range changes
 */
export default function GlobalDateRangePicker({
    dateRange = "Last 7 Days",
    fromDate,
    toDate,
    onDateRangeChange,
}) {
    const [showCustom, setShowCustom] = useState(false);
    const [customFrom, setCustomFrom] = useState(fromDate || "");
    const [customTo, setCustomTo] = useState(toDate || "");
    const dropdownRef = useRef(null);

    // TTS-247: data-driven capability map (no is_atlasvoice_addon_functional gating). The
    // extended date range (beyond 30 days + custom) is offered only when a
    // companion plugin (Pro) declares the `extendedDateRange` capability via
    // the tts_capabilities PHP filter.
    const capabilities = (typeof ttsObj !== "undefined" && ttsObj.capabilities) || {};
    const hasExtendedRange = !!capabilities.extendedDateRange;

    // Date range presets. Free shows up to 30 days; the longer ranges + custom
    // appear once the extendedDateRange capability is present.
    const presets = [
        { value: "Yesterday", label: __("Yesterday", "text-to-audio") },
        { value: "Last 7 Days", label: __("Last 7 Days", "text-to-audio") },
        { value: "Last 14 Days", label: __("Last 14 Days", "text-to-audio") },
        { value: "Last 30 Days", label: __("Last 30 Days", "text-to-audio") },
        ...(hasExtendedRange ? [
            { value: "Last 90 Days", label: __("Last 90 Days", "text-to-audio") },
            { value: "Last 999 Days", label: __("All Time", "text-to-audio") },
            { value: "Custom", label: __("Custom Range", "text-to-audio") },
        ] : []),
    ];

    /**
     * Get display text for the current date range
     */
    const getDisplayText = () => {
        if (dateRange === "Custom" && fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            return `${from.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })} - ${to.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })}`;
        }

        // Calculate dates based on preset
        const today = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case "Yesterday":
                startDate.setDate(today.getDate() - 1);
                return startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                });
            case "Last 7 Days":
                startDate.setDate(today.getDate() - 7);
                break;
            case "Last 30 Days":
                startDate.setDate(today.getDate() - 30);
                break;
            case "Last 90 Days":
                startDate.setDate(today.getDate() - 90);
                break;
            case "Last 999 Days":
                return __("All Time", "text-to-audio");
            default:
                startDate.setDate(today.getDate() - 7);
        }

        return `${startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        })} - ${today.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        })}`;
    };

    const  isNumeric = (value) => {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    /**
     * Handle preset selection
     */
    const handlePresetSelect = (preset) => {
        if (preset === "Custom") {
            setShowCustom(true);
            // Set default custom dates if not already set
            if (!customFrom) {
                const from = new Date();
                from.setDate(from.getDate() - 30);
                setCustomFrom(from.toISOString().split("T")[0]);
            }
            if (!customTo) {
                setCustomTo(new Date().toISOString().split("T")[0]);
            }
        } else {
            setShowCustom(false);
            const number = preset.replace(/[^0-9]/g, '');
            if(isNumeric(number) && number > 30 && !hasExtendedRange){
                toast(
                    <h6>
                        {__('Getting more than 30 days data is pro feature. Please ', 'text-to-audio')}
                        <a target='_blank' href='https://atlasaidev.com/plugins/text-to-speech-pro/pricing/'>
                            {__('Buy Pro version', 'text-to-audio')}
                        </a>
                    </h6>,
                    'info',
                    {autoClose: 10000}
                );
                return;
            }
            if (onDateRangeChange) {
                onDateRangeChange({
                    dateRange: preset,
                    fromDate: null,
                    toDate: null,
                });
            }
        }
    };

    /**
     * Apply custom date range
     */
    const handleApplyCustom = () => {
        if(!hasExtendedRange){
            toast(
                <h6>
                    {__('Custom date select is only available in pro version. Please ', 'text-to-audio')}
                    <a target='_blank' href='https://atlasaidev.com/plugins/text-to-speech-pro/pricing/'>
                        {__('Buy Pro version', 'text-to-audio')}
                    </a>
                </h6>,
                'info',
                {autoClose: 10000}
            );
            return;
        }
        if (customFrom && customTo) {
            if (onDateRangeChange) {
                onDateRangeChange({
                    dateRange: "Custom",
                    fromDate: customFrom,
                    toDate: customTo,
                });
            }
            setShowCustom(false);
        }
    };

    /**
     * Get the label for current preset
     */
    const getCurrentPresetLabel = () => {
        const preset = presets.find((p) => p.value === dateRange);
        return preset ? preset.label : __("Last 7 Days", "text-to-audio");
    };

    return (
        <Dropdown className="tta_global_date_picker" ref={dropdownRef}>
            <Dropdown.Toggle
                as="span"
                className="tta_date_badge tta_date_badge_clickable"
                id="global-date-dropdown"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tta_date_icon"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span className="tta_date_text">{getDisplayText()}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tta_dropdown_arrow"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </Dropdown.Toggle>

            <Dropdown.Menu className="tta_date_dropdown_menu">
                <div className="tta_date_presets">
                    <div className="tta_date_presets_label">
                        {__("Quick Select", "text-to-audio")}
                    </div>
                    {presets.map((preset) => (
                        <Dropdown.Item
                            key={preset.value}
                            className={`tta_date_preset_item ${
                                dateRange === preset.value ? "active" : ""
                            }`}
                            onClick={() => handlePresetSelect(preset.value)}
                        >
                            {preset.label}
                            {dateRange === preset.value && (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="tta_check_icon"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                        </Dropdown.Item>
                    ))}
                </div>

                {showCustom && (
                    <div className="tta_custom_date_range">
                        <div className="tta_custom_date_divider"></div>
                        <div className="tta_custom_date_label">
                            {__("Custom Range", "text-to-audio")}
                        </div>
                        <div className="tta_custom_date_inputs">
                            <Form.Group className="tta_date_input_group">
                                <Form.Label>{__("From", "text-to-audio")}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    max={customTo || new Date().toISOString().split("T")[0]}
                                />
                            </Form.Group>
                            <Form.Group className="tta_date_input_group">
                                <Form.Label>{__("To", "text-to-audio")}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    min={customFrom}
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </Form.Group>
                        </div>
                        <Button
                            className="tta_apply_custom_btn"
                            onClick={handleApplyCustom}
                            disabled={!customFrom || !customTo}
                        >
                            {__("Apply", "text-to-audio")}
                        </Button>
                    </div>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}
