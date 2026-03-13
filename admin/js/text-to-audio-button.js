import TextToSpeech from "./TextToSpeech.js";
import {getButtonContent, setSvgColorOnEvent, splitSentences} from "./tts/utilities.js";
import AtlasVoiceAnalytics from "./AtlasVoiceAnalytics";

// Auto-close timeout duration (15 seconds)
const MODAL_AUTO_CLOSE_TIMEOUT = 15000;

// Settings Modal Manager - Singleton to handle modal outside Shadow DOM
class TTSSettingsModalManager {
    static instance = null;
    static modalContainer = null;
    static currentButtonInstance = null;
    static autoCloseTimer = null;
    static isOpen = false;

    // Settings state
    static availableVoices = [];
    static filteredVoices = [];
    static availableLanguages = [];
    static currentLanguage = '';
    static currentVoice = '';
    static currentRate = 1;
    static currentPitch = 1;
    static currentVolume = 1;
    static isMuted = false;
    static previousVolume = 1;

    static init() {
        if (this.modalContainer) return;

        // Create modal container in main document body
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'tts-settings-modal-container';
        document.body.appendChild(this.modalContainer);

        // Add modal styles to document head
        this.injectStyles();

        // Load voices
        this.loadBrowserVoices();

        // Load settings from localStorage
        this.loadSettingsFromStorage();
    }

