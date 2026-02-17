import React, {useState, useEffect} from "react";
import {__} from "@wordpress/i18n";
import {
    Form,
    Row,
    Col,
    Container,
    Tooltip,
    OverlayTrigger,
    Button,
} from "react-bootstrap";
import {postWithoutImage} from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";
import {MultiSelect} from "../../context/MultiSelect";

export default function Settings() {
    const [settings, setSettings] = useState({
        tta__settings_enable_button_add: true,
        tta__settings_apply_number_format: false,
        tta__settings_display_btn_icon: false,
        tta__settings_allow_listening_for_post_types: ["post"],
        tta__settings_allow_listening_for_posts_status: ["publish"],
        tta__settings_css_selectors: "",
        tta__settings_exclude_content_by_css_selectors: "",
        tta__settings_exclude_texts: "",
        tta__settings_exclude_tags: "",
        tta__settings_exclude_post_ids: "",
        tta__settings_stop_auto_playing_after_switching_tab: true,
        tta__settings_stop_auto_pause_after_switching_tab: true,
        tta__settings_stop_floating_button: true,
        tta__settings_exclude_categories: [],
        tta__settings_exclude_wp_tags: [],
        tta__settings_clear_all_cache: false,
        tta__settings_add_post_title_to_read: true,
        tta__settings_add_post_excerpt_to_read: false,
        tta__settings_text_after_content: "",
        tta__settings_text_before_content: "",
        tta__settings_read_content_from_dom: true,
        tta__settings_player_use_old_player: false,
    });
    const [postTypes, setPostTypes] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [postsStatus, setPostsStatus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        let formData = new FormData();
        formData.append("method", "get");
        postWithoutImage(tta_obj.api_url + "tta/v1/settings", formData).then(
            (res) => {
                setSettings({...settings, ...res.data});
            }
        );

        let formData2 = new FormData();
        formData2.append("method", "get");
        postWithoutImage(
            tta_obj.api_url + "tta/v1/categories_and_tags",
            formData2
        ).then((res) => {
            if (res?.data?.categories) {
                setCategories(res.data.categories);
            }
            if (res?.data?.tags) {
                setTags(res.data.tags);
            }
            if (res?.data?.post_types) {
                let tempPostTypes = wp.hooks.applyFilters(
                    "tts_display_button_on_post_types",
                    res.data.post_types
                );
                setPostTypes(tempPostTypes);
            }
            if (res?.data?.post_status) {
                let tempPostStatus = wp.hooks.applyFilters(
                    "tta__settings_allow_listening_for_post_types",
                    res?.data?.post_status
                );
                setPostsStatus(tempPostStatus);
            }
            setIsDataLoaded(true);
        });
    }, []);

    const handleChange = (
        e,
        targetName = "tta__settings_allow_listening_for_post_types"
    ) => {
        let value = "";
        if (Array.isArray(e)) {
            value = e;
            setSettings({
                ...settings,
                ...{[targetName]: value},
            });
            return;
        } else {
            value = e.target.value;
        }

        if (e.target.getAttribute("type") === "checkbox") {
            value = e.target.checked;
        }

        console.log({name: e.target.name, value});

        if (e.target.name == "tta__settings_exclude_post_ids") {
            let ids = [];
            if (ttsObj.is_pro_active) {
                ids = e.target.value?.split(",");
            } else {
                ids = e.target.value?.split(",")?.slice(0, 5);
            }
            value = ids;
        }

        if (!e.target.name) return;

        setSettings({
            ...settings,
            ...{[e.target.name]: value},
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!ttsObj.is_pro_active) {
            settings.tta__settings_css_selectors = "";
        }
        let cache_clear_notice_text = "";
        if (settings?.tta__settings_clear_all_cache) {
            cache_clear_notice_text = __("All cache deleted", "text-to-audio");
        }
        let formData = new FormData();
        formData.append("fields", JSON.stringify(settings));
        formData.append("method", "post");
        postWithoutImage(tta_obj.api_url + "tta/v1/settings", formData)
            .then((res) => {
                setSettings(res.data);
                toast(
                    __('Successfully Saved. Now go to the "Customization" menu.', "text-to-audio"),
                    "info",
                    {
                        autoClose: 15000,
                    }
                );
                if (cache_clear_notice_text) {
                    toast(cache_clear_notice_text, "info", {
                        autoClose: 1500,
                    });
                }
                setIsDataLoaded(true);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    // Custom Toggle Switch Component
    const ToggleSwitch = ({checked, onChange, name, id, disabled}) => (
        <label className={`custom-switch ${disabled ? "switch-disabled" : ""}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                name={name}
                id={id}
                disabled={disabled}
            />
            <span className="switch-track">
        <span className="switch-thumb"></span>
      </span>
        </label>
    );

    // Setting Row Component
    const SettingRow = ({
                            label,
                            children,
                            helpIcon,
                            tooltipText,
                            questionIcon,
                            questionTooltip,
                            youtubeLink,
                        }) => (
        <div className="setting-row">
            <div className="setting-label-area">
                <span className="setting-label">{label}</span>

                {questionIcon && (
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>
                                {questionTooltip || __("Help information about this setting", "text-to-audio")}
                            </Tooltip>
                        }
                    >
            <span className="ms-2" style={{cursor: "pointer"}}>
              <i
                  className="fas fa-question-circle"
                  style={{color: "#999", fontSize: "14px"}}
              ></i>
            </span>
                    </OverlayTrigger>
                )}

                {helpIcon && (
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>
                                {tooltipText || __("Click To Know How It Works?", "text-to-audio")}
                            </Tooltip>
                        }
                    >
                        <a
                            className="text-danger ms-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={youtubeLink || "#"}
                        >
                            <i className="fab fa-youtube"></i>
                        </a>
                    </OverlayTrigger>
                )}
            </div>

            <div>{children}</div>
        </div>
    );

    // Lock Icon with Tooltip for pro features
    const ProLockIcon = ({tooltipText}) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>}>
            <Button className="m-0 p-0 text-dark bg-light border-0 ms-2">
                <i className="fas fa-lock"/>
            </Button>
        </OverlayTrigger>
    );

    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid className="tta-container">
                <Row>
                    <Col xs={12} lg={8}>
                        {/* Header Card */}
                        <div className="bg-white rounded p-3 mb-3 shadow-sm">
                            <h2 className="fs-3 fw-bold mb-2 text-dark">
                                {__("Configure Settings", "text-to-audio")}
                            </h2>
                            <p className="text-secondary m-0 small">
                                {__("Configure text-to-speech player behavior and content selection", "text-to-audio")}
                            </p>
                        </div>

                        {/* Main Settings Card */}
                        <Form onSubmit={handleSubmit}>
                            <div className="tta-card">
                                <SettingRow
                                    label={__("Add Button or Player Automatically", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={
                                        __("The \"Add Button or Player Automatically\" feature in a Text-to-Speech (TTS) plugin allows the plugin to automatically insert a play button or audio player into your posts or pages — without needing any manual setup.", "text-to-audio")
                                    }
                                >
                                    <ToggleSwitch
                                        checked={settings.tta__settings_enable_button_add}
                                        onChange={(e) => handleChange(e)}
                                        name="tta__settings_enable_button_add"
                                        id="tta__settings_enable_button_add"
                                    />
                                </SettingRow>

                                {window?.ttsObj?.player_id < 3 && (
                                    <>
                                        <SettingRow
                                            label={__("Continue Reading After Switching To Another Tab", "text-to-audio")}
                                            questionIcon={true}
                                            questionTooltip={__(
                                                "When enabled, text-to-speech will continue playing even if you navigate away from the current tab", "text-to-audio"
                                            )}
                                        >
                                            <ToggleSwitch
                                                checked={
                                                    settings.tta__settings_stop_auto_pause_after_switching_tab
                                                }
                                                onChange={(e) => handleChange(e)}
                                                name="tta__settings_stop_auto_pause_after_switching_tab"
                                                id="tta__settings_stop_auto_pause_after_switching_tab"
                                            />
                                        </SettingRow>

                                        {!settings.tta__settings_stop_auto_pause_after_switching_tab && (
                                            <SettingRow
                                                label={__("Stop Auto Play After Switching To TTS Tab", "text-to-audio")}
                                                questionIcon={true}
                                                questionTooltip={__(
                                                    "Automatically pause playback when switching back to the TTS tab from another tab", "text-to-audio"
                                                )}
                                            >
                                                <ToggleSwitch
                                                    checked={
                                                        settings.tta__settings_stop_auto_playing_after_switching_tab
                                                    }
                                                    onChange={(e) => handleChange(e)}
                                                    name="tta__settings_stop_auto_playing_after_switching_tab"
                                                    id="tta__settings_stop_auto_playing_after_switching_tab"
                                                />
                                            </SettingRow>
                                        )}
                                    </>
                                )}

                                {/* When Scroll Down Stop Floating Player - Missing from new */}
                                {window?.ttsObj?.player_id > 1 && (
                                    <SettingRow
                                        label={__("When Scroll Down Stop Floating Player", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__(
                                            "Automatically pause the floating player when users scroll down the page", "text-to-audio"
                                        )}
                                    >
                                        <ToggleSwitch
                                            checked={settings.tta__settings_stop_floating_button}
                                            onChange={(e) => handleChange(e)}
                                            name="tta__settings_stop_floating_button"
                                            id="tta__settings_stop_floating_button"
                                        />
                                    </SettingRow>
                                )}

                                {/* Apply number format with YouTube icon - Missing from new */}
                                {window?.ttsObj?.is_pro_active && (
                                    <>
                                        <SettingRow
                                            label={__("Apply number format", "text-to-audio")}
                                            questionIcon={true}
                                            questionTooltip={__(
                                                "Convert numbers to spoken words (e.g., '123' becomes 'one hundred twenty-three')", "text-to-audio"
                                            )}
                                            youtubeLink="https://www.youtube.com/watch?v=xQCw7mJXrxo&t=46s"
                                        >
                                            <ToggleSwitch
                                                checked={settings.tta__settings_apply_number_format}
                                                onChange={(e) => handleChange(e)}
                                                name="tta__settings_apply_number_format"
                                                id="tta__settings_apply_number_format"
                                            />
                                        </SettingRow>
                                        <SettingRow
                                            label={__("Read Content From Dom", 'text-to-audio')}
                                            questionIcon={true}
                                            questionTooltip={__("Read Content From Dom", 'text-to-audio')}
                                        >
                                            <ToggleSwitch
                                                checked={settings.tta__settings_read_content_from_dom}
                                                onChange={(e) => handleChange(e)}
                                                name="tta__settings_read_content_from_dom"
                                                id="tta__settings_read_content_from_dom"
                                            />
                                        </SettingRow>
                                        {
                                            ttsObj.player_id == 1 && <SettingRow
                                                label={__("Use Old Player UI", 'text-to-audio')}
                                                questionIcon={true}
                                                questionTooltip={__("Use Old Player UI", 'text-to-audio')}
                                            >
                                                <ToggleSwitch
                                                    checked={settings.tta__settings_player_use_old_player}
                                                    onChange={(e) => handleChange(e)}
                                                    name="tta__settings_player_use_old_player"
                                                    id="tta__settings_player_use_old_player"
                                                />
                                            </SettingRow>
                                        }
                                    </>
                                )}

                                <SettingRow
                                    label={__("Add Post Title To Read", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__(
                                        "Include the post title in the audio playback before reading the main content", "text-to-audio"
                                    )}
                                >
                                    <ToggleSwitch
                                        checked={settings.tta__settings_add_post_title_to_read}
                                        onChange={(e) => handleChange(e)}
                                        name="tta__settings_add_post_title_to_read"
                                        id="tta__settings_add_post_title_to_read"
                                    />
                                </SettingRow>

                                <SettingRow
                                    label={__("Add Post Excerpt To Read", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__(
                                        "Include the post excerpt/summary in the audio playback before reading the main content", "text-to-audio"
                                    )}
                                >
                                    <ToggleSwitch
                                        checked={settings.tta__settings_add_post_excerpt_to_read}
                                        onChange={(e) => handleChange(e)}
                                        name="tta__settings_add_post_excerpt_to_read"
                                        id="tta__settings_add_post_excerpt_to_read"
                                    />
                                </SettingRow>

                                {/* Text Areas Section */}
                                <div className="pt-3">
                                    <Row className="mb-4">
                                        <Col md={6}>
                                            <Form.Label className="setting-label text-dark mb-2">
                                                {__("Add Text Before Content(intro)", "text-to-audio")}
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__(
                                                                "Custom text that will be read aloud before the main content begins", "text-to-audio"
                                                            )}
                                                        </Tooltip>
                                                    }
                                                >
                          <span className="ms-2" style={{cursor: "pointer"}}>
                            <i
                                className="fas fa-question-circle"
                                style={{color: "#999", fontSize: "14px"}}
                            ></i>
                          </span>
                                                </OverlayTrigger>
                                            </Form.Label>

                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_text_before_content"
                                                value={settings.tta__settings_text_before_content}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={__("Add Text Before Content", "text-to-audio")}
                                                className="tta-textarea"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="setting-label text-dark mb-2">
                                                {__("Add Text After Content(outro)", "text-to-audio")}
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__(
                                                                "Custom text that will be read aloud after the main content finishes", "text-to-audio"
                                                            )}
                                                        </Tooltip>
                                                    }
                                                >
                          <span className="ms-2" style={{cursor: "pointer"}}>
                            <i
                                className="fas fa-question-circle"
                                style={{color: "#999", fontSize: "14px"}}
                            ></i>
                          </span>
                                                </OverlayTrigger>
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_text_after_content"
                                                value={settings.tta__settings_text_after_content}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={__("Add Text After Content", "text-to-audio")}
                                                className="tta-textarea"
                                            />
                                        </Col>
                                    </Row>

                                    {/* Multi-select fields */}
                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <Form.Label className="setting-label text-dark mb-2">
                                                {__("Allow Listening For Post Type", "text-to-audio")}
                                                {/* <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i> */}
                                            </Form.Label>
                                            <MultiSelect
                                                id="tta__settings_allow_listening_for_post_types"
                                                name="tta__settings_allow_listening_for_post_types"
                                                onChange={handleChange}
                                                selectedItems={
                                                    settings.tta__settings_allow_listening_for_post_types
                                                }
                                                options={postTypes}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <Form.Label className="setting-label text-dark mb-2">
                                                {__("Allow Listening For Post Status", "text-to-audio")}
                                                {/* <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i> */}
                                            </Form.Label>
                                            <MultiSelect
                                                id="tta__settings_allow_listening_for_posts_status"
                                                name="tta__settings_allow_listening_for_posts_status"
                                                multiselectIndex={1}
                                                onChange={handleChange}
                                                selectedItems={
                                                    settings.tta__settings_allow_listening_for_posts_status
                                                }
                                                options={postsStatus}
                                                toastMessage={__("On Free Version You Can Select Only 1 post type.", "text-to-audio")}
                                            />
                                        </Col>
                                    </Row>

                                    {/* Additional settings fields with tooltips */}
                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Include Content By CSS Selectors", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Include Content By CSS Selectors feature is available in pro version", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_css_selectors"
                                                value={settings.tta__settings_css_selectors}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={
                                                    ttsObj.is_pro_active
                                                        ? __("Multiple selector will be multiline.", "text-to-audio")
                                                        : __("Some content may be missing, It can be found by css selectors", "text-to-audio")
                                                }
                                                disabled={!ttsObj.is_pro_active}
                                                className="tta-textarea"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude Content By CSS Selectors", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Exclude Content By CSS Selectors feature is available in pro version", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_exclude_content_by_css_selectors"
                                                value={
                                                    settings.tta__settings_exclude_content_by_css_selectors
                                                }
                                                onChange={(e) => handleChange(e)}
                                                placeholder={
                                                    ttsObj.is_pro_active
                                                        ? __("Multiple selector will be multiline.", "text-to-audio")
                                                        : __("Exclude content by CSS selectors", "text-to-audio")
                                                }
                                                disabled={!ttsObj.is_pro_active}
                                                className="tta-textarea"
                                            />
                                            <small
                                                style={{
                                                    color: "#d32f2f",
                                                    marginTop: "4px",
                                                    display: "block",
                                                }}
                                            >
                                                {__('You can add ".atlasvoice_no_read" class to exclude content.', "text-to-audio")}
                                            </small>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude HTML Tags To Speak", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Exclude Tags. So that its content skipped. Like ( Subscript, Superscript etc.) This is a pro feature.", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_exclude_tags"
                                                value={settings.tta__settings_exclude_tags}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={
                                                    ttsObj.is_pro_active
                                                        ? __("Multiple Tags Will Be Pipe(|) Separated.", "text-to-audio")
                                                        : __("Exclude tags is a pro feature.", "text-to-audio")
                                                }
                                                disabled={!ttsObj.is_pro_active}
                                                className="tta-textarea"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude Texts To Speak", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Excluding texts to be spoken is a pro feature.", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_exclude_texts"
                                                value={settings.tta__settings_exclude_texts}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={
                                                    ttsObj.is_pro_active
                                                        ? __("Multiple Texts Will Be Pipe(|) Separated.", "text-to-audio")
                                                        : __("Exclude texts is a pro feature.", "text-to-audio")
                                                }
                                                disabled={!ttsObj.is_pro_active}
                                                className="tta-textarea"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude Posts By IDs To Speak", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Exclude more than 5 IDs is a pro feature", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=ooxJkMU58KY&list=PLGdmFn36qCRIO6galQmEMoLVuNXSIvVuF&index=19"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="tta__settings_exclude_post_ids"
                                                value={settings.tta__settings_exclude_post_ids}
                                                onChange={(e) => handleChange(e)}
                                                placeholder={
                                                    ttsObj.is_pro_active
                                                        ? __("Multiple IDs Will Be Comma(,) Separated.", "text-to-audio")
                                                        : __("Excluding more than 5 IDs is a pro feature. Multiple IDs Will Be Comma(,) Separated.", "text-to-audio")
                                                }
                                                className="tta-textarea"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude Categories To Speak", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Exclude more than 1 categories is a pro feature", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=yanuoEBfG4A"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <MultiSelect
                                                id="tta__settings_exclude_categories"
                                                name="tta__settings_exclude_categories"
                                                multiselectIndex={2}
                                                onChange={handleChange}
                                                toastMessage={__("On Free Version You Can Select Only 1 Category.", "text-to-audio")}
                                                selectedItems={
                                                    settings.tta__settings_exclude_categories
                                                }
                                                options={Object.keys(categories)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Form.Label className="setting-label text-dark m-0">
                                                        {__("Exclude Tags To Speak", "text-to-audio")}
                                                    </Form.Label>
                                                    {!ttsObj.is_pro_active && (
                                                        <ProLockIcon
                                                            tooltipText={__(
                                                                "Exclude more than 1 tags is a pro feature", "text-to-audio"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {__("Click To Know How It Works?", "text-to-audio")}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <a
                                                        className="text-danger ms-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        href="https://www.youtube.com/watch?v=yanuoEBfG4A"
                                                    >
                                                        <i className="fab fa-youtube"></i>
                                                    </a>
                                                </OverlayTrigger>
                                            </div>
                                            <MultiSelect
                                                id="tta__settings_exclude_wp_tags"
                                                name="tta__settings_exclude_wp_tags"
                                                multiselectIndex={3}
                                                onChange={handleChange}
                                                toastMessage={__("On Free Version You Can Select Only 1 Tag.", "text-to-audio")}
                                                selectedItems={settings.tta__settings_exclude_wp_tags}
                                                options={Object.keys(tags)}
                                            />
                                        </Col>
                                    </Row>

                                    {!window?.ttsObjPro?.is_pro_active && (
                                        <SettingRow label={__("Enable Button Icon", "text-to-audio")}>
                                            <ToggleSwitch
                                                checked={settings.tta__settings_display_btn_icon}
                                                onChange={(e) => handleChange(e)}
                                                name="tta__settings_display_btn_icon"
                                                id="tta__settings_display_btn_icon"
                                            />
                                        </SettingRow>
                                    )}

                                    <SettingRow label={__("Clear all cache", "text-to-audio")}>
                                        <ToggleSwitch
                                            checked={settings.tta__settings_clear_all_cache}
                                            onChange={(e) => handleChange(e)}
                                            name="tta__settings_clear_all_cache"
                                            id="tta__settings_clear_all_cache"
                                        />
                                    </SettingRow>

                                </div>

                                {/* Save Button */}
                                <div
                                    className="position-sticky bottom-0"
                                    style={{zIndex: 1030, marginTop: "20px"}}
                                >
                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className="tta_btn rounded-3 shadow-lg"
                                        >
                                            {__("Save All", "text-to-audio")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </Col>

                    <Col xs={12} lg={4}>
                        <UpgradeToPro promotionType={"youtube"}/>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    ) : (
        <div
            className="tta-loading-spinner"
        >
            <div>
                <i className="fas fa-spinner fa-spin me-2"></i>
                {__("Loading...", "text-to-audio")}
            </div>
        </div>
    );
}
