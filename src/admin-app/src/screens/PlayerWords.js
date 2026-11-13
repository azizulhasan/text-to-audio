/**
 * Player › Buttons & words.
 *
 * What the button of the player says and shows at each moment: its word,
 * its tooltip and its icon. A form with a Save footer: nothing is written
 * until Save.
 *
 * It stores nothing new. The site saves the words in the map the classic
 * Customization screen uses, and "show the icon" in the classic setting
 * (TTA\Player\Words), so both screens can be used on the same site.
 *
 * Only the players that read with the browser's voice have a button with
 * words. The site lists them; a site without Pro has one.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';

const ROUTE = 'tta/v1/words';
const STATES = [ 'listen', 'pause', 'resume', 'replay' ];
const BROWSER_PLAYER = '1';

/**
 * When a listener meets a state of the button.
 *
 * @param {string} state listen, pause, resume or replay.
 * @return {string} The moment, in words.
 */
export function stateLabel( state ) {
	switch ( state ) {
		case 'listen':
			return __( 'Before playing', 'text-to-audio' );
		case 'pause':
			return __( 'While playing', 'text-to-audio' );
		case 'resume':
			return __( 'After pausing', 'text-to-audio' );
		case 'replay':
			return __( 'At the end', 'text-to-audio' );
		default:
			return state;
	}
}

/**
 * The name of an icon.
 *
 * @param {string} id Icon id, e.g. "preset:headphones".
 * @return {string} Its name.
 */
export function iconName( id ) {
	switch ( id ) {
		case 'preset:play':
			return __( 'Play', 'text-to-audio' );
		case 'preset:pause':
			return __( 'Pause', 'text-to-audio' );
		case 'preset:stop':
			return __( 'Stop', 'text-to-audio' );
		case 'preset:replay':
			return __( 'Replay', 'text-to-audio' );
		case 'preset:headphones':
			return __( 'Headphones', 'text-to-audio' );
		case 'preset:ear':
			return __( 'Ear', 'text-to-audio' );
		case 'preset:volume-up':
			return __( 'Speaker', 'text-to-audio' );
		case 'preset:volume-mute':
			return __( 'Speaker, muted', 'text-to-audio' );
		case 'custom':
			return __( 'Your own icon', 'text-to-audio' );
		default:
			return String( id ).replace( /^preset:/, '' );
	}
}

/**
 * One state of the button: its icon, word and tooltip.
 *
 * @param {Object}   props
 * @param {string}   props.id       Unique id on the screen.
 * @param {string}   props.state    listen, pause, resume or replay.
 * @param {Object}   props.parts    { text, tooltip, icon }.
 * @param {string}   props.fallback The default word, shown while the field is empty.
 * @param {Array}    props.icons    [ { id, svg } ] that can be chosen.
 * @param {Function} props.onChange Receives the part and its new value.
 * @return {*} The row.
 */
function StateRow( { id, state, parts, fallback, icons, onChange } ) {
	const label = stateLabel( state );
	const chosen = icons.find( ( icon ) => icon.id === parts.icon );
	const options = icons.map( ( icon ) => ( {
		label: iconName( icon.id ),
		value: icon.id,
	} ) );
	if ( parts.icon === 'custom' ) {
		// A drawing saved on the classic screen: kept until another icon is chosen.
		options.unshift( { label: iconName( 'custom' ), value: 'custom' } );
	}

	return (
		<fieldset className="atlasvoice-wordrow">
			<legend>
				{ chosen && (
					<span
						className="atlasvoice-wordrow-icon"
						aria-hidden="true"
						// The drawing of an icon the plugin ships (TTA_Player_Icons::presets()),
						// never one a person typed in.
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: chosen.svg } }
					/>
				) }
				{ label }
			</legend>
			<div className="atlasvoice-grid is-3">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					id={ id + '-icon' }
					label={ __( 'Icon', 'text-to-audio' ) }
					value={ parts.icon }
					options={ options }
					onChange={ ( value ) => onChange( 'icon', value ) }
				/>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					id={ id + '-text' }
					label={ __( 'Text', 'text-to-audio' ) }
					value={ parts.text }
					placeholder={ fallback }
					maxLength={ 100 }
					onChange={ ( value ) => onChange( 'text', value ) }
				/>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					id={ id + '-tooltip' }
					label={ __( 'Tooltip', 'text-to-audio' ) }
					value={ parts.tooltip }
					maxLength={ 100 }
					onChange={ ( value ) => onChange( 'tooltip', value ) }
				/>
			</div>
		</fieldset>
	);
}

