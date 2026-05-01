import React, {useState, useEffect} from 'react';
import {__} from '@wordpress/i18n'
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {postWithoutImage} from '../components/context/utilities';
import toast from '../components/context/Notify';

// Inline styles matching AtlasVoice dashboard design
const styles = {
    card: {
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px',
    },
    header: {
        marginBottom: '4px',
        fontSize: '15px',
        fontWeight: 600,
        color: '#1e1e1e',
    },
    subtitle: {
        fontSize: '13px',
        color: '#757575',
        margin: 0,
    },
    toggleRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    toggleLabel: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#1e1e1e',
    },
    switchTrack: (checked) => ({
        position: 'relative',
        display: 'inline-block',
        width: '40px',
        height: '22px',
        backgroundColor: checked ? '#57D100' : '#ccc',
        borderRadius: '22px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    }),
    switchThumb: (checked) => ({
        position: 'absolute',
        top: '2px',
        left: checked ? '20px' : '2px',
        width: '18px',
        height: '18px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }),
    fieldGroup: {
        marginBottom: '20px',
    },
    fieldHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
    },
    fieldLabel: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#1e1e1e',
    },
    textarea: {
        width: '100%',
        minHeight: '72px',
        padding: '8px 12px',
        fontSize: '13px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        resize: 'vertical',
        fontFamily: 'inherit',
        lineHeight: 1.5,
        boxSizing: 'border-box',
    },
    textareaDisabled: {
        backgroundColor: '#f5f5f5',
        color: '#999',
        cursor: 'not-allowed',
    },
    helperText: {
        fontSize: '12px',
        color: '#757575',
        marginTop: '4px',
        lineHeight: 1.4,
    },
    helpLink: {
        color: '#d32f2f',
        textDecoration: 'none',
        fontSize: '14px',
    },
    lockIcon: {
        fontSize: '12px',
        color: '#999',
        marginLeft: '6px',
        cursor: 'help',
    },
    saveBtn: {
        backgroundColor: '#FF7853',
        color: '#fff',
        border: 'none',
        padding: '12px 28px',
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        width: '100%',
    },
    // TTS-238 D27.18 — accordion styling for the <details>/<summary> wrapper.
    accordion: {
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e2e4e7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        marginBottom: '16px',
    },
    accordionSummary: {
        listStyle: 'none',
        cursor: 'pointer',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #fafbfc 0%, #f1f3f5 100%)',
        borderBottom: '1px solid #e2e4e7',
        userSelect: 'none',
    },
    accordionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    accordionChevron: {
        display: 'inline-block',
        width: '14px',
        textAlign: 'center',
        color: '#6c757d',
        transition: 'transform 0.18s ease',
        fontSize: '12px',
        lineHeight: 1,
    },
    accordionRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
};

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
            [e.target.name]: value,
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

    const isPro = ttsObj.is_pro_active;

    const fields = [
        {
            name: 'tta__settings_css_selectors',
            label: __('Include Content By CSS Selectors', 'text-to-audio'),
            lockTooltip: __('Include Content By CSS Selectors feature is available in pro version', 'text-to-audio'),
            placeholder: isPro
                ? __('Multiple selector will be multiline.', 'text-to-audio')
                : __('Some content may be missing, It can be found by css selectors', 'text-to-audio'),
            helperText: __('Add CSS selectors for the content areas the player should read. One selector per line. Only target post/page body content. If left empty, the player automatically detects the content area.', 'text-to-audio'),
        },
        {
            name: 'tta__settings_exclude_content_by_css_selectors',
            label: __('Exclude Content By CSS Selectors', 'text-to-audio'),
            lockTooltip: __('Exclude Content By CSS Selectors feature is available in pro version', 'text-to-audio'),
            placeholder: isPro
                ? __('Multiple selector will be multiline.', 'text-to-audio')
                : __('Exclude content by CSS selectors', 'text-to-audio'),
            helperText: __('Remove specific elements within the included content areas above. One selector per line. Example: .social-share, .related-posts, .author-bio', 'text-to-audio'),
        },
        {
            name: 'tta__settings_exclude_tags',
            label: __('Exclude HTML Tags To Speak', 'text-to-audio'),
            lockTooltip: __('Exclude Tags. So that its content skipped. Like (Subscript, Superscript etc.) This is a pro feature.', 'text-to-audio'),
            placeholder: isPro
                ? __('Multiple Tags Will Be Pipe(|) Separated.', 'text-to-audio')
                : __('Exclude tags is a pro feature.', 'text-to-audio'),
            helperText: __('HTML tags to skip within the included content. Pipe-separated. script, style, figure, and figcaption are always excluded automatically. Example: sub|sup|blockquote', 'text-to-audio'),
        },
        {
            name: 'tta__settings_exclude_texts',
            label: __('Exclude Texts To Speak', 'text-to-audio'),
            lockTooltip: __('Excluding texts to be spoken is a pro feature.', 'text-to-audio'),
            placeholder: isPro
                ? __('Multiple Texts Will Be Pipe(|) Separated.', 'text-to-audio')
                : __('Exclude texts is a pro feature.', 'text-to-audio'),
            helperText: __('Exact text patterns to remove from the spoken content. Pipe-separated. Applied after all CSS and tag exclusions. Example: Read more...|Advertisement|Sponsored Content', 'text-to-audio'),
        },
    ];

    if (!isDataLoaded) {
        return <div style={{padding: '16px', color: '#757575', fontSize: '13px'}}>{__('Loading...', 'text-to-audio')}</div>;
    }

    return (
        <React.Fragment>
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
            <form onSubmit={handleSubmit}>
                {/* TTS-238 D27.18 — Accordion-styled <details> wrapper (closed by
                    default). Custom-styled summary with hidden native marker,
                    a rotating chevron, and the Pick Visually button on the
                    right. e.preventDefault() / stopPropagation on the button
                    keeps it from toggling the accordion. */}
                <style>{`
                    .tta-cssrules-acc > summary { list-style: none; }
                    .tta-cssrules-acc > summary::-webkit-details-marker { display: none; }
                    .tta-cssrules-acc[open] .tta-cssrules-chev { transform: rotate(90deg); }
                `}</style>
                <details className="tta-cssrules-acc" style={styles.accordion}>
                    <summary style={styles.accordionSummary}>
                        <div style={styles.accordionTitle}>
                            <span className="tta-cssrules-chev" style={styles.accordionChevron}>&#9654;</span>
                            <div>
                                <h3 style={{...styles.header, margin: 0}}>{__('CSS Selectors for This Post', 'text-to-audio')}</h3>
                                <p style={{...styles.subtitle, margin: 0}}>{__('Override global content extraction settings for this post only.', 'text-to-audio')}</p>
                            </div>
                        </div>
                        {/* TTS-238 D27.16 — Pick Visually launcher (per-post scope).
                            Render whenever we have a post id; the per-post
                            metabox itself is Pro-only (mount target lives in
                            the Pro plugin), so an isPro gate here would be
                            redundant. */}
                        {tta_obj && tta_obj.post_id && (
                            <button
                                type="button"
                                className="btn btn-sm btn-dark"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                        const postId   = parseInt(tta_obj.post_id, 10);
                                        const permalink = (tta_obj.post_permalink || tta_obj.permalink || '').toString();
                                        if (!permalink) {
                                            window.alert(__('Could not resolve this post URL. Save the post first.', 'text-to-audio'));
                                            return;
                                        }
                                        const u = new URL(permalink, window.location.origin);
                                        u.searchParams.set('atlasvoice_picker', '1');
                                        u.searchParams.set('scope', 'post:' + postId);
                                        window.open(u.toString(), '_blank');
                                    } catch (err) {
                                        window.alert(__('Could not open the picker: ', 'text-to-audio') + (err && err.message));
                                    }
                                }}
                            >
                                <span style={{marginRight: 6}}>&#9654;</span>
                                {__('Pick Visually', 'text-to-audio')}
                            </button>
                        )}
                    </summary>
                <div style={{padding: '20px'}}>
                    {/* Toggle Row */}
                    <div style={styles.toggleRow}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <span style={styles.toggleLabel}>{__('Use Own CSS Selectors', 'text-to-audio')}</span>
                            {!isPro && (
                                <span style={styles.lockIcon} title={__('Per-post CSS selectors is a pro feature.', 'text-to-audio')}>
                                    <span className="dashicons dashicons-lock" style={{fontSize: '14px'}}></span>
                                </span>
                            )}
                        </div>
                        <label style={{margin: 0, cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={settings.tta__settings_use_own_css_selectors}
                                onChange={handleChange}
                                name="tta__settings_use_own_css_selectors"
                                id="tta__settings_use_own_css_selectors"
                                style={{display: 'none'}}
                            />
                            <span style={styles.switchTrack(settings.tta__settings_use_own_css_selectors)}>
                                <span style={styles.switchThumb(settings.tta__settings_use_own_css_selectors)}></span>
                            </span>
                        </label>
                    </div>
                    <div style={{...styles.helperText, marginBottom: '16px'}}>
                        {__('When enabled, the selectors below override the global settings (Settings > CSS Selectors) for this post only. Only non-empty fields override — empty fields keep the global value.', 'text-to-audio')}
                    </div>

                    {/* Fields */}
                    {fields.map((field) => (
                        <div key={field.name} style={styles.fieldGroup}>
                            <div style={styles.fieldHeader}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label htmlFor={field.name} style={styles.fieldLabel}>{field.label}</label>
                                    {!isPro && (
                                        <span style={styles.lockIcon} title={field.lockTooltip}>
                                            <span className="dashicons dashicons-lock" style={{fontSize: '14px'}}></span>
                                        </span>
                                    )}
                                </div>
                                <a
                                    style={styles.helpLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.youtube.com/watch?v=TfgDezWuFkA&t=350s&ab_channel=AtlasAiDev"
                                    title={__('Click To Know How It Works?', 'text-to-audio')}
                                >
                                    <span className="dashicons dashicons-editor-help" style={{fontSize: '18px'}}></span>
                                </a>
                            </div>
                            <textarea
                                id={field.name}
                                name={field.name}
                                rows={3}
                                onChange={handleChange}
                                value={settings[field.name]}
                                placeholder={field.placeholder}
                                disabled={!isPro}
                                style={{
                                    ...styles.textarea,
                                    ...(!isPro ? styles.textareaDisabled : {}),
                                }}
                            />
                            <div style={styles.helperText}>{field.helperText}</div>
                        </div>
                    ))}
                </div>
                </details>

                {/* Save Button */}
                <button
                    type="submit"
                    style={styles.saveBtn}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e83e0e'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#FF7853'}
                >
                    {__('Save', 'text-to-audio')}
                </button>
            </form>
        </React.Fragment>
    );
}
