/**
 * Setup: the first-run steps, top to bottom.
 *
 * Hear it, choose where the player appears, the voice, the look, then check
 * a real post and go live. Each step saves through the service of its own
 * screen when Continue is pressed (tta/v1/where, tta/v1/look,
 * tta/v1/tracking), so the wizard stores nothing of its own; the last step
 * ends the setup (tta/v1/setup/finish, TTA\Setup\Wizard).
 *
 * "Hear it" reads the newest post with the voice built into the browser:
 * nothing is sent anywhere.
 *
 * An extension (AtlasVoice Pro) adds a step with the `atlasvoice_setup_steps`
 * filter in PHP, names it with the `atlasvoice.setupStepNames` filter and
 * fills the slot "setup.step.<id>" with its part. The part gets:
 *   - `setup`: where the setup stands;
 *   - `onSave( fn )`: `fn` runs when Continue is pressed; a rejected promise
 *     keeps the step open and shows its message;
 *   - `setBlocked( text )`: why Continue cannot be pressed yet, or ''.
 */
import { applyFilters } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	RadioControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot, { getSlotFills } from '../extend/Slot';
import { AppIcon, Chip, Facts, Pane, Scroll } from '../shell/parts';
import Tiles from '../shell/Tiles';
import { MODE_LIVE, MODE_STAGING } from '../shell/use-mode-switch';
import { SHAPES, shapeOf, stylePresets } from './PlayerLook';

const ROUTE = 'tta/v1/setup';

/** The steps this screen draws itself. */
const BUILT_IN = [ 'hear', 'where', 'voice', 'look', 'live' ];

/**
 * The names of the steps: the built-in ones, and those an extension named.
 *
 * @return {Object} Step id => name.
 */
export function stepNames() {
	const names = {
		hear: __( 'Hear it', 'text-to-audio' ),
		where: __( 'Where', 'text-to-audio' ),
		voice: __( 'Voice', 'text-to-audio' ),
		look: __( 'Look', 'text-to-audio' ),
		live: __( 'Check and go live', 'text-to-audio' ),
	};
	const all = applyFilters( 'atlasvoice.setupStepNames', { ...names } );

	// A filter that returns something else than a map is ignored.
	return all && typeof all === 'object' ? { ...all, ...names } : names;
}

/**
 * The steps this screen can show: the built-in ones and those an extension
 * brought a part for. A step nobody draws is left out.
 *
 * @param {string[]} steps Step ids from the site.
 * @return {string[]} The ids to show, in order.
 */
export function shownSteps( steps ) {
	return ( Array.isArray( steps ) ? steps : [] ).filter(
		( id ) =>
			BUILT_IN.includes( id ) ||
			getSlotFills( 'setup.step.' + id ).length > 0
	);
}

/**
 * The heading of a step.
 *
 * @param {Object} props
 * @param {number} props.number      Which step, from 1.
 * @param {number} props.of          How many steps.
 * @param {string} props.title       What the step asks.
 * @param {string} props.description One line under it.
 * @return {*} The heading.
 */
function StepHead( { number, of, title, description } ) {
	return (
		<div className="atlasvoice-stephead">
			<p className="atlasvoice-weak">
				{ sprintf(
					/* translators: 1: step number, 2: number of steps. */
					__( 'Step %1$d of %2$d', 'text-to-audio' ),
					number,
					of
				) }
			</p>
			<h2>{ title }</h2>
			{ description && (
				<p className="atlasvoice-weak">{ description }</p>
			) }
		</div>
	);
}

/**
 * Step: hear the newest post, read by the browser's own voice.
 *
 * @param {Object} props
 * @param {Object} props.sample { title, text, language } or null.
 * @param {string} props.voice  The voice in use on the site.
 * @return {*} The step.
 */
