import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n'
import {
     Form, Col, Container, Tooltip,
    OverlayTrigger,
    Button
} from 'react-bootstrap';
import {ToastContainer} from 'react-toastify';
/**
 * Scripts
 */
import 'react-toastify/dist/ReactToastify.css';

/**
 *
 * Scripts
 */
import {postWithoutImage} from '../components/context/utilities';
import toast from '../components/context/Notify';

export default function CSSSelectorsForPosts() {
    const [settings, setSettings] = useState({
        tta__settings_css_selectors: '',
        tta__settings_exclude_content_by_css_selectors: '',
        tta__settings_exclude_texts: "",
        tta__settings_exclude_tags: "",
        tta__settings_use_own_css_selectors: true,
    });


    const [postID, setPostID] = useState('');
    const [isDataLoaded, setIsDataLoaded] = useState(false)


    useEffect(() => {

        let url2 = new URLSearchParams(window.location.search);

        let post_id = url2.get('post');
        setPostID(post_id)
        let formData = new FormData();
        formData.append('method', 'get');
        formData.append('post_id', post_id);
        postWithoutImage(tta_obj.api_url + 'tta_pro/v1/css_selectors_for_posts', formData).then(
            (res) => {
                setSettings({...settings, ...res.data});
                setIsDataLoaded(true)

            });
    }, []);

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        let value = '';
        value = e.target.value

        if (e.target.getAttribute('type') === 'checkbox') {
            value = e.target.checked
        }


        if (!e.target.name) return;

        setSettings({
            ...settings,
            ...{[e.target.name]: value},
        });
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!postID) {
            toast('Please save the post then try to add custom CSS selectors.');
            return;
        }
        if (settings.tta__settings_use_own_css_selectors && !checkAllPropertiesAreEmpty(settings)) {
            toast('Empty value can not be saved. You can uncheck the "Use Own CSS Selectors" Option.', 'info', {
                autoClose: 10000
            });
            return;
        }

        console.log(settings)

        // return;
        let formData = new FormData();
        formData.append('fields', JSON.stringify(settings));
        formData.append('method', 'post');
        formData.append('post_id', postID);
        postWithoutImage(tta_obj.api_url + 'tta_pro/v1/css_selectors_for_posts', formData)
            .then((res) => {
                setSettings(res.data);
                toast('Settings Data Saved');
                setIsDataLoaded(true)
            })
            .catch((err) => {
                console.log(err);
            });
    };

    function checkAllPropertiesAreEmpty(obj) {
        // Iterate over each property in the object
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Check if the property value is not empty
                if (obj[key].length) {
                    return true; // Return true if any property is not empty
                }
            }
        }
        return false; // Return false if all properties are empty
    }


    return (
        isDataLoaded ? <React.Fragment>
            <ToastContainer
                position='top-right'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <Container className={'atlasVoice-container'}  >
                <div className={'atlasVoice-row'}>
                    <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                        <Form onSubmit={handleSubmit}>
                            {/* Use Own CSS Selectors */}
                            <div className='atlasVoice-mt-3 atlasVoice-row'>
                                <Col  xs={12} sm={6} lg={4}>
                                    <Form.Label htmlFor='tta__settings_use_own_css_selectors'>
                                        Use Own CSS Selectors
                                    </Form.Label>
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                                    <Form.Check // prettier-ignore
                                        type={'checkbox'}
                                        checked={settings.tta__settings_use_own_css_selectors}
                                        onChange={(e) =>
                                            handleChange(e)
                                        }
                                        name={`tta__settings_use_own_css_selectors`}
                                        id={`tta__settings_use_own_css_selectors`}
                                    />
                                </Col>
                            </div>
                            {/*Include Content By CSS Selector*/}
                            <div className='atlasVoice-mt-4 atlasVoice-row'>
                                    <Col bsPrefix="atlasVoice" xs={12} sm={6} lg={4}>
                                        <Form.Label htmlFor='tta__settings_css_selectors'>
                                            Include Content By CSS Selectors {ttsObj.is_pro_active ? "" : (
                                            <>
                                                {['top'].map((placement) => (
                                                    <OverlayTrigger
                                                        key={placement}
                                                        placement={placement}
                                                        overlay={
                                                            <Tooltip id={`tooltip-${placement}`}>
                                                                {__('Include Content By CSS Selectors feature is available in pro version')}
                                                            </Tooltip>
                                                        }>
                                                        <Button bsPrefix="atlasVoice"
                                                                className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                                            className="fas fa-lock"/></Button>
                                                    </OverlayTrigger>
                                                ))}
                                            </>
                                        )}
                                        </Form.Label>
                                    </Col>
                                    <Col bsPrefix="atlasVoice" xs={11} sm={11} lg={7}>
                                        <Form.Control
                                            bsPrefix={'atlasVoice-form-control'}
                                            id="tta__settings_css_selectors"
                                            name="tta__settings_css_selectors"
                                            as='textarea'
                                            onChange={(e) => handleChange(e)}
                                            value={settings.tta__settings_css_selectors}
                                            placeholder={ttsObj.is_pro_active ? __('Multiple selector will be multiline.') : 'Some content may be missing, It can be found by css selectors'}
                                            disabled={ttsObj.is_pro_active ? false : true}
                                        />
                                    </Col>
                                    <Col bsPrefix="atlasVoice" xs={1} sm={1} lg={1} className='mt-4'>
                                        <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            {__('Click To Know How It Works?')}
                                                        </Tooltip>
                                                    }>
                                                    <a style={{textDecoration: 'none'}} target='_blank'
                                                       href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev'>
                                                        <span className="dashicons dashicons-info-outline"></span></a>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    </Col>
                            </div>
                            {/*Exclude Content By CSS Selector*/}
                            <div className='atlasVoice-mt-4 atlasVoice-row'>
                                    <Col bsPrefix="atlasVoice" xs={12} sm={6} lg={4}>
                                        <Form.Label htmlFor='tta__settings_exclude_content_by_css_selectors'>
                                            Exclude Content By CSS Selectors {ttsObj.is_pro_active ? "" : (
                                            <>
                                                {['top'].map((placement) => (
                                                    <OverlayTrigger
                                                        key={placement}
                                                        placement={placement}
                                                        overlay={
                                                            <Tooltip id={`tooltip-${placement}`}>
                                                                {__('Exclude Content By CSS Selectors feature is available in pro version')}
                                                            </Tooltip>
                                                        }>
                                                        <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                                            className="fas fa-lock"/></Button>
                                                    </OverlayTrigger>
                                                ))}
                                            </>
                                        )}
                                        </Form.Label>
                                    </Col>
                                    <Col bsPrefix="atlasVoice" xs={11} sm={11} lg={7}>
                                        <Form.Control
                                            bsPrefix={'atlasVoice-form-control'}
                                            id="tta__settings_exclude_content_by_css_selectors"
                                            name="tta__settings_exclude_content_by_css_selectors"
                                            as='textarea'
                                            onChange={(e) => handleChange(e)}
                                            value={settings.tta__settings_exclude_content_by_css_selectors}
                                            placeholder={ttsObj.is_pro_active ? __('Multiple selector will be multiline.') : 'Exclude content by CSS selectors'}
                                            disabled={ttsObj.is_pro_active ? false : true}
                                        />
                                    </Col>
                                    <Col bsPrefix="atlasVoice" xs={1} sm={1} lg={1} className='mt-4'>
                                        <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            {__('Click To Know How It Works?')}
                                                        </Tooltip>
                                                    }>
                                                    <a style={{textDecoration: 'none'}} target='_blank'
                                                       href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev'>
                                                        <span className="dashicons dashicons-info-outline"></span></a>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    </Col>
                            </div>
                            {/*Exclude Tags To Speak*/}
                            <div className='atlasVoice-mt-4 atlasVoice-row'>
                                <Col bsPrefix="atlasVoice" xs={12} sm={6} lg={4}>
                                    <Form.Label htmlFor='tta__settings_exclude_tags'>
                                        Exclude Tags To Speak {ttsObj.is_pro_active ? "" : (
                                        <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            {__('Exclude Tags. So that its content skiped. Like ( Subscript, Superscript etc.) This is a pro feature.')}
                                                        </Tooltip>
                                                    }>
                                                    <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                                        className="fas fa-lock"/></Button>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    )}
                                    </Form.Label>
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={11} sm={11} lg={7}>
                                    <Form.Control
                                        bsPrefix={'atlasVoice-form-control'}
                                        id="tta__settings_exclude_tags"
                                        name="tta__settings_exclude_tags"
                                        as='textarea'
                                        onChange={(e) => handleChange(e)}
                                        value={settings.tta__settings_exclude_tags}
                                        placeholder={ttsObj.is_pro_active ? __('Multiple Tags Will Be Pipe(|) Separated.') : __('Exclude tags is a pro feature.')}
                                        disabled={ttsObj.is_pro_active ? false : true}
                                    />
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={1} sm={1} lg={1} className='mt-4'>
                                    <>
                                        {['top'].map((placement) => (
                                            <OverlayTrigger
                                                key={placement}
                                                placement={placement}
                                                overlay={
                                                    <Tooltip id={`tooltip-${placement}`}>
                                                        {__('Click To Know How It Works?')}
                                                    </Tooltip>
                                                }>
                                                <a style={{textDecoration: 'none'}} target='_blank'
                                                   href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev'>
                                                    <span className="dashicons dashicons-info-outline"></span></a>
                                            </OverlayTrigger>
                                        ))}
                                    </>
                                </Col>
                            </div>
                            {/*Exclude Texts To Speak*/}
                            <div className='atlasVoice-mt-4 atlasVoice-row'>
                                <Col bsPrefix="atlasVoice" xs={12} sm={6} lg={4}>
                                    <Form.Label htmlFor='tta__settings_exclude_texts'>
                                        Exclude Texts To Speak {ttsObj.is_pro_active ? "" : (
                                        <>
                                            {['top'].map((placement) => (
                                                <OverlayTrigger
                                                    key={placement}
                                                    placement={placement}
                                                    overlay={
                                                        <Tooltip id={`tooltip-${placement}`}>
                                                            {__('Excluding texts to be spoken is a pro feature.')}
                                                        </Tooltip>
                                                    }>
                                                    <Button className="tta_btn m-0 p-0 text-dark bg-light border-0"><i
                                                        className="fas fa-lock"/></Button>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    )}
                                    </Form.Label>
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={11} sm={11} lg={7}>
                                    <Form.Control
                                        bsPrefix={'atlasVoice-form-control'}
                                        id="tta__settings_exclude_texts"
                                        name="tta__settings_exclude_texts"
                                        as='textarea'
                                        onChange={(e) => handleChange(e)}
                                        value={settings.tta__settings_exclude_texts}
                                        placeholder={ttsObj.is_pro_active ? __('Multiple Texts Will Be Pipe(|) Separated.') : 'Exclude texts is a pro feature.'}
                                        disabled={ttsObj.is_pro_active ? false : true}
                                    />
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={1} sm={1} lg={1} className='mt-4'>
                                    <>
                                        {['top'].map((placement) => (
                                            <OverlayTrigger
                                                key={placement}
                                                placement={placement}
                                                overlay={
                                                    <Tooltip id={`tooltip-${placement}`}>
                                                        {__('Click To Know How It Works?')}
                                                    </Tooltip>
                                                }>
                                                <a style={{textDecoration: 'none'}} target='_blank'
                                                   href='https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev'>
                                                    <span className="dashicons dashicons-info-outline"></span></a>
                                            </OverlayTrigger>
                                        ))}
                                    </>
                                </Col>
                                <div  className='atlasVoice-d-grid atlasVoice-gap-3 catlasVoice-ol-2 atlasVoice-mx-auto atlasVoice-mt-4 atlasVoice-mb-4'>
                                    <button type='submit' className='tta_btn  btn-block'>
                                        Save
                                    </button>
                                </div>
                            </div>
                        </Form>
                    </Col>
                </div>
            </Container>
        </React.Fragment> : <h1>Loading</h1>
    );
}