    static injectStyles() {
        if (document.getElementById('tts-settings-modal-styles')) return;

        const colors = this.getColors();
        const style = document.createElement('style');
        style.id = 'tts-settings-modal-styles';
        style.textContent = `
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
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            }
            .tts__settings-modal-backdrop.tts__modal-visible {
                opacity: 1;
                pointer-events: auto;
            }
            .tts__settings-modal-backdrop.tts__modal-closing {
                opacity: 0;
                pointer-events: none;
            }

            /* Settings Modal Container */
            .tts__settings-modal {
                width: 90%;
                max-width: 400px;
                background-color: var(--tts-modal-bg, #184c53);
                color: var(--tts-modal-color, #ffffff);
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
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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
            .tts__settings-modal-close:hover,
            .tts__settings-modal-close:focus-visible {
                background-color: rgba(255, 255, 255, 0.12);
            }
            .tts__settings-modal-close:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }

            /* Settings Select */
            .tts__settings-select {
                outline: none;
            }
            .tts__settings-select:focus {
                border-color: rgba(255, 255, 255, 0.5) !important;
            }

            /* Custom Slider Styles */
            .tts__settings-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 6px;
                background: rgba(255, 255, 255, 0.19);
                border-radius: 3px;
                outline: none;
            }
            .tts__settings-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                background: var(--tts-modal-color, #ffffff);
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
                background: var(--tts-modal-color, #ffffff);
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
                background: rgba(255, 255, 255, 0.19);
                height: 6px;
                border-radius: 3px;
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
                border: 3px solid var(--tts-modal-bg, #184c53);
                border-top: 3px solid var(--tts-modal-color, #ffffff);
                border-radius: 50%;
                animation: tts-modal-spin 0.8s linear infinite;
            }
            @keyframes tts-modal-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Mute button */
            .tts__mute-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                transition: background-color 0.2s ease;
            }
            .tts__mute-btn:hover {
                background-color: rgba(255, 255, 255, 0.12);
            }
            .tts__mute-btn:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
                background-color: rgba(255, 255, 255, 0.12);
            }
            .tts__mute-btn.muted {
                background-color: rgba(255, 255, 255, 0.12);
            }
            .tts__settings-slider:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }
            .tts__settings-select:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    static getColors() {
        const customize = window?.ttsObj?.settings?.customize || {};
        return {
            backgroundColor: customize.backgroundColor || '#184c53',
            color: customize.color || '#ffffff'
        };
    }

    static getCountryCode(lang) {
        if (!lang) return '';
        if (lang.indexOf('-') !== -1) return lang.split('-')[0];
        if (lang.indexOf('_') !== -1) return lang.split('_')[0];
        return lang;
    }

    static loadBrowserVoices() {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                this.availableVoices = voices;

                // Get admin-configured language from settings
                const adminLang = window?.TTS?.settings?.listening?.tta__listening_lang || 'en';
                const adminVoice = window?.TTS?.settings?.listening?.tta__listening_voice || '';

                // Extract unique languages that match admin language
                const langCode = this.getCountryCode(adminLang);
                const matchingVoices = voices.filter(voice => {
                    const voiceLangCode = this.getCountryCode(voice.lang);
                    return voiceLangCode.toLowerCase() === langCode.toLowerCase();
                });

                // Get unique language codes from matching voices
                const uniqueLangs = [...new Set(matchingVoices.map(v => v.lang))];
                this.availableLanguages = uniqueLangs;
                this.filteredVoices = matchingVoices;

                // Load saved settings or use defaults
                const savedSettings = this.loadSettingsFromStorage();
                if (savedSettings) {
                    // Validate saved voice exists
                    const savedVoiceExists = matchingVoices.some(v => v.name === savedSettings.voice);
                    if (!savedVoiceExists && matchingVoices.length > 0) {
                        this.currentVoice = adminVoice || matchingVoices[0].name;
                    }
                    // Validate saved language exists
                    const savedLangExists = uniqueLangs.includes(savedSettings.language);
                    if (!savedLangExists && uniqueLangs.length > 0) {
                        this.currentLanguage = matchingVoices[0]?.lang || adminLang;
                    }
                } else {
                    // Set defaults from admin settings
                    if (matchingVoices.length > 0) {
                        const defaultVoice = matchingVoices.find(v => v.name === adminVoice) || matchingVoices[0];
                        this.currentLanguage = defaultVoice.lang;
                        this.currentVoice = defaultVoice.name;
                    }
                    // Set default rate, pitch, volume from admin settings
                    const listeningSettings = window?.TTS?.settings?.listening || {};
                    this.currentRate = parseFloat(listeningSettings.tta__listening_rate) || 1;
                    this.currentPitch = parseFloat(listeningSettings.tta__listening_pitch) || 1;
                    this.currentVolume = parseFloat(listeningSettings.tta__listening_volume) || 1;
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
    }

    static loadSettingsFromStorage() {
        const savedSettings = localStorage.getItem('tts_player_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.rate) this.currentRate = parseFloat(settings.rate);
                if (settings.pitch) this.currentPitch = parseFloat(settings.pitch);
                if (settings.volume) this.currentVolume = parseFloat(settings.volume);
                if (settings.language) this.currentLanguage = settings.language;
                if (settings.voice) this.currentVoice = settings.voice;
                if (settings.isMuted !== undefined) this.isMuted = settings.isMuted;
                return settings;
            } catch (e) {
                console.error('Error loading TTS settings from localStorage:', e);
            }
        }
        return null;
    }

    static saveSettingsToStorage(settings) {
        try {
            const currentSettings = JSON.parse(localStorage.getItem('tts_player_settings') || '{}');
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem('tts_player_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error('Error saving TTS settings to localStorage:', e);
        }
    }

    static filterVoicesByLanguage(lang) {
        const langCode = this.getCountryCode(lang);
        const matching = this.availableVoices.filter(voice => {
            const voiceLangCode = this.getCountryCode(voice.lang);
            return voiceLangCode.toLowerCase() === langCode.toLowerCase();
        });
        this.filteredVoices = matching;
        return matching;
    }

    static _keyHandler = null;
    static _previousFocus = null;

    static openModal(buttonInstance) {
        this.currentButtonInstance = buttonInstance;
        this.isOpen = true;
        this._previousFocus = document.activeElement;
        this.renderModal();
        this.startAutoCloseTimer();

        // Trigger animation
        requestAnimationFrame(() => {
            const backdrop = this.modalContainer.querySelector('.tts__settings-modal-backdrop');
            if (backdrop) {
                backdrop.classList.add('tts__modal-visible');
            }
            // Focus the close button for keyboard users
            const closeBtn = this.modalContainer.querySelector('.tts__settings-modal-close');
            if (closeBtn) closeBtn.focus();
        });

        // Keyboard handler: Escape to close + focus trap
        this._keyHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
                return;
            }
            // Focus trap within modal
            if (e.key === 'Tab' && this.isOpen) {
                const modal = this.modalContainer.querySelector('.tts__settings-modal');
                if (!modal) return;
                const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    static closeModal() {
        const backdrop = this.modalContainer.querySelector('.tts__settings-modal-backdrop');
        if (backdrop) {
            backdrop.classList.remove('tts__modal-visible');
            backdrop.classList.add('tts__modal-closing');

            setTimeout(() => {
                this.isOpen = false;
                this.modalContainer.innerHTML = '';
                this.currentButtonInstance = null;
            }, 200);
        }
        this.clearAutoCloseTimer();

        // Remove keyboard handler
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        // Return focus to the button that opened the modal
        if (this._previousFocus) {
            this._previousFocus.focus();
            this._previousFocus = null;
        }
    }

    static startAutoCloseTimer() {
        this.clearAutoCloseTimer();
        this.autoCloseTimer = setTimeout(() => {
            if (this.isOpen) {
                this.closeModal();
            }
        }, MODAL_AUTO_CLOSE_TIMEOUT);
    }

    static clearAutoCloseTimer() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
    }

    static resetAutoCloseTimer() {
        if (this.isOpen) {
            this.startAutoCloseTimer();
        }
    }

    static handleLanguageChange(e) {
        const newLang = e.target.value;
        this.currentLanguage = newLang;
        this.saveSettingsToStorage({ language: newLang });
        this.resetAutoCloseTimer();

        // Filter voices for new language and select first one
        const matching = this.filterVoicesByLanguage(newLang);
        if (matching.length > 0) {
            const newVoice = matching[0].name;
            this.currentVoice = newVoice;
            this.saveSettingsToStorage({ voice: newVoice });
        }

        // Re-render modal to update voice dropdown
        this.renderModal();

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static handleVoiceChange(e) {
        const newVoice = e.target.value;
        this.currentVoice = newVoice;
        this.saveSettingsToStorage({ voice: newVoice });
        this.resetAutoCloseTimer();

        // Find the language for this voice
        const voiceObj = this.availableVoices.find(v => v.name === newVoice);
        if (voiceObj && voiceObj.lang !== this.currentLanguage) {
            this.currentLanguage = voiceObj.lang;
            this.saveSettingsToStorage({ language: voiceObj.lang });
        }

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static handleRateChange(e) {
        const newRate = parseFloat(e.target.value);
        this.currentRate = newRate;
        this.saveSettingsToStorage({ rate: newRate });
        this.resetAutoCloseTimer();

        // Update displayed value
        const valueEl = this.modalContainer.querySelector('#tts-rate-value');
        if (valueEl) valueEl.textContent = `${newRate}x`;

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static handlePitchChange(e) {
        const newPitch = parseFloat(e.target.value);
        this.currentPitch = newPitch;
        this.saveSettingsToStorage({ pitch: newPitch });
        this.resetAutoCloseTimer();

        // Update displayed value
        const valueEl = this.modalContainer.querySelector('#tts-pitch-value');
        if (valueEl) valueEl.textContent = newPitch.toFixed(1);

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static handleVolumeChange(e) {
        const newVolume = parseFloat(e.target.value);
        this.currentVolume = newVolume;
        this.isMuted = newVolume === 0;
        this.saveSettingsToStorage({ volume: newVolume, isMuted: newVolume === 0 });
        this.resetAutoCloseTimer();

        // Update displayed value
        const valueEl = this.modalContainer.querySelector('#tts-volume-value');
        if (valueEl) valueEl.textContent = `${Math.round(newVolume * 100)}%`;

        // Update mute button state
        const muteBtn = this.modalContainer.querySelector('.tts__mute-btn');
        if (muteBtn) {
            muteBtn.classList.toggle('muted', this.isMuted);
            this.updateMuteButtonIcon(muteBtn);
        }

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static handleMuteToggle() {
        this.resetAutoCloseTimer();

        if (this.isMuted) {
            // Unmute - restore previous volume
            this.currentVolume = this.previousVolume;
            this.isMuted = false;
            this.saveSettingsToStorage({ volume: this.previousVolume, isMuted: false });
        } else {
            // Mute - save current volume and set to 0
            this.previousVolume = this.currentVolume;
            this.currentVolume = 0;
            this.isMuted = true;
            this.saveSettingsToStorage({ volume: 0, isMuted: true });
        }

        // Update UI
        const volumeSlider = this.modalContainer.querySelector('#tts-volume-slider');
        const valueEl = this.modalContainer.querySelector('#tts-volume-value');
        const muteBtn = this.modalContainer.querySelector('.tts__mute-btn');

        if (volumeSlider) volumeSlider.value = this.currentVolume;
        if (valueEl) valueEl.textContent = `${Math.round(this.currentVolume * 100)}%`;
        if (muteBtn) {
            muteBtn.classList.toggle('muted', this.isMuted);
            this.updateMuteButtonIcon(muteBtn);
        }

        // Apply settings if currently playing
        if (this.currentButtonInstance && this.currentButtonInstance.speech) {
            this.applySettingsAndRestart();
        }
    }

    static updateMuteButtonIcon(muteBtn) {
        const colors = this.getColors();
        if (this.isMuted) {
            muteBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.color}" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
            `;
        } else {
            muteBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.color}" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            `;
        }
    }

    static splitSentencesForSeek(text = '') {
        if (!text) return [];
        return text
            .replace(/\.+/g, '.|')
            .replace(/\?/g, '?|')
            .replace(/!/g, '!|')
            .split('|')
            .map(sentence => sentence.trim())
            .filter(Boolean);
    }

    static applySettingsAndRestart() {
        const buttonInstance = this.currentButtonInstance;
        if (!buttonInstance || !buttonInstance.speech || !buttonInstance.speech.speech) return;

        const speech = buttonInstance.speech;

        // Show loader
        const loader = this.modalContainer.querySelector('.tts__settings-loader-overlay');
        if (loader) loader.style.display = 'flex';

        // Get current position using speech.content (remaining content)
        const originalContent = window.TTS.contents[buttonInstance.buttonId];
        const currentContent = speech.content;
        const sentences = this.splitSentencesForSeek(originalContent);

        if (sentences.length === 0) {
            if (loader) loader.style.display = 'none';
            return;
        }

        // Calculate current percentage from remaining content
        const totalChars = originalContent.length;
        const remainingChars = currentContent.length;
        const currentPercentage = ((totalChars - remainingChars) / totalChars) * 100;

        // Find the sentence index corresponding to current percentage
        const totalSentenceChars = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
        let accumulatedPercentage = 0;
        let targetIndex = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentencePercentage = (sentences[i].length / totalSentenceChars) * 100;
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
        speech.speech.setRate(this.currentRate);
        speech.speech.setPitch(this.currentPitch);
        speech.speech.setVolume(this.currentVolume);
        speech.speech.setLanguage(this.currentLanguage);
        speech.speech.setVoice(this.currentVoice);

        // Update browser support settings
        if (speech.browser) {
            speech.browser.defineVoiceAndLang(this.currentVoice, this.currentLanguage);
        }

        // Update TTS settings object
        if (window.TTS && window.TTS.settings && window.TTS.settings.listening) {
            window.TTS.settings.listening.tta__listening_rate = this.currentRate;
            window.TTS.settings.listening.tta__listening_pitch = this.currentPitch;
            window.TTS.settings.listening.tta__listening_volume = this.currentVolume;
            window.TTS.settings.listening.tta__listening_lang = this.currentLanguage;
            window.TTS.settings.listening.tta__listening_voice = this.currentVoice;
        }

        // Restart speech from new position
        setTimeout(() => {
            speech.speak(speech.speech, newContent, true);
            speech.listenStatus = 'pause';

            // Hide loader
            if (loader) loader.style.display = 'none';
        }, 100);
    }

    static renderModal() {
        const colors = this.getColors();

        // Set CSS variables
        this.modalContainer.style.setProperty('--tts-modal-bg', colors.backgroundColor);
        this.modalContainer.style.setProperty('--tts-modal-color', colors.color);

        this.modalContainer.innerHTML = `
            <div class="tts__settings-modal-backdrop" onclick="TTSSettingsModalManager.handleBackdropClick(event)">
                <div class="tts__settings-modal" role="dialog" aria-modal="true" aria-labelledby="tts-settings-modal-title" onclick="event.stopPropagation()">
                    <!-- Loading overlay -->
                    <div class="tts__settings-loader-overlay" style="display: none;" role="status" aria-label="Loading">
                        <div class="tts__settings-loader"></div>
                    </div>

                    <!-- Modal Header -->
                    <div class="tts__settings-modal-header">
                        <h3 id="tts-settings-modal-title" class="tts__settings-modal-title">Player Settings</h3>
                        <button class="tts__settings-modal-close" onclick="TTSSettingsModalManager.closeModal()" title="Close" aria-label="Close settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.color}" stroke-width="2" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <!-- Language Selection -->
                    <div class="tts__setting-row">
                        <label class="tts__setting-label" for="tts-language-select">Language</label>
                        <select id="tts-language-select" class="tts__settings-select" onchange="TTSSettingsModalManager.handleLanguageChange(event)" style="
                            width: 100%;
                            padding: 10px 12px;
                            border-radius: 6px;
                            border: 1px solid ${colors.color}30;
                            background-color: ${colors.backgroundColor};
                            color: ${colors.color};
                            font-size: 13px;
                            cursor: pointer;
                        ">
                            ${this.availableLanguages.map(lang => `
                                <option value="${lang}" ${lang === this.currentLanguage ? 'selected' : ''} style="background-color: ${colors.backgroundColor}; color: ${colors.color};">
                                    ${lang}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Voice Selection -->
                    <div class="tts__setting-row">
                        <label class="tts__setting-label" for="tts-voice-select">Voice</label>
                        <select id="tts-voice-select" class="tts__settings-select" onchange="TTSSettingsModalManager.handleVoiceChange(event)" style="
                            width: 100%;
                            padding: 10px 12px;
                            border-radius: 6px;
                            border: 1px solid ${colors.color};
                            background-color: ${colors.backgroundColor};
                            color: ${colors.color};
                            font-size: 13px;
                            cursor: pointer;
                        ">
                            ${this.filteredVoices.map(voice => `
                                <option value="${voice.name}" ${voice.name === this.currentVoice ? 'selected' : ''} style="background-color: ${colors.backgroundColor}; color: ${colors.color};">
                                    ${voice.name} (${voice.lang})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Speed Control -->
                    <div class="tts__setting-row">
                        <div class="tts__setting-header">
                            <label class="tts__setting-label" for="tts-rate-slider" style="margin-bottom: 0;">Speed</label>
                            <span id="tts-rate-value" class="tts__setting-value">${this.currentRate}x</span>
                        </div>
                        <input type="range" id="tts-rate-slider" class="tts__settings-slider" min="0.5" max="2" step="0.1" value="${this.currentRate}" aria-label="Playback speed" aria-valuemin="0.5" aria-valuemax="2" aria-valuenow="${this.currentRate}" aria-valuetext="${this.currentRate}x" oninput="TTSSettingsModalManager.handleRateChange(event)" style="width: 100%; cursor: pointer;" />
                    </div>

                    <!-- Pitch Control -->
                    <div class="tts__setting-row">
                        <div class="tts__setting-header">
                            <label class="tts__setting-label" for="tts-pitch-slider" style="margin-bottom: 0;">Pitch</label>
                            <span id="tts-pitch-value" class="tts__setting-value">${this.currentPitch.toFixed(1)}</span>
                        </div>
                        <input type="range" id="tts-pitch-slider" class="tts__settings-slider" min="0" max="2" step="0.1" value="${this.currentPitch}" aria-label="Voice pitch" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${this.currentPitch}" aria-valuetext="${this.currentPitch.toFixed(1)}" oninput="TTSSettingsModalManager.handlePitchChange(event)" style="width: 100%; cursor: pointer;" />
                    </div>

                    <!-- Volume Control with Mute Button -->
                    <div class="tts__setting-row">
                        <div class="tts__setting-header">
                            <label class="tts__setting-label" for="tts-volume-slider" style="margin-bottom: 0;">Volume</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span id="tts-volume-value" class="tts__setting-value">${Math.round(this.currentVolume * 100)}%</span>
                                <button class="tts__mute-btn ${this.isMuted ? 'muted' : ''}" onclick="TTSSettingsModalManager.handleMuteToggle()" title="${this.isMuted ? 'Unmute' : 'Mute'}" aria-label="${this.isMuted ? 'Unmute audio' : 'Mute audio'}" aria-pressed="${this.isMuted}">
                                    ${this.isMuted ? `
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.color}" stroke-width="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <line x1="23" y1="9" x2="17" y2="15"></line>
                                            <line x1="17" y1="9" x2="23" y2="15"></line>
                                        </svg>
                                    ` : `
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.color}" stroke-width="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        </svg>
                                    `}
                                </button>
                            </div>
                        </div>
                        <input type="range" id="tts-volume-slider" class="tts__settings-slider" min="0" max="1" step="0.05" value="${this.currentVolume}" aria-label="Volume" aria-valuemin="0" aria-valuemax="1" aria-valuenow="${this.currentVolume}" aria-valuetext="${Math.round(this.currentVolume * 100)}%" oninput="TTSSettingsModalManager.handleVolumeChange(event)" style="width: 100%; cursor: pointer;" />
                    </div>
                </div>
            </div>
        `;
    }

    static handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }
}

