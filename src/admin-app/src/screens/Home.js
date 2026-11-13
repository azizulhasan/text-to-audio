/**
 * Home.
 *
 * The first screen answers three questions in this order: who can hear the
 * posts right now, how the site is set up (one step per decision, each one
 * click away), and what to do next.
 *
 * It reads one summary of saved settings (GET tta/v1/home), the same facts
 * `wp atlasvoice status` prints, so it opens without waiting for another
 * server. The only things it changes are the mode (after asking, through
 * the same question as the status bar) and whether the Pro card is hidden
 * for this user.
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
import { Chip, Pane, ProBadge, Scroll } from '../shell/parts';
import useModeSwitch from '../shell/use-mode-switch';
import { formatNumber, usageTone, usedPercent } from './account-format';
import {
	contentWords,
	modeDetail,
	positionWords,
	safeWebLink,
	voiceWords,
} from './home-words';

const ROUTE = 'tta/v1/home';

/**
 * Who can hear the posts right now, with the way to change it.
 *
 * @param {Object}  props
 * @param {Object}  props.summary The summary.
 * @param {boolean} props.live    Whether the site is live.
 * @param {boolean} props.busy    A mode change is being saved.
 * @param {*}       props.onAsk   Asks, then switches the mode.
 * @return {*} The banner.
 */
function WhoCanHear( { summary, live, busy, onAsk } ) {
	const { go } = useApp();
	const visitor = safeWebLink( summary.links.visitor );

	return (
		<div
			className={
				'atlasvoice-banner ' + ( live ? 'is-live' : 'is-staging' )
			}
		>
			<p className="atlasvoice-banner-text">
				<b>
					{ live
						? __(
								'Right now, everyone can hear it.',
								'text-to-audio'
						  )
						: __(
								'Right now, only you can hear it.',
								'text-to-audio'
						  ) }
				</b>{ ' ' }
				{ modeDetail( live, summary ) }
			</p>
			<div className="atlasvoice-actions">
				{ ! live && (
					<Button
						// Setup comes first: until it is finished, "Continue
						// setup" is the screen's one main button.
						variant={
							summary.setup_finished ? 'primary' : 'secondary'
						}
						isBusy={ busy }
						disabled={ busy }
						onClick={ onAsk }
						__next40pxDefaultSize
					>
						{ __( 'Go live…', 'text-to-audio' ) }
					</Button>
				) }
				{ live && (
					<Button
						variant="secondary"
						onClick={ () => go( 'player:place' ) }
						__next40pxDefaultSize
					>
						{ __( 'Change who sees it', 'text-to-audio' ) }
					</Button>
				) }
				{ visitor && (
					<ExternalLink href={ visitor }>
						{ __( 'Open your newest post', 'text-to-audio' ) }
					</ExternalLink>
				) }
			</div>
		</div>
	);
}

/**
 * The setup as four steps; each shows its current value and opens it.
 *
 * @param {Object}  props
 * @param {Object}  props.summary The summary.
 * @param {boolean} props.live    Whether the site is live.
 * @param {*}       props.onAsk   Asks, then switches the mode.
 * @return {*} The strip.
 */
