import { __ } from '@wordpress/i18n';
import { Button, Modal, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';

/**
 * The one-time welcome for a site that updated to the new screens.
 *
 * It says first that nothing saved has changed, then what is different, and
 * offers three ways on. Whatever the user chooses, the site remembers that
 * the welcome was seen, so it never comes back.
 *
 * @return {*} The modal, or nothing when it is not due.
 */
export default function Welcome() {
	const { boot, go } = useApp();
	const [ open, setOpen ] = useState( !! boot.showWelcome );

	if ( ! open ) {
		return null;
	}

	const close = ( nextRoute ) => {
		setOpen( false );
		// Not awaited and not reported: if it fails, the welcome shows once
		// more on the next visit, which is harmless.
		request( boot, 'tta/v1/admin-ui', {
			method: 'POST',
			data: { welcome: 'seen' },
		} ).catch( () => {} );

		if ( nextRoute ) {
			go( nextRoute );
		}
	};

	return (
		<Modal
			title={ __( 'AtlasVoice has a new look', 'text-to-audio' ) }
			onRequestClose={ () => close() }
			size="medium"
		>
			<div className="atlasvoice-root atlasvoice-welcome">
				<Notice status="success" isDismissible={ false }>
					<b>
						{ __(
							'Nothing you saved has changed.',
							'text-to-audio'
						) }
					</b>{ ' ' }
					{ __(
						'Your voice, player colours, audio files and statistics are exactly as they were, and your visitors see no difference.',
						'text-to-audio'
					) }
				</Notice>
				<ul className="atlasvoice-list">
					<li>
						{ __(
							'The menu is shorter: Voice, Player and What is read to set up; Audio library and Insights for every day.',
							'text-to-audio'
						) }
					</li>
					<li>
						{ __(
							'“Where things moved” in Help lists every old menu item and its new home.',
							'text-to-audio'
						) }
					</li>
					<li>
						{ __(
							'Staging and Go live are now in the bar at the bottom of every screen.',
							'text-to-audio'
						) }
					</li>
				</ul>
				<div className="atlasvoice-modal-foot">
					<Button
						variant="link"
						onClick={ () => close( 'site:advanced' ) }
					>
						{ __(
							'Use the classic screens for now',
							'text-to-audio'
						) }
					</Button>
					<Button
						variant="secondary"
						onClick={ () => close( 'help:moved' ) }
						__next40pxDefaultSize
					>
						{ __( 'Show me what moved', 'text-to-audio' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ () => close() }
						__next40pxDefaultSize
					>
						{ __( 'Start using it', 'text-to-audio' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}