function Hear( { sample, voice } ) {
	const [ state, setState ] = useState( 'idle' );
	const speech =
		typeof window !== 'undefined' && window.speechSynthesis
			? window.speechSynthesis
			: null;

	// Leaving the step stops the voice.
	useEffect( () => () => speech && speech.cancel(), [ speech ] );

	if ( ! sample ) {
		return (
			<Notice status="info" isDismissible={ false }>
				{ __(
					'There is no published post to read yet. Publish one, or continue and come back later.',
					'text-to-audio'
				) }
			</Notice>
		);
	}

	const play = () => {
		const words = new window.SpeechSynthesisUtterance( sample.text );
		words.lang = sample.language;
		words.onend = () => setState( 'done' );
		words.onerror = () => setState( 'failed' );
		speech.cancel();
		speech.speak( words );
		setState( 'playing' );
	};

	const stop = () => {
		speech.cancel();
		setState( 'idle' );
	};

	return (
		<>
			<Card>
				<CardBody>
					<p className="atlasvoice-setup-sample">
						<b>{ sample.title }</b>
					</p>
					{ ! speech && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'This browser has no built-in voice, so it cannot play a sample here. You can continue.',
								'text-to-audio'
							) }
						</Notice>
					) }
					{ speech && state === 'done' && (
						<Notice status="success" isDismissible={ false }>
							{ __(
								'That is it. Next, choose where the player appears.',
								'text-to-audio'
							) }
						</Notice>
					) }
					{ speech && state === 'failed' && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'The browser could not play the sample. Check the volume of your device, or try another browser. You can continue.',
								'text-to-audio'
							) }
						</Notice>
					) }
					{ speech && (
						<div className="atlasvoice-actions">
							{ state === 'playing' ? (
								<Button
									variant="secondary"
									onClick={ stop }
									__next40pxDefaultSize
								>
									{ __( 'Stop', 'text-to-audio' ) }
								</Button>
							) : (
								<Button
									variant="primary"
									onClick={ play }
									__next40pxDefaultSize
								>
									{ state === 'idle'
										? __(
												'Play my newest post',
												'text-to-audio'
										  )
										: __(
												'Play it again',
												'text-to-audio'
										  ) }
								</Button>
							) }
							{ state === 'playing' && (
								<span className="atlasvoice-weak" role="status">
									{ __( 'Playing…', 'text-to-audio' ) }
								</span>
							) }
						</div>
					) }
				</CardBody>
			</Card>
			<p className="atlasvoice-weak">
				{ voice
					? sprintf(
							/* translators: %s: the name of the voice in use, e.g. "Default". */
							__(
								'Nothing is sent anywhere: this sample uses the voice built into your browser. On your site, visitors hear the voice you choose (now: %s).',
								'text-to-audio'
							),
							voice
					  )
					: __(
							'Nothing is sent anywhere: this sample uses the voice built into your browser.',
							'text-to-audio'
					  ) }
			</p>
		</>
	);
}

/**
 * The style a look stands for, when it is one of the ready-made ones.
 *
 * @param {Object} look { background, text }.
 * @return {string} The preset's id, or nothing.
 */
function presetOf( look ) {
	const match = stylePresets().find(
		( preset ) =>
			preset.background === look.background && preset.text === look.text
	);

	return match ? match.id : '';
}

/**
 * The screen.
 *
 * @return {*} Setup.
 */
