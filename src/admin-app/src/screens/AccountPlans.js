/**
 * Account & plans › Plans.
 *
 * The one place in the free plugin that leads to buying Pro: what Pro adds,
 * Free and Pro side by side, and the plans with their prices. Every button
 * here is a link that opens our site or the checkout in a new tab; nothing
 * is bought, unlocked or changed inside the plugin (WordPress.org
 * guideline 5).
 *
 * The plans come from the site (GET tta/v1/plans), the same data
 * `wp atlasvoice plans` prints.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	ExternalLink,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot from '../extend/Slot';
import { Chip, Pane, Scroll, Section } from '../shell/parts';
import {
	formatPrice,
	getComparison,
	getProFeatures,
	safePlanLink,
	tierName,
} from './plans-data';

const ROUTE = 'tta/v1/plans';

/**
 * Yearly or lifetime.
 *
 * @param {Object}   props
 * @param {string}   props.cycle    'yearly' or 'lifetime'.
 * @param {Function} props.onChange Receives the new cycle.
 * @return {*} The two buttons.
 */
function BillingToggle( { cycle, onChange } ) {
	const options = [
		[ 'yearly', __( 'Yearly', 'text-to-audio' ) ],
		[ 'lifetime', __( 'Lifetime', 'text-to-audio' ) ],
	];

	return (
		<div
			className="atlasvoice-toggle"
			role="group"
			aria-label={ __( 'Billing', 'text-to-audio' ) }
		>
			{ options.map( ( [ value, label ] ) => (
				<Button
					key={ value }
					size="compact"
					variant={ cycle === value ? 'secondary' : 'tertiary' }
					aria-pressed={ cycle === value }
					onClick={ () => onChange( value ) }
				>
					{ label }
				</Button>
			) ) }
		</div>
	);
}

/**
 * One plan with its price and its link to the checkout.
 *
 * @param {Object} props
 * @param {Object} props.tier  The plan.
 * @param {string} props.cycle 'yearly' or 'lifetime'.
 * @return {*} The card.
 */
function PlanCard( { tier, cycle } ) {
	const name = tierName( tier.sites );
	const link = safePlanLink( tier.checkout?.[ cycle ] );

	return (
		<Card className={ tier.popular ? 'atlasvoice-card-best' : undefined }>
			<CardBody>
				<div className="atlasvoice-plan">
					<span className="atlasvoice-plan-flag">
						{ tier.popular && (
							<Chip tone="brand">
								{ __( 'Most popular', 'text-to-audio' ) }
							</Chip>
						) }
					</span>
					<h3 className="atlasvoice-plan-name">{ name }</h3>
					<p className="atlasvoice-price">
						{ formatPrice( tier[ cycle ] ) }
						<span className="atlasvoice-price-per">
							{ cycle === 'yearly'
								? __( '/ year', 'text-to-audio' )
								: __( 'once', 'text-to-audio' ) }
						</span>
					</p>
					{ link && (
						<Button
							className="atlasvoice-btn-full"
							variant={ tier.popular ? 'primary' : 'secondary' }
							href={ link }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize
						>
							{ sprintf(
								/* translators: %s: a plan such as "5 sites". */
								__( 'Choose %s', 'text-to-audio' ),
								name
							) }
							<span className="screen-reader-text">
								{ __(
									'(opens the checkout in a new tab)',
									'text-to-audio'
								) }
							</span>
						</Button>
					) }
				</div>
			</CardBody>
		</Card>
	);
}

/**
 * The screen.
 *
 * @return {*} Account & plans › Plans.
 */
