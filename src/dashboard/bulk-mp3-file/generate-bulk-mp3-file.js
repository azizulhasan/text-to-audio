import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n'
import {
    ToggleButton, Form, Row, Col, Container, Tooltip,
    OverlayTrigger,
    Button, Accordion, Table
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
import {postWithoutImage, getMultilingualActiveLanguages, copyToClipBoard} from '../components/context/utilities';
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
        // setContent(e.target.value);
        let parsedContents = structuredClone(postContents)
        let settings = parsedContents[e.target.id]
        settings.contents[1] = e.target.value;
        parsedContents[e.target.id] = settings;

        console.log(parsedContents)

        setPostContents(parsedContents)
        console.log({id: e.target.id, val: e.target.value})
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
                    setIsDataLoaded(res.status)
                }

            });


        // if(!data) {
        //     let formData = new FormData();
        //     formData.append('method', 'get');
        //     formData.append('post_ids', post_ids);
        //     await  postWithoutImage(ttsObjPro.api_url + 'tta_pro/v1/get_bulk_post_content', formData).then(
        //         (res) => {
        //             if(res.status) {
        //                 setPostContents(res.data)
        //                 setIsDataLoaded(res.status)
        //                 window.sessionStorage.setItem('tts_temp_post_contents', JSON.stringify(res.data))
        //             }
        //
        //         });
        // }else{
        //     setPostContents(data)
        //     setIsDataLoaded(1)
        //
        // }


    }, []);

    useEffect( () => {
            if(Object.keys(postContents).length) {
                console.log({postContents})
                // window.sessionStorage.setItem('tts_temp_post_contents', JSON.stringify(postContents))
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
    const handleSubmit = async (e) => {
        e.preventDefault();

        if(Object.keys(postContents).length) {
            for (let postId  of Object.keys(postContents)) {
                let bulkMP3File = await new BulkMP3File(postContents[postId])
                if (!bulkMP3File.fileURL) {
                    if (ttsObjPro.player_id == 3) {
                        if (bulkMP3File.compatible?.initiatedPlugins?.gtranslate) {
                            // mp3File.gtranslateCompitable()
                        } else {
                            let mp3File = await bulkMP3File.init_gtts(1)
                            console.log({mp3File})
                            if(mp3File) {
                                let parsedContents = structuredClone(postContents)
                                let settings = parsedContents[postId]
                                let urls = settings.settings.fileURLs;
                                let file_url_key = settings.extra[1].file_url_key;
                                settings.settings.fileURLs = {
                                        ...{
                                            [file_url_key]: mp3File
                                        },
                                    ...urls
                                };
                                parsedContents[postId] = settings;
                                console.log({parsedContents})
                                setPostContents(parsedContents)
                            }
                        }
                    }
                    // else if (ttsObjPro.player_id == 4) {
                    //     if (this.compatible?.initiatedPlugins?.gtranslate) {
                    //         this.#gtranslateCompitable()
                    //     } else {
                    //         this.init_gctts()
                    //     }
                    // }else if (ttsObjPro.player_id == 5) {
                    //     if (this.compatible?.initiatedPlugins?.gtranslate) {
                    //         this.#gtranslateCompitable()
                    //     } else {
                    //         this.init_chat_gpt()
                    //     }
                    // }
                }

            }
        }

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

    const postHasURL = (postId, postContents2 ) => {

        let urls = postContents[postId].settings.fileURLs;

        return Object.keys(urls).length  > 0 ? <i className="fa fa-check-circle"></i> : <i className="fa fa-times"></i>
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
            <Container className={'atlasVoice-container'}>
                <div className={'atlasVoice-row'}>
                    <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                        <div id={"player_content_1"}></div>
                    </Col>
                </div>
                        <div className={'atlasVoice-row'}>
                            <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>

                                <Form onSubmit={handleSubmit}>
                                    {/* Use Own CSS Selectors */}
                                    <div className='atlasVoice-mt-3 atlasVoice-row'>
                                        <Col xs={12} sm={12} lg={12}>
                                            {
                                                Object.keys(postContents).map(postId=> {
                                                    let title = postContents[postId].extra[1].title;
                                                    let content = postContents[postId].contents[1];
                                                    let urls = postContents[postId].settings.fileURLs;
                                                   return <Accordion key={postId}>
                                                        <Accordion.Item eventKey='1'>
                                                            <Accordion.Header>
                                                                <div className={'pe-2'}> {
                                                                    Object.keys(urls).length ?
                                                                        <i className="fa fa-check-circle"></i> :
                                                                        <i className="fa fa-times"></i>
                                                                }
                                                                </div>
                                                                    {title}
                                                            </Accordion.Header>
                                                            <Accordion.Body>
                                                                <Form.Group controlId={postId}>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        value={content}
                                                                        onChange={handleContentChange}
                                                                        onPaste={handleContentChange}
                                                                        rows={10}
                                                                        placeholder={`Site language is ${selectedLang}. If you want to generate the MP3 file for other languages, paste the translated content here and select the language, then generate the MP3 file.`}
                                                                    />
                                                                </Form.Group>
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    </Accordion>
                                                })
                                            }
                                        </Col>
                                    </div>
                                    {/*Include Content By CSS Selector*/}
                                    <div className='atlasVoice-mt-4 atlasVoice-row'>
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
                                                            <span
                                                                className="dashicons dashicons-info-outline"></span></a>
                                                    </OverlayTrigger>
                                                ))}
                                            </>
                                        </Col>
                                        <Button
                                            variant="primary"
                                            type={'submit'}
                                            style={{
                                                width: '100%',
                                                marginTop: '5px',
                                                backgroundColor: '#184c53',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isRegenerateFile ? 'Regenerate' : 'Generate'} MP3 File
                                        </Button>
                                    </div>
                                </Form>
                            </Col>
                        </div>
            </Container>
        </React.Fragment>
:
    <h1>Loading</h1>

);
}
