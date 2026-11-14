<?php
/**
 * Which posts get a player.
 *
 * @package TTA
 */

namespace TTA\Content;

use TTA\Settings\Settings_Store;
use TTA\TTA_Cache;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and saves where the player appears.
 *
 * Nothing new is stored. Each part is a field of `tta_settings_data` that
 * the classic Settings screen already saves, in the same format, so both
 * screens can be used on the same site:
 *
 * - automatic: tta__settings_enable_button_add;
 * - post_types: tta__settings_allow_listening_for_post_types (slugs);
 * - statuses: tta__settings_allow_listening_for_posts_status (slugs);
 * - skip_categories: tta__settings_exclude_categories (slugs);
 * - skip_tags: tta__settings_exclude_wp_tags (slugs);
 * - skip_posts: tta__settings_exclude_post_ids (post numbers, as text).
 *
 * TTA_Helper::should_load_button() is what applies them to a page view.
 * The admin screen (REST), `wp atlasvoice where` and an MCP server all act
 * here (TTS-376).
 */
class Where {

	const OPTION = 'tta_settings_data';

	/**
	 * The stored field of each part.
	 */
	const FIELDS = array(
		'automatic'       => 'tta__settings_enable_button_add',
		'post_types'      => 'tta__settings_allow_listening_for_post_types',
		'statuses'        => 'tta__settings_allow_listening_for_posts_status',
		'skip_categories' => 'tta__settings_exclude_categories',
		'skip_tags'       => 'tta__settings_exclude_wp_tags',
		'skip_posts'      => 'tta__settings_exclude_post_ids',
	);

	/**
	 * How many categories or tags are offered to choose from. A site can
	 * have tens of thousands of tags; a longer list would slow the screen.
	 */
	const CHOICES = 1000;

	/**
	 * How many single posts can be skipped. More than this belongs in a
	 * category or a tag, which the player checks faster.
	 */
	const SKIP_POSTS_MAX = 500;

	/**
	 * The settings and what can be chosen.
	 *
	 * @return array {
	 *     automatic: bool, post_types: string[], statuses: string[],
	 *     skip_categories: string[], skip_tags: string[], skip_posts: int[],
	 *     skipped_posts: array<int, array{id:int, title:string}>,
	 *     choices: array<string, array<int, array{id:string, name:string}>>
	 * }
	 */
	public static function get() {
		$stored = self::stored();
		$posts  = array();
		$titles = array();

		foreach ( self::list_of( $stored, 'skip_posts' ) as $id ) {
			$id = absint( $id );
			if ( $id && ! in_array( $id, $posts, true ) ) {
				$posts[]  = $id;
				$post     = get_post( $id );
				$titles[] = array(
					'id'    => $id,
					'title' => $post ? TTA_Helper::atlasvoice_plain_title( $post ) : '',
				);
			}
		}

		return array(
			'automatic'       => ! isset( $stored[ self::FIELDS['automatic'] ] ) || ! empty( $stored[ self::FIELDS['automatic'] ] ),
			'post_types'      => self::slugs( $stored, 'post_types' ),
			'statuses'        => self::slugs( $stored, 'statuses' ),
			'skip_categories' => self::slugs( $stored, 'skip_categories' ),
			'skip_tags'       => self::slugs( $stored, 'skip_tags' ),
			'skip_posts'      => $posts,
			'skipped_posts'   => $titles,
			'choices'         => array(
				'post_types' => self::choices( TTA_Helper::get_post_types() ),
				'statuses'   => self::choices( TTA_Helper::all_post_status() ),
				'categories' => self::choices( TTA_Helper::get_all_categories() ),
				'tags'       => self::choices( TTA_Helper::get_all_tags() ),
			),
		);
	}

