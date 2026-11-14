/**
 * Site health › Privacy.
 *
 * What AtlasVoice keeps about visitors, where WordPress' own privacy tools
 * are, and the one choice that can be changed here: sharing anonymous
 * usage data with AtlasAiDev (TTA\Site\Privacy).
 *
 * That choice acts at once, like the notice it comes from: there is
 * nothing else on the screen to save. Nothing is ever sent while it is off.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import { Pane, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/privacy';

/**
 * The screen.
 *
 * @return {*} Site health › Privacy.
 */
export default function SitePrivacy() {
	const { boot, notify } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );
	const [ saving, setSaving ] = useState( false );

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
								'The privacy details could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const sharing = data.usage_sharing || {};
	const records = Number( data.listening_records ) || 0;

	const share = async ( allow ) => {
		setSaving( true );
		try {
			setData(
				await request( boot, ROUTE, {
					method: 'POST',
					data: { usage_sharing: allow },
				} )
			);
			notify(
				allow
					? __(
							'Thank you. Anonymous usage data is shared weekly.',
							'text-to-audio'
					  )
					: __( 'Stopped. Nothing more is sent.', 'text-to-audio' )
			);
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'Not changed: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setSaving( false );
	};

	return (
		<Pane canvas>
			<Scroll width={ 860 }>
				<Section
					title={ __( 'Your privacy policy', 'text-to-audio' ) }
					description={ __(
						'AtlasVoice adds a suggested text to WordPress’ privacy policy guide. Copy what applies to your site into your own policy.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<ul className="atlasvoice-list atlasvoice-list-flush">
								<li>
									{ __(
										'Plays and listening time are counted on your own site, under a browser identifier that is not a name, an email or an IP address.',
										'text-to-audio'
									) }
								</li>
								<li>
									{ __(
										'To make natural-voice audio, the text of a post is sent to the voice service you chose.',
										'text-to-audio'
									) }
								</li>
								<li>
									{ __(
										'Nothing about your visitors is sent to AtlasAiDev.',
										'text-to-audio'
									) }
								</li>
							</ul>
							<div className="atlasvoice-actions">
								<Button
									variant="secondary"
									href={ data.policy_url }
									__next40pxDefaultSize
								>
									{ __(
										'Open the suggested text',
										'text-to-audio'
									) }
								</Button>
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Visitor data', 'text-to-audio' ) }
					description={ sprintf(
						/* translators: %s: a number of records. */
						_n(
							'This site holds %s listening record.',
							'This site holds %s listening records.',
							records,
							'text-to-audio'
						),
						records.toLocaleString()
					) }
				>
					<Card>
						<CardBody>
							<p className="atlasvoice-weak">
								{ __(
									'When a person asks for their data, use WordPress’ own tools. “AtlasVoice Analytics Data” is included in both. Listening records are not tied to an email address, so these tools find none for a person.',
									'text-to-audio'
								) }
							</p>
							<div className="atlasvoice-actions">
								<Button
									variant="secondary"
									href={ data.export_url }
									__next40pxDefaultSize
								>
									{ __(
										'Export personal data',
										'text-to-audio'
									) }
								</Button>
								<Button
									variant="secondary"
									href={ data.erase_url }
									__next40pxDefaultSize
								>
									{ __(
										'Erase personal data',
										'text-to-audio'
									) }
								</Button>
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __(
						'What is shared with AtlasAiDev',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							{ sharing.managed_here ? (
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __(
										'Share anonymous usage data with AtlasAiDev',
										'text-to-audio'
									) }
									help={ __(
										'Which AtlasVoice settings are in use, and the PHP and WordPress versions, once a week. No post content and no visitor data. It helps us decide what to build. Off: nothing is sent.',
										'text-to-audio'
									) }
									checked={ !! sharing.allowed }
									disabled={ saving }
									onChange={ share }
								/>
							) : (
								<p className="atlasvoice-weak">
									{ __(
										'AtlasVoice Pro is active, and it manages the choice about sharing anonymous usage data. The free plugin sends nothing.',
										'text-to-audio'
									) }
								</p>
							) }
						</CardBody>
					</Card>
				</Section>
			</Scroll>
		</Pane>
	);
}
