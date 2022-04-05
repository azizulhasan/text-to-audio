import React, { useState, useEffect } from "react";
import { Col, Row, Table, Button } from "react-bootstrap";
/**
 * Hooks
 */
import { getData, deletePost, STORY_HEADERS } from "./ExperienceHooks";

/**
 * Components
 */
import ExperienceModal from "./ExperienceModal";
import "./experience.css";


export default function Experience() {
  const [experiences, setExperience] = useState([]);
  const [updateBtn, setUpdateBtn] = useState({ display: false, id: "" });
  const [lgShow, setLgShow] = useState(false);
  /**
   * This method is called when experience data is posted or updated by modal.
   * @param {data} data
   */
  const setExperienceData = (data) => {
    setExperience(data);
  };
  /**
   *
   * @param {value} value true or false.
   * @param {id} id get id if want to edit specific experience.
   */
  const modalShow = (value, id = null) => {
    setLgShow(value);
    if (id !== null) {
      setUpdateBtn({ display: true, id: id });
    } else {
      setUpdateBtn({ display: false, id: "" });
    }
  };
  /**
   *
   * @param {id} id get the specific id which want to be deleted.
   */
  const deleteExperience = (id) => {
    alert("Are you sure? It will be permanently deleted.");
    deletePost(process.env.REACT_APP_API_URL + "/api/experience/" + id)
      .then((res) => {
        setExperience(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    /**
     * Get data from and display to table.
     */
    // getData(process.env.REACT_APP_API_URL + "/api/experience").then((res) => {
    //   setExperience(res.data);
    // });
  }, []);

  return (
    <React.Fragment>
      <Row className="mb-4 p-2">
        <Col
          xs={12}
          lg={12}
          className="d-flex flex-col justify-content-start align-items-start"
        >
          <ExperienceModal
            updateBtn={updateBtn}
            modalShow={modalShow}
            lgShow={lgShow}
            setExperienceData={setExperienceData}
          />
        </Col>
      </Row>
      <Table bordered>
        <thead>
          <tr>
            {STORY_HEADERS.map((hearder) => (
              <th key={hearder.prop}>{hearder.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {experiences.length &&
            experiences.map((experience, index) => (
              <tr key={index}>
                {Object.keys(experience).map((key) => {
                  if (
                    key === "address" ||
                    key === "position" ||
                    key === "company"
                  ) {
                    return (
                      <td
                        key={key}
                        dangerouslySetInnerHTML={{ __html: experience[key] }}
                      ></td>
                    );
                  }
                })}
                <td>
                  <Button
                    className="mr-2"
                    bsPrefix="azh_btn azh_btn_edit"
                    onClick={(e) => modalShow(true, experiences[index]["_id"])}
                  >
                    Edit
                  </Button>
                  <Button
                    bsPrefix="azh_btn btn-danger azh_btn_experience"
                    onClick={(e) => deleteExperience(experiences[index]["_id"])}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
    </React.Fragment>
  );
}