	/**
	 * Saves the parts that were sent; the rest stays as it is.
	 *
	 * @param array $fields Any of the names in FIELDS.
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

		update_option( self::OPTION, $settings );
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
		$clean  = array();
		$stored = self::stored();
		$known  = array(
			'post_types' => array_keys( (array) TTA_Helper::get_post_types() ),
			'statuses'   => array_keys( (array) TTA_Helper::all_post_status() ),
		);
		// Asked from WordPress one by one, not from the cached pick lists: a
		// category made a minute ago, or one without posts yet, is a real category.
		$taxonomy = array(
			'skip_categories' => 'category',
			'skip_tags'       => 'post_tag',
		);

		foreach ( $fields as $name => $value ) {
			if ( ! is_string( $name ) || ! isset( self::FIELDS[ $name ] ) ) {
				return self::invalid( (string) $name, __( 'This setting does not exist.', 'text-to-audio' ) );
			}

			if ( 'automatic' === $name ) {
				$flag = self::to_bool( $value );
				if ( null === $flag ) {
					return self::invalid( $name, __( 'This must be on or off.', 'text-to-audio' ) );
				}
				$clean[ $name ] = $flag;
				continue;
			}

			$items = self::as_list( $value );
			if ( null === $items ) {
				return self::invalid( $name, __( 'This must be a list.', 'text-to-audio' ) );
			}

			if ( 'skip_posts' === $name ) {
				$ids = self::clean_posts( $items );
				if ( is_wp_error( $ids ) ) {
					return self::invalid( $name, $ids->get_error_message() );
				}
				$clean[ $name ] = $ids;
				continue;
			}

			// A slug that is already stored is kept, even when its category or tag was deleted since.
			$kept = self::slugs( $stored, $name );
			foreach ( $items as $item ) {
				$exists = is_string( $item ) && '' !== $item && (
					in_array( $item, $kept, true )
					|| ( isset( $known[ $name ] ) && in_array( $item, $known[ $name ], true ) )
					|| ( isset( $taxonomy[ $name ] ) && get_term_by( 'slug', $item, $taxonomy[ $name ] ) )
				);
				if ( ! $exists ) {
					return self::invalid(
						$name,
						sprintf(
							/* translators: %s: what was sent, e.g. a content type or a category. */
							__( 'This site has nothing called "%s" to choose here.', 'text-to-audio' ),
							is_scalar( $item ) ? sanitize_text_field( (string) $item ) : '?'
						)
					);
				}
			}

			if ( ! $items && in_array( $name, array( 'post_types', 'statuses' ), true ) ) {
				return self::invalid( $name, __( 'Choose at least one.', 'text-to-audio' ) );
			}

			$clean[ $name ] = array_values( array_unique( $items ) );
		}//end foreach

		return $clean;
	}

	/**
	 * Post numbers, checked, as the classic screen stores them (text).
	 *
	 * @param array $items What was sent.
	 *
	 * @return string[]|\WP_Error
	 */
	private static function clean_posts( array $items ) {
		$ids = array();

		foreach ( $items as $item ) {
			if ( ! is_scalar( $item ) || ! ctype_digit( trim( (string) $item ) ) || (int) $item < 1 ) {
				return new \WP_Error( 'id', __( 'A post is given by its number, for example 128.', 'text-to-audio' ) );
			}
			$ids[] = (string) (int) $item;
		}

		$ids = array_values( array_unique( $ids ) );
		if ( count( $ids ) > self::SKIP_POSTS_MAX ) {
			return new \WP_Error(
				'many',
				sprintf(
					/* translators: %d: the largest number of single posts. */
					__( 'At most %d single posts can be skipped. Use a category or a tag for more.', 'text-to-audio' ),
					self::SKIP_POSTS_MAX
				)
			);
		}

		return $ids;
	}

	/**
	 * A list from what a screen (a list) or a script (text with commas) sends.
	 *
	 * @param mixed $value What was sent.
	 *
	 * @return array|null Null when it is neither.
	 */
	private static function as_list( $value ) {
		if ( is_string( $value ) ) {
			return array_values( array_filter( array_map( 'trim', explode( ',', $value ) ), 'strlen' ) );
		}

		return is_array( $value ) ? array_values( $value ) : null;
	}

	/**
	 * The stored settings as an array.
	 *
	 * @return array
	 */
	private static function stored() {
		$stored = get_option( self::OPTION, array() );
		if ( is_object( $stored ) ) {
			$stored = get_object_vars( $stored );
		}

		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * One stored list.
	 *
	 * @param array  $stored The stored settings.
	 * @param string $name   A name in FIELDS.
	 *
	 * @return array
	 */
	private static function list_of( array $stored, $name ) {
		$value = isset( $stored[ self::FIELDS[ $name ] ] ) ? $stored[ self::FIELDS[ $name ] ] : array();

		return is_array( $value ) ? array_values( $value ) : array();
	}

	/**
	 * One stored list of slugs, without anything that is not a slug.
	 *
	 * @param array  $stored The stored settings.
	 * @param string $name   A name in FIELDS.
	 *
	 * @return string[]
	 */
	private static function slugs( array $stored, $name ) {
		$slugs = array();

		foreach ( self::list_of( $stored, $name ) as $slug ) {
			if ( is_string( $slug ) && '' !== $slug ) {
				$slugs[] = sanitize_text_field( $slug );
			}
		}

		return array_values( array_unique( $slugs ) );
	}

	/**
	 * A map of slug => name as a list the screen can show.
	 *
	 * @param mixed $map Slug => name.
	 *
	 * @return array<int, array{id:string, name:string}>
	 */
	private static function choices( $map ) {
		$choices = array();

		foreach ( array_slice( is_array( $map ) ? $map : array(), 0, self::CHOICES, true ) as $slug => $name ) {
			$choices[] = array(
				'id'   => (string) $slug,
				'name' => wp_strip_all_tags( (string) $name ),
			);
		}

		return $choices;
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
			'atlasvoice_invalid_where',
			$message,
			array(
				'status' => 400,
				'field'  => sanitize_key( $field ),
			)
		);
	}
}
