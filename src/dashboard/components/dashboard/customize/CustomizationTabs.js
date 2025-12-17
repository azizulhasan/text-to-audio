import React, { useState } from "react";
import { Form } from "react-bootstrap";
import TTSButtonDesign from "./design/TTSButtonDesign";
import TTSCustomizationButton from "./button/TTSCustomizationButton";

function CustomizationTabs({
  buttonLists,
  listeningSettings,
  handleChange,
  handleSubmit,
  customCSS,
  listeningBtnStyle,
  activeTab,
}) {
  const [isPlayerSectionOpen, setIsPlayerSectionOpen] = useState(false);

  // Helper to handle toggle for player accordion
  const togglePlayerAccordion = () => {
    setIsPlayerSectionOpen((prevState) => !prevState);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {activeTab === "player" && (
        <div className="border-0 shadow-sm mb-3 tta_player-customization-card">
          <div className="p-0">
            <div
              className="tta_player-header"
              onClick={togglePlayerAccordion}
              style={{ cursor: "pointer" }}
            >
              <h5 className="tta_player-title">Player Customization</h5>
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
                <TTSCustomizationButton
                  buttonLists={buttonLists}
                  listeningBtnStyle={listeningBtnStyle}
                  handleChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "design" && (
        <>
          <TTSButtonDesign
            customCSS={customCSS}
            listeningBtnStyle={listeningBtnStyle}
            handleChange={handleChange}
          />

          <div
            className="position-sticky bottom-0"
            style={{ zIndex: 1030, marginTop: "20px" }}
          >
            <div className="d-grid mt-4">
              <button type="submit" className="btn tta_btn">
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </Form>
  );
}

export default CustomizationTabs;
