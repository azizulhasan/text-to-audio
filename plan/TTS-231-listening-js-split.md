# TTS-231: Split Listening.js (1486 lines)

**Branch:** `feature/TTS-231`
**Date:** 2026-03-29
**Part of:** TTS-231 (do this split BEFORE adding Polylang code)

---

## 1. Target Structure

```
src/dashboard/components/dashboard/listening/
  Listening.js                    (~250 lines - orchestrator, state, form handlers)
  LanguageMapping.js              (~215 lines - multilingual mapping UI)
  utils.js                        (~100 lines - helpers, flag map, tick generators)
  hooks/
    useVoiceLoader.js             (~225 lines - voice/language fetching per player)
    useMultilingualDetection.js   (~60 lines  - detect active multilingual plugin)
  tts-providers/
    DefaultPlayerSettings.js      (~200 lines - Player ID < 3: browser speech synthesis)
    GoogleCloudSettings.js        (~90 lines  - Player ID 3-4: AtlasVoice TTS / Google Cloud)
    ElevenLabsSettings.js         (~280 lines - Player ID 6: ElevenLabs)
    ChatGPTSettings.js            (move from chatgpt/ - Player ID 5: ChatGPT)
```

---

## 2. Extraction Plan

### File 1: `utils.js` — Pure Helper Functions

Extract from Listening.js:
- `getLanguageFlag(langCode)` (lines 588-627) — flag CDN URL with country code mapping
- `generateSpeedTicks()` (lines 656-662)
- `generateVolumeTicks()` (lines 664-670)

```javascript
// utils.js
import { __ } from "@wordpress/i18n";

export const getLanguageFlag = (langCode) => { ... };
export const generateSpeedTicks = () => { ... };
export const generateVolumeTicks = () => { ... };
```

---

### File 2: `hooks/useMultilingualDetection.js` — Custom Hook

Extract the `useEffect` at lines 131-190 that detects GTranslate/WPML/TranslatePress (and soon Polylang).

```javascript
// hooks/useMultilingualDetection.js
import { useState, useEffect } from "react";

export default function useMultilingualDetection() {
    const [multilingualActiveLanguages, setMultilingualActiveLanguages] = useState({});
    const [activePluginName, setActivePluginName] = useState("");

    useEffect(() => {
        // GTranslate detection
        // WPML detection
        // TranslatePress detection
        // (Polylang will be added here in TTS-231)
    }, [window?.ttsObjPro]);

    return { multilingualActiveLanguages, activePluginName };
}
```

Also absorb `getActiveMultingualPluginName()` (lines 570-586) — set `activePluginName` directly in the hook instead of a separate function.

**Returns:** `{ multilingualActiveLanguages, activePluginName }`

---

### File 3: `hooks/useVoiceLoader.js` — Custom Hook

Extract all voice/language loading logic:
- `setGoogleVoicesAndLanguages()` (lines 192-280)
- `setGPTVoicesAndLanguages(model)` (lines ~280-340)
- `setElevenLabsVoicesAndLanguages()` (lines ~340-375)
- `setVoicesAndLanguages()` (lines 375-398)
- The `useEffect` at lines 400-423 that triggers loading based on player type

```javascript
// hooks/useVoiceLoader.js
import { useState, useEffect } from "react";
import { getData, setLocalStorage, getLocalStorage, gttsSupportedLanguages, chatGPTLanguages, CHATGPT_CLASSIC_VOICES, GPT4O_MINI_TTS_VOICES } from "../../context/utilities";

export default function useVoiceLoader(customizationSettings) {
    const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
    const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);
    const [currentPlayerFilteredVoices, setCurrentPlayerFilteredVoices] = useState([]);
    const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);
    const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
    const [languageMissingMessage, setLanguageMissingMessage] = useState("");

    // ... all loading functions and useEffects

    return {
        currentPlayerVoices,
        currentPlayerLanguages,
        currentPlayerFilteredVoices,
        speechSynthesisVoices,
        elevenLabsVoices,
        languageMissingMessage,
        setCurrentPlayerFilteredVoices,
        setGPTVoicesAndLanguages,   // needed by ChatGPTSettings onModelChange
    };
}
```

**Returns:** All voice/language state + setter needed by ChatGPT model change

---

### File 4: `tts-providers/DefaultPlayerSettings.js` — Player < 3 UI

Extract JSX from lines 685-875. Receives props:

```javascript
// tts-providers/DefaultPlayerSettings.js
import React from "react";
import { Col, Row, Form, Button } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import Icon from "../../../Icon";
import { getLanguageFlag, generateSpeedTicks, generateVolumeTicks } from "../utils";

export default function DefaultPlayerSettings({
    listeningSettings,
    currentPlayerLanguages,
    currentPlayerFilteredVoices,
    handleChange,
}) { ... }
```

---

### File 5: `tts-providers/GoogleCloudSettings.js` — Player 3-4 UI

Extract JSX from lines 879-967. Receives props:

```javascript
// tts-providers/GoogleCloudSettings.js
export default function GoogleCloudSettings({
    listeningSettings,
    customizationSettings,
    currentPlayerLanguages,
    currentPlayerFilteredVoices,
    handleChange,
    baseMP3File,
}) { ... }
```

