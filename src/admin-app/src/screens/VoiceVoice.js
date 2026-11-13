/**
 * Voice › Voice.
 *
 * Two things live here: the voice choice (what makes the sound, the
 * language, the voice; see VoiceChoice) and the connection to AtlasVoice
 * Cloud for the natural voice: connect, see it, disconnect, and move a site
 * that is registered to another email.
 *
 * Connecting sends the site's address, its name and the owner's email to
 * AtlasVoice Cloud. Nothing is sent before the owner ticks the box and
 * presses Connect (WordPress.org guideline 7). The key stays on the server;
 * only its first characters are shown.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CheckboxControl,
	ExternalLink,
	Notice,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Chip, Facts, Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import { safeWebLink } from './home-words';
import VoiceChoice from './VoiceChoice';

const CONNECTION = 'tta/v1/cloud/connection';
const CHOICE = 'tta/v1/voice';

/**
 * Whether a line of text looks like an email address. The site checks it
 * properly; this only decides when the button can be pressed.
 *
 * @param {string} value What was typed.
 * @return {boolean} True when it has the shape of an address.
 */
export function looksLikeEmail( value ) {
	return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( String( value ).trim() );
}

/**
 * The form that connects the site.
 *
 * @param {Object}   props
 * @param {Object}   props.state     The connection.
 * @param {boolean}  props.busy      A request is running.
 * @param {Function} props.onConnect Receives { email, shareDiagnostics }.
 * @return {*} The card.
 */
function ConnectCard( { state, busy, onConnect } ) {
	const [ email, setEmail ] = useState( state.email || '' );
	const [ agreed, setAgreed ] = useState( false );
	const [ share, setShare ] = useState( false );
	const emailOk = looksLikeEmail( email );
	const privacy = safeWebLink( state.links.privacy );
	const terms = safeWebLink( state.links.terms );

	let hint = '';
	if ( ! emailOk ) {
		hint = __( 'Add your email first.', 'text-to-audio' );
	} else if ( ! agreed ) {
		hint = __( 'Tick the box to continue.', 'text-to-audio' );
	}

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'Connect the natural voice', 'text-to-audio' ) }
				</h2>
				<Chip tone="info">{ __( 'Free', 'text-to-audio' ) }</Chip>
			</CardHeader>
			<CardBody>
				<p className="atlasvoice-connect-lead">
					{ __(
						'The same voice on every phone and browser, saved as an MP3 on your site. 100,000 characters a month are free.',
						'text-to-audio'
					) }
				</p>
				<form
					className="atlasvoice-form atlasvoice-connect"
					onSubmit={ ( event ) => {
						event.preventDefault();
						if ( emailOk && agreed && ! busy ) {
							onConnect( {
								email: email.trim(),
								shareDiagnostics: share,
							} );
						}
					} }
				>
					<TextControl
						type="email"
						label={ __(
							'Email for usage notices',
							'text-to-audio'
						) }
						value={ email }
						onChange={ setEmail }
						autoComplete="email"
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<CheckboxControl
						label={ __(
							'Send post text to AtlasVoice to make the audio',
							'text-to-audio'
						) }
						help={ __(
							'Your site address, its name and this email are sent to AtlasVoice Cloud when you press Connect. After that, the text of a post is sent to make its audio and is deleted afterwards; the MP3 is saved on your site. Nothing is sent before you press Connect.',
							'text-to-audio'
						) }
						checked={ agreed }
						onChange={ setAgreed }
						__nextHasNoMarginBottom
					/>
					{ state.diagnostics.offer && (
						<CheckboxControl
							label={ __(
								'Also help improve AtlasVoice by sharing diagnostic data (optional)',
								'text-to-audio'
							) }
							help={
								state.diagnostics.items.length
									? sprintf(
											/* translators: %s: a list of what is shared. */
											__(
												'What is shared: %s',
												'text-to-audio'
											),
											state.diagnostics.items.join( '; ' )
									  )
									: undefined
							}
							checked={ share }
							onChange={ setShare }
							__nextHasNoMarginBottom
						/>
					) }
					<div className="atlasvoice-actions">
						<Button
							variant="primary"
							type="submit"
							isBusy={ busy }
							// Not disabled while the form is incomplete: a
							// disabled button cannot say why, the hint can.
							aria-disabled={ ! emailOk || ! agreed || busy }
							__next40pxDefaultSize
						>
							{ __( 'Connect', 'text-to-audio' ) }
						</Button>
						{ hint && (
							<span className="atlasvoice-weak" role="status">
								{ hint }
							</span>
						) }
						{ privacy && (
							<ExternalLink href={ privacy }>
								{ __( 'Privacy policy', 'text-to-audio' ) }
							</ExternalLink>
						) }
						{ terms && (
							<ExternalLink href={ terms }>
								{ __( 'Terms', 'text-to-audio' ) }
							</ExternalLink>
						) }
					</div>
				</form>
			</CardBody>
		</Card>
	);
}

