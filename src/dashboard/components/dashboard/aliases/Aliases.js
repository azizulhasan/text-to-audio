import React, {useEffect, useMemo, useState} from "react";
import { __, sprintf } from "@wordpress/i18n";
import {Col, Container, Form, Row} from "react-bootstrap";
import UpgradeToPro from "../../UpgradeToPro";
import toast from '../../context/Notify';
import {postWithoutImage} from "../../context/utilities";
import { proUrl } from "../../../proUrl";
import Icon from "../../Icon";
import PronunciationFiltersGuide from "./PronunciationFiltersGuide";

// TTS-319: the matcher lives on the player class (TextToSpeech.buildAliasRule),
// shared with every player. window.TextToSpeech is the class, or an instance
// once a player ran getData().
const getAliasEngine = () => {
    const tts = window.TextToSpeech;
    const cls = typeof tts === 'function' ? tts : tts?.constructor;
    return cls?.buildAliasRule ? cls : null;
};

const hasDigit = (text) => /\p{Nd}/u.test(text || '');

// Translation plugins whose visitors hear the same alias list in every language.
const MULTILINGUAL_PLUGIN = /gtranslate|sitepress|polylang|translatepress|weglot/i;

export default function Aliases() {
    const [ttsTextAliases, setTtsTextAliases] = useState([
        {actual_text: '', to_read: ''}
    ]);
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [showLimit, setShowLimit] = useState(false);
    const [sample, setSample] = useState(__('Introduction: a 5k budget and a 250k budget.', 'text-to-audio'));

    const isPro = !!ttsObj?.is_atlasvoice_addon_functional;
    const isMultilingual = Object.keys(ttsObj?.compatible || {}).some((key) => MULTILINGUAL_PLUGIN.test(key));

    useEffect(() => {
        let formData = new FormData();
        formData.append('method', 'get');
        postWithoutImage(tta_obj.api_url + 'tta/v1/text_alias', formData).then((res) => {
            if(res?.data && res?.data?.length) {
                setTtsTextAliases(res.data)
            }
            setIsDataLoaded(true)
        });
    }, []);

    const handleAddRow = () => {
        if (!isPro && ttsTextAliases.length >= 1) {
            setShowLimit(true);
            return;
        }
        setTtsTextAliases([...ttsTextAliases, {actual_text: '', to_read: ''}]);
    };

    const handleDeleteRow = (index) => {
        setTtsTextAliases(ttsTextAliases.filter((_, idx) => idx !== index));
        setShowLimit(false);
    };

    const handleInputChange = (index, field, value) => {
        const newAliases = [...ttsTextAliases];
        newAliases[index] = {...newAliases[index], [field]: value};
        setTtsTextAliases(newAliases);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        for (const alias of ttsTextAliases) {
            if (alias.actual_text === '' || alias.to_read === '') {
                toast(__('All fields must be filled!', 'text-to-audio'), 'error');
                return;
            }
        }
        // Keep the stored shape {actual_text, to_read}; apply_to_numbers is
        // added only when ticked, so old aliases stay byte-identical.
        let finalAliases = ttsTextAliases.map((alias) => {
            const row = { actual_text: alias.actual_text.trim(), to_read: alias.to_read.trim() };
            if (alias.apply_to_numbers && hasDigit(row.actual_text)) {
                row.apply_to_numbers = true;
            }
            return row;
        })
        let formData = new FormData();
        formData.append('aliases', JSON.stringify(finalAliases));
        formData.append('method', 'post');
        postWithoutImage(tta_obj.api_url + 'tta/v1/text_alias', formData)
            .then((res) => {
                if (res?.data) {
                    setTtsTextAliases(res.data)
                }
                toast(__('Successfully Saved.', 'text-to-audio'), 'info', {
                    autoClose: 2500
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    // What one alias would also change, e.g. "250k → 250 thousand".
    const numberHint = (alias) => {
        const engine = getAliasEngine();
        if (!engine || !alias.apply_to_numbers || !hasDigit(alias.actual_text)) {
            return {ok: true, text: ''};
        }
        const numbers = alias.actual_text.match(/\p{Nd}+(?:[.,'  ]\p{Nd}+)*/gu) || [];
        if (!numbers.every((n) => (alias.to_read || '').includes(n))) {
            return {ok: false, text: __('Use the same number in both boxes, for example 5k → 5 thousand.', 'text-to-audio')};
        }
        const example = alias.actual_text.replace(numbers[0], numbers[0] === '250' ? '12' : '250');
        const rule = engine.buildAliasRule(alias);
        /* translators: %s: an example such as "250k → 250 thousand" */
        return {ok: true, text: sprintf(__('Also changes: %s', 'text-to-audio'), example + ' → ' + example.replace(rule.regex, rule.replace))};
    };

    const preview = useMemo(() => {
        const engine = getAliasEngine();
        const active = isPro ? ttsTextAliases : ttsTextAliases.slice(0, 1);
        return engine ? engine.replaceAliases(sample, active) : sample;
    }, [sample, ttsTextAliases, isPro]);

    const listen = () => {
        try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(preview));
        } catch (e) {}
    };

    return isDataLoaded ? (
        <React.Fragment>
            <Container fluid className="tta-container">
                <Row>
                    <Col xs={12} lg={8}>
                        <div className="tta_aliases_header_card">
                            <h2 className="tta_aliases_title">
                               {__('Pronunciation', 'text-to-audio')}
                            </h2>
                            <p className="tta_aliases_description">
                               {__('Write a word as it appears on your site, then how it should be spoken.', 'text-to-audio')}
                            </p>
                        </div>

                        <Form onSubmit={handleSubmit}>
                            <div className="tta_aliases_card">
                                {isMultilingual && (
                                    <div className="tta_aliases_notice">
                                        <strong>{__('Your site uses a translation plugin', 'text-to-audio')}</strong>
                                        <span>{__('Add one row for each language, using the word exactly as it appears in that language. For example, add Introduction → Intro for English and Einführung → Einleitung for German.', 'text-to-audio')}</span>
                                    </div>
                                )}

                                {ttsTextAliases.map((alias, index) => {
                                    const hint = numberHint(alias);
                                    return (
                                        <div key={index} className="tta_aliases_item">
                                            <div className="tta_aliases_row">
                                                <div className="tta_aliases_input_wrapper">
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={__('Introduction', 'text-to-audio')}
                                                        aria-label={__('How it appears on your site', 'text-to-audio')}
                                                        value={alias.actual_text}
                                                        onChange={(e) => handleInputChange(index, 'actual_text', e.target.value)}
                                                        className="tta_aliases_input"
                                                    />
                                                </div>
                                                <span className="tta_aliases_arrow" aria-hidden="true">→</span>
                                                <div className="tta_aliases_input_wrapper">
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={__('Intro', 'text-to-audio')}
                                                        aria-label={__('How it should be spoken', 'text-to-audio')}
                                                        value={alias.to_read}
                                                        onChange={(e) => handleInputChange(index, 'to_read', e.target.value)}
                                                        className="tta_aliases_input"
                                                    />
                                                </div>
                                                <div className="tta_aliases_action_wrapper">
                                                    <button
                                                        type="button"
                                                        className="tta_aliases_delete_btn"
                                                        aria-label={__('Delete', 'text-to-audio')}
                                                        onClick={() => handleDeleteRow(index)}
                                                    >
                                                        <span className="dashicons dashicons-trash"></span>
                                                    </button>
                                                </div>
                                            </div>
                                            {hasDigit(alias.actual_text) && (
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`tta_alias_numbers_${index}`}
                                                    className="tta_aliases_numbers"
                                                    label={__('Also apply to other numbers', 'text-to-audio')}
                                                    checked={!!alias.apply_to_numbers}
                                                    onChange={(e) => handleInputChange(index, 'apply_to_numbers', e.target.checked)}
                                                />
                                            )}
                                            {hint.text && (
                                                <p className={hint.ok ? 'tta_aliases_hint' : 'tta_aliases_hint tta_aliases_hint_warn'}>{hint.text}</p>
                                            )}
                                        </div>
                                    );
                                })}

                                {showLimit && (
                                    <p className="tta_aliases_limit">
                                        {__('The free version includes one pronunciation. Upgrade to Pro to add as many as you need.', 'text-to-audio')}{' '}
                                        <a target='_blank' rel='noopener noreferrer' href={proUrl('aliases_tab')}>
                                            {__('Upgrade to Pro', 'text-to-audio')}
                                        </a>
                                    </p>
                                )}

                                <div className="tta_aliases_actions_section">
                                    <button
                                        type="button"
                                        className="tta_aliases_add_btn"
                                        onClick={handleAddRow}
                                    >
                                        <span className="tta_aliases_add_icon">⊕</span> {__('Add pronunciation', 'text-to-audio')}
                                    </button>
                                    <button type='submit' className='tta_aliases_save_btn'>
                                         {__('Save', 'text-to-audio')}
                                    </button>
                                </div>
                            </div>
                        </Form>

                        <div className="tta_aliases_card tta_aliases_try">
                            <div className="tta_aliases_try_head">
                                <label htmlFor="tta_aliases_sample">{__('Try it with your own text', 'text-to-audio')}</label>
                                <button type="button" className="tta_aliases_add_btn" onClick={listen}>
                                    {__('Listen', 'text-to-audio')}
                                </button>
                            </div>
                            <Form.Control
                                as="textarea"
                                id="tta_aliases_sample"
                                rows={2}
                                value={sample}
                                onChange={(e) => setSample(e.target.value)}
                            />
                            <p className="tta_aliases_try_label">{__('Will be read as', 'text-to-audio')}</p>
                            <p className="tta_aliases_try_output">{preview}</p>
                        </div>

                        {isPro && (
                            <details className="tta_aliases_card tta_aliases_dev">
                                <summary>{__('For developers: add pronunciation rules with code', 'text-to-audio')}</summary>
                                <PronunciationFiltersGuide />
                            </details>
                        )}
                    </Col>

                    <Col xs={12} lg={4}>
                        <UpgradeToPro
                            promotionType={'analytics'}
                            extraDocs={isPro ? [{
                                title: __('Add pronunciation rules with code', 'text-to-audio'),
                                body: <PronunciationFiltersGuide />,
                            }] : []}
                        />
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    ) : (
        <div className="tta_aliases_loading">
            <div>
                <Icon name="spinner" spin />
                <span className="tta_aliases_loading_text">{__('Loading...', 'text-to-audio')}</span>
            </div>
        </div>
    );
};
