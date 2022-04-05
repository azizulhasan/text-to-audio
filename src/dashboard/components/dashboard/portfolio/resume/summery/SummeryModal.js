import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { getData, postData, getIframeContent } from "./SummeryHooks";
import { sliceComponentName } from "../../../../context/utilities";

import { Editor } from "@tinymce/tinymce-react";
/**
 * Css
 */
import "./summery.css";

export default function SummeryModal({ setSummeryData, updateBton }) {
  const [lgShow, setLgShow] = useState(false);
  const [summery, setData] = useState({
    _id: "",
    section_title: "",
    top_details: "",
    summery_title: "",
    education_title: "",
    experience_title: "",
    name: "",
    summery: "",
  });

  /**
   * Handle content change value.
   * @param {event} e
   */
  const handleChange = (e) => {
    setData({ ...summery, ...{ [e.target.name]: e.target.value } });
  };
  /**
   * Handle summery content form submission
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
      if (key === "name" && value === '') {
        alert("Please fill the value of : " + key);
        return;
      }
      data[key] = value;
    }
    data["summery"] = getIframeContent();
    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(process.env.REACT_APP_API_URL + "/api/summery/" + data._id, data)
        .then((res) => {
          setSummeryData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/summery", data)
        .then((res) => {
          setSummeryData(res);
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
  const getSummeryContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/summery/" + id).then(
      (res) => {
        setData(res);
        setLgShow(true);
      }
    );
  };
  return (
    <>
      {updateBton.display ? (
        <Button
          bsPrefix="azh_btn"
          onClick={(e) => getSummeryContent(updateBton.id)}
        >
          Update Content
        </Button>
      ) : (
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
          <Form onSubmit={handleSubmit}>
            {updateBton.display && (
              <Form.Control
                type="text"
                id="_id"
                onChange={handleChange}
                value={summery._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group className="mb-4" controlId="summery.section_title">
              <Form.Label>Section Title (Optional )</Form.Label>
              <Form.Control
                type="text"
                name="section_title"
                onChange={handleChange}
                value={summery.section_title}
                placeholder="Resume"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="summery.top_details">
              <Form.Label>Section Details (Optional )</Form.Label>
              <Form.Control
                as="textarea"
                row={2}
                name="top_details"
                onChange={handleChange}
                value={summery.top_details}
                placeholder="Type here resume top_details"
              />
            </Form.Group>
            <br />
            <Form.Group className="mb-4" controlId="summery.summery_title">
              <Form.Label>Summery Title (Optional )</Form.Label>
              <Form.Control
                type="text"
                name="summery_title"
                onChange={handleChange}
                value={summery.summery_title}
                placeholder="Type here summery_title"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="summery.education_title">
              <Form.Label>Education Title (Optional )</Form.Label>
              <Form.Control
                type="text"
                name="education_title"
                onChange={handleChange}
                value={summery.education_title}
                placeholder="education_title"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="summery.experience_title">
              <Form.Label>Experience Title (Optional )</Form.Label>
              <Form.Control
                type="text"
                name="experience_title"
                onChange={handleChange}
                value={summery.experience_title}
                placeholder="experience_title"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="summery.name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                onChange={handleChange}
                value={summery.name}
                placeholder="name"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="summery.summery">
              <Form.Label>Summery</Form.Label>
              <Editor
                initialValue={summery.summery}
                name="summery"
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
            <button className="azh_btn w-100" type="submit" id="summery.sumbit">
              {updateBton.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
