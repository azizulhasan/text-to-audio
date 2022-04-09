import React, { useEffect, useState } from "react";
import {
  Col,
  Container,
  Row,
  Form,
  Button,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { languages } from "../recording/languages";
export default function Listening() {
  const [voices, setVoices] = useState([]);
  const [listeningSettings, setListeningSettings] = useState({
    wps__listening_voice: "Microsoft David - English (United States)",
    wps__listening_pitch: 2,
    wps__listening_rate: 1,
    wps__listening_volume: 1,
    wps__listening_lang: "en",
  });

  useEffect(() => {
    setTimeout(() => {
      setVoices(window.speechSynthesis.getVoices());
    }, 10);
  }, []);

  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {
    setListeningSettings({
      ...listeningSettings,
      ...{ [e.target.name]: e.target.value },
    });
  };
  return (
    <Container>
      <Row>
        <Col xs={12} sm={12} lg={8} className="">
          <Form.Group>
            <Form.Label>Voice to speak </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="wps__listening_voice"
              value={listeningSettings.wps__listening_voice}
              aria-label="Default select example"
            >
              <option disabled> Default Listening Voice</option>
              {voices.map((voice, index) => {
                return (
                  <option key={index} value={voice.name}>
                    {voice.name}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} lg={4} className="mt-4">
          <>
            {["top"].map((placement) => (
              <OverlayTrigger
                key={placement}
                placement={placement}
                overlay={
                  <Tooltip id={`tooltip-${placement}`}>
                    Gets and sets the voice that will be used to speak
                  </Tooltip>
                }
              >
                <Button variant="secondary">?</Button>
              </OverlayTrigger>
            ))}
          </>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} lg={8} className="">
          <Form.Group>
            <Form.Label>Voice Pitch </Form.Label>
            <Form.Select
              onChange={handleChange}
              name="wps__listening_pitch"
              value={listeningSettings.wps__listening_pitch}
              aria-label="Default select example"
            >
              <option disabled> Default Listening Pitch</option>
              {[0, 1, 2].map((pitch, index) => {
                return (
                  <option key={index} value={pitch}>
                    {pitch}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} lg={4} className="mt-4">
          <>
            {["top"].map((placement) => (
              <OverlayTrigger
                key={placement}
                placement={placement}
                overlay={
                  <Tooltip id={`tooltip-${placement}`}>
                    Gets and sets the pitch at which the utterance will be
                    spoken at.
                  </Tooltip>
                }
              >
                <Button variant="secondary">?</Button>
              </OverlayTrigger>
            ))}
          </>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} lg={8} className="">
          <Form.Group>
            <Form.Label htmlFor="wps__listening_rate">Voice Speed</Form.Label>
            <Form.Control
              type="text"
              id="wps__listening_rate"
              name="wps__listening_rate"
              value={listeningSettings.wps__listening_rate}
              aria-describedby="wps__listening_rate"
            />
            <Form.Text id="wps__listening_rate" muted>
            Value : From 0.1 to 10.
            </Form.Text>
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} lg={4} className="mt-4">
          <>
            {["top"].map((placement) => (
              <OverlayTrigger
                key={placement}
                placement={placement}
                overlay={
                  <Tooltip id={`tooltip-${placement}`}>
                    Gets and sets the speed at which the utterance will be
                    spoken at. Value : From 0.1 to 10
                  </Tooltip>
                }
              >
                <Button variant="secondary">?</Button>
              </OverlayTrigger>
            ))}
          </>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} lg={8} className="">
          <Form.Group>
            <Form.Label htmlFor="wps__listening_volume">Voice Volume</Form.Label>
            <Form.Control
              type="text"
              id="wps__listening_volume"
              name="wps__listening_volume"
              value={listeningSettings.wps__listening_volume}
              aria-describedby="wps__listening_volume"
            />
            <Form.Text id="wps__listening_volume" muted>
            Value : From 0 to 1.
            </Form.Text>
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} lg={4} className="mt-4">
          <>
            {["top"].map((placement) => (
              <OverlayTrigger
                key={placement}
                placement={placement}
                overlay={
                  <Tooltip id={`tooltip-${placement}`}>
                    Gets and sets the volume that the utterance will be spoken at. Value : From 0 to 1
                  </Tooltip>
                }
              >
                <Button variant="secondary">?</Button>
              </OverlayTrigger>
            ))}
          </>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} lg={8} className="">
          <Form.Group>
          <Form.Label>Voice Language</Form.Label>
              <Form.Select
                onChange={handleChange}
                name="wps__listening_lang"
                value={listeningSettings.wps__listening_lang}
                aria-label="Default select example"
              >
                <option disabled> Default Listening Language</option>
                {[Object.keys(languages)].map((lang_code, index) => {
                  return (
                    <option key={index} value={lang_code}>
                      {languages[lang_code]}
                    </option>
                  );
                })}
              </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} lg={4} className="mt-4">
          <>
            {["top"].map((placement) => (
              <OverlayTrigger
                key={placement}
                placement={placement}
                overlay={
                  <Tooltip id={`tooltip-${placement}`}>
                    Gets and sets the language of the utterance.
                  </Tooltip>
                }
              >
                <Button variant="secondary">?</Button>
              </OverlayTrigger>
            ))}
          </>
        </Col>
      </Row>
    </Container>
  );
}
