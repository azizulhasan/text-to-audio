import React, { useEffect, useState, useMemo } from 'react';
import { Form, Row, Col, Container } from 'react-bootstrap';
import { postData } from '../../context/utilities';
import toast from '../../context/Notify';

export default function GoogleTTS() {

    const [googTTSJsonFile, setGoogTTSJsonFile] = useState('');
    const [authFile, setAuthFile] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const apiURL = useMemo(() => {
        return ttsObjPro.api_url + ttsObjPro.api_namespace + "/" + ttsObjPro.api_version + "/";
    })

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        setGoogTTSJsonFile(e.target.files);
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!ttsObjPro.is_pro_license_active) {
            toast('Please Activate the Text To Speech Pro license to enjoy full features of the plugin.');
            return;
        }
        if (!googTTSJsonFile) {
            toast('Please select file')
            return
        };
        let data = new FormData();
        data.append('auth_file', googTTSJsonFile[0]);
        data.append('method', 'post');

        postData(apiURL + 'upload_file', data)
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



    useEffect(() => {
        postData(apiURL + 'get_auth_file', {}, 'GET')
            .then((res) => {
                setAuthFile(res.file)
                setIsAuthenticated(res.is_authenticated)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [])
    const authenticateTTS = (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            toast('You are already athenticated');
            return;
        }
        postData(apiURL + 'authenticate', JSON.stringify({ file: authFile }))
            .then((res) => {
                if (res.auth_url) {
                    window.open(res.auth_url);
                } else if (res.access_token) {
                    toast('You are already athenticated');
                    setIsAuthenticated(true)
                }
                else {
                    toast('Something went wrong');
                }

            })
            .catch((err) => {
                console.log(err);
            });
    }


    const revokeAccessToken = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast('You have to be athenticated to revoke.');
            return;
        }
        postData(apiURL + 'revoke_access_token', '', 'GET')
            .then((res) => {
                if (res) {
                    toast('Authentication removed.')
                    setIsAuthenticated(false)
                } else {
                    toast('Something went wrong');
                }

            })
            .catch((err) => {
                console.log(err);
            });
    }

    return (
        <Container>
            <Form onSubmit={handleSubmit}>
                <Row className='border '>
                    <Col xs={12} sm={12} lg={12} className=''>
                        <Form.Group>
                            <Form.Label htmlFor='googTTSJsonFile'>
                                Select Google Authentication Json file
                            </Form.Label>
                            <Form.Control
                                type='file'
                                id='googTTSJsonFile'
                                onChange={handleChange}
                                name='googTTSJsonFile'
                                placeholder='googTTSJsonFile'
                            />
                            <Form.Label className={isAuthenticated ? 'text-green' : 'text-danger'} htmlFor='notice'>
                                {
                                    ttsObjPro.is_pro_license_active ?
                                        isAuthenticated ? <><strong>Google Text To Speech Authentication Done. Enjoy the whole featuers of the plugin.</strong></> : authFile ? <><strong>Please click the authenticate button to authenticate Google Text To Speech</strong></> : <><strong>Please upload .json file to authenticate Google Text To Speech.</strong></>
                                        : <><strong>Notice:</strong> <p className='text-danger d-inline'>License must be active and valid to enjoy pro features of the plugin.</p>

                                            {
                                                isAuthenticated && <>
                                                    <br />
                                                    <strong>Google Text To Speech Authentication Done</strong>
                                                </>
                                            }
                                        </>
                                }
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
            {
                authFile && <button disabled={!authFile ? true : false} onClick={(e) => authenticateTTS(e)} className={['tta_btn btn-center', ""].join(' ')}  >
                    Authenticate
                </button>
            }
            {
                ttsObjPro.is_pro_license_active && isAuthenticated && <button onClick={(e) => revokeAccessToken(e)} className='tta_btn btn-center' style={{ marginLeft: '20px' }}>
                    Romove Authentication
                </button>
            }
        </Container>
    );
}
