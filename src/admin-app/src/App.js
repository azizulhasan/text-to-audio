import { __ } from '@wordpress/i18n';
import { Button, Modal, SnackbarList, Spinner } from '@wordpress/components';
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

import { AppContext } from './app-context';
import { getScreen, getTabs, resolveRoute, toHash } from './routes';
import Placeholder from './screens/Placeholder';
import { getScreenComponent } from './screens/registry';
import Header from './shell/Header';
import Rail from './shell/Rail';
import ScreenTabs from './shell/ScreenTabs';
import StatusBar, { MODE_LIVE, MODE_STAGING } from './shell/StatusBar';
import Welcome from './shell/Welcome';
import { BrandTheme } from './theme';

let nextSnackId = 1;

/**
 * The app root: the desktop-app frame, the route, and the few things every
 * screen shares (confirmations, snackbars, the unsaved-changes guard).
 *
 * @param {Object} props
 * @param {Object} props.boot Data printed by PHP (TTA_Admin\Admin_App::boot_data()).
 * @return {*} The app.
 */
export default function App( { boot } ) {
	const isPro = !! boot.isPro;
	const [ route, setRoute ] = useState( () =>
		resolveRoute( window.location.hash, isPro )
	);
	const [ mode, setMode ] = useState(
		boot.mode === MODE_LIVE ? MODE_LIVE : MODE_STAGING
	);
	// Starts as the site says and changes when the setup is finished here.
	const [ setupFinished, setSetupFinished ] = useState(
		!! boot.setupFinished
	);
	const [ railOpen, setRailOpen ] = useState( false );
	const [ dialog, setDialog ] = useState( null );
	const [ snacks, setSnacks ] = useState( [] );
	const [ refused, setRefused ] = useState( 0 );

	// A ref, because the hashchange and beforeunload listeners must read the
	// current value without being re-attached on every keystroke.
	const dirty = useRef( false );
	const routeId = useRef( route.id );
	routeId.current = route.id;

	const setDirty = useCallback( ( value ) => {
		dirty.current = !! value;
	}, [] );

	const notify = useCallback( ( message, status = 'success' ) => {
		const id = nextSnackId++;
		setSnacks( ( list ) => [
			...list,
			{
				id,
				content: message,
				status,
				explicitDismiss: status === 'error',
			},
		] );
	}, [] );

	const confirm = useCallback( ( options ) => setDialog( options ), [] );

	/** Opens a route, asking first when the form on screen has unsaved changes. */
	const go = useCallback(
		( id ) => {
			const target = resolveRoute( toHash( id ), isPro );
			if ( target.id === routeId.current ) {
				return;
			}

			const move = () => {
				dirty.current = false;
				window.location.hash = toHash( target.id );
			};

			if ( ! dirty.current ) {
				move();
				return;
			}

			setRefused( ( count ) => count + 1 );
			setDialog( {
				title: __( 'Leave without saving?', 'text-to-audio' ),
				body: __(
					'You changed settings here and have not saved them yet.',
					'text-to-audio'
				),
				cancel: __( 'Keep editing', 'text-to-audio' ),
				ok: __( 'Leave without saving', 'text-to-audio' ),
				destructive: true,
				onOk: move,
			} );
		},
		[ isPro ]
	);

	useEffect( () => {
		const onHashChange = () => {
			const target = resolveRoute( window.location.hash, isPro );

			// Back button or a typed address while a form is unsaved: put the
			// address back and ask, exactly as a click in the app does.
			if ( dirty.current && target.id !== routeId.current ) {
				window.history.replaceState(
					null,
					'',
					toHash( routeId.current )
				);
				go( target.id );
				return;
			}

			setRoute( target );
		};

		const onBeforeUnload = ( event ) => {
			if ( dirty.current ) {
				event.preventDefault();
				event.returnValue = '';
			}
		};

		window.addEventListener( 'hashchange', onHashChange );
		window.addEventListener( 'beforeunload', onBeforeUnload );

		return () => {
			window.removeEventListener( 'hashchange', onHashChange );
			window.removeEventListener( 'beforeunload', onBeforeUnload );
		};
	}, [ go, isPro ] );

	// An old or short address is rewritten to the real one, so what is in the
	// address bar is always what a bookmark should keep.
	useEffect( () => {
		if ( window.location.hash !== toHash( route.id ) ) {
			window.history.replaceState( null, '', toHash( route.id ) );
		}
	}, [ route.id ] );

	const context = useMemo(
		() => ( {
			boot,
			isPro,
			route,
			go,
			notify,
			confirm,
			setDirty,
			mode,
			setMode,
			setupFinished,
			setSetupFinished,
		} ),
		[
			boot,
			isPro,
			route,
			go,
			notify,
			confirm,
			setDirty,
			mode,
			setupFinished,
		]
	);

	const tabs = getTabs( getScreen( route.screen ), isPro );
	// A route without a rebuilt screen shows the placeholder.
	const Screen = getScreenComponent( route.id ) || Placeholder;
	const closeDialog = () => setDialog( null );

	return (
		<BrandTheme>
			<AppContext.Provider value={ context }>
				<div className="atlasvoice-root atlasvoice-shell is-compact-rail">
					<Rail
						open={ railOpen }
						onClose={ () => setRailOpen( false ) }
					/>
					<Header onMenu={ () => setRailOpen( true ) } />
					<main className="atlasvoice-work">
						<div className="atlasvoice-screen">
							{ tabs.length > 0 && (
								<ScreenTabs tabs={ tabs } attempt={ refused } />
							) }
							<Suspense
								fallback={
									<div
										className="atlasvoice-loading"
										role="status"
									>
										<Spinner />
										{ __( 'Loading…', 'text-to-audio' ) }
									</div>
								}
							>
								<Screen key={ route.id } />
							</Suspense>
						</div>
					</main>
					<StatusBar />
					<Welcome />
					<SnackbarList
						className="atlasvoice-snackbars"
						notices={ snacks }
						onRemove={ ( id ) =>
							setSnacks( ( list ) =>
								list.filter( ( snack ) => snack.id !== id )
							)
						}
					/>
					{ dialog && (
						<Modal
							title={ dialog.title }
							onRequestClose={ closeDialog }
							size="medium"
						>
							<p>{ dialog.body }</p>
							<div className="atlasvoice-root atlasvoice-modal-foot">
								<Button
									variant="tertiary"
									onClick={ closeDialog }
									__next40pxDefaultSize
								>
									{ dialog.cancel ||
										__( 'Cancel', 'text-to-audio' ) }
								</Button>
								<Button
									variant="primary"
									isDestructive={ !! dialog.destructive }
									onClick={ () => {
										closeDialog();
										dialog.onOk();
									} }
									__next40pxDefaultSize
								>
									{ dialog.ok }
								</Button>
							</div>
						</Modal>
					) }
				</div>
			</AppContext.Provider>
		</BrandTheme>
	);
}
