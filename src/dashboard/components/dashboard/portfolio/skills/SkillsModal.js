import React, { useState } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";
import { deleteSkill, addSkill, getData, postData } from "./SkillsHooks";
import { sliceComponentName } from "../../../context/utilities";

/**
 * Css
 */
import "./skills.css";

export default function AboutModal({ setSkillsData, updateBton }) {
  const [lgShow, setLgShow] = useState(false);
  const [skills, setData] = useState({
    _id: "",
    section_title: "",
    top_details: "",
    skills: [],
    skill_name: "",
    skill_proficiency: "",
  });
  /**
   * Handle content change value.
   * @param {event} e
   */
  const handleChange = (e) => {
    setData({ ...skills, ...{ [e.target.name]: e.target.value } });
  };

  /**
   * Handle skills content form submission
   * @param {event} e
   * @returns
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Get full form data and modify them for saving to database.
     */
    let form = new FormData(e.target);
    let skillMap = {};
    let data = {};
    data["skills"] = [];
    for (let [key, value] of form.entries()) {
      if (key !== "section_title" && key !== "top_details") {
        if (key === "" || value === "") {
          alert("Please fill the value of : " + key);
          return;
        }
      }

      if (key === "skill_name") {
        skillMap["skills"] = [value];
      } else if (key === "skill_proficiency") {
        skillMap["skills"].push(value);
        data["skills"].push(skillMap["skills"]);
      } else {
        data[key] = value;
      }
    }

    // console.log(JSON.stringify(data))
    // return;

    /**
     * Update data if "_id" exists. else save form data.
     */
    if (data._id !== undefined) {
      postData(process.env.REACT_APP_API_URL + "/api/skills/" + data._id, data)
        .then((res) => {
          setSkillsData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      postData(process.env.REACT_APP_API_URL + "/api/skills", data)
        .then((res) => {
          setSkillsData(res);
          setLgShow(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  /**
   * get skill.content by id.
   * @param {id} id
   */
  const getSkillsContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/skills/" + id).then((res) => {
      setData(res);
      setLgShow(true);
    });
  };
  return (
    <>
      {updateBton.display ? (
        <Button
          bsPrefix="azh_btn"
          onClick={(e) => getSkillsContent(updateBton.id)}
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
                value={skills._id}
                name="_id"
                placeholder="id"
                hidden
              />
            )}
            <Form.Group className="mb-4" controlId="skills.section_title">
              <Form.Label>Section Title</Form.Label>
              <Form.Control
                type="text"
                name="section_title"
                onChange={handleChange}
                value={skills.section_title}
                placeholder="About"
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="skills.top_details">
              <Form.Label>Skills Top Details</Form.Label>
              <Form.Control
                as="textarea"
                row={2}
                name="top_details"
                onChange={handleChange}
                value={skills.top_details}
                placeholder="Type here skills top_details"
              />
            </Form.Group>
            <Row id="skills.skill_row" className="mb-4">
              <Col
                xs={12}
                sm={12}
                lg={12}
                className="d-flex flex-col justify-content-start align-items-start mb-2"
              >
                <Button
                  bsPrefix="azh_btn"
                  onClick={addSkill}
                  id="skills.add_skill"
                >
                  Add Skill
                </Button>
              </Col>
              <Col id="skill_col">
                {skills.skills.length > 0 ? (
                  skills.skills.map((skill, i) => {
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
                            controlId="skill.skill_name"
                          >
                            <Form.Label>Skill Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="skill_name"
                              value={skill[0]}
                              onChange={handleChange}
                              placeholder="Skill Name"
                            />
                          </Form.Group>
                        </Col>
                        <Col
                          xs={12}
                          sm={6}
                          lg={5}
                          className="d-flex flex-col  mb-2"
                        >
                          <Form.Group
                            className="mb-3"
                            controlId="skill.skill_proficiency"
                          >
                            <Form.Label>Skill Proficiency (%)</Form.Label>
                            <Form.Control
                              type="number"
                              name="skill_proficiency"
                              value={skill[1]}
                              onChange={handleChange}
                              placeholder="proficiency (%)"
                            />
                          </Form.Group>
                          <button
                            type="button"
                            className="azh_btn btn-danger azh_btn_delete deleteSocialIcon"
                            onClick={deleteSkill}
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
                      <Form.Group className="mb-3">
                        <Form.Label>Skill Name </Form.Label>
                        <Form.Control
                          type="text"
                          name="skill_name"
                          value={skills.skill_name}
                          onChange={handleChange}
                          placeholder="proficiency name"
                        />
                      </Form.Group>
                    </Col>
                    <Col
                      xs={12}
                      sm={6}
                      lg={7}
                      className="d-flex flex-col  mb-2"
                      controlId="skill.skill_proficiency"
                    >
                      <Form.Group className="mb-3">
                        <Form.Label>Skill Proficiency (%) </Form.Label>
                        <Form.Control
                          type="text"
                          name="skill_proficiency"
                          value={skills.skill_proficiency}
                          onChange={handleChange}
                          placeholder="proficiency (%)"
                        />
                      </Form.Group>
                      <button
                        type="button"
                        className="azh_btn btn-danger azh_btn_delete deleteSocialIcon"
                        onClick={deleteSkill}
                      >
                        Delete
                      </button>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>

            <button className="azh_btn w-100" type="submit" id="skills.sumbit">
              {updateBton.display ? "Update" : "Submit"}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
