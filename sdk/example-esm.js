/**
 * AtlasVoice SDK — ES Modules Example
 *
 * Usage with modern bundlers (Vite, Rollup, esbuild) or browsers:
 *   1. Copy text-to-speech-tts.js into your project
 *   2. import AtlasVoice from 'text-to-speech-tts'
 *   3. Bundle or use <script type="module" src="example-esm.js">
 */

import AtlasVoice from 'text-to-speech-tts';

let player;

// ---- Custom console logger ----
const consoleEl = document.getElementById('console');
function log(text, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry log-' + type;
    const time = new Date().toLocaleTimeString();
    entry.textContent = '[' + time + '] ' + text;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// ---- Analytics helpers ----
function flushAnalytics() {
    if (player && player.analytics) {
        player.analytics.sendSessionData();
        log('Analytics data sent manually');
    } else {
        log('Analytics not enabled or player not initialized', 'error');
    }
}
function viewSessionData() {
    const outputEl = document.getElementById('analytics-output');
    try {
        const data = sessionStorage.getItem('atlasvoice_sdk_analytics_data');
        const parsed = data ? JSON.parse(data) : {};
        outputEl.textContent = JSON.stringify(parsed, null, 2);
        outputEl.style.display = 'block';
        log('Session data displayed');
    } catch (e) {
        outputEl.textContent = 'Error reading session data: ' + e.message;
        outputEl.style.display = 'block';
        log('Error reading session data', 'error');
    }
}

// Expose to HTML onclick handlers
window.flushAnalytics = flushAnalytics;
window.viewSessionData = viewSessionData;
window.clearConsole = () => { consoleEl.innerHTML = ''; };

// ---- Initialize Player ----
log(`Initializing AtlasVoice SDK v${AtlasVoice.VERSION} (ES Module)...`);

player = new AtlasVoice({
    contentSelector: '#article-body',
    playerSelector: '#tts-player',
    lang: 'en-US',
    rate: 1,
    pitch: 1,
    volume: 1,
    theme: 'default',
    analytics: {
        enabled: true,
        wpRestUrl: 'http://localhost:6060/azizulhasan/tts/wp-json',
        postId: 12321231,
        credentials: {
            username: 'admin',
            password: 'fYcc H7hq xG4F BHmp CQTm zKL6'
        }
    }
});

player.on('play', () => log('Event: play', 'event'));
player.on('pause', () => log('Event: pause', 'event'));
player.on('resume', () => log('Event: resume', 'event'));
player.on('end', () => log('Event: end', 'event'));
player.on('stop', () => log('Event: stop', 'event'));
player.on('error', (e) => log('Event: error - ' + JSON.stringify(e), 'error'));
player.on('voiceschanged', (voices) => log(`Event: voiceschanged - ${voices.length} voices loaded`, 'event'));

log('Player initialized (default theme)');

// Auto-send analytics every 30 seconds
setInterval(() => { flushAnalytics(); }, 30000);
