import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { __ } from '@wordpress/i18n'

export default function TTSCustomizationButton({ listeningBtnStyle, handleChange, buttonLists }) {
    let buttonPositions = {
        "before_content": "Before Content",
        "after_content": "After Content",
        // "top_fixed": "Top Fixed",
        // "bottom_fixed": "Bottom Fixed (Pro)",
        // "bottom_left": "Bottom Left",
        // "bottom_right": "Bottom Right (Pro)",
        // "bottom_center": "Bottom Center",
    }

    return (
        <>
            <Form.Group>
                <Form.Label htmlFor='id'>
                    {__('Select Player')}
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
            <Form.Group>
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
                    {Object.keys(buttonPositions).map((langKey, index) => {
                        return (
                            <option key={langKey} value={langKey}>
                                {buttonPositions[langKey]}
                            </option>
                        );
                    })}
                </Form.Select>
            </Form.Group>
        </>
    )
}