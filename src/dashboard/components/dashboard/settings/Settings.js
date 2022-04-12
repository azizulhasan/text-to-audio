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

  const [postTypes, setPostTypes] = useState(['post', 'shop_order', 'product', 'page'])

  useEffect(() => {
    /**
     * Get data from and display to table.
     */
    // getData(process.env.REACT_APP_API_URL + "/api/settings").then((res) => {
    //   setSettings(res.data[0]);
    //   setChecked(res.data[0].welcome_message_is_display);
    // });

    console.log(wp_access.post_types)
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
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col
            xs={12}
            sm={6}
            lg={4}
            className="d-flex flex-col justify-content-start align-items-start"
          >
            <Form.Label id="wps__settings_allow_recording_for_post_type">
              Allow Recording For Post Type
            </Form.Label>
          </Col>
          <Col xs={12} sm={12} lg={8} >
            <Form.Group>
              <Form.Select id="wps__settings_allow_recording_for_post_type" multiple >
                <option disabled>Select recording post type</option>
                <option value={'all'}>All</option>
                {postTypes.map((posttype,i)=> {
                    return (
                      <option key={posttype} value={posttype}>{posttype}</option>
                    )
                })}

              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row className="border-bottom mt-3">
          <Col
            xs={12}
            sm={6}
            lg={4}
            className="d-flex flex-col justify-content-start align-items-start"
          >
            <Form.Text id="wps__settings_display_btn_in_single_page">
              Display Button Only Single Page
            </Form.Text>
          </Col>
          <Col xs={12} sm={12} lg={8} className="d-flex flex-col">
            <Form.Group>
              <ToggleButton
                className={""}
                id="wps__settings_display_btn_in_single_page"
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
            <button
              type="submit"
              className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary btn-block"
            >
              {settings._id ? "Update" : "Submit"}
            </button>
          </div>
        </Row>
      </Form>
    </React.Fragment>
  );
}
