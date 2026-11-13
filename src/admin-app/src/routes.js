/**
 * The one route table of the app (DESIGN.md, "Information architecture").
 *
 * A route id is "screen" or "screen:tab". In the address bar it is a hash
 * route, "#/screen/tab", like the classic dashboard used, so bookmarks and
 * support links keep working: every old address is mapped to its new home.
 */
import { __ } from '@wordpress/i18n';

/**
 * Screens in rail order. `group` is the rail heading; `pro` marks a screen or
 * tab that only exists when Pro is active (it is simply not there in Free).
 */
export const SCREENS = [
	{ id: 'overview', label: __( 'Home', 'text-to-audio' ), icon: 'home' },
	{ id: 'setup', label: __( 'Setup', 'text-to-audio' ), icon: 'check' },
	{
		id: 'voice',
		group: 'setup',
		label: __( 'Voice', 'text-to-audio' ),
		icon: 'audio',
		tabs: [
			{ id: 'voice', label: __( 'Voice', 'text-to-audio' ) },
			{
				id: 'pronunciation',
				label: __( 'Pronunciation', 'text-to-audio' ),
			},
			{ id: 'languages', label: __( 'Languages', 'text-to-audio' ) },
			{
				id: 'providers',
				label: __( 'Your own provider', 'text-to-audio' ),
			},
		],
	},
	{
		id: 'player',
		group: 'setup',
		label: __( 'Player', 'text-to-audio' ),
		icon: 'styles',
		tabs: [
			{ id: 'look', label: __( 'Look', 'text-to-audio' ) },
			{ id: 'place', label: __( 'Placement', 'text-to-audio' ) },
			{ id: 'words', label: __( 'Buttons & words', 'text-to-audio' ) },
			{ id: 'read', label: __( 'Read-along', 'text-to-audio' ) },
			{ id: 'ai', label: __( 'AI notice', 'text-to-audio' ) },
			{ id: 'embed', label: __( 'Shortcode & block', 'text-to-audio' ) },
		],
	},
	{
		id: 'content',
		group: 'setup',
		label: __( 'What is read', 'text-to-audio' ),
		icon: 'postContent',
		tabs: [
			{ id: 'where', label: __( 'Where it appears', 'text-to-audio' ) },
			{ id: 'text', label: __( 'Text to read', 'text-to-audio' ) },
			{ id: 'areas', label: __( 'Page areas', 'text-to-audio' ) },
		],
	},
	{
		id: 'library',
		group: 'daily',
		label: __( 'Audio library', 'text-to-audio' ),
		icon: 'media',
		tabs: [
			{ id: 'all', label: __( 'All posts', 'text-to-audio' ) },
			{
				id: 'clean',
				label: __( 'Clean up', 'text-to-audio' ),
				pro: true,
			},
			{ id: 'settings', label: __( 'Settings', 'text-to-audio' ) },
		],
	},
	{
		id: 'insights',
		group: 'daily',
		label: __( 'Insights', 'text-to-audio' ),
		icon: 'chartBar',
		tabs: [
			{ id: 'overview', label: __( 'Overview', 'text-to-audio' ) },
			{ id: 'posts', label: __( 'Posts', 'text-to-audio' ) },
			{ id: 'listeners', label: __( 'Listeners', 'text-to-audio' ) },
			{ id: 'tracking', label: __( 'Tracking', 'text-to-audio' ) },
		],
	},
	{
		id: 'seo',
		group: 'daily',
		label: __( 'SEO & AI Search', 'text-to-audio' ),
		icon: 'globe',
	},
	{
		id: 'site',
		group: 'care',
		label: __( 'Site health', 'text-to-audio' ),
		icon: 'shield',
		tabs: [
			{ id: 'health', label: __( 'Health', 'text-to-audio' ) },
			{ id: 'versions', label: __( 'Versions', 'text-to-audio' ) },
			{ id: 'advanced', label: __( 'Advanced', 'text-to-audio' ) },
			{ id: 'privacy', label: __( 'Privacy', 'text-to-audio' ) },
		],
	},
	{
		id: 'account',
		group: 'care',
		label: __( 'Account & plans', 'text-to-audio' ),
		icon: 'receipt',
		tabs: [
			{ id: 'usage', label: __( 'Usage', 'text-to-audio' ) },
			{
				id: 'licence',
				label: __( 'Licence', 'text-to-audio' ),
				pro: true,
			},
			{ id: 'plans', label: __( 'Plans', 'text-to-audio' ) },
		],
	},
	{
		id: 'help',
		group: 'care',
		label: __( 'Help', 'text-to-audio' ),
		icon: 'help',
		tabs: [
			{ id: 'docs', label: __( 'Documentation', 'text-to-audio' ) },
			{
				id: 'moved',
				label: __( 'Where things moved', 'text-to-audio' ),
			},
			{ id: 'more', label: __( 'More plugins', 'text-to-audio' ) },
		],
	},
];

/** Rail headings, in order. Screens without a group sit above the first one. */
export const GROUPS = [
	{ id: 'setup', label: __( 'Set up', 'text-to-audio' ) },
	{ id: 'daily', label: __( 'Every day', 'text-to-audio' ) },
	{ id: 'care', label: __( 'Look after', 'text-to-audio' ) },
];

