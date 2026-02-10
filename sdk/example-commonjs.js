/**
 * AtlasVoice SDK — CommonJS Example
 *
 * Usage with bundlers like Webpack or Browserify:
 *   1. npm install (or copy text-to-speech-tts.js into your project)
 *   2. require('text-to-speech-tts') in your code
 *   3. Bundle with: npx webpack example-commonjs.js -o dist/bundle.js
 *   4. Include dist/bundle.js in your HTML via <script> tag
 */

const AtlasVoice = require('./text-to-speech-tts');

var player;

// ---- Custom console logger ----
var consoleEl = document.getElementById('console');
function log(text, type) {
    type = type || 'info';
    var entry = document.createElement('div');
    entry.className = 'log-entry log-' + type;
    var time = new Date().toLocaleTimeString();
    entry.textContent = '[' + time + '] ' + text;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// ---- Analytics helpers ----
function flushAnalytics() {
    if (player && player.analytics) {
        player.analytics.sendSessionData();
        log('Analytics data sent manually', 'info');
    } else {
        log('Analytics not enabled or player not initialized', 'error');
    }
}
function viewSessionData() {
    var outputEl = document.getElementById('analytics-output');
    try {
        var data = sessionStorage.getItem('atlasvoice_sdk_analytics_data');
        var parsed = data ? JSON.parse(data) : {};
        outputEl.textContent = JSON.stringify(parsed, null, 2);
        outputEl.style.display = 'block';
        log('Session data displayed', 'info');
    } catch (e) {
        outputEl.textContent = 'Error reading session data: ' + e.message;
        outputEl.style.display = 'block';
        log('Error reading session data', 'error');
    }
}

// Expose to HTML onclick handlers
window.flushAnalytics = flushAnalytics;
window.viewSessionData = viewSessionData;
window.clearConsole = function () { consoleEl.innerHTML = ''; };

// ---- Initialize Player ----
log('Initializing AtlasVoice SDK v' + AtlasVoice.VERSION + ' (CommonJS)...', 'info');

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

player.on('play', function () { log('Event: play', 'event'); });
player.on('pause', function () { log('Event: pause', 'event'); });
player.on('resume', function () { log('Event: resume', 'event'); });
player.on('end', function () { log('Event: end', 'event'); });
player.on('stop', function () { log('Event: stop', 'event'); });
player.on('error', function (e) { log('Event: error - ' + JSON.stringify(e), 'error'); });
player.on('voiceschanged', function (voices) { log('Event: voiceschanged - ' + voices.length + ' voices loaded', 'event'); });

log('Player initialized (default theme)', 'info');

// Auto-send analytics every 30 seconds
setInterval(function () { flushAnalytics(); }, 30000);
