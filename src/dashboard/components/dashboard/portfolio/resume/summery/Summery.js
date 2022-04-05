import React, { useState, useEffect } from "react";
import { Col, Row, Table } from "react-bootstrap";
import {
  DatatableWrapper,
  Filter,
  Pagination,
  PaginationOpts,
  TableBody,
  TableHeader,
} from "react-bs-datatable";
/**
 * Hooks
 */
import { getData , STORY_HEADERS} from "./SummeryHooks";

/**
 * Components
 */
import SummeryModal from "./SummeryModal";

// Then, use it in a component.
export default function Summery() {
  const [summery, setSummery] = useState([]);
  const [updateBton, setUpdateBtn] = useState({ display: false, id: "" });

  const setSummeryData = (data) => {
    setSummery([data]);
    setUpdateBtn({ display: true, id: data._id });
  };
  useEffect(() => {
      /**
       * Get data from and display to table.
       */
      // getData(process.env.REACT_APP_API_URL + "/api/summery").then(res=>{
      //   setSummery(res.data);
      //   if (res.data.length > 0) {
      //     setTimeout(()=> setUpdateBtn({ display: true, id: res.data[0]._id }), 100)
      //   }
      // })
  }, []);

  return (
    <DatatableWrapper
      body={summery}
      headers={STORY_HEADERS}
      paginationOptionsProps={{
        initialState: {
          rowsPerPage: 10,
          options: [5, 10, 15, 20],
        },
      }}
    >
      <Row className="mb-4 p-2">
        <Col
          xs={12}
          lg={2}
          className="d-flex flex-col justify-content-end align-items-start"
        >
          <SummeryModal updateBton={updateBton} setSummeryData={setSummeryData} />
        </Col>
        <Col
          xs={12}
          lg={10}
          className="d-flex flex-col justify-content-end align-items-end"
        >
          <Filter />
        </Col>
      </Row>
      <Table>
        <TableHeader tableHeaders={STORY_HEADERS} />
        <TableBody />
      </Table>
      <Row className="mb-2 p-2">
        <Col
          xs={12}
          sm={6}
          lg={4}
          className="d-flex flex-col justify-content-lg-center align-items-center justify-content-sm-start mb-2 mb-sm-0"
        >
          <PaginationOpts />
        </Col>
        <Col
          xs={12}
          sm={6}
          lg={8}
          className="d-flex flex-col justify-content-end align-items-end mb-2"
        >
          <Pagination />
        </Col>
      </Row>
    </DatatableWrapper>
  );
}
