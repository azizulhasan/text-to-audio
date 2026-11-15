/**
 * TTS-347: when a post's audio cannot be made, the post is read with the
 * device's voice instead, behind a plain Listen button. A visitor is never
 * left with an error.
 *
 * One module for the free MP3 player (its last resort when the browser-voice
 * button's own bundle cannot be loaded) and for an extension's player, which
 * reaches it as `TextToSpeech.BrowserFallback`.
 */

/**
 * Whether this browser can read aloud with the class that is on the page.
 *
 * @param {Function} Speaker The browser-voice class (window.TextToSpeech).
 * @return {boolean}
 */
export function canSpeak(Speaker = window.TextToSpeech) {
    return typeof Speaker === 'function' && typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Puts a Listen button into a container and, unless told not to, starts
 * reading: the visitor already pressed play.
 *
 * @param {HTMLElement} container        Where the button goes; it is emptied first.
 * @param {Object}      options
 * @param {string}      options.buttonId The player's id on the page.
 * @param {string}      options.content  The text to read.
 * @param {Object}      options.TTS      The page data printed by the plugin.
 * @param {Function}    options.Speaker  The browser-voice class.
 * @param {boolean}     options.start    Whether to start reading at once.
 * @return {HTMLElement|null} The button, or null when this browser cannot read aloud.
 */
export function mount(container, { buttonId, content, TTS = window.TTS, Speaker = window.TextToSpeech, start = true } = {}) {
    if (!container || !canSpeak(Speaker) || !content) {
        return null;
    }

    container.innerHTML = '';

    // The browser-voice button's own class, styled by its stylesheet, so the
    // fallback looks like the browser-voice player and not like a stray button.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tts__listent_content atlasvoice-mp3-player__fallback';
    button.id = buttonId;
    // A page that does not load the browser-voice player's stylesheet (an
    // extension's player) would show a bare browser button; give it a plain,
    // touch-sized look there. With the stylesheet, its own rules stay in charge.
    if (!document.querySelector?.('link[href*="text-to-audio-button"]')) {
        button.style.cssText = 'display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 18px;border:2px solid currentColor;border-radius:8px;background:#fff;color:inherit;font:inherit;font-size:16px;cursor:pointer;';
    }
    container.append(button);

    const speaker = new Speaker(buttonId, content, button, TTS);
    // The browser-voice class draws and updates its button only as player 1
    // (its own player); start it with player 1's normal "Listen" content.
    speaker.playButtonNo = 1;
    button.innerHTML = speaker.playButtonContent();
    button.addEventListener('click', () => speaker._init(null, true));

    if (start) {
        speaker._init(null, true);
    }

    return button;
}

export default { canSpeak, mount };
