/**
 * The voice choice of Voice › Voice: what makes the sound, the language,
 * the voice, and for the browser voice its speed, volume and pitch.
 *
 * The free plugin has two engines: the browser voice and the natural voice
 * (AtlasVoice TTS). A Pro engine that is in use is shown and named, and its
 * voices are still chosen on the classic screen.
 *
 * Nothing is written until Save is pressed. The fields are the ones the
 * classic screens store, so both can be used on the same site.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	RangeControl,
	SelectControl,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';

import { useApp } from '../app-context';
import { classicHashFor } from '../routes';
import { Chip, Facts, Section } from '../shell/parts';
import {
	BROWSER_PLAYER,
	fieldsForEngine,
	languagesOf,
	naturalLanguages,
	naturalSpeaks,
	useBrowserVoices,
	voiceForLanguage,
} from './voice-options';

/**
 * The words of an engine tile.
 *
 * @param {Object} player  { id, name, pro, stores_audio }.
 * @param {number} natural Id of the natural voice engine.
 * @return {Object} { title, text }.
 */
function engineWords( player, natural ) {
	if ( player.id === BROWSER_PLAYER ) {
		return {
			title: __( 'Browser voice', 'text-to-audio' ),
			text: __(
				'Free, no account. The voice is read by each visitor’s own device, so it can sound different from one device to the next.',
				'text-to-audio'
			),
		};
	}

	if ( player.id === natural ) {
		return {
			title: __( 'Natural voice', 'text-to-audio' ),
			text: __(
				'Saved as an MP3 on your site, so it sounds the same on every device. 100,000 characters a month are free.',
				'text-to-audio'
			),
		};
	}

	return {
		title: player.name,
		text: __(
			'A voice engine of AtlasVoice Pro. Its voices are chosen on the classic screen.',
			'text-to-audio'
		),
	};
}

/**
 * Reads a sentence aloud with the browser voice on screen.
 *
 * @param {Object} values The form values.
 */
function playSample( values ) {
	const synth = window.speechSynthesis;
	if ( ! synth || typeof window.SpeechSynthesisUtterance !== 'function' ) {
		return;
	}

	const sentence = new window.SpeechSynthesisUtterance(
		__( 'This is how your posts will sound.', 'text-to-audio' )
	);
	const voice = ( synth.getVoices() || [] ).find(
		( item ) => item.name === values.voice && item.lang === values.language
	);
	if ( voice ) {
		sentence.voice = voice;
	}
	sentence.lang = values.language || '';
	sentence.rate = values.rate;
	sentence.volume = values.volume;
	sentence.pitch = values.pitch;

	synth.cancel();
	synth.speak( sentence );
}

/**
 * The choice.
 *
 * @param {Object}  props
 * @param {Object}  props.form      What use-settings-form returns for tta/v1/voice.
 * @param {boolean} props.connected Whether the natural voice is connected right now.
 * @param {boolean} props.pending   Whether the connection still waits for approval.
 * @return {*} The sections.
 */
