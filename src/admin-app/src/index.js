import { createRoot } from '@wordpress/element';

import App from './App';
import { publishKit } from './extend/kit';
import './styles/tokens.css';
import './styles/app.css';

// The surface extensions build on. Published before the app renders, so an
// extension that loads later finds it, and one that loaded earlier is picked
// up through the hooks.
publishKit();

const mount = document.getElementById( 'atlasvoice-app' );

if ( mount ) {
	// PHP prints this object before the script (TTA_Admin\Admin_App::boot_data()).
	const boot = window.atlasvoiceBoot || {};

	createRoot( mount ).render( <App boot={ boot } /> );
}
