import React, { useState, useEffect } from "react";
import { Col, Row, Table, Button } from "react-bootstrap";
import toast from "../../context/Notify";
import WelComeModal from "../../hooks/WelComeModal";

/**
 * Hooks
 */
import { getData, STORY_HEADERS, deletePost } from "./MailHooks";

/**
 * Components
 */
import MailModal from "./MailModal";

// Then, use it in a component.
export default function Mail() {
  const [mails, setMails] = useState([]);
  const [updateBtn, setUpdateBtn] = useState({ display: false, id: "" });
  const [lgShow, setLgShow] = useState(false);
  const [isWelcomeModalShow, setIsWelcomeModalShow] = useState(false);

  const setMailData = (data) => {
    setMails([data]);
    setUpdateBtn({ display: true, id: data._id });
  };

  /**
   *
   * @param {value} value true or false.
   * @param {id} id get id if want to edit specific experience.
   */
  const modalShow = (value, id = null) => {
    setLgShow(value);
    if (id !== null) {
      setUpdateBtn({ display: false, id: id });
    } else {
      setUpdateBtn({ display: false, id: "" });
    }
  };

  /**
   *
   * @param {id} id get the specific id which want to be deleted.
   */
  const deleteMail = (id) => {
    alert("Are you sure? It will be permanently deleted.");
    deletePost(process.env.REACT_APP_API_URL + "/api/contact_form/" + id)
      .then((res) => {
        setMails(res.data);
        toast("1 Mail Deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    /**
     * get all emails.
     */
    // getData(process.env.REACT_APP_API_URL + "/api/contact_form").then((res) => {
    //   setMails(res.data);
    //   if (res.data.length > 0) {
    //     setTimeout(
    //       () => setUpdateBtn({ display: true, id: res.data[0]._id }),
    //       100
    //     );
    //   }
    // });

    /**
     * Onload disply welcome message.
     */
    window.addEventListener("load", function () {
      /**
       * get settings data.
       */
      // getData(process.env.REACT_APP_API_URL + "/api/settings").then((res) => {
      //   setIsWelcomeModalShow(res.data[0].welcome_message_is_display);
      //   let welcome_message = this.document.getElementById("welcome_message");
      //   welcome_message.innerHTML = res.data[0].welcome_message
      // });
    });
  }, []);
  /**
   * is welcome modal show?
   * @param {boolean} value
   */
  const welcomeModalShow = (value) => {
    setIsWelcomeModalShow(value);
  };
  return (
    <React.Fragment>
      <WelComeModal
        welcomeModalShow={welcomeModalShow}
        isWelcomeModalShow={isWelcomeModalShow}
      />

      <Row className="mb-4 p-2">
        <Col
          xs={12}
          lg={12}
          className="d-flex flex-col justify-content-start align-items-start"
        >
          <MailModal
            updateBtn={updateBtn}
            modalShow={modalShow}
            lgShow={lgShow}
            setMailData={setMailData}
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
          {mails.length &&
            mails.map((experience, index) => (
              <tr key={index}>
                {Object.keys(experience).map((key) => {
                  if ( key === "date" || key === "name" || key === "email" || key === "subject") {
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
                    onClick={(e) => modalShow(true, mails[index]["_id"])}
                  >
                    Open
                  </Button>
                  <Button
                    bsPrefix="azh_btn btn-danger azh_btn_experience"
                    onClick={(e) => deleteMail(mails[index]["_id"])}
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
