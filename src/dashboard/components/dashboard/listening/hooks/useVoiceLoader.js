import { useState, useEffect, useMemo } from "react";
import {
  getData,
  setLocalStorage,
  getLocalStorage,
  gttsSupportedLanguages,
  areAllKeysNumeric,
  chatGPTLanguages,
  CHATGPT_CLASSIC_VOICES,
  GPT4O_MINI_TTS_VOICES,
} from "../../../context/utilities";

/**
 * Custom hook that loads voices and languages for the active TTS player.
 *
 * @param {object}   customizationSettings  Current customization settings (contains buttonSettings.id)
 * @param {string}   listeningVoiceModel    Current ChatGPT voice model setting
 * @returns {object} Voice/language state and setters
 */
export default function useVoiceLoader(customizationSettings, listeningVoiceModel) {
  const [currentPlayerVoices, setCurrentPlayerVoices] = useState([]);
  const [currentPlayerLanguages, setCurrentPlayerLanguages] = useState([]);
  const [currentPlayerFilteredVoices, setCurrentPlayerFilteredVoices] =
    useState([]);
  const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [languageMissingMessage, setLanguageMissingMessage] = useState("");

  const apiURL = useMemo(() => {
    if (window.hasOwnProperty("ttsObj") && ttsObj.is_pro_active) {
      return (
        ttsObj.api_url +
        ttsObj.api_namespace +
        "_pro/" +
        ttsObj.api_version +
        "/"
      );
    }

    return (
      ttsObj.api_url + ttsObj.api_namespace + "/" + ttsObj.api_version + "/"
    );
  });

  // ── Google Cloud TTS voices ──────────────────────────────────────────
  const setGoogleVoicesAndLanguages = () => {
    let stored_voices = getLocalStorage(["tta__voices"]);
    let languageHelper = null;
    if (typeof TTSProLanguageHelper === "function") {
      languageHelper = new TTSProLanguageHelper();
    }
    if (!stored_voices?.tta__voices) {
      getData(apiURL + "voices")
        .then((res) => {
          console.log(res?.voices?.voices);
          if (res?.voices?.length) {
            setLocalStorage({ tta__voices: JSON.stringify(res.voices) });
          }
          if (res?.voices?.voices?.length) {
            setLocalStorage({ tta__voices: JSON.stringify(res.voices.voices) });
          } else {
            setVoicesAndLanguages();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      let voices = JSON.parse(stored_voices.tta__voices);
      let langs = [];
      let langs2 = {};

      try {
        voices = JSON.parse(voices);
      } catch (error) {
        console.log({ catch_voices: voices });
      }

      if (voices?.voices) {
        voices = voices.voices;
      }

      voices.map((voice) => {
        if (!langs.includes(voice.languageCodes[0])) {
          langs.push(voice.languageCodes[0]);
          let languageName = voice.languageCodes[0];
          if (languageHelper) {
            languageName = languageHelper.getLangByCode(languageName);
          }
          langs2[voice.languageCodes[0]] = languageName;
        }
      });

      setVoicesAndLanguages(voices, langs2);
    }
  };

  // ── ChatGPT TTS voices ──────────────────────────────────────────────
  const setGPTVoicesAndLanguages = (model) => {
    const voices =
      model === "gpt-4o-mini-tts" ? GPT4O_MINI_TTS_VOICES : CHATGPT_CLASSIC_VOICES;

    setCurrentPlayerVoices(voices);
    setCurrentPlayerFilteredVoices(voices);
    setSpeechSynthesisVoices(voices);
  };

  // ── ElevenLabs voices ───────────────────────────────────────────────
  // Cache is language-keyed so switching the listening language triggers
  // a fresh fetch of `/v1/shared-voices` for that language (capped at 100).
  const setElevenLabsVoicesAndLanguages = (language = "") => {
    if (!(window.hasOwnProperty("ttsObj") && ttsObj.is_pro_active)) {
      return;
    }

    // Normalize to 2-letter ISO language code (e.g. "en-GB" → "en").
    const langCode = (language || "").toLowerCase().split(/[-_]/)[0] || "";
    const cacheKey = langCode
      ? `tts_elevenlabs_voices_${langCode}`
      : "tts_elevenlabs_voices";

    const applyVoices = (voices) => {
      setElevenLabsVoices(voices);
      const voiceNames = voices.map((v) => v.name);
      setCurrentPlayerVoices(voiceNames);
      setCurrentPlayerFilteredVoices(voiceNames);
      setSpeechSynthesisVoices(voiceNames);
      setCurrentPlayerLanguages(chatGPTLanguages());
    };

    const stored = getLocalStorage([cacheKey]);
    if (stored?.[cacheKey]) {
      try {
        applyVoices(JSON.parse(stored[cacheKey]));
        return;
      } catch (e) {
        console.log("Error parsing stored ElevenLabs voices:", e);
      }
    }

    const proApiURL =
      ttsObj.api_url + ttsObj.api_namespace + "_pro/" + ttsObj.api_version + "/";
    const endpoint = langCode
      ? `${proApiURL}elevenlabs_voices?language=${encodeURIComponent(langCode)}`
      : `${proApiURL}elevenlabs_voices`;

    getData(endpoint)
      .then((res) => {
        if (res?.voices && res.voices.length) {
          setLocalStorage({ [cacheKey]: JSON.stringify(res.voices) });
          applyVoices(res.voices);
        }
      })
      .catch((err) => {
        console.log("ElevenLabs voices error:", err);
      });
  };

  // ── Browser speech synthesis / fallback ─────────────────────────────
  const setVoicesAndLanguages = (voices = [], langs = []) => {
    if (Array.isArray(voices) && voices.length) {
      setCurrentPlayerVoices(voices);
      setCurrentPlayerFilteredVoices(voices);
      setSpeechSynthesisVoices(voices);
    }
    if (Array.isArray(langs) && langs.length) {
      if (areAllKeysNumeric(langs)) {
        let newLangs = {};
        for (let lang of langs) {
          newLangs[lang] = lang;
        }
        setCurrentPlayerLanguages(newLangs);
      } else {
        setCurrentPlayerLanguages(langs);
      }
    } else {
      setCurrentPlayerLanguages(langs);
    }

    if (Object.keys(langs).length && Array.isArray(voices) && voices.length)
      return;

    let timer = setTimeout(function handleTime() {
      timer = setTimeout(handleTime, 1000);
      console.log({ customizationSettings, timer });

      if (timer > 500 || customizationSettings?.buttonSettings == undefined) {
        clearTimeout(timer);
        timer = null;
      }
      if (
        window.hasOwnProperty("speechSynthesis") &&
        window.speechSynthesis.getVoices().length &&
        customizationSettings?.buttonSettings?.id < 3
      ) {
        clearTimeout(timer);
        timer = null;
        setSpeechSynthesisVoices(window.speechSynthesis.getVoices());
        let newLangs = {};
        window.speechSynthesis.getVoices().map((item) => {
          if (!langs.includes(item.lang)) {
            langs[item.lang] = item.lang;
          }
        });
        setCurrentPlayerLanguages(langs);
        setCurrentPlayerVoices(window.speechSynthesis.getVoices());
        setCurrentPlayerFilteredVoices(window.speechSynthesis.getVoices());
      }
    });
  };

  // ── Player-type dependent loading ───────────────────────────────────
  useEffect(() => {
    if (window.hasOwnProperty("ttsObjPro") && ttsObjPro?.is_pro_active) {
      if (customizationSettings?.buttonSettings?.id == 3) {
        let gttsLanguages = gttsSupportedLanguages();
        setCurrentPlayerLanguages(gttsLanguages);
        setLanguageMissingMessage("");
      } else if (customizationSettings?.buttonSettings?.id == 5) {
        let languages = chatGPTLanguages();
        setCurrentPlayerLanguages(languages);
        setLanguageMissingMessage("");
      } else if (customizationSettings?.buttonSettings?.id == 6) {
        // Languages shown in the UI dropdown are the same chatGPTLanguages set;
        // the actual voice filtering happens server-side via `/v1/shared-voices`.
        let languages = chatGPTLanguages();
        setCurrentPlayerLanguages(languages);
        setLanguageMissingMessage("");
      } else if (customizationSettings?.buttonSettings?.id < 3) {
        setLanguageMissingMessage(
          "Looking for another language? Please select the another player from customization menu. Your language may be appear."
        );
      } else if (customizationSettings?.buttonSettings?.id == 4) {
        setGoogleVoicesAndLanguages();
        setLanguageMissingMessage("");
      }
    }
  }, [customizationSettings]);

  // ── Re-load voices on player change ─────────────────────────────────
  useEffect(() => {
    if (customizationSettings?.buttonSettings?.id < 3) {
      setVoicesAndLanguages();
    }

    if (customizationSettings?.buttonSettings?.id == 5) {
      setGPTVoicesAndLanguages(listeningVoiceModel);
    }

    if (customizationSettings?.buttonSettings?.id == 6) {
      setElevenLabsVoicesAndLanguages();
    }
  }, [customizationSettings]);

  return {
    currentPlayerVoices,
    currentPlayerLanguages,
    currentPlayerFilteredVoices,
    speechSynthesisVoices,
    elevenLabsVoices,
    languageMissingMessage,
    setCurrentPlayerFilteredVoices,
    setGPTVoicesAndLanguages,
    setGoogleVoicesAndLanguages,
    setVoicesAndLanguages,
    setElevenLabsVoicesAndLanguages,
  };
}
