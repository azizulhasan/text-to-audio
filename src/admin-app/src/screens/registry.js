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

const BUILT_IN = {
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
	'site:advanced': lazy( () =>
		import(
			/* webpackChunkName: "screen-site-advanced" */ './SiteAdvanced'
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