---

### File 6: `tts-providers/ElevenLabsSettings.js` — Player 6 UI

Extract JSX from lines 984-1245. This is the largest chunk (~260 lines). Receives props:

```javascript
// tts-providers/ElevenLabsSettings.js
export default function ElevenLabsSettings({
    listeningSettings,
    currentPlayerLanguages,
    elevenLabsVoices,
    handleChange,
    baseMP3File,
}) { ... }
```

---

### File 7: Move `chatgpt/ChatGPTSettings.js` to `tts-providers/ChatGPTSettings.js`

Move the existing file from `chatgpt/` to `tts-providers/`. Update the import in Listening.js.

---

### File 8: `LanguageMapping.js` — Multilingual Mapping UI

Extract JSX from lines 1252-1467. Receives props:

```javascript
// LanguageMapping.js
import React from "react";
import { Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { __, sprintf } from "@wordpress/i18n";
import Icon from "../../Icon";
import { getLanguageFlag } from "./utils";

export default function LanguageMapping({
    multilingualActiveLanguages,
    activePluginName,
    listeningSettings,
    customizationSettings,
    currentPlayerLanguages,
    currentPlayerVoices,
    elevenLabsVoices,
    handleChange,
}) { ... }
```

---

### File 9: `Listening.js` — Slim Orchestrator (~250 lines)

After extraction, Listening.js becomes:

```javascript
import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row, Form, Button } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";

// Hooks
import useVoiceLoader from "./hooks/useVoiceLoader";
import useMultilingualDetection from "./hooks/useMultilingualDetection";

// TTS Provider Components
import DefaultPlayerSettings from "./tts-providers/DefaultPlayerSettings";
import GoogleCloudSettings from "./tts-providers/GoogleCloudSettings";
import ChatGPTSettings from "./tts-providers/ChatGPTSettings";
import ElevenLabsSettings from "./tts-providers/ElevenLabsSettings";

// Multilingual
import LanguageMapping from "./LanguageMapping";

export default function Listening() {
    // --- State ---
    const [customizationSettings, setCustomizationSettings] = useState({});
    const [listeningSettings, setListeningSettings] = useState({ ... });
    const [baseMP3File, setBaseMP3File] = useState("...");
    const [isListeningSettingsLoaded, setIsListeningSettingsLoaded] = useState(false);

    // --- Hooks ---
    const {
        currentPlayerVoices, currentPlayerLanguages, currentPlayerFilteredVoices,
        speechSynthesisVoices, elevenLabsVoices, languageMissingMessage,
        setCurrentPlayerFilteredVoices, setGPTVoicesAndLanguages,
    } = useVoiceLoader(customizationSettings);

    const { multilingualActiveLanguages, activePluginName } = useMultilingualDetection();

    // --- Audio preview useEffect (lines 82-122) ---
    // --- Data loading useEffect ---
    // --- handleSubmit ---
    // --- handleChange ---

    const playerId = customizationSettings?.buttonSettings?.id;

    return (
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    {/* Header */}
                    <Form onSubmit={handleSubmit}>
                        {playerId < 3 ? (
                            <DefaultPlayerSettings ... />
                        ) : playerId === 3 || playerId === 4 ? (
                            <GoogleCloudSettings ... />
                        ) : playerId === 5 ? (
                            <ChatGPTSettings ... />
                        ) : playerId === 6 ? (
                            <ElevenLabsSettings ... />
                        ) : null}

                        <LanguageMapping ... />

                        <Button type="submit" className="tta_btn">
                            {__('Save', 'text-to-audio')}
                        </Button>
                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro />
                </Col>
            </Row>
        </Container>
    );
}
```

---

## 3. Extraction Order

Do the split in this order to minimize conflicts:

1. Create `utils.js` (pure functions, no dependencies)
2. Create `hooks/useMultilingualDetection.js`
3. Create `hooks/useVoiceLoader.js`
4. Move `chatgpt/ChatGPTSettings.js` to `tts-providers/ChatGPTSettings.js`
5. Create `tts-providers/DefaultPlayerSettings.js`
6. Create `tts-providers/GoogleCloudSettings.js`
7. Create `tts-providers/ElevenLabsSettings.js`
8. Create `LanguageMapping.js`
9. Slim down `Listening.js` (replace extracted code with imports + component calls)
10. Delete `chatgpt/` directory

---

## 4. Testing

After split:
- `npm run dev` — verify no build errors
- Navigate to AtlasVoice > Listening in admin
- Test each player type (switch in Customization, come back to Listening):
  - Player < 3 (Default): voice/language selects, speed/volume sliders, pitch buttons
  - Player 3 (AtlasVoice TTS): language select
  - Player 4 (Google Cloud): language + voice selects, audio preview
  - Player 5 (ChatGPT): model, voice, instructions
  - Player 6 (ElevenLabs): language, voice, model, all sliders, speaker boost, audio preview
- Test multilingual mapping section (if WPML/GTranslate/TranslatePress active)
- Save settings, reload, verify persistence
- No JS console errors
