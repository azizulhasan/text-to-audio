import React from "react";
import { Accordion, Table } from "react-bootstrap";
import toast from "../../context/Notify";
export default function Docs() {
    /**
   * Copy Code
   */
     const copyToClipBoard = (id) => {
      /* Get the text field */
      var copyText = document.getElementById(id);
  
      /* Select the text field */
      // copyText.select();
      // copyText.setSelectionRange(0, 99999); /* For mobile devices */
  
      /* Copy the text inside the text field */
      navigator.clipboard.writeText(copyText.innerText);
  
      /* Alert the copied text */
      toast("Copied to clipboard");
    };
  return (
    <Accordion>
      <Accordion.Item eventKey="0">
        <Accordion.Header>How to change button text?</Accordion.Header>
        <Accordion.Body>Lorem ipsum dolor sit amet,</Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          How to add custom css class to button?
        </Accordion.Header>
        <Accordion.Body>Lorem ipsum dolor sit amet,</Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="2">
        <Accordion.Header>WP Speech Filter Hooks Reference.</Accordion.Header>
        <Accordion.Body>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Filter</th>
                <th>Postion</th>
                <th>Arguments</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
              </tr>
              <tr>
                <td>3</td>
                <td colSpan={2}>Larry the Bird</td>
                <td>@twitter</td>
              </tr>
            </tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="3">
        <Accordion.Header>How to apply filters.</Accordion.Header>
        <Accordion.Body>
        <button className="" onClick={(e)=> copyToClipBoard('filter_hook')}>
                <img
                  src={wp_access.image_url + "/copy.svg"}
                  width="15px"
                  alt="Copy short code to clipboard"
                />
              </button>
          <div>
            <pre>
              <code id="filter_hook" >{`
              add_action( 'woo_invoice_after_order_data', 'woo_invoice_delivery_date', 10, 2 );
              function woo_invoice_delivery_date ($order,$template_type) {
                  if ($template_type == 'invoice') {
                      // get the delivery date from the order
                      $delivery_date = $order->get_meta('delivery_date');
                      // convert date according to WooCommerce/WordPress date format settings)
                      $formatted_delivery_date = date_i18n( wc_date_format(), $delivery_date );
                      ?>
                      <span>Delivery Date: <?php echo $formatted_delivery_date; ?></span>
                <?php
                  }
              }
              `}
              </code>
            </pre>
            </div>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="4">
        <Accordion.Header>WP Speech Action Hooks Reference.</Accordion.Header>
        <Accordion.Body>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Postion</th>
                <th>Arguments</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
              </tr>
              <tr>
                <td>3</td>
                <td colSpan={2}>Larry the Bird</td>
                <td>@twitter</td>
              </tr>
            </tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="5">
        <Accordion.Header>How add action.</Accordion.Header>
        <Accordion.Body>Lorem ipsum dolor sit amet, consectetur</Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
