import React, {useEffect, useState} from 'react';
import {Form, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { __ } from '@wordpress/i18n'
import {postData} from "../../../context/utilities";
import {MultiSelect} from "../../../context/MultiSelect";

export default function TTSCustomizationButton({ listeningBtnStyle, handleChange, buttonLists }) {
    const [userRoles, setUserRoles] = useState({})
    let buttonPositions = {
        "before_content": "Before Content",
        "after_content": "After Content",
        // "top_fixed": "Top Fixed",
        "bottom_fixed": "Bottom Fixed (Pro)",
        "bottom_left": "Bottom Left (Pro)",
        "bottom_right": "Bottom Right (Pro)",
        "bottom_center": "Bottom Center (Pro)",
    }

    useEffect(() => {
        postData(ttsObj.api_url + 'tta/v1/get_all_user_roles', {}, "GET")
            .then((res) => {
                if(res?.status) {
                    setUserRoles(res.data)
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    useEffect(() => {
        console.log(userRoles)
    }, [userRoles]);

    return (
        <>
            <Form.Group>
                <Form.Label htmlFor='id'>
                    {__('Select Player')}
                    <div className={'d-inline-flex ps-3'}>
                        {
                            <>
                                {['top'].map((placement) => (<OverlayTrigger
                                    key={placement}
                                    placement={placement}
                                    overlay={<Tooltip id={`tooltip-${placement}`}>
                                        {__('Click To Know How It Works?')}
                                    </Tooltip>}>
                                    <a className={'text-danger'} target='_blank'
                                       href='https://www.youtube.com/watch?v=h4VJxM-mh74&t=936s'>
                                        <i className="fab fa-youtube"></i>
                                    </a>
                                </OverlayTrigger>))}
                            </>
                        }
                    </div>
                </Form.Label>
                <Form.Select
                    onChange={handleChange}
                    name='id'
                    id='id'
                    value={listeningBtnStyle?.buttonSettings?.id || 1}
                    aria-label='Select Player'>
                    <option disabled>
                        {__('Select Player')}
                    </option>
                    {buttonLists.map((button, index) => {
                        return (
                            <option disabled={button.disabled} key={button.id} value={button.id}>
                                {button.name}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>
            {/*Button Positions*/}
            <Form.Group className={'mt-3'}>
                <Form.Label htmlFor='button_position'>
                    {__('Select Button Position')}
                </Form.Label>
                <Form.Select
                    onChange={handleChange}
                    name='button_position'
                    id='button_position'
                    value={listeningBtnStyle?.buttonSettings?.button_position || 'before_content'}
                    aria-label='Select Button Position'>
                    <option disabled>
                        {__('Select Button Position')}
                    </option>
                    {Object.keys(buttonPositions).map((positionKey, index) => {
                        return (
                            <option key={positionKey} value={positionKey}>
                                {buttonPositions[positionKey]}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>
            {/*Display Player To*/}
            <Form.Group className={'mt-3'}>
                <Form.Label>
                    {__('Display Player To')}
                </Form.Label>
                {
                    listeningBtnStyle?.buttonSettings?.display_player_to && Object.keys(userRoles).length && <MultiSelect toastMessage={'Player display restriction to multiple user type is available in the pro version'}
                                                          name={'display_player_to'}
                                                          id={'display_player_to'}
                                                          selectedItems={listeningBtnStyle?.buttonSettings?.display_player_to ||  ['all']}
                                                          selectionLimit={1} options={userRoles} onChange={handleChange}/>
                }
            </Form.Group>

            {/*Who Can Download MP3 File*/}
            {
                listeningBtnStyle?.buttonSettings?.id > 2 && Object.keys(userRoles).length && <Form.Group className={'mt-3'}>
                    <Form.Label>
                        {__('Who Can Download MP3 File')}
                    </Form.Label>
                    <MultiSelect toastMessage={'Player display restriction to multiple user type is available in the pro version'}
                       name={'who_can_download_mp3_file'}
                       id={'who_can_download_mp3_file'}
                       multiselectIndex={1}
                       selectedItems={listeningBtnStyle?.buttonSettings?.who_can_download_mp3_file ||  ['all']}
                       selectionLimit={100} options={userRoles} onChange={handleChange}/>
                </Form.Group>

            }

        </>
    )
}