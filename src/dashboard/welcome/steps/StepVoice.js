import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';

const wizardData = window.ttsWizardData || {};

/**
 * Step 2 — Voice & Language selection.
 *
 * @param {Object}   props
 * @param {Object}   props.data     - { voice, lang, pitch, rate, volume }
 * @param {Function} props.onChange  - Receives updated data object.
 */
const StepVoice = ({ data, onChange }) => {
    const [voices, setVoices] = useState([]);
    const [speaking, setSpeaking] = useState(false);
    const utteranceRef = useRef(null);

    /* ------------------------------------------------------------------ */
    /*  Load browser voices (may arrive asynchronously)                    */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            if (available.length) {
                setVoices(available);

                // Set defaults if not already configured
                if (!data.voice && available.length > 0) {
                    const defaultVoice =
                        available.find((v) => v.default) || available[0];
                    onChange({
                        ...data,
                        voice: defaultVoice.name,
                        lang: defaultVoice.lang,
                    });
                }
            }
        };

        loadVoices();
        window.speechSynthesis.addEventListener(
            'voiceschanged',
            loadVoices
        );

        return () => {
            window.speechSynthesis.removeEventListener(
                'voiceschanged',
                loadVoices
            );
            window.speechSynthesis.cancel();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ------------------------------------------------------------------ */
    /*  Derived data                                                       */
    /* ------------------------------------------------------------------ */
    const uniqueLangs = Array.from(
        new Set(voices.map((v) => v.lang))
    ).sort();

    const filteredVoices = data.lang
        ? voices.filter((v) => v.lang === data.lang)
        : voices;

    /* ------------------------------------------------------------------ */
    /*  Handlers                                                           */
    /* ------------------------------------------------------------------ */
    const handleLangChange = (lang) => {
        const matchingVoices = voices.filter((v) => v.lang === lang);
        const firstVoice =
            matchingVoices.length > 0 ? matchingVoices[0].name : '';
        onChange({ ...data, lang, voice: firstVoice });
    };

    const handleVoiceChange = (voiceName) => {
        const selectedVoice = voices.find((v) => v.name === voiceName);
        onChange({
            ...data,
            voice: voiceName,
            lang: selectedVoice ? selectedVoice.lang : data.lang,
        });
    };

    const handlePreview = () => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
            __(
                'Welcome to your site. Your visitors can now listen to your content with one click.',
                'text-to-audio'
            )
        );

        const selectedVoice = voices.find((v) => v.name === data.voice);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }

        utterance.pitch = parseFloat(data.pitch) || 1;
        utterance.rate = parseFloat(data.rate) || 1;
        utterance.volume = parseFloat(data.volume) || 1;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setSpeaking(false);
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
        fieldGroup: {
            marginBottom: 20,
        },
        label: {
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#1d2327',
            marginBottom: 6,
        },
        select: {
            width: '100%',
            maxWidth: '100%',
            padding: '10px 32px 10px 12px',
            fontSize: 14,
            border: '1px solid #c3c4c7',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            color: '#1d2327',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%2350575e\' d=\'M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '12px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            lineHeight: 1.4,
        },
        previewBtn: (isSpeaking) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: isSpeaking ? '#d63638' : '#2271b1',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: 4,
            transition: 'background-color 0.15s',
        }),
        cardsRow: {
            display: 'flex',
            gap: 16,
            marginTop: 28,
        },
        card: (isActive) => ({
            flex: 1,
            padding: '20px',
            borderRadius: 8,
            border: isActive
                ? '2px solid #2271b1'
                : '2px solid #c3c4c7',
            backgroundColor: isActive ? '#f0f6fc' : '#ffffff',
        }),
        cardTitle: {
            fontSize: 15,
            fontWeight: 600,
            color: '#1d2327',
            marginTop: 0,
            marginBottom: 4,
        },
        cardBadge: (isActive) => ({
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 600,
            color: isActive ? '#2271b1' : '#50575e',
            backgroundColor: isActive ? '#dce8f4' : '#f0f0f1',
            padding: '2px 8px',
            borderRadius: 3,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        }),
        cardText: {
            fontSize: 13,
            color: '#50575e',
            lineHeight: 1.5,
            margin: 0,
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
                {__('Choose your voice and language', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__(
                    'Select a browser voice for your audio player. Visitors will hear content read aloud using the Web Speech API.',
                    'text-to-audio'
                )}
            </p>

            {/* Language dropdown */}
            <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="tts_wiz_lang">
                    {__('Language', 'text-to-audio')}
                </label>
                <select
                    id="tts_wiz_lang"
                    style={styles.select}
                    value={data.lang}
                    onChange={(e) => handleLangChange(e.target.value)}
                >
                    <option value="">
                        {__('All Languages', 'text-to-audio')}
                    </option>
                    {uniqueLangs.map((lang) => (
                        <option key={lang} value={lang}>
                            {lang}
                        </option>
                    ))}
                </select>
            </div>

            {/* Voice dropdown */}
            <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="tts_wiz_voice">
                    {__('Voice', 'text-to-audio')}
                </label>
                <select
                    id="tts_wiz_voice"
                    style={styles.select}
                    value={data.voice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                >
                    {filteredVoices.length === 0 && (
                        <option value="">
                            {__('Loading voices...', 'text-to-audio')}
                        </option>
                    )}
                    {filteredVoices.map((v) => (
                        <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                        </option>
                    ))}
                </select>
            </div>

            {/* Preview button */}
            <button
                type="button"
                style={styles.previewBtn(speaking)}
                onClick={speaking ? handleStop : handlePreview}
                onMouseEnter={(e) => {
                    if (!speaking) {
                        e.currentTarget.style.backgroundColor = '#135e96';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = speaking
                        ? '#d63638'
                        : '#2271b1';
                }}
            >
                <span style={{ fontSize: 16 }}>
                    {speaking ? '\u25A0' : '\u25B6'}
                </span>
                {speaking
                    ? __('Stop Preview', 'text-to-audio')
                    : __('Preview Voice', 'text-to-audio')}
            </button>

            {/* Info cards */}
            <div style={styles.cardsRow}>
                {/* Browser voices card */}
                <div style={styles.card(true)}>
                    <span style={styles.cardBadge(true)}>
                        {__('Currently Active', 'text-to-audio')}
                    </span>
                    <h3 style={styles.cardTitle}>
                        {__('Browser Voices (Free)', 'text-to-audio')}
                    </h3>
                    <p style={styles.cardText}>
                        {__(
                            'Good for basic accessibility. Quality depends on visitor\'s browser and device.',
                            'text-to-audio'
                        )}
                    </p>
                </div>

                {/* AI voices card */}
                <div style={styles.card(false)}>
                    <span style={styles.cardBadge(false)}>
                        {__('Pro', 'text-to-audio')}
                    </span>
                    <h3 style={styles.cardTitle}>
                        {__('AI Voices — Natural & Consistent', 'text-to-audio')}
                    </h3>
                    <p style={styles.cardText}>
                        {__(
                            'Google Cloud TTS, ElevenLabs, ChatGPT TTS. 200+ premium voices. Same quality for every visitor.',
                            'text-to-audio'
                        )}{' '}
                        <a
                            href={wizardData.pro_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.link}
                        >
                            {__('Upgrade to Pro', 'text-to-audio')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StepVoice;
