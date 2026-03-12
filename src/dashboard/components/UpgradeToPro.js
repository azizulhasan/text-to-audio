import { __ } from "@wordpress/i18n";
import React, { useState } from "react";
import { Accordion, Table } from "react-bootstrap";
import toast from "./context/Notify";
import { copyToClipBoard } from "./context/utilities";

export default function UpgradeToPro({ promotionType = "general" }) {
  const [activeTab, setActiveTab] = useState("documentation");

  /**
   * Filters
   */
  const filters = [
    {
      name: "tta__content_title",
      arguments: "$title, $post",
    },
    {
      name: "tta__content_description",
      arguments: "$description_sanitized, $description, $post_id, $post",
    },
    {
      name: "tta__button_text_arr",
      arguments: "$text_arr, $atts, $content_read_time",
    },
    {
      name: "tta_clean_content",
      arguments: "$text",
    },
    {
      name: "tts__listening_button",
      arguments: "$button, $btn_no, $class, $post",
    },
    {
      name: "tts_player_customizations",
      arguments: "$player_icons",
    },
  ];

  /**
   * Pro Filters
   */
  const pro_filters = [
    {
      name: "tts_clean_gtts_folder",
      arguments: "$should_delete_mp3_folder",
    },
    {
      name: "tts_pro_batch_charlen",
      arguments: "$charlen_arr",
    },
    {
      name: "tts_pro_exclude_between_delimiters",
      arguments: "$delimiters_arr",
    },
  ];

  /**
   *  JS Free Filters
   */
  const js_free_filters = [
    {
      name: "tta__settings_stop_auto_pause_after_switching_tab",
      arguments: "true",
    },
  ];

  /**
   *  JS Pro Filters
   */
  const js_pro_filters = [
    {
      name: "ttsProPlayerOptions",
      arguments: "obj",
    },
    {
      name: "ttsProLink",
      arguments: "link",
    },
    {
      name: "ttsSetSelectedLanguageFromDom",
      arguments: "false",
    },
    {
      name: "ttsProApplyNumberFormat",
      arguments: "false",
    },
    {
      name: "ttsProGetContentFromDOM",
      arguments: "true",
    },
    {
      name: "ttsProPlayerDesign",
      arguments: "obj",
    },
  ];

  let proFeatures = {
    youtube: [
      [
        // free video
        {
          title: "How To Setup AtlasVoice Player Properly?",
          id: "h4VJxM-mh74?si=pmgy6TkvvppqtQV7",
          thumbnail: "https://i.ytimg.com/vi/h4VJxM-mh74/mqdefault.jpg",
        },
        {
          title:
            "How To Setup Settings Menu For AtlasVoice Pro WordPress Plugin?",
          id: "yanuoEBfG4A?si=WVJYL656B1LmrEVY",
          thumbnail: "https://i.ytimg.com/vi/yanuoEBfG4A/mqdefault.jpg",
        },
        {
          title:
            "AtlasVoice Pro: How To Generate Bulk MP3 File?",
          id: "HFoqlkPCP80?si=XVBvLEp2ATKT7EXz",
          thumbnail: "https://i.ytimg.com/vi/HFoqlkPCP80/mqdefault.jpg",
        },
        {
          title:
            "How To Enable Analytics In AtlasVoice Free And Pro WordPress Plugin?",
          id: "amkrAtVQGBY?si=ZI1HfRBYaR60PVVx",
          thumbnail: "https://i.ytimg.com/vi/amkrAtVQGBY/mqdefault.jpg",
        },
        {
          title:
            "How To Use Text Alias In AtlasVoice Free And Pro WordPress Plugin?",
          id: "oeW652YKmG0?si=q97jAR0pTT3LhhH-",
          thumbnail: "https://i.ytimg.com/vi/oeW652YKmG0/mqdefault.jpg",
        },
        {
          title:
            "How to Configure GTranslate And AtlasVoice Pro WordPress Plugin",
          id: "uMJBdM24w_c?si=XZ0hsLADaQiB2UN2",
          thumbnail: "https://i.ytimg.com/vi/uMJBdM24w_c/mqdefault.jpg",
        },
      ],
      [
        // pro video - same list for now
        {
          title: "How To Setup AtlasVoice Player Properly?",
          id: "h4VJxM-mh74?si=pmgy6TkvvppqtQV7",
          thumbnail: "https://i.ytimg.com/vi/h4VJxM-mh74/mqdefault.jpg",
        },
        {
          title:
            "How To Setup Settings Menu For AtlasVoice Pro WordPress Plugin?",
          id: "yanuoEBfG4A?si=WVJYL656B1LmrEVY",
          thumbnail: "https://i.ytimg.com/vi/yanuoEBfG4A/mqdefault.jpg",
        },
        {
          title:
            "AtlasVoice Pro: How To Generate Bulk MP3 File?",
          id: "HFoqlkPCP80?si=XVBvLEp2ATKT7EXz",
          thumbnail: "https://i.ytimg.com/vi/HFoqlkPCP80/mqdefault.jpg",
        },
        {
          title:
            "How To Enable Analytics In AtlasVoice Free And Pro WordPress Plugin?",
          id: "amkrAtVQGBY?si=ZI1HfRBYaR60PVVx",
          thumbnail: "https://i.ytimg.com/vi/amkrAtVQGBY/mqdefault.jpg",
        },
        {
          title:
            "How To Use Text Alias In AtlasVoice Free And Pro WordPress Plugin?",
          id: "oeW652YKmG0?si=q97jAR0pTT3LhhH-",
          thumbnail: "https://i.ytimg.com/vi/oeW652YKmG0/mqdefault.jpg",
        },
        {
          title:
            "How to Configure GTranslate And AtlasVoice Pro WordPress Plugin",
          id: "uMJBdM24w_c?si=XZ0hsLADaQiB2UN2",
          thumbnail: "https://i.ytimg.com/vi/uMJBdM24w_c/mqdefault.jpg",
        },
      ],
    ],
    general: [
      "Get Live Support for setup.",
      "Convert unlimited characters to MP3 in bulk.",
      "WPML, GTranslate, TranslatePress Plugins Support",
      "Works with ACF, SCF, and other popular plugins.",
      "Google Cloud Text-to-Speech & ChatGPT Text-to-Speech (usage fees apply)",
      "Save MP3 files directly to Google Cloud Storage.",
      'Live integration support + 14-day money-back guarantee (<a target="_blank" href="https://atlasaidev.com/refund-policy/">conditions apply</a>).',
      "Multiple audio player support",
      "Unlimited Download MP3 files",
      "200+ Voices with Google Cloud TTS",
      "Customizable content selection with CSS selectors",
      "Exclude content by categories, tags, IDs",
      "Advance analytics",
      "Responsive Audio Player",
      "Text Aliases",
      "Unlimited Characters",
    ],
  };

  if (!window.hasOwnProperty("ttsObj")) return null;

  /** -------------------------------
   * Video Card Component
   * ------------------------------- */
  const VideoCard = ({ video }) => (
    <a
      href={"https://www.youtube.com/watch?v=" + video.id}
      target="_blank"
      rel="noopener noreferrer"
      className="d-flex align-items-center text-decoration-none bg-white mb-3 p-2 rounded"
    >
      <div className="flex-shrink-0 position-relative me-3">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="rounded"
          width="120"
          height="68"
        />
        <div className="tta-yt">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="flex-grow-1">
        <p className="m-0 text-dark fw-medium">{video.title}</p>
      </div>
    </a>
  );

  /** -------------------------------
   * Get Videos (Based on PRO)
   * ------------------------------- */
  const getVideos = () => {
    if (promotionType === "youtube") {
      const videoIndex = ttsObj.is_pro_active ? 1 : 0;
      return proFeatures.youtube[videoIndex];
    }
    return [];
  };

  const videos = getVideos();

  return (
    <div style={{ position: "sticky", top: "20px" }}>
      {/* Documentation Section → Accordion with Docs.js content */}
      <Accordion defaultActiveKey="" className="tta-custom-accordion">
        <Accordion.Item eventKey="0">
          <Accordion.Header className="tta-custom-orange-accordion">
            Read Documentation
          </Accordion.Header>
          <Accordion.Body className="p-2" style={{ fontSize: "0.875rem" }}>
            {/* Nested Accordion from Docs.js */}
            <Accordion flush className="tta-qa-accordion">
              <Accordion.Item eventKey="1">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  1. Browser support issue on android phone and desktop
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  This plugin is built on browser API. No external API is used.
                  Here is the API used{" "}
                  <a
                    target="_blank"
                    href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis"
                  >
                    speechSynthesis
                  </a>
                  That is why it doesn't support all android phones here you can
                  check which android phone support this{" "}
                  <a
                    target="_blank"
                    href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis#browser_compatibility"
                  >
                    speechSynthesis
                  </a>{" "}
                  API
                  <br />
                  <br />
                  Another issue speechSynthesis API is differ browser to browser
                  also divice to divice . So it changes the voices and languages
                  based on browser. one language may available on desktop It can
                  be not available on mobile phone. One voice may available on
                  desktop, it may be not available on android.
                  <br />
                  <br />
                  If you still facing problems regarding browser issues please
                  on a{" "}
                  <a target="_blank" href="http://atlasaidev.com/contact-us/">
                    ticket
                  </a>
                  .
                  <br />
                  <br /> There is no issue related to browser on{" "}
                  <a
                    target="_blank"
                    href="https://atlasaidev.com/text-to-speech-pro/"
                  >
                    pro version.
                  </a>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="2">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  2. Another voice language on mobile
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  This plugin is built on browser API{" "}
                  <a
                    target="_blank"
                    href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis"
                  >
                    speechSynthesis
                  </a>
                  .
                  <br />
                  speechSynthesis API is differ browser to browser also divice
                  to divice . So it changes the voices and languages based on
                  browser. one language may available on desktop It can be not
                  available on mobile phone. One voice may available on desktop,
                  it may be not available on android.
                  <br />
                  <br /> There is no issue releated to voices on{" "}
                  <a
                    target="_blank"
                    href="https://atlasaidev.com/text-to-speech-pro/"
                  >
                    pro version.
                  </a>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="3">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  3. Can I Restrict/Exclude Certain Words From Playing?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <p style={{ marginBottom: "0.5rem" }}>
                    Absolutely! You have the flexibility to exclude specific
                    content from being read aloud, and this feature is available
                    in the{" "}
                    <a
                      target="_blank"
                      href="https://atlasaidev.com/text-to-speech-pro/"
                    >
                      pro version.
                    </a>{" "}
                    of Text to Speech.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    Here's how to exclude words from playback:
                  </p>

                  <p style={{ marginBottom: "0.5rem" }}>
                    Navigate to the Settings tab of Text to Speech Pro.
                  </p>

                  <p style={{ marginBottom: "0.5rem" }}>
                    Look for the "Exclude Texts To Speak" textarea.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    In this field, you can list the words or phrases you wish to
                    exclude from being read aloud.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    If you want to exclude multiple words or phrases, simply
                    separate them using the pipe symbol (|).
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    With this capability, you can fine-tune the playback
                    experience, ensuring that only the desired content is read
                    aloud to your audience.
                  </p>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="4">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  4. Is it possible to exclude specific HTML tags from being
                  read aloud by the Text to Speech plugin?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <p style={{ marginBottom: "0.5rem" }}>
                    Of course! With the{" "}
                    <a
                      target="_blank"
                      href="https://atlasaidev.com/text-to-speech-pro/"
                    >
                      pro version.
                    </a>{" "}
                    of Text to Speech, you gain the ability to skip the content
                    enclosed within certain HTML tags during playback.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    **Here's how it works:**
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    *Navigate to the Settings tab of Text to Speech Pro.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    *Locate the "Exclude Tag's Content" textarea.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    *In this field, you can specify the HTML tags whose content
                    you want to exclude from being read aloud.
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    *If you need to skip multiple tags, simply separate them
                    using the pipe symbol (|).
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    By utilizing this feature, you can tailor the reading
                    experience to your preferences, ensuring that specific HTML
                    elements are omitted from the audio playback.
                  </p>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="5">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  5. How to change button text?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <div style={{ fontSize: "0.85rem" }}>
                    You can change button text 2 ways one is by shortcode
                    attribute. Another way is adding filter. But filter always
                    overrides the shortcode attributes. Here is short code
                    Example :{" "}
                    <pre
                      style={{
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <code>
                        [atlasvoice listen_text="Listen" pause_text="Pause"
                        resume_text="Resume" replay_text="Replay"
                        start_text="Start" stop_text="Stop"]
                      </code>
                    </pre>
                    Also you can change it by filter. We prefer by filter.
                    <pre
                      style={{
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <code id="filter_hook">
                        {`
add_filter('tta__button_text_arr', 'tta__button_text_arr_callback');
function tta__button_text_arr_callback($text_arr) {
    return [
        'listen_text' => 'Listen',
        'pause_text'  => 'Pause',
        'resume_text' => 'Resume',
        'replay_text' => 'Replay',
        'listen_hover_title' => 'listen title',
        'pause_hover_title' => 'pause title',
        'resume_hover_title' => 'resume title',
        'replay_hover_title' => 'replay title',
    ];
}
              `}
                      </code>
                    </pre>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="6">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  6. How to add custom css class to button?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  Add class on shortcode as an attribute. Example :{" "}
                  <code>[atlasvoice className="custom_class"]</code>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="7">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  7. Apply Backend Filters and Actions ( Free Version )
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <Table
                    striped
                    bordered
                    hover
                    size="sm"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ fontSize: "0.85rem" }}>Sr.</th>
                        <th style={{ fontSize: "0.85rem" }}>Filter Name</th>
                        <th style={{ fontSize: "0.85rem" }}>Arguments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filters.length &&
                        filters.map((filter, index) => {
                          return (
                            <tr key={filter.name}>
                              <td style={{ fontSize: "0.85rem" }}>{++index}</td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.name}</code>
                              </td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.arguments}</code>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                  <div style={{ fontSize: "0.85rem" }}>
                    visit examples{" "}
                    <a
                      href={
                        "https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-backend-filters-and-actions/"
                      }
                      target={"_blank"}
                    >
                      here
                    </a>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="8">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  8. How to apply filters.
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <button
                    className=""
                    onClick={(e) =>
                      copyToClipBoard(
                        "filter_hook",
                        false,
                        "Filter Copied.",
                        toast
                      )
                    }
                  >
                    <img
                      src={
                        typeof tta_obj !== "undefined"
                          ? tta_obj.image_url + "/copy.svg"
                          : ""
                      }
                      width="15px"
                      alt="Copy short code to clipboard"
                    />
                  </button>
                  <div style={{ fontSize: "0.85rem" }}>
                    Install the plugin{" "}
                    <a
                      href="https://wordpress.org/plugins/code-snippets/"
                      target={"_blank"}
                    >
                      Code Snippets
                    </a>
                    Then Select Snippet {">"} Add New Create a new snippet with
                    this block of code
                    <pre
                      style={{
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <code id="filter_hook">
                        {`
add_filter('tta__button_text_arr', 'tta__button_text_arr_callback');
function tta__button_text_arr_callback($text_arr) {
    return [
        'listen_text' => 'Listen',
        'pause_text'  => 'Pause',
        'resume_text' => 'Resume',
        'replay_text' => 'Replay',
        'listen_hover_title' => 'listen title',
        'pause_hover_title' => 'pause title',
        'resume_hover_title' => 'resume title',
        'replay_hover_title' => 'replay title',
    ];
}
              `}
                      </code>
                    </pre>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="9">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  9. What is the name of the block button?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <strong>Customize Button</strong>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="10">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  10. How many languages support in pro version?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <strong>PRO SUPPORTED LANGUAGES:</strong>
                  <br />
                  AtlasVoice Pro plugin supports these
                  languages.
                  <br />
                  <br />
                  Afrikaans, Albanian, Arabic, Armenian, Catalan, Chinese,
                  Chinese (Mandarin/China), Chinese (Mandarin/Taiwan), Chinese
                  (Cantonese), Croatian, Czech, Danish, Dutch, English, English
                  (Australia), English (United Kingdom), English (United
                  States), Esperanto, Finnish, French, German, Greek, Haitian
                  Creole, Hindi, Hungarian, Icelandic, Indonesian, Italian,
                  Japanese, Korean, Latin, Latvian, Macedonian, Norwegian,
                  Polish, Portuguese, Portuguese (Brazil), Romanian, Russian,
                  Serbian, Slovak, Spanish, Spanish (Spain), Spanish (United
                  States), Swahili, Swedish, Tamil, Thai, Turkish, Vietnamese,
                  Welsh
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="11">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  11. How many languages support in free version?
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <strong>Free SUPPORTED LANGUAGES:</strong>
                  <br />
                  AtlasVoice plugin supports these
                  languages.
                  <br />
                  <br />
                  <strong>Chrome Desktop:</strong> UK English, US English,
                  Spanish ( Spain ), Spanish ( United States ), French, Deutsch,
                  Italian, Russian, Dutch, Japanese, Korean, Chinese (China),
                  Chinese (Hong Kong), Chinese (Taiwan) Hindi, Indonesian,
                  Polish, Brazilian Portuguese.
                  <br />
                  <strong>Chrome Mobile:</strong> English USA, English UK,
                  German, Italian, Russian, French, Spanish
                  <br />
                  <strong>Microsoft Edge Desktop :</strong> All Languages.
                  <br />
                  <strong>Microsoft Edge Mobile :</strong> All Languages.
                  <br />
                  <strong>FireFox Desktop:</strong> English.
                  <br />
                  <strong>FireFox Mobile:</strong> English USA, English UK,
                  German, Italian, Russian, French, Spanish.
                  <br />
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="12">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  12. Apply Backend Filters and Actions ( Pro Version )
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <Table
                    striped
                    bordered
                    hover
                    size="sm"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ fontSize: "0.85rem" }}>Sr.</th>
                        <th style={{ fontSize: "0.85rem" }}>Filter Name</th>
                        <th style={{ fontSize: "0.85rem" }}>Arguments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pro_filters.length &&
                        pro_filters.map((filter, index) => {
                          return (
                            <tr key={filter.name}>
                              <td style={{ fontSize: "0.85rem" }}>{++index}</td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.name}</code>
                              </td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.arguments}</code>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                  <div style={{ fontSize: "0.85rem" }}>
                    visit examples{" "}
                    <a
                      href={
                        "https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-backend-filters-and-actions-pro-version/"
                      }
                      target={"_blank"}
                    >
                      here
                    </a>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="13">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  13. Apply Frontend Filters and Actions ( Free Version )
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <Table
                    striped
                    bordered
                    hover
                    size="sm"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ fontSize: "0.85rem" }}>Sr.</th>
                        <th style={{ fontSize: "0.85rem" }}>Filter Name</th>
                        <th style={{ fontSize: "0.85rem" }}>Arguments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {js_free_filters.length &&
                        js_free_filters.map((filter, index) => {
                          return (
                            <tr key={filter.name}>
                              <td style={{ fontSize: "0.85rem" }}>{++index}</td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.name}</code>
                              </td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.arguments}</code>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                  <div style={{ fontSize: "0.85rem" }}>
                    visit examples{" "}
                    <a
                      href={
                        "https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-frontend-filters-and-actions-free-version/"
                      }
                      target={"_blank"}
                    >
                      here
                    </a>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="14">
                <Accordion.Header style={{ fontSize: "0.9rem" }}>
                  14. Apply Frontend Filters and Actions ( Pro Version )
                </Accordion.Header>
                <Accordion.Body
                  style={{
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <Table
                    striped
                    bordered
                    hover
                    size="sm"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ fontSize: "0.85rem" }}>Sr.</th>
                        <th style={{ fontSize: "0.85rem" }}>Filter Name</th>
                        <th style={{ fontSize: "0.85rem" }}>Arguments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {js_pro_filters.length &&
                        js_pro_filters.map((filter, index) => {
                          return (
                            <tr key={filter.name}>
                              <td style={{ fontSize: "0.85rem" }}>{++index}</td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.name}</code>
                              </td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <code>{filter.arguments}</code>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                  <div style={{ fontSize: "0.85rem" }}>
                    visit examples{" "}
                    <a
                      href={
                        "https://atlasaidev.com/docs/text-to-speech/filters-actions/apply-frontend-filters-and-actions-pro-version/"
                      }
                      target={"_blank"}
                    >
                      here
                    </a>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Watch Tutorials */}
      {promotionType === "youtube" && (
        <Accordion defaultActiveKey="0" className="mt-2 tta-custom-accordion">
          <Accordion.Item eventKey="0">
            <Accordion.Header className="tta-custom-orange-accordion">
              Watch Tutorials
            </Accordion.Header>
            <Accordion.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      )}

      {/* General Promotion (Pro Features) */}
      {promotionType === "general" && !ttsObj.is_pro_active && (
        <Accordion style={{ marginTop: "20px" }}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>⭐ Pro Features</Accordion.Header>
            <Accordion.Body>
              <ul style={{ paddingLeft: "15px" }}>
                {proFeatures.general.map((feature, index) => (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    <span dangerouslySetInnerHTML={{ __html: feature }} />
                  </li>
                ))}
              </ul>

              <a
                href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#1a4d4d",
                  color: "white",
                  padding: "12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "600",
                  marginTop: "20px",
                }}
              >
                Upgrade to Pro
              </a>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      )}
    </div>
  );
}