function Journey( { summary, live, onAsk } ) {
	const { go } = useApp();
	const steps = [
		{
			id: 'voice',
			title: __( 'Voice', 'text-to-audio' ),
			value: voiceWords( summary.voice ),
			done: true,
			onClick: () => go( 'voice' ),
		},
		{
			id: 'player',
			title: __( 'Player', 'text-to-audio' ),
			value: positionWords( summary.player.position ),
			done: true,
			onClick: () => go( 'player' ),
		},
		{
			id: 'content',
			title: __( 'What is read', 'text-to-audio' ),
			value: contentWords( summary.content ),
			done: true,
			onClick: () => go( 'content' ),
		},
		{
			id: 'live',
			title: live
				? __( 'Live', 'text-to-audio' )
				: __( 'Go live', 'text-to-audio' ),
			value: live
				? __( 'Visitors hear your posts', 'text-to-audio' )
				: __( 'Only you can hear it now', 'text-to-audio' ),
			done: live,
			onClick: onAsk,
		},
	];

	return (
		<ol
			className="atlasvoice-journey"
			aria-label={ __( 'Your setup, step by step', 'text-to-audio' ) }
		>
			{ steps.map( ( step, index ) => (
				<li key={ step.id }>
					<button
						type="button"
						className={
							'atlasvoice-journey-step ' +
							( step.done ? 'is-done' : 'is-next' )
						}
						onClick={ step.onClick }
					>
						<span className="atlasvoice-step-n" aria-hidden="true">
							{ step.done ? '✓' : index + 1 }
						</span>
						<span className="atlasvoice-journey-text">
							<b>{ step.title }</b>
							<small>{ step.value }</small>
						</span>
						<span className="atlasvoice-journey-end">
							{ step.done
								? __( 'Change', 'text-to-audio' )
								: __( 'Go live…', 'text-to-audio' ) }
						</span>
					</button>
				</li>
			) ) }
		</ol>
	);
}

/**
 * The one card about Pro. Free only, after setup, and it can be closed.
 *
 * @param {Object} props
 * @param {string} props.demo   Address of the demo page.
 * @param {*}      props.onHide Hides the card for this user.
 * @return {*} The card.
 */
function ProCard( { demo, onHide } ) {
	const { go } = useApp();

	return (
		<div className="atlasvoice-section">
			<section
				className="atlasvoice-procard"
				aria-labelledby="atlasvoice-procard-title"
			>
				<div className="atlasvoice-procard-text">
					<h2 id="atlasvoice-procard-title">
						<ProBadge />{ ' ' }
						{ __( 'Do more with Pro', 'text-to-audio' ) }
					</h2>
					<ul>
						<li>
							{ __(
								'Studio voices, with no monthly limit on the natural voice.',
								'text-to-audio'
							) }
						</li>
						<li>
							{ __(
								'Players on every content type, and a voice per language.',
								'text-to-audio'
							) }
						</li>
						<li>
							{ __(
								'Audio for many posts at once.',
								'text-to-audio'
							) }
						</li>
					</ul>
				</div>
				<div className="atlasvoice-actions">
					<Button
						variant="secondary"
						onClick={ () => go( 'account:plans' ) }
						__next40pxDefaultSize
					>
						{ __( 'See Pro plans', 'text-to-audio' ) }
					</Button>
					{ demo && (
						<ExternalLink href={ demo }>
							{ __( 'Hear the Pro voices', 'text-to-audio' ) }
						</ExternalLink>
					) }
					<Button
						variant="tertiary"
						onClick={ onHide }
						__next40pxDefaultSize
					>
						{ __( 'Not now', 'text-to-audio' ) }
					</Button>
				</div>
			</section>
		</div>
	);
}

/**
 * The natural-voice allowance as the site last stored it.
 *
 * @param {Object} props
 * @param {Object} props.usage `usage` of the summary.
 * @return {*} The card, or nothing when there is no limit to show.
 */
function UsageCard( { usage } ) {
	const { go } = useApp();
	const percent = usedPercent( usage );

	if ( ! usage.connected || percent === null ) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'Natural voice this month', 'text-to-audio' ) }
				</h2>
				<Button variant="link" onClick={ () => go( 'account:usage' ) }>
					{ __( 'See usage', 'text-to-audio' ) }
				</Button>
			</CardHeader>
			<CardBody>
				<p className="atlasvoice-usage-figure">
					{ sprintf(
						/* translators: 1: characters used, 2: characters in the allowance. */
						__( '%1$s of %2$s characters used', 'text-to-audio' ),
						formatNumber( usage.chars_used ),
						formatNumber( usage.chars_limit )
					) }
				</p>
				<progress
					className={ 'atlasvoice-meter is-' + usageTone( percent ) }
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
			</CardBody>
		</Card>
	);
}

/**
 * Three useful next steps.
 *
 * @return {*} The card.
 */
