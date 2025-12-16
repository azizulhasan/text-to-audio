import React from 'react';
import { Form, Card, Button } from 'react-bootstrap';
import TTSButtonDesign from './design/TTSButtonDesign';
import TTSCustomizationButton from './button/TTSCustomizationButton';

function CustomizationTabs({ buttonLists, listeningSettings, handleChange, handleSubmit, customCSS, listeningBtnStyle, activeTab }) {
    return (
        <Form onSubmit={handleSubmit}>
            {activeTab === 'player' && (
                <TTSCustomizationButton 
                    buttonLists={buttonLists} 
                    listeningBtnStyle={listeningBtnStyle} 
                    handleChange={handleChange} 
                />
            )}
            
            {activeTab === 'design' && (
                <TTSButtonDesign 
                    customCSS={customCSS} 
                    handleSubmit={handleSubmit} 
                    listeningBtnStyle={listeningBtnStyle} 
                    handleChange={handleChange} 
                />
            )}

            <div className="d-grid mt-4">
                <Button
                    type='submit'
                    variant="primary"
                    size="lg"
                    className='tta_btn'
                >
                    Save All
                </Button>
            </div>
        </Form>
    );
}

export default CustomizationTabs;