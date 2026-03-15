import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { getDemoText } from '../demoTexts';

const wizardData = window.ttsWizardData || {};

const AUDIO_SOURCES = {
    gtts: '/admin/demos/player3/demo.mp3',
    gcloud: 'https://cloud.google.com/text-to-speech/docs/audio/en-US-Chirp3-HD-Charon.wav',
    chatgpt: 'https://cdn.openai.com/API/docs/audio/alloy.wav',
    elevenlabs: '/admin/demos/elevenlabs/demo.mp3',
};

const PRO_VOICES = [
    { id: 'gcloud', name: 'Google Cloud TTS', desc: 'Studio-quality neural voices', badge: 'Popular', badgeColor: '#FF7853' },
    { id: 'chatgpt', name: 'ChatGPT TTS', desc: 'Natural conversational tone', badge: 'Premium', badgeColor: '#8c5e00' },
    { id: 'elevenlabs', name: 'ElevenLabs', desc: 'Ultra-realistic human voices', badge: 'Most Natural', badgeColor: '#9b59b6' },
    { id: 'gtts', name: 'Google Translate', desc: 'Multi-language support', badge: 'Recommended', badgeColor: '#00a32a' },
];

/**
 * Step 3 — Hear the Difference.
 * Lets users compare their free browser voice with Pro AI voice demos.
 */
const StepHearDifference = ({ listening, pluginUrl, proUrl }) => {
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [errorCards, setErrorCards] = useState({});
    const audioRef = useRef(null);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const stopAll = () => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setCurrentlyPlaying(null);
    };

    const playBrowserVoice = () => {
        if (currentlyPlaying === 'browser') {
            stopAll();
            return;
        }
        stopAll();

        const utterance = new SpeechSynthesisUtterance(getDemoText(listening.lang));
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find((v) => v.name === listening.voice);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        utterance.pitch = parseFloat(listening.pitch) || 1;
        utterance.rate = parseFloat(listening.rate) || 1;
        utterance.volume = parseFloat(listening.volume) || 1;
        utterance.onend = () => setCurrentlyPlaying(null);
        utterance.onerror = () => setCurrentlyPlaying(null);

        setCurrentlyPlaying('browser');
        window.speechSynthesis.speak(utterance);
    };

    const playProVoice = (providerId) => {
        if (currentlyPlaying === providerId) {
            stopAll();
            return;
        }
        stopAll();

        const src = AUDIO_SOURCES[providerId];
        if (!src || !audioRef.current) return;

        const url = src.startsWith('http') ? src : (pluginUrl || '') + src;
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
            setErrorCards((prev) => ({ ...prev, [providerId]: true }));
            setCurrentlyPlaying(null);
        });
        setCurrentlyPlaying(providerId);
    };

    const voiceDisplayName = listening.voice
        ? listening.voice.replace(/^Google\s+/i, '').replace(/^Microsoft\s+/i, '')
        : __('Default', 'text-to-audio');

    return (
        <div>
            <h2 style={styles.heading}>
                {__('Hear the Difference', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__('Compare your free browser voice with Pro AI voices. Same text, dramatically different quality.', 'text-to-audio')}
            </p>

            {/* Your Current Voice */}
            <div
                style={styles.freeCard}
                onClick={playBrowserVoice}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playBrowserVoice(); }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={styles.playIcon(currentlyPlaying === 'browser')}>
                            {currentlyPlaying === 'browser' ? '\u25A0' : '\u25B6'}
                        </span>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d2327' }}>
                                {__('Your Current Voice', 'text-to-audio')}
                            </div>
                            <div style={{ fontSize: '13px', color: '#50575e', marginTop: '2px' }}>
                                {voiceDisplayName} &middot; {__('Browser TTS', 'text-to-audio')}
                            </div>
                        </div>
                    </div>
                    <span style={styles.freeBadge}>
                        {__('FREE', 'text-to-audio')}
                    </span>
                </div>
            </div>

            {/* VS Divider */}
            <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.vsCircle}>{__('VS', 'text-to-audio')}</span>
                <div style={styles.dividerLine} />
            </div>

            {/* Pro AI Voices Grid */}
            <div style={styles.proGrid}>
                {PRO_VOICES.map((provider) => (
                    <div
                        key={provider.id}
                        style={styles.proCard(currentlyPlaying === provider.id)}
                        onClick={() => !errorCards[provider.id] && playProVoice(provider.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playProVoice(provider.id); }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={styles.proBadge(provider.badgeColor)}>
                                {provider.badge}
                            </span>
                            <span style={styles.proLabel}>{__('PRO', 'text-to-audio')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {errorCards[provider.id] ? (
                                <span style={{ fontSize: '12px', color: '#787c82' }}>
                                    {__('Preview unavailable', 'text-to-audio')}
                                </span>
                            ) : (
                                <span style={styles.playIcon(currentlyPlaying === provider.id)}>
                                    {currentlyPlaying === provider.id ? '\u25A0' : '\u25B6'}
                                </span>
                            )}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2327' }}>
                                    {provider.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#646970', marginTop: '2px' }}>
                                    {provider.desc}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upgrade CTA */}
            <div style={styles.ctaBox}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d2327', marginBottom: '8px' }}>
                    {__('Unlock 200+ premium AI voices with Pro', 'text-to-audio')}
                </div>
                <p style={{ fontSize: '13px', color: '#50575e', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {__('Every visitor hears the same high-quality audio. No browser dependency, consistent across all devices.', 'text-to-audio')}
                </p>
                <a
                    href={proUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.ctaButton}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ff5533'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FF7853'; }}
                >
                    {__('Explore Pro Plans', 'text-to-audio')} &rarr;
                </a>
            </div>

            {/* Hidden audio element for Pro voice previews */}
            <audio
                ref={audioRef}
                preload="none"
                onEnded={() => setCurrentlyPlaying(null)}
                onError={() => setCurrentlyPlaying(null)}
                style={{ display: 'none' }}
            />
        </div>
    );
};

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
    freeCard: {
        padding: '16px 20px',
        borderRadius: 8,
        border: '2px solid #FF7853',
        backgroundColor: '#fff5f2',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
    },
    freeBadge: {
        fontSize: 11,
        fontWeight: 600,
        color: '#FF7853',
        backgroundColor: '#fff',
        border: '1px solid #FF7853',
        padding: '3px 10px',
        borderRadius: 3,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '20px 0',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dcdcde',
    },
    vsCircle: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '2px solid #dcdcde',
        fontSize: 12,
        fontWeight: 700,
        color: '#787c82',
        backgroundColor: '#fff',
        flexShrink: 0,
    },
    proGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },
    proCard: (isPlaying) => ({
        padding: '14px 16px',
        borderRadius: 8,
        border: isPlaying ? '2px solid #FF7853' : '1px solid #dcdcde',
        backgroundColor: isPlaying ? '#fff5f2' : '#fff',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
    }),
    proBadge: (color) => ({
        fontSize: 10,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
        padding: '2px 8px',
        borderRadius: 3,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    }),
    proLabel: {
        fontSize: 10,
        fontWeight: 600,
        color: '#FF7853',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    playIcon: (isPlaying) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: isPlaying ? '#d63638' : '#FF7853',
        color: '#fff',
        fontSize: 12,
        flexShrink: 0,
        transition: 'background-color 0.15s',
    }),
    ctaBox: {
        marginTop: 24,
        padding: '20px',
        borderRadius: 8,
        backgroundColor: '#fff5f2',
        border: '1px solid #ffd6c9',
    },
    ctaButton: {
        display: 'inline-block',
        backgroundColor: '#FF7853',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
};

export default StepHearDifference;
