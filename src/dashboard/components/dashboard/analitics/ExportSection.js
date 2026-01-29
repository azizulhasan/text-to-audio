import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { Button, Form, Modal } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";
import notify from "../../context/Notify";

/**
 * ExportSection Component
 * Provides export functionality for analytics data (Pro only)
 *
 * @param {Object} props
 * @param {function} props.onExportCSV - Callback for CSV export
 * @param {function} props.onExportPDF - Callback for PDF export
 * @param {string} props.dateRange - Current date range for exports
 * @param {string} props.fromDate - Custom from date
 * @param {string} props.toDate - Custom to date
 */
export default function ExportSection({ onExportCSV, onExportPDF, dateRange, fromDate, toDate }) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleSettings, setScheduleSettings] = useState({
        enabled: false,
        recipients: "",
        frequency: "weekly",
        day: "monday",
        time: "09:00",
        includeSummary: true,
        includeTopPosts: true,
        includeGeo: true,
        includeTrend: true,
        includeDevice: true,
        includeFullDetails: false,
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [nextRunTime, setNextRunTime] = useState(null);

    // Load schedule settings when modal opens
    useEffect(() => {
        if (showScheduleModal && isProActive) {
            loadScheduleSettings();
        }
    }, [showScheduleModal, isProActive]);

    /**
     * Load schedule settings from the API
     */
    const loadScheduleSettings = async () => {
        setIsLoadingSettings(true);
        try {
            const response = await fetch(
                `${tta_obj.api_url}tta/v1/get_schedule_report`,
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
                setScheduleSettings(result.data);
                setNextRunTime(result.next_run);
            }
        } catch (error) {
            console.error("Error loading schedule settings:", error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    // Handle CSV export
    const handleExportCSV = async () => {
        if (!isProActive) return;

        setIsExporting(true);
        try {
            if (onExportCSV) {
                await onExportCSV();
            } else {
                // Default implementation - would call API
                notify(__("CSV export initiated. Check your downloads.", "text-to-audio"), "success");
            }
        } catch (error) {
            notify(__("Export failed. Please try again.", "text-to-audio"), "error");
        }
        setIsExporting(false);
    };

    // Handle PDF export
    const handleExportPDF = async () => {
        if (!isProActive) return;

        setIsExporting(true);
        try {
            if (onExportPDF) {
                await onExportPDF();
            } else {
                notify(__("PDF export initiated. Check your downloads.", "text-to-audio"), "success");
            }
        } catch (error) {
            notify(__("Export failed. Please try again.", "text-to-audio"), "error");
        }
        setIsExporting(false);
    };

    // Handle schedule settings change
    const handleScheduleChange = (field, value) => {
        setScheduleSettings({
            ...scheduleSettings,
            [field]: value,
        });
    };

    // Save schedule settings
    const handleSaveSchedule = async () => {
        if (!isProActive) return;

        // Validate recipients if enabled
        if (scheduleSettings.enabled && !scheduleSettings.recipients.trim()) {
            notify(__("Please enter at least one recipient email address.", "text-to-audio"), "error");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(
                `${tta_obj.api_url}tta/v1/save_schedule_report`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                    },
                    body: JSON.stringify(scheduleSettings),
                }
            );
            const result = await response.json();

            if (result.status) {
                notify(__("Report schedule saved successfully.", "text-to-audio"), "success");
                setShowScheduleModal(false);
            } else {
                notify(result.message || __("Failed to save schedule settings.", "text-to-audio"), "error");
            }
        } catch (error) {
            console.error("Error saving schedule settings:", error);
            notify(__("Failed to save schedule settings.", "text-to-audio"), "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Send test report
    const handleSendTestReport = async () => {
        if (!isProActive) return;

        if (!scheduleSettings.recipients.trim()) {
            notify(__("Please enter recipient email addresses first.", "text-to-audio"), "error");
            return;
        }

        setIsSendingTest(true);
        try {
            const response = await fetch(
                `${tta_obj.api_url}tta/v1/send_test_report`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-WP-Nonce": window?.ttsObj?.rest_nonce ?? ttsObjPro?.rest_nonce,
                    },
                }
            );
            const result = await response.json();

            if (result.status) {
                notify(__("Test report sent successfully! Check your inbox.", "text-to-audio"), "success");
            } else {
                notify(result.message || __("Failed to send test report.", "text-to-audio"), "error");
            }
        } catch (error) {
            console.error("Error sending test report:", error);
            notify(__("Failed to send test report.", "text-to-audio"), "error");
        } finally {
            setIsSendingTest(false);
        }
    };

    const content = (
        <div className="tta_export_section">
            <div className="tta_export_buttons">
                <Button
                    className="tta_export_btn tta_export_csv"
                    onClick={handleExportCSV}
                    disabled={isExporting || !isProActive}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    {__("CSV", "text-to-audio")}
                </Button>

                <Button
                    className="tta_export_btn tta_export_pdf"
                    onClick={handleExportPDF}
                    disabled={isExporting || !isProActive}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    {__("PDF", "text-to-audio")}
                </Button>

                <Button
                    className="tta_export_btn tta_export_schedule"
                    onClick={() => setShowScheduleModal(true)}
                    disabled={!isProActive}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {__("Schedule Report", "text-to-audio")}
                </Button>

                {!isProActive && (
                    <span className="tta_export_pro_badge">{__("Pro", "text-to-audio")}</span>
                )}
            </div>

            {/* Schedule Report Modal */}
            <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{__("Schedule Email Reports", "text-to-audio")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoadingSettings ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{__("Loading...", "text-to-audio")}</span>
                            </div>
                        </div>
                    ) : (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="schedule-enabled"
                                label={__("Enable automated reports", "text-to-audio")}
                                checked={scheduleSettings.enabled}
                                onChange={(e) => handleScheduleChange("enabled", e.target.checked)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{__("Recipients (comma separated)", "text-to-audio")}</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="admin@example.com, team@example.com"
                                value={scheduleSettings.recipients}
                                onChange={(e) => handleScheduleChange("recipients", e.target.value)}
                                disabled={!scheduleSettings.enabled}
                            />
                        </Form.Group>

                        <div className="d-flex gap-3 mb-3">
                            <Form.Group className="flex-fill">
                                <Form.Label>{__("Frequency", "text-to-audio")}</Form.Label>
                                <Form.Select
                                    value={scheduleSettings.frequency}
                                    onChange={(e) => handleScheduleChange("frequency", e.target.value)}
                                    disabled={!scheduleSettings.enabled}
                                >
                                    <option value="daily">{__("Daily", "text-to-audio")}</option>
                                    <option value="weekly">{__("Weekly", "text-to-audio")}</option>
                                    <option value="monthly">{__("Monthly", "text-to-audio")}</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="flex-fill">
                                <Form.Label>{__("Day", "text-to-audio")}</Form.Label>
                                <Form.Select
                                    value={scheduleSettings.day}
                                    onChange={(e) => handleScheduleChange("day", e.target.value)}
                                    disabled={!scheduleSettings.enabled || scheduleSettings.frequency === "daily"}
                                >
                                    <option value="monday">{__("Monday", "text-to-audio")}</option>
                                    <option value="tuesday">{__("Tuesday", "text-to-audio")}</option>
                                    <option value="wednesday">{__("Wednesday", "text-to-audio")}</option>
                                    <option value="thursday">{__("Thursday", "text-to-audio")}</option>
                                    <option value="friday">{__("Friday", "text-to-audio")}</option>
                                    <option value="saturday">{__("Saturday", "text-to-audio")}</option>
                                    <option value="sunday">{__("Sunday", "text-to-audio")}</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="flex-fill">
                                <Form.Label>{__("Time", "text-to-audio")}</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={scheduleSettings.time}
                                    onChange={(e) => handleScheduleChange("time", e.target.value)}
                                    disabled={!scheduleSettings.enabled}
                                />
                            </Form.Group>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>{__("Include in report:", "text-to-audio")}</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                <Form.Check
                                    type="checkbox"
                                    id="include-summary"
                                    label={__("Summary statistics", "text-to-audio")}
                                    checked={scheduleSettings.includeSummary}
                                    onChange={(e) => handleScheduleChange("includeSummary", e.target.checked)}
                                    disabled={!scheduleSettings.enabled}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="include-top-posts"
                                    label={__("Top 10 posts", "text-to-audio")}
                                    checked={scheduleSettings.includeTopPosts}
                                    onChange={(e) => handleScheduleChange("includeTopPosts", e.target.checked)}
                                    disabled={!scheduleSettings.enabled}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="include-geo"
                                    label={__("Geographic breakdown", "text-to-audio")}
                                    checked={scheduleSettings.includeGeo}
                                    onChange={(e) => handleScheduleChange("includeGeo", e.target.checked)}
                                    disabled={!scheduleSettings.enabled}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="include-trend"
                                    label={__("Trend chart", "text-to-audio")}
                                    checked={scheduleSettings.includeTrend}
                                    onChange={(e) => handleScheduleChange("includeTrend", e.target.checked)}
                                    disabled={!scheduleSettings.enabled}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="include-device"
                                    label={__("Device stats", "text-to-audio")}
                                    checked={scheduleSettings.includeDevice}
                                    onChange={(e) => handleScheduleChange("includeDevice", e.target.checked)}
                                    disabled={!scheduleSettings.enabled}
                                />
                            </div>
                        </Form.Group>

                        {nextRunTime && scheduleSettings.enabled && (
                            <div className="alert alert-info mt-3 mb-0">
                                <small>
                                    <strong>{__("Next scheduled report:", "text-to-audio")}</strong>{" "}
                                    {new Date(nextRunTime).toLocaleString()}
                                </small>
                            </div>
                        )}
                    </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={handleSendTestReport}
                        disabled={!scheduleSettings.recipients.trim() || isSendingTest}
                    >
                        {isSendingTest ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {__("Sending...", "text-to-audio")}
                            </>
                        ) : (
                            __("Send Test Report", "text-to-audio")
                        )}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveSchedule}
                        className="tta_btn"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {__("Saving...", "text-to-audio")}
                            </>
                        ) : (
                            __("Save Settings", "text-to-audio")
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );

    return (
        <ProFeatureOverlay
            showOverlay={!isProActive}
            featureName={__("Export & Reports", "text-to-audio")}
        >
            {content}
        </ProFeatureOverlay>
    );
}
