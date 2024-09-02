import React, {useEffect, useState} from "react";
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip} from "react-bootstrap";
import UpgradeToPro from "../../UpgradeToPro";
import toast from '../../context/Notify';
import {postWithoutImage} from "../../context/utilities";
import {__} from "@wordpress/i18n";


export default function Aliases() {
    const [ttsTextAliases, setTtsTextAliases] = useState([
        {actual_text: '', to_read: ''}
    ]);
    const [isDataLoaded, setIsDataLoaded] = useState(false)

    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/text_alias', formData).then((res) => {
            console.log(res.data)
            if(res?.data && res?.data?.length) {
                setTtsTextAliases(res.data)
            }
            setIsDataLoaded(true)

        });
    }, []);

    const handleAddRow = () => {
        console.log(ttsTextAliases.length)
        if(!ttsObj.is_pro_active && ttsTextAliases.length >= 1 ) {
            toast(<h6>More than 1 alias is available in the pro version. Please <a target='_blank'
                                                          href='https://atlasaidev.com/plugins/text-to-speech-pro/'>Buy Pro
                version</a></h6>, 'info', {autoClose: 10000})
            return;
        }
        setTtsTextAliases([...ttsTextAliases, {actual_text: '', to_read: ''}]);
    };

    const handleDeleteRow = (index) => {
        const newAliases = ttsTextAliases.filter((_, idx) => idx !== index);
        setTtsTextAliases(newAliases);
    };

    const handleInputChange = (index, field, value) => {
        const newAliases = [...ttsTextAliases];
        newAliases[index][field] = value;
        setTtsTextAliases(newAliases);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        for (const alias of ttsTextAliases) {
            if (alias.actual_text === '' || alias.to_read === '') {
                toast('All fields must be filled!', 'error');
                return;
            }
        }
        console.log('Submitted data:', ttsTextAliases);
        // return;
        let formData = new FormData();
        formData.append('aliases', JSON.stringify(ttsTextAliases));
        formData.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/text_alias', formData)
            .then((res) => {
                if (res?.data) {
                    console.log(res.data)
                    setTtsTextAliases(res.data)
                }
                toast('Successfully Saved.', 'info', {
                    autoClose: 2500
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (isDataLoaded ? <React.Fragment>
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    <h2>Text to Speech Aliases
                        <>
                            {['top'].map((placement) => (<OverlayTrigger
                                key={placement}
                                placement={placement}
                                overlay={<Tooltip id={`tooltip-${placement}`}>
                                    {__('Click To Know How It Works?')}
                                </Tooltip>}>
                                <a target='_blank' href='https://www.youtube.com/watch?v=oeW652YKmG0&t=9s'>
                                    <i className="fas fa-info-circle"></i></a>
                            </OverlayTrigger>))}
                        </>
                    </h2>
                    <Form onSubmit={handleSubmit}>
                        {/* Add Button or Player Automatically */}
                        {ttsTextAliases.map((alias, index) => (
                            <Row key={index} className="mb-3">
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="Actual Text"
                                        value={alias.actual_text}
                                        onChange={(e) => handleInputChange(index, 'actual_text', e.target.value)}
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="To Read"
                                        value={alias.to_read}
                                        onChange={(e) => handleInputChange(index, 'to_read', e.target.value)}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button variant="danger" onClick={() => handleDeleteRow(index)}><span
                                        className="dashicons dashicons-trash"></span></Button>
                                </Col>
                            </Row>
                        ))}
                        <Button variant="primary" type="button" onClick={handleAddRow}>
                            Add New Row
                        </Button>
                        {/*Display Button Icon*/}
                        <Row className='mt-3'>
                            <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn  btn-block'>
                                    Save
                                </button>
                            </div>
                        </Row>
                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro promotionType={'analytics'}/>
                </Col>
            </Row>
        </Container>
    </React.Fragment> : <h1>Loading</h1>);
};
