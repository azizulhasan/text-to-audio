/**
 * The one surface an extension builds on: `window.atlasvoice.ui`.
 *
 * AtlasVoice Pro (and any add-on) renders its own screens, tabs and rows in
 * the app through this object and two kinds of hooks. It is the only global
 * the app sets, it is frozen, and it carries a version, so an extension can
 * check what it is talking to instead of guessing.
 *
 *   const { parts, useApp, request, Slot, version } = window.atlasvoice.ui;
 *
 *   // A whole screen or tab, by route id:
 *   wp.hooks.addFilter( 'atlasvoice.screens', 'atlasvoice-pro', ( screens ) => ( {
 *       ...screens,
 *       seo: ProSeoScreen,
 *   } ) );
 *
 *   // A row or card inside a free screen, where the screen has a slot:
 *   wp.hooks.addFilter( 'atlasvoice.slot.voice.engines', 'atlasvoice-pro',
 *       ( fills ) => [ ...fills, CloudEngineTile ] );
 *
 * Extensions use WordPress's own components (wp.components) for controls, as
 * the app does; `parts` holds only the layout pieces WordPress has no
 * component for, so Pro screens look and behave like the free ones.
 */
import { request } from '../api';
import { useApp } from '../app-context';
import Drawer, { DrawerSection } from '../shell/Drawer';
import {
	AppIcon,
	Chip,
	Count,
	Empty,
	Pane,
	ProBadge,
	Scroll,
	Section,
} from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import Slot from './Slot';

/**
 * Raised when something an extension relies on changes in a way that could
 * break it. Adding a part does not raise it.
 */
export const KIT_VERSION = 1;

/**
 * Builds the frozen surface.
 *
 * @return {Object} The kit.
 */
export function createKit() {
	return Object.freeze( {
		version: KIT_VERSION,
		parts: Object.freeze( {
			AppIcon,
			Chip,
			Count,
			Drawer,
			DrawerSection,
			Empty,
			Pane,
			ProBadge,
			SaveBar,
			Scroll,
			Section,
		} ),
		Slot,
		useApp,
		request,
	} );
}

/**
 * Publishes the kit as `window.atlasvoice.ui`, once.
 *
 * An existing `window.atlasvoice` is kept: other AtlasVoice scripts may
 * already use that object. Only the `ui` key is added, and it cannot be
 * replaced afterwards.
 *
 * @param {Object} root The global object. Passed in so tests can fake it.
 * @return {Object} The kit.
 */
export function publishKit( root = window ) {
	if ( root.atlasvoice?.ui?.version ) {
		return root.atlasvoice.ui;
	}

	const kit = createKit();
	const holder =
		root.atlasvoice && typeof root.atlasvoice === 'object'
			? root.atlasvoice
			: {};

	Object.defineProperty( holder, 'ui', {
		value: kit,
		writable: false,
		configurable: false,
		enumerable: true,
	} );
	root.atlasvoice = holder;

	return kit;
}