/**
 * The screen.
 *
 * @return {*} Player › Buttons & words.
 */
export default function PlayerWords() {
	const { go } = useApp();
	const form = useSettingsForm(
		ROUTE,
		__(
			'Words saved. Visitors see the change on their next page load.',
			'text-to-audio'
		)
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
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
								'The words could not be loaded: %s',
								'text-to-audio'
							),
							form.failure
						) }
					</Notice>
				</Scroll>
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

	const players =
		values.players && typeof values.players === 'object'
			? values.players
			: {};
	const defaults = values.defaults || {};
	const names = values.names || {};
	const icons = Array.isArray( values.icons ) ? values.icons : [];

	const change = ( player, state, part, value ) =>
		set( 'players', {
			...players,
			[ player ]: {
				...players[ player ],
				[ state ]: { ...players[ player ][ state ], [ part ]: value },
			},
		} );

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
			<Scroll width={ 860 }>
				{ ! values.applies && (
					<div className="atlasvoice-section">
						<Notice
							status="info"
							isDismissible={ false }
							actions={ [
								{
									label: __( 'Open Voice', 'text-to-audio' ),
									onClick: () => go( 'voice:voice' ),
									variant: 'link',
								},
							] }
						>
							{ __(
								'The voice in use plays an audio file, and its player has its own controls without these words. The words below show when the browser voice reads the posts.',
								'text-to-audio'
							) }
						</Notice>
					</div>
				) }

				{ Object.keys( players ).map( ( player ) => (
					<Section
						key={ player }
						title={
							player === BROWSER_PLAYER
								? __( 'Browser voice button', 'text-to-audio' )
								: sprintf(
										/* translators: %s: name of a player, e.g. "Default Pro". */
										__( 'Player: %s', 'text-to-audio' ),
										names[ player ] || player
								  )
						}
						description={ __(
							'What the button says at each moment. Leave a text empty to use the default word.',
							'text-to-audio'
						) }
						end={
							defaults[ player ] && (
								<Button
									variant="tertiary"
									onClick={ () =>
										set( 'players', {
											...players,
											[ player ]: defaults[ player ],
										} )
									}
								>
									{ __(
										'Reset to the defaults',
										'text-to-audio'
									) }
								</Button>
							)
						}
					>
						<Card>
							<CardBody>
								<div className="atlasvoice-form">
									{ STATES.filter(
										( state ) => players[ player ][ state ]
									).map( ( state ) => (
										<StateRow
											key={ state }
											id={ `atlasvoice-words-${ player }-${ state }` }
											state={ state }
											parts={ players[ player ][ state ] }
											fallback={
												defaults[ player ]?.[ state ]
													?.text || ''
											}
											icons={ icons }
											onChange={ ( part, value ) =>
												change(
													player,
													state,
													part,
													value
												)
											}
										/>
									) ) }
								</div>
							</CardBody>
						</Card>
					</Section>
				) ) }

				<Card>
					<CardBody>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show the icon', 'text-to-audio' ) }
							help={ __(
								'Shows the icon next to the text of the button.',
								'text-to-audio'
							) }
							checked={ !! values.show_icon }
							onChange={ ( value ) => set( 'show_icon', value ) }
						/>
					</CardBody>
				</Card>
			</Scroll>
		</Pane>
	);
}
