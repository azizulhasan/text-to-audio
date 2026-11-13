/**
 * Account & plans › Usage.
 *
 * Shows what AtlasVoice Cloud says about this site: its plan, how many
 * characters are used and left this month, and how the site is connected.
 * The screen only reads (GET tta/v1/cloud/account); it changes nothing.
 *
 * The plan is decided by the service alone. When the service cannot answer,
 * the screen shows the numbers the site last stored and says so.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	ExternalLink,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot from '../extend/Slot';
import { Chip, Empty, Facts, Pane, Scroll, Section } from '../shell/parts';
import {
	engineName,
	formatDay,
	formatNumber,
	licenceEndedText,
	usageLine,
	usageTone,
	usedPercent,
} from './account-format';

const ROUTE = 'tta/v1/cloud/account';

/**
 * The plan and this month's usage.
 *
 * @param {Object} props
 * @param {Object} props.account The account.
 * @return {*} The card.
 */
function PlanCard( { account } ) {
	const { plan, usage, engines } = account;
	const percent = usedPercent( usage );
	const tone = usageTone( percent );
	const resets = formatDay( usage.resets_at );
	const line = usageLine( percent, resets );
	const planName =
		plan.name || plan.slug || __( 'Plan unknown', 'text-to-audio' );

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'This month', 'text-to-audio' ) }
				</h2>
				<Chip tone={ plan.slug === 'free' ? 'info' : 'brand' }>
					{ planName }
				</Chip>
			</CardHeader>
			<CardBody>
				{ percent === null ? (
					<p className="atlasvoice-usage-figure">
						{ typeof usage.chars_used === 'number'
							? sprintf(
									/* translators: %s: a number of characters, e.g. "12,400". */
									__(
										'%s characters used. This plan has no monthly limit.',
										'text-to-audio'
									),
									formatNumber( usage.chars_used )
							  )
							: __( 'No usage numbers yet.', 'text-to-audio' ) }
					</p>
				) : (
					<>
						<p className="atlasvoice-usage-figure">
							{ sprintf(
								/* translators: 1: characters used, 2: characters in the allowance. */
								__(
									'%1$s of %2$s characters used',
									'text-to-audio'
								),
								formatNumber( usage.chars_used ),
								formatNumber( usage.chars_limit )
							) }
						</p>
						<progress
							className={ 'atlasvoice-meter is-' + tone }
							max="100"
							value={ percent }
							aria-label={ sprintf(
								/* translators: %d: a percentage. */
								__(
									'%d%% of this month’s characters used',
									'text-to-audio'
								),
								percent
							) }
						/>
						{ line && (
							<p className={ 'atlasvoice-usage-line is-' + tone }>
								{ line }
							</p>
						) }
					</>
				) }
				<Facts
					rows={ [
						[
							__( 'Characters left', 'text-to-audio' ),
							percent === null
								? ''
								: formatNumber( usage.chars_remaining ),
						],
						[ __( 'Resets on', 'text-to-audio' ), resets ],
						[
							__( 'Voices you can use', 'text-to-audio' ),
							engines.map( engineName ).join( ', ' ),
						],
					] }
				/>
			</CardBody>
		</Card>
	);
}

/**
 * How the site is connected to AtlasVoice Cloud.
 *
 * @param {Object}   props
 * @param {Object}   props.account   The account.
 * @param {boolean}  props.busy      A check is running.
 * @param {Function} props.onRefresh Asks the service again.
 * @return {*} The card.
 */
function ConnectionCard( { account, busy, onRefresh } ) {
	const waiting = account.project.approval === 'pending';

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'Connection', 'text-to-audio' ) }
				</h2>
				<Chip tone={ waiting ? 'warn' : 'ok' } dot>
					{ waiting
						? __( 'Waiting for approval', 'text-to-audio' )
						: __( 'Connected', 'text-to-audio' ) }
				</Chip>
			</CardHeader>
			<CardBody>
				<Facts
					rows={ [
						[
							__( 'Email', 'text-to-audio' ),
							account.connection.email,
						],
						[
							__( 'Site key', 'text-to-audio' ),
							account.connection.key_prefix ? (
								<span className="atlasvoice-mono">
									{ account.connection.key_prefix }…
								</span>
							) : (
								''
							),
						],
					] }
				/>
				<p className="atlasvoice-weak">
					{ __(
						'Only the start of the key is shown. The key itself stays on your server and is never sent to a browser.',
						'text-to-audio'
					) }
				</p>
				<div className="atlasvoice-actions">
					<Button
						variant="secondary"
						isBusy={ busy }
						disabled={ busy }
						onClick={ onRefresh }
						__next40pxDefaultSize
					>
						{ __( 'Check again', 'text-to-audio' ) }
					</Button>
					{ account.links.dashboard && (
						<ExternalLink href={ account.links.dashboard }>
							{ __(
								'Open my AtlasVoice dashboard',
								'text-to-audio'
							) }
						</ExternalLink>
					) }
				</div>
			</CardBody>
		</Card>
	);
}

/**
 * The notices above the cards: what needs the owner's attention.
 *
 * @param {Object} props
 * @param {Object} props.account The account.
 * @return {*} The notices, or nothing.
 */
