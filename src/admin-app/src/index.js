import { createRoot } from '@wordpress/element';

import App from './App';
import './styles/tokens.css';
import './styles/app.css';

const mount = document.getElementById( 'atlasvoice-app' );

if ( mount ) {
	// PHP prints this object before the script (TTA_Admin\Admin_App::boot_data()).
	const boot = window.atlasvoiceBoot || {};

	createRoot( mount ).render( <App boot={ boot } /> );
}
