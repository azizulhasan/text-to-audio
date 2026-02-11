# text-to-speech-tts

A standalone JavaScript SDK for adding text-to-speech to any website using the browser's built-in `speechSynthesis` API.

Works independently on any website — no WordPress or backend required. Also integrates with the [Text to Audio](https://wordpress.org/plugins/text-to-audio/) WordPress plugin for cross-domain analytics tracking.

## Features

- Works on any website — no WordPress or backend needed
- Built on the Web Speech API (`speechSynthesis`)
- Player UI with play, pause, resume, voice & language controls
- Reads content from any DOM selector (class or ID)
- Two built-in themes (default and minimal)
- Cross-domain analytics tracking (optional, requires [Text to Audio](https://wordpress.org/plugins/text-to-audio/) plugin)
- Browser fingerprinting for unique visitor tracking via FingerprintJS
- Works with `<script>` tags, CommonJS (`require`), and ES Modules (`import`)

## Installation

```bash
npm install text-to-speech-tts
```

Or use a CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/text-to-speech-tts/text-to-speech-tts.css">
<script src="https://unpkg.com/text-to-speech-tts/text-to-speech-tts.min.js"></script>
```

## Usage

### Script Tag (Browser Global)

```html
<link rel="stylesheet" href="node_modules/text-to-speech-tts/text-to-speech-tts.css">
<script src="node_modules/text-to-speech-tts/text-to-speech-tts.min.js"></script>
<script>
  var player = new AtlasVoice({
    contentSelector: '#article-body',
    playerSelector: '#tts-player',
  });
</script>
```

### CommonJS (Webpack, Browserify)

```js
const AtlasVoice = require('text-to-speech-tts');

const player = new AtlasVoice({
  contentSelector: '#article-body',
  playerSelector: '#tts-player',
});
```

### ES Modules (Vite, Rollup, modern browsers)

```js
import AtlasVoice from 'text-to-speech-tts';

const player = new AtlasVoice({
  contentSelector: '#article-body',
  playerSelector: '#tts-player',
});
```

For native browser ESM (without a bundler), import from the ESM wrapper:

```html
<script type="module">
  import AtlasVoice from './text-to-speech-tts.esm.js';

  const player = new AtlasVoice({
    contentSelector: '#article-body',
    playerSelector: '#tts-player',
  });
</script>
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `contentSelector` | `string` | `''` | CSS selector for the content element to read |
| `playerSelector` | `string` | `''` | CSS selector for the player container |
| `lang` | `string` | `'en-US'` | Default language/locale |
| `voiceName` | `string` | `''` | Preferred voice name |
| `rate` | `number` | `1` | Speech rate (0.1 - 10) |
| `pitch` | `number` | `1` | Speech pitch (0 - 2) |
| `volume` | `number` | `1` | Speech volume (0 - 1) |
| `theme` | `string` | `'default'` | Player theme (`'default'` or `'minimal'`) |
| `analytics` | `object` | `null` | Analytics configuration (see below) |

## Analytics

Analytics is an optional feature that tracks how users interact with the TTS player — play, pause, resume, end events, total listening time, and device info. Data is sent to your WordPress site via the REST API.

**This feature requires the [Text to Audio](https://wordpress.org/plugins/text-to-audio/) WordPress plugin** installed on the site that receives the analytics data. The SDK can be embedded on any external website and send analytics cross-domain to your WordPress site.

### Setup

1. Install and activate the [Text to Audio](https://wordpress.org/plugins/text-to-audio/) plugin on your WordPress site
2. Create a WordPress Application Password (Users > Your Profile > Application Passwords)
3. Pass the analytics config when initializing the SDK:

```js
var player = new AtlasVoice({
  contentSelector: '#article-body',
  playerSelector: '#tts-player',
  analytics: {
    enabled: true,
    wpRestUrl: 'https://yoursite.com/wp-json',
    postId: 123,
    credentials: {
      username: 'your-wp-username',
      password: 'XXXX XXXX XXXX XXXX XXXX XXXX'
    }
  }
});
```

### Analytics Options

| Option | Type | Required | Description |
|---|---|---|---|
| `enabled` | `boolean` | Yes | Set to `true` to enable analytics |
| `wpRestUrl` | `string` | Yes | Your WordPress site's REST API URL (e.g. `https://yoursite.com/wp-json`) |
| `postId` | `number` | Yes | The post ID to associate analytics with |
| `credentials.username` | `string` | Yes | WordPress username |
| `credentials.password` | `string` | Yes | WordPress Application Password |

### What is tracked

| Event | Description |
|---|---|
| `play` | Number of times play was triggered |
| `pause` | Number of times pause was triggered |
| `resume` | Number of times resume was triggered |
| `end` | Number of times speech completed |
| `time` | Total listening duration in seconds |
| `device_info` | Browser, OS, device type, language, timezone |

### How it works

- Analytics data accumulates in `sessionStorage` during the user's session
- Data is automatically sent to your WordPress site on page unload (`beforeunload`)
- Uses `fetch` with `keepalive` for reliable delivery during navigation
- Each visitor gets a unique ID via FingerprintJS (browser fingerprinting)
- Authentication uses WordPress Application Passwords (Basic Auth over HTTPS)

### Manual analytics control

```js
// Send analytics data immediately
player.analytics.sendSessionData();

// View current session data
var data = sessionStorage.getItem('atlasvoice_sdk_analytics_data');
console.log(JSON.parse(data));
```

## Events

```js
player.on('play', function () { console.log('Playing'); });
player.on('pause', function () { console.log('Paused'); });
player.on('resume', function () { console.log('Resumed'); });
player.on('end', function () { console.log('Ended'); });
player.on('stop', function () { console.log('Stopped'); });
player.on('error', function (e) { console.error('Error:', e); });
player.on('voiceschanged', function (voices) { console.log(voices.length + ' voices loaded'); });
```

## API

| Method | Description |
|---|---|
| `player.play()` | Start speaking |
| `player.pause()` | Pause speech |
| `player.resume()` | Resume speech |
| `player.stop()` | Stop speech |
| `player.destroy()` | Cleanup and remove player |
| `player.on(event, fn)` | Listen for an event |
| `player.off(event, fn)` | Remove an event listener |
| `player.getVoices()` | Get available voices |
| `player.getLanguages()` | Get available languages |
| `player.setVoice(name)` | Set voice by name |
| `player.setLang(code)` | Set language by code |
| `player.setRate(rate)` | Set speech rate (0.1 - 10) |
| `player.setPitch(pitch)` | Set pitch (0 - 2) |
| `player.setVolume(vol)` | Set volume (0 - 1) |

## CSS Customization

Override CSS custom properties on `.atlasvoice-player`:

```css
.atlasvoice-player {
  --av-primary: #184c53;
  --av-primary-hover: #0f363b;
  --av-bg: #ffffff;
  --av-text: #333333;
  --av-border: #e0e0e0;
  --av-radius: 8px;
}
```

## Package Files

| File | Purpose |
|---|---|
| `text-to-speech-tts.min.js` | Production build (minified, UMD) — for `<script>` tags and `require()` |
| `text-to-speech-tts.esm.js` | ES Module wrapper — for native browser `import` |
| `text-to-speech-tts.css` | Player styles |
| `index.d.ts` | TypeScript type declarations |

## Browser Support

Works in all modern browsers that support the Web Speech API:
- Chrome / Edge (Chromium)
- Firefox
- Safari

## Related

- [Text to Audio](https://wordpress.org/plugins/text-to-audio/) — Free WordPress text-to-speech plugin (browser voices)
- [Text to Speech Pro](https://atlasaidev.com/plugins/text-to-speech-pro/) — Pro version with Google Cloud TTS, gTTS, and ChatGPT/OpenAI voices

## License

GPL-3.0+ - see [LICENSE](LICENSE)

## Author

Azizul Hasan - [AtlasAiDev](https://atlasaidev.com/)
