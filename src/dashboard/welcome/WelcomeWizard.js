import React, { useState, useCallback, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { wizardFetch } from './wizardApi';
import StepPostType from './steps/StepPostType';
import StepVoice from './steps/StepVoice';
import StepCustomize from './steps/StepCustomize';
import StepAnalytics from './steps/StepAnalytics';
import StepFinish from './steps/StepFinish';

const TOTAL_STEPS = 4;

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
            const analyticsFormData = new FormData();
            analyticsFormData.append('analytics', JSON.stringify({
                tts_enable_analytics: analytics.enableAnalytics,
                tts_trackable_post_ids: analytics.enableAnalytics
                    ? analytics.trackablePostIds
                    : [],
            }));
            requests.push(
                fetch(window.ttsWizardData.api_url + 'save_analytics_settings', {
                    method: 'POST',
                    body: analyticsFormData,
                    headers: { 'X-WP-Nonce': window.ttsWizardData.nonce },
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
        } finally {
            setSaving(false);
        }
    }, [settings, listening, customize, analytics]);

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
                    <StepCustomize
                        data={customize}
                        onChange={setCustomize}
                    />
                );
            case 4:
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
    /*  Progress dots                                                      */
    /* ------------------------------------------------------------------ */
    const stepLabels = [
        __('Post Type', 'text-to-audio'),
        __('Voice', 'text-to-audio'),
        __('Customize', 'text-to-audio'),
        __('Analytics', 'text-to-audio'),
    ];

    const renderDots = () => {
        const dots = [];
        for (let i = 1; i <= TOTAL_STEPS; i++) {
            const isCurrent = i === step;
            const isCompleted = i < step;
            dots.push(
                <span
                    key={i}
                    role="listitem"
                    aria-label={stepLabels[i - 1]}
                    aria-current={isCurrent ? 'step' : undefined}
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor:
                            i <= step ? '#2271b1' : '#c3c4c7',
                        display: 'inline-block',
                        margin: '0 4px',
                        transition: 'background-color 0.2s',
                    }}
                />
            );
        }
        return dots;
    };

    /* ------------------------------------------------------------------ */
    /*  Inline styles                                                      */
    /* ------------------------------------------------------------------ */
    const styles = {
        overlay: {
            minHeight: '100vh',
            backgroundColor: '#f0f0f1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: 60,
            paddingBottom: 60,
            fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        },
        card: {
            width: '100%',
            maxWidth: 700,
            backgroundColor: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: 40,
            boxSizing: 'border-box',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 12,
        },
        logoWrap: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        },
        logoText: {
            fontSize: 20,
            fontWeight: 600,
            color: '#1d2327',
            margin: 0,
        },
        badge: {
            fontSize: 13,
            color: '#50575e',
            backgroundColor: '#f0f6fc',
            padding: '4px 12px',
            borderRadius: 4,
        },
        stepIndicator: {
            textAlign: 'center',
            marginBottom: 24,
        },
        stepText: {
            fontSize: 13,
            color: '#50575e',
            marginBottom: 8,
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #e0e0e0',
        },
        btnPrimary: {
            backgroundColor: '#2271b1',
            color: '#ffffff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
        },
        btnSecondary: {
            backgroundColor: 'transparent',
            color: '#50575e',
            border: '1px solid #c3c4c7',
            padding: '10px 24px',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
        },
    };

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */
    if (step === TOTAL_STEPS + 1) {
        return (
            <div style={styles.overlay}>
                <div style={styles.card}>
                    <StepFinish
                        selectedPostType={settings.postType}
                        listening={listening}
                        customize={customize}
                        analytics={analytics}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoWrap}>
                        {wizardData.logo_url && (
                            <img
                                src={wizardData.logo_url}
                                alt="AtlasVoice"
                                style={{ width: 32, height: 32 }}
                            />
                        )}
                        <h1 style={styles.logoText}>
                            {__('AtlasVoice', 'text-to-audio')}
                        </h1>
                    </div>
                    <span style={styles.badge}>
                        {__('Setup Wizard', 'text-to-audio')}
                    </span>
                </div>

                {/* Step indicator */}
                <nav style={styles.stepIndicator} aria-label={__('Setup progress', 'text-to-audio')}>
                    <div style={styles.stepText} aria-live="polite">
                        {__('Step', 'text-to-audio')}{' '}
                        {step}{' '}
                        {__('of', 'text-to-audio')}{' '}
                        {TOTAL_STEPS}
                    </div>
                    <div role="list" aria-label={__('Setup steps', 'text-to-audio')}>{renderDots()}</div>
                </nav>

                {/* Content */}
                <div>{renderStep()}</div>

                {/* Footer */}
                <div style={styles.footer}>
                    <div>
                        {step > 1 && (
                            <button
                                type="button"
                                style={styles.btnSecondary}
                                onClick={goBack}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        '#f6f7f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        'transparent';
                                }}
                            >
                                {__('Back', 'text-to-audio')}
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        style={{
                            ...styles.btnPrimary,
                            opacity: saving ? 0.7 : 1,
                            cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                        onClick={goNext}
                        disabled={saving}
                        onMouseEnter={(e) => {
                            if (!saving)
                                e.currentTarget.style.backgroundColor =
                                    '#135e96';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                '#2271b1';
                        }}
                    >
                        {saving
                            ? __('Saving...', 'text-to-audio')
                            : step === TOTAL_STEPS
                            ? __('Finish Setup', 'text-to-audio')
                            : __('Next', 'text-to-audio')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeWizard;
