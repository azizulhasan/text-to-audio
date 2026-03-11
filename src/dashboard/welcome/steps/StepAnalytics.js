import React, { useEffect, useCallback } from 'react';
import { __, sprintf } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};
const MAX_TRACKABLE_POSTS = 20;

/**
 * Step 4 — Analytics Configuration.
 *
 * @param {Object}   props
 * @param {Object}   props.data     - { enableAnalytics: boolean, trackablePostIds: number[] }
 * @param {Function} props.onChange  - Receives updated data object.
 */
const StepAnalytics = ({ data, onChange, selectedPostType }) => {
    const postsByType  = wizardData.recent_posts_by_type || {};
    const recentPosts  = postsByType[ selectedPostType ] || postsByType['post'] || [];

    /**
     * Pre-select the most recent 20 posts on first mount or when
     * selected post type changes and no manual selection was made.
     */
    useEffect(() => {
        if (
            data.enableAnalytics &&
            recentPosts.length > 0
        ) {
            const preSelected = recentPosts
                .slice(0, MAX_TRACKABLE_POSTS)
                .map((p) => p.id);
            onChange({ ...data, trackablePostIds: preSelected });
        }
    }, [selectedPostType]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ------------------------------------------------------------------ */
    /*  Handlers                                                           */
    /* ------------------------------------------------------------------ */

    const handleToggle = useCallback(() => {
        onChange({ ...data, enableAnalytics: !data.enableAnalytics });
    }, [data, onChange]);

    const handlePostToggle = useCallback(
        (postId) => {
            const ids = data.trackablePostIds;
            if (ids.includes(postId)) {
                onChange({
                    ...data,
                    trackablePostIds: ids.filter((id) => id !== postId),
                });
            } else if (ids.length < MAX_TRACKABLE_POSTS) {
                onChange({
                    ...data,
                    trackablePostIds: [...ids, postId],
                });
            }
        },
        [data, onChange]
    );

    const handleSelectAll = useCallback(() => {
        const allIds = recentPosts
            .slice(0, MAX_TRACKABLE_POSTS)
            .map((p) => p.id);
        onChange({ ...data, trackablePostIds: allIds });
    }, [data, onChange, recentPosts]);

    const handleDeselectAll = useCallback(() => {
        onChange({ ...data, trackablePostIds: [] });
    }, [data, onChange]);

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
        toggleRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
        },
        toggleTrack: (enabled) => ({
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: enabled ? '#00a32a' : '#c3c4c7',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            flexShrink: 0,
        }),
        toggleThumb: (enabled) => ({
            position: 'absolute',
            top: 2,
            left: enabled ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.2s',
        }),
        toggleHiddenInput: {
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
        },
        toggleLabel: {
            fontSize: 15,
            fontWeight: 500,
            color: '#1d2327',
            cursor: 'pointer',
        },
        sectionLabel: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1d2327',
            marginTop: 0,
            marginBottom: 12,
        },
        bulkActions: {
            display: 'flex',
            gap: 8,
            marginBottom: 12,
        },
        bulkButton: {
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 500,
            color: '#2271b1',
            backgroundColor: '#f0f6fc',
            border: '1px solid #2271b1',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 0.15s',
        },
        postList: {
            maxHeight: 250,
            overflowY: 'auto',
            border: '1px solid #c3c4c7',
            borderRadius: 8,
            padding: 0,
            margin: 0,
            listStyle: 'none',
        },
        postItem: (isChecked) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: '1px solid #f0f0f1',
            cursor: 'pointer',
            backgroundColor: isChecked ? '#f0f6fc' : '#ffffff',
            transition: 'background-color 0.1s',
        }),
        checkbox: (isChecked) => ({
            width: 18,
            height: 18,
            borderRadius: 4,
            border: isChecked ? '2px solid #2271b1' : '2px solid #8c8f94',
            backgroundColor: isChecked ? '#2271b1' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
        }),
        checkmark: {
            color: '#ffffff',
            fontSize: 12,
            lineHeight: 1,
            fontWeight: 700,
        },
        postTitle: {
            fontSize: 14,
            color: '#1d2327',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        counter: {
            fontSize: 13,
            color: '#50575e',
            marginTop: 10,
            marginBottom: 0,
        },
        counterHighlight: {
            fontWeight: 600,
            color: '#1d2327',
        },
        emptyState: {
            padding: '24px 20px',
            textAlign: 'center',
            color: '#50575e',
            fontSize: 14,
            lineHeight: 1.6,
            backgroundColor: '#f6f7f7',
            borderRadius: 8,
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

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */
    const selectedCount = data.trackablePostIds.length;
    const atLimit = selectedCount >= MAX_TRACKABLE_POSTS;

    return (
        <div>
            <h2 style={styles.heading}>
                {__('Track your audio player performance', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__(
                    'See how visitors interact with your audio content. Analytics helps you understand what works.',
                    'text-to-audio'
                )}
            </p>

            {/* Analytics toggle */}
            <div style={styles.toggleRow}>
                <input
                    type="checkbox"
                    id="tts-analytics-toggle"
                    checked={data.enableAnalytics}
                    onChange={handleToggle}
                    style={styles.toggleHiddenInput}
                    aria-label={__('Enable Analytics', 'text-to-audio')}
                />
                <div
                    style={styles.toggleTrack(data.enableAnalytics)}
                    onClick={handleToggle}
                    role="switch"
                    aria-checked={data.enableAnalytics}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggle();
                        }
                    }}
                >
                    <div style={styles.toggleThumb(data.enableAnalytics)} />
                </div>
                <label
                    htmlFor="tts-analytics-toggle"
                    style={styles.toggleLabel}
                    onClick={handleToggle}
                >
                    {__('Enable Analytics', 'text-to-audio')}
                </label>
            </div>

            {/* Post selection — only when analytics is enabled */}
            {data.enableAnalytics && (
                <div>
                    {recentPosts.length === 0 ? (
                        <div style={styles.emptyState}>
                            {__(
                                'No published posts found. Analytics will start tracking once you publish content.',
                                'text-to-audio'
                            )}
                        </div>
                    ) : (
                        <div>
                            <p style={styles.sectionLabel}>
                                {sprintf(
                                    /* translators: %d: maximum number of trackable posts */
                                    __(
                                        'Select posts to track (up to %d in free version):',
                                        'text-to-audio'
                                    ),
                                    MAX_TRACKABLE_POSTS
                                )}
                            </p>

                            {/* Select All / Deselect All */}
                            <div style={styles.bulkActions}>
                                <button
                                    type="button"
                                    style={styles.bulkButton}
                                    onClick={handleSelectAll}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            '#2271b1';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            '#f0f6fc';
                                        e.currentTarget.style.color = '#2271b1';
                                    }}
                                >
                                    {__('Select All', 'text-to-audio')}
                                </button>
                                <button
                                    type="button"
                                    style={styles.bulkButton}
                                    onClick={handleDeselectAll}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            '#2271b1';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            '#f0f6fc';
                                        e.currentTarget.style.color = '#2271b1';
                                    }}
                                >
                                    {__('Deselect All', 'text-to-audio')}
                                </button>
                            </div>

                            {/* Scrollable post list */}
                            <ul style={styles.postList}>
                                {recentPosts.map((post) => {
                                    const isChecked =
                                        data.trackablePostIds.includes(
                                            post.id
                                        );
                                    const isDisabled = !isChecked && atLimit;

                                    return (
                                        <li
                                            key={post.id}
                                            style={{
                                                ...styles.postItem(isChecked),
                                                opacity: isDisabled ? 0.5 : 1,
                                                cursor: isDisabled
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                            }}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    handlePostToggle(post.id);
                                                }
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isDisabled && !isChecked) {
                                                    e.currentTarget.style.backgroundColor =
                                                        '#f6f7f7';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    isChecked
                                                        ? '#f0f6fc'
                                                        : '#ffffff';
                                            }}
                                        >
                                            {/* Hidden native checkbox for accessibility */}
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={() =>
                                                    handlePostToggle(post.id)
                                                }
                                                style={{
                                                    position: 'absolute',
                                                    opacity: 0,
                                                    width: 0,
                                                    height: 0,
                                                }}
                                                aria-label={post.title}
                                            />

                                            {/* Custom checkbox */}
                                            <span
                                                style={styles.checkbox(
                                                    isChecked
                                                )}
                                            >
                                                {isChecked && (
                                                    <span
                                                        style={styles.checkmark}
                                                    >
                                                        {'\u2713'}
                                                    </span>
                                                )}
                                            </span>

                                            {/* Post title */}
                                            <span style={styles.postTitle}>
                                                {post.title}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Selection counter */}
                            <p style={styles.counter}>
                                <span style={styles.counterHighlight}>
                                    {selectedCount}
                                </span>
                                {' '}
                                {sprintf(
                                    /* translators: %d: maximum number of trackable posts */
                                    __('of %d selected', 'text-to-audio'),
                                    MAX_TRACKABLE_POSTS
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Pro upsell */}
            <div style={styles.infoBox}>
                {__(
                    'AtlasVoice Pro unlocks unlimited post tracking, geographic insights, device analytics, and CSV exports.',
                    'text-to-audio'
                )}{' '}
                <a
                    href={wizardData.pro_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    {__('Learn about Pro Analytics', 'text-to-audio')}
                </a>
            </div>
        </div>
    );
};

export default StepAnalytics;
