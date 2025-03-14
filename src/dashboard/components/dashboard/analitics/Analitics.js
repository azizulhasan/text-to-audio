import React, {useEffect, useState} from "react";
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip, Card, Table} from "react-bootstrap";
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
    const [summary, setSummary] = useState({})
    const [mostPopularPosts, setMostPopularPosts] = useState({})
    const [popularPostsIds, setPopularPostsIds] = useState([])

    function getTotalTime(totalSeconds) {

        let output = totalSeconds / 60;
        let summeryString = ' Minute';


        if (output > 1) {
            summeryString = ' Minutes';
        }

        if (output > 60) {
            summeryString = ' Hour'
            output = output / 60;
            if (output > 1) {
                summeryString = ' Hours';
            }
        }

        output = output.toFixed(2);

        output += summeryString;

        return output;
    }

    function summarizeAnalytics(data) {
        const summary = {
            totalPosts: data.length,
            totalCounts: {
                init: 0,
                play: 0,
                time: 0,
                pause: 0,
                download: 0,
                end: 0
            },
            totalInteractions: 0
        };

        data.forEach(entry => {
            const events = entry.analytics;
            for (const event in events) {
                if (summary.totalCounts.hasOwnProperty(event)) {
                    summary.totalCounts[event] += events[event].count;
                }
            }
        });

        summary.totalCounts.time = getTotalTime(summary.totalCounts.time)
        const totalCounts = Object.values(summary.totalCounts);
        summary.totalInteractions = totalCounts.reduce((acc, val, currentIndex) => {
            if (currentIndex === 2) {
                return acc;
            }
            return acc + val;
        }, 0);

        return summary;
    }


    function getPopularPosts(data) {
        return data
            .map(post => {
                const {post_id, analytics} = post;
                const totalScore = Object.values(analytics).reduce((sum, event) => sum + event.count, 0);
                return {post_id, totalScore};
            })
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10);
    }

    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/latest_posts', formData).then((res) => {
            setPostIds(res.data)
        });

        let formData2 = new FormData();
        formData2.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/all_insights', formData).then((res) => {
            const summary = summarizeAnalytics(res.data)
            setSummary(summary)
            // console.log(summary)

            const popularPosts = getPopularPosts(res.data)
            setMostPopularPosts(popularPosts)

            const post_ids = [...new Set(popularPosts.map(item => item.post_id))];
            setPopularPostsIds(post_ids)
            console.log(popularPosts)
        });
    }, []);

    useEffect(() => {
        if (popularPostsIds.length) {
            /**
             * Get data from and display to table.
             */
            let formData = new FormData();
            formData.append('method', 'post');
            formData.append('ids', JSON.stringify(popularPostsIds));
            postWithoutImage(tta_obj.api_url + 'tta/v1/latest_posts', formData).then((res) => {
                let postsWithTitle = res.data
                let postsData = structuredClone(mostPopularPosts)
                postsData.map(post => {
                    post.title = postsWithTitle[post.post_id];
                    return post;
                })

                console.log({postsData})

                setMostPopularPosts(postsData)

            });
        }
    }, [popularPostsIds]);

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
                                        <a className={'text-danger'} target='_blank'
                                           href='https://www.youtube.com/watch?v=amkrAtVQGBY&t=8s'>
                                            <i className="fab fa-youtube"></i>
                                        </a>
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

                        {
                            Object.keys(summary).length && <Row>
                                <Card className="shadow-lg p-4">
                                    <h3 className="mb-3">📊 TTS Player Analytics Summary</h3>
                                    <Table striped bordered hover responsive>
                                        <thead className="atlasvoice-bg text-white">
                                        <tr>
                                            <th>Metric</th>
                                            <th>Count</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td><strong>Total Posts</strong></td>
                                            <td>{summary.totalPosts}</td>
                                        </tr>
                                        {Object.entries(summary.totalCounts).map(([key, value]) => (
                                            <tr key={key}>
                                                <td><strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong></td>
                                                <td>{value}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-success">
                                            <td><strong>🔥 Total Interactions</strong></td>
                                            <td><strong>{summary.totalInteractions}</strong></td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </Card>
                                {
                                    mostPopularPosts.length && <Card className="shadow-bg p-4">
                                        <h3 className="mb-3">🔥 Most Popular TTS Posts</h3>
                                        {
                                            ttsObj.is_pro_active ? <Table striped bordered hover responsive>
                                                <thead className="atlasvoice-bg text-white">
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Post Title</th>
                                                    <th>Total Interactions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {mostPopularPosts.map((post, index) => (
                                                    <tr key={post.post_id}>
                                                        <td><strong>#{index + 1}</strong></td>
                                                        <td>{post.title}</td>
                                                        <td>{post.totalScore}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table> : <>
                                                <h3> to see popular post analytics post you have to <a target={'_blank'} href={'https://atlasaidev.com/plugins/text-to-speech-pro/pricing/'} > pro version.</a></h3>
                                            </>
                                        }
                                    </Card>
                                }
                            </Row>
                        }


                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro promotionType={'analytics'}/>
                </Col>
            </Row>
        </Container>
    </React.Fragment> : <h1>Loading</h1>);
};
