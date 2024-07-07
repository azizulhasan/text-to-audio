import React, {useState} from 'react';
import { Dropdown, Form, Button, Badge } from 'react-bootstrap';
import {__} from '@wordpress/i18n'

const AnalyticsMultiSelect = ({options, onChange}) => {
    const [selected, setSelected] = useState([]);

    const handleToggle = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        setSelected(newSelected);
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        setSelected(options);
        onChange(options);
    };

    const handleDeselectAll = () => {
        setSelected([]);
        onChange([]);
    };

    return (
        <div>
            <div className="mb-2">
                {selected.length > 0 ? (
                    selected.map((id) => (
                        <Badge key={id} pill variant="primary" className="mr-2">
                            ID {id}
                        </Badge>
                    ))
                ) : (
                    <span>{__('No IDs selected')}</span>
                )}
            </div>
            <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Select IDs
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Form>
                        {options.map((option) => (
                            <Form.Check
                                key={option}
                                type="checkbox"
                                id={`check-${option}`}
                                label={`ID ${option}`}
                                checked={selected.includes(option)}
                                onChange={() => handleToggle(option)}
                            />
                        ))}
                        <div className="d-flex justify-content-between p-2">
                            <Button variant="primary" size="sm" onClick={handleSelectAll}>
                                Select All
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
                                Deselect All
                            </Button>
                        </div>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );

};

export default AnalyticsMultiSelect;