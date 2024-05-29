import React, { useEffect, useState, useMemo } from 'react';
import { Form, Row, Col, Container, Tooltip, OverlayTrigger, Button } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';
import UpgradeToPro from '../../../UpgradeToPro';

export default function GoogleTTS({ getCurrentTTSService, currentTTSServic }) {

    const [googTTSJsonFile, setGoogTTSJsonFile] = useState('');
    const [authFile, setAuthFile] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false)


    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        if(e.target.name == 'tta__integration_is_backup_to_gogole_drive') {
            let shouldUpdate = true;
            if(e.target.checked) {
                if(!isAuthenticated ) {
                    if(!googTTSJsonFile) {
                        toast('Backup MP3 Files To Google Cloud Storage Can Be Enabled If Google Text To Speech Is Authenticated.', 'error', {
                            position: 'top-center',
                            autoClose: 10000,
                        });
                        shouldUpdate = false;
                    }
                }
                
            }
            if(shouldUpdate) {
                console.log(e.target.checked)
                setIsBackUpToGCS(e.target.checked)
            }
            
        }else{
            console.log(e.target.files)
            setGoogTTSJsonFile(e.target.files);
        }
    };

    /**
     * Handle form Submit
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!window.hasOwnProperty('ttsObjPro')) {
            toast(<>
                <h4>Google cloud text to speech feature is only in pro version.</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/docs/')
                }} className='tta_btn'>
                    Learn More
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }


        // if (isAuthenticated) {
        //     toast('You are already authenticated. To add new service account please remove access first')
        //     return
        // }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_pro_license_active) {
            toast('Please Activate the Text To Speech Pro license to enjoy full features of the plugin.');
            return;
        }
        // if (!googTTSJsonFile) {
        //     toast('Please select file')
        //     return
        // };

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_folder_writable && !isBackUpToGCS) {
            toast("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'error', { autoClose: 10000 })
            return
        };



        let data = new FormData();
        data.append('auth_file', googTTSJsonFile[0]);
        data.append('tts_is_backup_mp3_file', isBackUpToGCS);
        data.append('method', 'post');
        for(let val of data.values()) {
            console.log({val})
        }
        // return;
        postData(apiURL + 'upload_file', data)
            .then((res) => {
                if (res.status) {
                    toast('File uploaded successfully');
                    setIsAuthenticated(res.status)
                    if(res?.tts_is_backup_mp3_file == 'true') {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file|| false);
                    }
                } else {
                    if(res?.bcmath) {
                        toast(bcmathNotice(), 'error', {
                            autoClose: 8000,
                        });
                    }else{
                        toast(res?.message || 'Something went wrong!');
                    }
                }

            })
            .catch((err) => {
                console.log(err);
            });
    };



    useEffect(() => {
        if (ttsObj.is_pro_active) {
            postData(apiURL + 'get_auth_file', {}, 'GET')
                .then((res) => {
                    
                    setAuthFile(res.file)
                    setIsAuthenticated(res.is_authenticated)
                    if(res?.tts_is_backup_mp3_file == 'true') {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file|| false);
                    }
                    
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [])
    const authenticateTTS = (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            toast('You are already athenticated');
            return;
        }
        postData(apiURL + 'authenticate', JSON.stringify({ file: authFile }))
            .then((res) => {
                if (res.auth_url) {
                    window.open(res.auth_url);
                } else if (res.access_token) {
                    toast('You are already athenticated');
                    setIsAuthenticated(true)
                }
                else {
                    toast('Something went wrong');
                }

            })
            .catch((err) => {
                console.log(err);
            });
    }


    const revokeAccessToken = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast('You have to be athenticated to revoke.');
            return;
        }
        let delete_file = false;
        if (confirm('Do you want to revoke access and delete the file uploaded during authentication. If you delete the file you have to upload the file again. Make sure you have a backup otherwise, you have to crete another auth file from Google Cloud text to speech.')) {
            delete_file = true;
        }

        if (!delete_file) {
            return;
        }

        postData(apiURL + 'revoke_access_token', '', 'GET')
            .then((res) => {
                if (res) {
                    toast('Authentication removed.')
                    setIsAuthenticated(false)
                } else {
                    toast('Something went wrong');
                }

            })
            .catch((err) => {
                console.log(err);
            });
    }

    const bcmathNotice = () => {
        return <>
            BCMath extension is not enabled. Please enable this extension. Learn more how to enable.
                <a target='_blank' href="https://atlasaidev.com/docs/text-to-speech/usage-setup/bcmath/" >Learn More</a>
            </>
        
    }

    return (
        <Container>
            <Row>
                <Col xs={12} sm={12} lg={8}>
                    <Form onSubmit={handleSubmit}>
                        <Row className='border '>
                            <Col xs={12} sm={12} lg={12} className=''>
                                <Form.Group>
                                    <Form.Label htmlFor='googTTSJsonFile'>
                                        Select Google Service Acount Authentication Json file. How to get? Click <a target='_blank' href='https://clincher.medium.com/how-to-use-a-google-cloud-ai-powered-text-to-speech-rest-service-b1980b2c6b7a'>here</a>.
                                        <br />
                                        <a target='_blank' href='https://cloud.google.com/text-to-speech/docs/before-you-begin'>Read More</a>
                                        <br/>
                                        <br/>
                                        <a target='_blank' href='https://www.youtube.com/watch?v=4dsbhaBavms&t=43s&ab_channel=AtlasAiDev'>How To Integrate Google Cloud Text To Speech?</a>
                                    </Form.Label>
                                    <Form.Control
                                        type='file'
                                        id='googTTSJsonFile'
                                        onChange={handleChange}
                                        name='googTTSJsonFile'
                                        placeholder='googTTSJsonFile'
                                    />
                                    <div className={isAuthenticated ? 'text-green' : 'text-danger'} >
                                        {
                                            window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active ?
                                                isAuthenticated ? <><strong>Google Text To Speech Authentication Done. Enjoy the Google Cloud TTS featuers of the plugin.</strong></> : <><strong>Please upload a service account  .json file to authenticate Google Text To Speech.</strong></>
                                                : <><strong>Notice:</strong> <p className='text-danger d-inline'>License must be active and valid to enjoy Google Cloud Text To Speech features of the plugin.</p>
                                                    {
                                                        isAuthenticated && <>
                                                            <br />
                                                            <strong>Google Text To Speech Authentication Done</strong>
                                                        </>
                                                    }
                                                </>
                                        }
                                    </div>
                                </Form.Group>
                            </Col>
                            {/* Stop Auto Play After Switching Tab. */}
                            <Col xs={12} sm={12} lg={12} >
                                <Row className=' mt-3'>
                                    <Col xs={12} sm={6} lg={4}>
                                        <Form.Label htmlFor='tta__integration_is_backup_to_gogole_drive'>
                                        Backup MP3 Files To Google Cloud Storage.
                                        </Form.Label>
                                    </Col>
                                    <Col xs={12} sm={12} lg={6}>
                                        <Form.Check // prettier-ignore
                                            type={'checkbox'}
                                            checked={isBackUpToGCS}
                                            onChange={(e)=>handleChange(e)}
                                            name={`tta__integration_is_backup_to_gogole_drive`}
                                            id={`tta__integration_is_backup_to_gogole_drive`}
                                        />
                                    </Col>
                                    <Col xs={12} sm={12} lg={2}>
                                    <>
									{['top'].map((placement) => (
										<OverlayTrigger
											key={placement}
											placement={placement}
											overlay={
												<Tooltip id={`tooltip-${placement}`}>
													Click Here To Know How To Enable Automatic Backup To Google Cloud Storage For Text To Speech Pro Plugin?
												</Tooltip>
											}>
											<Button onClick={(e)=>{
                                                e.preventDefault();
                                                window.open('https://atlasaidev.com/docs/text-to-speech/usage-setup/how-to-enable-automatic-backup-to-google-cloud-storage-for-text-to-speech-pro-plugin/', '_blank')
                                            }} className='tta_btn'>?</Button>
										</OverlayTrigger>
									))}
								</>
                                    </Col>
                                </Row>
							</Col>
                            <div className='d-grid gap-3 col-2 mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn btn-center'>
                                    Save
                                </button>
                            </div>
                        </Row>
                    </Form>
                    {
                        window.hasOwnProperty('ttsObjPro') && ttsObjPro.is_pro_license_active && isAuthenticated && <button onClick={(e) => revokeAccessToken(e)} className='tta_btn btn-center' style={{ marginLeft: '20px' }}>
                            Remove Authentication
                        </button>
                    }
                </Col>
                <Col xs={12} sm={12} lg={4}>
                    <UpgradeToPro />
                </Col>
            </Row >
        </Container>
    );
}
