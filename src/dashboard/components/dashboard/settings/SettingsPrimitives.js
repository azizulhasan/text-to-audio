/**
 * Shared Settings UI primitives (TTS-238 split).
 *
 * Kept in a dedicated module so both the main Settings container and the
 * split sub-components (AtlasVoiceSettings, LegacyExtractionSettings) can
 * import without duplicating component definitions.
 */
import React from "react";
import {__} from "@wordpress/i18n";
import {OverlayTrigger, Tooltip, Button} from "react-bootstrap";
import Icon from "../../Icon";

export const ToggleSwitch = ({checked, onChange, name, id, disabled}) => (
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

export const SettingRow = ({
    label,
    children,
    helpIcon,
    tooltipText,
    questionIcon,
    questionTooltip,
    youtubeLink,
    docLink,
    docTooltip,
}) => (
    <div className="setting-row">
        <div className="setting-label-area">
            <span className="setting-label">{label}</span>

            {questionIcon && (
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            {questionTooltip || __("Help information about this setting", "text-to-audio")}
                        </Tooltip>
                    }
                >
                    <span className="ms-2" style={{cursor: "pointer"}}>
                        <Icon name="question-circle" style={{color: "#999", fontSize: "14px"}} />
                    </span>
                </OverlayTrigger>
            )}

            {docLink && (
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            {docTooltip || __("Read the full documentation", "text-to-audio")}
                        </Tooltip>
                    }
                >
                    <a
                        className="ms-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={docLink}
                        style={{color: "#2271b1", cursor: "pointer"}}
                    >
                        <Icon name="info-circle" style={{fontSize: "14px"}} />
                    </a>
                </OverlayTrigger>
            )}

            {helpIcon && (
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            {tooltipText || __("Click To Know How It Works?", "text-to-audio")}
                        </Tooltip>
                    }
                >
                    <a
                        className="text-danger ms-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={youtubeLink || "#"}
                    >
                        <Icon name="youtube" />
                    </a>
                </OverlayTrigger>
            )}
        </div>

        <div>{children}</div>
    </div>
);

export const ProLockIcon = ({tooltipText}) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>}>
        <Button className="m-0 p-0 text-dark bg-light border-0 ms-2">
            <Icon name="lock" />
        </Button>
    </OverlayTrigger>
);
