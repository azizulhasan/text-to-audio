import React from "react";
import { Accordion, Table } from "react-bootstrap";

export default function Docs() {
  const copyToClipBoard = () => {}
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
          <div onClick={copyToClipBoard} id="filter_hook">
            <pre>
              <code>
              https://stackoverflow.com/questions/3207758/how-to-show-code-snippet-in-blogs
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
