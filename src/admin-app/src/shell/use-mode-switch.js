/**
 * Going live and going back to staging.
 *
 * There is one way to change who can hear the posts, used by the status bar
 * and by Home: ask first, then tell the site, then say what happened. Both
 * places open the same question, so the owner never meets two wordings for
 * one decision.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';

export const MODE_LIVE = 'production';
export const MODE_STAGING = 'staging';

/**
 * @return {Object} { live, busy, ask }: whether the site is live, whether a change is being
 *                  saved, and a function that asks and then switches.
 */
export default function useModeSwitch() {
	const { boot, mode, setMode, confirm, notify } = useApp();
	const [ busy, setBusy ] = useState( false );
	const live = mode === MODE_LIVE;

	const change = useCallback(
		async ( toLive ) => {
			setBusy( true );
			try {
				const result = await request( boot, 'tta/v1/mode', {
					method: 'POST',
					data: toLive
						? { action: 'go-live', confirm: 'GO LIVE' }
						: { action: 'revert' },
				} );
				setMode(
					result?.mode === MODE_LIVE ? MODE_LIVE : MODE_STAGING
				);
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
		},
		[ boot, setMode, notify ]
	);

	const ask = useCallback(
		() =>
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
				  } ),
		[ live, confirm, change ]
	);

	return { live, busy, ask };
}
