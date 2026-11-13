import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

import { useApp } from '../app-context';

/**
 * The sticky footer of a form: says whether there are unsaved changes and
 * holds the one Save button. Nothing is written until Save is pressed, the
 * same moment as in the classic screens.
 *
 * While `dirty` is true the frame asks before the user leaves the screen,
 * the tab or the page.
 *
 * @param {Object}   props
 * @param {boolean}  props.dirty  Whether the form differs from what is saved.
 * @param {boolean}  props.saving Whether a save is running.
 * @param {Function} props.onSave Saves the form.
 * @return {*} The footer.
 */
export default function SaveBar( { dirty, saving, onSave } ) {
	const { setDirty } = useApp();

	useEffect( () => {
		setDirty( dirty );

		return () => setDirty( false );
	}, [ dirty, setDirty ] );

	return (
		<div className="atlasvoice-footer">
			<span className="atlasvoice-footer-note" role="status">
				{ dirty
					? __( 'Unsaved changes', 'text-to-audio' )
					: __( 'All changes saved', 'text-to-audio' ) }
			</span>
			<Button
				variant="primary"
				disabled={ ! dirty || saving }
				isBusy={ saving }
				onClick={ onSave }
				__next40pxDefaultSize
			>
				{ __( 'Save', 'text-to-audio' ) }
			</Button>
		</div>
	);
}
