import React from 'react';
import { __ } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};

/**
 * Step 3 — Player Customization.
 *
 * @param {Object}   props
 * @param {Object}   props.data     - { backgroundColor, color, border_color, borderRadius }
 * @param {Function} props.onChange  - Receives updated data object.
 */
const StepCustomize = ({ data, onChange }) => {
    const handleChange = (key, value) => {
        onChange({ ...data, [key]: value });
    };

    const radius = parseInt(data.borderRadius, 10) || 0;

    /* ------------------------------------------------------------------ */
    /*  Styles                                                             */
    /* ------------------------------------------------------------------ */
    const styles = {
        heading: {
            fontSize: 22,
            fontWeight: 600,
            color: '#1d2327',
            marginTop: 0,
            marginBottom: 8,
        },
        description: {
            fontSize: 14,
            color: '#50575e',
            marginBottom: 24,
            lineHeight: 1.6,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 24,
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column',
        },
        label: {
            fontSize: 13,
            fontWeight: 600,
            color: '#1d2327',
            marginBottom: 6,
        },
        colorRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        },
        colorInput: {
            width: 44,
            height: 44,
            border: '1px solid #c3c4c7',
            borderRadius: 4,
            padding: 2,
            cursor: 'pointer',
            backgroundColor: '#ffffff',
        },
        hexLabel: {
            fontSize: 13,
            color: '#50575e',
            fontFamily: 'monospace',
        },
        rangeWrap: {
            marginBottom: 28,
        },
        rangeRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
        },
        rangeInput: {
            flex: 1,
            accentColor: '#2271b1',
        },
        rangeValue: {
            fontSize: 13,
            fontWeight: 600,
            color: '#1d2327',
            minWidth: 40,
            textAlign: 'right',
        },
        previewSection: {
            padding: 24,
            backgroundColor: '#f6f7f7',
            borderRadius: 8,
            marginBottom: 24,
        },
        previewLabel: {
            fontSize: 13,
            fontWeight: 600,
            color: '#50575e',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: 0,
            marginBottom: 16,
        },
        previewButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            backgroundColor: data.backgroundColor,
            color: data.color,
            border: '2px solid ' + data.border_color,
            borderRadius: radius + 'px',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'default',
            fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'all 0.2s',
        },
        playIcon: {
            fontSize: 14,
            lineHeight: 1,
        },
        previewText: {
            fontSize: 13,
            color: '#50575e',
            marginTop: 16,
            marginBottom: 0,
            lineHeight: 1.6,
            fontStyle: 'italic',
        },
        infoText: {
            fontSize: 13,
            color: '#50575e',
            lineHeight: 1.6,
            marginBottom: 16,
        },
        proBox: {
            padding: '16px 20px',
            backgroundColor: '#f0f6fc',
            borderRadius: 8,
            borderLeft: '4px solid #2271b1',
            fontSize: 13,
            color: '#50575e',
            lineHeight: 1.6,
        },
        link: {
            color: '#2271b1',
            textDecoration: 'none',
            fontWeight: 500,
        },
    };

    return (
        <div>
            <h2 style={styles.heading}>
                {__('Customize the player to match your theme', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__(
                    'Pick colors and shape for the audio player button. Changes are previewed in real time below.',
                    'text-to-audio'
                )}
            </p>

            {/* Color pickers grid */}
            <div style={styles.grid}>
                {/* Background Color */}
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        {__('Background Color', 'text-to-audio')}
                    </label>
                    <div style={styles.colorRow}>
                        <input
                            type="color"
                            value={data.backgroundColor}
                            onChange={(e) =>
                                handleChange('backgroundColor', e.target.value)
                            }
                            style={styles.colorInput}
                            aria-label={__('Background Color', 'text-to-audio')}
                        />
                        <span style={styles.hexLabel}>
                            {data.backgroundColor}
                        </span>
                    </div>
                </div>

                {/* Text Color */}
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        {__('Text Color', 'text-to-audio')}
                    </label>
                    <div style={styles.colorRow}>
                        <input
                            type="color"
                            value={data.color}
                            onChange={(e) =>
                                handleChange('color', e.target.value)
                            }
                            style={styles.colorInput}
                            aria-label={__('Text Color', 'text-to-audio')}
                        />
                        <span style={styles.hexLabel}>{data.color}</span>
                    </div>
                </div>

                {/* Border Color */}
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        {__('Border Color', 'text-to-audio')}
                    </label>
                    <div style={styles.colorRow}>
                        <input
                            type="color"
                            value={data.border_color}
                            onChange={(e) =>
                                handleChange('border_color', e.target.value)
                            }
                            style={styles.colorInput}
                            aria-label={__('Border Color', 'text-to-audio')}
                        />
                        <span style={styles.hexLabel}>
                            {data.border_color}
                        </span>
                    </div>
                </div>
            </div>

            {/* Border Radius slider */}
            <div style={styles.rangeWrap}>
                <label style={styles.label}>
                    {__('Border Radius', 'text-to-audio')}
                </label>
                <div style={styles.rangeRow}>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        value={radius}
                        onChange={(e) =>
                            handleChange('borderRadius', e.target.value)
                        }
                        style={styles.rangeInput}
                        aria-label={__('Border Radius', 'text-to-audio')}
                    />
                    <span style={styles.rangeValue}>{radius}px</span>
                </div>
            </div>

            {/* Live preview */}
            <div style={styles.previewSection}>
                <p style={styles.previewLabel}>
                    {__('Live Preview', 'text-to-audio')}
                </p>
                <div style={styles.previewButton}>
                    <span style={styles.playIcon}>{'\u25B6'}</span>
                    {__('Listen', 'text-to-audio')}
                </div>
                <p style={styles.previewText}>
                    {__(
                        'Welcome to your site. Your visitors can now listen to your content with one click.',
                        'text-to-audio'
                    )}
                </p>
            </div>

            {/* Info text */}
            <p style={styles.infoText}>
                {__(
                    'You can fully customize the player anytime from the Customize tab — including size, position, margins, and custom CSS.',
                    'text-to-audio'
                )}
            </p>

            {/* Pro upsell */}
            <div style={styles.proBox}>
                {__(
                    'AtlasVoice Pro unlocks additional player designs, floating player positions, and MP3 downloads for visitors.',
                    'text-to-audio'
                )}{' '}
                <a
                    href={wizardData.pro_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    {__('See Pro Player Designs', 'text-to-audio')}
                </a>
            </div>
        </div>
    );
};

export default StepCustomize;
