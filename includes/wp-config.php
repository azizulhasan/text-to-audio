<?php

define( 'WP_CACHE', true ); // Added by WP Rocket



/**

 * The base configuration for WordPress

 *

 * The wp-config.php creation script uses this file during the installation.

 * You don't have to use the website, you can copy this file to "wp-config.php"

 * and fill in the values.

 *

 * This file contains the following configurations:

 *

 * * Database settings

 * * Secret keys

 * * Database table prefix

 * * ABSPATH

 *

 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/

 *

 * @package WordPress

 */



// ** Database settings - You can get this info from your web host ** //

/** The name of the database for WordPress */

define( 'DB_NAME', 'eccleriastaging' );



/** Database username */

define( 'DB_USER', 'adminstaging' );



/** Database password */

define( 'DB_PASSWORD', '45JKef2rJKHbrh5589' );



/** Database hostname */

define( 'DB_HOST', 'sj667040-002.eu.clouddb.ovh.net:35630' );



/** Database charset to use in creating database tables. */

define( 'DB_CHARSET', 'utf8' );



/** The database collate type. Don't change this if in doubt. */

define( 'DB_COLLATE', '' );



/**#@+

 * Authentication unique keys and salts.

 *

 * Change these to different unique phrases! You can generate these using

 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.

 *

 * You can change these at any point in time to invalidate all existing cookies.

 * This will force all users to have to log in again.

 *

 * @since 2.6.0

 */

define( 'AUTH_KEY',         'EzhB7ONzeHkZ9GCfTE7SB+HjReBoFY+O92IVCx/CZAo2faj1E2CPrLJN01ZF' );

define( 'SECURE_AUTH_KEY',  'j5hV8XW7cLHsd6g8Ux4WkCyaxPHN7XVfg2A9SmlLCBWtjCoY1A/LuIbbsh4h' );

define( 'LOGGED_IN_KEY',    'wtCiFr0KPmQSFJj4AL34TfdSpRvwhewRhc+IVdUYNF/fCWWZNr5eMDdGQQIk' );

define( 'NONCE_KEY',        'kT8hkWQYvrCXA/3k9jpDU4wrPO8x+7bZNPqlx2vyB9i2M/aizGV0VhE6lE7L' );

define( 'AUTH_SALT',        'qdZQDVaA5tHzW3/irx8QndYbllDvSC50AFL4VeG2k15MdHtjCNIMn01O5jiu' );

define( 'SECURE_AUTH_SALT', 'ZWSkNejdfZjP7WWY6m5QErGfaaszP+5Xevj9elwd5wofAdlXvgFgjW6DfGZS' );

define( 'LOGGED_IN_SALT',   '3Zmck4l37jkunOqFe7vF4mFsZf1zWfEtjeSgvZ/ZCej4NX1hp3xD73dD7/f2' );

define( 'NONCE_SALT',       '+4P+MVltNtJraKOjENbm/By3Uwamjmh9eipUx4+YiwDxw3QSCe/7KH1bXu9X' );



/**#@-*/



/**

 * WordPress database table prefix.

 *

 * You can have multiple installations in one database if you give each

 * a unique prefix. Only numbers, letters, and underscores please!

 *

 * At the installation time, database tables are created with the specified prefix.

 * Changing this value after WordPress is installed will make your site think

 * it has not been installed.

 *

 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix

 */

$table_prefix = 'wor6391_';



/**

 * For developers: WordPress debugging mode.

 *

 * Change this to true to enable the display of notices during development.

 * It is strongly recommended that plugin and theme developers use WP_DEBUG

 * in their development environments.

 *

 * For information on other constants that can be used for debugging,

 * visit the documentation.

 *

 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/

 */

define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );



/* Add any custom values between this line and the "stop editing" line. */







/* That's all, stop editing! Happy publishing. */



/** Absolute path to the WordPress directory. */

if ( ! defined( 'ABSPATH' ) ) {

	define( 'ABSPATH', __DIR__ . '/' );

}



/** Sets up WordPress vars and included files. */

require_once ABSPATH . 'wp-settings.php';

