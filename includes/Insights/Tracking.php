<?php
/**
 * Whether plays are counted, and for which posts.
 *
 * @package TTA
 */

namespace TTA\Insights;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves the tracking settings.
 *
 * Nothing new is stored. Each part is a field of `tta_analytics_settings`
 * that the classic Analytics screen already saves, in the same format:
 *
 * - count_plays: tts_enable_analytics;
 * - listener_location: tts_show_listener_location. Only when it is on are
 *   visitor IP addresses sent to a lookup service (wp.org guideline 7);
 * - posts: tts_trackable_post_ids, "all" alone or a list of post numbers.
 *
 * The admin screen (REST), `wp atlasvoice tracking` and an MCP server all
 * act here (TTS-376).
 */
class Tracking {

	const OPTION = 'tta_analytics_settings';

	/**
	 * Stands for every post in the list of tracked posts.
	 */
	const ALL = 'all';

	/**
	 * How many single posts can be chosen. More than this is "all posts".
	 */
	const POSTS_MAX = 1000;

	const FIELDS = array(
		'count_plays'       => 'tts_enable_analytics',
		'listener_location' => 'tts_show_listener_location',
		'posts'             => 'tts_trackable_post_ids',
	);

	/**
	 * The settings.
	 *
	 * @return array{count_plays: bool, listener_location: bool, posts: array<int, string|int>}
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_object( $stored ) ? get_object_vars( $stored ) : ( is_array( $stored ) ? $stored : array() );
		$posts  = array();

		foreach ( isset( $stored[ self::FIELDS['posts'] ] ) ? (array) $stored[ self::FIELDS['posts'] ] : array() as $post ) {
			if ( self::ALL === $post ) {
				$posts = array( self::ALL );
				break;
			}
			if ( is_scalar( $post ) && absint( $post ) > 0 ) {
				$posts[] = absint( $post );
			}
		}

		return array(
			'count_plays'       => ! empty( $stored[ self::FIELDS['count_plays'] ] ),
			'listener_location' => ! empty( $stored[ self::FIELDS['listener_location'] ] ),
			'posts'             => array_values( array_unique( $posts ) ),
		);
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of: count_plays, listener_location, posts.
	 *
	 * @return array|\WP_Error The settings after the save, or why nothing was saved.
	 */
	public static function save( array $fields ) {
		$clean = self::validate( $fields );
		if ( is_wp_error( $clean ) ) {
			return $clean;
		}

		if ( ! $clean ) {
			return new \WP_Error(
				'atlasvoice_nothing_to_save',
				__( 'Nothing to save.', 'text-to-audio' ),
				array( 'status' => 400 )
			);
		}

		$incoming = array();
		foreach ( $clean as $name => $value ) {
			$incoming[ self::FIELDS[ $name ] ] = $value;
		}

		$settings = Settings_Store::prepare( self::OPTION, (object) $incoming );
		if ( is_wp_error( $settings ) ) {
			return $settings;
		}

		update_option( self::OPTION, $settings, false );
		TTA_Cache::delete( 'all_settings' );

		return self::get();
	}

	/**
	 * Checks what was sent. Unknown names are an error, so a typing mistake
	 * in a script is noticed instead of silently ignored.
	 *
	 * @param array $fields What was sent.
	 *
	 * @return array|\WP_Error The clean values, in the stored format.
	 */
	public static function validate( array $fields ) {
		$clean = array();

		foreach ( $fields as $name => $value ) {
			if ( ! is_string( $name ) || ! isset( self::FIELDS[ $name ] ) ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			if ( 'posts' !== $name ) {
				$flag = self::to_bool( $value );
				if ( null === $flag ) {
					return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
				}
				$clean[ $name ] = $flag;
				continue;
			}

			if ( is_string( $value ) ) {
				$value = array_filter( array_map( 'trim', explode( ',', $value ) ), 'strlen' );
			}
			if ( ! is_array( $value ) || ! $value ) {
				return self::invalid( $name, __( 'Give "all", or at least one post number.', 'text-to-audio' ) );
			}

			$posts = array();
			foreach ( $value as $post ) {
				if ( self::ALL === $post ) {
					$posts = array( self::ALL );
					break;
				}
				if ( ! is_scalar( $post ) || ! ctype_digit( trim( (string) $post ) ) || (int) $post < 1 ) {
					return self::invalid( $name, __( 'A post is given by its number, for example 128.', 'text-to-audio' ) );
				}
				// The classic screen stores the numbers as text.
				$posts[] = (string) (int) $post;
			}

			$posts = array_values( array_unique( $posts ) );
			if ( count( $posts ) > self::POSTS_MAX ) {
				return self::invalid(
					$name,
					sprintf(
						/* translators: %d: the largest number of posts. */
						__( 'At most %d single posts can be chosen. Choose all posts for more.', 'text-to-audio' ),
						self::POSTS_MAX
					)
				);
			}
			$clean[ $name ] = $posts;
		}//end foreach

		return $clean;
	}

	/**
	 * On or off, from the forms a script or a screen sends.
	 *
	 * @param mixed $value What was sent.
	 *
	 * @return bool|null Null when it is neither.
	 */
	private static function to_bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}

		$text = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		if ( in_array( $text, array( '1', 'true', 'on', 'yes' ), true ) ) {
			return true;
		}

		return in_array( $text, array( '0', 'false', 'off', 'no' ), true ) ? false : null;
	}

	/**
	 * An error for one field.
	 *
	 * @param string $field   Field name.
	 * @param string $message What is wrong.
	 *
	 * @return \WP_Error
	 */
	private static function invalid( $field, $message ) {
		return new \WP_Error(
			'atlasvoice_invalid_tracking_setting',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