/**
 * A connected site.
 *
 * @param {Object}   props
 * @param {Object}   props.state        The connection.
 * @param {boolean}  props.busy         A request is running.
 * @param {Function} props.onDisconnect Asks, then disconnects.
 * @return {*} The card.
 */
function ConnectedCard( { state, busy, onDisconnect } ) {
	const { go } = useApp();
	const dashboard = safeWebLink( state.links.dashboard );

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'Natural voice connection', 'text-to-audio' ) }
				</h2>
				<Chip tone={ state.pending_approval ? 'warn' : 'ok' } dot>
					{ state.pending_approval
						? __( 'Waiting for approval', 'text-to-audio' )
						: __( 'Connected', 'text-to-audio' ) }
				</Chip>
			</CardHeader>
			<CardBody>
				<Facts
					rows={ [
						[ __( 'Email', 'text-to-audio' ), state.email ],
						[
							__( 'Site key', 'text-to-audio' ),
							state.key_prefix ? (
								<span className="atlasvoice-mono">
									{ state.key_prefix }…
								</span>
							) : (
								''
							),
						],
					] }
				/>
				<p className="atlasvoice-weak">
					{ __(
						'Post text is sent only to make the audio, then deleted. The MP3 stays on your site.',
						'text-to-audio'
					) }
				</p>
				<div className="atlasvoice-actions">
					<Button
						variant="secondary"
						onClick={ () => go( 'account:usage' ) }
						__next40pxDefaultSize
					>
						{ __( 'See plan and usage', 'text-to-audio' ) }
					</Button>
					{ dashboard && (
						<ExternalLink href={ dashboard }>
							{ __(
								'Open my AtlasVoice dashboard',
								'text-to-audio'
							) }
						</ExternalLink>
					) }
					<Button
						variant="tertiary"
						isDestructive
						isBusy={ busy }
						disabled={ busy }
						onClick={ onDisconnect }
						__next40pxDefaultSize
					>
						{ __( 'Disconnect', 'text-to-audio' ) }
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}

/**
 * The screen.
 *
 * @return {*} Voice › Voice.
 */
