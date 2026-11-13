import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

import { useApp } from '../app-context';
import Drawer, { DrawerSection } from '../shell/Drawer';
import { AppIcon } from '../shell/parts';
import { helpFor, safeLink } from './topics';

/**
 * "How to" for the place the user is on: steps in the plugin, the guide and
 * the video. Guides and videos open in a new tab and are never embedded, so
 * nothing is loaded from another site until the user clicks.
 *
 * @param {Object}   props
 * @param {string}   props.route   Route id, optionally with "#section".
 * @param {Function} props.onClose Called to close the drawer.
 * @return {*} The drawer, or nothing when the site has no topics.
 */
export function HelpDrawer( { route, onClose } ) {
	const { boot, go } = useApp();
	const topic = helpFor( boot.helpTopics, route );

	if ( ! topic ) {
		return null;
	}

	// A topic without a guide still gets a working link: the docs home.
	const guideUrl = safeLink( topic.docUrl ) || safeLink( boot.docsUrl );
	const videoUrl = safeLink( topic.videoUrl );
	const supportUrl = safeLink( boot.supportUrl );
	const steps = Array.isArray( topic.steps ) ? topic.steps : [];

	return (
		<Drawer
			title={ topic.title }
			kicker={ __( 'How to', 'text-to-audio' ) }
			onClose={ onClose }
			width={ 420 }
			footer={
				<>
					<Button
						variant="tertiary"
						onClick={ () => {
							onClose();
							go( 'help:docs' );
						} }
					>
						{ __( 'All guides', 'text-to-audio' ) }
					</Button>
					{ supportUrl && (
						<Button
							variant="secondary"
							href={ supportUrl }
							target="_blank"
							rel="noreferrer"
							icon={ <AppIcon name="external" /> }
						>
							{ __( 'Contact support', 'text-to-audio' ) }
						</Button>
					) }
				</>
			}
		>
			{ steps.length > 0 && (
				<DrawerSection
					title={ sprintf(
						/* translators: %d: number of steps. */
						__( 'Do it in %d steps', 'text-to-audio' ),
						steps.length
					) }
				>
					<ol className="atlasvoice-help-steps">
						{ steps.map( ( step ) => (
							<li key={ step }>{ step }</li>
						) ) }
					</ol>
				</DrawerSection>
			) }
			<DrawerSection title={ __( 'Need more?', 'text-to-audio' ) }>
				<div className="atlasvoice-help-links">
					{ guideUrl && (
						<a
							className="atlasvoice-help-link"
							href={ guideUrl }
							target="_blank"
							rel="noreferrer"
						>
							<AppIcon name="page" />
							<span>
								<b>
									{ __( 'Read the guide', 'text-to-audio' ) }
								</b>
								<small>
									{ __(
										'Every step with pictures. Opens atlasaidev.com in a new tab.',
										'text-to-audio'
									) }
								</small>
							</span>
							<AppIcon name="external" size={ 16 } />
						</a>
					) }
					{ videoUrl && (
						<a
							className="atlasvoice-help-link"
							href={ videoUrl }
							target="_blank"
							rel="noreferrer"
						>
							<span
								className="atlasvoice-help-play"
								aria-hidden="true"
							>
								▶
							</span>
							<span>
								<b>
									{ sprintf(
										/* translators: %s: length of the video, e.g. 2:00. */
										__(
											'Watch the video · %s',
											'text-to-audio'
										),
										topic.videoLength
									) }
								</b>
								<small>
									{ __(
										'The same steps on screen. Opens YouTube in a new tab.',
										'text-to-audio'
									) }
								</small>
							</span>
							<AppIcon name="external" size={ 16 } />
						</a>
					) }
				</div>
			</DrawerSection>
		</Drawer>
	);
}

/**
 * The "How to" button in the header of every screen.
 *
 * @return {*} The button and, when open, its drawer.
 */
export function HelpButton() {
	const { route } = useApp();
	const [ open, setOpen ] = useState( false );

	return (
		<>
			<Button
				variant="tertiary"
				className="atlasvoice-howto"
				aria-haspopup="dialog"
				onClick={ () => setOpen( true ) }
			>
				{ __( 'How to', 'text-to-audio' ) }
			</Button>
			{ open && (
				<HelpDrawer
					route={ route.id }
					onClose={ () => setOpen( false ) }
				/>
			) }
		</>
	);
}
