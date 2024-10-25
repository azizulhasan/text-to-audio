import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n'
import {
    ToggleButton, Form, Row, Col, Container, Tooltip,
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
import {postWithoutImage, getMultilingualActiveLanguages} from '../components/context/utilities';
import toast from '../components/context/Notify';
import {forEach} from "react-bootstrap/ElementChildren";

export default function GenerateBulkMp3File({ postId, language, selectedLang, isRegenerateFile }) {
    const [settings, setSettings] = useState({
        tta__settings_css_selectors: '',
        tta__settings_exclude_content_by_css_selectors: '',
        tta__settings_exclude_texts: "",
        tta__settings_exclude_tags: "",
        tta__settings_use_own_css_selectors: true,
    });
    const [multilingualActiveLanguages, setMultilingualActiveLanguages] = useState([]);


    const [postIDs, setPostIDs] = useState([]);
    const [postContents, setPostContents] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [metaKeys, setMetaKeys] = useState('');
    const [content, setContent] = useState('');

    const handleMetaKeysChange = (e) => {
        setMetaKeys(e.target.value);
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
    };

    const generateMP3File = () => {
        // Add your MP3 generation logic here
        console.log('Generating MP3 file...');
    };




    useEffect(() => {
        let activeLanguages = getMultilingualActiveLanguages(window?.ttsObjPro)
        setMultilingualActiveLanguages(activeLanguages)
    }, [window?.ttsObjPro])

    useEffect(async () => {
        let url = new URLSearchParams(window.location.search);
        let post_ids = url.get('atlasvoice_mp3_file');
        post_ids = post_ids.split(',')
        console.log(post_ids)
        setPostIDs(setPostIDs)

        let formData = new FormData();
        formData.append('method', 'get');
        formData.append('post_ids', post_ids);
        await  postWithoutImage(ttsObjPro.api_url + 'tta_pro/v1/get_bulk_post_content', formData).then(
            (res) => {
                if(res.status) {
                    setPostContents(res.data)
                }

            });

    }, []);

    useEffect(async () => {
        if(Object.keys(postContents).length) {
            for (let postId  of Object.keys(postContents)) {
                let bulkMP3File = await new BulkMP3File( postContents[postId])
                console.log({bulkMP3File})
            }
        }
    }, [postContents]);

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
        postWithoutImage(ttsObjPro.api_url + 'tta_pro/v1/css_selectors_for_posts', formData)
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
                                    <Form.Group controlId={`tts_metabox_fields_${postId}`}>
                                        <Form.Label>Add custom fields (comma separated)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={metaKeys}
                                            onChange={handleMetaKeysChange}
                                            placeholder="Add custom fields (comma separated)"
                                            style={{ marginTop: '5px' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col bsPrefix="atlasVoice" xs={11} sm={11} lg={7}>
                                    <Form.Group controlId="tts_mp3_file_regenerate_contents" style={{ marginTop: '15px' }}>
                                        <Form.Label>
                                            <a id="translation_link" target="_blank" rel="noopener noreferrer" href="https://translate.google.com/">
                                                Translate From {language} To {language}
                                            </a>
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            value={content}
                                            onChange={handleContentChange}
                                            rows={10}
                                            placeholder={`Site language is ${selectedLang}. If you want to generate the MP3 file for other languages, paste the translated content here and select the language, then generate the MP3 file.`}
                                            style={{ marginTop: '5px' }}
                                        />
                                    </Form.Group>
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
                                <Button
                                    variant="primary"
                                    onClick={generateMP3File}
                                    style={{ width: '100%', marginTop: '5px', backgroundColor: '#184c53', color: 'white' }}
                                >
                                    {isRegenerateFile ? 'Regenerate' : 'Generate'} MP3 File
                                </Button>
                            </div>
                        </Form>
                    </Col>
                </div>
            </Container>
        </React.Fragment> : <h1>Loading</h1>

    );
}
