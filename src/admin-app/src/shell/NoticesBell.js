import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';

import { AppIcon, Count, Empty } from './parts';

const NOTICE_SELECTOR =
	'#wpbody-content > .notice, #wpbody-content > .updated, #wpbody-content > .error, #wpbody-content > .update-nag, .atlasvoice-page > .notice, .atlasvoice-page > .updated, .atlasvoice-page > .error, .atlasvoice-page > .update-nag';

/**
 * Takes the admin notices WordPress printed on this page out of the layout.
 *
 * The real elements are kept, not copied and not hidden, so their own links,
 * dismiss buttons and scripts keep working when they are shown in the bell.
 *
 * @param {Document} doc The document to search.
 * @return {Element[]} The notice elements, removed from the page.
 */
export function collectNotices( doc = document ) {
	const found = Array.from( doc.querySelectorAll( NOTICE_SELECTOR ) ).filter(
		// A notice a plugin marks as hidden is not ours to show.
		( node ) => ! node.classList.contains( 'hidden' )
	);

	found.forEach( ( node ) => node.remove() );

	return found;
}

/**
 * Shows the collected notice elements inside the dropdown while it is open.
 *
 * @param {Object}    props
 * @param {Element[]} props.nodes The notice elements.
 * @return {*} The holder.
 */
function NoticeList( { nodes } ) {
	const holder = useRef();

	useEffect( () => {
		const target = holder.current;
		nodes.forEach( ( node ) => target.appendChild( node ) );

		return () => nodes.forEach( ( node ) => node.remove() );
	}, [ nodes ] );

	return <div ref={ holder } className="atlasvoice-notice-list" />;
}

/**
 * The Notices bell. On AtlasVoice screens every admin notice, ours and other
 * plugins', is moved here with a count: moved, never hidden (DESIGN.md).
 *
 * @return {*} The bell.
 */
export default function NoticesBell() {
	const [ nodes, setNodes ] = useState( [] );

	useEffect( () => {
		// WordPress moves notices under .wp-header-end when the page is ready,
		// which is before this effect runs; collect once after that.
		setNodes( collectNotices() );
	}, [] );

	const label = nodes.length
		? sprintf(
				/* translators: %d: number of notices. */
				_n(
					'Notices: %d',
					'Notices: %d',
					nodes.length,
					'text-to-audio'
				),
				nodes.length
		  )
		: __( 'Notices', 'text-to-audio' );

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-end' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className="atlasvoice-bell"
					icon={ <AppIcon name="bell" /> }
					label={ label }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					showTooltip
				>
					{ nodes.length > 0 && (
						<Count brand>{ nodes.length }</Count>
					) }
				</Button>
			) }
			renderContent={ () => (
				<div className="atlasvoice-root atlasvoice-notices">
					{ nodes.length ? (
						<>
							<NoticeList nodes={ nodes } />
							<p className="atlasvoice-weak atlasvoice-notices-note">
								{ __(
									'On AtlasVoice screens, notices from WordPress and other plugins are moved here, never hidden.',
									'text-to-audio'
								) }
							</p>
						</>
					) : (
						<Empty title={ __( 'No notices', 'text-to-audio' ) }>
							{ __( 'You’re all caught up.', 'text-to-audio' ) }
						</Empty>
					) }
				</div>
			) }
		/>
	);
}
