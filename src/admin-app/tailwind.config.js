/**
 * Scoped Tailwind (DESIGN.md, rule 3: "prefix everything, leak nothing").
 *
 * - every class is prefixed, so it cannot meet a class of WordPress or a plugin;
 * - every rule is nested under .atlasvoice-root, so it cannot style wp-admin;
 * - preflight is off, because it is a global reset.
 */
module.exports = {
	prefix: 'atlasvoice-',
	important: '.atlasvoice-root',
	corePlugins: {
		preflight: false,
	},
	content: [ './src/**/*.js' ],
	theme: {
		extend: {
			colors: {
				accent: 'var(--atlasvoice-accent)',
				'brand-ink': 'var(--atlasvoice-brand-ink)',
				'brand-weak': 'var(--atlasvoice-brand-weak)',
				surface: 'var(--atlasvoice-surface)',
				canvas: 'var(--atlasvoice-canvas)',
				line: 'var(--atlasvoice-line)',
				text: 'var(--atlasvoice-text)',
				'text-weak': 'var(--atlasvoice-text-weak)',
			},
			borderRadius: {
				DEFAULT: 'var(--atlasvoice-radius)',
				lg: 'var(--atlasvoice-radius-lg)',
			},
		},
	},
	plugins: [],
};
