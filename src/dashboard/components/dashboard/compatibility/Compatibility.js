import React, {useEffect, useState} from "react";
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip} from "react-bootstrap";
import {__} from "@wordpress/i18n";
import UpgradeToPro from "../../UpgradeToPro";
import {postWithoutImage} from "../../context/utilities";
import {MultiSelect} from "../../context/MultiSelect";
import toast from '../../context/Notify';
import Icon from "../../Icon";


export default function Compatibility() {

    console.log({in: wp})
    const [compatible, setCompatible] = useState({
        'tts_acf_fields': [],
    })

    const [acfFields, setAcfFields] = useState([])
    const [selectedACFFields, setSelectedACFFields] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [hasACFFields, setHasACFFields] = useState(false)



    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/acf_fields', formData).then((res) => {
            console.log(res.data)
            setHasACFFields(true)
            if(res?.data) {
                setAcfFields(res?.data)
            }
        });

    }, []);

    useEffect(() => {
        /**
         * Get data from and display to table.
         */
        if(hasACFFields) {
            let formData = new FormData();
            formData.append('method', 'get');
            postWithoutImage(tta_obj.api_url + 'tta/v1/compatible_data', formData).then((res) => {
                console.log(res.data)
                if(res?.data?.tts_acf_fields) {
                    console.log(res?.data?.tts_acf_fields)
                    setSelectedACFFields(res?.data?.tts_acf_fields)
                }
                setIsDataLoaded(true)
            });
        }
    }, [hasACFFields]);

    const handleSelectionChange = (selectedIds) => {
        setSelectedACFFields(selectedIds)
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

        setCompatible({
            ...compatible,
            ...{[e.target.name]: value},
        });
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        compatible.tts_acf_fields = selectedACFFields
        let formData = new FormData();
        formData.append('fields', JSON.stringify(compatible));
        formData.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/compatible_data', formData)
            .then((res) => {
                if (res?.data) {
                    console.log(res.data)
                    // setCompatible({
                    //     ...compatible,
                    //     ...res.data
                    // })
                }
                toast(__('Successfully Saved.', 'text-to-audio'), 'info', {
                    autoClose: 2500
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const detectedPlugins = (typeof tta_obj !== 'undefined' && tta_obj.detected_caching_plugins) ? tta_obj.detected_caching_plugins : [];

    const getPluginStatusIcon = (plugin) => {
        if (plugin.active && plugin.handled) {
            return { icon: "\u2705", text: __('JS exclusion active', 'text-to-audio') };
        }
        if (plugin.active && !plugin.handled) {
            return { icon: "\u26A0\uFE0F", text: __('Detected but not handled — may cause conflicts', 'text-to-audio') };
        }
        if (plugin.installed && !plugin.active) {
            return { icon: "\u26AA", text: __('Installed but not active', 'text-to-audio') };
        }
        return { icon: "\u26AA", text: __('Not installed', 'text-to-audio') };
    };

    return (isDataLoaded ? <React.Fragment>
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    {/* Detected Caching Plugins */}
                    {detectedPlugins.length > 0 && (
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '24px',
                        }}>
                            <h5 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1e293b',
                                marginBottom: '4px',
                            }}>
                                {__('Compatibility Status', 'text-to-audio')}
                            </h5>
                            <p style={{
                                fontSize: '13px',
                                color: '#64748b',
                                marginBottom: '16px',
                            }}>
                                {__('AtlasVoice automatically excludes its scripts from caching and optimization plugins to prevent conflicts.', 'text-to-audio')}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {detectedPlugins.map((plugin, index) => {
                                    const status = getPluginStatusIcon(plugin);
                                    return (
                                        <div key={index} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: plugin.active ? '#f0fdf4' : '#f8fafc',
                                            border: plugin.active && !plugin.handled ? '1px solid #fbbf24' : '1px solid transparent',
                                        }}>
                                            <span style={{ fontSize: '16px', lineHeight: '1' }}>{status.icon}</span>
                                            <span style={{
                                                fontWeight: '500',
                                                color: '#1e293b',
                                                fontSize: '14px',
                                                minWidth: '140px',
                                            }}>
                                                {plugin.name}
                                            </span>
                                            <span style={{
                                                fontSize: '13px',
                                                color: plugin.active && !plugin.handled ? '#92400e' : '#64748b',
                                            }}>
                                                {'\u2014 ' + status.text}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Form onSubmit={handleSubmit}>

                        {/*ACF Fields */}
                        <Row className='mt-4'>
                            <Col xs={12} sm={6} lg={4}>
                                <Form.Label htmlFor='tta__settings_exclude_wp_tags'>
                                    {__('Add ACF Fields To Posts', 'text-to-audio')} {ttsObj.is_pro_active ? "" : (<>
                                    {['top'].map((placement) => (<OverlayTrigger
                                        key={placement}
                                        placement={placement}
                                        overlay={<Tooltip id={`tooltip-${placement}`}>
                                            {__('Adding more than 1  ACF field is a pro feature', 'text-to-audio')}
                                        </Tooltip>}>
                                        <Button className="m-0 p-0 text-dark bg-light border-0"><Icon name="lock" /></Button>
                                    </OverlayTrigger>))}
                                </>)}
                                </Form.Label>
                            </Col>
                            <Col xs={11} sm={11} lg={7}>
                                <MultiSelect toastMessage={__('Adding more than 1  ACF field is a pro feature', 'text-to-audio')}
                                             name={'tts_trackable_post_ids'}
                                             id={'tts_trackable_post_ids'}
                                             selectedItems={selectedACFFields}
                                             selectionLimit={1} options={acfFields} onChange={handleSelectionChange}/>

                            </Col>
                            <Col xs={1} sm={1} lg={1} className='mt-4'>
                                <>
                                    {['top'].map((placement) => (<OverlayTrigger
                                        key={placement}
                                        placement={placement}
                                        overlay={<Tooltip id={`tooltip-${placement}`}>
                                            {__('Click To Know How It Works?', 'text-to-audio')}
                                        </Tooltip>}>
                                        <a target='_blank' href='https://atlasaidev.com/docs/text-to-speech/'>
                                            <Icon name="info-circle" /></a>
                                    </OverlayTrigger>))}
                                </>
                            </Col>
                        </Row>
                        {/*Display Button Icon*/}
                        <Row className='mt-3'>
                            <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn  btn-block'>
                                    {__('Save', 'text-to-audio')}
                                </button>
                            </div>
                        </Row>
                    </Form>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro promotionType={'compatible'}/>
                </Col>
            </Row>
        </Container>
    </React.Fragment> : <h1>{__('Loading', 'text-to-audio')}</h1>);
};
