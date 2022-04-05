import React, { useEffect, useState } from "react";
import {  Modal,  } from "react-bootstrap";

import { getData } from "./MailHooks";
import { sliceComponentName } from "../../context/utilities";

export default function MailModal({
  setMailData,
  updateBtn,
  modalShow,
  lgShow,
}) {
  const [mail, setData] = useState({
    _id: "",
    name: "",
    email: "",
    subject: "",
    message: "",
    address: {
      continent: "",
      countryName: "",
      locality: "",
      principalSubdivision: "",
      city: "",
    },
    date: ""
  });

  useEffect(() => {
    if (lgShow === true) {
      if (updateBtn.id !== "") {
        getMailContent(updateBtn.id);
      } else {
        setData({
          _id: "",
          name: "",
          email: "",
          subject: "",
          message: "",
          address: {
            continent: "",
            countryName: "",
            locality: "",
            principalSubdivision: "",
            city: "",
          },
          date: ""
        });
      }
    }
  }, [lgShow]);

  /**
   * get mail content by id.
   * @param {id} id
   */
  const getMailContent = (id) => {
    getData(process.env.REACT_APP_API_URL + "/api/contact_form/" + id)
      .then((res) => {
        console.log(res);
        setData(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <>
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
          <h4>Sender : {mail.name} </h4>
          {mail.address !== undefined ? (
            <h4>
              From :
              {mail.address.locality +
                ", " +
                mail.address.city +
                ", " +
                mail.address.countryName}
            </h4>
          ) : (
            ""
          )}
          <h4>Date : {mail.date}</h4>
          <h4>Email : {mail.email}</h4>
          <h4>Subject : {mail.subject}</h4>
          <div>
            <h4>Message : </h4>
            <p>{mail.message}</p>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
