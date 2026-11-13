/**
 * The brand layer: one colour, applied through WordPress's own theming.
 */

/** Voice Indigo. The same value is the fallback in styles/tokens.css. */
export const BRAND_COLOR = '#5646e5';

/**
 * Finds WordPress's ThemeProvider (WordPress 7.0+), if this site has it.
 *
 * It is read from the `wp` global and not imported, because the package does
 * not exist on WordPress 6.6 to 6.9 and an import would break the bundle there.
 *
 * @param {Object} root The object that holds `wp`. Passed in so tests can fake it.
 * @return {Function|null} The component, or null on older WordPress.
 */
export function getThemeProvider( root = window ) {
	const provider = root?.wp?.theme?.ThemeProvider;

	return typeof provider === 'function' || typeof provider === 'object'
		? provider || null
		: null;
}

/**
 * Wraps the app in the brand colour.
 *
 * With ThemeProvider, WordPress recomputes its design tokens for our subtree.
 * Without it the children are returned as they are, and the fallbacks in
 * tokens.css carry the same look.
 *
 * @param {Object} props
 * @param {*}      props.children The app.
 * @return {*} The themed app.
 */
export function BrandTheme( { children } ) {
	const ThemeProvider = getThemeProvider();

	if ( ! ThemeProvider ) {
		return children;
	}

	return (
		<ThemeProvider color={ { primary: BRAND_COLOR } }>
			{ children }
		</ThemeProvider>
	);
}
