import React, {useState, useEffect} from 'react';
import {
     Form, Row, Col, Container,

    Button, Accordion, Alert
} from 'react-bootstrap';
import {ToastContainer} from 'react-toastify';
import {__, _n, sprintf} from '@wordpress/i18n';
import Icon from '../components/Icon';
/**
 * Scripts
 */
import 'react-toastify/dist/ReactToastify.css';

/**
 *
 * Scripts
 */
import {postWithoutImage, getMultilingualActiveLanguages} from '../components/context/utilities';
// TTS-354: the run's state for the message on the page (replaces a browser pop-up).
import {idleRun, startRun, stepRun, outcomeOf} from './bulkRun';

export default function GenerateBulkMp3File({postId, language, selectedLang, isRegenerateFile}) {
    const [settings, setSettings] = useState({
        tts_regenerate_mp3_files: false
    });
    const [multilingualActiveLanguages, setMultilingualActiveLanguages] = useState([]);


    const [postIDs, setPostIDs] = useState([]);
    const [postContents, setPostContents] = useState([])
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    // TTS-354: how far the run is: total, made, failed; shown on the page.
    const [run, setRun] = useState(idleRun())

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

        if (run.status === 'running') {
            return;
        }

        if (Object.keys(postContents).length) {
            let mp3FileGenerateCount = 0;
            if (settings.tts_regenerate_mp3_files) {
                if (!confirm(__('Make the audio of these posts again? Their current MP3 files are replaced.', 'text-to-audio'))) {
                    return;
                }
            }
            setRun(startRun(Object.keys(postContents).length));
            for (let postId of Object.keys(postContents)) {
                let postSettings = postContents[postId];
                postSettings.settings.is_regenerate_file = settings.tts_regenerate_mp3_files;
                console.log(postSettings)

                // TTS-237: Clear the shared #player_content_1 container before
                // instantiating the next BulkMP3File. The parent class's
                // #ttsLoader() APPENDS a loader node into this container, so
                // without clearing between iterations, loaders from previous
                // posts pile up in the DOM (bug: 4 loaders visible at once).
                // Clearing here keeps exactly one loader visible at a time and
                // makes the sequential generation obvious to the user.
                let playerContent = document.getElementById('player_content_1');
                if (playerContent) {
                    playerContent.innerHTML = '';
                }

                let bulkMP3File = await new BulkMP3File(postSettings)
                console.log({mp3file: bulkMP3File.fileURL})
                const madeBefore = mp3FileGenerateCount;
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
                    } else if (ttsObjPro.player_id == 6) {
                        let mp3File = await bulkMP3File.init_elevenlabs(1)
                        if (mp3File) {
                            mp3FileGenerateCount++;
                            setPostURL(mp3File, mp3FileGenerateCount, postId)
                        }
                    } else if (ttsObjPro.player_id == 7) {
                        // TTS-266: AtlasVoice Cloud.
                        let mp3File = await bulkMP3File.init_atlasvoice(1)
                        if (mp3File) {
                            mp3FileGenerateCount++;
                            setPostURL(mp3File, mp3FileGenerateCount, postId)
                        }
                    }
                } else {
                    mp3FileGenerateCount++;
                    setPostURL(bulkMP3File.fileURL, mp3FileGenerateCount, postId)
                }

                // TTS-354: a post that could not be made counts too, so the run always ends.
                setRun((current) => stepRun(current, mp3FileGenerateCount > madeBefore));
            }

            // The loader of the last post is not needed any more.
            let playerContent = document.getElementById('player_content_1');
            if (playerContent) {
                playerContent.innerHTML = '';
            }
        }

    };

    function setPostURL(mp3File, mp3FileGenerateCount, postId) {
        // TTS-237: Use functional setState so each iteration merges into the
        // LATEST state instead of the stale closure snapshot of `postContents`
        // captured at handleSubmit time. Previous code did
        // `structuredClone(postContents)` which always cloned the initial
        // snapshot, so every setPostContents() call wiped the previous
        // iteration's URL — end result: only one accordion showed the eye
        // icon. Functional form guarantees prev === latest committed state.
        setPostContents(prev => {
            let parsedContents = structuredClone(prev);
            let postSettings = parsedContents[postId];
            let urls = postSettings.settings.fileURLs || {};
            let file_url_key = postSettings.extra[1].file_url_key;
            // TTS-237: Spread order fix. Previously `...urls` came AFTER the
            // new key, so an existing URL for this language would shadow the
            // freshly generated one. New key must win → spread `...urls`
            // first, then override with the new key.
            postSettings.settings.fileURLs = {
                ...urls,
                [file_url_key]: mp3File,
            };
            parsedContents[postId] = postSettings;
            return parsedContents;
        });

        // TTS-354: how far the run is, and how it ended, is said on the page
        // (runMessage below), not in a browser pop-up that blocks the page.
    }

    /**
     * TTS-354: the line under the button: how far the run is, or how it ended.
     *
     * @return {Object|null} { variant, text }, or null before a run.
     */
    function runMessage() {
        if (run.status === 'running') {
            const done = run.made + run.failed;

            return {
                variant: 'info',
                text: sprintf(
                    /* translators: 1: posts finished so far, 2: number of posts. */
                    __('Making the audio… %1$d of %2$d posts done. Keep this page open until it finishes.', 'text-to-audio'),
                    done,
                    run.total
                ),
            };
        }

        const outcome = outcomeOf(run);
        if (outcome === 'all') {
            return {
                variant: 'success',
                text: sprintf(
                    /* translators: %d: number of posts. */
                    _n('The audio of %d post is ready.', 'The audio of all %d posts is ready.', run.total, 'text-to-audio'),
                    run.total
                ),
            };
        }
        if (outcome === 'some' || outcome === 'none') {
            return {
                variant: outcome === 'some' ? 'warning' : 'danger',
                text: sprintf(
                    /* translators: 1: posts with audio, 2: number of posts, 3: posts without audio. */
                    _n(
                        '%1$d of %2$d posts have audio. %3$d post could not be made; the posts marked with a cross can be tried again.',
                        '%1$d of %2$d posts have audio. %3$d posts could not be made; the posts marked with a cross can be tried again.',
                        run.failed,
                        'text-to-audio'
                    ),
                    run.made,
                    run.total,
                    run.failed
                ),
            };
        }

        return null;
    }

    const message = runMessage();

    // The screen is given no language: the site's own comes with Pro's data on
    // the page. Before, the text said "The site language is undefined".
    const siteLanguage = selectedLang || window?.ttsObjPro?.site_locale || window?.ttsObjPro?.language || '';
    const contentHint = siteLanguage
        ? sprintf(
            /* translators: %s: the site's language, for example en-US. */
            __('The site language is %s. To make the MP3 file in another language, paste the translated text here and choose the language, then make the MP3 file.', 'text-to-audio'),
            siteLanguage
        )
        : __('To make the MP3 file in another language, paste the translated text here and choose the language, then make the MP3 file.', 'text-to-audio');

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
                            {__('How it works?', 'text-to-audio')} <a style={{textDecoration: 'none',}} className={'text-danger'} target='_blank'
                                             href='https://www.youtube.com/watch?v=HFoqlkPCP80'>
                                                            <Icon name="youtube" /></a>
                        </Col>
                        <Col bsPrefix="atlasVoice" xs={12} sm={12} lg={8}>
                            <div id={"player_content_1"}></div>
                        </Col>

                    </div>
                    {/* Add Button or Player Automatically */}
                    <Row className=' mt-3'>
                        <Col xs={12} sm={6} lg={4}>
                            <Form.Label htmlFor='tta__settings_enable_button_add'>
                                {__('Make the audio of these posts again', 'text-to-audio')}
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
                                                                        <Icon name="check-circle" /> :
                                                                        <Icon name="times" />
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
                                                                        placeholder={contentHint}
                                                                    />
                                                                </Form.Group>
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    </Accordion>
                                                    {
                                                        Object.keys(urls).length && Object.keys(urls).includes(file_url_key) ?
                                                        <a className={'px-2'} href={postURL} target={'_blank'}><Icon name="eye" /></a>: ''
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
                                        disabled={run.status === 'running'}
                                        style={{
                                            width: '100%',
                                            marginTop: '5px',
                                            backgroundColor: '#184c53',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {run.status === 'running'
                                            ? __('Making the audio…', 'text-to-audio')
                                            : __('Generate MP3 files', 'text-to-audio')}
                                    </Button>
                                </div>
                                {/* TTS-354: read out by screen readers when it changes; stays until the next run. */}
                                <div role="status" aria-live="polite" className={'atlasVoice-mt-3'}>
                                    {message && (
                                        <Alert variant={message.variant} className={'mb-0'}>
                                            {message.text}
                                        </Alert>
                                    )}
                                </div>
                            </Form>
                        </Col>
                    </div>
                </Container>
            </React.Fragment>
            :
            <h1>{__('Loading…', 'text-to-audio')}</h1>

    );
}
