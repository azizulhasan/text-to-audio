import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import {
  Form,
  Row,
  Col,
  Container,
  Tooltip,
  OverlayTrigger,
  Button,
} from "react-bootstrap";
import { postWithoutImage } from "../../context/utilities";
import toast from "../../context/Notify";
import UpgradeToPro from "../../UpgradeToPro";
import { MultiSelect } from "../../context/MultiSelect";

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
        setSettings({ ...settings, ...res.data });
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
        ...{ [targetName]: value },
      });
      return;
    } else {
      value = e.target.value;
    }

    if (e.target.getAttribute("type") === "checkbox") {
      value = e.target.checked;
    }

    console.log({ name: e.target.name, value });

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
      ...{ [e.target.name]: value },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ttsObj.is_pro_active) {
      settings.tta__settings_css_selectors = "";
    }
    let cache_clear_notice_text = "";
    if (settings?.tta__settings_clear_all_cache) {
      cache_clear_notice_text = "All cache deleted";
    }
    let formData = new FormData();
    formData.append("fields", JSON.stringify(settings));
    formData.append("method", "post");
    postWithoutImage(tta_obj.api_url + "tta/v1/settings", formData)
      .then((res) => {
        setSettings(res.data);
        toast(
          'Successfully Saved. Now go to the "Customization" menu.',
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
  const ToggleSwitch = ({ checked, onChange, name, id, disabled }) => (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '48px',
      height: '24px',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        id={id}
        disabled={disabled}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: checked ? '#9EF01A' : '#e0e0e0',
        borderRadius: '24px',
        transition: '0.3s',
        opacity: disabled ? 0.5 : 1
      }}>
        <span style={{
          position: 'absolute',
          content: '',
          height: '18px',
          width: '18px',
          left: checked ? '27px' : '3px',
          bottom: '3px',
          background: 'white',
          borderRadius: '50%',
          transition: '0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}></span>
      </span>
    </label>
  );

  // Setting Row Component
  const SettingRow = ({ label, children, helpIcon }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        flex: 1
      }}>
        <span style={{ 
          fontSize: '15px', 
          color: '#333',
          fontWeight: '500'
        }}>
          {label}
        </span>
        {helpIcon && (
          <i className="fas fa-question-circle" style={{ 
            color: '#999', 
            fontSize: '14px',
            cursor: 'help'
          }}></i>
        )}
      </div>
      <div>{children}</div>
    </div>
  );

  return isDataLoaded ? (
    <React.Fragment>
      <Container fluid style={{ padding: '2rem' }}>
        <Row>
          <Col xs={12} lg={8}>
            {/* Header Card */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                marginBottom: '8px',
                color: '#1a1a1a'
              }}>
                Configure Settings
              </h2>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
               Configure text-to-speech player behavior and content selection
              </p>
            </div>

            {/* Main Settings Card */}
            <Form onSubmit={handleSubmit}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <SettingRow 
                  label="Add Button or Player Automatically" 
                  helpIcon={true}
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
                      label="Continue Reading After Switching To Another Tab" 
                      helpIcon={true}
                    >
                      <ToggleSwitch
                        checked={settings.tta__settings_stop_auto_pause_after_switching_tab}
                        onChange={(e) => handleChange(e)}
                        name="tta__settings_stop_auto_pause_after_switching_tab"
                        id="tta__settings_stop_auto_pause_after_switching_tab"
                      />
                    </SettingRow>

                    {!settings.tta__settings_stop_auto_pause_after_switching_tab && (
                      <SettingRow 
                        label="Stop Auto Play After Switching To TTS Tab" 
                        helpIcon={true}
                      >
                        <ToggleSwitch
                          checked={settings.tta__settings_stop_auto_playing_after_switching_tab}
                          onChange={(e) => handleChange(e)}
                          name="tta__settings_stop_auto_playing_after_switching_tab"
                          id="tta__settings_stop_auto_playing_after_switching_tab"
                        />
                      </SettingRow>
                    )}
                  </>
                )}

                <SettingRow 
                  label="Add Post Title To Read" 
                  helpIcon={true}
                >
                  <ToggleSwitch
                    checked={settings.tta__settings_add_post_title_to_read}
                    onChange={(e) => handleChange(e)}
                    name="tta__settings_add_post_title_to_read"
                    id="tta__settings_add_post_title_to_read"
                  />
                </SettingRow>

                <SettingRow 
                  label="Add Post Excerpt To Read" 
                  helpIcon={true}
                >
                  <ToggleSwitch
                    checked={settings.tta__settings_add_post_excerpt_to_read}
                    onChange={(e) => handleChange(e)}
                    name="tta__settings_add_post_excerpt_to_read"
                    id="tta__settings_add_post_excerpt_to_read"
                  />
                </SettingRow>

                {window?.ttsObj?.is_pro_active && (
                  <SettingRow 
                    label="Add Number Format" 
                    helpIcon={true}
                  >
                    <ToggleSwitch
                      checked={settings.tta__settings_apply_number_format}
                      onChange={(e) => handleChange(e)}
                      name="tta__settings_apply_number_format"
                      id="tta__settings_apply_number_format"
                    />
                  </SettingRow>
                )}

                {/* Text Areas Section */}
                <div style={{ paddingTop: '20px' }}>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Add Text Before Content(intro) 
                        <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_text_before_content"
                        value={settings.tta__settings_text_before_content}
                        onChange={(e) => handleChange(e)}
                        placeholder="Add Text Before Content"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Add Text After Content(outro)
                        <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_text_after_content"
                        value={settings.tta__settings_text_after_content}
                        onChange={(e) => handleChange(e)}
                        placeholder="Add Text After Content"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  {/* Multi-select fields */}
                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Allow Listening For Post Type
                        <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i>
                      </Form.Label>
                      <MultiSelect
                        id="tta__settings_allow_listening_for_post_types"
                        name="tta__settings_allow_listening_for_post_types"
                        onChange={handleChange}
                        selectedItems={settings.tta__settings_allow_listening_for_post_types}
                        options={postTypes}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Allow Listening For Post Status
                        <i className="fas fa-question-circle ms-2" style={{ color: '#999', fontSize: '14px' }}></i>
                      </Form.Label>
                      <MultiSelect
                        id="tta__settings_allow_listening_for_posts_status"
                        name="tta__settings_allow_listening_for_posts_status"
                        multiselectIndex={1}
                        onChange={handleChange}
                        selectedItems={settings.tta__settings_allow_listening_for_posts_status}
                        options={postsStatus}
                        toastMessage="On Free Version You Can Select Only 1 post type."
                      />
                    </Col>
                  </Row>

                  {/* Additional settings fields - keeping original logic */}
                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Include Content By CSS Selectors
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_css_selectors"
                        value={settings.tta__settings_css_selectors}
                        onChange={(e) => handleChange(e)}
                        placeholder={ttsObj.is_pro_active ? "Multiple selector will be multiline." : "Some content may be missing, It can be found by css selectors"}
                        disabled={!ttsObj.is_pro_active}
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude Content By CSS Selectors
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_content_by_css_selectors"
                        value={settings.tta__settings_exclude_content_by_css_selectors}
                        onChange={(e) => handleChange(e)}
                        placeholder={ttsObj.is_pro_active ? "Multiple selector will be multiline." : "Exclude content by CSS selectors"}
                        disabled={!ttsObj.is_pro_active}
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                      <small style={{ color: '#d32f2f', marginTop: '4px', display: 'block' }}>
                        You can add ".atlasvoice_no_read" class to exclude content.
                      </small>
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude HTML Tags To Speak
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_tags"
                        value={settings.tta__settings_exclude_tags}
                        onChange={(e) => handleChange(e)}
                        placeholder={ttsObj.is_pro_active ? "Multiple Tags Will Be Pipe(|) Separated." : "Exclude tags is a pro feature."}
                        disabled={!ttsObj.is_pro_active}
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude Texts To Speak
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_texts"
                        value={settings.tta__settings_exclude_texts}
                        onChange={(e) => handleChange(e)}
                        placeholder={ttsObj.is_pro_active ? "Multiple Texts Will Be Pipe(|) Separated." : "Exclude texts is a pro feature."}
                        disabled={!ttsObj.is_pro_active}
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude Posts By IDs To Speak
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="tta__settings_exclude_post_ids"
                        value={settings.tta__settings_exclude_post_ids}
                        onChange={(e) => handleChange(e)}
                        placeholder={ttsObj.is_pro_active ? "Multiple IDs Will Be Comma(,) Separated." : "Excluding more than 5 IDs is a pro feature. Multiple IDs Will Be Comma(,) Separated."}
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude Categories To Speak
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <MultiSelect
                        id="tta__settings_exclude_categories"
                        name="tta__settings_exclude_categories"
                        multiselectIndex={2}
                        onChange={handleChange}
                        toastMessage="On Free Version You Can Select Only 1 Category."
                        selectedItems={settings.tta__settings_exclude_categories}
                        options={Object.keys(categories)}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col xs={12}>
                      <Form.Label style={{ fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                        Exclude Tags To Speak
                        {!ttsObj.is_pro_active && (
                          <i className="fas fa-lock ms-2" style={{ color: '#999' }}></i>
                        )}
                      </Form.Label>
                      <MultiSelect
                        id="tta__settings_exclude_wp_tags"
                        name="tta__settings_exclude_wp_tags"
                        multiselectIndex={3}
                        onChange={handleChange}
                        toastMessage="On Free Version You Can Select Only 1 Tag."
                        selectedItems={settings.tta__settings_exclude_wp_tags}
                        options={Object.keys(tags)}
                      />
                    </Col>
                  </Row>

                  {!window?.ttsObjPro?.is_pro_active && (
                    <SettingRow 
                      label="Enable Button Icon"
                    >
                      <ToggleSwitch
                        checked={settings.tta__settings_display_btn_icon}
                        onChange={(e) => handleChange(e)}
                        name="tta__settings_display_btn_icon"
                        id="tta__settings_display_btn_icon"
                      />
                    </SettingRow>
                  )}

                  <SettingRow 
                    label="Clear all cache"
                  >
                    <ToggleSwitch
                      checked={settings.tta__settings_clear_all_cache}
                      onChange={(e) => handleChange(e)}
                      name="tta__settings_clear_all_cache"
                      id="tta__settings_clear_all_cache"
                    />
                  </SettingRow>
                </div>

                {/* Save Button */}
                <div style={{ 
                  marginTop: '24px', 
                  paddingTop: '24px',
                  borderTop: '1px solid #f0f0f0',
                  textAlign: 'center'
                }}>
                  <button 
                    type="submit" 
                    style={{
                      background: 'linear-gradient(135deg, #1a4d4d 0%, #2d6a6a 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 48px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Save
                  </button>
                </div>
              </div>
            </Form>
          </Col>

          <Col xs={12} lg={4}>
            <UpgradeToPro promotionType={"youtube"} />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  ) : (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '24px',
      color: '#666'
    }}>
      <div>
        <i className="fas fa-spinner fa-spin me-2"></i>
        Loading...
      </div>
    </div>
  );
}