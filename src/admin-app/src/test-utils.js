/* eslint-env jest */
/**
 * Helpers for component tests: renders a part of the app inside the app
 * context, the way the frame provides it.
 */
import { render } from '@testing-library/react';

import { AppContext } from './app-context';
import { resolveRoute } from './routes';

/** Boot data like PHP prints it, for a Free site in staging. */
export const BOOT = {
	version: '2.5.0',
	proVersion: '',
	isPro: false,
	mode: 'staging',
	setupFinished: false,
	restUrl: 'https://site.test/wp-json/',
	restNonce: 'n0nce',
	logoUrl: 'https://site.test/logo.svg',
	classicUrl:
		'https://site.test/wp-admin/admin.php?page=text-to-audio&atlasvoice_ui=classic',
	docsUrl: 'https://atlasaidev.com/docs/atlasvoice/',
	supportUrl: 'https://atlasaidev.com/contact-us/',
	showWelcome: false,
	helpTopics: {
		overview: {
			title: 'Read your Home screen',
			steps: [ 'Step one.', 'Step two.', 'Step three.' ],
			docUrl: 'https://atlasaidev.com/docs/atlasvoice/home/',
			videoUrl: '',
			videoLength: '2:00',
			pro: false,
		},
		'voice:pronunciation': {
			title: 'Fix how a word is said',
			steps: [ 'Open Pronunciation.', 'Add the word.', 'Save.' ],
			docUrl: 'https://atlasaidev.com/docs/atlasvoice/pronunciation/',
			videoUrl: '',
			videoLength: '1:30',
			pro: false,
		},
	},
};

/**
 * Renders `ui` inside the app context.
 *
 * @param {*}      ui        What to render.
 * @param {Object} overrides Context values to replace; `boot` is merged.
 * @return {Object} Testing Library's result plus the context that was used.
 */
export function renderWithApp( ui, overrides = {} ) {
	const boot = { ...BOOT, ...( overrides.boot || {} ) };
	const isPro = !! boot.isPro;
	const context = {
		isPro,
		route: resolveRoute( overrides.hash || '#/overview', isPro ),
		go: jest.fn(),
		notify: jest.fn(),
		confirm: jest.fn(),
		setDirty: jest.fn(),
		mode: boot.mode,
		setMode: jest.fn(),
		...overrides,
		boot,
	};

	return {
		context,
		...render(
			<AppContext.Provider value={ context }>{ ui }</AppContext.Provider>
		),
	};
}