export default function Setup() {
	const { boot, go, notify, setMode, setSetupFinished } = useApp();
	const [ setup, setSetup ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ index, setIndex ] = useState( 0 );
	const [ busy, setBusy ] = useState( false );
	const [ done, setDone ] = useState( false );
	// What each step loaded and what is chosen in it: { saved, draft }.
	const [ parts, setParts ] = useState( {} );
	const [ goLive, setGoLive ] = useState( MODE_STAGING );
	const [ opened, setOpened ] = useState( false );
	const heading = useRef( null );
	// What an extension's step asked to run on Continue, and why it blocks it.
	const extensionSave = useRef( null );
	const [ extensionBlocked, setExtensionBlocked ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			const data = await request( boot, ROUTE );
			setSetup( data );
			setGoLive( data.mode === MODE_LIVE ? MODE_LIVE : MODE_STAGING );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const steps = setup ? shownSteps( setup.steps ) : [];
	const step = steps[ index ];

	// A step's settings are read when the step is opened, from its own service.
	const sources = {
		where: 'tta/v1/where',
		look: 'tta/v1/look',
		live: 'tta/v1/tracking',
	};
	const source = sources[ step ];
	const part = parts[ step ];

	useEffect( () => {
		if ( ! source || part ) {
			return;
		}
		let gone = false;
		request( boot, source )
			.then( ( saved ) => {
				if ( ! gone ) {
					setParts( ( all ) => ( {
						...all,
						[ step ]: { saved, draft: saved },
					} ) );
				}
			} )
			.catch( ( error ) => {
				if ( ! gone ) {
					setParts( ( all ) => ( {
						...all,
						[ step ]: { failed: error.message },
					} ) );
				}
			} );

		return () => {
			gone = true;
		};
	}, [ boot, part, source, step ] );

	// What one step asked for never reaches the next one.
	useEffect( () => {
		extensionSave.current = null;
		setExtensionBlocked( '' );
	}, [ index ] );

	const onExtensionSave = useCallback( ( run ) => {
		extensionSave.current = typeof run === 'function' ? run : null;
	}, [] );

	// A new step starts at its heading, for the keyboard and the screen reader.
	useEffect( () => {
		if ( heading.current ) {
			heading.current.focus();
		}
	}, [ index, done ] );

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
								'The setup could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	if ( ! setup ) {
		return (
			<Pane canvas>
				<Scroll width={ 900 }>
					<div className="atlasvoice-loading" role="status">
						<Spinner />
						{ __( 'Loading…', 'text-to-audio' ) }
					</div>
				</Scroll>
			</Pane>
		);
	}

	const names = stepNames();
	const draft = part && part.draft;
	const change = ( values ) =>
		setParts( ( all ) => ( {
			...all,
			[ step ]: {
				...all[ step ],
				draft: { ...all[ step ].draft, ...values },
			},
		} ) );

	// Why Continue cannot be pressed yet, in words. Empty when it can.
	const waiting = !! source && ! part;
	let blocked = '';
	if ( step === 'where' && draft && ! draft.post_types.length ) {
		blocked = __( 'Choose at least one content type', 'text-to-audio' );
	} else if ( ! BUILT_IN.includes( step ) ) {
		blocked = extensionBlocked;
	}

	/**
	 * Sends what a step changed to the step's own service.
	 *
	 * @param {string[]} keys The settings the step may change.
	 */
	const saveChanged = async ( keys ) => {
		const changed = {};
		keys.forEach( ( key ) => {
			if (
				JSON.stringify( draft[ key ] ) !==
				JSON.stringify( part.saved[ key ] )
			) {
				changed[ key ] = draft[ key ];
			}
		} );
		if ( ! Object.keys( changed ).length ) {
			return;
		}

		const saved = await request( boot, source, {
			method: 'POST',
			data: changed,
		} );
		setParts( ( all ) => ( {
			...all,
			[ step ]: { saved, draft: saved },
		} ) );
	};

	const next = async () => {
		setBusy( true );
		try {
			if ( part && part.saved ) {
				const keys = {
					where: [ 'post_types' ],
					look: [ 'background', 'text', 'radius' ],
					live: [ 'count_plays' ],
				}[ step ];
				await saveChanged( keys );
			}
			if ( extensionSave.current ) {
				await extensionSave.current();
			}

			if ( index < steps.length - 1 ) {
				setIndex( index + 1 );
			} else {
				const after = await request( boot, ROUTE + '/finish', {
					method: 'POST',
					data: { go_live: goLive === MODE_LIVE },
				} );
				setSetup( after );
				setMode( after.mode === MODE_LIVE ? MODE_LIVE : MODE_STAGING );
				if ( setSetupFinished ) {
					setSetupFinished( true );
				}
				setDone( true );
			}
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'This step was not saved: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setBusy( false );
	};

	if ( done ) {
		const live = setup.mode === MODE_LIVE;

		return (
			<Pane canvas>
				<Scroll width={ 720 }>
					<div className="atlasvoice-stephead">
						<h2 tabIndex={ -1 } ref={ heading }>
							{ live
								? __( 'You are live', 'text-to-audio' )
								: __(
										'You are set up, still in staging',
										'text-to-audio'
								  ) }
						</h2>
						<p className="atlasvoice-weak">
							{ live
								? __(
										'Visitors can hear your posts now.',
										'text-to-audio'
								  )
								: __(
										'Only administrators get the player until you go live. The switch is in the bar at the bottom.',
										'text-to-audio'
								  ) }
						</p>
					</div>
					<Card>
						<CardBody>
							<Facts
								rows={ [
									[
										__( 'Voice', 'text-to-audio' ),
										setup.voice,
									],
									[
										__( 'Visitors', 'text-to-audio' ),
										live
											? __(
													'Get the player',
													'text-to-audio'
											  )
											: __(
													'Do not get the player yet',
													'text-to-audio'
											  ),
									],
								] }
							/>
							<div className="atlasvoice-actions">
								<Button
									variant="primary"
									onClick={ () => go( 'overview' ) }
									__next40pxDefaultSize
								>
									{ __( 'Go to Home', 'text-to-audio' ) }
								</Button>
								{ setup.sample && (
									<Button
										variant="secondary"
										href={ setup.sample.url }
										target="_blank"
										rel="noreferrer"
										icon={ <AppIcon name="external" /> }
										__next40pxDefaultSize
									>
										{ __(
											'See the player on your site',
											'text-to-audio'
										) }
									</Button>
								) }
								<Button
									variant="link"
									onClick={ () => go( 'help:more' ) }
								>
									{ __(
										'Other free plugins',
										'text-to-audio'
									) }
								</Button>
							</div>
						</CardBody>
					</Card>
				</Scroll>
			</Pane>
		);
	}

	let title = names[ step ] || '';
	let description = '';
	let body = (
		<Slot
			name={ 'setup.step.' + step }
			fillProps={ {
				setup,
				onSave: onExtensionSave,
				setBlocked: setExtensionBlocked,
			} }
		/>
	);

	if ( part && part.failed ) {
		body = (
			<Notice status="error" isDismissible={ false }>
				{ sprintf(
					/* translators: %s: error message from the site. */
					__(
						'This step could not be loaded: %s You can continue and set it later.',
						'text-to-audio'
					),
					part.failed
				) }
			</Notice>
		);
	}

	if ( step === 'hear' ) {
		title = __( 'Here is your newest post, read aloud', 'text-to-audio' );
		description = __(
			'Press play to hear how a post sounds.',
			'text-to-audio'
		);
		body = <Hear sample={ setup.sample } voice={ setup.voice } />;
	} else if ( step === 'where' ) {
		title = __( 'Where should people be able to listen?', 'text-to-audio' );
		description = __(
			'Choose as many as you like. You can also place the player anywhere with the shortcode or the block.',
			'text-to-audio'
		);
		if ( draft ) {
			body = (
				<Card>
					<CardBody>
						<fieldset className="atlasvoice-setup-types">
							<legend className="screen-reader-text">
								{ __( 'Content types', 'text-to-audio' ) }
							</legend>
							{ draft.choices.post_types.map( ( type ) => (
								<CheckboxControl
									key={ type.id }
									__nextHasNoMarginBottom
									label={ type.name }
									checked={ draft.post_types.includes(
										type.id
									) }
									onChange={ ( checked ) =>
										change( {
											post_types: checked
												? [
														...draft.post_types,
														type.id,
												  ]
												: draft.post_types.filter(
														( id ) => id !== type.id
												  ),
										} )
									}
								/>
							) ) }
						</fieldset>
					</CardBody>
				</Card>
			);
		}
	} else if ( step === 'voice' ) {
		title = __( 'How should your posts sound?', 'text-to-audio' );
		body = (
			<Card>
				<CardBody>
					<Facts
						rows={ [
							[
								__( 'Voice in use', 'text-to-audio' ),
								setup.voice,
							],
						] }
					/>
					<p className="atlasvoice-weak">
						{ setup.stores_audio
							? __(
									'This voice saves each post as an MP3, so it sounds the same on every device.',
									'text-to-audio'
							  )
							: __(
									'This voice needs no account. It reads in the visitor’s browser, so the sound depends on their device. A natural voice sounds the same everywhere.',
									'text-to-audio'
							  ) }
					</p>
					<div className="atlasvoice-actions">
						<Button
							variant="secondary"
							onClick={ () => go( 'voice:voice' ) }
							__next40pxDefaultSize
						>
							{ __( 'Choose another voice', 'text-to-audio' ) }
						</Button>
						<span className="atlasvoice-weak">
							{ __(
								'It opens the Voice screen. Come back to Setup when you are done.',
								'text-to-audio'
							) }
						</span>
					</div>
				</CardBody>
			</Card>
		);
	} else if ( step === 'look' ) {
		title = __( 'Make it look like your site', 'text-to-audio' );
		description = __(
			'Pick a style. Fine-tune it later in Player.',
			'text-to-audio'
		);
		if ( draft ) {
			const shape = shapeOf( Number( draft.radius ) );
			body = (
				<>
					<div
						className="atlasvoice-presets"
						role="group"
						aria-label={ __( 'Style', 'text-to-audio' ) }
					>
						{ stylePresets().map( ( preset ) => (
							<button
								key={ preset.id }
								type="button"
								className={
									'atlasvoice-preset' +
									( presetOf( draft ) === preset.id
										? ' is-on'
										: '' )
								}
								aria-pressed={ presetOf( draft ) === preset.id }
								onClick={ () =>
									change( {
										background: preset.background,
										text: preset.text,
									} )
								}
							>
								<span
									style={ { background: preset.background } }
								/>
								{ preset.name }
							</button>
						) ) }
					</div>
					<div className="atlasvoice-section">
						<Tiles
							name="atlasvoice-setup-shape"
							legend={ __( 'Shape', 'text-to-audio' ) }
							value={ shape }
							onChange={ ( id ) =>
								change( { radius: SHAPES[ id ] } )
							}
							options={ [
								{
									id: 'square',
									title: __( 'Square', 'text-to-audio' ),
								},
								{
									id: 'rounded',
									title: __( 'Rounded', 'text-to-audio' ),
								},
								{
									id: 'pill',
									title: __( 'Pill', 'text-to-audio' ),
								},
							] }
						/>
					</div>
					<div
						className="atlasvoice-setup-preview"
						aria-hidden="true"
					>
						<span
							className="atlasvoice-setup-button"
							style={ {
								background: draft.background,
								color: draft.text,
								borderRadius: Number( draft.radius ) || 0,
							} }
						>
							{ __( 'Listen', 'text-to-audio' ) }
						</span>
					</div>
				</>
			);
		}
	} else if ( step === 'live' ) {
		title = __( 'Check it, then go live', 'text-to-audio' );
		description = __(
			'Open a post, listen, and check that the right text is read.',
			'text-to-audio'
		);
		if ( draft ) {
			body = (
				<>
					<Card>
						<ul className="atlasvoice-rows">
							{ setup.sample && (
								<li className="atlasvoice-row">
									<span className="atlasvoice-row-text">
										<b>
											{ __(
												'Open a post and listen',
												'text-to-audio'
											) }
										</b>
										<span className="atlasvoice-weak">
											{ setup.sample.title }
										</span>
									</span>
									{ opened && (
										<Chip tone="ok" dot>
											{ __( 'Opened', 'text-to-audio' ) }
										</Chip>
									) }
									<Button
										variant="secondary"
										href={ setup.sample.url }
										target="_blank"
										rel="noreferrer"
										onClick={ () => setOpened( true ) }
										__next40pxDefaultSize
									>
										{ __(
											'Open and listen',
											'text-to-audio'
										) }
									</Button>
								</li>
							) }
							<li className="atlasvoice-row">
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __(
										'Count plays',
										'text-to-audio'
									) }
									help={ __(
										'Counted on your own site, without cookies.',
										'text-to-audio'
									) }
									checked={ !! draft.count_plays }
									onChange={ ( value ) =>
										change( { count_plays: value } )
									}
								/>
							</li>
						</ul>
					</Card>
					<div className="atlasvoice-section">
						<RadioControl
							label={ __( 'When you finish', 'text-to-audio' ) }
							selected={ goLive }
							onChange={ setGoLive }
							options={ [
								{
									label: __(
										'Go live: visitors hear your posts now',
										'text-to-audio'
									),
									value: MODE_LIVE,
								},
								{
									label: __(
										'Stay in staging: only administrators get the player',
										'text-to-audio'
									),
									value: MODE_STAGING,
								},
							] }
						/>
					</div>
				</>
			);
		}
	}

	const last = index === steps.length - 1;

	return (
		<Pane
			canvas
			footer={
				<div className="atlasvoice-footer">
					<span className="atlasvoice-footer-note" role="status">
						{ blocked }
					</span>
					{ index > 0 && (
						<Button
							variant="tertiary"
							disabled={ busy }
							onClick={ () => setIndex( index - 1 ) }
							__next40pxDefaultSize
						>
							{ __( 'Back', 'text-to-audio' ) }
						</Button>
					) }
					<Button
						variant="primary"
						disabled={ busy || waiting || !! blocked }
						isBusy={ busy }
						onClick={ next }
						__next40pxDefaultSize
					>
						{ last
							? __( 'Finish setup', 'text-to-audio' )
							: __( 'Continue', 'text-to-audio' ) }
					</Button>
				</div>
			}
		>
			<Scroll width={ 980 }>
				<div className="atlasvoice-setup">
					<nav
						className="atlasvoice-setup-steps"
						aria-label={ __( 'Setup steps', 'text-to-audio' ) }
					>
						<ol>
							{ steps.map( ( id, position ) => (
								<li key={ id }>
									<button
										type="button"
										className={
											'atlasvoice-setup-step' +
											( position === index
												? ' is-current'
												: '' ) +
											( position < index
												? ' is-done'
												: '' )
										}
										aria-current={
											position === index
												? 'step'
												: undefined
										}
										// Forward only with Continue, so a step is never skipped unsaved.
										disabled={ busy || position > index }
										onClick={ () => setIndex( position ) }
									>
										<span
											className="atlasvoice-setup-number"
											aria-hidden="true"
										>
											{ position < index
												? '✓'
												: position + 1 }
										</span>
										{ names[ id ] || id }
									</button>
								</li>
							) ) }
						</ol>
					</nav>
					<div className="atlasvoice-setup-main">
						<div
							className="atlasvoice-setup-focus"
							tabIndex={ -1 }
							ref={ heading }
						>
							<StepHead
								number={ index + 1 }
								of={ steps.length }
								title={ title }
								description={ description }
							/>
						</div>
						{ waiting ? (
							<div className="atlasvoice-loading" role="status">
								<Spinner />
								{ __( 'Loading…', 'text-to-audio' ) }
							</div>
						) : (
							body
						) }
					</div>
				</div>
			</Scroll>
		</Pane>
	);
}
