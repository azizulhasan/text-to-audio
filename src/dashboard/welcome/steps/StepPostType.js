import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};

/**
 * Step 1 — Post Type Selection.
 *
 * @param {Object}   props
 * @param {Object}   props.data     - { postType: string }
 * @param {Function} props.onChange  - Receives updated data object.
 */
const StepPostType = ({ data, onChange }) => {
    const postTypes = (wizardData.post_types || []).filter(
        (pt) => pt.count > 0
    );

    const handleSelect = (slug) => {
        onChange({ ...data, postType: slug });
    };

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
        list: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        },
        radioItem: (isSelected) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 8,
            border: isSelected
                ? '2px solid #2271b1'
                : '2px solid #c3c4c7',
            backgroundColor: isSelected ? '#f0f6fc' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.15s',
        }),
        radioCircleOuter: (isSelected) => ({
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: isSelected
                ? '2px solid #2271b1'
                : '2px solid #8c8f94',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }),
        radioCircleInner: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#2271b1',
        },
        labelText: {
            fontSize: 15,
            color: '#1d2327',
            fontWeight: 500,
        },
        countText: {
            fontSize: 13,
            color: '#50575e',
            fontWeight: 400,
            marginLeft: 4,
        },
        infoBox: {
            marginTop: 28,
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
                {__('Where should the audio player appear?', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__(
                    'By default, the player is added to all your Posts. You can change it to any single post type:',
                    'text-to-audio'
                )}
            </p>

            <ul style={styles.list} role="radiogroup" aria-label={__('Post type selection', 'text-to-audio')}>
                {postTypes.map((pt) => {
                    const isSelected = data.postType === pt.slug;
                    return (
                        <li
                            key={pt.slug}
                            style={styles.radioItem(isSelected)}
                            onClick={() => handleSelect(pt.slug)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelect(pt.slug);
                                }
                            }}
                            tabIndex={0}
                            role="radio"
                            aria-checked={isSelected}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.backgroundColor =
                                        '#f6f7f7';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    isSelected ? '#f0f6fc' : '#ffffff';
                            }}
                        >
                            {/* Hidden native radio for accessibility */}
                            <input
                                type="radio"
                                name="tts_post_type"
                                value={pt.slug}
                                checked={isSelected}
                                onChange={() => handleSelect(pt.slug)}
                                style={{
                                    position: 'absolute',
                                    opacity: 0,
                                    width: 0,
                                    height: 0,
                                }}
                                aria-label={pt.label}
                            />

                            {/* Custom radio circle */}
                            <span
                                style={styles.radioCircleOuter(isSelected)}
                            >
                                {isSelected && (
                                    <span
                                        style={styles.radioCircleInner}
                                    />
                                )}
                            </span>

                            {/* Label */}
                            <span>
                                <span style={styles.labelText}>
                                    {pt.label}
                                </span>
                                <span style={styles.countText}>
                                    {sprintf(
                                        /* translators: %d: number of published posts */
                                        __('(%d published)', 'text-to-audio'),
                                        pt.count
                                    )}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>

            <div style={styles.infoBox}>
                {__(
                    'Free version supports 1 post type. Need multiple post types?',
                    'text-to-audio'
                )}{' '}
                <a
                    href={wizardData.pro_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    {__(
                        'AtlasVoice Pro supports unlimited post types plus AI-powered voices.',
                        'text-to-audio'
                    )}
                </a>
            </div>
        </div>
    );
};

export default StepPostType;
