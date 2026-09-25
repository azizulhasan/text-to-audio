import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { getDemoText } from '../demoTexts';
import { proUrl } from '../../proUrl';
import { GTTS_LANGUAGES, pickAtlasVoiceLanguage } from '../../components/dashboard/listening/gttsLanguages';

const wizardData = window.ttsWizardData || {};

/**
 * Step 2 — Voice & Language selection.
 *
 * @param {Object}   props
 * @param {Object}   props.data     - { voice, lang, pitch, rate, volume }
 * @param {Function} props.onChange  - Receives updated data object.
 */
const StepVoice = ({ data, onChange, ttsState }) => {
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
                    // Try to match site locale (e.g. "de_DE" → "de-DE")
                    const siteLocale = (wizardData.site_locale || '').replace('_', '-');
                    let defaultVoice = null;
                    if (siteLocale) {
                        defaultVoice = available.find((v) => v.lang === siteLocale);
                        if (!defaultVoice) {
                            // Try matching just the language part (e.g. "de")
                            const langShort = siteLocale.split('-')[0].toLowerCase();
                            defaultVoice = available.find((v) => v.lang.toLowerCase().startsWith(langShort + '-'));
                        }
                    }
                    if (!defaultVoice) {
                        // Fall back to English, then browser default, then first voice
                        defaultVoice =
                            available.find((v) => v.lang === 'en-US') ||
                            available.find((v) => v.lang.startsWith('en')) ||
                            available.find((v) => v.default) ||
                            available[0];
                    }
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
            getDemoText(data.lang)
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
            backgroundColor: isSpeaking ? '#d63638' : '#FF7853',
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
            flex: '1 1 200px',
            padding: '20px',
            borderRadius: 8,
            border: isActive
                ? '2px solid #FF7853'
                : '2px solid #c3c4c7',
            backgroundColor: isActive ? '#fff5f2' : '#ffffff',
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
            color: isActive ? '#FF7853' : '#50575e',
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
            color: '#FF7853',
            textDecoration: 'none',
            fontWeight: 500,
        },
    };

    // TTS-320: which voice engine the site will use. AtlasVoice TTS is the
    // recommended free option; the browser voice needs no sign-up; Pro adds
    // its own options as data (wizardData.voice_options). Free shows Pro only
    // as an information card, never as an option that does nothing.
    const tts = ttsState || wizardData.atlasvoice_tts || {};
    const proOptions = Array.isArray(wizardData.voice_options) ? wizardData.voice_options : [];
    const engine = data.engine || 'browser';
    const setEngine = (next) => onChange({ ...data, engine: next, connectError: '' });
    const activeProOption = proOptions.find((o) => Number(o.player_id) === Number(tts.playerId));
    const currentEngine = tts.connected && Number(tts.playerId) === 3
        ? 'tts'
        : activeProOption ? activeProOption.id : 'browser';

    const tagFor = (id, fallback) => (id === currentEngine ? __('Currently active', 'text-to-audio') : fallback);

    const renderCard = (id, tag, title, text, extra = null) => (
        <button
            key={id}
            type="button"
            role="radio"
            aria-checked={engine === id}
            onClick={() => setEngine(id)}
            style={{ ...styles.card(engine === id), textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
        >
            <span style={styles.cardBadge(engine === id)}>{tag}</span>
            <h3 style={styles.cardTitle}>{title}</h3>
            <p style={styles.cardText}>{text}</p>
            {extra}
        </button>
    );

    const ttsLang = data.ttsLang || pickAtlasVoiceLanguage(data.lang || wizardData.site_locale);

    return (
        <div>
            <h2 style={styles.heading}>
                {__('How should your posts sound?', 'text-to-audio')}
            </h2>
            <p style={styles.description}>
                {__('Pick how visitors will hear your posts. You can change this any time in Listening.', 'text-to-audio')}
            </p>

            <div role="radiogroup" aria-label={__('Voice', 'text-to-audio')} style={{ ...styles.cardsRow, flexWrap: 'wrap', marginTop: 0, marginBottom: 24 }}>
                {renderCard(
                    'tts',
                    tagFor('tts', tts.connected ? __('Connected', 'text-to-audio') : __('Recommended', 'text-to-audio')),
                    __('AtlasVoice TTS — Natural voice', 'text-to-audio'),
                    __('The same natural voice for every visitor, saved as an MP3. Free for 100,000 characters a month (about 15 posts). Needs your email.', 'text-to-audio')
                )}
                {renderCard(
                    'browser',
                    tagFor('browser', __('No sign-up', 'text-to-audio')),
                    __('Browser Voices (Free)', 'text-to-audio'),
                    __('Good for basic accessibility. Quality depends on the visitor\'s browser and device.', 'text-to-audio')
                )}
                {proOptions.map((option) => renderCard(
                    option.id,
                    tagFor(option.id, option.tag),
                    option.title,
                    option.text
                ))}
                {!wizardData.is_atlasvoice_addon_functional && (
                    <div style={{ ...styles.card(false), textAlign: 'left' }}>
                        <span style={styles.cardBadge(false)}>{__('Pro', 'text-to-audio')}</span>
                        <h3 style={styles.cardTitle}>{__('AtlasVoice Cloud — Premium voices', 'text-to-audio')}</h3>
                        <p style={styles.cardText}>
                            {__('Premium natural voices, included in the Pro licence. Pro can also connect your own Google Cloud, ElevenLabs or OpenAI account; those companies bill you directly.', 'text-to-audio')}{' '}
                            <a href={proUrl('voice_step')} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                {__('Upgrade to Pro', 'text-to-audio')}
                            </a>
                        </p>
                    </div>
                )}
            </div>

            {engine === 'tts' && (
                <div>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="tts_wiz_tts_lang">
                            {__('Language', 'text-to-audio')}
                        </label>
                        <select
                            id="tts_wiz_tts_lang"
                            style={styles.select}
                            value={ttsLang}
                            onChange={(e) => onChange({ ...data, ttsLang: e.target.value })}
                        >
                            {Object.entries(GTTS_LANGUAGES).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {tts.connected ? (
                        <p style={styles.cardText}>
                            {tts.pending
                                ? __('Connected. Confirm the email we sent you; visitors hear the browser voice until then.', 'text-to-audio')
                                : __('This site is connected to AtlasVoice TTS.', 'text-to-audio')}
                        </p>
                    ) : (
                        <div style={{ background: '#fff5f2', border: '1px solid #ffd2c2', borderRadius: 6, padding: 16 }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label} htmlFor="tts_wiz_email">
                                    {__('Email for your free AtlasVoice account', 'text-to-audio')}
                                </label>
                                <input
                                    id="tts_wiz_email"
                                    type="email"
                                    style={{ ...styles.select, backgroundImage: 'none', cursor: 'text' }}
                                    value={data.email || ''}
                                    onChange={(e) => onChange({ ...data, email: e.target.value })}
                                />
                            </div>
                            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#1d2327' }}>
                                <input
                                    type="checkbox"
                                    checked={!!data.consent}
                                    onChange={(e) => onChange({ ...data, consent: e.target.checked })}
                                    style={{ marginTop: 3 }}
                                />
                                <span>
                                    {__('I agree to send this site\'s address, the text of posts I make audio for, and this email to the AtlasVoice service to create audio.', 'text-to-audio')}{' '}
                                    <a href={tts.termsUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>{__('Terms', 'text-to-audio')}</a>
                                    {' · '}
                                    <a href={tts.privacyUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>{__('Privacy', 'text-to-audio')}</a>
                                </span>
                            </label>
                            <p style={{ ...styles.cardText, marginTop: 10 }}>
                                {__('We\'ll email you a link. Keep going with the setup in the meantime; visitors hear the browser voice until you click it. Nothing is sent until you press Connect and continue.', 'text-to-audio')}
                            </p>
                            {data.connectError && (
                                <p style={{ ...styles.cardText, color: '#b32d2e', marginTop: 8 }}>{data.connectError}</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setEngine('browser')}
                                style={{ background: 'none', border: 0, padding: 0, marginTop: 10, color: '#50575e', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
                            >
                                {__('Use the browser voice for now', 'text-to-audio')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {engine === 'browser' && (
                <div>
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
                                e.currentTarget.style.backgroundColor = '#ff5533';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = speaking
                                ? '#d63638'
                                : '#FF7853';
                        }}
                    >
                        <span style={{ fontSize: 16 }}>
                            {speaking ? '■' : '▶'}
                        </span>
                        {speaking
                            ? __('Stop Preview', 'text-to-audio')
                            : __('Preview Voice', 'text-to-audio')}
                    </button>
                </div>
            )}

            {proOptions.filter((o) => o.id === engine && o.detail).map((option) => (
                <p key={option.id} style={styles.cardText}>{option.detail}</p>
            ))}
        </div>
    );
};

export default StepVoice;
