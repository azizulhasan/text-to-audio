<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-320: going back to an earlier version when an update breaks something.
 *
 * Permanent from the release that introduced it: never remove it. Free rolls
 * back only itself (WordPress.org); Pro registers its own source through the
 * `atlasvoice_rollback_sources` filter and rolls itself back through its own
 * route, using run_step() so both follow the same rules.
 *
 * Every version is checked for this site before it can be picked (the other
 * AtlasVoice plugin, PHP, known security problems, what stops working) and
 * checked again here before any file is replaced.
 */
class TTA_Rollback {

	/** The release that introduced this screen; older ones have no way back but Updates. */
	const INTRODUCED_IN = '2.3.17';

	const HISTORY_OPTION = 'tta_version_history';

	const LOCK = 'tta_rollback_lock';

	/** How many older versions the screen offers. */
	const SHOW = 5;

	// ------------------------------------------------------------ availability

	/**
	 * Can the current user roll back plugins on this site at all?
	 *
	 * @return bool
	 */
	public static function is_available() {
		return current_user_can( 'update_plugins' ) && wp_is_file_mod_allowed( 'atlasvoice_rollback' );
	}

	/**
	 * Is this plugin's folder a Git/SVN/Mercurial checkout? Replacing it would
	 * delete the repository, so rolling back is refused (WordPress's own
	 * auto-updater skips such folders for the same reason).
	 *
	 * @param string $plugin_file Plugin basename.
	 * @return bool
	 */
	public static function is_vcs_checkout( $plugin_file ) {
		$dir = trailingslashit( WP_PLUGIN_DIR ) . dirname( $plugin_file );
		foreach ( array( '.git', '.svn', '.hg', '.bzr' ) as $vcs ) {
			if ( file_exists( $dir . '/' . $vcs ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @return string The Versions screen.
	 */
	public static function screen_url() {
		return self_admin_url( 'admin.php?page=text-to-audio#/versions' );
	}

	/**
	 * @param string $version
	 * @return bool A plain x.y.z version.
	 */
	public static function is_version( $version ) {
		return is_string( $version ) && (bool) preg_match( '/^\d+\.\d+\.\d+$/', $version );
	}

	/**
	 * @return TTA_Rollback_Source[] Keyed by id ('free', 'pro').
	 */
	public static function sources() {
		$sources = array( 'free' => new TTA_Rollback_Source_WordPress_Org() );

		/**
		 * Other plugins that can be rolled back together with AtlasVoice.
		 *
		 * @param TTA_Rollback_Source[] $sources
		 */
		foreach ( (array) apply_filters( 'atlasvoice_rollback_sources', array() ) as $source ) {
			if ( $source instanceof TTA_Rollback_Source && 'free' !== $source->id() ) {
				$sources[ $source->id() ] = $source;
			}
		}

		return $sources;
	}

	// --------------------------------------------------------- version history

	/**
	 * @return array{current:string, previous:string, updated_at:int}
	 */
	public static function version_history() {
		$history = get_option( self::HISTORY_OPTION, array() );

		return wp_parse_args( is_array( $history ) ? $history : array(), array(
			'current'    => '',
			'previous'   => '',
			'updated_at' => 0,
		) );
	}

	/**
	 * Record the version change once, on the first admin page after it (this
	 * also catches manual and FTP updates, which skip the upgrader hooks).
	 */
	public static function note_version() {
		$history = self::version_history();
		if ( TEXT_TO_AUDIO_VERSION === $history['current'] ) {
			return;
		}

		update_option( self::HISTORY_OPTION, array(
			'current'    => TEXT_TO_AUDIO_VERSION,
			// Empty on a fresh install: there was nothing to update from.
			'previous'   => $history['current'],
			'updated_at' => time(),
		), false );
	}

	// -------------------------------------------------------------------- plan

	/**
	 * Everything the Versions screen shows: installed versions, and per mode
	 * ('free' alone; with Pro also 'both' and 'pro') the older versions with
	 * whether each is safe for this site.
	 *
	 * @return array
	 */
	public static function plan() {
		$sources  = self::sources();
		$free     = $sources['free'];
		$pro      = isset( $sources['pro'] ) ? $sources['pro'] : null;
		$errors   = array();
		$versions = array();

		foreach ( $sources as $id => $source ) {
			$list = $source->available_versions();
			if ( is_wp_error( $list ) ) {
				$errors[ $id ] = $list->get_error_message();
				$list          = array();
			}
			$versions[ $id ] = array_slice( $list, 0, self::SHOW );
		}

		$modes = array();
		if ( $pro ) {
			$modes['both'] = self::rows( 'both', $versions['free'], $sources, $versions );
			$modes['pro']  = self::rows( 'pro', $versions['pro'], $sources, $versions );
		}
		$modes['free'] = self::rows( 'free', $versions['free'], $sources, $versions );

		return array(
			'installed' => array_map( static function ( $source ) {
				return array(
					'label'   => $source->label(),
					'version' => $source->installed_version(),
					'autoUpdate' => self::auto_update_on( $source->plugin_file() ),
				);
			}, $sources ),
			'site'      => array(
				'php'       => self::php_version(),
				'wordpress' => get_bloginfo( 'version' ),
				'multisite' => is_multisite(),
			),
			'modes'     => $modes,
			'errors'    => $errors,
			// Plugins whose folder is a Git/SVN checkout: rolling back is refused.
			'vcs'       => array_keys( array_filter( $sources, static function ( $source ) {
				return self::is_vcs_checkout( $source->plugin_file() );
			} ) ),
			'routes'    => array_map( static function ( $source ) {
				return $source->rest_route();
			}, $sources ),
		);
	}

	/**
	 * @param string   $mode
	 * @param string[] $list     Versions of the plugin this mode lists.
	 * @param array    $sources
	 * @param array    $versions All available versions per source.
	 * @return array[]
	 */
	private static function rows( $mode, array $list, array $sources, array $versions ) {
		$rows = array();
		foreach ( $list as $version ) {
			$target = self::target( $mode, $version, $sources );
			$check  = self::evaluate( $mode, $target, $sources, $versions );

			$rows[] = array_merge( $check, array(
				'version' => $version,
				'target'  => $target,
				'label'   => self::target_label( $mode, $target, $sources ),
			) );
		}

		// The newest version that is not blocked is the one to suggest.
		foreach ( $rows as $i => $row ) {
			if ( 'blocked' !== $row['status'] ) {
				$rows[ $i ]['recommended'] = true;
				break;
			}
		}

		return $rows;
	}

	/**
	 * The versions a row leaves installed.
	 *
	 * @return array{free:string, pro:string}
	 */
	private static function target( $mode, $version, array $sources ) {
		$free_now = $sources['free']->installed_version();
		$pro_now  = isset( $sources['pro'] ) ? $sources['pro']->installed_version() : '';

		if ( 'pro' === $mode ) {
			return array( 'free' => $free_now, 'pro' => $version );
		}
		if ( 'both' === $mode ) {
			return array( 'free' => $version, 'pro' => $sources['free']->partner_of( $version ) );
		}

		return array( 'free' => $version, 'pro' => $pro_now );
	}

	/**
	 * @return string
	 */
	private static function target_label( $mode, array $target, array $sources ) {
		if ( 'pro' === $mode ) {
			/* translators: %s: version number. */
			return sprintf( __( 'Pro %s', 'text-to-audio' ), $target['pro'] );
		}
		if ( 'both' === $mode ) {
			/* translators: 1: AtlasVoice version, 2: AtlasVoice Pro version. */
			return sprintf( __( 'AtlasVoice %1$s + Pro %2$s', 'text-to-audio' ), $target['free'], $target['pro'] ? $target['pro'] : '?' );
		}

		/* translators: %s: version number. */
		return sprintf( __( 'AtlasVoice %s', 'text-to-audio' ), $target['free'] );
	}

	/**
	 * Is it safe for this site to end up on $target?
	 *
	 * @param string $mode     'free', 'pro' or 'both'.
	 * @param array  $target   {free, pro}
	 * @param array  $sources
	 * @param array  $versions Available versions per source.
	 * @return array{status:string, blocks:array, changes:string[], notes:string[]}
	 */
	private static function evaluate( $mode, array $target, array $sources, array $versions ) {
		$free    = $sources['free'];
		$pro     = isset( $sources['pro'] ) ? $sources['pro'] : null;
		$blocks  = array();
		$changes = array();
		$notes   = array();

		$free_changes = $target['free'] !== $free->installed_version();
		$pro_changes  = $pro && $target['pro'] && $target['pro'] !== $pro->installed_version();

		// A fix must always lead somewhere that passes every check: the nearest
		// pair released together that is clean, or the next newer clean version.
		$pair_fix = function () use ( $target, $sources, $versions ) {
			$list = isset( $versions['free'] ) ? $versions['free'] : array();
			$from = array_search( $target['free'], $list, true );
			$from = false === $from ? count( $list ) - 1 : $from;
			for ( $i = $from; $i >= 0; $i-- ) {
				$pair = self::target( 'both', $list[ $i ], $sources );
				if ( self::is_clean( $pair, $sources, $versions ) ) {
					return array(
						'mode'    => 'both',
						'version' => $list[ $i ],
						/* translators: 1: AtlasVoice version, 2: AtlasVoice Pro version. */
						'label'   => sprintf( __( 'Roll back both to AtlasVoice %1$s + Pro %2$s', 'text-to-audio' ), $pair['free'], $pair['pro'] ),
					);
				}
			}
			return null;
		};
		$newer_fix = function () use ( $mode, $target, $sources, $versions ) {
			$key  = 'pro' === $mode ? 'pro' : 'free';
			$list = isset( $versions[ $key ] ) ? $versions[ $key ] : array();
			$from = array_search( $target[ $key ], $list, true );
			for ( $i = ( false === $from ? 0 : $from ) - 1; $i >= 0; $i-- ) {
				$candidate = self::target( $mode, $list[ $i ], $sources );
				if ( self::is_clean( $candidate, $sources, $versions ) ) {
					return array(
						'mode'    => $mode,
						'version' => $list[ $i ],
						/* translators: %s: plugin and version, e.g. "AtlasVoice 2.3.16". */
						'label'   => sprintf( __( 'Choose %s instead', 'text-to-audio' ), self::target_label( $mode, $candidate, $sources ) ),
					);
				}
			}
			return null;
		};

		foreach ( array( 'free' => $free_changes, 'pro' => $pro_changes ) as $id => $changing ) {
			if ( ! $changing ) {
				continue;
			}
			$can = $sources[ $id ]->can_download();
			if ( true !== $can ) {
				$blocks[] = array( 'text' => (string) $can, 'fix' => null );
			}
		}

		if ( 'both' === $mode && $pro && ! $target['pro'] ) {
			$blocks[] = array(
				'text' => __( 'The Pro version released with this one is not known, so the pair cannot be rolled back together.', 'text-to-audio' ),
				'fix'  => null,
			);
		} elseif ( 'both' === $mode && $pro && $pro_changes && ! in_array( $target['pro'], isset( $versions['pro'] ) ? $versions['pro'] : array(), true ) ) {
			$blocks[] = array(
				/* translators: %s: AtlasVoice Pro version. */
				'text' => sprintf( __( 'Pro %s is not available for download.', 'text-to-audio' ), $target['pro'] ),
				'fix'  => null,
			);
		}

		if ( $pro && $target['pro'] ) {
			$need_pro = $free->min_partner( $target['free'] );
			if ( '' !== $need_pro && version_compare( $target['pro'], $need_pro, '<' ) ) {
				$blocks[] = array(
					/* translators: 1: AtlasVoice version, 2: lowest Pro version it needs, 3: Pro version that would be installed. */
					'text' => sprintf( __( 'AtlasVoice %1$s needs Pro %2$s or later, and Pro %3$s would be installed.', 'text-to-audio' ), $target['free'], $need_pro, $target['pro'] ),
					'fix'  => 'pro' === $mode ? $pair_fix() : null,
				);
			}

			$need_free = $pro->min_partner( $target['pro'] );
			if ( '' !== $need_free && version_compare( $target['free'], $need_free, '<' ) ) {
				$blocks[] = array(
					/* translators: 1: Pro version, 2: lowest AtlasVoice version it needs, 3: AtlasVoice version that would be installed. */
					'text' => sprintf( __( 'Pro %1$s needs AtlasVoice %2$s or later, and AtlasVoice %3$s would be installed. Pro would stop working.', 'text-to-audio' ), $target['pro'], $need_free, $target['free'] ),
					'fix'  => 'free' === $mode ? $pair_fix() : null,
				);
			}

			// Pro goes first, so for a moment the installed AtlasVoice runs with the older Pro.
			if ( 'both' === $mode && $pro_changes && $free_changes ) {
				$need_now = $free->min_partner( $free->installed_version() );
				if ( '' !== $need_now && version_compare( $target['pro'], $need_now, '<' ) ) {
					$blocks[] = array(
						/* translators: 1: installed AtlasVoice version, 2: Pro version. */
						'text' => sprintf( __( 'AtlasVoice %1$s cannot run with Pro %2$s even for the moment between the two steps.', 'text-to-audio' ), $free->installed_version(), $target['pro'] ),
						'fix'  => null,
					);
				}
			}
		}

		$pair_broken = (bool) $blocks;
		foreach ( array( 'free' => $free_changes, 'pro' => $pro_changes ) as $id => $changing ) {
			if ( ! $changing ) {
				continue;
			}
			$version = $target[ $id ];
			$facts   = $sources[ $id ]->release_facts( $version );
			$name    = $sources[ $id ]->label();

			if ( '' !== $facts['security_fixed_in'] ) {
				$blocks[] = array(
					/* translators: 1: plugin name, 2: version, 3: version that fixed it. */
					'text' => sprintf( __( '%1$s %2$s has a security problem that was fixed in %3$s.', 'text-to-audio' ), $name, $version, $facts['security_fixed_in'] ),
					'fix'  => $pair_broken ? null : $newer_fix(),
				);
			}
			if ( '' !== $facts['php_max'] && version_compare( self::php_version(), $facts['php_max'], '>' ) ) {
				$blocks[] = array(
					/* translators: 1: plugin name, 2: version, 3: highest PHP version it was tested on, 4: this site's PHP version. */
					'text' => sprintf( __( '%1$s %2$s was tested up to PHP %3$s; this site runs PHP %4$s. It could stop the site loading.', 'text-to-audio' ), $name, $version, $facts['php_max'], self::php_version() ),
					'fix'  => $pair_broken ? null : $newer_fix(),
				);
			}

			$changes = array_merge( $changes, $sources[ $id ]->changes( $version ) );
		}

		if ( is_multisite() ) {
			$changes[] = __( 'This is a network: the rollback changes AtlasVoice on every site in it.', 'text-to-audio' );
		}
		if ( version_compare( get_bloginfo( 'version' ), '6.3', '<' ) ) {
			$changes[] = __( 'This WordPress version cannot restore the plugin by itself if the rollback fails. Make a backup first.', 'text-to-audio' );
		}

		if ( $free_changes && version_compare( $target['free'], self::INTRODUCED_IN, '<' ) ) {
			/* translators: %s: AtlasVoice version. */
			$notes[] = sprintf( __( 'AtlasVoice %s has no Versions screen. To come back later, use Dashboard › Updates.', 'text-to-audio' ), $target['free'] );
		}
		$notes[] = __( 'Settings, audio files and analytics are kept. Settings added by newer versions are ignored and come back when you update.', 'text-to-audio' );
		$notes[] = __( 'If you use a caching plugin, clear its cache afterwards so visitors get the matching player files.', 'text-to-audio' );

		return array(
			'status'  => $blocks ? 'blocked' : ( $changes ? 'changes' : 'safe' ),
			'blocks'  => $blocks,
			'changes' => array_values( array_unique( $changes ) ),
			'notes'   => $notes,
		);
	}

	/**
	 * Does a target pass every check that cannot be confirmed away?
	 */
	private static function is_clean( array $target, array $sources, array $versions ) {
		$free = $sources['free'];
		$pro  = isset( $sources['pro'] ) ? $sources['pro'] : null;

		foreach ( array( 'free' => $free, 'pro' => $pro ) as $id => $source ) {
			if ( ! $source || ! $target[ $id ] || $target[ $id ] === $source->installed_version() ) {
				continue;
			}
			if ( true !== $source->can_download() || ! in_array( $target[ $id ], isset( $versions[ $id ] ) ? $versions[ $id ] : array(), true ) ) {
				return false;
			}
			$facts = $source->release_facts( $target[ $id ] );
			if ( '' !== $facts['security_fixed_in'] || ( '' !== $facts['php_max'] && version_compare( self::php_version(), $facts['php_max'], '>' ) ) ) {
				return false;
			}
		}

		if ( $pro && $target['pro'] ) {
			$need_pro  = $free->min_partner( $target['free'] );
			$need_free = $pro->min_partner( $target['pro'] );
			if ( ( '' !== $need_pro && version_compare( $target['pro'], $need_pro, '<' ) ) || ( '' !== $need_free && version_compare( $target['free'], $need_free, '<' ) ) ) {
				return false;
			}
		}

		return true;
	}

	// --------------------------------------------------------------------- run

	/**
	 * Roll one plugin back, after checking again that the result is safe for
	 * this site. Pro calls this from its own route for its own source.
	 *
	 * @param string $source_id   'free' or 'pro'.
	 * @param string $version
	 * @param bool   $confirmed   The owner accepted the listed changes.
	 * @param bool   $pause_auto  Stop WordPress re-installing the newer version.
	 * @return true|\WP_Error
	 */
	public static function run_step( $source_id, $version, $confirmed, $pause_auto ) {
		if ( ! self::is_available() ) {
			return new \WP_Error( 'rollback_forbidden', __( 'You cannot change plugins on this site.', 'text-to-audio' ), array( 'status' => 403 ) );
		}

		$sources = self::sources();
		if ( ! isset( $sources[ $source_id ] ) || ! self::is_version( $version ) ) {
			return new \WP_Error( 'unknown_version', __( 'That version is not available.', 'text-to-audio' ), array( 'status' => 400 ) );
		}

		$source = $sources[ $source_id ];
		if ( self::is_vcs_checkout( $source->plugin_file() ) ) {
			return new \WP_Error( 'rollback_vcs', __( 'This plugin folder is a version-control checkout (Git or SVN). Rolling back would delete it, so update it with your version control instead.', 'text-to-audio' ), array( 'status' => 409 ) );
		}

		$available = $source->available_versions();
		if ( is_wp_error( $available ) || ! in_array( $version, $available, true ) ) {
			return new \WP_Error( 'unknown_version', __( 'That version is not available.', 'text-to-audio' ), array( 'status' => 400 ) );
		}

		// The same rules the screen showed, for this single step: the other
		// plugin stays at whatever is installed right now.
		$versions = array();
		foreach ( $sources as $id => $s ) {
			$list            = $s->available_versions();
			$versions[ $id ] = is_wp_error( $list ) ? array() : $list;
		}
		$mode   = 'free' === $source_id ? 'free' : 'pro';
		$check  = self::evaluate( $mode, self::target( $mode, $version, $sources ), $sources, $versions );
		if ( 'blocked' === $check['status'] ) {
			return new \WP_Error( 'rollback_blocked', $check['blocks'][0]['text'], array( 'status' => 409 ) );
		}
		if ( $check['changes'] && ! $confirmed ) {
			return new \WP_Error( 'rollback_unconfirmed', __( 'Confirm what will change before rolling back.', 'text-to-audio' ), array( 'status' => 409 ) );
		}

		// One rollback at a time: a second click must not start a second swap.
		if ( get_transient( self::LOCK ) ) {
			return new \WP_Error( 'rollback_running', __( 'A rollback is already running. Wait a minute and reload this page.', 'text-to-audio' ), array( 'status' => 409 ) );
		}
		set_transient( self::LOCK, time(), 10 * MINUTE_IN_SECONDS );

		$result = $source->install( $version );

		delete_transient( self::LOCK );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( $pause_auto ) {
			self::set_auto_update( $source->plugin_file(), false );
		}

		return true;
	}

	/**
	 * Download and swap one plugin's files, as WordPress's own bulk updater
	 * does: the plugin stays active, the site is in maintenance mode for the
	 * few seconds of the swap, and on WordPress 6.3+ the current version is
	 * restored automatically if anything fails.
	 *
	 * @param string $plugin_file Plugin basename (never taken from a request).
	 * @param array  $package     {url, sha256?}
	 * @return true|\WP_Error
	 */
	public static function install_package( $plugin_file, array $package ) {
		$url  = isset( $package['url'] ) ? (string) $package['url'] : '';
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );

		/**
		 * Hosts rollback packages may come from.
		 *
		 * @param string[] $hosts
		 */
		$hosts = (array) apply_filters( 'atlasvoice_rollback_hosts', array( 'downloads.wordpress.org' ) );
		if ( 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) || ! in_array( $host, $hosts, true ) ) {
			return new \WP_Error( 'rollback_package', __( 'The download address was not trusted, so nothing was changed.', 'text-to-audio' ) );
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// A server that asks for FTP details cannot show that form here.
		ob_start();
		$credentials = request_filesystem_credentials( '', '', false, false, null );
		ob_end_clean();
		if ( false === $credentials || ! WP_Filesystem( $credentials ) ) {
			return new \WP_Error( 'rollback_filesystem', __( 'This server asks for FTP details before plugins can be changed. Roll back from Plugins › Add New instead, or ask your host.', 'text-to-audio' ) );
		}

		$skin     = new \WP_Ajax_Upgrader_Skin();
		$upgrader = new TTA_Rollback_Upgrader( $skin );
		$result   = $upgrader->roll_back( $plugin_file, $url, isset( $package['sha256'] ) ? (string) $package['sha256'] : '' );

		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( true !== $result ) {
			$errors = $skin->get_errors();

			return is_wp_error( $errors ) && $errors->has_errors()
				? $errors
				: new \WP_Error( 'rollback_failed', __( 'The rollback did not finish. Your current version is still installed.', 'text-to-audio' ) );
		}

		return true;
	}

	// --------------------------------------------------------------- utilities

	/**
	 * @param string $plugin_file
	 * @return bool
	 */
	private static function auto_update_on( $plugin_file ) {
		return in_array( $plugin_file, (array) get_site_option( 'auto_update_plugins', array() ), true );
	}

	/**
	 * Turn WordPress auto-updates on or off for one plugin (the owner's choice
	 * on the Versions screen).
	 *
	 * @param string $plugin_file
	 * @param bool   $on
	 */
	public static function set_auto_update( $plugin_file, $on ) {
		$list = array_values( array_diff( (array) get_site_option( 'auto_update_plugins', array() ), array( $plugin_file ) ) );
		if ( $on ) {
			$list[] = $plugin_file;
		}
		update_site_option( 'auto_update_plugins', $list );
	}

	/**
	 * @return string e.g. "8.3".
	 */
	private static function php_version() {
		return PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
	}
}
