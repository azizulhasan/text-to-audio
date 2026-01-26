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
                                                          href='https://atlasaidev.com/plugins/text-to-speech-pro/pricing/'>Buy Pro
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
 
    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid className="tta-container">
                <Row>
                    <Col xs={12} lg={8}>
                        {/* Header Card */}
                        <div className="tta_aliases_header_card">
                            <h2 className="tta_aliases_title">
                                Text to Speech Aliases
                            </h2>
                            <p className="tta_aliases_description">
                                Here a short text have to write to inform the user about this feature purpose
                            </p>
                        </div>
 
                        {/* Main Aliases Card */}
                        <Form onSubmit={handleSubmit}>
                            <div className="tta_aliases_card">
                                <div className="tta_aliases_table_header">
                                    <div className="tta_aliases_column_header">Actual Text</div>
                                    <div className="tta_aliases_column_header">To Read</div>
                                    <div className="tta_aliases_column_header_action"></div>
                                </div>
 
                                {ttsTextAliases.map((alias, index) => (
                                    <div key={index} className="tta_aliases_row">
                                        <div className="tta_aliases_input_wrapper">
                                            <Form.Control
                                                type="text"
                                                placeholder="Write actual text"
                                                value={alias.actual_text}
                                                onChange={(e) => handleInputChange(index, 'actual_text', e.target.value)}
                                                className="tta_aliases_input"
                                            />
                                        </div>
                                        <div className="tta_aliases_input_wrapper">
                                            <Form.Control
                                                type="text"
                                                placeholder="Write read aloud text"
                                                value={alias.to_read}
                                                onChange={(e) => handleInputChange(index, 'to_read', e.target.value)}
                                                className="tta_aliases_input"
                                            />
                                        </div>
                                        <div className="tta_aliases_action_wrapper">
                                            <button
                                                type="button"
                                                className="tta_aliases_delete_btn"
                                                onClick={() => handleDeleteRow(index)}
                                            >
                                                <span className="dashicons dashicons-trash"></span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
 
                                {/* Add New and Save Button Section */}
                                <div className="tta_aliases_actions_section">
                                    <button
                                        type="button"
                                        className="tta_aliases_add_btn"
                                        onClick={handleAddRow}
                                    >
                                        <span className="tta_aliases_add_icon">⊕</span> Add New
                                    </button>
                                    <button type='submit' className='tta_aliases_save_btn'>
                                        Save
                                    </button>
                                </div>
                            </div>
                        </Form>
                    </Col>
 
                    <Col xs={12} lg={4}>
                        <UpgradeToPro promotionType={'analytics'}/>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    ) : (
        <div className="tta_aliases_loading">
            <div>
                <i className="fas fa-spinner fa-spin"></i>
                <span className="tta_aliases_loading_text">Loading...</span>
            </div>
        </div>
    );
};
