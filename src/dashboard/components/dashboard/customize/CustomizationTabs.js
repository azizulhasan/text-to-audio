import React, { useState } from "react";
import TTSCustomizationButton from "./button/TTSCustomizationButton";
import { __ } from "@wordpress/i18n";

function CustomizationTabs({
  buttonLists,
  listeningSettings,
  handleChange,
  customCSS,
  listeningBtnStyle,
}) {
  const [isPlayerSectionOpen, setIsPlayerSectionOpen] = useState(true);

  // Helper to handle toggle for player accordion
  const togglePlayerAccordion = () => {
    setIsPlayerSectionOpen((prevState) => !prevState);
  };

  return (
    <div className="border-0 shadow-sm mb-3 tta_player-customization-card">
      <div className="p-0">
        <div
          className="tta_player-header"
          onClick={togglePlayerAccordion}
          style={{ cursor: "pointer" }}
        >
          <h5 className="tta_player-title">{__("Player Customization","text-to-audio")}</h5>
          <button
            className="tta_player-toggle-btn"
            type="button"
            style={{ pointerEvents: "none" }}
          >
            {isPlayerSectionOpen ? "▲" : "▼"}
          </button>
        </div>
        {isPlayerSectionOpen && (
          <div className="tta_player-content">
            {/* Player Selection */}
            <TTSCustomizationButton
              buttonLists={buttonLists}
              listeningBtnStyle={listeningBtnStyle}
              handleChange={handleChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomizationTabs;