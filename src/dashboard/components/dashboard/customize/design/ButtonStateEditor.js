import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import PlayerStateCard from "./PlayerStateCard";

const STATE_KEYS = ["listen", "pause", "resume", "replay"];

const PLAYER_LABEL = {
  1: () => __("Default", "text-to-audio"),
  2: () => __("Default Pro", "text-to-audio"),
};

/**
 * ButtonStateEditor — TTS-241
 *
 * Renders the per-state editor for the currently selected speechSynthesis
 * player (1 or 2). Hidden for any other player id. Saves run-of-text and
 * icon descriptors into buttonTexts.players[playerId].<state>.
 */
export default function ButtonStateEditor({
  playerId,
  buttonTexts,
  setButtonTexts,
}) {
  // TTS-249 (T2): Free ships this editor for player 1 only. Player 2 (Default
  // Pro) is premium — the Pro plugin injects its own editor, so no player-2
  // handling ships in the free ZIP.
  const supported = playerId === 1;
  if (!supported) {
    return null;
  }

  const presetSvgs = buttonTexts?.preset_svgs || {};
  const defaults = buttonTexts?.defaults?.[playerId] || {};
  const players = buttonTexts?.players || {};
  const current = players[playerId] || defaults;

  const updateState = (stateKey, nextState) => {
    setButtonTexts((prev) => ({
      ...prev,
      players: {
        ...(prev.players || {}),
        [playerId]: {
          ...(prev.players?.[playerId] || defaults),
          [stateKey]: nextState,
        },
      },
    }));
  };

  const resetState = (stateKey) => {
    updateState(stateKey, { ...(defaults[stateKey] || {}) });
  };

  const resetAll = () => {
    setButtonTexts((prev) => ({
      ...prev,
      players: {
        ...(prev.players || {}),
        [playerId]: { ...defaults },
      },
    }));
  };

  const title = useMemo(
    () =>
      `${__("Button Texts & Icons — ", "text-to-audio")}${(PLAYER_LABEL[playerId] || (() => ""))()}`,
    [playerId]
  );

  return (
    <div className="tta-button-state-editor mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">{title}</h6>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetAll}>
          {__("Reset all to defaults", "text-to-audio")}
        </button>
      </div>

      <Row className="g-3">
        {STATE_KEYS.map((sk) => (
          <Col xs={12} md={6} key={sk}>
            <PlayerStateCard
              stateKey={sk}
              state={current[sk] || defaults[sk] || { text: "", hover: "", icon: "" }}
              defaultState={defaults[sk]}
              presetSvgs={presetSvgs}
              onChange={(next) => updateState(sk, next)}
              onReset={() => resetState(sk)}
            />
          </Col>
        ))}
      </Row>

      <div className="small text-muted mt-2">
        {__("These labels and icons are shown on the front-end button as it cycles through states. Saved values for the inactive player are preserved if you switch players.", "text-to-audio")}
      </div>
    </div>
  );
}
