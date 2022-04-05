import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";

import { Editor } from "@tinymce/tinymce-react";

import { getData, postData, getIframeContent } from "./ExperienceHooks";
import { sliceComponentName } from "../../../../context/utilities";

export default function ExperienceModal({
  setExperienceData,
  updateBtn,
  modalShow,
  lgShow,
}) {
  const [experience, setData] = useState({
    _id: "",
    position: "",
    from: "",
    to: "",
    company: "",
    address: "",
    details: "",
  });
  useEffect(() => {
    if (lgShow === true) {
      if (updateBtn.id !== "") {
        getExperienceContent(updateBtn.id);
      } else {
        setData({
          _id: "",
          position: "",
          from: "",
          to: "",
          company: "",
          address: "",
          details: "",
        });
      }
    }
  }, [lgShow]);

  /**
   * get experience content by id.
   * @param {id} id
   */
  const getExperienceContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/experience/" + id)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  /**
   * Handle content change value.
   * @param {event} e
   */
  const handleChange = (e) => {
    setData({ ...experience, ...{ [e.target.name]: e.target.value } });
  };
  /**
   * Handle experience content form submission
   * @param {event} e
   * @returns
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
    let form = new FormData(e.target);
    let data = {};
    for (let [key, value] of form.entries()) {
      if (key !== "to") {
        if (key === "" || value === "") {
          alert("Please fill the value of : " + key);
          return;
        }
      }
      if (key === "to" && value === "") {
        data[key] = "Present";
      } else {
        data[key] = value;
      }
    }
    data["details"] = getIframeContent();

    // console.log(data)
    // return
    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(
        process.env.REACT_APP_API_URL + "/api/experience/" + data._id,
        data
      )
        .then((res) => {
          setExperienceData(res.data);
          modalShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/experience", data)
        .then((res) => {
          setExperienceData(res.data);
          modalShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  return (
    <>
      <Button bsPrefix="azh_btn" onClick={(e) => modalShow(true)}>
        Add Content
      </Button>
      <Modal
        size="lg"
        show={lgShow}
        onHide={(e) => modalShow(false)}
        aria-labelledby="example-modal-sizes-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
            {updateBtn.display
              ? `Update ${sliceComponentName()} Section Content`
              : `${sliceComponentName()} Section Content`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {updateBtn.display && (
              <Form.Control
                type="text"
                id="_id"
                onChange={handleChange}
                value={experience._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group className="mb-4" controlId="experience.position">
              <Form.Label>Position Name</Form.Label>
              <Form.Control
                type="text"
                name="position"
                onChange={handleChange}
                value={experience.position}
                placeholder="position"
              />
            </Form.Group>
            <Row className="mb-4">
              <Col
                xs={12}
                sm={12}
                lg={6}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Form.Group className="mb-4" controlId="experience.from">
                  <Form.Label>From</Form.Label>
                  <Form.Control
                    type="number"
                    name="from"
                    onChange={handleChange}
                    value={experience.from}
                    placeholder="from"
                  />
                </Form.Group>
              </Col>
              <Col
                xs={12}
                sm={12}
                lg={6}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Form.Group className="mb-4" controlId="experience.to">
                  <Form.Label>To(Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="to"
                    onChange={handleChange}
                    value={experience.to}
                    placeholder="to"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4" controlId="experience.company">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                name="company"
                onChange={handleChange}
                value={experience.company}
                placeholder="company"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="experience.address">
              <Form.Label>Address Name</Form.Label>
              <Form.Control
                type="text"
                name="address"
                onChange={handleChange}
                value={experience.address}
                placeholder="address"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="experience.details">
              <Form.Label>Details</Form.Label>
              <Editor
                initialValue={experience.details}
                name="details"
                init={{
                  height: 200,
                  menubar: true,
                  plugins: [
                    "a11ychecker advcode advlist anchor autolink codesample fullscreen help  tinydrive",
                    " lists link media noneditable powerpaste preview",
                    " searchreplace table template tinymcespellchecker visualblocks wordcount",
                  ],
                  toolbar:
                    "insertfile a11ycheck undo redo | bold italic | forecolor backcolor | template codesample | alignleft aligncenter alignright alignjustify | bullist numlist | link image tinydrive",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                }}
              />
            </Form.Group>
            <button
              className="azh_btn w-100"
              type="submit"
              id="experience.sumbit"
            >
              {updateBtn.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
