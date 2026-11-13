import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';

/**
 * The state of a settings form that is loaded from, and saved to, one REST
 * route: the values on screen, what is saved, and whether they differ.
 *
 * Every form screen uses it, so they all behave the same: nothing is written
 * until Save, only the changed fields are sent (the site keeps the rest), and
 * a failed load or save says why.
 *
 * @param {string} route        REST route, e.g. "tta/v1/read-along".
 * @param {string} savedMessage Shown in the snackbar after a save.
 * @return {Object} { values, set, dirty, saving, save, loading, failure, reload }
 */
export default function useSettingsForm( route, savedMessage ) {
	const { boot, notify } = useApp();
	const [ saved, setSaved ] = useState( null );
	const [ values, setValues ] = useState( null );
	const [ failure, setFailure ] = useState( null );
	const [ saving, setSaving ] = useState( false );

	const reload = useCallback( async () => {
		setFailure( null );
		try {
			const loaded = await request( boot, route );
			setSaved( loaded );
			setValues( loaded );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot, route ] );

	useEffect( () => {
		reload();
	}, [ reload ] );

	const changed = useMemo( () => {
		const fields = {};
		if ( saved && values ) {
			for ( const key of Object.keys( values ) ) {
				if ( values[ key ] !== saved[ key ] ) {
					fields[ key ] = values[ key ];
				}
			}
		}

		return fields;
	}, [ saved, values ] );

	const set = useCallback( ( key, value ) => {
		setValues( ( current ) => ( { ...current, [ key ]: value } ) );
	}, [] );

	const save = useCallback( async () => {
		if ( ! Object.keys( changed ).length ) {
			return;
		}

		setSaving( true );
		try {
			const stored = await request( boot, route, {
				method: 'POST',
				data: changed,
			} );
			setSaved( stored );
			setValues( stored );
			notify( savedMessage );
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'Not saved: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setSaving( false );
	}, [ boot, route, changed, notify, savedMessage ] );

	return {
		values,
		set,
		dirty: Object.keys( changed ).length > 0,
		saving,
		save,
		loading: ! values && ! failure,
		failure,
		reload,
	};
}
