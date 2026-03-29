import { useState, useEffect } from "react";

/**
 * Custom hook to detect active multilingual plugin and extract its active languages.
 *
 * Supports: GTranslate, WPML (Sitepress), TranslatePress.
 *
 * @returns {{ multilingualActiveLanguages: object, activePluginName: string }}
 */
export default function useMultilingualDetection() {
  const [multilingualActiveLanguages, setMultilingualActiveLanguages] =
    useState({});
  const [activePluginName, setActivePluginName] = useState("");

  useEffect(() => {
    if (window?.ttsObjPro?.compatible?.["gtranslate/gtranslate.php"]) {
      let gtranslateActiveLanguages =
        ttsObjPro?.compatible?.["gtranslate/gtranslate.php"]?.allowed_languages;
      const languageObject = {};

      for (const langCode of gtranslateActiveLanguages) {
        languageObject[langCode] = langCode;
      }

      setMultilingualActiveLanguages(languageObject);
      setActivePluginName("Gtranslate");
    } else if (
      window?.ttsObjPro?.compatible?.[
        "sitepress-multilingual-cms/sitepress.php"
      ]
    ) {
      let wpmlActiveLanguages =
        ttsObjPro?.compatible?.["sitepress-multilingual-cms/sitepress.php"]
          ?.active_languages;

      const languageObject = {};
      let active_languages = Object.keys(wpmlActiveLanguages);

      for (const langCode of active_languages) {
        languageObject[langCode] =
          wpmlActiveLanguages[langCode].english_name;
      }

      setMultilingualActiveLanguages(languageObject);
      setActivePluginName("WPML");
    } else if (
      window?.ttsObjPro?.compatible?.["translatepress-multilingual/index.php"]
    ) {
      let activeLanguages =
        ttsObjPro?.compatible?.["translatepress-multilingual/index.php"]?.data;

      const languageObject = {};

      for (const langCode of activeLanguages) {
        languageObject[langCode] = langCode;
      }

      setMultilingualActiveLanguages(languageObject);
      setActivePluginName("TranslatePress");
    } else if (window?.ttsObjPro?.compatible?.["polylang/polylang.php"]) {
      let polylangActiveLanguages =
        ttsObjPro?.compatible?.["polylang/polylang.php"]?.active_languages;

      const languageObject = {};
      let active_languages = Object.keys(polylangActiveLanguages);

      for (const langCode of active_languages) {
        languageObject[langCode] =
          polylangActiveLanguages[langCode].english_name;
      }

      setMultilingualActiveLanguages(languageObject);
      setActivePluginName("Polylang");
    }
  }, [window?.ttsObjPro]);

  return { multilingualActiveLanguages, activePluginName };
}
