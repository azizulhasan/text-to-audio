import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n'
import {
    Tooltip,
    OverlayTrigger,
    Button
} from 'react-bootstrap';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {postWithoutImage} from '../components/context/utilities';
import toast from '../components/context/Notify';

const STYLES = `
  .tta_css-selectors-wrapper {
    padding: 20px 24px 8px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .tta_css-selectors-wrapper .tta_field-row {
    margin-bottom: 20px;
  }

  .tta_css-selectors-wrapper .tta_field-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tta_css-selectors-wrapper .tta_toggle-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding-bottom: 18px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 22px;
  }

  .tta_css-selectors-wrapper .tta_field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.4;
  }

  .tta_css-selectors-wrapper .tta_textarea {
    width: 100%;
    min-height: 64px;
    padding: 10px 14px;
    background: #f7f8fa;
    border: 1.5px solid #e8eaed;
    border-radius: 8px;
    font-size: 13px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    color: #3c3c3c;
    resize: vertical;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    box-sizing: border-box;
    outline: none;
    box-shadow: none;
  }

  .tta_css-selectors-wrapper .tta_textarea::placeholder {
    color: #a0a5b0;
    font-style: italic;
  }

  .tta_css-selectors-wrapper .tta_textarea:focus {
    border-color: #1a7f64;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(26, 127, 100, 0.10);
  }

  .tta_css-selectors-wrapper .tta_textarea:disabled {
    background: #f0f2f5;
    color: #b0b5bf;
    cursor: not-allowed;
    border-color: #e0e2e6;
  }

  .tta_css-selectors-wrapper .tta_info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid #8a8f9c;
    font-size: 10px;
    font-weight: 700;
    color: #8a8f9c;
    cursor: pointer;
    line-height: 1;
    font-style: normal;
    flex-shrink: 0;
    transition: border-color 0.15s, color 0.15s;
  }

  .tta_css-selectors-wrapper .tta_info-link {
    display: inline-flex;
    text-decoration: none;
  }

  .tta_css-selectors-wrapper .tta_info-link:hover .tta_info-icon {
    border-color: #1a7f64;
    color: #1a7f64;
  }

  .tta_css-selectors-wrapper .tta_pro-lock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    cursor: pointer;
    color: #8a8f9c;
    font-size: 11px;
    line-height: 1;
    transition: color 0.15s;
  }

  .tta_css-selectors-wrapper .tta_pro-lock-btn:hover {
    color: #e8a020 !important;
    background: transparent !important;
  }

  .tta_css-selectors-wrapper .tta_toggle-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 44px;
    height: 24px;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0;
  }

  .tta_css-selectors-wrapper .tta_toggle-switch input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
  }

  .tta_css-selectors-wrapper .tta_toggle-slider {
    position: absolute;
    inset: 0;
    background: #d0d4db;
    border-radius: 999px;
    transition: background 0.22s ease;
  }

  .tta_css-selectors-wrapper .tta_toggle-slider::before {
    content: "";
    position: absolute;
    left: 3px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    transition: left 0.22s ease;
  }

  .tta_css-selectors-wrapper .tta_toggle-switch input:checked + .tta_toggle-slider {
    background-color: rgba(87, 209, 0, 1);
  }

  .tta_css-selectors-wrapper .tta_toggle-switch input:checked + .tta_toggle-slider::before {
    left: calc(100% - 21px);
  }

  .tta_css-selectors-wrapper .tta_save-row {
    display: flex;
    justify-content: flex-start;
    margin-top: 8px;
    margin-bottom: 16px;
    padding-top: 4px;
  }

  .tta_css-selectors-wrapper .tta_save-btn {
    padding: 9px 28px;
    // background: #1a7f64 !important;
    background: #184c53 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.1s ease;
    outline: none;
    box-shadow: none !important;
  }

  .tta_css-selectors-wrapper .tta_save-btn:hover {
    background: #15654f !important;
    box-shadow: 0 2px 8px rgba(26, 127, 100, 0.28) !important;
  }

  .tta_css-selectors-wrapper .tta_save-btn:active {
    transform: scale(0.97);
    background: #10503e !important;
  }
`;

