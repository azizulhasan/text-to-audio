import React, { useState, useEffect } from "react";
import { ToggleButton, Form, Row, Col } from "react-bootstrap";

/**
 *
 * Scripts
 */
import { postWithoutImage, getData } from "../../context/utilities";
import toast from "../../context/Notify";
import { type } from "@testing-library/user-event/dist/type";

export default function Settings() {
  const [settings, setSettings] = useState({
    wps__settings_display_btn_in_single_page: false,
    wps__settings_allow_recording_for_post_type: [],
  });

  const [checked, setChecked] = useState(false);

  const [postTypes, setPostTypes] = useState([
    "all",
    "post",
    "product",
    "page",
  ]);

  useEffect(() => {
    /**
     * Get data from and display to table.
     */
     let formData = new FormData();
     formData.append("method", "get");
     postWithoutImage(wp_access.api_url + "wps/v1/speech/settings", formData).then(res=>{
       console.log(res.data)
      setSettings(res.data);
      setChecked(res.data.wps__settings_display_btn_in_single_page);
     }) 

  }, []);

  /**
   * handle change
   * @param {*} e
   */
  const handleChange = (e) => {
    if(e.target.name === 'wps__settings_allow_recording_for_post_type'){

      let temp = settings[e.target.name]
      temp.push(e.target.value)
      setSettings({ ...settings, ...{ [e.target.name]: temp } });
    }else{
      setSettings({ ...settings, ...{ [e.target.name]: e.target.value } });

    }
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
    let arr = []
    for (let [key, value] of form.entries()) {
      if (key === "" || value === "") {
        toast("Please fill the  field : " + key);
        return;
      }else if( key === 'wps__settings_allow_recording_for_post_type'){
        arr.push(value)
        data[key] = arr;
      }else{
        data[key] = value;
      }
    }

    data.wps__settings_display_btn_in_single_page = checked;
    let formData = new FormData();
    formData.append("fields", JSON.stringify(data));
    formData.append("method", "post");
    postWithoutImage(wp_access.api_url + "wps/v1/speech/settings", formData)
      .then((res) => {
        console.log(res.data)
        setSettings(res.data);
        setChecked(res.data.wps__settings_display_btn_in_single_page);
        toast("Settings Data Saved");
      })
      .catch((err) => {
        console.log(err);
      });
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
          <Col xs={12} sm={12} lg={8}>
            <Form.Group>
              <Form.Select
                id="wps__settings_allow_recording_for_post_type"
                name="wps__settings_allow_recording_for_post_type"
                onChange={handleChange}
                defaultValue={settings.wps__settings_allow_recording_for_post_type}
                multiple
              >
                <option disabled>Select recording post type</option>
                {postTypes.map((posttype, i) => {
                  return (
                    <option key={posttype}   value={posttype}>
                      {posttype}
                    </option>
                  );
                })}
              </Form.Select>
              <Form.Text>
                Select: {settings.wps__settings_allow_recording_for_post_type}
              </Form.Text>
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
          <div className="d-grid gap-3 col-2 mx-auto mt-5 mb-4">
            <button
              type="submit"
              className="azh_btn azh_btn_edit azh_btn azh_btn_edit-primary btn-block"
            >
              Submit
            </button>
          </div>
        </Row>
      </Form>
    </React.Fragment>
  );
}
