import React, {useState, useEffect} from 'react';
import {
     Form, Row, Col, Container,

    Button, Accordion
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

export default function GenerateBulkMp3File({postId, language, selectedLang, isRegenerateFile}) {
    const [settings, setSettings] = useState({
        tts_regenerate_mp3_files: false
    });
    const [multilingualActiveLanguages, setMultilingualActiveLanguages] = useState([]);


    const [postIDs, setPostIDs] = useState([]);
    const [postContents, setPostContents] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [isAllMP3FileGenerated, setIsAllMP3FileGenerated] = useState(false)

    const handleContentChange = (e) => {
        // setContent(e.target.value);
        let parsedContents = structuredClone(postContents)
        let postSettings = parsedContents[e.target.id]
        postSettings.contents[1] = e.target.value;
        parsedContents[e.target.id] = postSettings;

        console.log(parsedContents)

        setPostContents(parsedContents)
        console.log({id: e.target.id, val: e.target.value})
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
        setPostIDs(post_ids)

        let formData = new FormData();
        formData.append('method', 'get');
        formData.append('post_ids', post_ids);
        await postWithoutImage(ttsObjPro.api_url + 'tta_pro/v1/get_bulk_post_content', formData).then(
            (res) => {
                if (res.status) {
                    setPostContents(res.data)
                    setIsDataLoaded(res.status)
                }

            });
    }, []);

    useEffect(() => {
        if (Object.keys(postContents).length) {
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

        if (Object.keys(postContents).length) {
            let mp3FileGenerateCount = 0;
            if (settings.tts_regenerate_mp3_files) {
                if (!confirm('Are you sure? You want to regenerate all MP3 files ?')) {
                    return;
                }
            }
            for (let postId of Object.keys(postContents)) {
                let postSettings = postContents[postId];
                postSettings.settings.is_regenerate_file = settings.tts_regenerate_mp3_files;
                console.log(postSettings)
                let bulkMP3File = await new BulkMP3File(postSettings)
                console.log({mp3file: bulkMP3File.fileURL})
                if (!bulkMP3File.fileURL) {
                    if (ttsObjPro.player_id == 3) {
                        let mp3File = await bulkMP3File.init_gtts(1)
                        console.log({mp3File})
                        if (mp3File) {
                            mp3FileGenerateCount++;
                            setPostURL(mp3File, mp3FileGenerateCount, postId)
                        }
                    } else if (ttsObjPro.player_id == 4) {
                        let mp3File = await bulkMP3File.init_gctts(1)
                        if (mp3File) {
                            mp3FileGenerateCount++;
                            setPostURL(mp3File, mp3FileGenerateCount, postId)
                        }
                    } else if (ttsObjPro.player_id == 5) {
                        let mp3File = await bulkMP3File.init_chat_gpt(1)
                        if (mp3File) {
                            mp3FileGenerateCount++;
                            setPostURL(mp3File, mp3FileGenerateCount, postId)
                        }
                    }
                } else {
                    mp3FileGenerateCount++;
                    setPostURL(bulkMP3File.fileURL, mp3FileGenerateCount, postId)
                }

            }
        }

    };

    function setPostURL(mp3File, mp3FileGenerateCount, postId) {
        let parsedContents = structuredClone(postContents)
        let postSettings = parsedContents[postId]
        console.log(postSettings)
        let urls = postSettings.settings.fileURLs;
        let file_url_key = postSettings.extra[1].file_url_key;
        postSettings.settings.fileURLs = {
            ...{
                [file_url_key]: mp3File
            },
            ...urls
        };
        parsedContents[postId] = postSettings;
        setPostContents(parsedContents)

        let postIDCount = Object.keys(postContents).length;
        if (mp3FileGenerateCount === postIDCount) {
            alert('All MP3 File Generated')
            if (document.getElementById('tts_bulk_mp3_file_generate_save_button')) {
                document.getElementById('tts_bulk_mp3_file_generate_save_button').innerHTML = 'Generate MP3 File'
                setIsAllMP3FileGenerated(true)
            }
        } else {
            if (document.getElementById('tts_bulk_mp3_file_generate_save_button')) {
                document.getElementById('tts_bulk_mp3_file_generate_save_button').innerHTML = mp3FileGenerateCount + ' MP3 file generated out of ' + postIDCount;
            }
        }
    }

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
                <Container className={'atlasVoice-container'}>
                    <div className={'atlasVoice-row'}>
                        <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                            How it works? <a style={{textDecoration: 'none',}} className={'text-danger'} target='_blank'
                                             href='https://www.youtube.com/watch?v=HFoqlkPCP80'>
                                                            <span
                                                                className="fab fa-youtube"></span></a>
                        </Col>
                        <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                            <div id={"player_content_1"}></div>
                        </Col>

                    </div>
                    {/* Add Button or Player Automatically */}
                    <Row className=' mt-3'>
                        <Col xs={12} sm={6} lg={4}>
                            <Form.Label htmlFor='tta__settings_enable_button_add'>
                                Regenerate All MP3 Files.
                            </Form.Label>
                        </Col>
                        <Col xs={12} sm={12} lg={8}>
                            <Form.Check // prettier-ignore
                                type={'checkbox'}
                                checked={settings.tts_regenerate_mp3_files}
                                onChange={(e) =>
                                    handleChange(e)
                                }
                                name={`tts_regenerate_mp3_files`}
                                id={`tts_regenerate_mp3_files`}
                            />
                        </Col>
                    </Row>
                    <div className={'atlasVoice-row'}>
                        <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                            <Form onSubmit={handleSubmit}>
                                {/* Use Own CSS Selectors */}
                                <div className='atlasVoice-mt-3 atlasVoice-row'>
                                    <Col xs={12} sm={12} lg={12}>
                                        {
                                            Object.keys(postContents).map(postId => {
                                                let title = postContents[postId].extra[1].title;
                                                let file_url_key = postContents[postId].extra[1].file_url_key;
                                                let content = postContents[postId].contents[1];
                                                let urls = postContents[postId].settings.fileURLs;
                                                let postURL = postContents[postId].settings.postURL;
                                                return <div key={postId} className={'d-flex d-inline align-items-center'}>
                                                    <Accordion className={'flex-grow-1'}>
                                                        <Accordion.Item eventKey={postId}>
                                                            <Accordion.Header>
                                                                <div className={'pe-2'}> {
                                                                    Object.keys(urls).length && Object.keys(urls).includes(file_url_key) ?
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
                                                    {
                                                        Object.keys(urls).length && Object.keys(urls).includes(file_url_key) ?
                                                        <a className={'px-2'} href={postURL} target={'_blank'}><i className="fa fa-eye"
                                                                                               aria-hidden="true"></i></a>: ''
                                                    }

                                                </div>
                                            })
                                        }
                                    </Col>
                                </div>
                                {/*Include Content By CSS Selector*/}
                                <div className='atlasVoice-mt-4 atlasVoice-row'>
                                    <Button
                                        variant="primary"
                                        type={'submit'}
                                        id={'tts_bulk_mp3_file_generate_save_button'}
                                        style={{
                                            width: '100%',
                                            marginTop: '5px',
                                            backgroundColor: '#184c53',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Generate MP3 File
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
