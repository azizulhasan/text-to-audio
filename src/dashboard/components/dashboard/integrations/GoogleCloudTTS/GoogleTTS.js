import React, { useEffect, useState, useMemo } from 'react';
import { Form, Row, Col, Container, Tooltip, OverlayTrigger, Button } from 'react-bootstrap';
import { postData } from '../../../context/utilities';
import toast from '../../../context/Notify';
import UpgradeToPro from '../../../UpgradeToPro';

export default function GoogleTTS({ getShouldCheckChatGPT, currentTTSServic }) {

    const [googTTSJsonFile, setGoogTTSJsonFile] = useState('');
    const [authFile, setAuthFile] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false)
    const [bucketName, setBucketName] = useState('')
    const [isValidBucketName, setIsValidBucketName] = useState(false)
    const [storedBucketName, setStoredBucketName] = useState('')


    const apiURL = useMemo(() => {
        return ttsObj.api_url + ttsObj.api_namespace + "_pro" + "/" + ttsObj.api_version + "/";
    }, [window]);

    /**
     * handle change
     * @param {*} e
     */
    const handleChange = (e) => {
        if (e.target.name == 'tta__integration_is_backup_to_gogole_drive') {
            let shouldUpdate = true;
            if (e.target.checked) {
                if (!isAuthenticated) {
                    if (!googTTSJsonFile) {
                        toast('Backup MP3 Files To Google Cloud Storage Can Be Enabled If Google Text To Speech Is Authenticated.', 'error', {
                            position: 'top-center',
                            autoClose: 10000,
                        });
                        shouldUpdate = false;
                    }
                }

            }
            if (shouldUpdate) {
                console.log(e.target.checked)
                setIsBackUpToGCS(e.target.checked)
            }

        } else if (e.target.name == 'tta__integration_google_storage_folder_name') {
            setBucketName(e.target.value)
        } else {
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
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    Learn More
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
            return;
        }

        if (window.hasOwnProperty('ttsObjPro') && !ttsObjPro.is_pro_license_active) {
            toast(<>
                <h4>Google cloud text to speech feature is only in pro version.</h4>
                <button onClick={(e) => {
                    window.open('https://atlasaidev.com/plugins/text-to-speech-pro/pricing/')
                }} className='tta_btn'>
                    Buy Now
                </button>
            </>, 'info', {
                position: 'top-center',
                autoClose: 10000,
            });
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

        if (isBackUpToGCS && !bucketName) {
            toast("Please create a valid bucket name first", 'error', { autoClose: 10000 })
            return
        }



        let data = new FormData();
        data.append('auth_file', googTTSJsonFile[0]);
        data.append('tts_is_backup_mp3_file', isBackUpToGCS);
        data.append('bucket_name', bucketName);
        data.append('method', 'post');
        for (let val of data.values()) {
            console.log({ val })
        }
        // return;
        postData(apiURL + 'upload_file', data)
            .then((res) => {
                if (res.status) {
                    toast('File uploaded successfully. Now go to the "Customization" menu.', 'info', {
                        autoClose: 15000
                    });
                    setIsAuthenticated(res.status)
                    if (res?.tts_is_backup_mp3_file == 'true') {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false);
                    }

                    if (res?.bucket_name) {
                        setBucketName(res?.bucket_name || '');
                    }
                } else {
                    if (res?.bcmath) {
                        toast(bcmathNotice(), 'error', {
                            autoClose: 8000,
                        });
                    } else {
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
                    if (res?.tts_is_backup_mp3_file == 'true') {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false);
                    }

                    if (!res?.is_authenticated) {
                        getShouldCheckChatGPT(true);
                    }

                    if (res?.bucket_name) {
                        setBucketName(res?.bucket_name || '');
                        setStoredBucketName(res?.bucket_name)
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
            toast('You are already authenticated');
            return;
        }
        postData(apiURL + 'authenticate', JSON.stringify({ file: authFile }))
            .then((res) => {
                if (res.auth_url) {
                    window.open(res.auth_url);
                } else if (res.access_token) {
                    toast('You are already authenticated');
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
            toast('You have to be authenticated to revoke.');
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

    const validateBucketName = (e) => {
        e.preventDefault();

        if (bucketName == storedBucketName) {
            toast('This bucket is already have to your cloud storage.', 'info', {
                position: 'top-center',
                autoClose: 4000,
            });
            return;
        } else {

            if (storedBucketName && bucketName != storedBucketName) {
                if (!confirm(`Are you sure that, you want to create a bucket with this name ${bucketName} . Even though you already have a bucket with the name ${storedBucketName}. Because once you create new bucket then all of the mp3 file will generate again. So decide carefully.`)) {
                    return;
                }
            }

            setIsValidBucketName(false)
        }

        let data = new FormData();
        data.append('bucket_name', bucketName);
        data.append('method', 'post');
        for (let val of data.values()) {
            console.log({ val })
        }
        postData(apiURL + 'validate_bucket_name', data)
            .then((res) => {
                setIsValidBucketName(res)
                if (res?.status) {
                    setStoredBucketName(bucketName)
                }
            })
            .catch((err) => {
                console.log(err);
            });

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
                                        Select Google Service Account Authentication Json file. How to get? Click <a target='_blank' href='https://www.youtube.com/watch?v=yIAnL7W9kr8'>here</a>.
                                        <br />
                                        <br />
                                        <a target='_blank' href='https://www.youtube.com/watch?v=yIAnL7W9kr8'>How To Integrate Google Text To Speech With AtlasVoice Pro WordPress Plugin?</a>
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
                                                isAuthenticated ? <><strong>Google Text To Speech Authentication Done. Enjoy the Google Cloud TTS features of the plugin.</strong></> : <><strong>Please upload a service account  .json file to authenticate Google Text To Speech.</strong></>
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
                            {/* Bckup mp3 fils. */}
                            <Col xs={12} sm={12} lg={12} >
                                <Row className=' mt-3'>
                                    <Col xs={12} sm={6} lg={4}>
                                        <Form.Label htmlFor='tta__integration_is_backup_to_gogole_drive'>
                                            Instead of storing MP3 file to uploads folder, Store MP3 Files To Google Cloud Storage.
                                        </Form.Label>
                                        {
                                            isBackUpToGCS && <Form.FloatingLabel className={'text-danger'} label={'You must give this service account read, write access. Otherwise may cause errors.'} >
                                            </Form.FloatingLabel>
                                        }
                                    </Col>
                                    <Col xs={12} sm={12} lg={6}>
                                        <Form.Check // prettier-ignore
                                            type={'checkbox'}
                                            checked={isBackUpToGCS}
                                            onChange={(e) => handleChange(e)}
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
                                                    <Button onClick={(e) => {
                                                        e.preventDefault();
                                                        window.open('https://atlasaidev.com/docs/text-to-speech/usage-setup/how-to-enable-automatic-backup-to-google-cloud-storage-for-text-to-speech-pro-plugin/', '_blank')
                                                    }} className='tta_question_btn'>?</Button>
                                                </OverlayTrigger>
                                            ))}
                                        </>
                                    </Col>
                                </Row>
                            </Col>
                            {/* Backup folder name. */}
                            {
                                isBackUpToGCS && <Col xs={12} sm={12} lg={12} >
                                    <Row className=' mt-3'>
                                        <Col xs={12} sm={6} lg={4}>
                                            <Form.Label htmlFor='tta__integration_google_storage_folder_name'>
                                                Create And Validate Bucket Name.
                                            </Form.Label>
                                        </Col>
                                        <Col xs={12} sm={12} lg={6}>
                                            {/* Row for input + button */}
                                            <div className="d-flex gap-2">
                                                <input
                                                    type="text"
                                                    onChange={handleChange}
                                                    value={bucketName}
                                                    className="form-control"
                                                    name="tta__integration_google_storage_folder_name"
                                                    id="tta__integration_google_storage_folder_name"
                                                />
                                                <Button onClick={validateBucketName} className="tta_btn">
                                                    Create Bucket
                                                </Button>
                                            </div>

                                            {/* Message area */}
                                            {isValidBucketName?.message && (
                                                <p className="mt-2 mb-0">{isValidBucketName.message}</p>
                                            )}
                                        </Col>

                                        <Col xs={12} sm={12} lg={2}>
                                            <>
                                                {['top'].map((placement) => (
                                                    <OverlayTrigger
                                                        key={placement}
                                                        placement={placement}
                                                        overlay={
                                                            <Tooltip id={`tooltip-${placement}`}>
                                                                Click Here To Know Buckek Name Rules.
                                                            </Tooltip>
                                                        }>
                                                        <Button onClick={(e) => {
                                                            e.preventDefault();
                                                            window.open('https://cloud.google.com/storage/docs/buckets#naming', '_blank')
                                                        }} className='tta_btn'>?</Button>
                                                    </OverlayTrigger>
                                                ))}
                                            </>
                                        </Col>
                                    </Row>
                                </Col>
                            }
                            <div className='mx-auto mt-5 mb-4'>
                                <button type='submit' className='tta_btn'>
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
