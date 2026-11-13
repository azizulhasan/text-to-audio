import { createContext, useContext } from '@wordpress/element';

/**
 * What every part of the app can reach: the boot data from PHP, the current
 * route, and the few actions that belong to the frame.
 *
 * Value: { boot, isPro, route, go, notify, confirm, dirty, mode, setMode }.
 */
export const AppContext = createContext( null );

/**
 * @return {Object} The app context.
 */
export function useApp() {
	return useContext( AppContext );
}
