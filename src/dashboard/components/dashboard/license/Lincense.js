import React, { useState } from 'react';
import { Form, Row, Col, Container } from 'react-bootstrap';

export default function License() {

    const [license, setLicense] = useState();

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        setLicense(e.target.value);
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/record', data)
            .then((res) => {
                setSettings(res.data);
                setChecked(res.data.is_record_continously);
                toast('Recording Data Saved');
            })
            .catch((err) => {
                console.log(err);
            });
    };
    return (
        <Container>
            <Form onSubmit={handleSubmit}>
                <Row className='border '>
                    <Col xs={12} sm={12} lg={12} className=''>
                        <Form.Group>
                            <Form.Label htmlFor='license'>
                                Insert License
                            </Form.Label>
                            <Form.Control
                                type='text'
                                id='license'
                                onChange={handleChange}
                                value={license}
                                name='license'
                                placeholder='license'
                            />
                        </Form.Group>
                    </Col>
                    <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                        <button type='submit' className='tta_btn btn-center'>
                            Submit
                        </button>
                    </div>
                </Row>
            </Form>
        </Container>
    );
}
