import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	Notice,
	RadioControl,
	RangeControl,
	SelectControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';

import useSettingsForm from '../hooks/use-settings-form';
import ColorRow from '../shell/ColorRow';
import { Chip, Pane, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import { MIN_TEXT_CONTRAST, contrastRatio, onWhite } from '../util/contrast';

// The colour the player fades text to (admin/js/tts/highlighter.js).
const FADED_TEXT_RGB = [ 60, 64, 67 ];

const SENTENCE_COLORS = [
	{ name: __( 'Lavender', 'text-to-audio' ), color: '#e8e7fe' },
	{ name: __( 'Aqua', 'text-to-audio' ), color: '#cffafe' },
	{ name: __( 'Yellow', 'text-to-audio' ), color: '#fef3c7' },
];
const WORD_COLORS = [
	{ name: __( 'Periwinkle', 'text-to-audio' ), color: '#a5abf0' },
	{ name: __( 'Amber', 'text-to-audio' ), color: '#fcd34d' },
];
const WORD_TEXT_COLORS = [
	{ name: __( 'Near black', 'text-to-audio' ), color: '#202124' },
	{ name: __( 'White', 'text-to-audio' ), color: '#ffffff' },
];

/**
 * Says, in words and numbers, whether the spoken word can be read.
 *
 * @param {Object} props
 * @param {string} props.text       Text colour.
 * @param {string} props.background Background colour.
 * @return {*} The line, or nothing when a colour is not a hex value.
 */
function ContrastLine( { text, background } ) {
	const ratio = contrastRatio( text, background );
	if ( ratio === null ) {
		return null;
	}

	// Judged on the number that is shown, so the word and the number never disagree.
	const shown = Math.round( ratio * 10 ) / 10;
	const passes = shown >= MIN_TEXT_CONTRAST;

	return (
		<span role="status">
			<Chip tone={ passes ? 'ok' : 'warn' }>
				{ passes
					? __( 'Easy to read', 'text-to-audio' )
					: __( 'Hard to read', 'text-to-audio' ) }
			</Chip>{ ' ' }
			{ sprintf(
				/* translators: 1: a contrast ratio such as 7.2, 2: the smallest allowed ratio. */
				__(
					'Contrast %1$s to 1. Text needs at least %2$s to 1.',
					'text-to-audio'
				),
				shown.toFixed( 1 ),
				MIN_TEXT_CONTRAST
			) }
		</span>
	);
}

/**
 * A short article that shows the settings before they are saved: one
 * sentence being read, one word spoken, the rest faded.
 *
 * @param {Object} props
 * @param {Object} props.values The settings on screen.
 * @return {*} The preview.
 */
function Preview( { values } ) {
	const on = values.tta__highlight_enabled;
	const mode = values.tta__highlight_mode;
	const showSentence = on && mode !== 'word';
	const showWord = on && mode !== 'sentence';
	const faded =
		on && values.tta__highlight_dim_enabled
			? {
					color: `rgba(60, 64, 67, ${ values.tta__highlight_dim_opacity })`,
			  }
			: undefined;

	return (
		<aside
			className="atlasvoice-preview"
			aria-label={ __( 'Preview', 'text-to-audio' ) }
		>
			<b className="atlasvoice-preview-title">
				{ __( 'Preview', 'text-to-audio' ) }
			</b>
			<div className="atlasvoice-preview-page">
				<p style={ faded }>
					{ __(
						'The old mill stands by the river, as it has for two hundred years.',
						'text-to-audio'
					) }
				</p>
				<p>
					<span
						className="atlasvoice-preview-sentence"
						style={
							showSentence
								? {
										background:
											values.tta__highlight_sentence_bg,
								  }
								: undefined
						}
					>
						{ __( 'Every spring the wheel', 'text-to-audio' ) }{ ' ' }
						<span
							className="atlasvoice-preview-word"
							style={
								showWord
									? {
											background:
												values.tta__highlight_word_bg,
											color: values.tta__highlight_word_color,
									  }
									: undefined
							}
						>
							{ __( 'turns', 'text-to-audio' ) }
						</span>{ ' ' }
						{ __( 'again for the visitors.', 'text-to-audio' ) }
					</span>
				</p>
				<p style={ faded }>
					{ __(
						'Children watch the water fall and ask how it works.',
						'text-to-audio'
					) }
				</p>
			</div>
			<p className="atlasvoice-weak">
				{ on
					? __(
							'This is how the text looks while it is read. Visitors see it after you save.',
							'text-to-audio'
					  )
					: __(
							'Highlighting is off, so the text stays as it is.',
							'text-to-audio'
					  ) }
			</p>
		</aside>
	);
}

/**
 * Player › Read-along: highlight the text while it is read, and let readers
 * listen to a selection. A form with a Save footer and a live preview.
 *
 * @return {*} The screen.
 */
export default function PlayerReadAlong() {
	const form = useSettingsForm(
		'tta/v1/read-along',
		__(
			'Read-along saved. Visitors see the change on their next page load.',
			'text-to-audio'
		)
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-pad">
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: form.reload,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The read-along settings could not be loaded: %s',
								'text-to-audio'
							),
							form.failure
						) }
					</Notice>
				</div>
			</Pane>
		);
	}

	if ( form.loading ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	const on = values.tta__highlight_enabled;
	const mode = values.tta__highlight_mode;
	// Shown as a whole percentage; stored as a number from 0.1 to 0.85.
	const visibility = Math.round( values.tta__highlight_dim_opacity * 100 );

	return (
		<Pane
			canvas
			footer={
				<SaveBar
					dirty={ form.dirty }
					saving={ form.saving }
					onSave={ form.save }
				/>
			}
		>
			<div className="atlasvoice-withpreview">
				<div className="atlasvoice-scroll">
					<div className="atlasvoice-pad atlasvoice-pad-form">
						<Section
							title={ __(
								'Highlight while reading',
								'text-to-audio'
							) }
							description={ __(
								'Highlight the text as it is read, so listeners can follow. Off by default.',
								'text-to-audio'
							) }
						>
							<Card>
								<CardBody>
									<div className="atlasvoice-form">
										<ToggleControl
											__nextHasNoMarginBottom
											label={ __(
												'Highlight while reading',
												'text-to-audio'
											) }
											checked={ on }
											onChange={ ( value ) =>
												set(
													'tta__highlight_enabled',
													value
												)
											}
										/>
										{ on && (
											<>
												<RadioControl
													label={ __(
														'What to highlight',
														'text-to-audio'
													) }
													help={ __(
														'Word by word needs the browser voice, Google Cloud or ElevenLabs. Other voices highlight sentences.',
														'text-to-audio'
													) }
													selected={ mode }
													options={ [
														{
															label: __(
																'Sentence',
																'text-to-audio'
															),
															value: 'sentence',
														},
														{
															label: __(
																'Word',
																'text-to-audio'
															),
															value: 'word',
														},
														{
															label: __(
																'Both',
																'text-to-audio'
															),
															value: 'word_sentence',
														},
													] }
													onChange={ ( value ) =>
														set(
															'tta__highlight_mode',
															value
														)
													}
												/>
												{ mode !== 'word' && (
													<ColorRow
														label={ __(
															'Sentence colour',
															'text-to-audio'
														) }
														colors={
															SENTENCE_COLORS
														}
														value={
															values.tta__highlight_sentence_bg
														}
														onChange={ ( value ) =>
															set(
																'tta__highlight_sentence_bg',
																value
															)
														}
													/>
												) }
												{ mode !== 'sentence' && (
													<>
														<ColorRow
															label={ __(
																'Word colour',
																'text-to-audio'
															) }
															colors={
																WORD_COLORS
															}
															value={
																values.tta__highlight_word_bg
															}
															onChange={ (
																value
															) =>
																set(
																	'tta__highlight_word_bg',
																	value
																)
															}
														/>
														<ColorRow
															label={ __(
																'Word text colour',
																'text-to-audio'
															) }
															colors={
																WORD_TEXT_COLORS
															}
															value={
																values.tta__highlight_word_color
															}
															onChange={ (
																value
															) =>
																set(
																	'tta__highlight_word_color',
																	value
																)
															}
															note={
																<ContrastLine
																	text={
																		values.tta__highlight_word_color
																	}
																	background={
																		values.tta__highlight_word_bg
																	}
																/>
															}
														/>
													</>
												) }
												<ToggleControl
													__nextHasNoMarginBottom
													label={ __(
														'Fade the rest of the article',
														'text-to-audio'
													) }
													checked={
														values.tta__highlight_dim_enabled
													}
													onChange={ ( value ) =>
														set(
															'tta__highlight_dim_enabled',
															value
														)
													}
												/>
												{ values.tta__highlight_dim_enabled && (
													<div className="atlasvoice-form">
														<RangeControl
															__nextHasNoMarginBottom
															__next40pxDefaultSize
															label={ __(
																'How visible the faded text stays (%)',
																'text-to-audio'
															) }
															help={ __(
																'Lower is more faded. 75 or more keeps the text easy to read on a white page.',
																'text-to-audio'
															) }
															value={ visibility }
															min={ 10 }
															max={ 85 }
															step={ 5 }
															onChange={ (
																value
															) =>
																set(
																	'tta__highlight_dim_opacity',
																	value / 100
																)
															}
														/>
														<div className="atlasvoice-color-row-note">
															<ContrastLine
																text={ onWhite(
																	FADED_TEXT_RGB,
																	values.tta__highlight_dim_opacity
																) }
																background="#ffffff"
															/>{ ' ' }
															{ __(
																'Measured on a white page.',
																'text-to-audio'
															) }
														</div>
													</div>
												) }
												<ToggleControl
													__nextHasNoMarginBottom
													label={ __(
														'Scroll to follow the reading',
														'text-to-audio'
													) }
													help={ __(
														'Stops following when the reader scrolls.',
														'text-to-audio'
													) }
													checked={
														values.tta__highlight_autoscroll
													}
													onChange={ ( value ) =>
														set(
															'tta__highlight_autoscroll',
															value
														)
													}
												/>
											</>
										) }
									</div>
								</CardBody>
							</Card>
						</Section>
						<Section
							title={ __(
								'Listen to a selection',
								'text-to-audio'
							) }
							description={ __(
								'Readers select any text and press Listen. It works whether highlighting is on or off.',
								'text-to-audio'
							) }
						>
							<Card>
								<CardBody>
									<div className="atlasvoice-form">
										<ToggleControl
											__nextHasNoMarginBottom
											label={ __(
												'Allow listening to selected text',
												'text-to-audio'
											) }
											checked={
												values.tta__selection_listen_enabled
											}
											onChange={ ( value ) =>
												set(
													'tta__selection_listen_enabled',
													value
												)
											}
										/>
										{ values.tta__selection_listen_enabled && (
											<SelectControl
												__nextHasNoMarginBottom
												__next40pxDefaultSize
												label={ __(
													'Tell readers about it',
													'text-to-audio'
												) }
												value={
													values.tta__selection_announce
												}
												options={ [
													{
														label: __(
															'A tip under the player',
															'text-to-audio'
														),
														value: 'tip',
													},
													{
														label: __(
															'A small side tab',
															'text-to-audio'
														),
														value: 'badge',
													},
													{
														label: __(
															'Both',
															'text-to-audio'
														),
														value: 'both',
													},
													{
														label: __(
															'Don’t mention it',
															'text-to-audio'
														),
														value: 'off',
													},
												] }
												onChange={ ( value ) =>
													set(
														'tta__selection_announce',
														value
													)
												}
											/>
										) }
									</div>
								</CardBody>
							</Card>
						</Section>
					</div>
				</div>
				<Preview values={ values } />
			</div>
		</Pane>
	);
}