// Make TTSSettingsModalManager globally accessible for inline event handlers
window.TTSSettingsModalManager = TTSSettingsModalManager;

// Create a class for the element
class TTSPlayButton extends HTMLElement {
    speech = null
    isProLicenseActive = false
    analytics = null
    buttonId = null
    useNewPlayer = true
    listenStatus = 'listen'
    settingsIconVisible = false

    constructor() {
        // Always call super first in constructor
        super();

        if (typeof NoSleep === 'function' && ttsObj?.is_mobile) {
            const noSleep = new NoSleep();
            window.onload = function () {
                noSleep.enable();
                console.log("NoSleep enabled");
            };
        }

        this.isProLicenseActive = window?.ttsObj?.is_pro_active;

        // Check if user wants to use old player via filter

        // Create a shadow root
        const shadow = this.attachShadow({mode: 'open'});

        if (window.hasOwnProperty('TTS')) {
            let contents = window.TTS.contents;
            let settings = window.TTS.settings;
            let buttonIds = Object.keys(contents);
            this.analytics = new AtlasVoiceAnalytics(window.TTS.settings.postId);

            // Render all buttons in page have.
            for (let buttonId of buttonIds) {
                if (buttonId == this.getAttribute('data-id')) {
                    this.buttonId = buttonId;
                    this.useOldPlayer = settings.use_old_player;
                    if (this.useOldPlayer) {
                        this.initOldPlayer(shadow, buttonId, contents, settings);
                    } else {
                        this.initNewPlayer(shadow, buttonId, contents, settings);
                    }

                    break;
                }
            } // end loop
        }
    }

