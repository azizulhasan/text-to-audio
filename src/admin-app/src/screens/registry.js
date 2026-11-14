/**
 * Which component shows for which route.
 *
 * Each screen is loaded only when it is opened (its own chunk), so the first
 * load stays small however many screens exist. A route without an entry shows
 * the placeholder that links to the classic screens.
 *
 * This is also where Pro adds its screens: the `atlasvoice.screens` filter
 * receives the map and returns it with Pro's own routes, each a component or
 * a lazy component. The free plugin holds no Pro screen (wp.org guideline 5).
 */
import { lazy } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

// One report, three views: the component shows the tab that is open.
const InsightsReport = lazy( () =>
	import(
		/* webpackChunkName: "screen-insights-report" */ './InsightsReport'
	)
);

const BUILT_IN = {
	'insights:overview': InsightsReport,
	'insights:posts': InsightsReport,
	'insights:listeners': InsightsReport,
	'voice:languages': lazy( () =>
		import(
			/* webpackChunkName: "screen-voice-languages" */ './VoiceLanguages'
		)
	),
	'voice:providers': lazy( () =>
		import(
			/* webpackChunkName: "screen-voice-providers" */ './VoiceProviders'
		)
	),
	'voice:voice': lazy( () =>
		import( /* webpackChunkName: "screen-voice-voice" */ './VoiceVoice' )
	),
	overview: lazy( () =>
		import( /* webpackChunkName: "screen-home" */ './Home' )
	),
	'account:plans': lazy( () =>
		import(
			/* webpackChunkName: "screen-account-plans" */ './AccountPlans'
		)
	),
	'account:usage': lazy( () =>
		import(
			/* webpackChunkName: "screen-account-usage" */ './AccountUsage'
		)
	),
	// What the free plugin shows; AtlasVoice Pro replaces it with its own screen.
	seo: lazy( () => import( /* webpackChunkName: "screen-seo" */ './Seo' ) ),
	'library:all': lazy( () =>
		import( /* webpackChunkName: "screen-library-all" */ './LibraryAll' )
	),
	'insights:tracking': lazy( () =>
		import(
			/* webpackChunkName: "screen-insights-tracking" */ './InsightsTracking'
		)
	),
	'content:areas': lazy( () =>
		import(
			/* webpackChunkName: "screen-content-areas" */ './ContentAreas'
		)
	),
	'content:text': lazy( () =>
		import( /* webpackChunkName: "screen-content-text" */ './ContentText' )
	),
	'content:where': lazy( () =>
		import(
			/* webpackChunkName: "screen-content-where" */ './ContentWhere'
		)
	),
	'player:ai': lazy( () =>
		import(
			/* webpackChunkName: "screen-player-ai-notice" */ './PlayerAiNotice'
		)
	),
	'player:embed': lazy( () =>
		import( /* webpackChunkName: "screen-player-embed" */ './PlayerEmbed' )
	),
	'player:look': lazy( () =>
		import( /* webpackChunkName: "screen-player-look" */ './PlayerLook' )
	),
	'player:place': lazy( () =>
		import(
			/* webpackChunkName: "screen-player-placement" */ './PlayerPlacement'
		)
	),
	'player:words': lazy( () =>
		import( /* webpackChunkName: "screen-player-words" */ './PlayerWords' )
	),
	'player:read': lazy( () =>
		import(
			/* webpackChunkName: "screen-player-read-along" */ './PlayerReadAlong'
		)
	),
	'voice:pronunciation': lazy( () =>
		import(
			/* webpackChunkName: "screen-voice-pronunciation" */ './VoicePronunciation'
		)
	),
	'site:health': lazy( () =>
		import( /* webpackChunkName: "screen-site-health" */ './SiteHealth' )
	),
	'site:versions': lazy( () =>
		import(
			/* webpackChunkName: "screen-site-versions" */ './SiteVersions'
		)
	),
	'site:privacy': lazy( () =>
		import( /* webpackChunkName: "screen-site-privacy" */ './SitePrivacy' )
	),
	'site:advanced': lazy( () =>
		import(
			/* webpackChunkName: "screen-site-advanced" */ './SiteAdvancedTab'
		)
	),
	'help:moved': lazy( () =>
		import( /* webpackChunkName: "screen-help-moved" */ './HelpMoved' )
	),
};

/**
 * Finds the component for a route.
 *
 * @param {string} routeId "screen" or "screen:tab".
 * @return {Function|Object|null} A component, or null when the route is not rebuilt yet.
 */
export function getScreenComponent( routeId ) {
	const screens = applyFilters( 'atlasvoice.screens', { ...BUILT_IN } );
	const isOwn =
		screens &&
		typeof screens === 'object' &&
		Object.prototype.hasOwnProperty.call( screens, routeId );

	return isOwn && screens[ routeId ] ? screens[ routeId ] : null;
}
