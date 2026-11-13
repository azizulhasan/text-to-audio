<?php
/**
 * The languages of the site, as the Languages tab shows them.
 *
 * @package TTA
 */

namespace TTA\Voice;

use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Says which language the posts are read in, and which translation plugins
 * the site runs with the languages they add.
 *
 * It reads what the plugin already knows for its players
 * (TTA_Helper::get_compatible_plugins_data()) and saved settings; nothing is
 * stored or changed. The admin screen (REST), `wp atlasvoice languages` and
 * an MCP server all read it here.
 */
class Languages {

	/**
	 * The translation plugins the player supports: the key the plugin's own
	 * detection uses => display name and how the plugin translates.
	 *
	 * "pages" plugins keep each translation as a page on the server;
	 * "browser" plugins translate the page in the visitor's browser.
	 */
	const PLUGINS = array(
		'sitepress'      => array( 'WPML', 'pages' ),
		'polylang'       => array( 'Polylang', 'pages' ),
		'translatepress' => array( 'TranslatePress', 'pages' ),
		'gtranslate'     => array( 'GTranslate', 'browser' ),
	);

	/**
	 * The languages of the site.
	 *
	 * @return array {
	 *     site_language: string, site_language_name: string,
	 *     plugins: array<int, array{id:string, name:string, kind:string, languages: array<int, array{code:string, name:string}>}>
	 * }
	 */
	public static function get() {
		$listening = TTA_Helper::tts_get_settings( 'listening' );
		$listening = is_object( $listening ) ? get_object_vars( $listening ) : (array) $listening;
		$language  = isset( $listening['tta__listening_lang'] ) && is_string( $listening['tta__listening_lang'] ) ? sanitize_text_field( $listening['tta__listening_lang'] ) : '';

		if ( '' === $language ) {
			$language = str_replace( '_', '-', (string) get_locale() );
		}

		$plugins = array();
		foreach ( (array) TTA_Helper::get_compatible_plugins_data() as $data ) {
			$data = (array) $data;
			$id   = isset( $data['plugin'] ) && is_string( $data['plugin'] ) ? $data['plugin'] : '';

			if ( ! isset( self::PLUGINS[ $id ] ) ) {
				continue;
			}

			$plugins[] = array(
				'id'        => $id,
				'name'      => self::PLUGINS[ $id ][0],
				'kind'      => self::PLUGINS[ $id ][1],
				'languages' => self::languages_of( $id, $data ),
			);
		}

		return array(
			'site_language'      => $language,
			'site_language_name' => self::name_of( $language ),
			'plugins'            => $plugins,
		);
	}

	/**
	 * The languages a translation plugin adds, in one shape.
	 *
	 * @param string $id   Plugin id.
	 * @param array  $data What the plugin's detection collected.
	 *
	 * @return array<int, array{code:string, name:string}>
	 */
	private static function languages_of( $id, array $data ) {
		$found = array();

		if ( 'gtranslate' === $id ) {
			foreach ( isset( $data['allowed_languages'] ) ? (array) $data['allowed_languages'] : array() as $code ) {
				$found[] = array( $code, '' );
			}
		} elseif ( 'translatepress' === $id ) {
			foreach ( isset( $data['data'] ) ? (array) $data['data'] : array() as $code ) {
				$found[] = array( $code, '' );
			}
		} else {
			// WPML and Polylang: code => details.
			foreach ( isset( $data['active_languages'] ) ? (array) $data['active_languages'] : array() as $code => $details ) {
				$details = (array) $details;
				$name    = '';
				foreach ( array( 'english_name', 'display_name', 'native_name' ) as $field ) {
					if ( isset( $details[ $field ] ) && is_string( $details[ $field ] ) && '' !== $details[ $field ] ) {
						$name = $details[ $field ];
						break;
					}
				}
				$found[] = array( $code, $name );
			}
		}//end if

		$languages = array();
		foreach ( array_slice( $found, 0, 200 ) as $item ) {
			$code = is_string( $item[0] ) ? str_replace( '_', '-', sanitize_text_field( $item[0] ) ) : '';
			if ( '' === $code ) {
				continue;
			}
			$name        = sanitize_text_field( (string) $item[1] );
			$languages[] = array(
				'code' => $code,
				'name' => '' !== $name ? $name : self::name_of( $code ),
			);
		}

		return $languages;
	}

	/**
	 * A language's name in the admin's language, when WordPress knows it.
	 *
	 * @param string $code e.g. "en-GB", "fr".
	 *
	 * @return string The name, or the code itself.
	 */
	private static function name_of( $code ) {
		$code = (string) $code;

		if ( class_exists( '\Locale' ) ) {
			$name = \Locale::getDisplayName( str_replace( '-', '_', $code ), str_replace( '-', '_', (string) get_user_locale() ) );
			if ( is_string( $name ) && '' !== $name && strtolower( $name ) !== strtolower( str_replace( '-', '_', $code ) ) ) {
				return sanitize_text_field( $name );
			}
		}

		return $code;
	}
}
