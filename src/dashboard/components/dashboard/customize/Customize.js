import React, { useState, useEffect } from "react";
import { Col, Container, Row, Form } from "react-bootstrap";

export default function Customize() {

  const [listeningBtnStyle, setListeningStyle] = useState({
    backgroundColor: "rgb(226, 222, 232)",
    color: "rgb(0, 0, 0)",
    width: "100"
  })
  const [listeningBtnStyle2, setListeningStyle2] = useState({
    backgroundColor: "rgb(226, 222, 232)",
    color: "rgb(0, 0, 0)",
    width: "100%"
  })

  useEffect(()=>{
    console.log(listeningBtnStyle2)

  }, [])
    /**
   * handle change
   * @param {*} e
   */
     const handleChange = (e) => {
      
      setListeningStyle({
        ...listeningBtnStyle,
        ...{ [e.target.name]: e.target.value },
      });
      let value = ''
      if(e.target.name === 'width'){
        let arr = [e.target.value , '%']
        value  = arr.join('')
      }else{
        value  = e.target.value
      }
      setListeningStyle2({
        ...listeningBtnStyle2,
        ...{ [e.target.name]: value },
      });
    };

    /**
     * Copy short Code
     */
    const CopyShortcode = () => {
       /* Get the text field */
  var copyText = document.getElementById("wps_play_btn_shortcode");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText.value);
  
  /* Alert the copied text */
  alert("Copied the text: " + copyText.value);
  }
  return (
    <Container>
      <Row className="mt-5">
        <Col xs={12} sm={12} lg={8}>
          <button
            id="wps__listent_content"
            className=""
            style={listeningBtnStyle2}
            type="button"
            title="WP Speech:  Tap to listen post."
          >
            <span className="dashicons dashicons-controls-play"></span> Listen
          </button>

          <Form.Label htmlFor="color">
              Button Width (%)
            </Form.Label>
            <Form.Control
              type="text"
              name="wps_play_btn_shortcode"
              onChange={handleChange}
              id="wps_play_btn_shortcode"
              defaultValue={'[wps_play_btn]'}
              title="Button Width"
            />
            <button onClick={CopyShortcode}>Copy ShortCode</button>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <>
            <h4>Customize Listening Button</h4>

            <Form.Label htmlFor="backgroundColor">
              BackGround Color
            </Form.Label>
            <Form.Control
              type="color"
              name="backgroundColor"
              onChange={handleChange}
              id="backgroundColor"
              defaultValue="#563d7c"
              title="Choose your color"
            />
            <Form.Label htmlFor="color">
              Text Color
            </Form.Label>
            <Form.Control
              type="color"
              name="color"
              onChange={handleChange}
              id="color"
              defaultValue="#563d7c"
              title="Choose your color"
            />
            <Form.Label htmlFor="color">
              Button Width (%)
            </Form.Label>
            <Form.Control
              type="number"
              name="width"
              onChange={handleChange}
              id="width"
              defaultValue={listeningBtnStyle.width}
              title="Button Width"
            />
          </>
        </Col>
      </Row>
    </Container>
  );
}
