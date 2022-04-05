import React, { useState } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";
import {
  socialIcons,
  getData,
  postData,
  previewImage,
  addSocialIcon,
  deleteSocialIcon,
} from "./HeroHooks";
import {sliceComponentName}  from '../../../context/utilities'

/**
 * Css
 */
import "./hero.css";

export default function HeroModal({ setHeroData, updateBton }) {
  const [lgShow, setLgShow] = useState(false);
  const [hero, setData] = useState({
    _id: "",
    title: "",
    profession: "",
    social_icon_name: "",
    social_icon_url: "",
    backgroundImage: "",
    backgroundImageOpacity: "",
    icons: [],
  });
  /**
   * Handle content change value.
   * @param {event} e
   */
  const handleChange = (e) => {
    setData({ ...hero, ...{ [e.target.name]: e.target.value } });
  };

  /**
   * Handle hero content form submission
   * @param {event} e
   * @returns
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
    let form = new FormData(e.target);
    let iconMap = {};
    let data = {};
    data["icons"] = [];
    for (let [key, value] of form.entries()) {
      if (
        key === "" ||
        value === "" ||
        (key === "backgroundImage" && value.name === "" && !hero.backgroundImage)
      ) {
        alert("Please fill the value of : " + key);
        return;
      }



      
      if (key === "social_icon_name") {
        iconMap["icon"] = [value];
      } else if (key === "social_icon_url") {
        iconMap["icon"].push(value);
        data["icons"].push(iconMap["icon"]);
      } else {
        if(key === "backgroundImage" && value.name === "" && hero.backgroundImage){
          data[key] = hero.backgroundImage;
        }else{
          data[key] = value;
        }
      }
    }

    /**
     * format form data.
     */
    let formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "icons") {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === "_id") {
      } else {
        formData.append(key, data[key]);
      }
    });

    // for (let [key, value] of formData.entries()) {
    //   console.log(key, value);
    // }
    // return;

    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(process.env.REACT_APP_API_URL + "/api/hero/" + data._id, formData)
        .then((res) => {
          setHeroData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/hero", formData)
        .then((res) => {
          setHeroData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  /**
   * get hero content by id.
   * @param {id} id
   */
  const getHeroContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/hero/" + id).then((res) => {
      console.log(res)
      setData(res);
      setLgShow(true);
    });
  };

  return (
    <>
      {updateBton.display ?(
        <Button bsPrefix="azh_btn" onClick={(e) => getHeroContent(updateBton.id)}>
        Update Content
      </Button>
    ):(
        <Button bsPrefix="azh_btn" onClick={(e) => setLgShow(true)}>
         Add Content
      </Button>
    )}

      <Modal
        size="lg"
        show={lgShow}
        onHide={(e) => setLgShow(false)}
        aria-labelledby="example-modal-sizes-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
            {updateBton.display
              ? `Update ${sliceComponentName()} Section Content`
              : `${sliceComponentName()} Section Content`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            id="heroForm"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            <Form.Group className="mb-4" controlId="hero.titlle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                onChange={handleChange}
                value={hero.title}
                placeholder="Title"
              />
            </Form.Group>
            {updateBton.display && (
              <Form.Control
                type="text"
                id="_id"
                onChange={handleChange}
                value={hero._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group className="mb-4" controlId="hero.profession">
              <Form.Label>Profession</Form.Label>
              <Form.Control
                type="text"
                name="profession"
                onChange={handleChange}
                value={hero.profession}
                placeholder="Software Engineer, Teacher etc"
              />
            </Form.Group>

            <Row id="hero.social_row" className="mb-4">
              <Col
                xs={12}
                sm={12}
                lg={12}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Button
                  bsPrefix="azh_btn"
                  onClick={addSocialIcon}
                  id="hero.add_social_link"
                >
                  Add Social Link
                </Button>
              </Col>
              <Col id="social_icon_col">
                {hero.icons.length > 0 ? (
                  JSON.parse(hero.icons).map((icon, i) => {
                    return (
                      <Row key={i} data-id={++i}>
                        <Col
                          xs={12}
                          sm={6}
                          lg={5}
                          className="d-flex flex-col justify-content-start align-items-start mb-2"
                        >
                          <Form.Group
                            className="mb-3"
                            controlId="hero.social_icon"
                          >
                            <Form.Label>Social Icon</Form.Label>
                            <Form.Select
                              name="social_icon_name"
                              onChange={handleChange}
                              value={icon[0]}
                              aria-label="Default select example"
                            >
                              <option disabled>Open this select menu</option>
                              {socialIcons.map((item) => {
                                return (
                                  <option key={item} value={item}>
                                    {item[0].toUpperCase() + item.slice(1)}
                                  </option>
                                );
                              })}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col
                          xs={12}
                          sm={6}
                          lg={5}
                          className="d-flex flex-col  mb-2"
                        >
                          <Form.Group className="mb-3" controlId="hero.social_icon_url">
                            <Form.Label>Social URL</Form.Label>
                            <Form.Control
                              type="text"
                              name="social_icon_url"
                              value={icon[1]}
                              onChange={handleChange}
                              placeholder="URL"
                            />
                          </Form.Group>
                          <button
                            type="button"
                            className="azh_btn btn-danger azh_btn_delete deleteSocialIcon"
                            onClick={deleteSocialIcon}
                          >
                            Delete
                          </button>
                        </Col>
                      </Row>
                    );
                  })
                ) : (
                  <Row>
                    <Col
                      xs={12}
                      sm={6}
                      lg={5}
                      className="d-flex flex-col justify-content-start align-items-start mb-2"
                    >
                      <Form.Group className="mb-3" controlId="hero.social_icon">
                        <Form.Label>Social Icon</Form.Label>
                        <Form.Select
                          name="social_icon_name"
                          onChange={handleChange}
                          aria-label="Default select example"
                          defaultValue={"DEFAULT"}
                        >
                          <option value="DEFAULT" disabled>
                            Open this select menu
                          </option>
                          {socialIcons.map((item) => {
                            return (
                              <option key={item} value={item}>
                                {item[0].toUpperCase() + item.slice(1)}
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col
                      xs={12}
                      sm={6}
                      lg={7}
                      className="d-flex flex-col  mb-2"
                    >
                      <Form.Group className="mb-3">
                        <Form.Label>Social URL</Form.Label>
                        <Form.Control
                          type="text"
                          name="social_icon_url"
                          value={hero.social_icon_url}
                          onChange={handleChange}
                          placeholder="URL"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>
            <Row>
              <Col xs={12} sm={6} lg={6}>
                <Form.Group className="mb-4" controlId="hero.backgroundImage">
                  <Form.Label>Background Image</Form.Label>
                  <Form.Control
                    accept=".png, .jpg, .jpeg"
                    name="backgroundImage"
                    onChange={previewImage}
                    type="file"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} lg={6}>
                <Form.Group
                  className="mb-4"
                  controlId="hero.backgroundImagePreview"
                >
                  <img
                    id="previewImage"
                    height="100"
                    width="100"
                    alt={hero.backgroundImage}
                    src={hero.backgroundImage}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group
              className="mb-4"
              controlId="hero.backgroundImageOpacity"
            >
              <Form.Label>Background Image Opacity</Form.Label>
              <Form.Control
                type="text"
                name="backgroundImageOpacity"
                placeholder=".5"
                onChange={handleChange}
                value={hero.backgroundImageOpacity}
              />
            </Form.Group>
            <button className="azh_btn w-100" type="submit" id="hero.sumbit">
              {updateBton.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