/**
 * Addresses of the classic dashboard and where each one lives now.
 * The key is what followed "#/" (the classic router also accepted "#name").
 */
export const CLASSIC_ROUTES = {
	'': 'overview',
	customize: 'player',
	listening: 'voice',
	integrations: 'voice:providers',
	highlight: 'player:read',
	analytics: 'insights',
	seo: 'seo',
	compatibility: 'site:health',
	aliases: 'voice:pronunciation',
	maintenance: 'library:clean',
	versions: 'site:versions',
	faq: 'help:docs',
	plugins: 'help:more',
};

/** Short names that open a tab directly, e.g. "#/plans". */
export const SHORT_ROUTES = {
	pronunciation: 'voice:pronunciation',
	languages: 'voice:languages',
	providers: 'voice:providers',
	licence: 'account:licence',
	plans: 'account:plans',
	health: 'site:health',
	advanced: 'site:advanced',
	privacy: 'site:privacy',
	docs: 'help:docs',
	moved: 'help:moved',
	more: 'help:more',
};

/** Where a Pro-only place sends a site without Pro. */
const FREE_FALLBACK = {
	'account:licence': 'account:plans',
	'library:clean': 'library:all',
};

const DEFAULT_ROUTE = 'overview';

/**
 * Finds a screen by id.
 *
 * @param {string} id Screen id.
 * @return {Object|undefined} The screen.
 */
export function getScreen( id ) {
	return SCREENS.find( ( screen ) => screen.id === id );
}

/**
 * The tabs of a screen that exist on this site.
 *
 * @param {Object}  screen A screen from SCREENS.
 * @param {boolean} isPro  Whether Pro is active.
 * @return {Object[]} Tabs; empty for a screen without tabs.
 */
export function getTabs( screen, isPro ) {
	return ( screen?.tabs || [] ).filter( ( tab ) => isPro || ! tab.pro );
}

/**
 * Turns whatever is in the address bar into a route that exists.
 *
 * It never throws and never returns an unknown place: a wrong or outdated
 * address opens the closest real screen, and Home as the last resort.
 *
 * @param {string}  hash  location.hash, e.g. "#/voice/pronunciation".
 * @param {boolean} isPro Whether Pro is active.
 * @return {{screen: string, tab: string|null, id: string}} The route.
 */
export function resolveRoute( hash, isPro = false ) {
	// "#/voice/languages?x=1" -> "voice/languages". The classic router also used "#voice".
	const raw = String( hash || '' )
		.replace( /^#\/?/, '' )
		.split( '?' )[ 0 ]
		.replace( /\/+$/, '' )
		.toLowerCase();

	let id = raw.replace( '/', ':' );

	if ( Object.prototype.hasOwnProperty.call( SHORT_ROUTES, id ) ) {
		id = SHORT_ROUTES[ id ];
	} else if (
		! getScreen( id.split( ':' )[ 0 ] ) &&
		Object.prototype.hasOwnProperty.call( CLASSIC_ROUTES, raw )
	) {
		id = CLASSIC_ROUTES[ raw ];
	}

	let [ screenId, tabId = null ] = id.split( ':' );
	let screen = getScreen( screenId );

	if ( ! screen ) {
		screen = getScreen( DEFAULT_ROUTE );
		screenId = DEFAULT_ROUTE;
		tabId = null;
	}

	if ( ! isPro && FREE_FALLBACK[ `${ screenId }:${ tabId }` ] ) {
		[ screenId, tabId ] =
			FREE_FALLBACK[ `${ screenId }:${ tabId }` ].split( ':' );
		screen = getScreen( screenId );
	}

	const tabs = getTabs( screen, isPro );

	if ( ! tabs.length ) {
		tabId = null;
	} else if ( ! tabs.some( ( tab ) => tab.id === tabId ) ) {
		tabId = tabs[ 0 ].id;
	}

	return {
		screen: screenId,
		tab: tabId,
		id: tabId ? `${ screenId }:${ tabId }` : screenId,
	};
}

/**
 * The hash for a route id.
 *
 * @param {string} id "screen" or "screen:tab".
 * @return {string} e.g. "#/voice/pronunciation".
 */
export function toHash( id ) {
	return '#/' + String( id ).replace( ':', '/' );
}

/**
 * The classic address that holds the same settings as a new route, for the
 * "Open it in the classic screens" link of a screen that is not rebuilt yet.
 *
 * @param {string} id "screen" or "screen:tab".
 * @return {string} A hash such as "#/customize" ("#/" is the classic Settings tab).
 */
export function classicHashFor( id ) {
	const exact = {
		'voice:pronunciation': 'aliases',
		'voice:providers': 'integrations',
		'player:read': 'highlight',
		'site:health': 'compatibility',
		'site:versions': 'versions',
		'library:clean': 'maintenance',
		'help:docs': 'faq',
		'help:more': 'plugins',
	};
	const byScreen = {
		voice: 'listening',
		player: 'customize',
		insights: 'analytics',
		seo: 'seo',
	};
	const key = String( id );
	const screen = key.split( ':' )[ 0 ];
	// Own keys only: a name such as "__proto__" must not find an inherited value.
	const own = ( map, name ) =>
		Object.prototype.hasOwnProperty.call( map, name ) ? map[ name ] : null;

	return '#/' + ( own( exact, key ) ?? own( byScreen, screen ) ?? '' );
}
