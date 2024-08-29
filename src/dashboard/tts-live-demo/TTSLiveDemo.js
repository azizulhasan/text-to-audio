import React, {useState, useEffect} from 'react';
import {ToastContainer} from "react-toastify";
import {__} from '@wordpress/i18n';
import {Col, Container, Row, Form, FloatingLabel} from 'react-bootstrap';
import toast from '../components/context/Notify';
import {copyToClipBoard, postData, postWithoutImage} from '../components/context/utilities';
import TextToSpeech from '../buttons/components/TextToSpeech';
import TextToSpeechThree from '../buttons/components/TextToSpeechThree';
import TextToSpeechFour from '../buttons/components/TextToSpeechFour';
import CustomizationTabs from './CustomizationTabs'
import notify from "../components/context/Notify";


/**
 * Scripts
 */
import 'react-toastify/dist/ReactToastify.css';

let speech = null;
let TextToSpeechFree = null;
export default function TTSLiveDemo() {
    const [demoSettings, setDemoSettings] = useState({
        backgroundColor: '#1a4548',
        color: '#ffffff',
        width: '100',
        id: 1,
        tta__listening_voice: '',
        tta__listening_pitch: 2,
        tta__listening_rate: 1,
        tta__listening_volume: 1,
        tta__listening_lang: '',
    });
    const [demoSettings2, setDemoSettings2] = useState({
        backgroundColor: '#1a4548',
        color: '#ffffff',
        width: '100%',
        border: '0',
    });

    const [shortCode, setShortCode] = useState('[tta_listen_btn]');
    const [customCSS, setCustomCSS] = useState('');

    const [speakingText, setSpeakingText] = useState('');
    const [listeningSettings, setListeningSettings] = useState({});
    const [isGCAuthenticated, setGCIsAuthenticated] = useState(false);
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false)
    const [testingDemoContentMessage, setTestingDemoContentMessage] = useState('')

    useEffect(() => {
        /**
         * Get customize settings.
         */
        // let customize = new FormData();
        // customize.append('method', 'get');
        // postWithoutImage(tta_obj.api_url + 'tta/v1/customize', customize)
        //     .then((res) => {
        //         setDemoSettings(res.data);
        //         if (res.data.custom_css) {
        //             setCustomCSS(res.data.custom_css);
        //         }
        //         setShortCode(res.data.tta_play_btn_shortcode);
        //         setDemoSettings2({
        //             ...demoSettings2,
        //             ...{ backgroundColor: res.data.backgroundColor },
        //             ...{ color: res.data.color },
        //             ...{ width: [res.data.width, '%'].join('') },
        //         });
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });

        /**
         * Get listening settings.
         */
        let listening = new FormData();
        listening.append('method', 'get');
        // postWithoutImage(tta_obj.api_url + 'tta/v1/listening', listening)
        //     .then((res) => {
        //         setListeningSettings(res.data);
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });
        let initialText = 'The most user-friendly Text-to-Speech Accessibility plugin. Just install and automatically add a Text to Audio player to your WordPress site!'

        localStorage.setItem('demo_listening_content', initialText)
        setSpeakingText(initialText);

        setTimeout( async  () => {
            if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
                window.TTS.contents[1] = initialText;
                let Analytics =  new window.AtlasVoiceAnalytics(ttsObjPro.post_id)
                window.TTS.extra[1].title = await Analytics.getUniqueUserId();
            }
        }, 1000)


        if (window.hasOwnProperty('ttsObj') && ttsObj?.is_pro_active) {
            postData(ttsObj.api_url + 'tta_pro/v1/get_auth_file', {}, "GET")
                .then((res) => {
                    if (res?.is_authenticated) {
                        setGCIsAuthenticated(res.is_authenticated)
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false)
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }

    }, []);

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        if (
            e.target.name === 'width' &&
            (e.target.value > 100 || e.target.value < 0)
        ) {
            toast('Value should between 0-100');
            return;
        }


        /**
         * setCustomCSS
         */
        if (e.target.name == 'custom_css') {
            setCustomCSS(e.target.value);
            return;
        }

        // ChatGPT TTS player button settings
        // && demoSettings?.id == 3
        if (!['backgroundColor', 'width', 'color'].includes(e.target.name)) {

            let tempdemoSettings = structuredClone(demoSettings)

            tempdemoSettings = {
                ...tempdemoSettings,
                ...{[e.target.name]: e.target.value}
            }
            setDemoSettings({
                ...tempdemoSettings
            });

            if (e.target.name == 'tta__listening_voice') {
                window.TTS.settings.listening.tta__listening_voice = e.target.value;
                window.TTS.extra[1].voice = e.target.value;
                if(window?.TextToSpeechProPlayerGTTS) {
                    window.TextToSpeechProPlayerGTTS.voice = e.target.value;
                }

                if(ttsObjPro.player_id == 4) {
                    window.TTS.extra[1].file_name = window.TTS.extra[1].title + '__lang__'+ window.TTS.extra[1].language + '__voice__' + e.target.value;
                }

            }
            if (e.target.name == 'tta__listening_lang') {
                window.TTS.settings.listening.tta__listening_lang = e.target.value;
                window.TTS.extra[1].language = e.target.value;
                window.TTS.extra[1].file_url_key = e.target.value;
                window.TTS.extra[1].file_name = window.TTS.extra[1].title + '__lang__' + e.target.value;
                if(window?.TextToSpeechProPlayerGTTS) {
                    window.TextToSpeechProPlayerGTTS.selectedLang = e.target.value;
                    window.TextToSpeechProPlayerGTTS.title = window.TTS.extra[1].title + '__lang__' + e.target.value;
                }
            }

            if (e.target.name == 'id') {
                window.TTS.settings.fileURLs = {};
                ttsObjPro.player_id = e.target.value;
                window.TTS.settings.settings.customize.buttonSettings.id = e.target.value
                window.TTS.contents[1] = document.getElementById('tta__demo_text_for_play').value;
            }

            return;
        }

        /**
         * set button style for database.
         */
        setDemoSettings({
            ...demoSettings,
            ...{[e.target.name]: e.target.value},
        });
        /**
         * set button style for live preveiw.
         */
        let value = '';
        if (e.target.name === 'width') {
            let arr = [e.target.value, '%'];
            value = arr.join('');
        } else {
            value = e.target.value;
        }

        setDemoSettings2({
            ...demoSettings2,
            ...{[e.target.name]: value},
        });

    };

    useEffect(() => {
        let length = 'The most user-friendly Text-to-Speech Accessibility plugin. Just install and automatically add a Text to Audio player to your WordPress site!';
        // console.log({length: speakingText.length, testingDemoContentMessage, id: demoSettings.id})

    }, [speakingText])

    useEffect(() => {
        console.log(demoSettings)
    }, [demoSettings]);

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        /**
         * Get full form data and modify them for saving to database.
         */
        let form = new FormData(e.target);

        let formData = {};
        for (let [key, value] of form.entries()) {
            if (key !== 'custom_css') {
                if (key === '' || value === '') {
                    toast('Please fill the  field : ' + key);
                    return;
                }
            }
            if (!['backgroundColor', 'width', 'color'].includes(key)) {
                continue;
            }

            formData[key] = value;
        }

        formData['custom_css'] = customCSS;
        formData['tta_play_btn_shortcode'] = shortCode;

        console.log({formData})

        return;

        if (formData?.id == 4 && !isGCAuthenticated) {
            notify('To select this player you have to authenticate first from Integration menu', 'error', {
                autoClose: 8000,
            });
            return;
        }

        if (!ttsObj.is_pro_active && formData?.id > 1) {
            toast('This player is only available for pro version.', 'error');
            return;
        }


        if (formData?.id == 4 && (!isGCAuthenticated || !ttsObj.is_pro_active)) {
            toast('To use Google Cloud Text To Speech you have to authenticate first from integrations menu', 'error');
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable && formData?.id > 2 && !isBackUpToGCS) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', {autoClose: 10000})
            return
        }
        ;


        // console.log(formData);
        // return;
        let data = new FormData();
        data.append('fields', JSON.stringify(formData));
        data.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/customize', data)
            .then((res) => {
                setDemoSettings(res.data);
                toast('Customization saved. Now go to the "Listening" menu.', 'info', {
                    autoClose: 15000
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const callListeningFunction = (e) => {
        let text = document.getElementById('tta__demo_text_for_play').value;
        let button = document.getElementById('tta__listen_content');

        if (speech != null && speech.listenStatus == 'listen') {
            speech = null
            TextToSpeechFree = null
        }
        if (speech === null) {
            window.TTS.contents[1] = text
            TextToSpeechFree = window.TextToSpeech;
            speech = new TextToSpeechFree(1, text, button, window.TTS)
            speech._init()
            speech = speech.getData(false)
        } else {
            speech = speech.getData(false)
            if (speech.listenStatus == 'pause') {
                speech.pause(speech.speech)
            } else if (speech.listenStatus == 'resume') {
                speech.resume(speech.speech)
            }
        }

    };
    const setText = (e, buttonText = '') => {
        // TODO:: must validate
        let value = e.target.value;
        if (buttonText) {
            value = buttonText;
        }

        if (demoSettings.id == 3) {
            if (value.length > 599) {
                setTestingDemoContentMessage('You can\'t  generate more than 600 characters during demo testing with Google TTS Pro.')
                value = value.slice(0, 598);
            }
            setSpeakingText(value);
            localStorage.setItem('demo_listening_content', value);
            if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
                window.TTS.contents[1] = value;
            }
            return;
        }

        if (demoSettings.id == 4) {

            if (value.length > 149) {
                setTestingDemoContentMessage('You can\'t  generate more than 150 characters during demo testing with Google Cloud Text To Speech.')
                value = value.slice(0, 148);
            }
            setSpeakingText(value);
            localStorage.setItem('demo_listening_content', value);
            if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
                window.TTS.contents[1] = value;
            }
            return;
        }


        setSpeakingText(value);
        localStorage.setItem('demo_listening_content', value);
        if (window.hasOwnProperty('TTS') && window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active) {
            window.TTS.contents[1] = value;
        }
    };

    useEffect(() => {
        if(testingDemoContentMessage) {
            toast(testingDemoContentMessage, 'warn')
        }
    }, [testingDemoContentMessage]);


    const [buttonLists, setButtonLists] = useState([
        {id: 1, name: 'Default', object: 'TextToSpeech', disabled: false},
        {id: 2, name: 'Default Pro', object: 'TextToSpeechPro', disabled: false},
        {id: 3, name: 'Google TTS Pro', object: 'TextToSpeechPro', disabled: false},
        {id: 4, name: "Google Cloud TTS Pro", object: 'TextToSpeechPro', disabled: false},
        {id: 5, name: "ChatGPT TTS(Soon)", object: 'TextToSpeechPro', disabled: true},
    ])

    return (
        <Container>
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
            <Row className='mt-5'>
                <Col xs={12} sm={12} lg={8}>
                    <Row>
                        <Col xs={12} sm={12} lg={12} className='mb-3'>
                            {
                                demoSettings?.id == 2 ?
                                    <TextToSpeech buttonCSS={demoSettings}
                                                  button={<div dataId="1" id="tts__listent_content_1"
                                                               className='tts__listent_content'></div>} buttonId={2}/> :
                                    demoSettings?.id == 3 ? <TextToSpeechThree buttonCSS={demoSettings}
                                                                               button={<div dataId="1"
                                                                                            id="tts__listent_content_1"
                                                                                            className='tts__listent_content'></div>}
                                                                               buttonId={1}
                                                                               cssStyle={''}/> :
                                        demoSettings?.id == 4 ?
                                            <TextToSpeechFour buttonCSS={demoSettings}
                                                              button={<div dataId="1" id="tts__listent_content_1"
                                                                           className='tts__listent_content'></div>}
                                                              buttonId={1} cssStyle={''}/> :
                                            demoSettings?.id == 5 ?
                                                <TextToSpeechThree buttonCSS={demoSettings}
                                                                   button={<div dataId="1" id="tts__listent_content_1"
                                                                                className='tts__listent_content'></div>}
                                                                   buttonId={5} cssStyle={''}/> : (
                                                    <button
                                                        id='tta__listen_content'
                                                        onClick={(e) => callListeningFunction(e)}
                                                        style={demoSettings2}
                                                        type='button'
                                                        title='Text To Audio:  Tap to listen post.'>
                                                        <span className='dashicons dashicons-controls-play'></span>{' '}
                                                        {tta_obj.buttonTextArr.listen_text}
                                                    </button>
                                                )
                            }
                            <p className='pt-2'>
                                {
                                    demoSettings?.id == 4 && ttsObjPro.is_pro_active ? __('You have to configure Google Cloud Text To Speech to use this player.') : demoSettings?.id < 3 ? " This player is based on speechSynthesis browser API. So, It may behave inconsistent on different devices and browsers." : ""
                                }
                            </p>
                        </Col>
                        <Col xs={12} sm={12} lg={12} className='mb-3'>
                            <>
                                <FloatingLabel
                                    controlId='tta__demo_text_for_play'
                                    label='Write here something and click listen button.'>
                                    <Form.Control
                                        as='textarea'
                                        onChange={(e) => setText(e)}
                                        onPaste={(e) => setText(e)}
                                        onFocus={(e) =>
                                            toast('Write something here.')
                                        }
                                        value={speakingText ? speakingText : ''}
                                        placeholder='Write here something and click listen button.'
                                        style={{height: '300px'}}
                                        row={10}
                                    />
                                </FloatingLabel>
                                <p className='pt-2'>
                                    {
                                        testingDemoContentMessage ?? ''
                                    }
                                </p>
                            </>
                        </Col>
                    </Row>
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <CustomizationTabs buttonLists={buttonLists} customCSS={customCSS} handleSubmit={handleSubmit}
                                       demoSettings={demoSettings} handleChange={handleChange}
                                       listeningSettings={listeningSettings}/>
                </Col>
            </Row>
        </Container>
    );
}
