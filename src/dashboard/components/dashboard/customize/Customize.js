import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { proUrl } from "../../../proUrl";
import {
  Col,
  Container,
  Row,
  Form,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import notify, { toast } from "../../context/Notify";
import {
  copyToClipBoard,
  postWithoutImage,
} from "../../context/utilities";
import CustomizationTabs from "./CustomizationTabs";
import TTSButtonDesign from "./design/TTSButtonDesign";
import ButtonPreview from "./design/ButtonPreview";
import UpgradeToPro from "../../UpgradeToPro";
import Icon from "../../Icon";

let speech = null;
let TextToSpeechFree = null;

export default function Customize() {
  const defaultValue = {
    backgroundColor: "#ffffff",
    color: "#000000",
    hoverBackgroundColor: "#000000",
    hoverTextColor: "#ffffff",
    width: "100",
    height: "50",
    border: "2",
    border_color: "#000000",
    borderRadius: "10",
    fontSize: "20",
    tta_play_btn_shortcode: "[atlasvoice]",
    buttonSettings: {
      id: 1,
      button_position: "before_content",
      display_player_to: ["all"],
      who_can_download_mp3_file: ["all"],
      generate_mp3_date_from: "",
      generate_mp3_date_to: "",
    },
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  };

  const [listeningBtnStyle, setListeningStyle] = useState(defaultValue);
  const [listeningBtnStyle2, setListeningStyle2] = useState({
    backgroundColor: "#FFFFFF",
    color: "#000000",
    width: "100%",
    border: "2px solid #000000",
    height: "50px",
    fontSize: "20px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  });

  const [shortCode, setShortCode] = useState("[atlasvoice]");
  // TTS-241 — per-player button text/icon state. Hydrated from
  // /customize GET (res.button_texts) and posted back under formData.button_texts.
  const [buttonTexts, setButtonTexts] = useState({
    players: {},
    presets: [],
    preset_svgs: {},
    defaults: {},
  });
  const [speakingText, setSpeakingText] = useState("");
  const [listeningSettings, setListeningSettings] = useState({});
  // TTS-250: voice-provider auth status (Google Cloud / ChatGPT / ElevenLabs)
  // and the GCS-backup flag are published by the AtlasVoice add-on on
  // window.ttsAddonAuth (the free plugin no longer queries the tta_pro REST API).
  // Read at save time so the player-4/5/6 selection gating works exactly as
  // before when the add-on is active; empty/false when the add-on is absent.
  const getAddonAuth = () =>
    (typeof window !== "undefined" && window.ttsAddonAuth) || {};
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const setDefaultButtonSettingsIfNeeded = (res) => {
    if (!res.data?.buttonSettings) {
      res.data.buttonSettings = {};
    }
    if (
      !res?.data?.buttonSettings?.display_player_to ||
      res?.data?.buttonSettings?.display_player_to.length < 1
    ) {
      res.data.buttonSettings.display_player_to = ["all"];
    }
    if (
      !res?.data?.buttonSettings?.who_can_download_mp3_file ||
      res?.data?.buttonSettings?.who_can_download_mp3_file.length < 1
    ) {
      res.data.buttonSettings.who_can_download_mp3_file = ["all"];
    }

    if (!res?.data?.buttonSettings?.id) {
      res.data.buttonSettings.id = defaultValue.buttonSettings.id;
    }
    // TTS-250: clamp a saved-but-unavailable player to the default. If the
    // add-on was deactivated while a premium player (2-6) was selected, that id
    // is still stored but the selector only offers available players. Without
    // this, the dropdown shows "Default" while state stays e.g. 6, re-picking
    // Default fires no change event, and Save is blocked by the "only in pro"
    // guard — so the user can never get back to player 1. Normalising here keeps
    // state, the dropdown, and Save in agreement.
    const _localized =
      (typeof tta_obj !== "undefined" && tta_obj) ||
      (typeof ttsObj !== "undefined" && ttsObj) ||
      {};
    const _availableIds = (
      Array.isArray(_localized.availablePlayers) && _localized.availablePlayers.length
        ? _localized.availablePlayers
        : [{ id: 1 }]
    ).map((p) => Number(p.id));
    if (!_availableIds.includes(Number(res.data.buttonSettings.id))) {
      res.data.buttonSettings.id = 1;
    }
    if (!res?.data?.buttonSettings?.button_position) {
      res.data.buttonSettings.button_position =
        defaultValue.buttonSettings.button_position;
    }

    return res;
  };

  useEffect(() => {
    let completedRequests = 0;
    // TTS-250: always 2 (customize + listening). The 3 Pro provider-auth checks
    // that used to add to this count were moved into the add-on, so the loading
    // state no longer waits on them.
    const totalRequests = 2;

    const checkLoadingComplete = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        setIsDataLoaded(true);
      }
    };

    let customize = new FormData();
    customize.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/customize", customize)
      .then((res) => {
        res = setDefaultButtonSettingsIfNeeded(res);

        let css = {
          ...listeningBtnStyle2,
          ...{
            backgroundColor:
              res.data.backgroundColor || defaultValue.backgroundColor,
          },
          ...{ color: res.data.color || defaultValue.color },
          ...{ height: res.data?.height || defaultValue.height + "px" },
          ...{ fontSize: res.data?.fontSize || defaultValue.fontSize + "px" },
          ...{
            marginTop: res.data?.marginTop || defaultValue.marginTop + "px",
          },
          ...{
            marginBottom:
              res.data?.marginBottom || defaultValue.marginBottom + "px",
          },
          ...{
            marginLeft: res.data?.marginLeft || defaultValue.marginLeft + "%",
          },
          ...{
            marginRight:
              res.data?.marginRight || defaultValue.marginRight + "px",
          },
          ...{
            borderRadius:
              res.data?.borderRadius || defaultValue.borderRadius + "px",
          },
          ...{ border: res.data?.border || defaultValue.border + "px solid " },
          ...{ width: [res.data.width, "%"].join("") },
        };
        css.border += res.data?.border_color || defaultValue.border_color;

        let value = {
          ...res.data,
          ...{
            backgroundColor:
              res.data.backgroundColor || defaultValue.backgroundColor,
          },
          ...{ color: res.data.color || defaultValue.color },
          ...{ height: res.data?.height || defaultValue.height },
          ...{ fontSize: res.data?.fontSize || defaultValue.fontSize },
          ...{ marginTop: res.data?.marginTop || defaultValue.marginTop },
          ...{
            marginBottom: res.data?.marginBottom || defaultValue.marginBottom,
          },
          ...{ marginLeft: res.data?.marginLeft || defaultValue.marginLeft },
          ...{ marginRight: res.data?.marginRight || defaultValue.marginRight },
          ...{
            borderRadius: res.data?.borderRadius || defaultValue.borderRadius,
          },
          ...{ border: res.data?.border || defaultValue.border },
          ...{
            border_color: res.data?.border_color || defaultValue.border_color,
          },
          ...{ width: res.data?.width || defaultValue.width },
          ...{
            tta_play_btn_shortcode:
              res.data?.tta_play_btn_shortcode ||
              defaultValue.tta_play_btn_shortcode,
          },
        };

        setListeningStyle(value);
        if (res.button_texts) {
          // Merge defaults so initial state is fully populated even when
          // nothing has been saved yet (TTS-241).
          const defaults = res.button_texts.defaults || {};
          const saved = res.button_texts.players || {};
          const players = {};
          Object.keys(defaults).forEach((pid) => {
            players[pid] = { ...(defaults[pid] || {}), ...(saved[pid] || {}) };
          });
          setButtonTexts({
            players,
            presets: res.button_texts.presets || [],
            preset_svgs: res.button_texts.preset_svgs || {},
            defaults,
          });
        }
        setShortCode(
          res.data?.tta_play_btn_shortcode ||
            defaultValue.tta_play_btn_shortcode
        );
        setListeningStyle2(css);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        checkLoadingComplete();
      });

    let listening = new FormData();
    listening.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/listening", listening)
      .then((res) => {
        setListeningSettings(res.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        checkLoadingComplete();
      });

    let initialText =
      "The most user-friendly text-to-speech accessibility plugin. Just install and automatically add an AtlasVoice player to your WordPress site!";

    localStorage.setItem("demo_listening_content", initialText);
    setSpeakingText(initialText);
    setTimeout(() => {
      if (
        window.hasOwnProperty("TTS") &&
        window.hasOwnProperty("ttsObjPro") &&
        ttsObjPro.is_atlasvoice_addon_functional
      ) {
        window.TTS.contents[1] = initialText;
      }
    }, 1000);

    // TTS-250: the voice-provider auth-status checks (Google Cloud / ChatGPT /
    // ElevenLabs) were Pro-only REST calls to the tta_pro/v1 namespace. They have
    // been moved into the AtlasVoice add-on, which performs them on the dashboard
    // and publishes the results on window.ttsAddonAuth. The free plugin no longer
    // calls any Pro endpoint here; the save handler reads window.ttsAddonAuth (see
    // getAddonAuth()) to keep the player-4/5/6 selection gating working unchanged
    // when the add-on is active.
  }, []);

  const handleChange = (e, keyName = "") => {
    if (Array.isArray(e) && keyName) {
      let tempButtonSettings = structuredClone(
        listeningBtnStyle.buttonSettings
      );
      tempButtonSettings = {
        ...tempButtonSettings,
        ...{ [keyName]: e },
      };
      setListeningStyle({
        ...listeningBtnStyle,
        ...{ buttonSettings: tempButtonSettings },
      });
      return;
    }
    if (
      e.target.name === "width" &&
      (e.target.value > 100 || e.target.value < 0)
    ) {
      toast(__("Value should be between 0-100", "text-to-audio"));
      return;
    }

    if (e.target.name == "tta_play_btn_shortcode") {
      setShortCode(e.target.value);
      return;
    }


    if (
      ![
        "backgroundColor",
        "width",
        "color",
        "height",
        "border",
        "border_color",
        "fontSize",
        "borderRadius",
        "marginTop",
        "marginBottom",
        "marginRight",
        "marginLeft",
        "hoverBackgroundColor",
        "hoverTextColor",
      ].includes(e.target.name)
    ) {
      if (
        e.target.name === "button_position" &&
        !["before_content", "after_content"].includes(e.target.value) &&
        !ttsObj.is_atlasvoice_addon_functional
      ) {
        toast(__("This option is only available for the pro version.", "text-to-audio"), "error");
        return;
      }

      let tempButtonSettings = structuredClone(
        listeningBtnStyle.buttonSettings
      );
      tempButtonSettings = {
        ...tempButtonSettings,
        ...{ [e.target.name]: e.target.value },
      };
      setListeningStyle({
        ...listeningBtnStyle,
        ...{ buttonSettings: tempButtonSettings },
      });

      if (e.target.name == "id" && e.target.value > 2) {
        document
          .getElementById("tta__demo_text_for_play")
          .setAttribute("disabled", true);
      } else {
        document
          .getElementById("tta__demo_text_for_play")
          .removeAttribute("disabled");
      }
      return;
    }

    setListeningStyle({
      ...listeningBtnStyle,
      ...{ [e.target.name]: e.target.value },
    });

    let value = "";
    if (e.target.name === "width") {
      let arr = [e.target.value, "%"];
      value = arr.join("");
    } else if (e.target.name === "height") {
      value = e.target.value + "px";
    } else if (e.target.name == "border" || e.target.name == "border_color") {
      if (e.target.name == "border") {
        value = e.target.value + "px solid ";
        value += listeningBtnStyle?.border_color ?? "#000000";
      } else {
        // When border_color changes, get the border width value from CURRENT state
        let borderWidth = listeningBtnStyle?.border ?? "2";
        // Ensure it's just a number (remove 'px' if present)
        if (typeof borderWidth === 'string' && borderWidth.indexOf("px") >= 0) {
          borderWidth = borderWidth.replace("px", "");
        }
        value = borderWidth + "px solid " + e.target.value;
      }
    } else if (e.target.name === "fontSize") {
      value = e.target.value + "px";
    } else if (e.target.name === "marginLeft") {
      value = e.target.value + "%";
    } else if (
      e.target.name === "borderRadius" ||
      e.target.name === "marginTop" ||
      e.target.name === "marginBottom" ||
      e.target.name === "marginRight"
    ) {
      value = e.target.value + "px";
    } else {
      value = e.target.value;
    }
    
    // For border_color, we need to update the 'border' property in listeningBtnStyle2
    if (e.target.name === "border_color") {
      setListeningStyle2({
        ...listeningBtnStyle2,
        border: value,
      });
    } else {
      setListeningStyle2({
        ...listeningBtnStyle2,
        ...{ [e.target.name]: value },
      });
    }
  };

  const CTANotice = (text_content = "") => {
    toast(
      <>
        <h6>{text_content}</h6>
        <button
          onClick={(e) => {
            window.open(
              proUrl('customize_tab')
            );
          }}
          className="tta_btn"
        >
          {__("Buy Now", "text-to-audio")}
        </button>
      </>,
      "info",
      {
        position: "top-right",
        autoClose: 10000,
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(e.target);
    let formData = {};
    for (let [key, value] of form.entries()) {
      if (
        key !== "generate_mp3_date_to" &&
        key !== "generate_mp3_date_from"
      ) {
        if (key === "" || value === "") {
          toast(__("Please fill the  field : ", "text-to-audio") + key);
          return;
        }
      }
      if (
        ![
          "backgroundColor",
          "width",
          "color",
          "border",
          "border_color",
          "height",
          "fontSize",
          "borderRadius",
          "marginTop",
          "marginBottom",
          "marginRight",
          "marginLeft",
          "hoverBackgroundColor",
          "hoverTextColor",
        ].includes(key)
      ) {
        continue;
      }
      formData[key] = value;
    }

    formData["tta_play_btn_shortcode"] = shortCode;
    formData["buttonSettings"] = listeningBtnStyle.buttonSettings;
    // TTS-241 — ride along with the same /customize round-trip.
    formData["button_texts"] = { players: buttonTexts.players || {} };
    if (!formData?.buttonSettings?.button_position) {
      formData.buttonSettings.button_position = "before_content";
    }
    if (!formData?.buttonSettings?.id) {
      formData.buttonSettings.id = 1;
    }

    if (formData?.buttonSettings?.id == 4) {
      if (ttsObj.is_atlasvoice_addon_functional && !getAddonAuth().google_cloud_tts) {

      notify(
        __("To select this player, you must authenticate first from the Integration menu", "text-to-audio"),
        "error",
        {
          autoClose: 8000,
        }
      );
              return;
      }
      if (!getAddonAuth().google_cloud_tts) {
        CTANotice(__("Google Cloud TTS player is only available in the pro version.", "text-to-audio"));
        return;
      }
    }

    if (formData?.buttonSettings?.id == 5) {
      if (ttsObj.is_atlasvoice_addon_functional && !getAddonAuth().chat_gpt_tts) {
        notify(
          __("To select this player you have to authenticate first from Integration menu", "text-to-audio"),
          "error",
          {
            autoClose: 8000,
          }
        );
        return;
      }
      if (!getAddonAuth().chat_gpt_tts) {
        CTANotice(__("ChatGPT TTS player is only available in the pro version.", "text-to-audio"));
        return;
      }
    }

    if (formData?.buttonSettings?.id == 6) {
      if (ttsObj.is_atlasvoice_addon_functional && !getAddonAuth().elevenlabs_tts) {
        notify(
          __("To select this player you have to authenticate first from Integration menu", "text-to-audio"),
          "error",
          {
            autoClose: 8000,
          }
        );
        return;
      }
      if (!getAddonAuth().elevenlabs_tts) {
        CTANotice(__("ElevenLabs TTS player is only available in the pro version.", "text-to-audio"));
        return;
      }
    }

    // TTS-266: this guard predates player 7 and assumed every id above 1 was a
    // Pro player. Player 7 (AtlasVoice Cloud) is a FREE player, so blocking it
    // here would both break the feature and be exactly the trialware pattern
    // wp.org Guideline 5 forbids. Gate on the server-provided registry instead
    // of on the id, so any future free player is handled automatically.
    const availableIds = (
      Array.isArray(ttsObj?.availablePlayers) && ttsObj.availablePlayers.length
        ? ttsObj.availablePlayers
        : [{ id: 1 }]
    ).map((p) => Number(p.id));

    if (
      !ttsObj.is_atlasvoice_addon_functional &&
      formData?.buttonSettings?.id > 1 &&
      !availableIds.includes(Number(formData?.buttonSettings?.id))
    ) {
      CTANotice(__("Default Pro player is only available in the pro version.", "text-to-audio"));
      return;
    }

    // TTS-266: any MP3-based player needs a writable uploads folder, player 7
    // included. Read the flag from ttsObj first — on a free-only site ttsObjPro
    // is a stub that may not carry is_folder_writable, and treating "missing" as
    // "not writable" would block player 7 on a perfectly healthy site.
    const folderWritable =
      typeof ttsObj?.is_folder_writable !== "undefined"
        ? ttsObj.is_folder_writable
        : window.ttsObjPro?.is_folder_writable;

    if (
      !folderWritable &&
      formData?.buttonSettings?.id > 2 &&
      !getAddonAuth().tts_is_backup_mp3_file
    ) {
    toast(
      __("AtlasVoice stores synthesized content in the uploads folder. Your uploads folder is not writable. Please make the uploads folder writable to enjoy all features of the plugin.", "text-to-audio"),
      "error",
      { autoClose: 10000 }
    );
      return;
    }

    let data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(tta_obj.api_url + "tta/v1/customize", data)
      .then((res) => {
        setListeningStyle(res.data);
        toast(__("Customization saved.", "text-to-audio"), "success");
        toast(
          __('Now go to the "Listening" menu to select proper language and voice.', "text-to-audio"),
          "error",
          {
            autoClose: 15000,
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const callListeningFunction = (e) => {
    let text = document.getElementById("tta__demo_text_for_play").value;
    let button = document.getElementById("tta__listen_content");

    if (speech != null && speech.listenStatus == "listen") {
      speech = null;
      TextToSpeechFree = null;
    }
    if (speech === null) {
      window.TTS.contents[1] = text;
      TextToSpeechFree = window.TextToSpeech;
      speech = new TextToSpeechFree(1, text, button, window.TTS);
      speech._init();
      speech = speech.getData(false);
    } else {
      speech = speech.getData(false);
      if (speech.listenStatus == "pause") {
        speech.pause(speech.speech);
      } else if (speech.listenStatus == "resume") {
        speech.resume(speech.speech);
      }
    }
  };

  const setText = (e) => {
    setSpeakingText(e.target.value);
    localStorage.setItem("demo_listening_content", e.target.value);
    if (
      window.hasOwnProperty("TTS") &&
      window.hasOwnProperty("ttsObjPro") &&
      ttsObjPro.is_atlasvoice_addon_functional
    ) {
      window.TTS.contents[1] = e.target.value;
    }
  };

  // TTS-249: the player selector is data-driven from the server-provided
  // registry (ttsObj/tta_obj.availablePlayers). Free exposes only player 1; Pro
  // adds 2-6 via the `tts_available_players` filter. We keep a master definition
  // (for the `object` mapping the preview needs) but only SHOW players the site
  // can actually deliver — no locked options shipped in the free UI.
  const ALL_PLAYERS = [
    { id: 1, name: __("Default", "text-to-audio"), object: "TextToSpeech", disabled: false },
    { id: 2, name: __("Default Pro", "text-to-audio"), object: "TextToSpeechPro", disabled: false },
    { id: 3, name: "AtlasVoice TTS Pro", object: "TextToSpeechPro", disabled: false },
    { id: 4, name: "Google Cloud TTS", object: "TextToSpeechPro", disabled: false },
    { id: 5, name: "ChatGPT TTS", object: "TextToSpeechPro", disabled: false },
    { id: 6, name: "ElevenLabs TTS", object: "TextToSpeechPro", disabled: false },
    // TTS-266: AtlasVoice Cloud is a FREE player — it appears here only when the
    // server registry lists it (feature flag), like every other entry.
    { id: 7, name: "AtlasVoice Cloud", object: "AtlasVoiceCloudPlayer", disabled: false },
  ];
  const localizedObj =
    (typeof tta_obj !== "undefined" && tta_obj) ||
    (typeof ttsObj !== "undefined" && ttsObj) ||
    {};
  const availablePlayerIds = (
    Array.isArray(localizedObj.availablePlayers) && localizedObj.availablePlayers.length
      ? localizedObj.availablePlayers
      : [{ id: 1 }]
  ).map((p) => Number(p.id));
  const [buttonLists, setButtonLists] = useState(
    ALL_PLAYERS.filter((p) => availablePlayerIds.includes(p.id))
  );

  return isDataLoaded ? (
    <Container fluid className="tta-container">
      <Row>
        <Col xs={12} lg={8}>
          <div className="bg-white rounded p-3 mb-3 shadow-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="fs-3 fw-bold mb-2 text-dark">{__("Customization","text-to-audio")}</h2>
                <p className="text-secondary m-0 small">
                  {__("Customize the player & design to match your brand and preferences.","text-to-audio")}
                </p>
              </div>
              {typeof tta_obj !== 'undefined' && tta_obj.latest_post_preview_url && (
                <a
                  href={tta_obj.latest_post_preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#fff',
                    backgroundColor: '#FF7853',
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {__("Preview on Your Site", "text-to-audio")} {"\u2197"}
                </a>
              )}
            </div>
          </div>

          {/* Single Form Wrapper for Everything */}
          <Form onSubmit={handleSubmit}>
            {/* Player Customization Accordion */}
            <CustomizationTabs
              buttonLists={buttonLists}
              listeningBtnStyle={listeningBtnStyle}
              handleChange={handleChange}
              listeningSettings={listeningSettings}
            />

            {/* Demo Text Area Section */}
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              <div className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className="mb-0 fw-semibold">
                    {__("Write here something and click listen button", "text-to-audio")}
                  </label>

                  {/* Question Icon with Tooltip */}
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="tooltip-help">
                       {__(" Enter your text here and click the listen button to hear it spoken aloud.", "text-to-audio")}
                      </Tooltip>
                    }
                  >
                    <Button
                      variant="link"
                      className="p-0 text-muted"
                      size="sm"
                    >
                      <Icon name="question-circle" />
                    </Button>
                  </OverlayTrigger>

                  {/* YouTube Icon with Link */}
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="tooltip-help">
                        {__("Click To Know How It Works?","text-to-audio")}
                      </Tooltip>
                    }
                  >
                    <Button
                      variant="link"
                      className="p-0 text-danger"
                      size="sm"
                      as="a"
                      href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                      target="_blank"
                      rel="noopener noreferrer"
                      title={__("Watch Tutorial", "text-to-audio")}
                    >
                      <Icon name="youtube" />
                    </Button>
                  </OverlayTrigger>
                </div>
                <Form.Control
                  as="textarea"
                  id="tta__demo_text_for_play"
                  onChange={(e) => setText(e)}
                  value={speakingText ? speakingText : ""}
                  placeholder={__('Write here something and click listen button.', 'text-to-audio')}
                  rows={3}
                  className="tta_custom-textarea"
                />
              </div>

              <div className="d-grid mb-0">
                {/* TTS-249 (T2): player 1 preview is rendered by Free. For
                    players 2..6 (premium) Free renders only an empty slot; the
                    Pro plugin mounts its own React preview into it (player-2..6
                    preview code no longer ships in the free ZIP).

                    The slot is used only when the selected id is actually a
                    registered available player (i.e. Pro is present to handle
                    it). If a stale Pro id is saved but Pro is inactive, fall
                    back to the player-1 ButtonPreview — capability fallback,
                    same as get_player_id() server-side. */}
                {(() => {
                  const selectedId = parseInt(listeningBtnStyle?.buttonSettings?.id || 1, 10);
                  const available = (typeof ttsObj !== "undefined" && Array.isArray(ttsObj.availablePlayers))
                    ? ttsObj.availablePlayers.map((p) => parseInt(p.id, 10))
                    : [1];
                  const canRenderProPreview = selectedId > 1 && available.includes(selectedId);

                  return canRenderProPreview ? (
                    <div
                      id="tts_customize_pro_preview"
                      className="tts_customize_pro_preview"
                      data-player-id={selectedId}
                      data-button-css={JSON.stringify(listeningBtnStyle || {})}
                      data-button-texts={JSON.stringify(buttonTexts || {})}
                    ></div>
                  ) : (
                    // TTS-241 — live preview that mirrors the in-memory
                    // ButtonStateEditor draft for the Default (player 1) button.
                    <ButtonPreview
                      buttonTexts={buttonTexts}
                      playerId={available.includes(selectedId) ? selectedId : 1}
                      buttonStyle={listeningBtnStyle}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Design Customization Section */}
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              <h5 className="mb-3 fw-semibold">{__("Design Customization", "text-to-audio")}</h5>
              <TTSButtonDesign
                listeningBtnStyle={listeningBtnStyle}
                handleChange={handleChange}
                buttonTexts={buttonTexts}
                setButtonTexts={setButtonTexts}
              />
            </div>

            {/* Shortcode Section */}
            <div className="bg-white rounded p-3 mb-3 shadow-sm">
              <h6 className="mb-3">
                {__("Short Code | Attributes value must be wrapped with double quotation ( \" )","text-to-audio")}

              </h6>
              <Form.Control
                as="textarea"
                name="tta_play_btn_shortcode"
                onChange={handleChange}
                value={shortCode}
                id="tta_play_btn_shortcode"
                rows={2}
                className="mb-3 tta_shortcode-textarea"
              />
              <button
                type="button"
                size="sm"
                onClick={(e) =>
                  copyToClipBoard(
                    __("tta_play_btn_shortcode", "text-to-audio"),
                    true,
                    __("Copied ShortCode","text-to-audio"),
                    toast
                  )
                }
                className="tta_shortcode_btn"
              >
                <Icon name="copy" className="me-2" />
              {__('Copy Shortcode', 'text-to-audio')}
              </button>
            </div>

            {/* Save Button - Sticky at Bottom */}
            <div
              className="position-sticky bottom-0"
              style={{ zIndex: 1030, marginTop: "20px" }}
            >
              <div className="d-grid">
                <button type="submit" className="btn tta_btn">
                    {__('Save', 'text-to-audio')}
                </button>
              </div>
            </div>
          </Form>
        </Col>

        <Col xs={12} lg={4}>
          <UpgradeToPro promotionType={"youtube"} showDemoCard={true} />
        </Col>
      </Row>
    </Container>
  ) : (
    <div
      className="tta-loading-spinner"
    >
      <div>
        <Icon name="spinner" spin className="me-2" />
          {__('Loading...', 'text-to-audio')}
      </div>
    </div>
  );
}