    /**
     * Initialize OLD player (original functionality - unchanged)
     */
    initOldPlayer(shadow, buttonId, contents, settings) {
        // Create div
        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'wrapper');
        wrapper.innerHTML = getButtonContent(buttonId, settings.cssClass, this.isProLicenseActive);
        this.analytics.trackInit();
        console.log(contents[buttonId]);

        this.addEventListener('click', function (e) {
            let button = [...wrapper.children][0];
            if (this.speech != null && this.speech.listenStatus == 'listen') {
                this.speech = null;
            }
            if (this.speech === null) {
                let speech = new TextToSpeech(buttonId, contents[buttonId], button, window.TTS);
                speech._init(null, true);
                this.speech = speech.getData();
                this.speech.callBackAfterEnd = this.callBackAfterEnd;
            } else {
                this.speech = this.speech.getData();
                if (this.speech.listenStatus == 'pause') {
                    this.speech.pause(this.speech.speech, true);
                    window.sessionStorage.setItem('tts_paused_by_intention', true);
                } else if (this.speech.listenStatus == 'resume') {
                    this.speech.resume(this.speech.speech, true);
                }
            }
        });

        // Create some CSS to apply to the shadow dom
        const style = document.createElement('style');
        style.setAttribute('id', 'tts_style');

        // CSS style for this button
        style.textContent = `
            #tts__listent_content_${buttonId}.tts__listent_content{ ${settings.btnStyle} transition: all 0.5s ease-in-out; }
            #tts__listent_content_${buttonId}.tts__listent_content:hover{ ${settings.btnStyle} background-color:${ttsObj?.settings?.customize?.hoverBackgroundColor || '#f0f0f0'};}
            #tts__listent_content_${buttonId}.tts__listent_content svg{ display:${settings.shouldDisplayIcon}; padding-right:7px !important;padding-top: 5px; }
            #tts__listent_content_${buttonId}.tts__listent_content:hover  svg{ display:${settings.shouldDisplayIcon}; padding-right:7px !important; padding-top: 5px; }
            #tts__listent_content_${buttonId}.tts__listent_content:hover span{ color: ${ ttsObj?.settings?.customize?.hoverTextColor || "#000000" } }
            #tts__listent_content_${buttonId}.tts__listent_content:focus-visible{ outline: 2px solid ${ ttsObj?.settings?.customize?.color || "#ffffff" }; outline-offset: 2px; }
        `;

