import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};

/**
 * Finish screen with setup summary, Pro upsell, and cross-promo.
 *
 * TTS-247 — also hosts the Go Live decision: setup leaves the site in
 * staging (player hidden, no MP3 cost) so the admin commits to production
 * here, only after configuring + verifying content.
 */
const StepFinish = ({ selectedPostType, listening, customize, analytics }) => {
    const [goneLive, setGoneLive] = useState(false);
    const [goingLive, setGoingLive] = useState(false);
    const [liveErr, setLiveErr] = useState('');
    const docUrl = wizardData.steprail_doc_url || '';

    const goLive = async () => {
        setGoingLive(true);
        setLiveErr('');
        try {
            const res = await fetch((wizardData.api_url || '/wp-json/tta/v1/') + 'mode', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'X-WP-Nonce': wizardData.nonce || '', 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'go-live', confirm: 'GO LIVE' }),
            });
            const json = await res.json();
            if (res.ok && json && json.status) {
                setGoneLive(true);
            } else {
                setLiveErr((json && json.message) || __('Could not go live. Please try from the dashboard.', 'text-to-audio'));
            }
        } catch (e) {
            setLiveErr(__('Could not go live. Please try from the dashboard.', 'text-to-audio'));
        } finally {
            setGoingLive(false);
        }
    };

    const postTypes = wizardData.post_types || [];
    const matched = postTypes.find((pt) => pt.slug === selectedPostType);
    const postTypeLabel = matched ? matched.label : selectedPostType;

    /* ------------------------------------------------------------------ */
    /*  Styles                                                             */
    /* ------------------------------------------------------------------ */
    const styles = {
        wrapper: {
            padding: '20px 0',
        },
        celebration: {
            textAlign: 'center',
            marginBottom: 32,
        },
        checkmark: {
            width: 64,
            height: 64,
            margin: '0 auto 20px',
        },
        heading: {
            fontSize: 26,
            fontWeight: 600,
            color: '#1d2327',
            marginTop: 0,
            marginBottom: 8,
        },
        subheading: {
            fontSize: 15,
            color: '#50575e',
            marginBottom: 24,
            lineHeight: 1.6,
        },
        buttons: {
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
        },
        btnPrimary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FF7853',
            color: '#ffffff',
            border: 'none',
            padding: '12px 28px',
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
        },
        btnSecondary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            color: '#FF7853',
            border: '1px solid #FF7853',
            padding: '12px 28px',
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
        },
        /* Section 2: Setup Summary */
        summarySection: {
            marginTop: 32,
            paddingTop: 28,
            borderTop: '1px solid #e0e0e0',
        },
        summaryTitle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#50575e',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: 0,
            marginBottom: 16,
            textAlign: 'center',
        },
        summaryRow: {
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
        },
        summaryCard: {
            flex: '1 1 0',
            minWidth: 140,
            maxWidth: 200,
            padding: '14px 16px',
            backgroundColor: '#f6f7f7',
            borderRadius: 8,
            textAlign: 'center',
        },
        summaryIcon: {
            fontSize: 22,
            marginBottom: 6,
            display: 'block',
        },
        summaryLabel: {
            fontSize: 11,
            color: '#50575e',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
            display: 'block',
        },
        summaryValue: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1d2327',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        /* Section 3: Pro Upsell */
        proSection: {
            marginTop: 32,
            paddingTop: 28,
            borderTop: '1px solid #e0e0e0',
        },
        proTitle: {
            fontSize: 18,
            fontWeight: 600,
            color: '#1d2327',
            marginTop: 0,
            marginBottom: 6,
            textAlign: 'center',
        },
        proSubtitle: {
            fontSize: 13,
            color: '#50575e',
            marginBottom: 20,
            textAlign: 'center',
            lineHeight: 1.5,
        },
        proCards: {
            display: 'flex',
            gap: 14,
            marginBottom: 20,
            flexWrap: 'wrap',
        },
        proCard: {
            flex: '1 1 0',
            minWidth: 170,
            padding: '18px 16px',
            backgroundColor: '#fff5f2',
            borderRadius: 8,
            border: '1px solid #c5d9ed',
            textAlign: 'center',
        },
        proCardIcon: {
            fontSize: 28,
            marginBottom: 8,
            display: 'block',
        },
        proCardTitle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1d2327',
            marginBottom: 6,
        },
        proCardText: {
            fontSize: 12,
            color: '#50575e',
            lineHeight: 1.5,
            margin: 0,
        },
        proCta: {
            textAlign: 'center',
        },
        proBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FF7853',
            color: '#ffffff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
        },
        /* Section 4: Cross-promo */
        crossSection: {
            marginTop: 28,
            paddingTop: 24,
            borderTop: '1px solid #e0e0e0',
        },
        crossCard: {
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            backgroundColor: '#fafafa',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
        },
        crossIcon: {
            fontSize: 32,
            flexShrink: 0,
        },
        crossContent: {
            flex: 1,
        },
        crossTitle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1d2327',
            margin: 0,
            marginBottom: 4,
        },
        crossText: {
            fontSize: 12,
            color: '#50575e',
            margin: 0,
            lineHeight: 1.5,
        },
        crossLink: {
            color: '#FF7853',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: 13,
            flexShrink: 0,
        },
    };

    /* ------------------------------------------------------------------ */
    /*  Derived summary data                                               */
    /* ------------------------------------------------------------------ */
    const voiceName = (listening && listening.voice)
        ? listening.voice.replace(/^Google\s+/i, '').split('(')[0].trim()
        : __('Default', 'text-to-audio');

    const playerColor = (customize && customize.backgroundColor) || '#ffffff';

    // TTS-250: the "all" sentinel means every post is tracked.
    const trackingAll = !!(analytics && analytics.trackablePostIds && analytics.trackablePostIds.includes('all'));
    const trackingCount = (analytics && analytics.enableAnalytics && analytics.trackablePostIds)
        ? analytics.trackablePostIds.length
        : 0;

    const trackingText = (analytics && analytics.enableAnalytics)
        ? (trackingAll
            ? __('All posts', 'text-to-audio')
            : sprintf(
                  /* translators: 1: number of posts being tracked, 2: post type label (e.g. "Posts") */
                  __('%1$d %2$s', 'text-to-audio'),
                  trackingCount,
                  postTypeLabel
              ))
        : __('Off', 'text-to-audio');

    return (
        <div style={styles.wrapper}>
            {/* ============================================================ */}
            {/* Section 1: Celebration                                        */}
            {/* ============================================================ */}
            <div style={styles.celebration}>
                <svg
                    style={styles.checkmark}
                    viewBox="0 0 72 72"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <circle cx="36" cy="36" r="36" fill="#00a32a" />
                    <path
                        d="M20 37L30 47L52 25"
                        stroke="#ffffff"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {goneLive ? (
                    <>
                        <h2 style={styles.heading}>
                            {__('You\u2019re live! \ud83c\udf89', 'text-to-audio')}
                        </h2>
                        <p style={styles.subheading}>
                            {sprintf(
                                /* translators: %s: post type label (e.g. "Posts", "Pages") */
                                __('The audio player is now visible to visitors on all your %s.', 'text-to-audio'),
                                postTypeLabel
                            )}
                        </p>
                        <div style={styles.buttons}>
                            {wizardData.latest_post_url && (
                                <a
                                    href={wizardData.latest_post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.btnPrimary}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ff5533'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FF7853'; }}
                                >
                                    {__('View Player on Your Site', 'text-to-audio')}
                                    <span aria-hidden="true">{'\u2197'}</span>
                                </a>
                            )}
                            <a
                                href={wizardData.dashboard_url || '#'}
                                style={styles.btnSecondary}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff5f2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                {__('Go to Dashboard', 'text-to-audio')}
                            </a>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={styles.heading}>
                            {__('Setup complete \u2014 you\u2019re in Staging', 'text-to-audio')}
                        </h2>
                        <p style={styles.subheading}>
                            {__('Your settings are saved, but the player is still hidden from visitors and no audio is generated yet. When you\u2019re happy with how your content reads, Go Live to show it on your site.', 'text-to-audio')}
                        </p>
                        <div style={styles.buttons}>
                            <button
                                type="button"
                                style={{ ...styles.btnPrimary, cursor: goingLive ? 'wait' : 'pointer', opacity: goingLive ? 0.7 : 1 }}
                                disabled={goingLive}
                                onClick={goLive}
                                onMouseEnter={(e) => { if (!goingLive) e.currentTarget.style.backgroundColor = '#ff5533'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FF7853'; }}
                            >
                                {goingLive ? __('Going live\u2026', 'text-to-audio') : __('Go Live now', 'text-to-audio')}
                                <span aria-hidden="true">{'\u2192'}</span>
                            </button>
                            <a
                                href={wizardData.dashboard_url || '#'}
                                style={styles.btnSecondary}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff5f2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                {__('Stay in Staging', 'text-to-audio')}
                            </a>
                        </div>
                        {liveErr && (
                            <p style={{ marginTop: 12, fontSize: 13, color: '#b32d2e' }}>{liveErr}</p>
                        )}
                        {docUrl && (
                            <p style={{ marginTop: 14, fontSize: 13 }}>
                                <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF7853', textDecoration: 'none', fontWeight: 500 }}>
                                    {__('How does Staging \u2192 Live work? \u2192', 'text-to-audio')}
                                </a>
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* ============================================================ */}
            {/* Section 2: Your Setup Summary                                 */}
            {/* ============================================================ */}
            <div style={styles.summarySection}>
                <h3 style={styles.summaryTitle}>
                    {__('Your Setup', 'text-to-audio')}
                </h3>
                <div style={styles.summaryRow}>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryIcon} aria-hidden="true">
                            {'\uD83C\uDF99\uFE0F'}
                        </span>
                        <span style={styles.summaryLabel}>
                            {__('Voice', 'text-to-audio')}
                        </span>
                        <span style={styles.summaryValue} title={listening ? listening.voice : ''}>
                            {voiceName}
                        </span>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryIcon} aria-hidden="true">
                            {'\uD83C\uDFA8'}
                        </span>
                        <span style={styles.summaryLabel}>
                            {__('Player', 'text-to-audio')}
                        </span>
                        <span style={styles.summaryValue}>
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    backgroundColor: playerColor,
                                    border: '1px solid #c3c4c7',
                                    verticalAlign: 'middle',
                                    marginRight: 6,
                                }}
                            />
                            {__('Customized', 'text-to-audio')}
                        </span>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryIcon} aria-hidden="true">
                            {'\uD83D\uDCCA'}
                        </span>
                        <span style={styles.summaryLabel}>
                            {__('Analytics', 'text-to-audio')}
                        </span>
                        <span style={styles.summaryValue}>
                            {trackingText}
                        </span>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* Section 3: Pro Upsell                                         */}
            {/* ============================================================ */}
            {!wizardData.is_atlasvoice_addon_functional && (
                <div style={styles.proSection}>
                    <h3 style={styles.proTitle}>
                        {__('Take it further with Pro', 'text-to-audio')}
                    </h3>
                    <p style={styles.proSubtitle}>
                        {__('Upgrade to unlock premium features that enhance your visitors\' experience.', 'text-to-audio')}
                    </p>
                    <div style={styles.proCards}>
                        <div style={styles.proCard}>
                            <span style={styles.proCardIcon} aria-hidden="true">
                                {'\uD83E\uDD16'}
                            </span>
                            <div style={styles.proCardTitle}>
                                {__('AI Voices', 'text-to-audio')}
                            </div>
                            <p style={styles.proCardText}>
                                {__('200+ natural voices from Google Cloud, ElevenLabs & OpenAI. Consistent quality for every visitor.', 'text-to-audio')}
                            </p>
                        </div>
                        <div style={styles.proCard}>
                            <span style={styles.proCardIcon} aria-hidden="true">
                                {'\uD83D\uDCE5'}
                            </span>
                            <div style={styles.proCardTitle}>
                                {__('Bulk MP3 Export', 'text-to-audio')}
                            </div>
                            <p style={styles.proCardText}>
                                {__('Auto-generate MP3 for every post. Loads instantly, works offline, boosts SEO.', 'text-to-audio')}
                            </p>
                        </div>
                        <div style={styles.proCard}>
                            <span style={styles.proCardIcon} aria-hidden="true">
                                {'\uD83D\uDCC8'}
                            </span>
                            <div style={styles.proCardTitle}>
                                {__('Deep Analytics', 'text-to-audio')}
                            </div>
                            <p style={styles.proCardText}>
                                {__('Listening time, top posts, device breakdown, geographic insights & CSV export.', 'text-to-audio')}
                            </p>
                        </div>
                    </div>
                    <div style={styles.proCta}>
                        <a
                            href={wizardData.pro_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.proBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ff5533';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FF7853';
                            }}
                        >
                            {__('Explore Pro Plans', 'text-to-audio')}
                            <span aria-hidden="true">{'\u2192'}</span>
                        </a>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Section 4: Cross-Promo — AI Agent Hub                         */}
            {/* ============================================================ */}
            <div style={styles.crossSection}>
                <div style={styles.crossCard}>
                    <span style={styles.crossIcon} aria-hidden="true">
                        {'\uD83E\uDD16'}
                    </span>
                    <div style={styles.crossContent}>
                        <h4 style={styles.crossTitle}>
                            {__('AI Workflow Automation — AI Agent Hub', 'text-to-audio')}
                        </h4>
                        <p style={styles.crossText}>
                            {__('Turn your WordPress into an AI-powered hub with 80+ abilities, MCP server, workflow builder & WooCommerce automation.', 'text-to-audio')}
                        </p>
                    </div>
                    <a
                        href="https://wordpress.org/plugins/ai-workflow-automation-ai-agent-hub/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.crossLink}
                    >
                        {__('Learn More', 'text-to-audio')}
                        {' \u2192'}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default StepFinish;
