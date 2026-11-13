import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createPortal, useEffect, useRef } from '@wordpress/element';

import { AppIcon } from './parts';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The right-side drawer: every details and edit view opens in one (DESIGN.md).
 *
 * It behaves as a dialog: focus moves into it, Tab stays inside it, Esc or a
 * click on the dimmed page closes it, and focus returns to where it was.
 *
 * @param {Object}   props
 * @param {string}   props.title    Heading, also the dialog's name.
 * @param {string}   props.kicker   Small line above the heading.
 * @param {Function} props.onClose  Called when the drawer should close.
 * @param {number}   props.width    Width in pixels. Default 560.
 * @param {*}        props.footer   Footer actions.
 * @param {*}        props.children Body, usually DrawerSection parts.
 * @return {*} The drawer.
 */
export default function Drawer( {
	title,
	kicker,
	onClose,
	width,
	footer,
	children,
} ) {
	const panel = useRef();

	useEffect( () => {
		const doc = panel.current.ownerDocument;
		const opener = doc.activeElement;
		panel.current.focus();

		const onKeyDown = ( event ) => {
			// A confirmation modal on top of the drawer handles its own Esc.
			if (
				event.key === 'Escape' &&
				! doc.querySelector( '.components-modal__screen-overlay' )
			) {
				onClose();
				return;
			}

			if ( event.key !== 'Tab' || ! panel.current ) {
				return;
			}

			const items = panel.current.querySelectorAll( FOCUSABLE );
			if ( ! items.length ) {
				event.preventDefault();
				return;
			}

			const first = items[ 0 ];
			const last = items[ items.length - 1 ];
			const active = doc.activeElement;

			if (
				event.shiftKey &&
				( active === first || active === panel.current )
			) {
				event.preventDefault();
				last.focus();
			} else if ( ! event.shiftKey && active === last ) {
				event.preventDefault();
				first.focus();
			}
		};

		doc.addEventListener( 'keydown', onKeyDown );

		return () => {
			doc.removeEventListener( 'keydown', onKeyDown );
			opener?.focus?.();
		};
		// The drawer is mounted when it opens, so this runs once per opening.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Rendered at the end of <body>, so it covers the rail and the header
	// whatever part of the frame opened it. The wrapper carries the tokens.
	return createPortal(
		<div className="atlasvoice-root atlasvoice-layer">
			{ /* The backdrop is a pointer shortcut; keyboard users have Esc and the Close button. */ }
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
			<div
				className="atlasvoice-drawer-backdrop"
				onClick={ onClose }
				aria-hidden="true"
			/>
			<aside
				className="atlasvoice-drawer"
				role="dialog"
				aria-modal="true"
				aria-label={ title }
				tabIndex={ -1 }
				ref={ panel }
				style={
					width
						? { '--atlasvoice-drawer-w': width + 'px' }
						: undefined
				}
			>
				<div className="atlasvoice-drawer-head">
					<div className="atlasvoice-drawer-title">
						{ kicker && (
							<div className="atlasvoice-drawer-kicker">
								{ kicker }
							</div>
						) }
						<h2>{ title }</h2>
					</div>
					<Button
						icon={ <AppIcon name="close" /> }
						label={ __( 'Close', 'text-to-audio' ) }
						onClick={ onClose }
					/>
				</div>
				<div className="atlasvoice-drawer-body">{ children }</div>
				{ footer && (
					<div className="atlasvoice-footer">{ footer }</div>
				) }
			</aside>
		</div>,
		document.body
	);
}

/**
 * One titled block inside a drawer.
 *
 * @param {Object} props
 * @param {string} props.title    Section heading.
 * @param {*}      props.children Content.
 * @return {*} The section.
 */
export function DrawerSection( { title, children } ) {
	return (
		<div className="atlasvoice-drawer-section">
			{ title && <h3>{ title }</h3> }
			{ children }
		</div>
	);
}