        if (settings?.customCSS) {
            style.textContent += `
                ${this.#htmlDecode(settings.customCSS)}
            `;
        }

        setSvgColorOnEvent(wrapper);
        // Attach the created elements to the shadow dom
        shadow.appendChild(style);
        shadow.appendChild(wrapper);
    }

    /**
     * Initialize NEW player with settings modal functionality
     */
    initNewPlayer(shadow, buttonId, contents, settings) {
        // Initialize modal manager
        TTSSettingsModalManager.init();

        const colors = ttsObj?.settings?.customize || {};
        const bgColor = colors.backgroundColor || '#184c53';
        const textColor = colors.color || '#ffffff';
        const hoverBgColor = colors.hoverBackgroundColor || '#f0f0f0';
        const hoverTextColor = colors.hoverTextColor || '#000000';

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'wrapper');

        // Create button with flexbox layout: text on left, settings icon on right
        const buttonHTML = this.getNewButtonContent(buttonId, settings, 'listen');
        wrapper.innerHTML = buttonHTML;

        this.analytics.trackInit();

        // Button click handler (for play/pause area only)
        const handlePlayClick = (e) => {
            // Prevent click if clicking on settings icon
            if (e.target.closest('.tts-settings-icon')) {
                return;
            }

            let button = wrapper.querySelector(`#tts__listent_content_${buttonId}`);

            if (this.speech != null && this.speech.listenStatus == 'listen') {
                this.speech = null;
                this.listenStatus = 'listen';
            }

            if (this.speech === null) {
                let speech = new TextToSpeech(buttonId, contents[buttonId], button, window.TTS);
                speech._init(null, true);
                this.speech = speech.getData();
                this.speech.callBackAfterEnd = () => {
                    this.callBackAfterEndNew();
                };
                this.listenStatus = 'pause';
                this.updateButtonUI(wrapper, buttonId, settings);
            } else {
                this.speech = this.speech.getData();
                if (this.speech.listenStatus == 'pause') {
                    this.speech.pause(this.speech.speech, true);
                    window.sessionStorage.setItem('tts_paused_by_intention', true);
                    this.listenStatus = 'resume';
                } else if (this.speech.listenStatus == 'resume') {
                    this.speech.resume(this.speech.speech, true);
                    this.listenStatus = 'pause';
                }
                this.updateButtonUI(wrapper, buttonId, settings);
            }
        };

        this.addEventListener('click', handlePlayClick);

        // Create styles
        const style = document.createElement('style');
        style.setAttribute('id', 'tts_style');

        style.textContent = `
            .wrapper {
                display: inline-block;
                width: 100%;
            }
            #tts__listent_content_${buttonId}.tts__listent_content {
                ${settings.btnStyle}
                transition: all 0.5s ease-in-out;
                display: flex !important;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
            }
            #tts__listent_content_${buttonId}.tts__listent_content:hover {
                ${settings.btnStyle}
                background-color: ${hoverBgColor};
            }
            #tts__listent_content_${buttonId}.tts__listent_content:hover span {
                color: ${hoverTextColor};
            }
            #tts__listent_content_${buttonId}.tts__listent_content:hover svg polygon,
            #tts__listent_content_${buttonId}.tts__listent_content:hover svg path {
                fill: ${hoverTextColor};
            }
            #tts__listent_content_${buttonId}.tts__listent_content:hover svg[stroke] path,
            #tts__listent_content_${buttonId}.tts__listent_content:hover svg[stroke] line,
            #tts__listent_content_${buttonId}.tts__listent_content:hover .tts-settings-icon svg path,
            #tts__listent_content_${buttonId}.tts__listent_content:hover .tts-settings-icon svg circle {
                stroke: ${hoverTextColor};
            }
            .tts-button-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .tts-button-left svg {
                display: ${settings.shouldDisplayIcon};
            }
            .tts-button-right {
                display: flex;
                align-items: center;
            }
            .tts-settings-icon {
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }
            .tts-settings-icon:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            .tts-settings-icon:focus-visible {
                outline: 2px solid ${textColor};
                outline-offset: 2px;
                background-color: rgba(255, 255, 255, 0.2);
            }
            #tts__listent_content_${buttonId}.tts__listent_content:focus-visible {
                outline: 2px solid ${textColor};
                outline-offset: 2px;
            }
            .tts-sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;

        if (settings?.customCSS) {
            style.textContent += `
                ${this.#htmlDecode(settings.customCSS)}
            `;
        }

        shadow.appendChild(style);
        shadow.appendChild(wrapper);
    }

    /**
     * Get button HTML for new player
     */
    getNewButtonContent(buttonId, settings, status) {
        const colors = ttsObj?.settings?.customize || {};
        const textColor = colors.color || '#ffffff';

        let buttonText = window?.ttsObj?.buttonTextArr?.listen_text ?? 'Listen';
        let buttonHoverTitle = window?.ttsObj?.buttonTextArr?.listen_hover_title
            ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.listen_hover_title
            : 'Text To Audio: Click to listen post.';

        // Get icon based on status
        let iconSVG = '';
        if (window?.ttsObj?.player_customizations?.[1]?.play) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(ttsObj?.player_customizations?.[1]?.play, "image/svg+xml");
            iconSVG = doc.documentElement.outerHTML;
        } else {
            iconSVG = `<svg width='15px' height='15px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 8'><polygon fill='${textColor}' points='0 0 0 8 7 4'/></svg>`;
        }

        if (status === 'pause') {
            buttonText = window?.ttsObj?.buttonTextArr?.pause_text ?? 'Pause';
            buttonHoverTitle = window?.ttsObj?.buttonTextArr?.pause_hover_title
                ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.pause_hover_title
                : 'Text To Audio: Click to pause.';
            if (window?.ttsObj?.player_customizations?.[1]?.pause) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(ttsObj?.player_customizations?.[1]?.pause, "image/svg+xml");
                iconSVG = doc.documentElement.outerHTML;
            } else {
                iconSVG = `<svg width='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M14 9L14 15' stroke='${textColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M10 9L10 15' stroke='${textColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'></path><path d='M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z' stroke='${textColor}' stroke-width='2'></path></svg>`;
            }
        } else if (status === 'resume') {
            buttonText = window?.ttsObj?.buttonTextArr?.resume_text ?? 'Resume';
            buttonHoverTitle = window?.ttsObj?.buttonTextArr?.resume_hover_title
                ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.resume_hover_title
                : 'Text To Audio: Click to resume.';
            if (window?.ttsObj?.player_customizations?.[1]?.resume) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(ttsObj?.player_customizations?.[1]?.resume, "image/svg+xml");
                iconSVG = doc.documentElement.outerHTML;
            } else {
                iconSVG = `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${textColor}' stroke-width='1'><path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${textColor}'></path><path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${textColor}'></path></svg>`;
            }
        } else if (status === 'listen') {
            // After finished - show replay
            if (this.speech && this.speech.listenStatus === 'listen') {
                buttonText = window?.ttsObj?.buttonTextArr?.replay_text ?? 'Replay';
                buttonHoverTitle = window?.ttsObj?.buttonTextArr?.replay_hover_title
                    ? 'Text To Audio : ' + window?.ttsObj?.buttonTextArr?.replay_hover_title
                    : 'Text To Audio: Click to replay.';
                if (window?.ttsObj?.player_customizations?.[1]?.replay) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(ttsObj?.player_customizations?.[1]?.replay, "image/svg+xml");
                    iconSVG = doc.documentElement.outerHTML;
                } else {
                    iconSVG = `<svg width='20px' height='20px' viewBox='0 0 24.00 24.00' fill='none' xmlns='http://www.w3.org/2000/svg' stroke='${textColor}' stroke-width='1'><path d='M12 20.75C10.078 20.7474 8.23546 19.9827 6.8764 18.6236C5.51733 17.2645 4.75265 15.422 4.75 13.5C4.75 13.3011 4.82902 13.1103 4.96967 12.9697C5.11032 12.829 5.30109 12.75 5.5 12.75C5.69891 12.75 5.88968 12.829 6.03033 12.9697C6.17098 13.1103 6.25 13.3011 6.25 13.5C6.25 14.6372 6.58723 15.7489 7.21905 16.6945C7.85087 17.6401 8.74889 18.3771 9.79957 18.8123C10.8502 19.2475 12.0064 19.3614 13.1218 19.1395C14.2372 18.9177 15.2617 18.37 16.0659 17.5659C16.87 16.7617 17.4177 15.7372 17.6395 14.6218C17.8614 13.5064 17.7475 12.3502 17.3123 11.2996C16.8771 10.2489 16.1401 9.35087 15.1945 8.71905C14.2489 8.08723 13.1372 7.75 12 7.75H9.5C9.30109 7.75 9.11032 7.67098 8.96967 7.53033C8.82902 7.38968 8.75 7.19891 8.75 7C8.75 6.80109 8.82902 6.61032 8.96967 6.46967C9.11032 6.32902 9.30109 6.25 9.5 6.25H12C13.9228 6.25 15.7669 7.01384 17.1265 8.37348C18.4862 9.73311 19.25 11.5772 19.25 13.5C19.25 15.4228 18.4862 17.2669 17.1265 18.6265C15.7669 19.9862 13.9228 20.75 12 20.75Z' fill='${textColor}'></path><path d='M12 10.75C11.9015 10.7505 11.8038 10.7313 11.7128 10.6935C11.6218 10.6557 11.5392 10.6001 11.47 10.53L8.47 7.53003C8.32955 7.38941 8.25066 7.19878 8.25066 7.00003C8.25066 6.80128 8.32955 6.61066 8.47 6.47003L11.47 3.47003C11.5387 3.39634 11.6215 3.33724 11.7135 3.29625C11.8055 3.25526 11.9048 3.23322 12.0055 3.23144C12.1062 3.22966 12.2062 3.24819 12.2996 3.28591C12.393 3.32363 12.4778 3.37977 12.549 3.45099C12.6203 3.52221 12.6764 3.60705 12.7141 3.70043C12.7518 3.79382 12.7704 3.89385 12.7686 3.99455C12.7668 4.09526 12.7448 4.19457 12.7038 4.28657C12.6628 4.37857 12.6037 4.46137 12.53 4.53003L10.06 7.00003L12.53 9.47003C12.6704 9.61066 12.7493 9.80128 12.7493 10C12.7493 10.1988 12.6704 10.3894 12.53 10.53C12.4608 10.6001 12.3782 10.6557 12.2872 10.6935C12.1962 10.7313 12.0985 10.7505 12 10.75Z' fill='${textColor}'></path></svg>`;
                }
            }
        }

        // Settings icon (gear) - only visible when playing or paused
        const showSettingsIcon = status === 'pause' || status === 'resume';
        const settingsIconSVG = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        `;

        // Determine aria-label based on status
        let ariaLabel = buttonText;
        if (status === 'listen') {
            if (this.speech && this.speech.listenStatus === 'listen') {
                ariaLabel = buttonText; // Replay
            } else {
                ariaLabel = buttonText; // Listen / Play
            }
        } else if (status === 'pause') {
            ariaLabel = buttonText; // Pause
        } else if (status === 'resume') {
            ariaLabel = buttonText; // Resume
        }

        return `
            <div role="region" aria-label="Text to speech player">
                <button id="tts__listent_content_${buttonId}" class="tts__listent_content ${settings.cssClass}" type="button" title="${buttonHoverTitle}" aria-label="${ariaLabel} audio">
                    <div class="tts-button-left" aria-hidden="true">
                        ${iconSVG}
                        <span>${buttonText}</span>
                    </div>
                    <div class="tts-button-right">
                        ${showSettingsIcon ? `
                            <div class="tts-settings-icon" role="button" tabindex="0" aria-label="Player settings" title="Settings" data-button-id="${buttonId}">
                                ${settingsIconSVG}
                            </div>
                        ` : ''}
                    </div>
                </button>
                <div class="tts-sr-only tts-live-region" role="status" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;
    }

    /**
     * Update button UI based on current state
     */
    updateButtonUI(wrapper, buttonId, settings) {
        const button = wrapper.querySelector(`#tts__listent_content_${buttonId}`);
        if (!button) return;

        const newHTML = this.getNewButtonContent(buttonId, settings, this.listenStatus);
        wrapper.innerHTML = newHTML;

        // Announce state change to screen readers
        const liveRegion = wrapper.querySelector('.tts-live-region');
        if (liveRegion) {
            let announcement = '';
            if (this.listenStatus === 'pause') {
                announcement = 'Audio playing';
            } else if (this.listenStatus === 'resume') {
                announcement = 'Audio paused';
            } else if (this.listenStatus === 'listen') {
                announcement = 'Audio stopped';
            }
            // Clear and set to trigger announcement
            liveRegion.textContent = '';
            setTimeout(() => { liveRegion.textContent = announcement; }, 50);
        }

        // Re-attach settings icon click handler with keyboard support
        const settingsIcon = wrapper.querySelector('.tts-settings-icon');
        if (settingsIcon) {
            settingsIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSettingsModal();
            });
            settingsIcon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openSettingsModal();
                }
            });
        }
    }

    /**
     * Open settings modal (outside Shadow DOM)
     */
    openSettingsModal() {
        TTSSettingsModalManager.openModal(this);
    }

    /**
     * Callback after speech ends (new player)
     */
    callBackAfterEndNew() {
        this.listenStatus = 'listen';
        this.speech = this.speech.getData();

        // Update UI
        const shadow = this.shadowRoot;
        const wrapper = shadow.querySelector('.wrapper');
        if (wrapper) {
            this.updateButtonUI(wrapper, this.buttonId, window.TTS.settings);
        }
    }

    callBackAfterEnd() {
        if (this.listenStatus === 'listen') {
            this.displayButtonText();
        }
    }

    #htmlDecode(str) {
        let txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Define the new element
    if (!customElements.get('tts-play-button')) {
        customElements.define('tts-play-button', TTSPlayButton);
    } else {
        console.log({foundcustomElements: customElements.get('tts-play-button')});
    }
});
