import React, { useState, useCallback, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { wizardFetch } from './wizardApi';
import StepPostType from './steps/StepPostType';
import StepVoice from './steps/StepVoice';
import StepCustomize from './steps/StepCustomize';
import StepAnalytics from './steps/StepAnalytics';
import StepFinish from './steps/StepFinish';
import StepHearDifference from './steps/StepHearDifference';

const TOTAL_STEPS = 5;

const wizardData = window.ttsWizardData || {};

/**
 * Fire-and-forget onboarding analytics event.
 * Never throws or blocks the wizard flow.
 */
const trackOnboardingEvent = (event, step = null, data = null) => {
    try {
        const body = { event };
        if (step !== null) body.step = step;
        if (data !== null) body.data = data;

        fetch(wizardData.api_url + 'onboarding-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wizardData.nonce,
            },
            body: JSON.stringify(body),
        }).catch(() => {}); // silently ignore errors
    } catch {
        // never block the wizard
    }
};

/**
 * Main WelcomeWizard container.
 * Manages step navigation, aggregated state, and final save.
 * UI matches the Pro wizard layout: sticky header + progress bar + sticky footer.
 */
const WelcomeWizard = () => {
    const [step, setStep] = useState(1);

    const [settings, setSettings] = useState({
        postType:
            (wizardData.current_settings &&
                wizardData.current_settings
                    .tta__settings_allow_listening_for_post_types &&
                wizardData.current_settings
                    .tta__settings_allow_listening_for_post_types[0]) ||
            'post',
    });

    const [listening, setListening] = useState({
        voice:
            (wizardData.current_listening &&
                wizardData.current_listening.tta__listening_voice) ||
            '',
        lang:
            (wizardData.current_listening &&
                wizardData.current_listening.tta__listening_lang) ||
            '',
        pitch:
            (wizardData.current_listening &&
                wizardData.current_listening.tta__listening_pitch) ||
            1,
        rate:
            (wizardData.current_listening &&
                wizardData.current_listening.tta__listening_rate) ||
            1,
        volume:
            (wizardData.current_listening &&
                wizardData.current_listening.tta__listening_volume) ||
            1,
    });

    const [customize, setCustomize] = useState({
        backgroundColor:
            (wizardData.current_customize &&
                wizardData.current_customize.backgroundColor) ||
            '#ffffff',
        color:
            (wizardData.current_customize &&
                wizardData.current_customize.color) ||
            '#000000',
        border_color:
            (wizardData.current_customize &&
                wizardData.current_customize.border_color) ||
            '#000000',
        borderRadius:
            (wizardData.current_customize &&
                wizardData.current_customize.borderRadius) ||
            '10',
    });

    const [analytics, setAnalytics] = useState({
        enableAnalytics: true,
        trackablePostIds: [],
    });

    const [saving, setSaving] = useState(false);

    /** Track wizard start time for duration calculation. */
    const startTimeRef = useRef(Date.now());

    /** Fire wizard_started event on mount (fire-and-forget). */
    useEffect(() => {
        trackOnboardingEvent('wizard_started');
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Finish handler — save all endpoints in parallel                    */
    /* ------------------------------------------------------------------ */
    const handleFinish = useCallback(async () => {
        setSaving(true);
        try {
            const currentSettings = wizardData.current_settings || {};
            const currentCustomize = wizardData.current_customize || {};

            const requests = [
                wizardFetch('settings', {
                    ...currentSettings,
                    tta__settings_allow_listening_for_post_types: [
                        settings.postType,
                    ],
                    tta_onboarding_completed: true,
                }),
                wizardFetch('listening', {
                    tta__listening_voice: listening.voice,
                    tta__listening_lang: listening.lang,
                    tta__listening_pitch: listening.pitch,
                    tta__listening_rate: listening.rate,
                    tta__listening_volume: listening.volume,
                }),
                wizardFetch('customize', {
                    ...currentCustomize,
                    backgroundColor: customize.backgroundColor,
                    color: customize.color,
                    border_color: customize.border_color,
                    borderRadius: customize.borderRadius,
                }),
            ];

            // Save analytics settings (uses 'analytics' param, not 'fields').
            // TTS-246: send as JSON, not FormData, to bypass WAF rules that 403
            // form-encoded POSTs to /wp-json/* (see wizardApi.js for context).
            const analyticsBody = JSON.stringify({
                analytics: JSON.stringify({
                    tts_enable_analytics: analytics.enableAnalytics,
                    tts_trackable_post_ids: analytics.enableAnalytics
                        ? analytics.trackablePostIds
                        : [],
                }),
            });
            requests.push(
                fetch(window.ttsWizardData.api_url + 'save_analytics_settings', {
                    method: 'POST',
                    body: analyticsBody,
                    headers: {
                        'X-WP-Nonce': window.ttsWizardData.nonce,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }).then((r) => r.json())
            );

            await Promise.all(requests);

            // Track wizard completion with duration (fire-and-forget).
            const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
            trackOnboardingEvent('wizard_completed', null, {
                time_spent_seconds: String(timeSpent),
            });

            setStep(TOTAL_STEPS + 1); // Go to finish step
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Wizard save error:', err);
            alert(__('There was an error saving your settings. Please try again.', 'text-to-audio'));
        } finally {
            setSaving(false);
        }
    }, [settings, listening, customize, analytics]);

    /* ------------------------------------------------------------------ */
    /*  Skip handler — mark onboarding complete and redirect               */
    /* ------------------------------------------------------------------ */
    const handleSkip = async () => {
        try {
            const currentSettings = wizardData.current_settings || {};
            await wizardFetch('settings', {
                ...currentSettings,
                tta_onboarding_completed: true,
            });
        } catch {
            // Even if save fails, redirect to dashboard
        }
        window.location.href = wizardData.dashboard_url || (wizardData.admin_url + '?page=text-to-audio');
    };

    /* ------------------------------------------------------------------ */
    /*  Navigation                                                        */
    /* ------------------------------------------------------------------ */
    const goNext = () => {
        // Track step completion (fire-and-forget).
        trackOnboardingEvent('step_completed', step);

        if (step === TOTAL_STEPS) {
            handleFinish();
        } else {
            setStep((s) => s + 1);
        }
    };

    const goBack = () => {
        if (step > 1) setStep((s) => s - 1);
    };

    /* ------------------------------------------------------------------ */
    /*  Next button label — descriptive per step                           */
    /* ------------------------------------------------------------------ */
    const getNextLabel = () => {
        if (step === TOTAL_STEPS) {
            return saving
                ? __('Saving...', 'text-to-audio')
                : __('Finish Setup', 'text-to-audio');
        }
        const labels = {
            1: __('Next: Choose Voice', 'text-to-audio'),
            2: __('Next: Hear the Difference', 'text-to-audio'),
            3: __('Next: Customize', 'text-to-audio'),
            4: __('Next: Analytics', 'text-to-audio'),
        };
        return labels[step] || __('Next', 'text-to-audio');
    };

    /* ------------------------------------------------------------------ */
    /*  Step rendering                                                     */
    /* ------------------------------------------------------------------ */
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <StepPostType
                        data={settings}
                        onChange={setSettings}
                    />
                );
            case 2:
                return (
                    <StepVoice
                        data={listening}
                        onChange={setListening}
                    />
                );
            case 3:
                return (
                    <StepHearDifference
                        listening={listening}
                        pluginUrl={wizardData.plugin_url}
                        proUrl={wizardData.pro_url}
                    />
                );
            case 4:
                return (
                    <StepCustomize
                        data={customize}
                        onChange={setCustomize}
                    />
                );
            case 5:
                return (
                    <StepAnalytics
                        data={analytics}
                        onChange={setAnalytics}
                        selectedPostType={settings.postType}
                    />
                );
            case TOTAL_STEPS + 1:
                return (
                    <StepFinish
                        selectedPostType={settings.postType}
                        listening={listening}
                        customize={customize}
                        analytics={analytics}
                    />
                );
            default:
                return null;
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */
    return (
        <div style={styles.wrapper}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerInner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={styles.logo}>
                            {wizardData.logo_url ? (
                                <img
                                    src={wizardData.logo_url}
                                    alt="AtlasVoice"
                                    style={{ width: 24, height: 24 }}
                                />
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16.2c-3.97 0-7.2-3.23-7.2-7.2S8.03 4.8 12 4.8s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2zm-1.5-3.6l5.1-3.6-5.1-3.6v7.2z" fill="#FF7853"/>
                                </svg>
                            )}
                        </span>
                        <span style={styles.headerTitle}>
                            {__('AtlasVoice Setup', 'text-to-audio')}
                        </span>
                        {step <= TOTAL_STEPS && (
                            <span style={styles.stepBadge}>
                                {__('Step', 'text-to-audio')} {step} {__('of', 'text-to-audio')} {TOTAL_STEPS}
                            </span>
                        )}
                    </div>
                    {step <= TOTAL_STEPS && (
                        <button onClick={handleSkip} style={styles.skipBtn}>
                            {__('Skip Setup', 'text-to-audio')}
                        </button>
                    )}
                </div>
                {/* Progress bar */}
                {step <= TOTAL_STEPS && (
                    <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressBar, width: `${(step / TOTAL_STEPS) * 100}%` }} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.contentInner}>
                    {renderStep()}
                </div>
            </div>

            {/* Footer (not shown on finish screen) */}
            {step <= TOTAL_STEPS && (
                <div style={styles.footer}>
                    <div style={styles.footerInner}>
                        {step > 1 ? (
                            <button onClick={goBack} style={styles.backBtn}>
                                &larr; {__('Back', 'text-to-audio')}
                            </button>
                        ) : <div />}
                        <button
                            onClick={goNext}
                            disabled={saving}
                            style={{
                                ...styles.nextBtn,
                                opacity: saving ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#ff5533'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FF7853'; }}
                        >
                            {getNextLabel()} &rarr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: {
        minHeight: '100vh',
        background: '#f0f0f1',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        background: '#fff',
        borderBottom: '1px solid #dcdcde',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerInner: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#1d2327',
    },
    stepBadge: {
        fontSize: '13px',
        color: '#787c82',
        background: '#f0f0f1',
        padding: '4px 10px',
        borderRadius: '12px',
    },
    skipBtn: {
        background: 'none',
        border: 'none',
        color: '#787c82',
        cursor: 'pointer',
        fontSize: '13px',
        textDecoration: 'underline',
    },
    progressTrack: {
        height: '3px',
        background: '#dcdcde',
    },
    progressBar: {
        height: '100%',
        background: '#FF7853',
        transition: 'width 0.3s ease',
    },
    content: {
        flex: 1,
        padding: '40px 24px',
    },
    contentInner: {
        maxWidth: '720px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #dcdcde',
        padding: '32px',
    },
    footer: {
        background: '#fff',
        borderTop: '1px solid #dcdcde',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0,
    },
    footerInner: {
        maxWidth: '720px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        background: '#fff',
        border: '1px solid #dcdcde',
        borderRadius: '4px',
        padding: '8px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#1d2327',
    },
    nextBtn: {
        background: '#FF7853',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 24px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
    },
};

export default WelcomeWizard;
