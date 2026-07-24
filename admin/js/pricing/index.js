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
	__( 'Read-along highlighting — words and sentences light up as they are spoken', 'text-to-audio' ),
	__( '4 AI voice engines — AtlasVoice AI, Google Cloud, OpenAI (ChatGPT) and ElevenLabs', 'text-to-audio' ),
	__( 'AtlasVoice AI voices — 80+ languages, included at no extra cost', 'text-to-audio' ),
	__( '300+ Google Cloud voices across 90+ languages', 'text-to-audio' ),
	__( 'Ultra-realistic ElevenLabs and OpenAI HD voices', 'text-to-audio' ),
	__( 'Bulk MP3 generation — unlimited characters, hundreds of posts', 'text-to-audio' ),
	__( 'Unlimited MP3 downloads for you and your visitors', 'text-to-audio' ),
	__( 'Save MP3s to Google Cloud Storage', 'text-to-audio' ),
	__( '6 player styles plus floating / sticky player', 'text-to-audio' ),
	__( 'CSS-selector targeting and exclude by category, tag or ID', 'text-to-audio' ),
	__( 'WPML, GTranslate and TranslatePress — full multilingual support', 'text-to-audio' ),
	__( 'ACF, SCF and page-builder compatible', 'text-to-audio' ),
	__( 'Advanced analytics plus Audio Schema for SEO rich results', 'text-to-audio' ),
	__( 'Text aliases plus priority support (1-hour) and live setup help', 'text-to-audio' ),
];

// Small print shown under the feature grid — clarifies the BYO-provider model.
const PROVIDER_NOTE = __( 'Bring your own provider keys: AtlasVoice AI voices are included free. Google Cloud, OpenAI (ChatGPT) and ElevenLabs connect to your own provider account, so their usage is billed by the provider — not by us.', 'text-to-audio' );

// Honest one-line summary of the refund conditions (see refund-policy link).
const REFUND_NOTE = __( 'Refunds cover an unresolved bug that leaves the plugin inoperable, requested within 14 days of purchase, after giving us a chance to fix it. Not covered: missing features, third-party plugin conflicts, change of mind, or subscription renewals.', 'text-to-audio' );
const REFUND_URL = 'https://atlasaidev.com/refund-policy/';

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
					{ __( '4 AI voice engines, 80+ languages, MP3 export and read-along highlighting — one plugin, every site you own.', 'text-to-audio' ) }
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

			<p style={ { textAlign: 'center', color: '#757575', fontSize: 13, margin: '16px 0 4px' } }>
				<strong style={ { color: '#1d2327' } }>{ __( '14-day money-back guarantee', 'text-to-audio' ) }</strong>
				{ ' — ' }
				<a href={ REFUND_URL } target="_blank" rel="noopener noreferrer" style={ { color: BRAND } }>
					{ __( 'conditions apply ↗', 'text-to-audio' ) }
				</a>
				{ DATA.demo_url && (
					<>
						{ ' · ' }
						<a href={ DATA.demo_url } target="_blank" rel="noopener noreferrer" style={ { color: BRAND } }>
							{ __( 'See the live demo ↗', 'text-to-audio' ) }
						</a>
					</>
				) }
			</p>
			<p style={ { textAlign: 'center', color: '#949494', fontSize: 12, margin: '0 auto 20px', maxWidth: 720, lineHeight: 1.5 } }>
				{ REFUND_NOTE }
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
					<p style={ { color: '#949494', fontSize: 12, marginBottom: 0, marginTop: 16, lineHeight: 1.5 } }>
						{ PROVIDER_NOTE }
					</p>
				</CardBody>
			</Card>

			{ DATA.compare_url && (
				<p style={ { textAlign: 'center', fontSize: 13, margin: '18px 0 0' } }>
					<a href={ DATA.compare_url } target="_blank" rel="noopener noreferrer" style={ { color: BRAND } }>
						{ __( 'See the full comparison, reviews and FAQ ↗', 'text-to-audio' ) }
					</a>
				</p>
			) }
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
