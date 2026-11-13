/**
 * Voice › Your own provider.
 *
 * Shows which outside providers the site uses with its own account (Google
 * Cloud, OpenAI, ElevenLabs, and Google Cloud Storage for the files) and
 * whether each is connected. A key is never shown: the site only answers
 * yes or no, and the name of the account where there is one.
 *
 * The provider engines and their key settings are in AtlasVoice Pro today.
 * So this screen is a status page: with Pro it shows the state and opens the
 * classic screen to change a key; without Pro it says what the providers
 * are and shows one line about Pro. It only reads (GET tta/v1/providers).
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot from '../extend/Slot';
import { classicHashFor } from '../routes';
import { Chip, Pane, ProNote, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/providers';

/**
 * What a provider is for, in one line.
 *
 * @param {string} id Provider id.
 * @return {string} The line.
 */
export function providerPurpose( id ) {
	switch ( id ) {
		case 'google':
			return __( 'Google’s voices, in many languages.', 'text-to-audio' );
		case 'openai':
			return __( 'OpenAI’s voices.', 'text-to-audio' );
		case 'elevenlabs':
			return __( 'ElevenLabs’ voices.', 'text-to-audio' );
		case 'gcs':
			return __(
				'Keeps the audio files in your own Google Cloud bucket instead of on this server.',
				'text-to-audio'
			);
		default:
			return '';
	}
}

/**
 * One provider.
 *
 * @param {Object} props
 * @param {Object} props.provider { id, name, available, connected, detail }.
 * @return {*} The row.
 */
function ProviderRow( { provider } ) {
	return (
		<li className="atlasvoice-row">
			<span className="atlasvoice-row-text">
				<b>{ provider.name }</b>
				<span className="atlasvoice-weak">
					{ providerPurpose( provider.id ) }
					{ provider.detail && (
						<>
							{ ' ' }
							{ sprintf(
								/* translators: %s: the name of an account or a project. */
								__( 'Account: %s.', 'text-to-audio' ),
								provider.detail
							) }
						</>
					) }
				</span>
			</span>
			{ provider.available && (
				<Chip tone={ provider.connected ? 'ok' : undefined } dot>
					{ provider.connected
						? __( 'Connected', 'text-to-audio' )
						: __( 'Not connected', 'text-to-audio' ) }
				</Chip>
			) }
		</li>
	);
}

/**
 * The screen.
 *
 * @return {*} Voice › Your own provider.
 */
export default function VoiceProviders() {
	const { boot, go } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setData( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	if ( ! data && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! data ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
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
								'The providers could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const providers = Array.isArray( data.providers ) ? data.providers : [];
	const voices = providers.filter(
		( provider ) => provider.kind === 'voice'
	);
	const storage = providers.filter(
		( provider ) => provider.kind === 'storage'
	);
	const available = !! data.available;
	const classicUrl = boot.classicUrl + classicHashFor( 'voice:providers' );

	return (
		<Pane canvas>
			<Scroll width={ 860 }>
				<Section
					title={ __(
						'Voices from your own account',
						'text-to-audio'
					) }
					description={ __(
						'You connect your own account at the provider, and the provider bills you for what you use. AtlasVoice charges nothing extra for these voices.',
						'text-to-audio'
					) }
				>
					<Card>
						<ul className="atlasvoice-rows">
							{ voices.map( ( provider ) => (
								<ProviderRow
									key={ provider.id }
									provider={ provider }
								/>
							) ) }
						</ul>
					</Card>
				</Section>

				{ storage.length > 0 && (
					<Section
						title={ __(
							'Where the audio is kept',
							'text-to-audio'
						) }
					>
						<Card>
							<ul className="atlasvoice-rows">
								{ storage.map( ( provider ) => (
									<ProviderRow
										key={ provider.id }
										provider={ provider }
									/>
								) ) }
							</ul>
						</Card>
					</Section>
				) }

				{ /* The plugin that holds the providers puts its key forms here. */ }
				<Slot name="voice.providers" fillProps={ { data } } />

				{ available ? (
					<div className="atlasvoice-actions">
						<Button
							variant="secondary"
							href={ classicUrl }
							__next40pxDefaultSize
						>
							{ __(
								'Connect or change a provider on the classic screen',
								'text-to-audio'
							) }
						</Button>
						<span className="atlasvoice-weak">
							{ __(
								'A key is never shown here. Changing one moves to this screen in a later update.',
								'text-to-audio'
							) }
						</span>
					</div>
				) : (
					<ProNote onSeePro={ () => go( 'account:plans' ) }>
						{ __(
							'Connecting your own Google Cloud, OpenAI or ElevenLabs account is part of AtlasVoice Pro.',
							'text-to-audio'
						) }
					</ProNote>
				) }
			</Scroll>
		</Pane>
	);
}