export default function AccountPlans() {
	const { boot, isPro } = useApp();
	const [ plans, setPlans ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ cycle, setCycle ] = useState( 'yearly' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setPlans( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	if ( ! plans && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	const tiers = Array.isArray( plans?.tiers ) ? plans.tiers : [];
	const pricing = safePlanLink( plans?.links?.pricing );
	const demo = safePlanLink( plans?.links?.demo );
	const refund = safePlanLink( plans?.links?.refund );
	const compareLabel = __( 'Free and Pro compared', 'text-to-audio' );

	return (
		<Pane canvas>
			<Scroll width={ 1000 }>
				{ failure && (
					<div className="atlasvoice-section">
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
									'The prices could not be loaded: %s',
									'text-to-audio'
								),
								failure
							) }
						</Notice>
					</div>
				) }

				{ isPro && (
					<div className="atlasvoice-section">
						<Notice status="success" isDismissible={ false }>
							{ __(
								'AtlasVoice Pro is installed on this site.',
								'text-to-audio'
							) }
						</Notice>
					</div>
				) }
				{ /* Pro adds its own licence summary here. */ }
				<Slot name="account.plans" fillProps={ { plans } } />

				<Section
					title={
						isPro
							? __(
									'What AtlasVoice Pro includes',
									'text-to-audio'
							  )
							: __( 'What AtlasVoice Pro adds', 'text-to-audio' )
					}
					description={ __(
						'Everything in the free plugin stays free and works on its own. Using your own provider keys is free in both.',
						'text-to-audio'
					) }
				>
					<ul className="atlasvoice-grid is-2 atlasvoice-features">
						{ getProFeatures().map( ( [ title, text ] ) => (
							<li key={ title }>
								<Card size="small">
									<CardBody>
										<b>{ title }</b>
										<p className="atlasvoice-weak atlasvoice-feature-text">
											{ text }
										</p>
									</CardBody>
								</Card>
							</li>
						) ) }
					</ul>
				</Section>

				<Section
					title={ __( 'Free and Pro side by side', 'text-to-audio' ) }
				>
					<Card>
						{ /* The table can be wider than a phone: it scrolls sideways and takes keyboard focus. */ }
						{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */ }
						<div
							className="atlasvoice-table-wrap"
							tabIndex={ 0 }
							role="region"
							aria-label={ compareLabel }
						>
							<table className="atlasvoice-table atlasvoice-compare">
								<caption className="screen-reader-text">
									{ compareLabel }
								</caption>
								<thead>
									<tr>
										<th scope="col">
											<span className="screen-reader-text">
												{ __(
													'Feature',
													'text-to-audio'
												) }
											</span>
										</th>
										<th scope="col">
											{ __( 'Free', 'text-to-audio' ) }
										</th>
										<th scope="col">
											{ __( 'Pro', 'text-to-audio' ) }
										</th>
									</tr>
								</thead>
								<tbody>
									{ getComparison().map(
										( [ what, free, pro ] ) => (
											<tr key={ what }>
												<th
													scope="row"
													className="atlasvoice-cell-title"
												>
													{ what }
												</th>
												<td>{ free }</td>
												<td>
													<b>{ pro }</b>
												</td>
											</tr>
										)
									) }
								</tbody>
							</table>
						</div>
					</Card>
				</Section>

				{ ! isPro && tiers.length > 0 && (
					<Section
						title={ __( 'Plans', 'text-to-audio' ) }
						description={
							cycle === 'yearly'
								? __(
										'Billed yearly, renews automatically. Prices in US dollars.',
										'text-to-audio'
								  )
								: __(
										'Pay once. Prices in US dollars.',
										'text-to-audio'
								  )
						}
						end={
							<BillingToggle
								cycle={ cycle }
								onChange={ setCycle }
							/>
						}
					>
						<div className="atlasvoice-grid is-3">
							{ tiers.map( ( tier ) => (
								<PlanCard
									key={ tier.id }
									tier={ tier }
									cycle={ cycle }
								/>
							) ) }
						</div>
						{ plans.refund_days > 0 && (
							<p className="atlasvoice-weak atlasvoice-plans-note">
								{ sprintf(
									/* translators: %d: a number of days. */
									__(
										'%d-day money-back guarantee; conditions apply. Google, OpenAI and ElevenLabs voices use your own provider account and are billed by that provider.',
										'text-to-audio'
									),
									plans.refund_days
								) }
							</p>
						) }
					</Section>
				) }

				<div className="atlasvoice-actions">
					{ pricing && (
						<ExternalLink href={ pricing }>
							{ isPro
								? __(
										'See all plans and add sites',
										'text-to-audio'
								  )
								: __(
										'Compare Free and Pro in full',
										'text-to-audio'
								  ) }
						</ExternalLink>
					) }
					{ demo && (
						<ExternalLink href={ demo }>
							{ __( 'Hear the Pro voices', 'text-to-audio' ) }
						</ExternalLink>
					) }
					{ refund && (
						<ExternalLink href={ refund }>
							{ __( 'Refund policy', 'text-to-audio' ) }
						</ExternalLink>
					) }
				</div>
			</Scroll>
		</Pane>
	);
}
