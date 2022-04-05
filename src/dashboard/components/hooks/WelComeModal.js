import React from "react";
import Modal from "react-bootstrap/Modal";
export default function WelComeModal({ welcomeModalShow, isWelcomeModalShow }) {
  /**
   * Style
   */
  const welcome = {
    background: {
      width: "100%",
      height: "50vh",
      backgroundImage: `url(${
        process.env.REACT_APP_URL + "/assets/dashboard/assets/img/al_adha.png"
      })`,
      backgroundPosition: "65% 30%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      zIndex: -9,
    },
    closeBtn: {
      marginLeft: "93%",
      marginRight: "0",
      marginTop: "10px",
    },
    message: {
      textAlign: "center",
      zIndex: 9999999,
      color: "white",
      paddingTop: "15%",
    },
  };
  return (
    <Modal
      size="md"
      animation={true}
      show={isWelcomeModalShow}
      onHide={(e) => welcomeModalShow(false)}
      centered
      aria-labelledby="example-modal-sizes-title-lg"
      contentClassName="test"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: [
            "#welcome:after {",
            ' content: "";',
            `background: rgba(0, 0, 0, .5);`,
            "position: absolute;",
            "bottom: 0;",
            "top: 0px;",
            "left: 0;",
            "right: 0;",
            "z-index: -9",
            "}",
          ].join("\n"),
        }}
      ></style>

      <Modal.Body>
        <div id="welcome" style={welcome.background}>
          <button
            type="button"
            className="btn-close"
            onClick={(e) => welcomeModalShow(false)}
            style={welcome.closeBtn}
            aria-label="Close"
          ></button>

          <h1 id="welcome_message" style={welcome.message}>
            Welcomer {process.env.REACT_APP_WEBSITE_NAME} to your personal
            portfolio.
          </h1>
        </div>
      </Modal.Body>
    </Modal>
  );
}