function NextSteps() {
	const { go } = useApp();
	const rows = [
		[
			__( 'Read pages too', 'text-to-audio' ),
			__( 'Choose which content types get the player.', 'text-to-audio' ),
			'content',
		],
		[
			__( 'Fix how a word is said', 'text-to-audio' ),
			__( 'For brand names and abbreviations.', 'text-to-audio' ),
			'voice:pronunciation',
		],
		[
			__( 'Follow along while listening', 'text-to-audio' ),
			__( 'Highlight the text as it is read.', 'text-to-audio' ),
			'player:read',
		],
	];

	return (
		<Card>
			<CardHeader>
				<h2 className="atlasvoice-card-title">
					{ __( 'What you can do next', 'text-to-audio' ) }
				</h2>
			</CardHeader>
			<ul className="atlasvoice-rows">
				{ rows.map( ( [ title, help, to ] ) => (
					<li key={ to }>
						<button
							type="button"
							className="atlasvoice-row atlasvoice-row-link"
							onClick={ () => go( to ) }
						>
							<span className="atlasvoice-row-text">
								<b>{ title }</b>
								<span className="atlasvoice-weak">
									{ help }
								</span>
							</span>
							<span aria-hidden="true">›</span>
						</button>
					</li>
				) ) }
			</ul>
		</Card>
	);
}

/**
 * The screen.
 *
 * @return {*} Home.
 */
export default function Home() {
	const { boot, go, isPro, notify } = useApp();
	const { live, busy, ask } = useModeSwitch();
	const [ summary, setSummary ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ hidden, setHidden ] = useState( [] );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			const answer = await request( boot, ROUTE );
			setSummary( answer );
			setHidden( Array.isArray( answer?.hidden ) ? answer.hidden : [] );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const hideProCard = async () => {
		// Hidden at once; the site is told in the background.
		setHidden( ( list ) => [ ...list, 'pro_card' ] );
		try {
			await request( boot, ROUTE + '/dismiss', {
				method: 'POST',
				data: { item: 'pro_card' },
			} );
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__(
						'The card is hidden for now, but that could not be saved: %s',
						'text-to-audio'
					),
					error.message
				),
				'error'
			);
		}
	};

	if ( ! summary && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! summary ) {
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
								'Home could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const showProCard =
		! isPro && summary.setup_finished && ! hidden.includes( 'pro_card' );

	return (
		<Pane canvas>
			<Scroll width={ 1100 }>
				<div className="atlasvoice-section">
					<WhoCanHear
						summary={ summary }
						live={ live }
						busy={ busy }
						onAsk={ ask }
					/>
				</div>

				{ summary.setup_finished ? (
					<div className="atlasvoice-section">
						<Journey
							summary={ summary }
							live={ live }
							onAsk={ ask }
						/>
					</div>
				) : (
					<div className="atlasvoice-section">
						<Card>
							<CardHeader>
								<h2 className="atlasvoice-card-title">
									{ __(
										'Finish setting up',
										'text-to-audio'
									) }
								</h2>
								<Chip tone="brand">
									{ __( 'Next', 'text-to-audio' ) }
								</Chip>
							</CardHeader>
							<CardBody>
								<p className="atlasvoice-setup-text">
									{ __(
										'Choose a voice, the look of the player and what is read. It takes a few minutes, and nothing is shown to visitors until you go live.',
										'text-to-audio'
									) }
								</p>
								<Button
									variant="primary"
									onClick={ () => go( 'setup' ) }
									__next40pxDefaultSize
								>
									{ __( 'Continue setup', 'text-to-audio' ) }
								</Button>
							</CardBody>
						</Card>
					</div>
				) }

				{ showProCard && (
					<ProCard
						demo={ safeWebLink( summary.links.demo ) }
						onHide={ hideProCard }
					/>
				) }

				{ /* Pro and later screens add their own cards here. */ }
				<Slot name="home" fillProps={ { summary } } />

				<div className="atlasvoice-grid is-2 atlasvoice-section">
					<NextSteps />
					<UsageCard usage={ summary.usage } />
				</div>
			</Scroll>
		</Pane>
	);
}
