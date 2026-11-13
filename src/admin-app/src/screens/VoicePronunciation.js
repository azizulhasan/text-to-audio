import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	PanelBody,
	Spinner,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Drawer, { DrawerSection } from '../shell/Drawer';
import { Chip, Empty, Pane, ProNote, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/pronunciation';
const HAS_DIGIT = /\p{Nd}/u;

/**
 * Reads a text aloud with the browser's own voice, when the browser has one.
 *
 * @param {string} text What to say.
 * @return {boolean} False when this browser cannot speak.
 */
function speak( text ) {
	const synth = window.speechSynthesis;
	if ( ! synth || typeof window.SpeechSynthesisUtterance !== 'function' ) {
		return false;
	}

	synth.cancel();
	synth.speak( new window.SpeechSynthesisUtterance( text ) );

	return true;
}

/**
 * The drawer that adds or edits one rule. Saving writes the whole list at
 * once, so the list on the server is always what the table shows.
 *
 * @param {Object}   props
 * @param {Object}   props.rule     The rule being edited: { index, actual_text, to_read, apply_to_numbers }. index -1 is a new rule.
 * @param {boolean}  props.busy     Whether a save is running.
 * @param {Function} props.onSave   Called with the edited rule.
 * @param {Function} props.onRemove Called to remove the rule.
 * @param {Function} props.onClose  Called to close without saving.
 * @return {*} The drawer.
 */
function RuleDrawer( { rule, busy, onSave, onRemove, onClose } ) {
	const { notify } = useApp();
	const [ draft, setDraft ] = useState( rule );
	const isNew = rule.index < 0;
	const word = draft.actual_text.trim();
	const say = draft.to_read.trim();
	const hasDigit = HAS_DIGIT.test( word );

	return (
		<Drawer
			title={
				isNew
					? __( 'Add a word', 'text-to-audio' )
					: sprintf(
							/* translators: %s: a word or phrase. */
							__( 'Edit “%s”', 'text-to-audio' ),
							rule.actual_text
					  )
			}
			kicker={ __( 'Pronunciation', 'text-to-audio' ) }
			onClose={ onClose }
			footer={
				<>
					{ ! isNew && (
						<Button
							variant="secondary"
							isDestructive
							className="atlasvoice-footer-note"
							disabled={ busy }
							onClick={ onRemove }
							__next40pxDefaultSize
						>
							{ __( 'Remove', 'text-to-audio' ) }
						</Button>
					) }
					{ isNew && <span className="atlasvoice-footer-note" /> }
					<Button
						variant="tertiary"
						onClick={ onClose }
						__next40pxDefaultSize
					>
						{ __( 'Cancel', 'text-to-audio' ) }
					</Button>
					<Button
						variant="primary"
						disabled={ ! word || ! say || busy }
						isBusy={ busy }
						onClick={ () =>
							onSave( {
								...draft,
								actual_text: word,
								to_read: say,
								apply_to_numbers:
									hasDigit && draft.apply_to_numbers,
							} )
						}
						__next40pxDefaultSize
					>
						{ __( 'Save', 'text-to-audio' ) }
					</Button>
				</>
			}
		>
			<DrawerSection>
				<div className="atlasvoice-form">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'On your site', 'text-to-audio' ) }
						help={ __(
							'The word as it is written. Whole words only: “WP” never changes “WPML”.',
							'text-to-audio'
						) }
						value={ draft.actual_text }
						onChange={ ( value ) =>
							setDraft( { ...draft, actual_text: value } )
						}
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Say it as', 'text-to-audio' ) }
						value={ draft.to_read }
						onChange={ ( value ) =>
							setDraft( { ...draft, to_read: value } )
						}
					/>
					{ hasDigit && (
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __(
								'Similar numbers too',
								'text-to-audio'
							) }
							help={ __(
								'“5k → 5 thousand” also changes “250k”. Use the same number in both boxes.',
								'text-to-audio'
							) }
							checked={ !! draft.apply_to_numbers }
							onChange={ ( value ) =>
								setDraft( {
									...draft,
									apply_to_numbers: value,
								} )
							}
						/>
					) }
					<div>
						<Button
							variant="secondary"
							disabled={ ! say }
							onClick={ () => {
								if ( ! speak( say ) ) {
									notify(
										__(
											'This browser cannot read text aloud.',
											'text-to-audio'
										),
										'error'
									);
								}
							} }
							__next40pxDefaultSize
						>
							{ __( 'Listen', 'text-to-audio' ) }
						</Button>
					</div>
				</div>
			</DrawerSection>
		</Drawer>
	);
}

