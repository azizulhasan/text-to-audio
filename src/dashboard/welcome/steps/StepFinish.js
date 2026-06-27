import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { proUrl } from '../../proUrl';

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
        // TTS-258: Pro upsell button — sky-blue fill + star. Blue reads as
        // trust (vs. an aggressive dark fill) and stays distinct from the
        // primary (orange) and secondary (outline) actions. Sky-600 (not a
        // pale sky-500) keeps the white label legible (contrast).
        btnPro: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#0284c7',
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
        /* Section 4: Explore all AtlasAiDev plugins */
        crossSection: {
            marginTop: 28,
            paddingTop: 24,
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
        },
        exploreBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 300,
            padding: '14px 22px',
            backgroundColor: '#ffffff',
            border: '1px solid #dcdcde',
            borderRadius: 10,
            textDecoration: 'none',
            color: '#1d2327',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
            cursor: 'pointer',
        },
        exploreIcon: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: '#fff5f2',
            color: '#FF7853',
            flexShrink: 0,
        },
        exploreLabel: {
            flex: 1,
            textAlign: 'left',
        },
        exploreArrow: {
            color: '#FF7853',
            fontSize: 16,
            flexShrink: 0,
        },
    };

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
                            {!wizardData.is_atlasvoice_addon_functional && (
                                <a
                                    href={proUrl('finish_upgrade_btn')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.btnPro}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0369a1'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0284c7'; }}
                                >
                                    <span aria-hidden="true">{'★'}</span>
                                    {__('Upgrade to Pro', 'text-to-audio')}
                                </a>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={styles.heading}>
                            {__('Setup complete \u2014 you\u2019re in Staging', 'text-to-audio')}
                        </h2>
                        <p style={styles.subheading}>
                            {__('Your settings are saved, but the player is still hidden from visitors. When you\u2019re happy with how your content reads, Go Live to show the player on your site.', 'text-to-audio')}
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
            {/* Section 3: Pro Upsell                                         */}
            {/* ============================================================ */}
            {!wizardData.is_atlasvoice_addon_functional && (
                <div style={styles.proSection}>
                    <h3 style={styles.proTitle}>
                        {__('Hear the difference with Pro', 'text-to-audio')}
                    </h3>
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
                            href={proUrl('finish_explore_plans')}
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
                <a
                    href={(wizardData.admin_url || '') + 'admin.php?page=atlasvoice-other-plugins'}
                    style={styles.exploreBtn}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FF7853';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,120,83,0.18)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#dcdcde';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    <span style={styles.exploreIcon} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                        </svg>
                    </span>
                    <span style={styles.exploreLabel}>
                        {__('Explore all AtlasAiDev plugins', 'text-to-audio')}
                    </span>
                    <span style={styles.exploreArrow} aria-hidden="true">{'→'}</span>
                </a>
            </div>
        </div>
    );
};

export default StepFinish;
