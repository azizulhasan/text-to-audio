<?php

namespace TTA\Audio;

use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Server-side checks for every MP3 generation request.
 *
 * The generation routes are called by visitors' players, so nothing that
 * decides where a file is written, which post it belongs to or who may
 * overwrite it is taken from the request as it is. Built for Pro 3.4.17
 * (TTS-355) and moved here so Free's player 3 runs the same checks; Pro's
 * TTA_Pro\Audio\Text_Gate extends this class.
 */
class Text_Gate {

	/**
	 * Longest text one batch may carry. The largest batch the players send is
	 * 3,000 characters (OpenAI); the margin covers aliases and intro/outro.
	 */
	const MAX_BATCH_CHARS = 5000;

	/** Highest batch number accepted (a 750,000-character article at 1,500 per batch). */
	const MAX_BATCHES = 500;

	/**
	 * Check and normalise a decoded generation request.
	 *
	 * @param array $body Decoded JSON body from the player.
	 * @return array|\WP_Error The body with server-decided values, or why it was refused.
	 */
	public static function check( $body ) {
		if ( ! is_array( $body ) ) {
			return new \WP_Error( 'invalid_request' );
		}

		$post_id = isset( $body['post_id'] ) ? absint( $body['post_id'] ) : 0;
		$post    = $post_id ? get_post( $post_id ) : null;
		$editor  = $post ? current_user_can( 'edit_post', $post->ID ) : current_user_can( 'manage_options' );

		// No post: only the admin's customize preview ("Demo_Content") calls this.
		if ( ! $post && ! $editor ) {
			return new \WP_Error( 'invalid_post' );
		}

		if ( $post && ! $editor && ( 'publish' !== get_post_status( $post ) || ! is_post_type_viewable( $post->post_type ) ) ) {
			return new \WP_Error( 'invalid_post' );
		}

		$title      = isset( $body['title'] ) ? (string) $body['title'] : '';
		$temp_title = isset( $body['temp_title'] ) ? (string) $body['temp_title'] : '';

		if ( ! self::is_safe_name( $title ) ) {
			return new \WP_Error( 'invalid_title' );
		}

		$batch_no = self::batch_number( $title, $temp_title );
		if ( ! $batch_no ) {
			return new \WP_Error( 'invalid_title' );
		}

		if ( $post && ! self::title_belongs_to_post( $title, $post ) ) {
			return new \WP_Error( 'invalid_title' );
		}

		$content = isset( $body['content'] ) ? (string) $body['content'] : '';
		if ( mb_strlen( $content ) > self::MAX_BATCH_CHARS ) {
			return new \WP_Error( 'content_too_long' );
		}

		// The folder comes from the post, exactly as the player's own data does
		// (helpers.php → TTA_Helper::get_post_date()).
		if ( $post ) {
			$body['path'] = TTA_Helper::get_post_date( $post );
		} else {
			$path         = isset( $body['path'] ) ? (string) $body['path'] : '';
			$body['path'] = preg_match( '#^\d{4}/\d{2}/\d{2}$#', $path ) ? $path : '';
		}

		$body['post_id']       = $post ? (string) $post->ID : '';
		$body['title']         = $title;
		$body['temp_title']    = $temp_title;
		$body['content']       = $content;
		$body['is_last_batch'] = ! empty( $body['is_last_batch'] );
		$body['batch_no']      = $batch_no;

		// Only editors may throw away an existing file.
		if ( ! $editor ) {
			unset( $body['is_regenerate_file'], $body['regenerate_file'] );
		}

		return $body;
	}

	/**
	 * File names are letters, digits, "_", "-" and single dots — never a path.
	 *
	 * @param string $name File name without extension.
	 * @return bool
	 */
	public static function is_safe_name( $name ) {
		return '' !== $name
			&& strlen( $name ) <= 255
			&& false === strpos( $name, '..' )
			&& '.' !== $name[0]
			&& (bool) preg_match( '/^[\p{L}\p{N}_.\-]+$/u', $name );
	}

	/**
	 * A batch file is "{title}-{n}"; returns n, or 0 when it is not.
	 *
	 * @param string $title      Final file name.
	 * @param string $temp_title Batch file name.
	 * @return int
	 */
	public static function batch_number( $title, $temp_title ) {
		$prefix = $title . '-';
		if ( 0 !== strpos( $temp_title, $prefix ) ) {
			return 0;
		}

		$n = substr( $temp_title, strlen( $prefix ) );
		if ( ! ctype_digit( $n ) ) {
			return 0;
		}

		$n = (int) $n;

		return ( $n >= 1 && $n <= self::MAX_BATCHES ) ? $n : 0;
	}

	/**
	 * Does the requested file name start the way this post's names start?
	 *
	 * Names are built by TTA_Helper::tts_file_name() from the cleaned post title
	 * (English: the title's letters; other languages: md5 of it; empty title: the
	 * post id), then "__lang__…", optional "__voice__…" and filters. Only the start
	 * is compared, so every language, voice and the post-id suffix still match.
	 *
	 * @param string   $title Requested file name.
	 * @param \WP_Post $post  Post the audio is for.
	 * @return bool
	 */
	public static function title_belongs_to_post( $title, $post ) {
		$clean = function_exists( 'tta_clean_content' ) ? tta_clean_content( $post->post_title ) : $post->post_title;
		if ( function_exists( 'tta_append_delimiter' ) && class_exists( '\TTA\TTA_Speech' ) ) {
			$clean = tta_append_delimiter( $clean, \TTA\TTA_Speech::default_delimiter() );
		}
		$clean = apply_filters( 'tta__content_title', $clean, $post );

		$bases = array( (string) $post->ID );
		foreach ( array( 'en', 'xx' ) as $lang ) {
			$name    = (string) TTA_Helper::tts_file_name( $clean, $lang, '', $post->ID, $post );
			$cut     = strpos( $name, '__lang__' );
			$bases[] = false === $cut ? $name : substr( $name, 0, $cut );
		}

		foreach ( array_filter( array_unique( $bases ), 'strlen' ) as $base ) {
			// Long player-3 names are cut to 100 characters plus a hash.
			$length = min( strlen( $base ), 100 );
			if ( 0 === strncasecmp( $title, $base, $length ) ) {
				return true;
			}
		}

		/**
		 * Kept from Pro 3.4.17, where this check started, so a site that already
		 * allows its own names keeps working.
		 *
		 * @param bool     $allowed Whether the name is accepted.
		 * @param string   $title   Requested file name.
		 * @param \WP_Post $post    Post the audio is for.
		 */
		$allowed = (bool) apply_filters( 'tts_pro_generation_title_allowed', false, $title, $post );

		/**
		 * Sites that rename audio files with their own `tts_file_name` filter can
		 * allow their names here.
		 *
		 * @param bool     $allowed Whether the name is accepted.
		 * @param string   $title   Requested file name.
		 * @param \WP_Post $post    Post the audio is for.
		 */
		return (bool) apply_filters( 'atlasvoice_generation_title_allowed', $allowed, $title, $post );
	}
}
