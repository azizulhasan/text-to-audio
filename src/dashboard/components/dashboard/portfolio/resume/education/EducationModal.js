import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";

import { Editor } from "@tinymce/tinymce-react";

import { getData, postData, getIframeContent } from "./EducationHooks";
import { sliceComponentName } from "../../../../context/utilities";
/**
 * Css
 */

export default function EducationModal({
  setEducationData,
  updateBtn,
  modalShow,
  lgShow,
}) {
  const [education, setData] = useState({
    _id: "",
    degree: "",
    from: "",
    to: "",
    institution: "",
    address: "",
    details: "",
  });
  useEffect(() => {
    if (lgShow === true) {
      if (updateBtn.id !== "") {
        getEducationContent(updateBtn.id);
      } else {
        setData({
          _id: "",
          degree: "",
          from: "",
          to: "",
          institution: "",
          address: "",
          details: "",
        });
      }
    }
  }, [lgShow]);

  /**
   * get education content by id.
   * @param {id} id
   */
  const getEducationContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/education/" + id)
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
    setData({ ...education, ...{ [e.target.name]: e.target.value } });
  };
  /**
   * Handle education content form submission
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
    // console.log(data);
    // return;
    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(
        process.env.REACT_APP_API_URL + "/api/education/" + data._id,
        data
      )
        .then((res) => {
          setEducationData(res.data);
          modalShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/education", data)
        .then((res) => {
          console.log(res.data);
          setEducationData(res.data);
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
                value={education._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}

            <Form.Group className="mb-4" controlId="education.degree">
              <Form.Label>Degree Name</Form.Label>
              <Form.Control
                type="text"
                name="degree"
                onChange={handleChange}
                value={education.degree}
                placeholder="degree"
              />
            </Form.Group>
            <Row className="mb-4">
              <Col
                xs={12}
                sm={12}
                lg={6}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Form.Group className="mb-4" controlId="education.from">
                  <Form.Label>From</Form.Label>
                  <Form.Control
                    type="number"
                    name="from"
                    onChange={handleChange}
                    value={education.from}
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
                <Form.Group className="mb-4" controlId="education.to">
                  <Form.Label>To(Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="to"
                    onChange={handleChange}
                    value={education.to}
                    placeholder="to"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4" controlId="education.institution">
              <Form.Label>Institution Name</Form.Label>
              <Form.Control
                type="text"
                name="institution"
                onChange={handleChange}
                value={education.institution}
                placeholder="institution"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="education.address">
              <Form.Label>Address Name</Form.Label>
              <Form.Control
                type="text"
                name="address"
                onChange={handleChange}
                value={education.address}
                placeholder="address"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="education.details">
              <Form.Label>Details</Form.Label>
              <Editor
                initialValue={education.details}
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
              id="education.sumbit"
            >
              {updateBtn.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
