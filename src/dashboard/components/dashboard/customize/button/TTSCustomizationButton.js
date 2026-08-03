import React, { useEffect, useState } from "react";
import { proUrl } from "../../../../proUrl";
import {
  Button,
  Form,
  OverlayTrigger,
  Tooltip,
  Row,
  Col,
} from "react-bootstrap";
import { __ } from "@wordpress/i18n";
import { postData } from "../../../context/utilities";
import { MultiSelect } from "../../../context/MultiSelect";
import Icon from "../../../Icon";
import DemoLink from "../../../DemoLink";

export default function TTSCustomizationButton({
  listeningBtnStyle,
  handleChange,
  buttonLists,
}) {
  const [userRoles, setUserRoles] = useState({});
  // TTS-267: two separate concepts. `button_position` is where the player sits
  // in the content; `float_position` is the corner it docks to once it scrolls
  // out of view. Both ship in free — placement is a preference, not a metered
  // capability, and every comparable TTS plugin offers floating for free.
  // (Positions were Pro-gated in TTS-249.)
  const buttonPositions = {
    before_content: __("Before Content", "text-to-audio"),
    after_content: __("After Content", "text-to-audio"),
  };
  const floatPositions = {
    bottom_fixed: __("Bottom Full Width", "text-to-audio"),
    bottom_right: __("Bottom Right", "text-to-audio"),
    bottom_left: __("Bottom Left", "text-to-audio"),
    sticky_top: __("Sticky Top", "text-to-audio"),
  };
  // TTS-267: retired placements mapped onto the survivor, so a site that saved
  // one still shows a valid selection instead of an empty select.
  const floatAliases = { bottom_center: "bottom_fixed" };
  const resolveFloat = (value) => floatAliases[value] || value;
  // Installs configured before the split stored a Bottom_* value in
  // button_position; treat that as the dock corner so nothing regresses. The
  // fallback is bottom_right rather than the bottom_fixed default because
  // reaching it means a pre-split install, and those docked bottom-right.
  const legacyPosition = resolveFloat(
    listeningBtnStyle?.buttonSettings?.button_position
  );
  const currentFloat =
    resolveFloat(listeningBtnStyle?.buttonSettings?.float_position) ||
    (floatPositions[legacyPosition] ? legacyPosition : "bottom_right");

  useEffect(() => {
    postData(ttsObj.api_url + "tta/v1/get_all_user_roles", {}, "GET")
      .then((res) => {
        if (res?.status) {
          setUserRoles(res.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      <Row className="tta_player-controls-row g-3">
        <Col md={4}>
          <Form.Group className="tta_player-form-group">
            <Form.Label htmlFor="id" className="tta_player-label">
              {__("Select Player", "text-to-audio")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-player">
                    {__("Click To Know How It Works?", "text-to-audio")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <Icon name="youtube" />
                </a>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="id"
              id="id"
              value={listeningBtnStyle?.buttonSettings?.id || 1}
              aria-label={__("Select Player", "text-to-audio")}
              className="tta_player-select"
            >
              <option disabled>{__("Select Player", "text-to-audio")}</option>
              {buttonLists.map((button, index) => {
                return (
                  <option
                    disabled={button.disabled}
                    key={button.id}
                    value={button.id}
                  >
                    {button.name}
                  </option>
                );
              })}
            </Form.Select>
            {/* TTS-249: upsell link instead of shipping locked player options.
                Shown only when the premium players aren't registered (Pro inactive). */}
            {!buttonLists.some((b) => b.id > 1) && (
              <>
                <p className="tta_player-upsell text-secondary mt-2 mb-0 small">
                  {__("More players (AI voices, MP3) are available in", "text-to-audio")}{" "}
                  <a
                    href={proUrl('customize_button', 'product')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {__("AtlasVoice Pro", "text-to-audio")}
                  </a>
                  .
                </p>
                {/* TTS-264 — hear those locked players on the live demo. */}
                <div className="mt-2">
                  <DemoLink
                    content="customize_players"
                    label={__("Hear the Pro players live", "text-to-audio")}
                  />
                </div>
              </>
            )}
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group className="tta_player-form-group">
            <Form.Label htmlFor="button_position" className="tta_player-label">
              {__("Select Button Position", "text-to-audio")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-position">
                    {__("Select where to display the player button", "text-to-audio")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <Icon name="youtube" />
                </a>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="button_position"
              id="button_position"
              value={
                buttonPositions[listeningBtnStyle?.buttonSettings?.button_position]
                  ? listeningBtnStyle.buttonSettings.button_position
                  : "before_content"
              }
              aria-label={__("Select Button Position", "text-to-audio")}
              className="tta_player-select"
            >
              <option disabled>{__("Select Button Position", "text-to-audio")}</option>
              {Object.keys(buttonPositions).map((positionKey, index) => {
                return (
                  <option key={positionKey} value={positionKey}>
                    {buttonPositions[positionKey]}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group className="tta_player-form-group">
            <Form.Label htmlFor="float_position" className="tta_player-label">
              {__("Floating Position", "text-to-audio")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-float-position">
                    {__(
                      "Where the player docks once the reader scrolls past it. Turn docking off entirely with \"When Scroll Down Stop Floating Player\" in Settings.",
                      "text-to-audio"
                    )}
                  </Tooltip>
                }
              >
                <span className="tta_youtube-link">
                  <Icon name="question-circle" />
                </span>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="float_position"
              id="float_position"
              value={currentFloat}
              aria-label={__("Floating Position", "text-to-audio")}
              className="tta_player-select"
            >
              {Object.keys(floatPositions).map((positionKey) => {
                return (
                  <option key={positionKey} value={positionKey}>
                    {floatPositions[positionKey]}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group className="tta_player-form-group">
            <Form.Label className="tta_player-label">
              {__("Display Player To", "text-to-audio")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-display">
                    {__("Choose who can see the player", "text-to-audio")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <Icon name="youtube" />
                </a>
              </OverlayTrigger>
            </Form.Label>
            {listeningBtnStyle?.buttonSettings?.display_player_to &&
              Object.keys(userRoles).length && (
                <MultiSelect
                  toastMessage={
                    __("Player display restriction to multiple user type is available in the pro version", "text-to-audio")
                  }
                  name={"display_player_to"}
                  id={"display_player_to"}
                  selectedItems={
                    listeningBtnStyle?.buttonSettings?.display_player_to || [
                      "all",
                    ]
                  }
                  selectionLimit={1}
                  options={userRoles}
                  onChange={handleChange}
                />
              )}
          </Form.Group>
        </Col>
      </Row>

      {listeningBtnStyle?.buttonSettings?.id > 2 &&
        Object.keys(userRoles).length && (
          <>
            <div className="tta_player-divider"></div>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <Form.Group className="tta_player-form-group">
                  <Form.Label className="tta_player-label">
                    {__("Who Can Download MP3 File", "text-to-audio")}
                  </Form.Label>
                  <MultiSelect
                    toastMessage={
                      __("Player display restriction to multiple user type is available in the pro version", "text-to-audio")
                    }
                    name={"who_can_download_mp3_file"}
                    id={"who_can_download_mp3_file"}
                    multiselectIndex={1}
                    selectedItems={
                      listeningBtnStyle?.buttonSettings
                        ?.who_can_download_mp3_file || ["all"]
                    }
                    selectionLimit={100}
                    options={userRoles}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="tta_player-form-group">
                  <Form.Label className="tta_player-label">
                    {__("MP3 Generation From Post's Publish Date", "text-to-audio")}
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="tooltip-date-from">
                          {__("Start Generating MP3 file from an specific post publish date. Select this only if you want to generate mp3 file based on date range.", "text-to-audio")}

                        </Tooltip>
                      }
                    >
                      <Button variant="link" className="tta_question-icon">
                        {__("?", "text-to-audio")}
                      </Button>
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="generate_mp3_date_from"
                    onChange={handleChange}
                    id="generate_mp3_date_from"
                    value={
                      listeningBtnStyle?.buttonSettings
                        ?.generate_mp3_date_from || ""
                    }
                    title={__("Generate MP3 File Date From", "text-to-audio")}
                    className="tta_player-date-input"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="tta_player-form-group">
                  <Form.Label className="tta_player-label">
                    {__("MP3 Generation Till Post's Publish Date", "text-to-audio")}
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="tooltip-date-to">
                          {__("Start Generating MP3 file till an specific post publish date. Select this only if you want to generate mp3 file based on date range.", "text-to-audio")}
                        </Tooltip>
                      }
                    >
                      <Button variant="link" className="tta_question-icon">
                         {__("?", "text-to-audio")}
                      </Button>
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="generate_mp3_date_to"
                    onChange={handleChange}
                    id="generate_mp3_date_to"
                    value={
                      listeningBtnStyle?.buttonSettings?.generate_mp3_date_to ||
                      ""
                    }
                    title={__("Generate MP3 File Date To", "text-to-audio")}
                    className="tta_player-date-input"
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        )}
    </>
  );
}
