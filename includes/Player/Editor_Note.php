<?php
/**
 * What the player on the page tells the people who can edit the post.
 *
 * @package TTA
 */

namespace TTA\Player;

use TTA\Library\Audio;
use TTA\Library\Posts;
use TTA\TTA_AtlasVoice_Service;
use TTA\TTA_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-347: a visitor never reads why audio could not be made; they get the
 * device voice. Someone who can edit the post gets one note under the
 * player: the reason, or that visitors hear an older version of the text.
 *
 * This builds the data and the words of that note. It is added to the
 * player's data only for a user who can edit the post, so a visitor's page
 * holds none of it. The words are translated here, because the player's
 * script is shared with extensions and carries no words of its own.
 */
class Editor_Note {

	/**
	 * The note's data for the post, for the user who is logged in.
	 *
	 * @param \WP_Post|null $post The post the player reads.
	 *
	 * @return array|null Null for a visitor and for anyone who cannot edit the post.
	 */
	public static function for_post( $post ) {
		if ( ! $post instanceof \WP_Post || ! is_user_logged_in() || ! current_user_can( 'edit_post', $post->ID ) ) {
			return null;
		}

		$stores   = TTA_Helper::player_makes_mp3( (int) TTA_Helper::get_player_id() );
		$outdated = false;
		$made     = '';

		if ( $stores && 'publish' === $post->post_status ) {
			$outdated = 'outdated' === Posts::one( $post )['status'];
			if ( $outdated ) {
				$made = self::made_on( $post->ID );
			}
		}

		$jobs  = Audio::availability();
		$until = TTA_AtlasVoice_Service::exhausted_until();
		$until = $until ? date_i18n( (string) get_option( 'date_format' ), $until ) : '';

		return array(
			'is_admin'   => current_user_can( 'manage_options' ),
			'outdated'   => $outdated,
			'can_make'   => $outdated && $jobs['available'],
			'make_route' => 'tta/v1/post-panel/' . (int) $post->ID . '/audio',
			'edit_url'   => (string) get_edit_post_link( $post->ID, 'raw' ),
			'words'      => array(
				'editors'     => __( 'Editors only.', 'text-to-audio' ),
				'admins'      => __( 'Admins only.', 'text-to-audio' ),
				'failed'      => __( 'This audio could not be made right now, so the post is read by the device’s voice. The reason is in the post editor and the Audio library.', 'text-to-audio' ),
				'limit'       => __( 'Today’s character limit is reached. New audio waits until tomorrow or until you raise the limit; posts with audio play as usual.', 'text-to-audio' ),
				'quota'       => '' !== $until
					/* translators: %s: a date, e.g. "1 November 2026". */
					? sprintf( __( 'This month’s natural-voice characters are used up, so this post uses the browser voice until %s.', 'text-to-audio' ), $until )
					: __( 'This month’s natural-voice characters are used up, so this post uses the browser voice.', 'text-to-audio' ),
				'off'         => __( 'No audio is made for this post, so it is read by the device’s voice.', 'text-to-audio' ),
				'outdated'    => '' !== $made
					/* translators: %s: a date, e.g. "21 October 2026". */
					? sprintf( __( 'Visitors hear the version from %s; the text changed since.', 'text-to-audio' ), $made )
					: __( 'Visitors hear an older version; the text changed since.', 'text-to-audio' ),
				'remake'      => __( 'Make it again', 'text-to-audio' ),
				'started'     => __( 'Started. The new audio replaces this one when it is ready.', 'text-to-audio' ),
				'not_started' => __( 'It could not be started. Open the post editor to see why.', 'text-to-audio' ),
				'open_editor' => __( 'Open the post editor', 'text-to-audio' ),
			),
		);
	}

	/**
	 * The day the post's stored audio was made, when it is known.
	 *
	 * @param int $post_id The post.
	 *
	 * @return string A date in the site's format, or ''.
	 */
	private static function made_on( $post_id ) {
		$facts = get_post_meta( $post_id, '_atlasvoice_audio_facts', true );
		$made  = 0;

		foreach ( is_array( $facts ) ? $facts : array() as $fact ) {
			if ( is_array( $fact ) && isset( $fact['made'] ) ) {
				$made = max( $made, (int) $fact['made'] );
			}
		}

		return $made > 0 ? date_i18n( (string) get_option( 'date_format' ), $made ) : '';
	}
}
