import React, { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { deleteContact, addContact, getData, postData } from "./ContactHooks";
import { sliceComponentName } from "../../../context/utilities";

/**
 * Css
 */
import "./contact.css";

export default function ContactModal({ setContactData, updateBton }) {
  const [lgShow, setLgShow] = useState(false);
  const [contact, setData] = useState({
    _id: "",
    section_title: "",
    subjects: "",
    contacts: [],
    contact_type: "",
    contact_type_value: "",
  });
  /**
   * Handle content change value.
   * @param {event} e
   */
  const handleChange = (e) => {
    setData({ ...contact, ...{ [e.target.name]: e.target.value } });
  };
  /**
   * Handle contact content form submission
   * @param {event} e
   * @returns
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
    let form = new FormData(e.target);
    let contactMap = {};
    let data = {};
    data["contacts"] = [];
    for (let [key, value] of form.entries()) {
      if(key !== 'section_title'){
        if (key === "" || value === "") {
          alert("Please fill the value of : " + key);
          return;
        }
      }

      if (key === "contact_type") {
        contactMap["contact"] = [value];
      } else if (key === "contact_type_value") {
        contactMap['contact'].push(value);
        data["contacts"].push(contactMap['contact']);
      } else {
        data[key] = value;
      }
    }

    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(process.env.REACT_APP_API_URL + "/api/contact/" + data._id, data)
        .then((res) => {
          setContactData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/contact", data)
        .then((res) => {
          setContactData(res);
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
  const getContactContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/contact/" + id).then((res) => {
      setData(res);
      setLgShow(true);
    });
  };
  return (
    <>
      {updateBton.display ? (
        <Button
          bsPrefix="azh_btn"
          onClick={(e) => getContactContent(updateBton.id)}
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
                value={contact._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group className="mb-4" controlId="contact.section_title">
              <Form.Label>Section Title (Optional )</Form.Label>
              <Form.Control
                type="text"
                name="section_title"
                onChange={handleChange}
                value={contact.section_title}
                placeholder="Contact"
              />
            </Form.Group>

            <Row id="contact.contact_row" className="mb-4">
              <Col
                xs={8}
                sm={9}
                lg={10}
                className="justify-content-start align-items-start mb-2"
              >
                <Form.Group className="mb-4" controlId="contact.subjects">
                  <Form.Label>Contact Subjects</Form.Label>
                  <Form.Control
                    as="textarea"
                    row={2}
                    name="subjects"
                    onChange={handleChange}
                    value={contact.subjects}
                    placeholder="Type here contact subjects"
                  />
                </Form.Group>
              </Col>
              <Col
                xs={4}
                sm={3}
                lg={2}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Form.Group className="mb-4" controlId="contact.subjects">
                  <Form.Label style={{ visibility: "hidden" }}>
                    Tipes
                  </Form.Label>
                  {["top"].map((placement) => (
                    <OverlayTrigger
                      key={placement}
                      placement={placement}
                      overlay={
                        <Tooltip id={`tooltip-${placement}`}>
                          Seperate each contact type with "|".
                        </Tooltip>
                      }
                    >
                      <Button variant="info">Must Read</Button>
                    </OverlayTrigger>
                  ))}
                </Form.Group>
              </Col>
            </Row>

            <Row id="contact.contact_row" className="mb-4">
              <Col
                xs={6}
                sm={6}
                lg={6}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Button
                  bsPrefix="azh_btn"
                  onClick={addContact}
                  id="contact.add_contact"
                >
                  Add Contact
                </Button>
              </Col>
              <Col
                xs={6}
                sm={6}
                lg={6}
                className="d-flex flex-col justify-content-end align-items-start mb-2"
              >
                {["top"].map((placement) => (
                  <OverlayTrigger
                    key={placement}
                    placement={placement}
                    overlay={
                      <Tooltip id={`tooltip-${placement}`}>
                        Contact type like Address/Phone/Email
                      </Tooltip>
                    }
                  >
                    <Button variant="info">Must Read</Button>
                  </OverlayTrigger>
                ))}
              </Col>
              <Col id="contact_col">
                {contact.contacts.length > 0 ? (
                  contact.contacts.map((contact, i) => {
                    return (
                      <Row key={i}>
                        <Col
                          xs={12}
                          sm={6}
                          lg={5}
                          className="d-flex flex-col justify-content-start align-items-start mb-2"
                        >
                          <Form.Group
                            className="mb-3"
                            controlId="contact.contact_type"
                          >
                            <Form.Label>Contact Type</Form.Label>
                            <Form.Control
                              type="text"
                              name="contact_type"
                              value={contact[0]}
                              onChange={handleChange}
                              placeholder="Contact Type"
                            />
                          </Form.Group>
                        </Col>
                        <Col
                          xs={12}
                          sm={6}
                          lg={5}
                          className="d-flex flex-col  mb-2"
                        >
                          <Form.Group className="mb-3" controlId="contact.contact_type_value">
                            <Form.Label>Contact Type Value</Form.Label>
                            <Form.Control
                              type="text"
                              name="contact_type_value"
                              value={contact[1]
                                  
                              }
                              onChange={handleChange}
                              placeholder="value"
                            />
                          </Form.Group>
                          <button
                            type="button"
                            className="azh_btn btn-danger azh_btn_delete deleteSocialIcon"
                            onClick={deleteContact}
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
                      className=" justify-content-start align-items-start mb-2"
                    >
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Type </Form.Label>
                        <Form.Control
                          type="text"
                          name="contact_type"
                          value={contact.contact_type}
                          onChange={handleChange}
                          placeholder="contact type"
                        />
                      </Form.Group>
                    </Col>
                    <Col
                      xs={12}
                      sm={6}
                      lg={7}
                      className="d-flex flex-col justify-content-start align-items-start mb-2"
                    >
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Type Value</Form.Label>
                        <Form.Control
                          type="text"
                          name="contact_type_value"
                          value={contact.contact_type_value}
                          onChange={handleChange}
                          placeholder="value"
                        />
                      </Form.Group>
                      <button
                        type="button"
                        className="azh_btn btn-danger azh_btn_delete deleteSocialIcon"
                        onClick={deleteContact}
                      >
                        Delete
                      </button>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>

            <button className="azh_btn w-100" type="submit" id="contact.sumbit">
              {updateBton.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