export default function CSSSelectorsForPosts() {
    const [settings, setSettings] = useState({
        tta__settings_css_selectors: '',
        tta__settings_exclude_content_by_css_selectors: '',
        tta__settings_exclude_texts: "",
        tta__settings_exclude_tags: "",
        tta__settings_use_own_css_selectors: true,
    });

    const [postID, setPostID] = useState('');
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        let url2 = new URLSearchParams(window.location.search);
        let post_id = url2.get('post');
        setPostID(post_id);
        let formData = new FormData();
        formData.append('method', 'get');
        formData.append('post_id', post_id);
        postWithoutImage(tta_obj.api_url + 'tta_pro/v1/css_selectors_for_posts', formData).then(
            (res) => {
                setSettings({...settings, ...res.data});
                setIsDataLoaded(true);
            });
    }, []);

    const handleChange = (e) => {
        let value = e.target.value;

        if (e.target.getAttribute('type') === 'checkbox') {
            value = e.target.checked;
        }

        if (!e.target.name) return;

        setSettings({
            ...settings,
            ...{[e.target.name]: value},
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!postID) {
            toast(__('Please save the post then try to add custom CSS selectors.', 'text-to-audio'));
            return;
        }
        if (settings.tta__settings_use_own_css_selectors && !checkAllPropertiesAreEmpty(settings)) {
            toast(__('Empty value can not be saved. You can uncheck the "Use Own CSS Selectors" Option.', 'text-to-audio'), 'info', {
                autoClose: 10000
            });
            return;
        }

        let formData = new FormData();
        formData.append('fields', JSON.stringify(settings));
        formData.append('method', 'post');
        formData.append('post_id', postID);
        postWithoutImage(tta_obj.api_url + 'tta_pro/v1/css_selectors_for_posts', formData)
            .then((res) => {
                setSettings(res.data);
                toast(__('Settings Data Saved', 'text-to-audio'));
                setIsDataLoaded(true);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    function checkAllPropertiesAreEmpty(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key].length) {
                    return true;
                }
            }
        }
        return false;
    }

    const youtubeLink = 'https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev';

    const InfoTooltip = () => (
        <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{__('Click To Know How It Works?', 'text-to-audio')}</Tooltip>}
        >
            <a className="tta_info-link" target="_blank" rel="noreferrer" href={youtubeLink}>
                <span className="tta_info-icon">?</span>
            </a>
        </OverlayTrigger>
    );

    const ProLockTooltip = ({text}) => (
        <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{text}</Tooltip>}
        >
            <Button bsPrefix="tta_pro-lock-btn">
                <i className="fas fa-lock" />
            </Button>
        </OverlayTrigger>
    );

    return (
        isDataLoaded ? (
            <React.Fragment>
                {/* All styles embedded — survives premium repo CSS overrides */}
                <style>{STYLES}</style>

                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />

                <div className="tta_css-selectors-wrapper">
                    <form onSubmit={handleSubmit}>

                        {/* Use Own CSS Selectors — Toggle */}
                        <div className="tta_field-row tta_toggle-row">
                            <label className="tta_field-label" htmlFor="tta__settings_use_own_css_selectors">
                                {__('Use Own CSS Selectors', 'text-to-audio')}
                            </label>
                            <label className="tta_toggle-switch">
                                <input
                                    type="checkbox"
                                    id="tta__settings_use_own_css_selectors"
                                    name="tta__settings_use_own_css_selectors"
                                    checked={settings.tta__settings_use_own_css_selectors}
                                    onChange={(e) => handleChange(e)}
                                />
                                <span className="tta_toggle-slider" />
                            </label>
                        </div>

                        {/* Include Content By CSS Selectors */}
                        <div className="tta_field-row tta_field-col">
                            <label className="tta_field-label" htmlFor="tta__settings_css_selectors">
                                {__('Include Content By CSS Selectors', 'text-to-audio')}
                                {ttsObj.is_pro_active
                                    ? <InfoTooltip />
                                    : <ProLockTooltip text={__('Include Content By CSS Selectors feature is available in pro version', 'text-to-audio')} />
                                }
                            </label>
                            <textarea
                                className="tta_textarea"
                                id="tta__settings_css_selectors"
                                name="tta__settings_css_selectors"
                                onChange={(e) => handleChange(e)}
                                value={settings.tta__settings_css_selectors}
                                placeholder={ttsObj.is_pro_active
                                    ? __('Multiple selector will be multiline.', 'text-to-audio')
                                    : __('Some content may be missing, It can be found by css selectors', 'text-to-audio')}
                                disabled={!ttsObj.is_pro_active}
                            />
                        </div>

                        {/* Exclude Content By CSS Selectors */}
                        <div className="tta_field-row tta_field-col">
                            <label className="tta_field-label" htmlFor="tta__settings_exclude_content_by_css_selectors">
                                {__('Exclude Content By CSS Selectors', 'text-to-audio')}
                                {ttsObj.is_pro_active
                                    ? <InfoTooltip />
                                    : <ProLockTooltip text={__('Exclude Content By CSS Selectors feature is available in pro version', 'text-to-audio')} />
                                }
                            </label>
                            <textarea
                                className="tta_textarea"
                                id="tta__settings_exclude_content_by_css_selectors"
                                name="tta__settings_exclude_content_by_css_selectors"
                                onChange={(e) => handleChange(e)}
                                value={settings.tta__settings_exclude_content_by_css_selectors}
                                placeholder={ttsObj.is_pro_active
                                    ? __('Multiple selector will be multiline.', 'text-to-audio')
                                    : __('Exclude content by CSS selectors', 'text-to-audio')}
                                disabled={!ttsObj.is_pro_active}
                            />
                        </div>

                        {/* Exclude Tags To Speak */}
                        <div className="tta_field-row tta_field-col">
                            <label className="tta_field-label" htmlFor="tta__settings_exclude_tags">
                                {__('Exclude Tags To Speak', 'text-to-audio')}
                                {ttsObj.is_pro_active
                                    ? <InfoTooltip />
                                    : <ProLockTooltip text={__('Exclude Tags. So that its content skiped. Like ( Subscript, Superscript etc.) This is a pro feature.', 'text-to-audio')} />
                                }
                            </label>
                            <textarea
                                className="tta_textarea"
                                id="tta__settings_exclude_tags"
                                name="tta__settings_exclude_tags"
                                onChange={(e) => handleChange(e)}
                                value={settings.tta__settings_exclude_tags}
                                placeholder={ttsObj.is_pro_active
                                    ? __('Multiple Tags Will Be Pipe(|) Separated.', 'text-to-audio')
                                    : __('Exclude tags is a pro feature.', 'text-to-audio')}
                                disabled={!ttsObj.is_pro_active}
                            />
                        </div>

                        {/* Exclude Texts To Speak */}
                        <div className="tta_field-row tta_field-col">
                            <label className="tta_field-label" htmlFor="tta__settings_exclude_texts">
                                {__('Exclude Texts To Speak', 'text-to-audio')}
                                {ttsObj.is_pro_active
                                    ? <InfoTooltip />
                                    : <ProLockTooltip text={__('Excluding texts to be spoken is a pro feature.', 'text-to-audio')} />
                                }
                            </label>
                            <textarea
                                className="tta_textarea"
                                id="tta__settings_exclude_texts"
                                name="tta__settings_exclude_texts"
                                onChange={(e) => handleChange(e)}
                                value={settings.tta__settings_exclude_texts}
                                placeholder={ttsObj.is_pro_active
                                    ? __('Multiple Texts Will Be Pipe(|) Separated.', 'text-to-audio')
                                    : __('Exclude texts is a pro feature.', 'text-to-audio')}
                                disabled={!ttsObj.is_pro_active}
                            />
                        </div>

                        {/* Save Button */}
                        <div className="tta_save-row">
                            <button type="submit" className="tta_save-btn">
                                {__('Save', 'text-to-audio')}
                            </button>
                        </div>

                    </form>
                </div>
            </React.Fragment>
        ) : (
            <h1>{__('Loading', 'text-to-audio')}</h1>
        )
    );
}