import React, { useState, useEffect } from "react";
import { ToggleButton, Form, Row, Col } from "react-bootstrap";

/**
 *
 * Scripts
 */
import { postWithoutImage, getData } from "../../context/utilities";
import toast from "../../context/Notify";

export default function Settings() {
  const [settings, setSettings] = useState({
    _id: "",
    email: "",
    password: "",
    password_confirm: "",
    welcome_message: "",
    welcome_message_is_display: true,
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
    // getData(process.env.REACT_APP_API_URL + "/api/settings").then((res) => {
    //   setSettings(res.data[0]);
    //   setChecked(res.data[0].welcome_message_is_display);
    // });
  }, []);

  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {
    setSettings({ ...settings, ...{ [e.target.name]: e.target.value } });
  };
  /**
   * Handle confirm password
   */
  const handleConfirmPassword = (e) => {
    if (
      e.target.name === "password_confirm" &&
      settings.password !== e.target.value
    ) {
      setAlertContent({
        ...{ isValid: false },
        ...{ message: "Password should be same." },
      });
    } else {
      setAlertContent({
        ...{ isValid: true },
        ...{ message: "Password matched." },
      });
    }

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
    let data = {};
    for (let [key, value] of form.entries()) {
      if (key === "" || value === "") {
        toast("Please fill the  field : " + key);
        return;
      } else if (key === "password_confirm" && value !== data.password) {
        toast("Password should be matched");
        return;
      }

      data[key] = value;
    }

    data.welcome_message_is_display = checked;
    if (data._id !== undefined) {
      postWithoutImage(
        process.env.REACT_APP_API_URL + "/api/settings/" + data._id,
        data
      )
        .then((res) => {
          setSettings(res);
          setChecked(res.welcome_message_is_display);
          toast("Settings Data Updated");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postWithoutImage(process.env.REACT_APP_API_URL + "/api/settings", data)
        .then((res) => {
          setSettings(res);
          setChecked(res.welcome_message_is_display);
          toast("Settings Data Saved");
        })
        .catch((err) => {
          console.log(err);
        });
    }
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
          <h4>Mail Credentials</h4>
          <p className="text-danger mt-2 mb-2">Note: Please Enable Less secure app access for recieving email. <a href="https://www.google.com/settings/security/lesssecureapps" target="_blank"><button className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary" type="button">Enable</button></a></p>
        </Col>
      </Row>
      <Form onSubmit={handleSubmit} >
        <Row className="border " >
          <Col
            xs={12}
            sm={6}
            lg={4}
            className="d-flex flex-col justify-content-start align-items-start"
          >
            {settings._id && (
              <Form.Control
                type="text"
                id="_id"
                onChange={handleChange}
                value={settings._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group>
              <Form.Label>Email </Form.Label>
              <Form.Control
                type="emial"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="Email"
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={4} className="d-flex flex-col">
            <Form.Group>
              <Form.Label>Password </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={settings.password}
                onChange={handleChange}
                placeholder="password"
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={4} className="d-flex flex-col">
            <Form.Group>
              <Form.Label>Password Confirm</Form.Label>
              <Form.Control
                type="password"
                name="password_confirm"
                value={settings.password_confirm}
                onChange={handleConfirmPassword}
                placeholder="password confirm"
              />
              <Form.Control.Feedback
                type={alertContent.isValid ? "valid" : "invalid"}
                style={{ display: "block" }}
              >
                {alertContent.message ? alertContent.message : ""}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col
            xs={12}
            sm={12}
            lg={12}
            className="d-flex flex-col justify-content-start align-items-start mt-2"
          >
            <h4>Show/Hide Welcome Message</h4>
          </Col>
          <Col xs={12} sm={12} lg={8} className=" mt-3">
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
          </Col>
          <Col xs={12} sm={12} lg={4} className="d-flex flex-col mt-3">
            <Form.Group>
              <ToggleButton
                className={"mt-4"}
                id="toggle-check"
                type="checkbox"
                variant={checked ? "outline-primary" : "outline-danger"}
                checked={checked}
                value="1"
                onChange={(e) => setChecked(e.currentTarget.checked)}
              >
                {checked ? "Shwo" : "Hide"}
              </ToggleButton>
            </Form.Group>
          </Col>
          <div className="d-grid gap-3 col-2 mx-auto mt-5 mb-4">
            <button type="submit" className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary btn-center">
              {settings._id ? "Update" : "Submit"}
            </button>
          </div>
        </Row>
        
      </Form>
    </React.Fragment>
  );
}
