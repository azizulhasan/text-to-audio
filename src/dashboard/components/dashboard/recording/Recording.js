import React, { useState, useEffect } from "react";
import { ToggleButton, Form, Row, Col } from "react-bootstrap";

/**
 *
 * Scripts
 */
import { postWithoutImage, getData } from "../../context/utilities";
import toast from "../../context/Notify";
import { languages } from "./languages";

export default function Recording() {
  const [settings, setSettings] = useState({
    wpa__recording__lang: "",
    is_record_continously: true,
    rest_nonce: wp_access.rest_nonce,
  });
  const [alertContent, setAlertContent] = useState({
    isValid: false,
    message: "",
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    /**
     * Get data from and display to table.
     */
    let data = new FormData();
    data.append("method", "get");
     postWithoutImage(wp_access.api_url + "wpa/v1/accessories/record", data)
     .then((res) => {

       console.log(res)
       setSettings(res.data);
       setChecked(res.data.is_record_continously);
     })
     .catch((err) => {
       console.log(err);
     });

  }, []);

  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {
    setSettings({ ...settings, ...{ [e.target.name]: e.target.value } });
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
      } else if (key === "password_confirm" && value !== data.password) {
        toast("Password should be matched");
        return;
      }
      formData[key] = value;
    }
    formData.is_record_continously = checked;
    let data = new FormData();
    data.append("fields", JSON.stringify(formData));
    data.append("method", "post");
    postWithoutImage(wp_access.api_url + "wpa/v1/accessories/record", data)
      .then((res) => {
        console.log(res);
        // setSettings(res);
        // setChecked(res.is_record_continously);
        toast("Settings Data Saved");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <React.Fragment>
      <Row id="settings" className="mt-4">
        <Col
          xs={12}
          sm={12}
          lg={12}
          className=" justify-content-start align-items-start mt-2"
        >
          <h4>SpeechRecognition</h4>
        </Col>
      </Row>
      <Form onSubmit={handleSubmit}>
        <Row className="border ">
          <Col
            xs={12}
            sm={12}
            lg={12}
            className="d-flex flex-col justify-content-start align-items-start"
          >
            {settings.rest_nonce && (
              <Form.Control
                type="text"
                id="rest_nonce"
                onChange={handleChange}
                value={settings.rest_nonce}
                name="rest_nonce"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group>
              <Form.Label>Record In </Form.Label>
              <Form.Select
                onChange={handleChange}
                name="wpa__recording__lang"
                value={settings.wpa__recording__lang}
                aria-label="Default select example"
              >
                <option disabled> Default Record Language</option>
                {Object.keys(languages).map((lang_code, index) => {
                  return (
                    <option key={index} value={lang_code}>
                      {languages[lang_code]}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} sm={12} lg={12} className="d-flex flex-col mt-3">
            <Form.Group>
              <Form.Label>Continuous Record</Form.Label>
              <ToggleButton
                id="toggle-check"
                type="checkbox"
                className="form-controll"
                variant={checked ? "outline-primary" : "outline-danger"}
                checked={checked}
                value="1"
                onChange={(e) => setChecked(e.currentTarget.checked)}
              >
                {checked ? "Record" : "Not Record"}
              </ToggleButton>
            </Form.Group>
          </Col>

          {/* <Col xs={12} sm={12} lg={8} className=" mt-3">
            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                type="text"
                name="welcome_message"
                value={settings.welcome_message}
                onChange={handleChange}
                placeholder="welcome message"
              />
            </Form.Group>
          </Col> */}
          <div className="d-grid gap-3 col-2 mx-auto mt-5 mb-4">
            <button
              type="submit"
              className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary btn-center"
            >
              Submit
            </button>
          </div>
        </Row>
      </Form>
    </React.Fragment>
  );
}