export default function VoiceVoice() {
	const { boot, confirm, go, isPro, notify } = useApp();
	const [ state, setState ] = useState( null );
	const form = useSettingsForm(
		CHOICE,
		__(
			'Voice saved. Each post gets audio in the new voice the next time it is played.',
			'text-to-audio'
		)
	);
	const [ failure, setFailure ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	// A site that belongs to another email: { email, ownerHint, canMove, message }.
	const [ owned, setOwned ] = useState( null );
	const [ problem, setProblem ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			// The service is asked for the current state, so a key that was
			// revoked in the dashboard shows as disconnected at once.
			setState(
				await request( boot, CONNECTION, {
					query: { refresh: 'true' },
				} )
			);
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const connect = async ( { email, shareDiagnostics, takeover = false } ) => {
		setBusy( true );
		setProblem( '' );
		try {
			const next = await request( boot, CONNECTION, {
				method: 'POST',
				data: {
					email,
					consent: true,
					takeover,
					share_diagnostics: !! shareDiagnostics,
				},
			} );
			setState( next );
			setOwned( null );
			notify(
				next.pending_approval
					? __(
							'Connected. This site now waits for approval.',
							'text-to-audio'
					  )
					: __(
							'Connected. New audio uses the natural voice.',
							'text-to-audio'
					  )
			);
		} catch ( error ) {
			if ( error.code === 'project_exists' ) {
				setOwned( {
					email,
					ownerHint: String( error.data?.owner_hint || '' ),
					canMove: !! error.data?.takeover,
					message: error.message,
				} );
			} else {
				setProblem( error.message );
			}
		}
		setBusy( false );
	};

	const disconnect = async () => {
		setBusy( true );
		try {
			setState( await request( boot, CONNECTION, { method: 'DELETE' } ) );
			notify(
				__(
					'Disconnected. Audio already made keeps playing.',
					'text-to-audio'
				)
			);
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'Could not disconnect: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setBusy( false );
	};

	const askDisconnect = () =>
		confirm( {
			title: __( 'Disconnect the natural voice?', 'text-to-audio' ),
			body: __(
				'New audio uses the browser voice until you connect again. Audio already made keeps playing.',
				'text-to-audio'
			),
			ok: __( 'Disconnect', 'text-to-audio' ),
			destructive: true,
			onOk: disconnect,
		} );

	const askMove = () =>
		confirm( {
			title: __( 'Move this site to your email?', 'text-to-audio' ),
			body: sprintf(
				/* translators: %s: an email address. */
				__(
					'AtlasVoice Cloud checks a one-time code on your site to confirm you own it, then moves the site to %s. Audio and settings are kept. Your site must be reachable from the internet for this.',
					'text-to-audio'
				),
				owned.email
			),
			ok: __( 'Move it', 'text-to-audio' ),
			onOk: () => connect( { email: owned.email, takeover: true } ),
		} );

	if ( ! state && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! state ) {
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
								'The voice settings could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

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
				{ form.values ? (
					<VoiceChoice form={ form } connected={ state.connected } />
				) : (
					<div className="atlasvoice-section">
						{ form.failure ? (
							<Notice
								status="error"
								isDismissible={ false }
								actions={ [
									{
										label: __(
											'Try again',
											'text-to-audio'
										),
										onClick: form.reload,
									},
								] }
							>
								{ sprintf(
									/* translators: %s: error message from the site. */
									__(
										'The voice could not be loaded: %s',
										'text-to-audio'
									),
									form.failure
								) }
							</Notice>
						) : (
							<div className="atlasvoice-loading" role="status">
								<Spinner />
								{ __( 'Loading…', 'text-to-audio' ) }
							</div>
						) }
					</div>
				) }

				<Section
					title={ __( 'Natural voice', 'text-to-audio' ) }
					description={ __(
						'Made by AtlasVoice Cloud and saved on your site, so every visitor hears the same voice.',
						'text-to-audio'
					) }
				>
					{ state.key_revoked && ! state.connected && (
						<div className="atlasvoice-notice-gap">
							<Notice status="error" isDismissible={ false }>
								<b>
									{ __(
										'This site was disconnected.',
										'text-to-audio'
									) }
								</b>{ ' ' }
								{ __(
									'Its key was revoked from the AtlasVoice dashboard, so new audio uses the browser voice. Audio already made keeps playing. Connect again below.',
									'text-to-audio'
								) }
							</Notice>
						</div>
					) }

					{ state.connected && state.pending_approval && (
						<div className="atlasvoice-notice-gap">
							<Notice status="warning" isDismissible={ false }>
								<b>
									{ __(
										'One step left: this site waits for approval.',
										'text-to-audio'
									) }
								</b>{ ' ' }
								{ sprintf(
									/* translators: %s: an email address. */
									__(
										'%s already has an AtlasVoice account, and its owner has to approve this site. Until then, posts use the browser voice.',
										'text-to-audio'
									),
									state.email
								) }
							</Notice>
						</div>
					) }

					{ state.connected && state.license_not_on_site && (
						<div className="atlasvoice-notice-gap">
							<Notice
								status="warning"
								isDismissible={ false }
								actions={
									isPro
										? [
												{
													label: __(
														'Open Licence',
														'text-to-audio'
													),
													onClick: () =>
														go( 'account:licence' ),
												},
										  ]
										: []
								}
							>
								{ __(
									'Your AtlasVoice Pro licence is not activated on this site yet. Until it is, this site uses the free allowance.',
									'text-to-audio'
								) }
							</Notice>
						</div>
					) }

					{ state.connected && state.license_seats_full && (
						<div className="atlasvoice-notice-gap">
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Every site of your AtlasVoice Pro licence is in use, so this site uses the free allowance.',
									'text-to-audio'
								) }
							</Notice>
						</div>
					) }

					{ owned && (
						<div className="atlasvoice-notice-gap">
							<Notice
								status="warning"
								isDismissible={ false }
								actions={
									owned.canMove
										? [
												{
													label: __(
														'Move this site to my email',
														'text-to-audio'
													),
													onClick: askMove,
												},
										  ]
										: []
								}
							>
								<b>
									{ __(
										'This site is connected to another AtlasVoice account.',
										'text-to-audio'
									) }
								</b>{ ' ' }
								{ owned.ownerHint
									? sprintf(
											/* translators: %s: a partly hidden email address. */
											__(
												'It belongs to %s.',
												'text-to-audio'
											),
											owned.ownerHint
									  )
									: owned.message }
							</Notice>
						</div>
					) }

					{ problem && (
						<div className="atlasvoice-notice-gap">
							<Notice status="error" isDismissible={ false }>
								{ sprintf(
									/* translators: %s: error message from the site. */
									__(
										'Could not connect: %s',
										'text-to-audio'
									),
									problem
								) }
							</Notice>
						</div>
					) }

					{ state.connected ? (
						<ConnectedCard
							state={ state }
							busy={ busy }
							onDisconnect={ askDisconnect }
						/>
					) : (
						<ConnectCard
							state={ state }
							busy={ busy }
							onConnect={ connect }
						/>
					) }
				</Section>
			</Scroll>
		</Pane>
	);
}
