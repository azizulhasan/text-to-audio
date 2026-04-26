import React, { useEffect, useState, useRef } from "react";
import { __ } from "@wordpress/i18n";

//TODO : Need to apply onClick function to all icons and dynamic  custom class on demand
import { Close, Play, Replay, Settings, SoundWave, Speed, VoiceOver, Pause } from "../assets/icons/TTSIcons";

let speech = null
let TextToSpeechPro = null;

// Auto-close timeout duration (15 seconds)
const MODAL_AUTO_CLOSE_TIMEOUT = 15000;
// TTS-241 — resolve text + icon for a state, preferring buttonTexts
// per-player overrides, falling back to the legacy textArr flat keys
// (used on the front-end where the prop isn't passed).
const resolveStateText = (buttonTexts, playerId, state, flatKey) => {
    const perPlayer = buttonTexts?.players?.[playerId]?.[state]?.text;
    if (perPlayer) return perPlayer;
    const flat = (typeof window !== 'undefined' ? window?.TTS?.settings?.textArr : null) || {};
    const flatPlayers = flat.players?.[playerId]?.[state]?.text;
    if (flatPlayers) return flatPlayers;
    return flat[flatKey];
};

const resolveStateIcon = (buttonTexts, playerId, state) => {
    const perPlayer = buttonTexts?.players?.[playerId]?.[state]?.icon;
    if (perPlayer) return perPlayer;
    const flat = (typeof window !== 'undefined' ? window?.TTS?.settings?.textArr : null) || {};
    return flat.players?.[playerId]?.[state]?.icon || '';
};

const renderResolvedIcon = (descriptor) => {
    if (!descriptor) return null;
    let svg = '';
    if (descriptor.startsWith('preset:')) {
        const key = descriptor.slice(7);
        const presets = (typeof window !== 'undefined' ? window?.ttsObj?.player_customizations : null) || {};
        // preset_svgs aren't shipped to frontend — use first player_customizations entry as best-effort
        for (const pid of Object.keys(presets)) {
            if (presets[pid] && presets[pid][key]) { svg = presets[pid][key]; break; }
        }
    } else if (descriptor.startsWith('custom:')) {
        svg = descriptor.slice(7);
    } else {
        svg = descriptor;
    }
    if (!svg) return null;
    return svg.replace(/\$color/g, 'currentColor');
};

