import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Form } from 'react-bootstrap';

import TTSButtonDesign from './design/TTSButtonDesign';
import TTSCustomizationButton from './button/TTSCustomizationButton';

function CustomizationTabs({ buttonLists, listeningSettings, handleChange, handleSubmit, customCSS, demoSettings }) {
    return (
        <>
            <Form onSubmit={handleSubmit} >
                <Tabs
                    defaultActiveKey="button"
                    id="customization-button"
                    className="mb-3"
                >
                    <Tab eventKey="button" title="Player" ><TTSCustomizationButton buttonLists={buttonLists} demoSettings={demoSettings} handleChange={handleChange} /></Tab>
                    <Tab eventKey="design" title="Design" ><TTSButtonDesign customCSS={customCSS} handleSubmit={handleSubmit} demoSettings={demoSettings} handleChange={handleChange} /></Tab>
                </Tabs >
                {/*<div className='d-grid gap-3 col-12 mx-auto mt-5 mb-4'>*/}
                {/*    <button*/}
                {/*        type='submit'*/}
                {/*        className='tta_btn  btn-block tta_btn  btn-center btn-block'>*/}
                {/*        Save*/}
                {/*    </button>*/}
                {/*</div>*/}
            </Form>
        </>
    );
}

export default CustomizationTabs;