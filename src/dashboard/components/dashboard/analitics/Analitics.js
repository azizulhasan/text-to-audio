import React, {useEffect, useState} from "react";
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip} from "react-bootstrap";
import {__} from "@wordpress/i18n";
import UpgradeToPro from "../../UpgradeToPro";
import {postWithoutImage} from "../../context/utilities";
import {MultiSelect} from "../../context/MultiSelect";


export default function Analitics() {
    const [postIds, setPostIds] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)


    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/latest_100_posts', formData).then(
            (res) => {
                console.log(res.data)
                setPostIds(res?.data )
                setIsDataLoaded(true)
            });
    }, []);

    const handleSelectionChange = (selectedIds) => {
        console.log('Selected IDs:', selectedIds);
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        // if (!ttsObj.is_pro_active) {
        //     settings.tta__settings_css_selectors = ''
        // }
        //
        // // return;
        // let formData = new FormData();
        // formData.append('fields', JSON.stringify(settings));
        // formData.append('method', 'post');
        // postWithoutImage(tta_obj.api_url + 'tta/v1/settings', formData)
        //     .then((res) => {
        //         setSettings(res.data);
        //         toast('Succeessfully Saved. Now go to the "Integrations" menu if you\'re a pro user. Otherwise go to the "Customization" menu.', 'info', {
        //             autoClose: 15000
        //         });
        //         setIsDataLoaded(true)
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });
    };

    return (
        isDataLoaded ? <React.Fragment>
            <Container>
                <Row>
                    <Col xs={12} sm={12} lg={8}>
                        <Form onSubmit={handleSubmit}>
                            {/*Exclude tags To Speak*/}
                            <Row className='mt-4'>
                                <Col xs={12} sm={6} lg={4}>
                                    <Form.Label htmlFor='tta__settings_exclude_wp_tags'>
                                        Track Post IDs For Analytics {ttsObj.is_pro_active ? "" : (
                                        <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            {__('Tracking more than 5 post IDs is a pro feature')}
                                                        </Tooltip>
                                                    }>
                                                    <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                                        className="fas fa-lock"/></Button>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    )}
                                    </Form.Label>
                                </Col>
                                <Col xs={11} sm={11} lg={7}>
                                    <MultiSelect toastMessage={'Tracking more than 5 post IDs is a pro feature'}
                                                 name={'atlasVoice_analytics_dashboard'}
                                                 id={'atlasVoice_analytics_dashboard'}
                                                 selectionLimit={5} options={postIds} onChange={handleSelectionChange}/>

                                </Col>
                                <Col xs={1} sm={1} lg={1} className='mt-4'>
                                    <>
                                        {['top'].map((placement) => (
                                            <OverlayTrigger
                                                key={placement}
                                                placement={placement}
                                                overlay={
                                                    <Tooltip id={`tooltip-${placement}`}>
                                                        {__('Click To Know How It Works?')}
                                                    </Tooltip>
                                                }>
                                                <a target='_blank' href='https://atlasaidev.com/docs/text-to-speech/'>
                                                    <i className="fas fa-info-circle"></i></a>
                                            </OverlayTrigger>
                                        ))}
                                    </>
                                </Col>
                            </Row>
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
                        <UpgradeToPro/>
                    </Col>
                </Row>
            </Container>
        </React.Fragment> : <h1>Loading</h1>
    );
};
