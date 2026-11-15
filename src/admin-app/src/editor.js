/**
 * The "AtlasVoice" panel of the post editor (TTS-347): where it is put.
 *
 *  - Classic Editor: in the box the site made for it.
 *  - Block editor: in a sidebar of its own, opened from the editor's top bar
 *    and its menu.
 *
 * The block editor's parts are read from the page (window.wp) and not
 * bundled: the sidebar moved from wp.editPost to wp.editor in WordPress 6.6,
 * and the one that is there is used.
 */
import { __ } from '@wordpress/i18n';
import { createRoot, render, useEffect, useState } from '@wordpress/element';

import PostPanel from './editor/PostPanel';
import './styles/editor.css';

const NAME = 'atlasvoice';

/**
 * The panel in the block editor: it reads the post again after each save.
 *
 * @param {Object} props
 * @param {Object} props.boot What the site gave the panel to start with.
 * @param {Object} props.data The page's wp.data.
 * @return {*} The panel.
 */
export function BlockPanel( { boot, data } ) {
	const [ saves, setSaves ] = useState( 0 );

	useEffect( () => {
		if ( ! data || typeof data.subscribe !== 'function' ) {
			return undefined;
		}
		let saving = false;

		return data.subscribe( () => {
			const editor = data.select( 'core/editor' );
			if ( ! editor ) {
				return;
			}
			const now = editor.isSavingPost() && ! editor.isAutosavingPost();
			if ( saving && ! now ) {
				setSaves( ( count ) => count + 1 );
			}
			saving = now;
		} );
	}, [ data ] );

	return <PostPanel boot={ boot } refresh={ saves } />;
}

/**
 * Puts the panel on the page.
 *
 * @param {Object} boot What the site gave the panel to start with.
 * @param {Object} wp   The page's WordPress scripts (window.wp).
 * @return {string} Where it was put: "box", "sidebar" or "".
 */
export function mount( boot, wp ) {
	if ( ! boot || ! boot.postId ) {
		return '';
	}

	const box = document.getElementById( 'atlasvoice-post-panel-root' );
	if ( box ) {
		if ( typeof createRoot === 'function' ) {
			createRoot( box ).render( <PostPanel boot={ boot } /> );
		} else {
			render( <PostPanel boot={ boot } />, box );
		}

		return 'box';
	}

	const parts = [ wp?.editor, wp?.editPost ].find(
		( part ) => part && part.PluginSidebar
	);
	if ( ! parts || ! wp?.plugins?.registerPlugin ) {
		return '';
	}
	const { PluginSidebar, PluginSidebarMoreMenuItem } = parts;

	wp.plugins.registerPlugin( NAME, {
		icon: 'controls-volumeon',
		render: () => (
			<>
				{ PluginSidebarMoreMenuItem && (
					<PluginSidebarMoreMenuItem target={ NAME }>
						{ __( 'AtlasVoice', 'text-to-audio' ) }
					</PluginSidebarMoreMenuItem>
				) }
				<PluginSidebar
					name={ NAME }
					title={ __( 'AtlasVoice', 'text-to-audio' ) }
				>
					<BlockPanel boot={ boot } data={ wp.data } />
				</PluginSidebar>
			</>
		),
	} );

	return 'sidebar';
}

mount( window.atlasvoiceEditorBoot, window.wp );