const TextToSpeech = ({ buttonId, button, cssStyle = '', buttonCSS = {}, buttonLiveCSS = {}, buttonTexts = null, playerId = null }) => {
    const _resolvedPlayerId = playerId || (typeof window !== 'undefined' ? Number(window?.ttsObj?.player_id) : 1) || 1;
    const [isFirstPlayerPlay, setFirstPlayerPlay] = useState(true);
    const [isSecondPlayerPlay, setSecondPlayerPlay] = useState(false);
    const [isSettingOpen, setSettingOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSelectSpeed, setIsSelectedSpeed] = useState(false);
    const [isSelectVoice, setIsSelectedVoice] = useState(false);
    const [listenStatus, setListenStatus] = useState('listen')
    const [decrementInterval, setDecrementInterval] = useState(null)
    const [incrementInterval, setIncrementInterval] = useState(null)
    const [incrementDeadline, setIncrementDeadline] = useState(0)
    const [incrementedTime, setIncrementedTime] = useState(0)
    const [decrementDeadline, setDecrementDeadline] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isResumed, setIsResumed] = useState(false)
    const [progressbarValue, setProgressbarValue] = useState(0)
    const [shouldFloat, setShouldFloat] = useState(false)
    const originalTopRef = useRef(null)
    const [isSeeking, setIsSeeking] = useState(false)

    // Settings panel states
    const [availableVoices, setAvailableVoices] = useState([])
    const [filteredVoices, setFilteredVoices] = useState([])
    const [availableLanguages, setAvailableLanguages] = useState([])
    const [currentLanguage, setCurrentLanguage] = useState('')
    const [currentVoice, setCurrentVoice] = useState('')
    const [currentRate, setCurrentRate] = useState(1)
    const [currentPitch, setCurrentPitch] = useState(1)
    const [currentVolume, setCurrentVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [previousVolume, setPreviousVolume] = useState(1)
    const [isApplyingSettings, setIsApplyingSettings] = useState(false)
    const [isModalAnimating, setIsModalAnimating] = useState(false)

    // Ref for auto-close timer
    const modalAutoCloseTimer = useRef(null)

    // Refs for interval timers (to ensure we can clear them reliably)
    const incrementIntervalRef = useRef(null)
    const decrementIntervalRef = useRef(null)


    /**
     * Open/close settings modal with animation
     */
    const handleSetting = (e) => {
        if (e) e.preventDefault();

        if (isSettingOpen) {
            // Close modal with animation
            closeSettingsModal();
        } else {
            // Open modal with animation
            openSettingsModal();
        }
    };

    /**
     * Open settings modal with scale animation
     */
    const openSettingsModal = () => {
        setIsModalAnimating(true);
        setSettingOpen(true);
        startAutoCloseTimer();
        // Animation completes after a short delay
        setTimeout(() => setIsModalAnimating(false), 200);
    };

    /**
     * Close settings modal with scale animation
     */
    const closeSettingsModal = () => {
        setIsModalAnimating(true);
        clearAutoCloseTimer();
        // Wait for close animation before hiding
        setTimeout(() => {
            setSettingOpen(false);
            setIsModalAnimating(false);
        }, 150);
    };

    /**
     * Start auto-close timer (15 seconds)
     */
    const startAutoCloseTimer = () => {
        clearAutoCloseTimer();
        modalAutoCloseTimer.current = setTimeout(() => {
            if (isSettingOpen) {
                closeSettingsModal();
            }
        }, MODAL_AUTO_CLOSE_TIMEOUT);
    };

    /**
     * Clear auto-close timer
     */
    const clearAutoCloseTimer = () => {
        if (modalAutoCloseTimer.current) {
            clearTimeout(modalAutoCloseTimer.current);
            modalAutoCloseTimer.current = null;
        }
    };

    /**
     * Reset auto-close timer on user interaction
     */
    const resetAutoCloseTimer = () => {
        if (isSettingOpen) {
            startAutoCloseTimer();
        }
    };

    /**
     * Handle backdrop click to close modal
     */
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeSettingsModal();
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => clearAutoCloseTimer();
    }, []);

    const handleChangeSpeed = () => {
        setIsSelectedSpeed(!isSelectSpeed);
        setIsSelectedVoice(false); // Hide the voice button
    };

    const handleChangeVoice = () => {
        setIsSelectedVoice(!isSelectVoice);
        setIsSelectedSpeed(false); // Hide the speed button
    };

    /**
     * Load settings from localStorage on component mount
     */
    const loadSettingsFromStorage = () => {
        const savedSettings = localStorage.getItem('tts_player_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.rate) setCurrentRate(parseFloat(settings.rate));
                if (settings.pitch) setCurrentPitch(parseFloat(settings.pitch));
                if (settings.volume) setCurrentVolume(parseFloat(settings.volume));
                if (settings.language) setCurrentLanguage(settings.language);
                if (settings.voice) setCurrentVoice(settings.voice);
                if (settings.isMuted !== undefined) setIsMuted(settings.isMuted);
                return settings;
            } catch (e) {
                console.error('Error loading TTS settings from localStorage:', e);
            }
        }
        return null;
    };

    /**
     * Save settings to localStorage
     */
    const saveSettingsToStorage = (settings) => {
        try {
            const currentSettings = JSON.parse(localStorage.getItem('tts_player_settings') || '{}');
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem('tts_player_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error('Error saving TTS settings to localStorage:', e);
        }
    };

    /**
     * Load available voices from browser
     */
    const loadBrowserVoices = () => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setAvailableVoices(voices);

                // Get admin-configured language from settings
                const adminLang = window?.TTS?.settings?.listening?.tta__listening_lang || 'en';
                const adminVoice = window?.TTS?.settings?.listening?.tta__listening_voice || '';

                // Extract unique languages that match admin language
                const langCode = getCountryCode(adminLang);
                const matchingVoices = voices.filter(voice => {
                    const voiceLangCode = getCountryCode(voice.lang);
                    return voiceLangCode.toLowerCase() === langCode.toLowerCase();
                });

                // Get unique language codes from matching voices
                const uniqueLangs = [...new Set(matchingVoices.map(v => v.lang))];
                setAvailableLanguages(uniqueLangs);
                setFilteredVoices(matchingVoices);

                // Load saved settings or use defaults
                const savedSettings = loadSettingsFromStorage();
                if (savedSettings) {
                    // Validate saved voice exists in current browser
                    const savedVoiceExists = matchingVoices.some(v => v.name === savedSettings.voice);
                    if (!savedVoiceExists && matchingVoices.length > 0) {
                        setCurrentVoice(adminVoice || matchingVoices[0].name);
                    }
                    // Validate saved language exists
                    const savedLangExists = uniqueLangs.includes(savedSettings.language);
                    if (!savedLangExists && uniqueLangs.length > 0) {
                        setCurrentLanguage(matchingVoices[0]?.lang || adminLang);
                    }
                } else {
                    // Set defaults from admin settings
                    if (matchingVoices.length > 0) {
                        const defaultVoice = matchingVoices.find(v => v.name === adminVoice) || matchingVoices[0];
                        setCurrentLanguage(defaultVoice.lang);
                        setCurrentVoice(defaultVoice.name);
                    }
                    // Set default rate, pitch, volume from admin settings
                    const listeningSettings = window?.TTS?.settings?.listening || {};
                    setCurrentRate(parseFloat(listeningSettings.tta__listening_rate) || 1);
                    setCurrentPitch(parseFloat(listeningSettings.tta__listening_pitch) || 1);
                    setCurrentVolume(parseFloat(listeningSettings.tta__listening_volume) || 1);
                }

                return true;
            }
            return false;
        };

        // Try to load voices immediately
        if (!loadVoices()) {
            // If voices aren't loaded yet, wait for them
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    };

    /**
     * Get country code from language string (e.g., 'en-US' -> 'en')
     */
    const getCountryCode = (lang) => {
        if (!lang) return '';
        if (lang.indexOf('-') !== -1) return lang.split('-')[0];
        if (lang.indexOf('_') !== -1) return lang.split('_')[0];
        return lang;
    };

    /**
     * Filter voices when language changes
     */
    const filterVoicesByLanguage = (lang) => {
        const langCode = getCountryCode(lang);
        const matching = availableVoices.filter(voice => {
            const voiceLangCode = getCountryCode(voice.lang);
            return voiceLangCode.toLowerCase() === langCode.toLowerCase();
        });
        setFilteredVoices(matching);
        return matching;
    };

    /**
     * Handle language change
     */
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setCurrentLanguage(newLang);
        saveSettingsToStorage({ language: newLang });
        resetAutoCloseTimer();

        // Filter voices for new language and select first one
        const matching = filterVoicesByLanguage(newLang);
        if (matching.length > 0) {
            const newVoice = matching[0].name;
            setCurrentVoice(newVoice);
            saveSettingsToStorage({ voice: newVoice });
        }

        // Apply settings if currently playing
        if (speech && listenStatus !== 'listen') {
            applySettingsAndRestart();
        }
    };

    /**
     * Handle voice change
     */
    const handleVoiceChange = (e) => {
        const newVoice = e.target.value;
        setCurrentVoice(newVoice);
        saveSettingsToStorage({ voice: newVoice });
        resetAutoCloseTimer();

        // Find the language for this voice
        const voiceObj = availableVoices.find(v => v.name === newVoice);
        if (voiceObj && voiceObj.lang !== currentLanguage) {
            setCurrentLanguage(voiceObj.lang);
            saveSettingsToStorage({ language: voiceObj.lang });
        }

        // Apply settings if currently playing
        if (speech && listenStatus !== 'listen') {
            applySettingsAndRestart();
        }
    };

    /**
     * Handle rate/speed change
     */
    const handleRateChange = (e) => {
        const newRate = parseFloat(e.target.value);
        setCurrentRate(newRate);
        saveSettingsToStorage({ rate: newRate });
        resetAutoCloseTimer();

        // Apply settings if currently playing
        if (speech && listenStatus !== 'listen') {
            applySettingsAndRestart();
        }
    };

    /**
     * Handle pitch change
     */
    const handlePitchChange = (e) => {
        const newPitch = parseFloat(e.target.value);
        setCurrentPitch(newPitch);
        saveSettingsToStorage({ pitch: newPitch });
        resetAutoCloseTimer();

        // Apply settings if currently playing
        if (speech && listenStatus !== 'listen') {
            applySettingsAndRestart();
        }
    };

    /**
     * Handle volume change - restarts speech from current position
     */
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setCurrentVolume(newVolume);
        setIsMuted(newVolume === 0);
        saveSettingsToStorage({ volume: newVolume, isMuted: newVolume === 0 });
        resetAutoCloseTimer();

        // Apply settings and restart speech if currently playing
        if (speech && listenStatus !== 'listen') {
            applySettingsAndRestart({ volume: newVolume });
        }
    };

    /**
     * Toggle mute - restarts speech from current position
     */
    const handleMuteToggle = () => {
        resetAutoCloseTimer();

        let newVolume;
        if (isMuted) {
            // Unmute - restore previous volume
            newVolume = previousVolume;
            setCurrentVolume(previousVolume);
            setIsMuted(false);
            saveSettingsToStorage({ volume: previousVolume, isMuted: false });
        } else {
            // Mute - save current volume and set to 0
            newVolume = 0;
            setPreviousVolume(currentVolume);
            setCurrentVolume(0);
            setIsMuted(true);
            saveSettingsToStorage({ volume: 0, isMuted: true });
        }

        // Apply settings and restart speech if currently playing
        if (speech && listenStatus !== 'listen') {
            // Pass volume override since state hasn't updated yet
            applySettingsAndRestart({ volume: newVolume });
        }
    };

    /**
     * Apply new settings and restart speech from current position
     * @param {Object} overrides - Optional overrides for settings (useful when state hasn't updated yet)
     */
    const applySettingsAndRestart = (overrides = {}) => {
        if (!speech || !speech.speech) return;

        setIsApplyingSettings(true);

        // Use overrides if provided, otherwise use state values
        const rate = overrides.rate !== undefined ? overrides.rate : currentRate;
        const pitch = overrides.pitch !== undefined ? overrides.pitch : currentPitch;
        const volume = overrides.volume !== undefined ? overrides.volume : currentVolume;
        const language = overrides.language !== undefined ? overrides.language : currentLanguage;
        const voice = overrides.voice !== undefined ? overrides.voice : currentVoice;

        // Use the current progress bar value as the seek percentage
        // This is the same approach as handleProgressBarClick
        const currentPercentage = progressbarValue;

        // Get the original content and split into sentences
        const originalContent = window.TTS.contents[buttonId];
        const sentences = splitSentencesForSeek(originalContent);

        if (sentences.length === 0) {
            setIsApplyingSettings(false);
            return;
        }

        // Calculate total character count for weighting
        const totalChars = sentences.reduce((sum, sentence) => sum + sentence.length, 0);

        // Find the sentence index corresponding to current percentage
        let accumulatedPercentage = 0;
        let targetIndex = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentencePercentage = (sentences[i].length / totalChars) * 100;
            accumulatedPercentage += sentencePercentage;

            if (accumulatedPercentage >= currentPercentage) {
                targetIndex = i;
                break;
            }
        }

        // Get content from target sentence onwards
        const newContent = sentences.slice(targetIndex).join(' ');

        // Cancel current speech
        speech.speech.cancel();

        // Update speech content and splitted sentences
        speech.content = newContent;
        speech.splittedSentances = sentences.slice(targetIndex);

        // Update speech settings
        speech.speech.setRate(rate);
        speech.speech.setPitch(pitch);
        speech.speech.setVolume(volume);
        speech.speech.setLanguage(language);
        speech.speech.setVoice(voice);

        // Update browser support settings
        if (speech.browser) {
            speech.browser.defineVoiceAndLang(voice, language);
        }

        // Update TTS settings object
        if (window.TTS && window.TTS.settings && window.TTS.settings.listening) {
            window.TTS.settings.listening.tta__listening_rate = rate;
            window.TTS.settings.listening.tta__listening_pitch = pitch;
            window.TTS.settings.listening.tta__listening_volume = volume;
            window.TTS.settings.listening.tta__listening_lang = language;
            window.TTS.settings.listening.tta__listening_voice = voice;
        }

        // Clear existing intervals using refs for immediate effect
        if (incrementIntervalRef.current) {
            clearInterval(incrementIntervalRef.current);
            incrementIntervalRef.current = null;
        }
        if (decrementIntervalRef.current) {
            clearInterval(decrementIntervalRef.current);
            decrementIntervalRef.current = null;
        }
        clearInterval(decrementInterval);
        clearInterval(incrementInterval);

        // Calculate new times based on current percentage (same as handleProgressBarClick)
        const readingTime = window?.TTS.settings?.readingTime;
        const totalTimeMs = 1000 * 60 * parseInt(readingTime);
        const seekTimeMs = (currentPercentage / 100) * totalTimeMs;
        const remainingTimeMs = totalTimeMs - seekTimeMs;

        // Update progress bar immediately
        setProgressbarValue(currentPercentage);

        // Restart speech from new position
        setTimeout(() => {
            speech.speak(speech.speech, newContent, true);
            speech.listenStatus = 'pause';
            setListenStatus('pause');
            setIsApplyingSettings(false);

            // Restart timers from seek position (exactly like handleProgressBarClick)
            const newDeadline = new Date().getTime() + remainingTimeMs;
            setDecrementDeadline(newDeadline);
            getDecreamentTime(newDeadline);

            setIncrementedTime(seekTimeMs);
            getIncrementTime(totalTimeMs, seekTimeMs);

        }, 100);
    };

    /**
     * Get speed label for display
     */
    const getSpeedLabel = (rate) => {
        return `${rate}x`;
    };

    // Load voices on mount
    useEffect(() => {
        loadBrowserVoices();
    }, []);


    /**
     * After reading text callback for redesing button
     */
    const callBackAfterEnd = () => {
        speech = speech.getData()
        setListenStatus(speech.listenStatus)
        setIsPlaying(false)
    }

    const pauseButton = (speech, finishIntentionally = false) => {
        speech.pause(speech.speech)
        if (finishIntentionally) {
            speech.finishedSpeaking(speech.speech, {}, finishIntentionally);
        }
        setIsPlaying(!isPlaying);
        // Clear intervals using refs
        if (incrementIntervalRef.current) {
            clearInterval(incrementIntervalRef.current);
            incrementIntervalRef.current = null;
        }
        if (decrementIntervalRef.current) {
            clearInterval(decrementIntervalRef.current);
            decrementIntervalRef.current = null;
        }
        clearInterval(decrementInterval);
        clearInterval(incrementInterval);
        setTimeout(() => {
            setListenStatus(speech.listenStatus)
        }, 100)
    }

    const resumeButton = (speech, finishIntentionally = false) => {
        speech.resume(speech.speech)
        setIsPlaying(!isPlaying);
        if (finishIntentionally) {
            speech.finishedSpeaking(speech.speech, {}, finishIntentionally);
            // Clear intervals using refs
            if (incrementIntervalRef.current) {
                clearInterval(incrementIntervalRef.current);
                incrementIntervalRef.current = null;
            }
            if (decrementIntervalRef.current) {
                clearInterval(decrementIntervalRef.current);
                decrementIntervalRef.current = null;
            }
            clearInterval(decrementInterval);
            clearInterval(incrementInterval);
            setTimeout(() => {
                setListenStatus(speech.listenStatus)
            }, 100)
        }else{
            let deadline = new Date(Date.parse(new Date()) + decrementDeadline);
            getDecreamentTime(deadline)
            getIncrementTime(incrementDeadline, incrementedTime)
            setTimeout(() => {
                setListenStatus(speech.listenStatus)
            }, 100)
        }
    }


    useEffect(() => {
        if (speech) {
            speech.onAValueChanged((newValue) => {
                if ('listen' === newValue) {
                    pauseButton(speech, true)
                    speech = null
                    setListenStatus(newValue)
                }
            });
        }
    }, [speech])

    // TODO modiy TextToSpeech functionality by action and filter hook
    const handlePlayButtonClick = (e) => {
        e.preventDefault()
        let contents = window.TTS.contents;
        // in the customization menu of dashboard set initial text.
        if (document.getElementById('tta__demo_text_for_play')) {
            let text = document.getElementById('tta__demo_text_for_play').value;
            contents[buttonId] = text
        }
        const currentPlayerId = JSON.parse(window.sessionStorage.getItem('currentPlayerId'));
        window.sessionStorage.setItem('currentPlayerId', buttonId)

        TextToSpeechPro = window.TextToSpeechPro;
        if ((speech != null && speech.listenStatus == 'listen') || buttonId != currentPlayerId) {
            if(speech && buttonId != currentPlayerId) {
                speech = speech.getData()
                console.log(speech.listenStatus)
                if(speech.listenStatus == 'resume') {
                    setListenStatus(speech.listenStatus)
                    resumeButton(speech, true)
                }else {
                    setListenStatus(speech.listenStatus)
                    pauseButton(speech, true)
                }
            }
            speech = null
            setListenStatus('listen')

        }
        console.log({speech, currentPlayerId, buttonId})
        if (speech === null) {

            if (TextToSpeechPro?.TTS) {
                speech = new window.TextToSpeechPro2(buttonId, contents[buttonId], button, window.TTS)
            } else {
                speech = new TextToSpeechPro(buttonId, contents[buttonId], button, window.TTS)
            }


            speech._init(callBackAfterEnd)
            setIsPlaying(true)
            setFirstPlayerPlay(false);
            setSecondPlayerPlay(true);
            getIncrementTime()
            getDecreamentTime()
            setTimeout(() => {
                speech = speech.getData()
                setListenStatus(speech.listenStatus)
            }, 100)
        } else {
            speech = speech.getData()
            setListenStatus(speech.listenStatus)
            if (speech.listenStatus == 'pause') {
                pauseButton(speech)
            } else if (speech.listenStatus == 'resume') {
                resumeButton(speech)
            }
        }

    }


    /**
     *
     * @param {*} time
     * @returns
     */
    const getIncrementTime = (incrementDeadlineParam = null, incrementedTimeParam = 0) => {
        // Clear any existing interval first using ref
        if (incrementIntervalRef.current) {
            clearInterval(incrementIntervalRef.current);
            incrementIntervalRef.current = null;
        }

        // The data/time we want to countdown to
        let deadline;
        if (!incrementDeadlineParam) {
            let readingTime = window?.TTS.settings?.readingTime
            deadline = 1000 * 60 * parseInt(readingTime);
            setIncrementDeadline(deadline)

        } else {
            deadline = incrementDeadlineParam
        }
        let t = increament_time_remaining(deadline)
        setIncrementDeadline(t.total)

        let timer;
        let now = incrementedTimeParam;
        let timeleft = 0;

        function updateIncreamentTime() {
            setIncrementedTime(now)
            setProgressbarProgress(now)
            timeleft = now + 1000
            if (document.getElementById(`audio_time_start_${buttonId}`)) {
                document.getElementById(`audio_time_start_${buttonId}`).innerHTML = getFormattedTime(now).formatted;

                // Display the message when countdown is over
                if (timeleft > t.total) {
                    clearInterval(timer);
                    incrementIntervalRef.current = null;
                    // TODO: match with settings if minute and second extension will be added.
                    document.getElementById(`audio_time_start_${buttonId}`).innerHTML = '00:00'
                }
            } else {
                if(!isSettingOpen){
                    clearInterval(timer);
                    incrementIntervalRef.current = null;
                }
            }
            now = timeleft
        }
        updateIncreamentTime()
        // Run timer every second
        timer = setInterval(updateIncreamentTime, 1000);
        incrementIntervalRef.current = timer;
        setIncrementInterval(timer)
    }

    const setProgressbarProgress = (now) => {
        let time = window?.TTS.settings?.readingTime
        let totalTime = 1000 * 60 * parseInt(time)
        if (now) {
            let progressbarPercent = getPercentage(now, totalTime)
            setProgressbarValue(progressbarPercent)
        }

    }

    const getPercentage = (x, y) => {
        return Math.floor((x / y) * 100);
    }

    /**
     * Handle progress bar click for seek functionality.
     * Calculates the clicked position and seeks to corresponding sentence.
     *
     * @param {Event} e - The click event
     */
    const handleProgressBarClick = (e) => {
        e.preventDefault();

        if (!speech || listenStatus === 'listen') {
            return; // Don't seek if not playing
        }

        // Show loading indicator
        setIsSeeking(true);

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progressBarWidth = rect.width;

        // Calculate click percentage (0-100)
        const clickPercentage = Math.max(0, Math.min(100, (clickX / progressBarWidth) * 100));

        // Get the original content and split into sentences
        const originalContent = window.TTS.contents[buttonId];
        const sentences = splitSentencesForSeek(originalContent);

        if (sentences.length === 0) {
            setIsSeeking(false);
            return;
        }

        // Calculate total character count for weighting
        const totalChars = sentences.reduce((sum, sentence) => sum + sentence.length, 0);

        // Find the sentence index corresponding to click percentage
        let accumulatedPercentage = 0;
        let targetIndex = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentencePercentage = (sentences[i].length / totalChars) * 100;
            accumulatedPercentage += sentencePercentage;

            if (accumulatedPercentage >= clickPercentage) {
                targetIndex = i;
                break;
            }
        }

        // Get content from target sentence onwards
        const newContent = sentences.slice(targetIndex).join(' ');

        // Cancel current speech
        if (speech && speech.speech) {
            speech.speech.cancel();
        }

        // Update speech content and splitted sentences
        speech.content = newContent;
        speech.splittedSentances = sentences.slice(targetIndex);

        // Clear existing intervals using refs for immediate effect
        if (incrementIntervalRef.current) {
            clearInterval(incrementIntervalRef.current);
            incrementIntervalRef.current = null;
        }
        if (decrementIntervalRef.current) {
            clearInterval(decrementIntervalRef.current);
            decrementIntervalRef.current = null;
        }
        clearInterval(decrementInterval);
        clearInterval(incrementInterval);

        // Calculate new times based on seek position
        const readingTime = window?.TTS.settings?.readingTime;
        const totalTimeMs = 1000 * 60 * parseInt(readingTime);
        const seekTimeMs = (clickPercentage / 100) * totalTimeMs;
        const remainingTimeMs = totalTimeMs - seekTimeMs;

        // Update progress bar immediately
        setProgressbarValue(clickPercentage);

        // Restart speech from new position
        setTimeout(() => {
            speech.speak(speech.speech, newContent, true);
            speech.listenStatus = 'pause';
            setListenStatus('pause');


            // Restart timers from seek position
            const newDeadline = new Date().getTime() + remainingTimeMs;
            setDecrementDeadline(newDeadline);
            getDecreamentTime(newDeadline);

            setIncrementedTime(seekTimeMs);
            getIncrementTime(totalTimeMs, seekTimeMs);

            // Hide loading indicator
            setIsSeeking(false);
        }, 100);
    }

    /**
     * Split content into sentences for seek functionality.
     * Similar to splitSentences in utilities.js but returns array.
     *
     * @param {string} text - The content to split
     * @returns {Array} Array of sentences
     */
    const splitSentencesForSeek = (text = '') => {
        if (!text) return [];
        return text
            .replace(/\.+/g, '.|')
            .replace(/\?/g, '?|')
            .replace(/!/g, '!|')
            .split('|')
            .map(sentence => sentence.trim())
            .filter(Boolean);
    }

    /**
     * 
     * @param {*} endtime date string
     * @returns 
     */
    function increament_time_remaining(endtime, shouldCreate = false) {
        let t = 0;
        if (shouldCreate) {
            t = 1000 * 60 * parseInt(endtime);
        } else {
            t = endtime
        }

        return getFormattedTime(t);
    }

    /**
     *
     * @param {*} time
     * @returns
     */
    const getDecreamentTime = (decrementDeadlineParam = null) => {
        // Clear any existing interval first using ref
        if (decrementIntervalRef.current) {
            clearInterval(decrementIntervalRef.current);
            decrementIntervalRef.current = null;
        }

        // The data/time we want to countdown to
        let deadline;
        if (!decrementDeadlineParam) {
            let readingTime = window?.TTS.settings?.readingTime
            deadline = new Date().getTime() + (1000 * 60 * parseInt(readingTime));
            setDecrementDeadline(deadline)
        } else {
            deadline = decrementDeadlineParam
        }

        let timer;
        function updateDecreamentTime() {
            // Calculating the days, hours, minutes and seconds left
            let t = decreament_time_remaining(deadline)
            // console.log(t)
            setDecrementDeadline(t.total)
            if (document.getElementById(`audio_time_end_${buttonId}`)) {
                document.getElementById(`audio_time_end_${buttonId}`).innerHTML = t.formatted;
                // Display the message when countdown is over
                if (t.total <= 0) {
                    clearInterval(timer);
                    decrementIntervalRef.current = null;
                    document.getElementById(`audio_time_end_${buttonId}`).innerHTML = decreament_time_remaining(readingTime, false, true).formatted
                }
            } else {
                if(!isSettingOpen){
                    clearInterval(timer);
                    decrementIntervalRef.current = null;
                }
            }
        }

        updateDecreamentTime()
        // Run timer every second
        timer = setInterval(updateDecreamentTime, 1000);
        decrementIntervalRef.current = timer;
        setDecrementInterval(timer)

    }


    /**
     * 
     * @param {*} endtime date string
     * @returns 
     */
    function decreament_time_remaining(endtime, shouldParse = false, shouldCreate = false) {
        let t = 0;
        if (shouldCreate) {
            t = 1000 * 60 * parseInt(endtime);
        } else {
            if (shouldParse) {
                t = Date.parse(endtime) - Date.parse(new Date())
            } else {
                t = endtime - Date.parse(new Date())
            }
        }


        return getFormattedTime(t);
    }

    /**
     * 
     * @param {*} t 
     * @returns 
     */
    const getFormattedTime = (t) => {
        let seconds = Math.floor((t / 1000) % 60);
        let minutes = Math.floor((t / 1000 / 60) % 60);
        // TODO: match with settings if minute and second extension will be added.
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        let tObj = { 'total': t, 'minutes': minutes, 'seconds': seconds }
        tObj.formatted = tObj.minutes + ":" + tObj.seconds;

        return tObj;
    }

    const getButtonHTML = () => {
        return (
            <div id="tts_button_should_float">
                {/* First player */}
                {/* {isFirstPlayerPlay && ( */}
                <div className="tts__player tts__border tts__shadow-custom  tts__mx-auto tts__d-flex tts__justify-content-between tts__px-3 tts__align-items-center tts__position-relative">
                    {
                        !isSettingOpen && <div
                            className="tts__d-flex tts__gap-3 tts__justify-content-between tts__align-items-center"
                            style={{ height: "55px" }}
                        >

                                {
                                    (!speech || listenStatus === 'resume') && <Play ttsObjPro={ttsObjPro}  onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'listen' && <Replay ttsObjPro={ttsObjPro} onClick={(e) => handlePlayButtonClick(e)} />
                                }
                                {
                                    speech && listenStatus === 'pause' && <Pause ttsObjPro={ttsObjPro} onClick={(e) => handlePlayButtonClick(e)} />
                                }

                                {/* {isPlaying && (
                                    <div
                                        className="position-absolute top-0 start-0 translate-middle spinner-border text-primary"
                                        role="status"
                                    >
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                )} */}
                            {
                                listenStatus === 'listen' && window.hasOwnProperty('TTS') && <div className="tts__align-items-center">
                                    <span>{resolveStateText(buttonTexts, _resolvedPlayerId, 'listen', 'listen_text')}</span>
                                </div>
                            }
                            {
                                listenStatus !== 'listen' && window.hasOwnProperty('TTS') && <div className="tts__d-flex tts__gap-3  tts__justify-content-between tts__align-items-center">
                                    <div className="tts__audio-player">
                                        <div className="tts__audio-controls">
                                            <div className="tts__audio-time-start" id={`audio_time_start_${buttonId}`}>00:00</div>
                                            <div
                                                className="tts__progress tts__audio-progress"
                                                role="progressbar"
                                                aria-label="Audio progress - click to seek"
                                                aria-valuenow={progressbarValue}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                style={{ height: '5px', cursor: 'pointer', position: 'relative' }}
                                                onClick={handleProgressBarClick}
                                                title={__("Click to seek", "text-to-audio")}
                                            >
                                                {/* Loading indicator for seek operation */}
                                                {isSeeking && (
                                                    <div
                                                        className="tts__seek-loader"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            width: '16px',
                                                            height: '16px',
                                                            border: `2px solid ${buttonCSS?.backgroundColor || '#184c53'}`,
                                                            borderTop: `2px solid ${buttonCSS?.color || '#ffffff'}`,
                                                            borderRadius: '50%',
                                                            animation: 'tts-spin 0.8s linear infinite',
                                                            zIndex: 10
                                                        }}
                                                    />
                                                )}
                                                <div
                                                    className="tts__progress-bar"
                                                    style={{ backgroundColor: buttonCSS.color, height: '5px', width: `${progressbarValue}%` }}
                                                />
                                            </div>
                                            <div className="tts__audio-time-end" id={`audio_time_end_${buttonId}`}>00:00</div>
                                        </div>
                                        <div className="tts__audio-volume"></div>
                                    </div>
                                </div>
                            }

                        </div>

                    }

                    {/* Settings Icon - Show only when playing/paused */}
                    {listenStatus !== 'listen' ? (
                        <div className="tts__ps-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                                onClick={handleSetting}
                                style={{
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSettingOpen ? `${buttonCSS?.color}20` : 'transparent',
                                    transition: 'background-color 0.2s'
                                }}
                                title={__("Settings", "text-to-audio")}
                            >
                                {isSettingOpen ? (
                                    <Close onClick={(e) => handleSetting(e)} />
                                ) : (
                                    <Settings onClick={(e) => handleSetting(e)} />
                                )}
                            </div>
                            <SoundWave isPlaying={isPlaying} />
                        </div>
                    ) : (
                        <div className="tts__ps-3">
                            <SoundWave isPlaying={isPlaying} />
                        </div>
                    )}
                </div>
            </div>
        )
    }


    useEffect(() => {
        if(!window?.ttsObj?.settings?.settings?.tta__settings_stop_floating_button) {
            let buttonEl = document.getElementById('tts_button_should_float');
            if (!buttonEl) return;

            // Save the player's original absolute position in the document.
            // This is theme-independent — no CSS selectors needed.
            originalTopRef.current = buttonEl.getBoundingClientRect().top + window.scrollY;

            const detectScroll = () => {
                if (originalTopRef.current === null) return;
                if (window.scrollY > originalTopRef.current) {
                    setShouldFloat(true);
                } else {
                    setShouldFloat(false);
                }
            };

            document.addEventListener('scroll', detectScroll, {passive: true})

            return () => {
                document.removeEventListener('scroll', detectScroll)
            }
        }

    }, [])

    return (
        <>
            {

                buttonCSS && <style>
                    {
                        /* TTS-241 — apply the user's full button-style set
                           (border, border-radius, height, font-size, padding)
                           so Default Pro reflects the same customizations as
                           Default. Previously these were dropped, making the
                           player look "broken" relative to the saved CSS. */
                        `#tts_button_should_float{
                            background-color: ${buttonCSS?.backgroundColor};
                            color: ${buttonCSS.color};
                            width: ${buttonCSS.width}%;
                            height: ${buttonCSS.height ? buttonCSS.height + 'px' : 'auto'};
                            font-size: ${buttonCSS.fontSize ? buttonCSS.fontSize + 'px' : 'inherit'};
                            border: ${buttonCSS.border ? buttonCSS.border + 'px solid ' + (buttonCSS.border_color || '#000000') : 'none'};
                            border-radius: ${buttonCSS.borderRadius ? buttonCSS.borderRadius + 'px' : '0'};
                            margin-top: ${buttonCSS.marginTop}px;
                            margin-bottom: ${buttonCSS.marginBottom}px;
                            margin-right: ${buttonCSS.marginRight}px;
                            margin-left: ${buttonCSS.marginLeft}%;
                            box-sizing: border-box;
                        }
                        #tts_button_should_float .tts__player{
                            border: 0 !important;
                            box-shadow: none !important;
                            background: transparent !important;
                            width: 100% !important;
                            height: 100% !important;
                            border-radius: inherit !important;
                        }
                        #tts_button_should_float div:nth-child(1){ color:${buttonCSS.color};}
                        .atlasvoice_player_button svg {cursor:pointer;}
                        .tts__progress.tts__audio-progress:hover { opacity: 0.8; }
                        .tts__progress.tts__audio-progress { transition: opacity 0.2s ease; }
                        @keyframes tts-spin {
                            0% { transform: translate(-50%, -50%) rotate(0deg); }
                            100% { transform: translate(-50%, -50%) rotate(360deg); }
                        }

                        /* Settings Modal Backdrop */
                        .tts__settings-modal-backdrop {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                        }
                        .tts__settings-modal-backdrop.tts__modal-visible {
                            opacity: 1;
                        }
                        .tts__settings-modal-backdrop.tts__modal-closing {
                            opacity: 0;
                        }

                        /* Settings Modal Container */
                        .tts__settings-modal {
                            width: 90%;
                            max-width: 400px;
                            background-color: ${buttonCSS?.backgroundColor || '#184c53'};
                            color: ${buttonCSS?.color || '#ffffff'};
                            border-radius: 12px;
                            padding: 20px;
                            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                            transform: scale(0.8);
                            opacity: 0;
                            transition: transform 0.2s ease, opacity 0.2s ease;
                            position: relative;
                        }
                        .tts__settings-modal-backdrop.tts__modal-visible .tts__settings-modal {
                            transform: scale(1);
                            opacity: 1;
                        }
                        .tts__settings-modal-backdrop.tts__modal-closing .tts__settings-modal {
                            transform: scale(0.8);
                            opacity: 0;
                        }

                        /* Modal Header */
                        .tts__settings-modal-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            padding-bottom: 12px;
                            border-bottom: 1px solid ${buttonCSS?.color || '#ffffff'}20;
                        }
                        .tts__settings-modal-title {
                            font-size: 16px;
                            font-weight: 600;
                            margin: 0;
                        }
                        .tts__settings-modal-close {
                            background: transparent;
                            border: none;
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background-color 0.2s ease;
                        }
                        .tts__settings-modal-close:hover {
                            background-color: ${buttonCSS?.color || '#ffffff'}20;
                        }

                        /* Settings Select */
                        .tts__settings-select {
                            outline: none;
                        }
                        .tts__settings-select:focus {
                            border-color: ${buttonCSS?.color || '#ffffff'}80 !important;
                        }
                        .tts__settings-select option {
                            padding: 8px;
                        }

                        /* Custom Slider Styles */
                        .tts__settings-slider {
                            -webkit-appearance: none;
                            appearance: none;
                            height: 6px;
                            background: ${buttonCSS?.color || '#ffffff'}30;
                            border-radius: 3px;
                            outline: none;
                        }
                        .tts__settings-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 18px;
                            height: 18px;
                            background: ${buttonCSS?.color || '#ffffff'};
                            border-radius: 50%;
                            cursor: pointer;
                            transition: transform 0.1s ease;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        .tts__settings-slider::-webkit-slider-thumb:hover {
                            transform: scale(1.15);
                        }
                        .tts__settings-slider::-moz-range-thumb {
                            width: 18px;
                            height: 18px;
                            background: ${buttonCSS?.color || '#ffffff'};
                            border-radius: 50%;
                            cursor: pointer;
                            border: none;
                            transition: transform 0.1s ease;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        .tts__settings-slider::-moz-range-thumb:hover {
                            transform: scale(1.15);
                        }
                        .tts__settings-slider::-moz-range-track {
                            background: ${buttonCSS?.color || '#ffffff'}30;
                            height: 6px;
                            border-radius: 3px;
                        }

                        /* Settings icon hover effect */
                        .tts__ps-3 > div:first-child:hover {
                            background-color: ${buttonCSS?.color || '#ffffff'}30 !important;
                        }

                        /* Setting row styles */
                        .tts__setting-row {
                            margin-bottom: 16px;
                        }
                        .tts__setting-row:last-child {
                            margin-bottom: 0;
                        }
                        .tts__setting-label {
                            display: block;
                            font-size: 12px;
                            margin-bottom: 6px;
                            opacity: 0.85;
                        }
                        .tts__setting-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 6px;
                        }
                        .tts__setting-value {
                            font-size: 12px;
                            font-weight: 600;
                        }

                        /* Loader for settings */
                        .tts__settings-loader-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 12px;
                            z-index: 10;
                        }
                        .tts__settings-loader {
                            width: 28px;
                            height: 28px;
                            border: 3px solid ${buttonCSS?.backgroundColor || '#184c53'};
                            border-top: 3px solid ${buttonCSS?.color || '#ffffff'};
                            border-radius: 50%;
                            animation: tts-modal-spin 0.8s linear infinite;
                        }
                        @keyframes tts-modal-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        `
                    }
                    {
                        buttonCSS?.custom_css && buttonCSS?.custom_css
                    }
                </style>
            }
            {
                shouldFloat ? <div className={'tts__custom-position_bottom_right'} >{getButtonHTML()}</div> : getButtonHTML()
            }

            {/* Settings Modal Overlay - Centered on screen */}
            {isSettingOpen && listenStatus !== 'listen' && (
                <div
                    className={`tts__settings-modal-backdrop ${isModalAnimating ? (isSettingOpen ? 'tts__modal-visible' : 'tts__modal-closing') : 'tts__modal-visible'}`}
                    onClick={handleBackdropClick}
                >
                    <div className="tts__settings-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Loading overlay when applying settings */}
                        {isApplyingSettings && (
                            <div className="tts__settings-loader-overlay">
                                <div className="tts__settings-loader" />
                            </div>
                        )}

                        {/* Modal Header */}
                        <div className="tts__settings-modal-header">
                            <h3 className="tts__settings-modal-title">{__("Player Settings", "text-to-audio")}</h3>
                            <button
                                className="tts__settings-modal-close"
                                onClick={closeSettingsModal}
                                title={__("Close", "text-to-audio")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={buttonCSS?.color || '#ffffff'} strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Language Selection */}
                        <div className="tts__setting-row">
                            <label className="tts__setting-label">{__("Language", "text-to-audio")}</label>
                            <select
                                value={currentLanguage}
                                onChange={handleLanguageChange}
                                className="tts__settings-select"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${buttonCSS?.color || '#ffffff'}30`,
                                    backgroundColor: `${buttonCSS?.backgroundColor || '#184c53'}`,
                                    color: buttonCSS?.color || '#ffffff',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                {availableLanguages.map((lang, index) => (
                                    <option
                                        key={index}
                                        value={lang}
                                        style={{
                                            backgroundColor: buttonCSS?.backgroundColor || '#184c53',
                                            color: buttonCSS?.color || '#ffffff'
                                        }}
                                    >
                                        {lang}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Voice Selection */}
                        <div className="tts__setting-row">
                            <label className="tts__setting-label">{__("Voice", "text-to-audio")}</label>
                            <select
                                value={currentVoice}
                                onChange={handleVoiceChange}
                                className="tts__settings-select"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${buttonCSS?.color || '#ffffff'}30`,
                                    backgroundColor: `${buttonCSS?.backgroundColor || '#184c53'}`,
                                    color: buttonCSS?.color || '#ffffff',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                {filteredVoices.map((voice, index) => (
                                    <option
                                        key={index}
                                        value={voice.name}
                                        style={{
                                            backgroundColor: buttonCSS?.backgroundColor || '#184c53',
                                            color: buttonCSS?.color || '#ffffff'
                                        }}
                                    >
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Speed Control */}
                        <div className="tts__setting-row">
                            <div className="tts__setting-header">
                                <label className="tts__setting-label" style={{ marginBottom: 0 }}>{__("Speed", "text-to-audio")}</label>
                                <span className="tts__setting-value">{getSpeedLabel(currentRate)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={currentRate}
                                onChange={handleRateChange}
                                className="tts__settings-slider"
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>

                        {/* Pitch Control */}
                        <div className="tts__setting-row">
                            <div className="tts__setting-header">
                                <label className="tts__setting-label" style={{ marginBottom: 0 }}>{__("Pitch", "text-to-audio")}</label>
                                <span className="tts__setting-value">{currentPitch.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={currentPitch}
                                onChange={handlePitchChange}
                                className="tts__settings-slider"
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>

                        {/* Volume Control with Mute Button */}
                        <div className="tts__setting-row">
                            <div className="tts__setting-header">
                                <label className="tts__setting-label" style={{ marginBottom: 0 }}>{__("Volume", "text-to-audio")}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="tts__setting-value">{Math.round(currentVolume * 100)}%</span>
                                    <button
                                        onClick={handleMuteToggle}
                                        style={{
                                            background: isMuted ? `${buttonCSS?.color || '#ffffff'}20` : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        title={isMuted ? __('Unmute', 'text-to-audio') : __('Mute', 'text-to-audio')}
                                    >
                                        {isMuted ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={buttonCSS?.color || '#ffffff'} strokeWidth="2">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                                <line x1="23" y1="9" x2="17" y2="15"></line>
                                                <line x1="17" y1="9" x2="23" y2="15"></line>
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={buttonCSS?.color || '#ffffff'} strokeWidth="2">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={currentVolume}
                                onChange={handleVolumeChange}
                                className="tts__settings-slider"
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TextToSpeech;