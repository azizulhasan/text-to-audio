import React, { useEffect, useState } from "react";
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

export default function TTSCustomizationButton({
  listeningBtnStyle,
  handleChange,
  buttonLists,
}) {
  const [userRoles, setUserRoles] = useState({});
  let buttonPositions = {
    before_content: "Before Content",
    after_content: "After Content",
    bottom_fixed: "Bottom Fixed (Pro)",
    bottom_left: "Bottom Left (Pro)",
    bottom_right: "Bottom Right (Pro)",
    bottom_center: "Bottom Center (Pro)",
  };

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
              {__("Select Player")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-player">
                    {__("Click To Know How It Works?")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <i className="fab fa-youtube"></i>
                </a>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="id"
              id="id"
              value={listeningBtnStyle?.buttonSettings?.id || 1}
              aria-label="Select Player"
              className="tta_player-select"
            >
              <option disabled>{__("Select Player")}</option>
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
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group className="tta_player-form-group">
            <Form.Label htmlFor="button_position" className="tta_player-label">
              {__("Select Button Position")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-position">
                    {__("Select where to display the player button")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <i className="fab fa-youtube"></i>
                </a>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="button_position"
              id="button_position"
              value={
                listeningBtnStyle?.buttonSettings?.button_position ||
                "before_content"
              }
              aria-label="Select Button Position"
              className="tta_player-select"
            >
              <option disabled>{__("Select Button Position")}</option>
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
            <Form.Label className="tta_player-label">
              {__("Display Player To")}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-display">
                    {__("Choose who can see the player")}
                  </Tooltip>
                }
              >
                <a
                  className="tta_youtube-link"
                  target="_blank"
                  href="https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s"
                >
                  <i className="fab fa-youtube"></i>
                </a>
              </OverlayTrigger>
            </Form.Label>
            {listeningBtnStyle?.buttonSettings?.display_player_to &&
              Object.keys(userRoles).length && (
                <MultiSelect
                  toastMessage={
                    "Player display restriction to multiple user type is available in the pro version"
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
                    {__("Who Can Download MP3 File")}
                  </Form.Label>
                  <MultiSelect
                    toastMessage={
                      "Player display restriction to multiple user type is available in the pro version"
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
                    {__("MP3 Generation From Post's Publish Date")}
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
                    title="Generate MP3 File Date From"
                    className="tta_player-date-input"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="tta_player-form-group">
                  <Form.Label className="tta_player-label">
                    {__("MP3 Generation Till Post's Publish Date")}
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
                    title="Generate MP3 File Date To"
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
