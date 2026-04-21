/**
 * Legacy Extraction Settings (TTS-238 — old system).
 *
 * The four pre-AtlasVoice CSS-based extraction fields:
 *   1. Include Content By CSS Selectors
 *   2. Exclude Content By CSS Selectors
 *   3. Exclude HTML Tags To Speak
 *   4. Exclude Texts To Speak
 *
 * Kept exactly as they were before the TTS-238 split. These fields drive
 * the legacy extraction pipeline (TTSProHelper.js getModifiedContent) and
 * continue to work untouched when opt-in is OFF.
 *
 * New-system equivalents live in AtlasVoiceSettings.js and will be built
 * out into a visual wizard in PR-B / PR-C.
 */
import React from "react";
import {__} from "@wordpress/i18n";
import {Form, Row, Col, OverlayTrigger, Tooltip} from "react-bootstrap";
import Icon from "../../Icon";
import {ProLockIcon} from "./SettingsPrimitives";

export default function LegacyExtractionSettings({settings, handleChange}) {
    return (
        <>
            {/* Include Content By CSS Selectors */}
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                            <Form.Label className="setting-label text-dark m-0">
                                {__("Include Content By CSS Selectors", "text-to-audio")}
                            </Form.Label>
                            {!ttsObj.is_pro_active && (
                                <ProLockIcon
                                    tooltipText={__(
                                        "Include Content By CSS Selectors feature is available in pro version",
                                        "text-to-audio"
                                    )}
                                />
                            )}
                        </div>
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    {__("Click To Know How It Works?", "text-to-audio")}
                                </Tooltip>
                            }
                        >
                            <a
                                className="text-danger"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                            >
                                <Icon name="youtube" />
                            </a>
                        </OverlayTrigger>
                    </div>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_css_selectors"
                        value={settings.tta__settings_css_selectors}
                        onChange={(e) => handleChange(e)}
                        placeholder={
                            ttsObj.is_pro_active
                                ? __("Multiple selector will be multiline.", "text-to-audio")
                                : __("Some content may be missing, It can be found by css selectors", "text-to-audio")
                        }
                        disabled={!ttsObj.is_pro_active}
                        className="tta-textarea"
                    />
                    <Form.Text className="text-muted">
                        {__(
                            "Add CSS selectors for the content areas the player should read. One selector per line. Only target post/page body content. If left empty, the player automatically detects the content area.",
                            "text-to-audio"
                        )}
                    </Form.Text>
                </Col>
            </Row>

            {/* Exclude Content By CSS Selectors */}
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                            <Form.Label className="setting-label text-dark m-0">
                                {__("Exclude Content By CSS Selectors", "text-to-audio")}
                            </Form.Label>
                            {!ttsObj.is_pro_active && (
                                <ProLockIcon
                                    tooltipText={__(
                                        "Exclude Content By CSS Selectors feature is available in pro version",
                                        "text-to-audio"
                                    )}
                                />
                            )}
                        </div>
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    {__("Click To Know How It Works?", "text-to-audio")}
                                </Tooltip>
                            }
                        >
                            <a
                                className="text-danger ms-2"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                            >
                                <Icon name="youtube" />
                            </a>
                        </OverlayTrigger>
                    </div>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_content_by_css_selectors"
                        value={settings.tta__settings_exclude_content_by_css_selectors}
                        onChange={(e) => handleChange(e)}
                        placeholder={
                            ttsObj.is_pro_active
                                ? __("Multiple selector will be multiline.", "text-to-audio")
                                : __("Exclude content by CSS selectors", "text-to-audio")
                        }
                        disabled={!ttsObj.is_pro_active}
                        className="tta-textarea"
                    />
                    <small style={{color: "#d32f2f", marginTop: "4px", display: "block"}}>
                        {__('You can add ".atlasvoice_no_read" class to exclude content.', "text-to-audio")}
                    </small>
                    <Form.Text className="text-muted">
                        {__(
                            "Remove specific elements within the included content areas above. One selector per line. Example: .social-share, .related-posts, .author-bio",
                            "text-to-audio"
                        )}
                    </Form.Text>
                </Col>
            </Row>

            {/* Exclude HTML Tags To Speak */}
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                            <Form.Label className="setting-label text-dark m-0">
                                {__("Exclude HTML Tags To Speak", "text-to-audio")}
                            </Form.Label>
                            {!ttsObj.is_pro_active && (
                                <ProLockIcon
                                    tooltipText={__(
                                        "Exclude Tags. So that its content skipped. Like ( Subscript, Superscript etc.) This is a pro feature.",
                                        "text-to-audio"
                                    )}
                                />
                            )}
                        </div>
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    {__("Click To Know How It Works?", "text-to-audio")}
                                </Tooltip>
                            }
                        >
                            <a
                                className="text-danger ms-2"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                            >
                                <Icon name="youtube" />
                            </a>
                        </OverlayTrigger>
                    </div>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_tags"
                        value={settings.tta__settings_exclude_tags}
                        onChange={(e) => handleChange(e)}
                        placeholder={
                            ttsObj.is_pro_active
                                ? __("Multiple Tags Will Be Pipe(|) Separated.", "text-to-audio")
                                : __("Exclude tags is a pro feature.", "text-to-audio")
                        }
                        disabled={!ttsObj.is_pro_active}
                        className="tta-textarea"
                    />
                    <Form.Text className="text-muted">
                        {__(
                            "HTML tags to skip within the included content. Pipe-separated. script, style, figure, and figcaption are always excluded automatically. Example: sub|sup|blockquote",
                            "text-to-audio"
                        )}
                    </Form.Text>
                </Col>
            </Row>

            {/* Exclude Texts To Speak */}
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                            <Form.Label className="setting-label text-dark m-0">
                                {__("Exclude Texts To Speak", "text-to-audio")}
                            </Form.Label>
                            {!ttsObj.is_pro_active && (
                                <ProLockIcon
                                    tooltipText={__(
                                        "Excluding texts to be spoken is a pro feature.",
                                        "text-to-audio"
                                    )}
                                />
                            )}
                        </div>
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    {__("Click To Know How It Works?", "text-to-audio")}
                                </Tooltip>
                            }
                        >
                            <a
                                className="text-danger ms-2"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                            >
                                <Icon name="youtube" />
                            </a>
                        </OverlayTrigger>
                    </div>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_texts"
                        value={settings.tta__settings_exclude_texts}
                        onChange={(e) => handleChange(e)}
                        placeholder={
                            ttsObj.is_pro_active
                                ? __("Multiple Texts Will Be Pipe(|) Separated.", "text-to-audio")
                                : __("Exclude texts is a pro feature.", "text-to-audio")
                        }
                        disabled={!ttsObj.is_pro_active}
                        className="tta-textarea"
                    />
                    <Form.Text className="text-muted">
                        {__(
                            "Exact text patterns to remove from the spoken content. Pipe-separated. Applied after all CSS and tag exclusions. Example: Read more...|Advertisement|Sponsored Content",
                            "text-to-audio"
                        )}
                    </Form.Text>
                </Col>
            </Row>
        </>
    );
}
