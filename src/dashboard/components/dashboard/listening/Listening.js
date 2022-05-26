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
/**
 *
 * Scripts
 */
import { postWithoutImage, getData } from "../../context/utilities";
import toast from "../../context/Notify";
import { langs } from "../recording/languages";
export default function Listening() {
  const [voices, setVoices] = useState([]);
  const [listeningSettings, setListeningSettings] = useState({
    wps__listening_voice: "Microsoft David - English (United States)",
    wps__listening_pitch: 2,
    wps__listening_rate: 1,
    wps__listening_volume: 1,
    wps__listening_lang: "en_GB",
  });
  const [listeningLang, setListeningLang] = useState('en_GB')

  useEffect(() => {
    setTimeout(() => {
      setVoices(window.speechSynthesis.getVoices());
    }, 10);
    /**
     * Set listening lang.
     */
    let data = new FormData();
    data.append("method", "get");
    postWithoutImage(wps_obj.api_url + "wps/v1/speech/record", data)
      .then((res) => {
        // console.log(res)
        setListeningLang(res.data.wps__recording__lang);
      })
      .catch((err) => {
        console.log(err);
      });

    /**
     * Set listening data.
     */
    let data2 = new FormData();
    data2.append("method", "get");
    postWithoutImage(wps_obj.api_url + "wps/v1/speech/listening", data2)
      .then((res) => {
        // console.log(res.data)
        setListeningSettings(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  /**
   * Handle form Submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
    let form = new FormData(e.target);

    let formData = {};
    for (let [key, value] of form.entries()) {
      if (key === "" || value === "") {
        toast("Please fill the  field : " + key);
        return;
      }
      formData[key] = value;
    }

    // console.log(formData)
    // return;
    let data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(wps_obj.api_url + "wps/v1/speech/listening", data)
      .then((res) => {
        // console.log(res);
        setListeningSettings(res.data);
        toast("Listening Data Saved");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {

    if(e.target.name == 'wps__listening_lang' && e.target.value !== listeningLang) {
      toast("Listening language will be always recording language.")
      return;
    }
    setListeningSettings({
      ...listeningSettings,
      ...{ [e.target.name]: e.target.value },
    });
  };
  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col xs={12} sm={8} lg={8} >
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
          <Col xs={12} sm={4} lg={4} className="mt-4">
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
                  <Button className="wps_btn">?</Button>
                </OverlayTrigger>
              ))}
            </>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={8} lg={8} >
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
          <Col xs={12} sm={4} lg={4} className="mt-4">
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
                  <Button className="wps_btn">?</Button>
                </OverlayTrigger>
              ))}
            </>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={8} lg={8} >
            <Form.Group>
              <Form.Label htmlFor="wps__listening_rate">Voice Speed</Form.Label>
              <Form.Control
                type="text"
                id="wps__listening_rate"
                name="wps__listening_rate"
                onChange={handleChange}
                value={listeningSettings.wps__listening_rate}
                aria-describedby="wps__listening_rate"
              />
              <Form.Text id="wps__listening_rate" muted>
                Value : From 0.1 to 10.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col xs={12} sm={4} lg={4} className="mt-4">
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
                  <Button className="wps_btn">?</Button>
                </OverlayTrigger>
              ))}
            </>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={8} lg={8} >
            <Form.Group>
              <Form.Label htmlFor="wps__listening_volume">
                Voice Volume
              </Form.Label>
              <Form.Control
                type="text"
                id="wps__listening_volume"
                name="wps__listening_volume"
                onChange={handleChange}
                value={listeningSettings.wps__listening_volume}
                aria-describedby="wps__listening_volume"
              />
              <Form.Text id="wps__listening_volume" muted>
                Value : From 0 to 1.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col xs={12} sm={4} lg={4} className="mt-4">
            <>
              {["top"].map((placement) => (
                <OverlayTrigger
                  key={placement}
                  placement={placement}
                  overlay={
                    <Tooltip id={`tooltip-${placement}`}>
                      Gets and sets the volume that the utterance will be spoken
                      at. Value : From 0 to 1
                    </Tooltip>
                  }
                >
                  <Button className="wps_btn">?</Button>
                </OverlayTrigger>
              ))}
            </>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={8} lg={8} >
            <Form.Group>
              <Form.Label>Voice Language</Form.Label>
              <Form.Select
                onChange={handleChange}
                name="wps__listening_lang"
                value={listeningLang}
                aria-label="Default select example"
              >
                <option disabled> Default Listening Language</option>
                {Object.keys(langs).map((lang_code, index) => {
                  return (
                    <option
												key={index}
												value={langs[lang_code][1][0]}>
												{langs[lang_code][0]}
											</option>
                  );
                })}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} sm={4} lg={4} className="mt-4">
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
                  <Button className="wps_btn">?</Button>
                </OverlayTrigger>
              ))}
            </>
          </Col>
          <div className="d-grid gap-3 col-2 mx-auto mt-5 mb-4">
            <button
              type="submit"
              className="wps_btn  btn-center"
            >
              Submit
            </button>
          </div>
        </Row>
      </Form>
    </Container>
  );
}
