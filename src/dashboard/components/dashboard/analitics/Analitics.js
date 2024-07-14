import React, {useEffect, useState} from "react";
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip} from "react-bootstrap";
import {__} from "@wordpress/i18n";
import UpgradeToPro from "../../UpgradeToPro";
import {postWithoutImage} from "../../context/utilities";
import {MultiSelect} from "../../context/MultiSelect";
import toast from '../../context/Notify';


export default function Analitics() {
    const [analytics, setAnalytics] = useState({
        'tts_enable_analytics': true,
        'tts_trackable_post_ids': [],
    })
    const [postIds, setPostIds] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)

    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/latest_posts', formData).then((res) => {
            setPostIds(res.data)
        });
    }, []);

    useEffect(() => {
        console.log(postIds)
        if (Object.keys(postIds).length) {
            let formData = new FormData();
            formData.append('method', 'get');
            postWithoutImage(tta_obj.api_url + 'tta/v1/get_analytics_settings', formData)
                .then((res) => {
                    setAnalytics({
                        ...analytics,
                        ...res.data
                    })
                    setSelectedIds(res.data.tts_trackable_post_ids)
                    setIsDataLoaded(true)
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [postIds])

    const handleSelectionChange = (selectedIds) => {
        setSelectedIds(selectedIds)
    };

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        let value = ''
        if (e.target.getAttribute('type') === 'checkbox') {
            value = e.target.checked
        }

        if (!e.target.name) return;

        setAnalytics({
            ...analytics,
            ...{[e.target.name]: value},
        });
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        analytics.tts_trackable_post_ids = selectedIds
        let formData = new FormData();
        formData.append('analytics', JSON.stringify(analytics));
        formData.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/save_analytics_settings', formData)
            .then((res) => {
                if (res?.data) {
                    console.log(res.data)
                    setAnalytics({
                        ...analytics,
                        ...res.data
                    })
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
                    <Form onSubmit={handleSubmit}>
                        {/* Add Button or Player Automatically */}
                        <Row className=' mt-3'>
                            <Col xs={12} sm={6} lg={4}>
                                <Form.Label htmlFor='tts_enable_analytics'>
                                    {__('Enable Analytics')}
                                </Form.Label>
                            </Col>
                            <Col xs={12} sm={12} lg={8}>
                                <Form.Check // prettier-ignore
                                    type={'checkbox'}
                                    checked={analytics.tts_enable_analytics}
                                    onChange={(e) =>
                                        handleChange(e)
                                    }
                                    name={`tts_enable_analytics`}
                                    id={`tts_enable_analytics`}
                                />
                            </Col>
                        </Row>
                        {/*Exclude tags To Speak*/}
                        <Row className='mt-4'>
                            <Col xs={12} sm={6} lg={4}>
                                <Form.Label htmlFor='tta__settings_exclude_wp_tags'>
                                    {__('Track Post IDs For Analytics')} {ttsObj.is_pro_active ? "" : (<>
                                    {['top'].map((placement) => (<OverlayTrigger
                                        key={placement}
                                        placement={placement}
                                        overlay={<Tooltip id={`tooltip-${placement}`}>
                                            {__('Tracking more than 5 post IDs is a pro feature')}
                                        </Tooltip>}>
                                        <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                            className="fas fa-lock"/></Button>
                                    </OverlayTrigger>))}
                                </>)}
                                </Form.Label>
                            </Col>
                            <Col xs={11} sm={11} lg={7}>
                                <MultiSelect toastMessage={'Tracking more than 5 post IDs is a pro feature'}
                                             name={'tts_trackable_post_ids'}
                                             id={'tts_trackable_post_ids'}
                                             selectedItems={selectedIds}
                                             selectionLimit={5} options={postIds} onChange={handleSelectionChange}/>

                            </Col>
                            <Col xs={1} sm={1} lg={1} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (<OverlayTrigger
                                        key={placement}
                                        placement={placement}
                                        overlay={<Tooltip id={`tooltip-${placement}`}>
                                            {__('Click To Know How It Works?')}
                                        </Tooltip>}>
                                        <a target='_blank' href='https://atlasaidev.com/docs/text-to-speech/'>
                                            <i className="fas fa-info-circle"></i></a>
                                    </OverlayTrigger>))}
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
                    <UpgradeToPro promotionType={'analytics'} />
                </Col>
            </Row>
        </Container>
    </React.Fragment> : <h1>Loading</h1>);
};