/**
 * Voice › Pronunciation: words the voice should say differently.
 *
 * A table of rules, a drawer to add or edit one, and "Try it" to hear a
 * sentence before visitors do. The rules, the limit and the preview all come
 * from the site (Pronunciation\Rules), the same code that reads the posts.
 *
 * @return {*} The screen.
 */
export default function VoicePronunciation() {
	const { boot, go, notify } = useApp();
	const [ state, setState ] = useState( null );
	const [ failure, setFailure ] = useState( null );
	const [ editing, setEditing ] = useState( null );
	const [ busy, setBusy ] = useState( false );
	const [ sample, setSample ] = useState(
		__( 'Our WP site reached 2026 readers in one week.', 'text-to-audio' )
	);
	const [ readAs, setReadAs ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( null );
		try {
			setState( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	// "Read as": asked from the site a moment after typing stops, so the
	// screen shows exactly what the plugin's own matcher will produce.
	const rules = state?.rules;
	useEffect( () => {
		if ( ! rules ) {
			return undefined;
		}

		let stale = false;
		const timer = setTimeout( async () => {
			try {
				const result = await request( boot, ROUTE + '/preview', {
					method: 'POST',
					data: { text: sample },
				} );
				if ( ! stale ) {
					setReadAs( result.text );
				}
			} catch ( error ) {
				if ( ! stale ) {
					setReadAs( '' );
				}
			}
		}, 400 );

		return () => {
			stale = true;
			clearTimeout( timer );
		};
	}, [ boot, sample, rules ] );

	const save = async ( nextRules, message ) => {
		setBusy( true );
		try {
			setState(
				await request( boot, ROUTE, {
					method: 'POST',
					data: { rules: nextRules },
				} )
			);
			setEditing( null );
			notify( message );
		} catch ( error ) {
			notify( error.message, 'error' );
		}
		setBusy( false );
	};

	if ( failure ) {
		return (
			<Pane canvas>
				<Scroll width={ 900 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: load,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The pronunciation rules could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	if ( ! state ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	const { max, applied } = state;
	const full = max > 0 && rules.length >= max;
	const tableName = __(
		'Words the voice should say differently',
		'text-to-audio'
	);
	const startAdding = () =>
		setEditing( {
			index: -1,
			actual_text: '',
			to_read: '',
			apply_to_numbers: false,
		} );
	const numbersLabel = ( rule ) => {
		if ( ! HAS_DIGIT.test( rule.actual_text ) ) {
			return '—';
		}

		return rule.apply_to_numbers
			? __( 'Similar numbers too', 'text-to-audio' )
			: __( 'This number only', 'text-to-audio' );
	};

	return (
		<Pane canvas>
			<Scroll width={ 900 }>
				<Section
					title={ tableName }
					description={ __(
						'Applies to every voice and language. Whole words only: “WP” changes “WP” and “wp”, never “WPML”.',
						'text-to-audio'
					) }
					end={
						! full && (
							<Button
								variant="secondary"
								onClick={ startAdding }
								__next40pxDefaultSize
							>
								{ __( 'Add a word', 'text-to-audio' ) }
							</Button>
						)
					}
				>
					<Card>
						{ rules.length > 0 ? (
							// A table that scrolls sideways on a phone must be reachable by keyboard.
							// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
							<div
								className="atlasvoice-table-wrap"
								tabIndex={ 0 }
								role="region"
								aria-label={ tableName }
							>
								<table className="atlasvoice-table">
									<thead>
										<tr>
											<th scope="col">
												{ __(
													'On your site',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												{ __(
													'Say it as',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												{ __(
													'Numbers',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												<span className="screen-reader-text">
													{ __(
														'Actions',
														'text-to-audio'
													) }
												</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{ rules.map( ( rule, index ) => (
											<tr
												key={ rule.actual_text }
												className={
													index >= applied
														? 'is-off'
														: undefined
												}
											>
												<td>
													<span className="atlasvoice-cell-title">
														{ rule.actual_text }
													</span>
												</td>
												<td className="atlasvoice-cell-main">
													{ rule.to_read }
													{ index >= applied && (
														<>
															{ ' ' }
															<Chip tone="warn">
																{ __(
																	'Not used',
																	'text-to-audio'
																) }
															</Chip>
														</>
													) }
												</td>
												<td>
													{ numbersLabel( rule ) }
												</td>
												<td className="atlasvoice-td-end">
													<Button
														variant="tertiary"
														size="compact"
														onClick={ () =>
															setEditing( {
																...rule,
																index,
															} )
														}
														aria-label={ sprintf(
															/* translators: %s: a word or phrase. */
															__(
																'Edit “%s”',
																'text-to-audio'
															),
															rule.actual_text
														) }
													>
														{ __(
															'Edit',
															'text-to-audio'
														) }
													</Button>
												</td>
											</tr>
										) ) }
									</tbody>
								</table>
							</div>
						) : (
							<Empty
								title={ __( 'No words yet', 'text-to-audio' ) }
								action={
									<Button
										variant="secondary"
										onClick={ startAdding }
										__next40pxDefaultSize
									>
										{ __( 'Add a word', 'text-to-audio' ) }
									</Button>
								}
							>
								{ __(
									'Add brand names or abbreviations the voice gets wrong.',
									'text-to-audio'
								) }
							</Empty>
						) }
					</Card>
					{ full && (
						<div className="atlasvoice-pronote-wrap">
							<ProNote onSeePro={ () => go( 'account:plans' ) }>
								{ sprintf(
									/* translators: %d: number of words. */
									__(
										'As many words as you need. Free keeps %d.',
										'text-to-audio'
									),
									max
								) }
							</ProNote>
						</div>
					) }
				</Section>
				<Section
					title={ __( 'Try it', 'text-to-audio' ) }
					description={ __(
						'Type a sentence to hear how it will be read.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __( 'Sentence', 'text-to-audio' ) }
									hideLabelFromVision
									value={ sample }
									onChange={ setSample }
									rows={ 2 }
								/>
								<div className="atlasvoice-tryit">
									<Button
										variant="primary"
										disabled={ ! sample.trim() }
										onClick={ () => {
											if ( ! speak( readAs || sample ) ) {
												notify(
													__(
														'This browser cannot read text aloud.',
														'text-to-audio'
													),
													'error'
												);
											}
										} }
										__next40pxDefaultSize
									>
										{ __( 'Listen', 'text-to-audio' ) }
									</Button>
									<span
										className="atlasvoice-weak"
										role="status"
									>
										{ readAs &&
											sprintf(
												/* translators: %s: a sentence as the voice will read it. */
												__(
													'Read as: “%s”',
													'text-to-audio'
												),
												readAs
											) }
									</span>
								</div>
							</div>
						</CardBody>
					</Card>
				</Section>
				<Card>
					<PanelBody
						title={ __( 'For developers', 'text-to-audio' ) }
						initialOpen={ false }
					>
						<p>
							{ __(
								'Add rules in code with the tts_text_aliases filter. The same rules run on the server and in the player.',
								'text-to-audio'
							) }
						</p>
					</PanelBody>
				</Card>
			</Scroll>
			{ editing && (
				<RuleDrawer
					rule={ editing }
					busy={ busy }
					onClose={ () => setEditing( null ) }
					onRemove={ () =>
						save(
							rules.filter(
								( _rule, index ) => index !== editing.index
							),
							__( 'Removed.', 'text-to-audio' )
						)
					}
					onSave={ ( edited ) => {
						const { index, ...rule } = edited;
						save(
							index < 0
								? [ ...rules, rule ]
								: rules.map( ( current, position ) =>
										position === index ? rule : current
								  ),
							sprintf(
								/* translators: %s: how a word will be said. */
								__(
									'Saved. The voice now says “%s”.',
									'text-to-audio'
								),
								rule.to_read
							)
						);
					} }
				/>
			) }
		</Pane>
	);
}
