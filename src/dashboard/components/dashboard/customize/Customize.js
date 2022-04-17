import React, { useState, useEffect } from "react";
import { Col, Container, Row, Form, FloatingLabel } from "react-bootstrap";
import toast from "../../context/Notify";
import { postWithoutImage } from "../../context/utilities";
export default function Customize() {
  const [listeningBtnStyle, setListeningStyle] = useState({
    backgroundColor: "rgb(226, 222, 232)",
    color: "rgb(0, 0, 0)",
    width: "100",
  });
  const [listeningBtnStyle2, setListeningStyle2] = useState({
    backgroundColor: "rgb(226, 222, 232)",
    color: "rgb(0, 0, 0)",
    width: "100%",
    border: "0",
  });
  const [speakingText, setSpeakingText] = useState("");

  useEffect(() => {

    /**
     * Get customize settings.
     */
    let customize = new FormData();
    customize.append("method", "get");
    postWithoutImage(wp_access.api_url + "wps/v1/speech/customize", customize)
      .then((res) => {
        setListeningStyle(res.data)
        setListeningStyle2({
          ...listeningBtnStyle2,
          ...{backgroundColor: res.data.backgroundColor},
          ...{color: res.data.color},
          ...{width: [res.data.width, "%"].join('')}
        })
      })
      .catch((err) => {
        console.log(err);
      });

      setSpeakingText(localStorage.getItem('speakingText'))
  }, []);
  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {
    if (
      e.target.name === "width" &&
      (e.target.value > 100 || e.target.value < 0)
    ) {
      toast("Value should between 0-100");
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
    } else {
      value = e.target.value;
    }
    setListeningStyle2({
      ...listeningBtnStyle2,
      ...{ [e.target.name]: value },
    });
  };

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
    // console.log(formData);
    // return;
    let data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(wp_access.api_url + "wps/v1/speech/customize", data)
      .then((res) => {
        setListeningStyle(res.data)
        toast("Customize Data Saved");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const callListeningFunction = (e) => {
    let text = document.getElementById("wps__demo_text_for_play").value;

    if (text === "") {
      toast("Please write/say something into textarea.");
      return;
    }
    setSpeakingText(text);
    listenCotentInFrontend(text, "wps__listen_content");
  };

  /**
   * Copy short Code
   */
  const CopyShortcode = () => {
    /* Get the text field */
    var copyText = document.getElementById("wps_play_btn_shortcode");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    navigator.clipboard.writeText(copyText.value);

    /* Alert the copied text */
    toast("Copied the text: " + copyText.value);
  };

  const setText  = (e) => {
    setSpeakingText(e.target.value)
    localStorage.setItem('speakingText', e.target.value)
  }
  return (
    <Container>
      <Row className="mt-5">
        <Col xs={12} sm={12} lg={8}>
          <Row>
            <Col xs={12} sm={12} lg={12} className="mb-3">
              <button
                id="wps__listen_content"
                onClick={(e) => callListeningFunction(e)}
                style={listeningBtnStyle2}
                type="button"
                title="WP Speech:  Tap to listen post."
              >
                <span className="dashicons dashicons-controls-play"></span>{" "}
                Listen
              </button>
            </Col>
            <Col xs={12} sm={12} lg={12} className="mb-3">
              <>
                <FloatingLabel
                  controlId="wps__demo_text_for_play"
                  label="Write here something and click listen button."
                >
                  <Form.Control
                    as="textarea"
                    onChange={(e) => setText(e)}
                    onFocus={(e) => toast("Write/Say something here.")}
                    value={speakingText}
                    placeholder="Write here something and click listen button."
                    style={{ height: "100px" }}
                  />
                </FloatingLabel>
              </>
            </Col>

            <Col xs={12} sm={12} lg={11} className="mt-3">
              <Form.Label htmlFor="wps_play_btn_shortcode">
                Short Code
              </Form.Label>
              <Form.Control
                type="text"
                name="wps_play_btn_shortcode"
                onChange={handleChange}
                id="wps_play_btn_shortcode"
                defaultValue={"[wps_play_btn]"}
                title="Short code"
              />
            </Col>
            <Col xs={12} sm={12} lg={1} className="mt-5">
              <button onClick={CopyShortcode}>
                <img
                  src={wp_access.image_url + "/copy.svg"}
                  width="15px"
                  alt="Copy short code to clipboard"
                />
              </button>
            </Col>
          </Row>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Form onSubmit={handleSubmit}>
            <h4>Customize Listening Button</h4>

            <Form.Label htmlFor="backgroundColor">BackGround Color</Form.Label>
            <Form.Control
              type="color"
              name="backgroundColor"
              onChange={handleChange}
              id="backgroundColor"
              value={listeningBtnStyle.backgroundColor}
              title="Choose your color"
            />
            <Form.Label htmlFor="color">Text Color</Form.Label>
            <Form.Control
              type="color"
              name="color"
              onChange={handleChange}
              id="color"
              value={listeningBtnStyle.color}
              title="Choose your color"
            />
            <Form.Label htmlFor="color">Button Width (%)</Form.Label>
            <Form.Control
              type="number"
              name="width"
              onChange={handleChange}
              id="width"
              min={"0"}
              max="100"
              value={listeningBtnStyle.width}
              title="Button Width"
            />
            <div className="d-grid gap-3 col-12 mx-auto mt-5 mb-4">
              <button
                type="submit"
                className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary btn-center btn-block"
              >
                Submit
              </button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
