import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import TTSButtonDesign from './design/TTSButtonDesign';

function CustomizationTabs() {
    return (
        <Tabs
            defaultActiveKey="button"
            id="customization-button"
            className="mb-3"
        >
            <Tab eventKey="button" title="Button" >Button</Tab>
            <Tab eventKey="design" title="Design" ><TTSButtonDesign /></Tab>
        </Tabs >
    );
}

export default CustomizationTabs;