/**
 * "Where things moved": every menu item of the classic screens, its new home
 * and the route that opens it (DESIGN.md, "Information architecture").
 */
import { __ } from '@wordpress/i18n';

/**
 * The rows, in the order of the classic menu.
 *
 * `pro` marks a home that only exists with Pro; that row is left out in Free.
 *
 * @return {Object[]} Rows of { before, now, route, pro }.
 */
export function getMovedItems() {
	return [
		{
			before: __( 'Settings', 'text-to-audio' ),
			now: __( 'What is read', 'text-to-audio' ),
			route: 'content',
		},
		{
			before: __(
				'Settings (toolbar, dashboard widget, delete data)',
				'text-to-audio'
			),
			now: __( 'Site health › Advanced', 'text-to-audio' ),
			route: 'site:advanced',
		},
		{
			before: __( 'Integrations', 'text-to-audio' ),
			now: __( 'Voice › Your own provider', 'text-to-audio' ),
			route: 'voice:providers',
		},
		{
			before: __( 'Customization', 'text-to-audio' ),
			now: __( 'Player', 'text-to-audio' ),
			route: 'player',
		},
		{
			before: __( 'Customization › Select Player', 'text-to-audio' ),
			now: __( 'Voice', 'text-to-audio' ),
			route: 'voice',
		},
		{
			before: __( 'Listening', 'text-to-audio' ),
			now: __( 'Voice', 'text-to-audio' ),
			route: 'voice',
		},
		{
			before: __( 'Highlight', 'text-to-audio' ),
			now: __( 'Player › Read-along', 'text-to-audio' ),
			route: 'player:read',
		},
		{
			before: __( 'Analytics', 'text-to-audio' ),
			now: __( 'Insights', 'text-to-audio' ),
			route: 'insights',
		},
		{
			before: __( 'SEO & AI Search', 'text-to-audio' ),
			now: __( 'SEO & AI Search', 'text-to-audio' ),
			route: 'seo',
		},
		{
			before: __( 'Compatibility', 'text-to-audio' ),
			now: __( 'Site health', 'text-to-audio' ),
			route: 'site:health',
		},
		{
			before: __( 'Aliases', 'text-to-audio' ),
			now: __( 'Voice › Pronunciation', 'text-to-audio' ),
			route: 'voice:pronunciation',
		},
		{
			before: __( 'Maintenance', 'text-to-audio' ),
			now: __( 'Audio library › Clean up', 'text-to-audio' ),
			route: 'library:clean',
			pro: true,
		},
		{
			before: __( 'Versions', 'text-to-audio' ),
			now: __( 'Site health › Versions', 'text-to-audio' ),
			route: 'site:versions',
		},
		{
			before: __( 'Docs', 'text-to-audio' ),
			now: __( 'Help', 'text-to-audio' ),
			route: 'help:docs',
		},
		{
			before: __( 'Our Plugins', 'text-to-audio' ),
			now: __( 'Help › More plugins', 'text-to-audio' ),
			route: 'help:more',
		},
		{
			before: __( 'Bulk MP3 Generate', 'text-to-audio' ),
			now: __( 'Audio library', 'text-to-audio' ),
			route: 'library',
		},
		{
			before: __( 'Pricing', 'text-to-audio' ),
			now: __( 'Account & plans › Plans', 'text-to-audio' ),
			route: 'account:plans',
		},
		{
			before: __( 'Account, Affiliation', 'text-to-audio' ),
			now: __( 'Account & plans › Licence', 'text-to-audio' ),
			route: 'account:licence',
			pro: true,
		},
		{
			before: __( 'Staging / Go live buttons', 'text-to-audio' ),
			now: __( 'The bar at the bottom of every screen', 'text-to-audio' ),
			route: 'overview',
		},
	];
}

/**
 * The rows that match what the user typed, for this site.
 *
 * @param {Object[]} items Rows from getMovedItems().
 * @param {string}   query What was typed; matches the old or the new name.
 * @param {boolean}  isPro Whether Pro is active.
 * @return {Object[]} Matching rows.
 */
export function filterMovedItems( items, query, isPro ) {
	const needle = String( query || '' )
		.trim()
		.toLowerCase();

	return items.filter(
		( item ) =>
			( isPro || ! item.pro ) &&
			( ! needle ||
				( item.before + ' ' + item.now )
					.toLowerCase()
					.includes( needle ) )
	);
}
