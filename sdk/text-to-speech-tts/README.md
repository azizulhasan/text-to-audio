# AtlasVoice SDK

A standalone JavaScript SDK for adding text-to-speech to any website using the browser's built-in `speechSynthesis` API. No server required.

## Features

- Works on any website — no WordPress or backend needed
- Built on the Web Speech API (`speechSynthesis`)
- Player UI with play, pause, resume, speed, voice & language controls
- Reads content from any DOM selector (class or ID)
- Two built-in themes (default and minimal)
- Cross-domain analytics tracking (optional, for WordPress sites)
- Browser fingerprinting for anonymous user tracking via FingerprintJS
- UMD module — works with `<script>` tags, CommonJS, and ES Modules

## Installation

```bash
npm install text-to-speech-tts
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

var player = new AtlasVoice({
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

### Analytics Options

```js
var player = new AtlasVoice({
  contentSelector: '#article-body',
  playerSelector: '#tts-player',
  analytics: {
    enabled: true,
    wpRestUrl: 'https://yoursite.com/wp-json',
    postId: 123,
    credentials: {
      username: 'sdk-user',
      password: 'XXXX XXXX XXXX XXXX XXXX XXXX'
    }
  }
});
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

## Browser Support

Works in all modern browsers that support the Web Speech API:
- Chrome / Edge (Chromium)
- Firefox
- Safari

## License

GPL-3.0+ - see [LICENSE](LICENSE)

## Author

Azizul Hasan - [AtlasAiDev](https://atlasaidev.com/)
