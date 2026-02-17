import React, {useEffect, useState, useMemo} from "react";
import {
    Form,
    Row,
    Col,
    Button,
    Alert,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import {postData} from "../../../context/utilities";
import toast from "../../../context/Notify";
import {__, sprintf} from '@wordpress/i18n';

export default function GoogleTTS({getShouldCheckChatGPT, setCurrentTTSServic, setAuthenticatedServices, setGoogleTTSChecked}) {
    const [googTTSJsonFile, setGoogTTSJsonFile] = useState("");
    const [authFile, setAuthFile] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isBackUpToGCS, setIsBackUpToGCS] = useState(false);
    const [bucketName, setBucketName] = useState("");
    const [isValidBucketName, setIsValidBucketName] = useState(false);
    const [storedBucketName, setStoredBucketName] = useState("");
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const apiURL = useMemo(() => {
        return (
            ttsObj.api_url +
            ttsObj.api_namespace +
            "_pro" +
            "/" +
            ttsObj.api_version +
            "/"
        );
    }, [window]);

    const handleChange = (e) => {
        if (e.target.name == "tta__integration_is_backup_to_gogole_drive") {
            let shouldUpdate = true;
            if (e.target.checked) {
                if (!isAuthenticated) {
                    if (!googTTSJsonFile) {
                        toast(
                            __("Backup MP3 Files To Google Cloud Storage Can Be Enabled If Google Text To Speech Is Authenticated.", 'text-to-audio'),
                            "error",
                            {
                                position: "top-center",
                                autoClose: 10000,
                            }
                        );
                        shouldUpdate = false;
                    }
                }
            }
            if (shouldUpdate) {
                setIsBackUpToGCS(e.target.checked);
            }
        } else if (e.target.name == "tta__integration_google_storage_folder_name") {
            setBucketName(e.target.value);
        } else {
            setGoogTTSJsonFile(e.target.files);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!window.hasOwnProperty("ttsObjPro")) {
            toast(
                <>
                    <h4>{__('Google cloud text to speech feature is only in pro version.', 'text-to-audio')}</h4>
                    <button
                        onClick={(e) => {
                            window.open(
                                "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                            );
                        }}
                        className="tta_btn"
                    >
                        {__('Learn More', 'text-to-audio')}
                    </button>
                </>,
                "info",
                {
                    position: "top-center",
                    autoClose: 10000,
                }
            );
            return;
        }

        if (
            window.hasOwnProperty("ttsObjPro") &&
            !ttsObjPro.is_pro_license_active
        ) {
            toast(
                <>
                    <h4>{__('Google cloud text to speech feature is only in pro version.', 'text-to-audio')}</h4>
                    <button
                        onClick={(e) => {
                            window.open(
                                "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                            );
                        }}
                        className="tta_btn"
                    >
                        {__('Buy Now', 'text-to-audio')}
                    </button>
                </>,
                "info",
                {
                    position: "top-center",
                    autoClose: 10000,
                }
            );
            return;
        }

        if (
            window.hasOwnProperty("ttsObjPro") &&
            !ttsObjPro.is_folder_writable &&
            !isBackUpToGCS
        ) {
            toast(
                __("Text To Speech plugin store's synthesized content into uploads folder. Your uploads folder is not writable. Please make uploads folder writable to enjoy the whole features of the plugin.", 'text-to-audio'),
                "error",
                {autoClose: 10000}
            );
            return;
        }

        if (isBackUpToGCS && !bucketName) {
            toast(__("Please create a valid bucket name first", 'text-to-audio'), "error", {
                autoClose: 10000,
            });
            return;
        }

        let data = new FormData();
        data.append("auth_file", googTTSJsonFile[0]);
        data.append("tts_is_backup_mp3_file", isBackUpToGCS);
        data.append("bucket_name", bucketName);
        data.append("method", "post");

        postData(apiURL + "upload_file", data)
            .then((res) => {
                if (res.status) {
                    toast(
                        __('File uploaded successfully. Now go to the "Customization" menu.', 'text-to-audio'),
                        "info",
                        {
                            autoClose: 15000,
                        }
                    );
                    setIsAuthenticated(res.status);
                    if (res?.tts_is_backup_mp3_file == "true") {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false);
                    }
                    if (res?.bucket_name) {
                        setBucketName(res?.bucket_name || "");
                    }

                    // Update authenticated services
                    setAuthenticatedServices(prev => {
                        if (prev.includes('google_cloud_tts')) return prev;
                        return [...prev, 'google_cloud_tts'];
                    });

                    setCurrentTTSServic('google_cloud_tts');

                } else {
                    if (res?.bcmath) {
                        toast(bcmathNotice(), "error", {
                            autoClose: 8000,
                        });
                    } else {
                        toast(res?.message || __("Something went wrong", 'text-to-audio'));
                    }
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        if (ttsObj.is_pro_active) {
            postData(apiURL + "get_auth_file", {}, "GET")
                .then((res) => {
                    setAuthFile(res.file);
                    setIsAuthenticated(res.is_authenticated);
                    if (res?.tts_is_backup_mp3_file == "true") {
                        setIsBackUpToGCS(res?.tts_is_backup_mp3_file || false);
                    }
                    if (res?.is_authenticated) {
                        setAuthenticatedServices(prev => {
                            if (prev.includes('google_cloud_tts')) return prev;
                            return [...prev, 'google_cloud_tts'];
                        })
                        
                        // Only set as active on FIRST load, not subsequent re-renders
                        if (!hasLoadedOnce && res?.currentTTSServic === 'google_cloud_tts') {
                            setCurrentTTSServic('google_cloud_tts');
                        }
                    }
                    getShouldCheckChatGPT(true);

                    if (res?.bucket_name) {
                        setBucketName(res?.bucket_name || "");
                        setStoredBucketName(res?.bucket_name);
                    }
                    
                    // Signal that Google TTS check is complete
                    if (setGoogleTTSChecked) {
                        setGoogleTTSChecked(true);
                    }
                    setHasLoadedOnce(true);
                })
                .catch((err) => {
                    console.log(err);
                    // Signal completion even on error
                    if (setGoogleTTSChecked) {
                        setGoogleTTSChecked(true);
                    }
                    setHasLoadedOnce(true);
                });
        } else {
            // Not pro active, signal completion
            if (setGoogleTTSChecked) {
                setGoogleTTSChecked(true);
            }
            setHasLoadedOnce(true);
        }
    }, []);

    const authenticateTTS = (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            toast(__("You are already authenticated", 'text-to-audio'));
            return;
        }
        postData(apiURL + "authenticate", JSON.stringify({file: authFile}))
            .then((res) => {
                if (res.auth_url) {
                    window.open(res.auth_url);
                } else if (res.access_token) {
                    toast(__("You are already authenticated", 'text-to-audio'));
                    setIsAuthenticated(true);
                } else {
                    toast(__("Something went wrong", 'text-to-audio'));
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const revokeAccessToken = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast(__("You have to be authenticated to revoke.", 'text-to-audio'));
            return;
        }
        let delete_file = false;
        if (
            confirm(
                __("Do you want to revoke access and delete the file uploaded during authentication. If you delete the file you have to upload the file again. Make sure you have a backup otherwise, you have to crete another auth file from Google Cloud text to speech.", 'text-to-audio')
            )
        ) {
            delete_file = true;
        }

        if (!delete_file) {
            return;
        }

        postData(apiURL + "revoke_access_token", "", "GET")
            .then((res) => {
                if (res) {
                    toast(__("Authentication removed.", 'text-to-audio'));
                    setIsAuthenticated(false);
                    // Remove from authenticated services
                    setAuthenticatedServices(prev => 
                        prev.filter(service => service !== 'google_cloud_tts')
                    );

                    setCurrentTTSServic("");

                } else {
                    toast(__("Something went wrong", 'text-to-audio'));
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const bcmathNotice = () => {
        return (
            <>
                {__("BCMath extension is not enabled. Please enable this extension. Learn more how to enable.", "text-to-audio")}
                <a
                    target="_blank"
                    href="https://atlasaidev.com/docs/text-to-speech/usage-setup/bcmath/"
                >
                    {__("Learn More", "text-to-audio")}
                </a>
            </>
        );
    };

    const validateBucketName = (e) => {
        e.preventDefault();

        if (bucketName == storedBucketName) {
            toast(__("This bucket is already have to your cloud storage.", 'text-to-audio'), "info", {
                position: "top-center",
                autoClose: 4000,
            });
            return;
        } else {
            if (storedBucketName && bucketName != storedBucketName) {
                /* translators: 1: New bucket name, 2: Existing bucket name */
                const message = sprintf( __( 'Are you sure you want to create a bucket named "%1$s"? You already have a bucket named "%2$s". If you create a new bucket, all MP3 files will be generated again. Please decide carefully.', 'text-to-audio' ), bucketName, storedBucketName );

                if ( ! confirm( message ) ) {
                    return;
                }
            }
            setIsValidBucketName(false);
        }

        let data = new FormData();
        data.append("bucket_name", bucketName);
        data.append("method", "post");

        postData(apiURL + "validate_bucket_name", data)
            .then((res) => {
                setIsValidBucketName(res);
                if (res?.status) {
                    setStoredBucketName(bucketName);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    // Custom Toggle Switch Component
    const ToggleSwitch = ({checked, onChange, name, id}) => (
        <label className="custom-switch">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                name={name}
                id={id}
            />
            <span className="switch-track">
                <span className="switch-thumb"></span>
            </span>
        </label>
    );

    return (
        <>
            {/* Authentication Card */}
            <div className="tta-card mb-3">
                <h5 className="mb-3 fw-semibold">{__("Authentication", "text-to-audio")}</h5>
                <Form onSubmit={handleSubmit}>
                    <Row className="align-items-center">
                        <Col xs={12} md={6} lg={5}>
                            <div className="mb-3 mb-md-0">
                                <Button
                                    variant="outline-primary"
                                    className="google-upload-btn w-100 mb-2 d-flex align-items-center justify-content-center"
                                    onClick={() =>
                                        document.getElementById("googTTSJsonFile").click()
                                    }
                                    type="button"
                                >
                                    <svg
                                        width="22"
                                        height="24"
                                        viewBox="0 0 22 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="me-2"
                                        style={{flexShrink: 0}}
                                    >
                                        <path
                                            d="M15.8422 10.8092C18.9435 11.2444 21.3296 13.9054 21.3296 17.1268C21.3296 20.6483 18.4733 23.5045 14.9518 23.5045C12.531 23.5045 10.4199 22.154 9.34456 20.1631C8.85439 19.2578 8.57422 18.2223 8.57422 17.1219C8.57422 13.6004 11.4305 10.7441 14.9518 10.7441C15.2521 10.7491 15.5473 10.7692 15.8422 10.8092Z"
                                            fill="#FEDB41"
                                        />
                                        <path
                                            d="M15.8419 10.8092C15.5468 10.769 15.2493 10.7489 14.9514 10.7491C11.4301 10.7491 8.57386 13.6054 8.57386 17.1269C8.57386 18.2273 8.85403 19.2628 9.3442 20.1681L9.33412 20.1732H2.68158C1.46597 20.1732 0.480469 19.1877 0.480469 17.9722V2.7058C0.480469 1.49034 1.46597 0.504883 2.68158 0.504883H10.7549V4.14651C10.7549 5.08673 11.5152 5.84718 12.4556 5.84718H15.8419L15.8419 10.8092Z"
                                            fill="#00ACEA"
                                        />
                                        <path
                                            d="M10.7559 0.504883L15.8429 5.84723H12.4565C11.5161 5.84723 10.7559 5.08673 10.7559 4.14651V0.504883Z"
                                            fill="#00ACEA"
                                        />
                                        <path
                                            d="M16.3568 10.3894V5.84747C16.3568 5.7173 16.2968 5.59734 16.2118 5.50233L11.1196 0.155109C11.0245 0.055125 10.8895 0 10.7545 0H2.68125C1.19063 0 0 1.21547 0 2.70609V17.9725C0 19.4632 1.19053 20.6587 2.68125 20.6587H9.05381C10.2942 22.7595 12.5251 24 14.9513 24C18.7429 24 21.8291 20.9187 21.8291 17.1222C21.8291 15.4515 21.2338 13.8457 20.1334 12.5903C19.138 11.4599 17.8074 10.6895 16.3568 10.3894V10.3894ZM11.2548 1.75584L14.6711 5.35223H12.4552C11.7949 5.35223 11.2546 4.80708 11.2546 4.14684V1.7558L11.2548 1.75584ZM1.0005 17.9725V2.70609C1.0005 1.76569 1.74572 1.0005 2.6812 1.0005H10.2543V4.14675C10.2543 5.36222 11.2397 6.35269 12.4552 6.35269H15.3565V10.2592C15.2063 10.2543 15.0863 10.2343 14.9562 10.2343C13.2105 10.2343 11.6048 10.9045 10.3943 11.955H4.0417C3.76664 11.955 3.54145 12.18 3.54145 12.4552C3.54145 12.7304 3.76645 12.9555 4.0417 12.9555H9.46397C9.10875 13.4557 8.81358 13.956 8.58366 14.5062H4.04166C3.76659 14.5062 3.54141 14.7312 3.54141 15.0062C3.54141 15.2814 3.76641 15.5065 4.04166 15.5065H8.25839C8.13333 16.0067 8.06831 16.5619 8.06831 17.1173C8.06831 17.9925 8.23331 18.8579 8.55356 19.6582H2.6812C1.74572 19.6582 1.0005 18.9078 1.0005 17.9726V17.9725ZM14.9513 23.0047C12.7954 23.0047 10.8094 21.8242 9.77906 19.9282C9.31378 19.073 9.06881 18.1075 9.06881 17.1271C9.06881 13.8858 11.7048 11.2496 14.9461 11.2496C15.2213 11.2496 15.4964 11.2698 15.7665 11.3048C17.1571 11.4998 18.4376 12.1901 19.368 13.2506C20.3084 14.3211 20.8236 15.6966 20.8236 17.1271C20.8286 20.3685 18.1926 23.0047 14.9513 23.0047Z"
                                            fill="#083863"
                                        />
                                        <path
                                            d="M4.04127 10.4546H9.10831C9.38352 10.4546 9.60856 10.2294 9.60856 9.9543C9.60856 9.67915 9.38356 9.4541 9.10831 9.4541H4.04127C3.7662 9.4541 3.54102 9.6791 3.54102 9.9543C3.54102 10.2294 3.7662 10.4546 4.04127 10.4546ZM15.3059 13.4357C15.2109 13.3357 15.0809 13.2757 14.9408 13.2757C14.8007 13.2757 14.6707 13.3357 14.5757 13.4357L11.6445 16.582C11.4543 16.7822 11.4693 17.1022 11.6694 17.2873C11.7644 17.3774 11.8895 17.4225 12.0096 17.4225C12.1446 17.4225 12.2847 17.3674 12.3848 17.2623L14.4556 15.0463V20.5087C14.4556 20.7837 14.6808 21.0089 14.9558 21.0089C15.231 21.0089 15.456 20.7837 15.456 20.5087V15.0465L17.512 17.2624C17.702 17.4624 18.0122 17.4774 18.2173 17.2873C18.4172 17.0973 18.4273 16.7822 18.2421 16.582L15.3059 13.4357Z"
                                            fill="#083863"
                                        />
                                    </svg>
                                    {__("Click here to Upload", "text-to-audio")}
                                </Button>
                                <Form.Control
                                    type="file"
                                    id="googTTSJsonFile"
                                    onChange={handleChange}
                                    name="googTTSJsonFile"
                                    className="d-none"
                                />
                                <p className="text-muted small mb-0">
                                    {__("Upload service account JSON file", "text-to-audio")}
                                </p>
                            </div>
                        </Col>
                        <Col xs={12} md={6} lg={7}>
                            <a
                                href="https://www.youtube.com/watch?v=yIAnL7W9kr8"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="d-flex align-items-center text-decoration-none bg-white p-2 rounded tta-yt-outline"
                            >
                                <div className="flex-shrink-0 position-relative me-3">
                                    <img
                                        src="https://i.ytimg.com/vi/yIAnL7W9kr8/mqdefault.jpg"
                                        alt={__("Video Tutorial",  'text-to-audio')}
                                        className="rounded"
                                        width="120"
                                        height="80"
                                    />
                                    <div className="tta-yt position-absolute top-50 start-50 translate-middle">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="40"
                                            height="40"
                                            fill="#ff0000"
                                        >
                                            <path d="M8 5v14l11-7z" fill="white"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="m-0 text-dark fw-normal">
                                        {__("Learn How To Integrate Google Text To Speech With AtlasVoice Pro Plugin?", "text-to-audio")}
                                    </h6>
                                </div>
                            </a>
                        </Col>
                    </Row>
                </Form>
            </div>

            {/* Storage Configuration Card */}
            <div className="tta-card mb-3">
                <h5 className="mb-3 fw-semibold">{__("Storage Configuration", "text-to-audio")}</h5>

                {/* Backup Toggle */}
                <div className="setting-row">
                    <div className="setting-label-area">
                        <span className="setting-label">
                            {__("Store MP3 Files To Google Cloud Storage", "text-to-audio")}
                        </span>
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    {__("Click To Know How To Enable Automatic Store To Google Cloud Storage", "text-to-audio")}
                                </Tooltip>
                            }
                        >
                            <a
                                className="text-danger ms-2"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://atlasaidev.com/docs/text-to-speech/usage-setup/how-to-enable-automatic-backup-to-google-cloud-storage-for-text-to-speech-pro-plugin/"
                            >
                                <i className="fab fa-youtube"></i>
                            </a>
                        </OverlayTrigger>
                    </div>
                    <div>
                        <ToggleSwitch
                            checked={isBackUpToGCS}
                            onChange={handleChange}
                            name="tta__integration_is_backup_to_gogole_drive"
                            id="tta__integration_is_backup_to_gogole_drive"
                        />
                    </div>
                </div>
                <p className="text-muted small mb-3">
                    {__("Automatically sync generated audio files in cloud storage for store & easy access.", "text-to-audio")}
                </p>

                {/* Bucket Name Field - Only show when backup is enabled */}
                {isBackUpToGCS && (
                    <div className="mt-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <Form.Label className="setting-label text-dark m-0">
                                {__("Google Cloud Storage Bucket Name", "text-to-audio")}
                            </Form.Label>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>{__("Click Here To Know Bucket Name Rules", "text-to-audio")}</Tooltip>
                                }
                            >
                                <a
                                    className="text-danger"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://cloud.google.com/storage/docs/buckets#naming"
                                >
                                    <i className="bi bi-question-circle"></i>
                                </a>
                            </OverlayTrigger>
                        </div>
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                value={bucketName}
                                onChange={handleChange}
                                name="tta__integration_google_storage_folder_name"
                                placeholder="atlas_voice_gtts_1757007369"
                                className="tta-textarea"
                            />
                            <Button variant="outline-secondary" onClick={validateBucketName}>
                                {__("Create", "text-to-audio")}
                            </Button>
                        </div>
                        {isValidBucketName?.message && (
                            <Alert
                                variant={isValidBucketName.status ? "success" : "danger"}
                                className="mt-2 mb-0 py-2"
                            >
                                <small>{isValidBucketName.message}</small>
                            </Alert>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div
                className="d-flex position-sticky bottom-0"
                style={{zIndex: 1030, marginTop: "20px"}}
            >
                <div className="text-center w-100">
                    <div className="d-flex justify-content-center gap-2">
                        <button
                            onClick={handleSubmit}
                            className="tta_btn rounded-3"
                        >
                            {__("Save", "text-to-audio")}
                        </button>
                        {window.hasOwnProperty("ttsObjPro") &&
                            ttsObjPro.is_pro_license_active &&
                            isAuthenticated && (
                                <Button
                                    variant="outline-danger"
                                    onClick={revokeAccessToken}
                                    className="rounded-3"
                                >
                                   {__("Remove Authentication", "text-to-audio")}
                                </Button>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
}