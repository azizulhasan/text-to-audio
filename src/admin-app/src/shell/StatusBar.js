import { __, sprintf } from '@wordpress/i18n';
import { FormToggle } from '@wordpress/components';
import { useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';

export const MODE_LIVE = 'production';
export const MODE_STAGING = 'staging';

/**
 * The status bar: always shows whether visitors can hear the posts, and holds
 * the one "Live for visitors" switch. Going live and going back to staging
 * both ask first; the server keeps its own typed confirmation for going live.
 *
 * @return {*} The status bar.
 */
export default function StatusBar() {
	const { boot, isPro, mode, setMode, confirm, notify } = useApp();
	const [ busy, setBusy ] = useState( false );
	const live = mode === MODE_LIVE;

	const change = async ( toLive ) => {
		setBusy( true );
		try {
			const result = await request( boot, 'tta/v1/mode', {
				method: 'POST',
				data: toLive
					? { action: 'go-live', confirm: 'GO LIVE' }
					: { action: 'revert' },
			} );
			setMode( result?.mode === MODE_LIVE ? MODE_LIVE : MODE_STAGING );
			notify(
				toLive
					? __(
							'AtlasVoice is live. Visitors can hear your posts.',
							'text-to-audio'
					  )
					: __(
							'Back in staging. Only admins see the player.',
							'text-to-audio'
					  )
			);
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'Could not change the mode: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setBusy( false );
	};

	const ask = () =>
		live
			? confirm( {
					title: __( 'Go back to staging?', 'text-to-audio' ),
					body: __(
						'Visitors will stop seeing the player. Admins still see it, so you can test. Audio that is already made is kept.',
						'text-to-audio'
					),
					ok: __( 'Back to staging', 'text-to-audio' ),
					destructive: true,
					onOk: () => change( false ),
			  } )
			: confirm( {
					title: __( 'Go live for visitors?', 'text-to-audio' ),
					body: __(
						'Every visitor will see the player on the posts you chose. You can go back to staging at any time.',
						'text-to-audio'
					),
					ok: __( 'Go live', 'text-to-audio' ),
					onOk: () => change( true ),
			  } );

	return (
		<footer className="atlasvoice-status">
			<span
				className={
					'atlasvoice-status-item ' +
					( live ? 'is-live' : 'is-staging' )
				}
				role="status"
			>
				<span className="atlasvoice-dot" aria-hidden="true" />
				{ live
					? __( 'Live: visitors hear your posts', 'text-to-audio' )
					: __(
							'Staging: only admins see the player',
							'text-to-audio'
					  ) }
			</span>
			<span className="atlasvoice-status-item atlasvoice-hide-sm">
				{ isPro && boot.proVersion
					? sprintf(
							/* translators: %s: Pro plugin version. */
							__( 'Pro %s', 'text-to-audio' ),
							boot.proVersion
					  )
					: sprintf(
							/* translators: %s: plugin version. */
							__( 'Free %s', 'text-to-audio' ),
							boot.version
					  ) }
			</span>
			<span className="atlasvoice-status-end">
				<label htmlFor="atlasvoice-live">
					{ __( 'Live for visitors', 'text-to-audio' ) }
				</label>
				<FormToggle
					id="atlasvoice-live"
					checked={ live }
					disabled={ busy }
					onChange={ ask }
				/>
			</span>
		</footer>
	);
}
