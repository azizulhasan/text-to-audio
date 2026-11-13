/**
 * Player › Shortcode & block.
 *
 * How to place a player by hand: the shortcode with a Copy button, every
 * option it accepts with an example, and the block. A reference: it only
 * reads (GET tta/v1/embed), so there is no Save footer.
 *
 * The list of options comes from the site (TTA\Player\Embed), the same list
 * the command line and an MCP server read, so it cannot drift from the code.
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, CardBody, Notice, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { Pane, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/embed';

/**
 * Puts a text on the clipboard.
 *
 * @param {string} text What to copy.
 * @return {Promise<boolean>} Whether the browser allowed it.
 */
export async function copyText( text ) {
	try {
		await window.navigator.clipboard.writeText( text );

		return true;
	} catch ( error ) {
		// No clipboard on an http:// page or when the browser refuses.
		return false;
	}
}

/**
 * The screen.
 *
 * @return {*} Player › Shortcode & block.
 */
export default function PlayerEmbed() {
	const { boot, notify } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setData( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	if ( ! data && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! data ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: load,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The shortcode could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const options = Array.isArray( data.options ) ? data.options : [];

	const copy = async () => {
		if ( await copyText( data.shortcode ) ) {
			notify( __( 'Shortcode copied.', 'text-to-audio' ) );
		} else {
			notify(
				__(
					'Could not copy. Select the shortcode and copy it by hand.',
					'text-to-audio'
				),
				'error'
			);
		}
	};

	return (
		<Pane canvas>
			<Scroll width={ 860 }>
				<Section
					title={ __( 'Shortcode', 'text-to-audio' ) }
					description={ __(
						'Paste it where the player should appear: a post, a page builder, a widget or a template.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-copyrow">
								<code className="atlasvoice-mono atlasvoice-copyrow-code">
									{ data.shortcode }
								</code>
								<Button
									variant="secondary"
									onClick={ copy }
									__next40pxDefaultSize
								>
									{ __( 'Copy', 'text-to-audio' ) }
								</Button>
							</div>
							<p className="atlasvoice-weak atlasvoice-copyrow-note">
								{ sprintf(
									/* translators: %s: the older shortcode, e.g. [tta_listen_btn]. */
									__(
										'The older %s keeps working. Type straight double quotes (") around a value.',
										'text-to-audio'
									),
									data.legacy_shortcode
								) }
							</p>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Shortcode options', 'text-to-audio' ) }
					description={ __(
						'Each option changes one player only. Without options, the player uses the settings of these screens.',
						'text-to-audio'
					) }
				>
					<Card>
						<div className="atlasvoice-table-wrap">
							<table className="atlasvoice-table">
								<thead>
									<tr>
										<th scope="col">
											{ __( 'Option', 'text-to-audio' ) }
										</th>
										<th scope="col">
											{ __(
												'What it does',
												'text-to-audio'
											) }
										</th>
										<th scope="col">
											{ __( 'Example', 'text-to-audio' ) }
										</th>
									</tr>
								</thead>
								<tbody>
									{ options.map( ( option ) => (
										<tr key={ option.name }>
											<th
												scope="row"
												className="atlasvoice-mono"
											>
												{ option.name }
											</th>
											<td>{ option.description }</td>
											<td className="atlasvoice-mono">
												{ option.example }
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					</Card>
				</Section>

				<Section title={ __( 'Block', 'text-to-audio' ) }>
					<Card>
						<CardBody>
							<p className="atlasvoice-weak">
								{ sprintf(
									/* translators: %s: the name of the block, e.g. AtlasVoice. */
									__(
										'In the block editor, add the “%s” block where the player should appear. It uses the look of these screens, and its colours and width can be changed for one post in the block settings.',
										'text-to-audio'
									),
									data.block
								) }
							</p>
						</CardBody>
					</Card>
				</Section>
			</Scroll>
		</Pane>
	);
}
