import React, {useState, useEffect} from "react";
import {__} from "@wordpress/i18n";
import {
    Form,
    Row,
    Col,
    Container,
    Tooltip,
    OverlayTrigger,
} from "react-bootstrap";
import {postWithoutImage} from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";
import {MultiSelect} from "../../context/MultiSelect";
import Icon from "../../Icon";
// TTS-238: UI split — legacy extraction fields and AtlasVoice (new system)
// settings live in their own modules so the two systems can evolve
// independently without stepping on each other.
import {ToggleSwitch, SettingRow, ProLockIcon} from "./SettingsPrimitives";
// TTS-238 D27.28 — AtlasVoiceSettings (heal log + boilerplate detector)
// retired. Both surfaces removed; import dropped.
import ScopeAccordion from "./ScopeAccordion";
import LegacyExtractionSettings from "./LegacyExtractionSettings";

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
        tta__settings_show_admin_bar_toggle: true,
        tta__settings_show_dashboard_widget: true,
        tta__settings_clear_all_cache: false,
        tta__settings_add_post_title_to_read: true,
        tta__settings_add_post_excerpt_to_read: false,
        tta__settings_text_after_content: "",
        tta__settings_text_before_content: "",
        tta__settings_read_content_from_dom: true,
        tta__settings_player_use_old_player: false,
        tta__settings_enable_tts_status: true,
        tta__settings_delete_data_on_uninstall: false,
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

        console.log({id: ttsObj.player_id})
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

        // D27.4 — Free strips the three Pro-gated exclude fields before
        // posting and surfaces a toast if any of them had a non-empty
        // value (so the admin knows they were skipped). The Include
        // selector saves on Free unchanged. Per-post-type overrides are
        // wholly Pro and are dropped client-side too.
        let droppedCount = 0;
        if (!ttsObj.is_pro_active) {
            ["tta__settings_exclude_content_by_css_selectors",
             "tta__settings_exclude_tags",
             "tta__settings_exclude_texts"].forEach((k) => {
                const v = settings[k];
                const empty = !v || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
                if (!empty) droppedCount++;
                settings[k] = Array.isArray(v) ? [] : "";
            });
            settings.tta__settings_atlasvoice_per_type_overrides = {};
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
                if (droppedCount > 0) {
                    toast(
                        __("Some Pro-only fields were skipped — upgrade to enable them.", "text-to-audio"),
                        "warning",
                        {autoClose: 8000}
                    );
                }
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

    // TTS-238: ToggleSwitch, SettingRow, ProLockIcon now come from
    // ./SettingsPrimitives so both split sub-components can share them.

    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid className="tta-container">
                <Row>
                    <Col xs={12} lg={8}>
                        {/* Header Card */}
                        <div className="bg-white rounded p-3 mb-3 shadow-sm">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h2 className="fs-3 fw-bold mb-2 text-dark">
                                        {__("Configure Settings", "text-to-audio")}
                                    </h2>
                                    <p className="text-secondary m-0 small">
                                        {__("Configure text-to-speech player behavior and content selection", "text-to-audio")}
                                    </p>
                                </div>
                                <div className="d-flex gap-2 align-items-center" style={{ flexShrink: 0 }}>
                                    {typeof tta_obj !== 'undefined' && tta_obj.latest_post_preview_url && (
                                        <a
                                            href={tta_obj.latest_post_preview_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm"
                                            style={{ whiteSpace: 'nowrap', backgroundColor: '#FF7853', color: '#fff', borderColor: '#FF7853' }}
                                        >
                                            {__("Preview on Your Site", "text-to-audio")} &#8599;
                                        </a>
                                    )}
                                    <a
                                        href={window.location.pathname + "?page=text-to-audio&reset_onboard=true"}
                                        className="btn btn-sm"
                                        style={{ whiteSpace: 'nowrap', backgroundColor: '#fff', color: '#FF7853', border: '1px solid #FF7853' }}
                                    >
                                        {__("Run Setup Wizard", "text-to-audio")}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Main Settings Card */}
                        <Form onSubmit={handleSubmit}>
                            <div className="tta-card">
                                <SettingRow
                                    label={__("Add Button or Player Automatically", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={
                                        __("The \"Add Button or Player Automatically\" feature allows AtlasVoice to automatically insert a play button or audio player into your posts or pages — without needing any manual setup.", "text-to-audio")
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
                                        {/* TTS-238: AtlasVoice opt-in toggle moved into <AtlasVoiceSettings>
                                            which is rendered after the Post Status multi-select below. */}
                                    </>
                                )}
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

                                {/*tta__settings_add_post_excerpt_to_read*/}
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

                                {/*tta__settings_enable_tts_status*/}
                                <SettingRow
                                    label={__("Enable TTS Status", "text-to-audio")}
                                    questionIcon={true}
                                    questionTooltip={__(
                                        "Enable TTS Status In Post Page.", "text-to-audio"
                                    )}
                                >
                                    <ToggleSwitch
                                        checked={settings.tta__settings_enable_tts_status}
                                        onChange={(e) => handleChange(e)}
                                        name="tta__settings_enable_tts_status"
                                        id="tta__settings_enable_tts_status"
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
                            <Icon name="question-circle" style={{color: "#999", fontSize: "14px"}} />
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
                            <Icon name="question-circle" style={{color: "#999", fontSize: "14px"}} />
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

                                    {/* D27.3 — D26.5's per-type Pick block was replaced by the
                                        ScopeAccordion below; "Allow Listening For Post Status"
                                        moves below the accordion in this v5 layout. */}

                                    {/* D27.3 — Scope accordion replaces the flat field list.
                                        Global is always shown; one collapsed accordion appears
                                        below per enabled post type (Pro only). All four CSS-
                                        selector fields render inside each accordion body. */}
                                    <ScopeAccordion
                                        settings={settings}
                                        handleChange={handleChange}
                                    />

                                    {/* D27.3 — "Allow Listening For Post Status" relocated below
                                        the scope accordion per v5 layout. */}
                                    <Row className="mb-4">
                                        <Col xs={12}>
                                            <Form.Label className="setting-label text-dark mb-2">
                                                {__("Allow Listening For Post Status", "text-to-audio")}
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
                                                        <Icon name="youtube" />
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
                                                        <Icon name="youtube" />
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
                                                        <Icon name="youtube" />
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

                                    {/* TTS-241: only relevant for speechSynthesis-style players (Default + Default Pro). */}
                                    {[1, 2].includes(Number(window?.ttsObj?.player_id)) && (
                                        <SettingRow label={__("Enable Button Icon", "text-to-audio")}>
                                            <ToggleSwitch
                                                checked={settings.tta__settings_display_btn_icon}
                                                onChange={(e) => handleChange(e)}
                                                name="tta__settings_display_btn_icon"
                                                id="tta__settings_display_btn_icon"
                                            />
                                        </SettingRow>
                                    )}

                                    <SettingRow label={__("Show admin bar toggle", "text-to-audio")} tooltip={__("Show AtlasVoice on/off toggle in the WordPress admin bar on front-end pages.", "text-to-audio")}>
                                        <ToggleSwitch
                                            checked={settings.tta__settings_show_admin_bar_toggle}
                                            onChange={(e) => handleChange(e)}
                                            name="tta__settings_show_admin_bar_toggle"
                                            id="tta__settings_show_admin_bar_toggle"
                                        />
                                    </SettingRow>

                                    <SettingRow label={__("Show dashboard widget", "text-to-audio")} tooltip={__("Display the AtlasVoice Quick Stats widget on the WordPress admin dashboard.", "text-to-audio")}>
                                        <ToggleSwitch
                                            checked={settings.tta__settings_show_dashboard_widget}
                                            onChange={(e) => handleChange(e)}
                                            name="tta__settings_show_dashboard_widget"
                                            id="tta__settings_show_dashboard_widget"
                                        />
                                    </SettingRow>

                                    <SettingRow label={__("Clear all cache", "text-to-audio")}>
                                        <ToggleSwitch
                                            checked={settings.tta__settings_clear_all_cache}
                                            onChange={(e) => handleChange(e)}
                                            name="tta__settings_clear_all_cache"
                                            id="tta__settings_clear_all_cache"
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        label={__("Delete all data on uninstall", "text-to-audio")}
                                        questionIcon={true}
                                        questionTooltip={__("When enabled, all plugin data (settings, analytics, generated audio files) will be permanently deleted when the plugin is uninstalled. Keep this OFF if you plan to reinstall or are debugging.", "text-to-audio")}
                                    >
                                        <ToggleSwitch
                                            checked={settings.tta__settings_delete_data_on_uninstall}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    if (!window.confirm(
                                                        __("⚠️ WARNING: Enabling this will permanently delete ALL plugin data (settings, analytics, generated audio files) when you uninstall the plugin. This action cannot be undone.\n\nAre you sure you want to enable this?", "text-to-audio")
                                                    )) {
                                                        return;
                                                    }
                                                }
                                                handleChange(e);
                                            }}
                                            name="tta__settings_delete_data_on_uninstall"
                                            id="tta__settings_delete_data_on_uninstall"
                                        />
                                    </SettingRow>
                                    {settings.tta__settings_delete_data_on_uninstall && (
                                        <div className="mb-3 p-2 rounded" style={{backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", fontSize: "13px"}}>
                                            <strong>{__("⚠ Warning:", "text-to-audio")}</strong>{" "}
                                            {__("All plugin data will be permanently deleted when you uninstall. Turn this OFF if you plan to reinstall, debug, or switch versions.", "text-to-audio")}
                                        </div>
                                    )}

                                </div>

                                {/* Spacer so the sticky Save All bar never overlaps the last form field. */}
                                <div style={{height: "80px"}} aria-hidden="true" />

                                {/* Save Button */}
                                <div
                                    className="position-sticky bottom-0"
                                    style={{
                                        zIndex: 1030,
                                        marginTop: "20px",
                                        background: "linear-gradient(to top, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0))",
                                        padding: "12px 0 8px",
                                    }}
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
                <Icon name="spinner" spin className="me-2" />
                {__("Loading...", "text-to-audio")}
            </div>
        </div>
    );
}