function Attention( { account } ) {
	const notices = [];

	if ( account.source === 'stored' ) {
		notices.push( {
			id: 'stored',
			status: 'warning',
			text: __(
				'AtlasVoice Cloud did not answer just now. These are the numbers this site last stored, so they may be a little old.',
				'text-to-audio'
			),
		} );
	}

	if ( account.project.approval === 'pending' ) {
		notices.push( {
			id: 'approval',
			status: 'info',
			text: __(
				'This site is waiting for approval. The email address already has an AtlasVoice account, and its owner has to approve this site before the natural voice works here.',
				'text-to-audio'
			),
		} );
	}

	if ( account.license.ended ) {
		notices.push( {
			id: 'licence',
			status: 'warning',
			text: licenceEndedText( account.license.ended.reason ),
		} );
	}

	if ( ! notices.length ) {
		return null;
	}

	return (
		<div className="atlasvoice-section">
			{ notices.map( ( notice ) => (
				<Notice
					key={ notice.id }
					status={ notice.status }
					isDismissible={ false }
				>
					{ notice.text }
					{ notice.id === 'stored' && account.request_id && (
						<>
							{ ' ' }
							<span className="atlasvoice-weak">
								{ sprintf(
									/* translators: %s: an id to quote to support. */
									__(
										'Reference for support: %s',
										'text-to-audio'
									),
									account.request_id
								) }
							</span>
						</>
					) }
				</Notice>
			) ) }
		</div>
	);
}

/**
 * What happens when the allowance is used up. Shown for a plan with a limit.
 *
 * @return {*} The section.
 */
function WhenItRunsOut() {
	const rows = [
		[
			__( 'Audio already made', 'text-to-audio' ),
			__(
				'Keeps playing as normal. Characters are counted only when new audio is made.',
				'text-to-audio'
			),
			<Chip key="chip" tone="ok">
				{ __( 'Not affected', 'text-to-audio' ) }
			</Chip>,
		],
		[
			__( 'New or changed posts', 'text-to-audio' ),
			__(
				'Use the device voice until the allowance resets. Visitors still hear the post.',
				'text-to-audio'
			),
			<Chip key="chip" tone="warn">
				{ __( 'Device voice', 'text-to-audio' ) }
			</Chip>,
		],
	];

	return (
		<Section
			title={ __(
				'When the month’s characters run out',
				'text-to-audio'
			) }
		>
			<Card>
				<ul className="atlasvoice-rows">
					{ rows.map( ( [ title, help, chip ] ) => (
						<li key={ title } className="atlasvoice-row">
							<span className="atlasvoice-row-text">
								<b>{ title }</b>
								<span className="atlasvoice-weak">
									{ help }
								</span>
							</span>
							{ chip }
						</li>
					) ) }
				</ul>
			</Card>
		</Section>
	);
}

/**
 * The screen.
 *
 * @return {*} Account & plans › Usage.
 */
export default function AccountUsage() {
	const { boot, go, isPro } = useApp();
	const [ account, setAccount ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ busy, setBusy ] = useState( false );

	const load = useCallback(
		async ( refresh ) => {
			setBusy( true );
			setFailure( '' );
			try {
				setAccount(
					await request(
						boot,
						ROUTE,
						refresh ? { query: { refresh: 'true' } } : {}
					)
				);
			} catch ( error ) {
				setFailure( error.message );
			}
			setBusy( false );
		},
		[ boot ]
	);

	useEffect( () => {
		load( false );
	}, [ load ] );

	if ( ! account && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! account ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: () => load( false ),
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The account could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	if ( ! account.connected ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Card>
						<Empty
							title={ __(
								'No AtlasVoice account connected yet',
								'text-to-audio'
							) }
							action={
								<Button
									variant="primary"
									onClick={ () => go( 'voice' ) }
									__next40pxDefaultSize
								>
									{ __(
										'Connect the natural voice',
										'text-to-audio'
									) }
								</Button>
							}
						>
							{ __(
								'Connect the natural voice to see your plan and how many characters you have left this month.',
								'text-to-audio'
							) }
						</Empty>
					</Card>
				</Scroll>
			</Pane>
		);
	}

	const limited = usedPercent( account.usage ) !== null;

	return (
		<Pane canvas>
			<Scroll width={ 1100 }>
				{ failure && (
					<div className="atlasvoice-section">
						<Notice status="error" isDismissible={ false }>
							{ sprintf(
								/* translators: %s: error message from the site. */
								__(
									'The account could not be checked again: %s',
									'text-to-audio'
								),
								failure
							) }
						</Notice>
					</div>
				) }
				<Attention account={ account } />
				<div className="atlasvoice-grid is-2 atlasvoice-section">
					<PlanCard account={ account } />
					<ConnectionCard
						account={ account }
						busy={ busy }
						onRefresh={ () => load( true ) }
					/>
				</div>
				{ limited && <WhenItRunsOut /> }
				{ ! isPro && (
					<Section title={ __( 'Need more?', 'text-to-audio' ) }>
						<Card>
							<ul className="atlasvoice-rows">
								<li className="atlasvoice-row">
									<span className="atlasvoice-row-text">
										<b>
											{ __(
												'AtlasVoice Pro',
												'text-to-audio'
											) }
										</b>
										<span className="atlasvoice-weak">
											{ __(
												'Unlimited natural voice, studio voices in many languages, and audio for many posts at once.',
												'text-to-audio'
											) }
										</span>
									</span>
									<Button
										variant="secondary"
										onClick={ () => go( 'account:plans' ) }
										__next40pxDefaultSize
									>
										{ __( 'See plans', 'text-to-audio' ) }
									</Button>
								</li>
							</ul>
						</Card>
					</Section>
				) }
				{ /* Pro adds its "Licence on this site" card here. */ }
				<Slot name="account.usage" fillProps={ { account } } />
			</Scroll>
		</Pane>
	);
}
