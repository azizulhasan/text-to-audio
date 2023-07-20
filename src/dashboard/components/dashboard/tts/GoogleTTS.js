import React, { useState } from 'react';
import { Form, Row, Col, Container } from 'react-bootstrap';
import { postData } from '../../context/utilities';
import toast from '../../context/Notify';

export default function GoogleTTS() {

    const [license, setLicense] = useState();

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        setLicense(e.target.files);
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        let data = new FormData();
        data.append('auth_file', license[0]);
        data.append('method', 'post');

        postData(tta_obj.api_url + 'tta/v1/upload_file', data)
            .then((res) => {
                if (res.status) {
                    toast('File uploaded successfully');
                } else {
                    toast('Something went wrong');
                }

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
                                type='file'
                                id='license'
                                onChange={handleChange}
                                name='license'
                                placeholder='license'
                            />
                            <Form.Label className='text-danger' htmlFor='notice'>
                                <strong>Notice:</strong> License must be active and valid to enjoy pro features of the plugin.
                            </Form.Label>
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