export default function VoiceChoice( { form, connected, pending } ) {
	const { boot } = useApp();
	const voices = useBrowserVoices();
	const { values, set } = form;
	const natural = values.natural_player_id;
	const playerId = values.player_id;
	const inUse = values.players.find( ( player ) => player.id === playerId );

	// The free engines, plus the Pro engine the site uses. It stays listed
	// while another engine is tried out, so the owner can go back to it
	// without leaving the screen.
	const startedWith = useRef( playerId );
	const tiles = values.players.filter(
		( player ) =>
			! player.pro ||
			player.id === playerId ||
			player.id === startedWith.current
	);

	const chooseEngine = ( id ) => {
		set( 'player_id', id );
		const also = fieldsForEngine( id, values, voices );
		for ( const name of Object.keys( also ) ) {
			set( name, also[ name ] );
		}
	};

	const chooseBrowserLanguage = ( language ) => {
		set( 'language', language );
		set( 'voice', voiceForLanguage( language, values.voice, voices ) );
	};

	// A saved value is always offered, even when this browser does not have
	// it: the owner's computer is not the only device.
	const browserLanguages = languagesOf( voices );
	if ( values.language && ! browserLanguages.includes( values.language ) ) {
		browserLanguages.unshift( values.language );
	}
	const browserVoices = voices
		.filter( ( voice ) => voice.lang === values.language )
		.map( ( voice ) => voice.name );
	if ( values.voice && ! browserVoices.includes( values.voice ) ) {
		browserVoices.unshift( values.voice );
	}

	const naturalOptions = naturalLanguages();
	const wideSpeed = values.rate < 0.5 || values.rate > 2;
	const classicUrl = boot.classicUrl + classicHashFor( 'voice:voice' );

	return (
		<>
			<Section
				title={ __( 'What makes the sound', 'text-to-audio' ) }
				description={ __(
					'After you save a new engine, language or voice, each post gets audio in the new voice the next time it is played.',
					'text-to-audio'
				) }
			>
				<fieldset className="atlasvoice-tiles">
					<legend className="screen-reader-text">
						{ __( 'What makes the sound', 'text-to-audio' ) }
					</legend>
					{ tiles.map( ( player ) => {
						const words = engineWords( player, natural );
						const needsConnection =
							player.id === natural && ! connected;
						const id = 'atlasvoice-engine-' + player.id;

						return (
							<div
								key={ player.id }
								className={
									'atlasvoice-tile' +
									( player.id === playerId ? ' is-on' : '' )
								}
							>
								<input
									type="radio"
									id={ id }
									name="atlasvoice-engine"
									checked={ player.id === playerId }
									disabled={ needsConnection }
									aria-describedby={ id + '-text' }
									onChange={ () => chooseEngine( player.id ) }
								/>
								<label htmlFor={ id }>
									<b>{ words.title }</b>
									{ player.id === natural && pending && (
										<Chip tone="warn">
											{ __(
												'Not approved yet',
												'text-to-audio'
											) }
										</Chip>
									) }
									{ player.id === natural && ! pending && (
										<Chip
											tone={ connected ? 'ok' : 'info' }
										>
											{ connected
												? __(
														'Connected',
														'text-to-audio'
												  )
												: __(
														'Free',
														'text-to-audio'
												  ) }
										</Chip>
									) }
								</label>
								<p
									id={ id + '-text' }
									className="atlasvoice-weak atlasvoice-tile-text"
								>
									{ words.text }
									{ needsConnection && (
										<>
											{ ' ' }
											<b>
												{ __(
													'Connect it below to choose it.',
													'text-to-audio'
												) }
											</b>
										</>
									) }
								</p>
							</div>
						);
					} ) }
				</fieldset>
			</Section>

			{ playerId === BROWSER_PLAYER && (
				<Section
					title={ __( 'Language and voice', 'text-to-audio' ) }
					description={ __(
						'These are the voices of the browser you are using now. A visitor whose device does not have this voice hears another voice of the same language.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							{ voices.length === 0 && ! values.voice ? (
								<p className="atlasvoice-weak">
									{ __(
										'This browser offers no voices, so there is nothing to choose here. Visitors hear a voice of their own device.',
										'text-to-audio'
									) }
								</p>
							) : (
								<div className="atlasvoice-form atlasvoice-voice-form">
									<SelectControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __(
											'Language',
											'text-to-audio'
										) }
										value={ values.language }
										options={ [
											...( values.language
												? []
												: [
														{
															value: '',
															label: __(
																'Choose a language',
																'text-to-audio'
															),
														},
												  ] ),
											...browserLanguages.map(
												( code ) => ( {
													value: code,
													label: code,
												} )
											),
										] }
										onChange={ chooseBrowserLanguage }
									/>
									<SelectControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __( 'Voice', 'text-to-audio' ) }
										value={ values.voice }
										options={ [
											...( values.voice
												? []
												: [
														{
															value: '',
															label: __(
																'Choose a voice',
																'text-to-audio'
															),
														},
												  ] ),
											...browserVoices.map(
												( name ) => ( {
													value: name,
													label: name,
												} )
											),
										] }
										onChange={ ( value ) =>
											set( 'voice', value )
										}
									/>
									<RangeControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __( 'Speed', 'text-to-audio' ) }
										help={ __(
											'1 is the normal speed.',
											'text-to-audio'
										) }
										value={ values.rate }
										// A speed saved outside the usual range keeps working.
										min={ wideSpeed ? 0.1 : 0.5 }
										max={ wideSpeed ? 10 : 2 }
										step={ 0.1 }
										onChange={ ( value ) =>
											set( 'rate', value ?? 1 )
										}
									/>
									<RangeControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __(
											'Volume',
											'text-to-audio'
										) }
										value={ values.volume }
										min={ 0 }
										max={ 1 }
										step={ 0.1 }
										onChange={ ( value ) =>
											set( 'volume', value ?? 1 )
										}
									/>
									<SelectControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __( 'Pitch', 'text-to-audio' ) }
										value={ String( values.pitch ) }
										options={ [
											{
												value: '0',
												label: __(
													'Lower',
													'text-to-audio'
												),
											},
											{
												value: '1',
												label: __(
													'Normal',
													'text-to-audio'
												),
											},
											{
												value: '2',
												label: __(
													'Higher',
													'text-to-audio'
												),
											},
										] }
										onChange={ ( value ) =>
											set( 'pitch', Number( value ) )
										}
									/>
									{ voices.length > 0 && (
										<div className="atlasvoice-actions">
											<Button
												variant="secondary"
												onClick={ () =>
													playSample( values )
												}
												__next40pxDefaultSize
											>
												{ __(
													'Play a sample',
													'text-to-audio'
												) }
											</Button>
										</div>
									) }
								</div>
							) }
						</CardBody>
					</Card>
				</Section>
			) }

			{ playerId === natural && (
				<Section
					title={ __( 'Language', 'text-to-audio' ) }
					description={ __(
						'The natural voice has one voice for each language.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form atlasvoice-voice-form">
								<SelectControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={ __( 'Language', 'text-to-audio' ) }
									value={ values.language }
									options={ [
										// A saved language the list does not know is kept and shown.
										...( naturalSpeaks( values.language )
											? []
											: [
													{
														value: values.language,
														label: values.language
															? sprintf(
																	/* translators: %s: a language code. */
																	__(
																		'%s (not offered any more)',
																		'text-to-audio'
																	),
																	values.language
															  )
															: __(
																	'Choose a language',
																	'text-to-audio'
															  ),
													},
											  ] ),
										...naturalOptions,
									] }
									onChange={ ( value ) =>
										set( 'language', value )
									}
								/>
							</div>
						</CardBody>
					</Card>
				</Section>
			) }

			{ inUse && inUse.pro && (
				<Section
					title={ __( 'Language and voice', 'text-to-audio' ) }
					description={ __(
						'The voices of a Pro engine are chosen on the classic screen in this version.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<Facts
								rows={ [
									[
										__( 'Language', 'text-to-audio' ),
										values.language,
									],
									[
										__( 'Voice', 'text-to-audio' ),
										values.voice.split( '::' ).pop(),
									],
								] }
							/>
							<div className="atlasvoice-actions">
								<Button
									variant="secondary"
									href={ classicUrl }
									__next40pxDefaultSize
								>
									{ __(
										'Change the voice on the classic screen',
										'text-to-audio'
									) }
								</Button>
							</div>
						</CardBody>
					</Card>
				</Section>
			) }
		</>
	);
}
