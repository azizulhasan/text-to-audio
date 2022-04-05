import React from 'react';
import { Col, Row, Table } from "react-bootstrap";
import {
  DatatableWrapper,
  Filter,
  Pagination,
  PaginationOpts,
  TableBody,
  TableHeader
} from "react-bs-datatable";
import TABLE_BODY from "./data.json";

/**
 * Components
 */
import ModalBlog from './ModalBlog';

// Create table headers consisting of 4 columns.
const STORY_HEADERS = [
  {
    prop: "name",
    title: "Name",
    isFilterable: true
  },
  {
    prop: "username",
    title: "Username"
  },
  {
    prop: "location",
    title: "Location"
  },
  {
    prop: "date",
    title: "Last Update"
  },
  {
    prop: "score",
    title: "Score",
    isSortable: true
  }
];

// Then, use it in a component.
export default function CreateBlog() {
  return (
    <DatatableWrapper
      body={TABLE_BODY}
      headers={STORY_HEADERS}
      paginationOptionsProps={{
        initialState: {
          rowsPerPage: 10,
          options: [5, 10, 15, 20]
        }
      }}
    >
      <Row className="mb-4 p-2">
        <ModalBlog/>
        <Col
          xs={12}
          lg={2}
          className="d-flex flex-col justify-content-end align-items-start"
        >
        </Col>
        <Col
          xs={12}
          lg={10}
          className="d-flex flex-col justify-content-end align-items-end"
        >
          <Filter bsPrefix="azh_btn" />
        </Col>
        
      </Row>
      <Table>
        <TableHeader tableHeaders={STORY_HEADERS} />
        <TableBody />
      </Table>
      <Row className='className="mb-2 p-2"'>
      <Col
          xs={12}
          sm={6}
          lg={4}
          className="d-flex flex-col justify-content-lg-center align-items-center justify-content-sm-start mb-4 mb-sm-0"
        >
          <PaginationOpts  />
        </Col>
        <Col
          xs={12}
          sm={6}
          lg={4}
          className="d-flex flex-col justify-content-end align-items-end mb-2"
        >
          <Pagination />
        </Col>
      </Row>
    </DatatableWrapper>
  );
}
