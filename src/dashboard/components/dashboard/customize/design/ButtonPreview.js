import React, { useState, useMemo, useRef, useEffect } from "react";
import { __ } from "@wordpress/i18n";

/**
 * ButtonPreview — TTS-241
 *
 * Renders the SAME DOM structure that the front-end web-component
 * (`text-to-audio-button.js → initNewPlayer + getNewButtonContent`) outputs
 * on the post page, so the dashboard preview is pixel-identical to what
 * the visitor sees. The component also wires up the SpeechSynthesis API
 * directly so clicking the preview actually plays / pauses / resumes the
 * sample text — the user gets a true round-trip preview.
 */

const FALLBACK_PLAY_SVG = (color) =>
  `<svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 8" aria-hidden="true"><polygon fill="${color}" points="0 0 0 8 7 4"/></svg>`;
const FALLBACK_PAUSE_SVG = (color) =>
  `<svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9L14 15" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 9L10 15" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="${color}" stroke-width="2"></path></svg>`;
const FALLBACK_REPLAY_SVG = (color) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${color}" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;

const SETTINGS_ICON_SVG = (color) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

const resolveIcon = (descriptor, presetSvgs) => {
  if (!descriptor) return "";
  if (descriptor.startsWith("preset:")) return presetSvgs?.[descriptor.slice(7)] || "";
  if (descriptor.startsWith("custom:")) return descriptor.slice(7);
  return descriptor;
};

export default function ButtonPreview({
  buttonTexts,
  playerId,
  buttonStyle,
}) {
  // Lifecycle: 'idle' (hasn't played) → 'playing' → 'paused' → 'finished'.
  // Maps to user-state keys: idle=listen, playing=pause, paused=resume,
  // finished=replay.
  const [phase, setPhase] = useState("idle");
  const utterRef = useRef(null);

  const players = buttonTexts?.players || {};
  const defaults = buttonTexts?.defaults?.[playerId] || {};
  const presetSvgs = buttonTexts?.preset_svgs || {};

  const stateKey = phase === "idle"
    ? "listen"
    : phase === "playing"
      ? "pause"
      : phase === "paused"
        ? "resume"
        : "replay";

  const state = (players[playerId] && players[playerId][stateKey]) || defaults[stateKey] || {};

  const colors = useMemo(() => {
    const bg = buttonStyle?.backgroundColor || "#184c53";
    const color = buttonStyle?.color?.replace?.(/[#"]/g, "") ? buttonStyle.color : "#ffffff";
    const hoverBg = buttonStyle?.hoverBackgroundColor || "#000000";
    const hoverText = buttonStyle?.hoverTextColor || "#ffffff";
    return { bg, color, hoverBg, hoverText };
  }, [buttonStyle]);

  const iconHtml = useMemo(() => {
    const custom = resolveIcon(state.icon, presetSvgs).replace(/\$color/g, "currentColor");
    if (custom) return custom;
    if (stateKey === "pause")  return FALLBACK_PAUSE_SVG(colors.color);
    if (stateKey === "replay") return FALLBACK_REPLAY_SVG(colors.color);
    return FALLBACK_PLAY_SVG(colors.color);
  }, [state.icon, stateKey, presetSvgs, colors.color]);

  const showSettingsGear = phase === "playing" || phase === "paused";

  // Stop any ongoing speech if the component unmounts or player changes.
  useEffect(() => {
    return () => {
      if (window?.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [playerId]);

  const handleClick = () => {
    if (!window?.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const sampleText = (typeof document !== "undefined"
      ? document.getElementById("tta__demo_text_for_play")?.value
      : "") || __("This is a preview of the player.", "text-to-audio");

    if (phase === "idle" || phase === "finished") {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(sampleText);
      utterRef.current = u;
      u.onstart = () => setPhase("playing");
      u.onend = () => setPhase("finished");
      u.onerror = () => setPhase("finished");
      synth.speak(u);
    } else if (phase === "playing") {
      synth.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      synth.resume();
      setPhase("playing");
    }
  };

  const buttonId = "tts__listent_content_preview_" + playerId;

  // Inline CSS that mirrors `initNewPlayer`'s shadow-root <style> exactly,
  // applied at the document level via a generated id so the preview looks
  // identical to the live web-component output.
  const css = `
    #${buttonId}.tts__listent_content {
      background-color: ${colors.bg};
      color: ${colors.color};
      width: ${buttonStyle?.width ? buttonStyle.width + "%" : "100%"};
      height: ${buttonStyle?.height ? buttonStyle.height + "px" : "auto"};
      font-size: ${buttonStyle?.fontSize ? buttonStyle.fontSize + "px" : "inherit"};
      border: ${buttonStyle?.border ? buttonStyle.border + "px solid " + (buttonStyle.border_color || "#000000") : "none"};
      border-radius: ${buttonStyle?.borderRadius ? buttonStyle.borderRadius + "px" : "0"};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }
    #${buttonId}.tts__listent_content:hover {
      background-color: ${colors.hoverBg};
      color: ${colors.hoverText};
    }
    #${buttonId}.tts__listent_content:hover .tts-button-left span,
    #${buttonId}.tts__listent_content:hover svg polygon,
    #${buttonId}.tts__listent_content:hover svg path {
      color: ${colors.hoverText};
    }
    #${buttonId}.tts__listent_content:focus,
    #${buttonId}.tts__listent_content:focus-visible {
      outline: none;
      box-shadow: none;
    }
    #${buttonId} .tts-button-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #${buttonId} .tts-button-right {
      display: flex;
      align-items: center;
    }
    #${buttonId} .tts-settings-icon {
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  return (
    <div role="region" aria-label={__("Default player preview", "text-to-audio")}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <button
        id={buttonId}
        type="button"
        className="tts__listent_content"
        title={state.hover || ""}
        aria-label={state.text || ""}
        onClick={handleClick}
      >
        <span className="tts-button-left" aria-hidden="true">
          <span dangerouslySetInnerHTML={{ __html: iconHtml }} />
          <span className="tts_button_label">{state.text || ""}</span>
        </span>
        <span className="tts-button-right">
          {showSettingsGear ? (
            <span
              className="tts-settings-icon"
              role="button"
              aria-label={__("Player settings", "text-to-audio")}
              onClick={(e) => { e.stopPropagation(); }}
              dangerouslySetInnerHTML={{ __html: SETTINGS_ICON_SVG(colors.color) }}
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}
