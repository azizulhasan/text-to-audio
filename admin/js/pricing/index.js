/**
 * TTS-265 — AtlasVoice Pro pricing page.
 *
 * A standalone WP-admin React page (its own submenu, after "Our Plugins"),
 * built with @wordpress/element (React) + @wordpress/components (WP-native UI) +
 * @wordpress/i18n. No Bootstrap, no Tailwind. Compiled with @wordpress/scripts
 * so the @wordpress/* imports externalize to the wp.* globals.
 *
 * Prices/URLs mirror the Freemius plan (plugin 13388, plan 22449): annual +
 * lifetime, for 1 / 5 / 10 sites (no monthly, no trial). The yearly/lifetime
 * toggle swaps the price and appends ?billing_cycle=lifetime to the checkout URL.
 */
import { createRoot, render, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, CardBody, Button, Flex, FlexItem } from '@wordpress/components';

const DATA = (typeof window !== 'undefined' && window.ttsPricingData) || {};
const CHECKOUT_BASE = 'https://checkout.freemius.com/plugin/13388/plan/22449/licenses/';
const BRAND = '#184c53';

// Small inline check — @wordpress/icons isn't externalized by this wp-scripts
// version, so we keep the page dependency-free with a local SVG.
function CheckIcon( { size = 20, color = BRAND } ) {
	return (
		<svg width={ size } height={ size } viewBox="0 0 24 24" fill="none" aria-hidden="true" style={ { flexShrink: 0 } }>
			<path d="M20 6L9 17l-5-5" stroke={ color } strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

const TIERS = [
	{ key: '1', name: __( 'Single site', 'text-to-audio' ), sites: __( '1 site', 'text-to-audio' ), annual: 59, lifetime: 199, licenses: 1, popular: false },
	{ key: '5', name: __( '5 sites', 'text-to-audio' ), sites: __( 'Up to 5 sites', 'text-to-audio' ), annual: 149, lifetime: 249, licenses: 5, popular: true },
	{ key: '10', name: __( '10 sites', 'text-to-audio' ), sites: __( 'Up to 10 sites', 'text-to-audio' ), annual: 199, lifetime: 299, licenses: 10, popular: false },
];

const FEATURES = [
	__( '200+ AI voices (Google Cloud TTS)', 'text-to-audio' ),
	__( 'Google Cloud, OpenAI and ElevenLabs engines', 'text-to-audio' ),
	__( 'Bulk MP3 generation, unlimited characters', 'text-to-audio' ),
	__( 'Unlimited MP3 downloads', 'text-to-audio' ),
	__( 'Save MP3s to Google Cloud Storage', 'text-to-audio' ),
	__( 'WPML, GTranslate and TranslatePress support', 'text-to-audio' ),
	__( 'ACF, SCF and page-builder compatible', 'text-to-audio' ),
	__( 'Multiple audio players and designs', 'text-to-audio' ),
	__( 'CSS-selector content targeting', 'text-to-audio' ),
	__( 'Exclude by category, tag or ID', 'text-to-audio' ),
	__( 'Advanced listening analytics', 'text-to-audio' ),
	__( 'Text aliases and live setup support', 'text-to-audio' ),
];

function checkoutUrl( licenses, cycle ) {
	const base = CHECKOUT_BASE + licenses + '/';
	return cycle === 'lifetime' ? base + '?billing_cycle=lifetime' : base;
}

function CycleToggle( { cycle, setCycle } ) {
	const opt = ( value, label ) => (
		<Button
			variant={ cycle === value ? 'primary' : 'tertiary' }
			onClick={ () => setCycle( value ) }
			style={ cycle === value ? { background: BRAND } : {} }
		>
			{ label }
		</Button>
	);
	return (
		<Flex justify="center" gap={ 2 } style={ { margin: '18px 0 8px' } }>
			<FlexItem>{ opt( 'annual', __( 'Yearly', 'text-to-audio' ) ) }</FlexItem>
			<FlexItem>{ opt( 'lifetime', __( 'Lifetime', 'text-to-audio' ) ) }</FlexItem>
		</Flex>
	);
}

function TierCard( { tier, cycle } ) {
	const price = cycle === 'lifetime' ? tier.lifetime : tier.annual;
	const per = cycle === 'lifetime' ? __( 'one-time', 'text-to-audio' ) : __( '/ year', 'text-to-audio' );
	return (
		<Card
			size="medium"
			style={ {
				flex: '1 1 200px',
				border: tier.popular ? `2px solid ${ BRAND }` : undefined,
				position: 'relative',
			} }
		>
			<CardBody>
				<Flex justify="space-between" align="center">
					<FlexItem>
						<h3 style={ { margin: 0 } }>{ tier.name }</h3>
					</FlexItem>
					{ tier.popular && (
						<FlexItem>
							<span style={ { background: BRAND, color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 999 } }>
								{ __( 'Most popular', 'text-to-audio' ) }
							</span>
						</FlexItem>
					) }
				</Flex>
				<p style={ { color: '#757575', margin: '2px 0 12px', fontSize: 13 } }>{ tier.sites }</p>
				<div style={ { fontSize: 30, fontWeight: 600, color: BRAND } }>
					{ '$' + price }
					<span style={ { fontSize: 13, fontWeight: 400, color: '#757575' } }>{ ' ' + per }</span>
				</div>
				<div style={ { marginTop: 16 } }>
					<Button
						variant={ tier.popular ? 'primary' : 'secondary' }
						href={ checkoutUrl( tier.licenses, cycle ) }
						target="_blank"
						rel="noopener noreferrer"
						style={ { width: '100%', justifyContent: 'center', ...( tier.popular ? { background: BRAND } : {} ) } }
					>
						{ __( 'Get', 'text-to-audio' ) + ' ' + tier.name }
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}

function Pricing() {
	const [ cycle, setCycle ] = useState( 'annual' );

	return (
		<div style={ { maxWidth: 1080, margin: '20px auto' } }>
			<div style={ { textAlign: 'center' } }>
				<h1 style={ { marginBottom: 4 } }>{ __( 'Upgrade to AtlasVoice Pro', 'text-to-audio' ) }</h1>
				<p style={ { color: '#757575', margin: 0 } }>
					{ __( '200+ AI voices, MP3 export and bulk generation — one plugin, every site you own.', 'text-to-audio' ) }
				</p>
			</div>

			<CycleToggle cycle={ cycle } setCycle={ setCycle } />
			<p style={ { textAlign: 'center', color: '#008a20', fontSize: 12, margin: '0 0 8px' } }>
				{ cycle === 'lifetime'
					? __( 'Pay once, own it forever.', 'text-to-audio' )
					: __( 'Billed yearly, renews automatically.', 'text-to-audio' ) }
			</p>

			<Flex align="stretch" gap={ 4 } wrap style={ { marginTop: 12 } }>
				{ TIERS.map( ( tier ) => (
					<FlexItem key={ tier.key } style={ { flex: '1 1 200px', display: 'flex' } }>
						<TierCard tier={ tier } cycle={ cycle } />
					</FlexItem>
				) ) }
			</Flex>

			<p style={ { textAlign: 'center', color: '#757575', fontSize: 13, margin: '16px 0' } }>
				{ __( '14-day money-back guarantee', 'text-to-audio' ) }
				{ DATA.demo_url && (
					<>
						{ ' · ' }
						<a href={ DATA.demo_url } target="_blank" rel="noopener noreferrer" style={ { color: BRAND } }>
							{ __( 'See the live demo ↗', 'text-to-audio' ) }
						</a>
					</>
				) }
			</p>

			<Card size="medium">
				<CardBody>
					<h2 style={ { marginTop: 0 } }>{ __( 'Everything in Pro', 'text-to-audio' ) }</h2>
					<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px 24px' } }>
						{ FEATURES.map( ( f, i ) => (
							<div key={ i } style={ { display: 'flex', alignItems: 'flex-start', gap: 6 } }>
								<CheckIcon size={ 20 } />
								<span>{ f }</span>
							</div>
						) ) }
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

function ProActive() {
	return (
		<div style={ { maxWidth: 720, margin: '40px auto', textAlign: 'center' } }>
			<CheckIcon size={ 40 } color="#008a20" />
			<h1>{ __( "You're on AtlasVoice Pro", 'text-to-audio' ) }</h1>
			<p style={ { color: '#757575' } }>
				{ __( 'Thanks for upgrading. Manage your license from the Pro plugin settings.', 'text-to-audio' ) }
			</p>
		</div>
	);
}

const mount = document.getElementById( 'tta-pricing-root' );
if ( mount ) {
	const App = DATA.is_pro_active ? <ProActive /> : <Pricing />;
	if ( typeof createRoot === 'function' ) {
		createRoot( mount ).render( App );
	} else {
		render( App, mount );
	}
}
