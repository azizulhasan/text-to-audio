<?php
/**
 * How to place a player by hand: the shortcode, its options and the block.
 *
 * @package TTA
 */

namespace TTA\Player;

defined( 'ABSPATH' ) || exit;

/**
 * The reference of the shortcode and the block.
 *
 * It only describes what the plugin already does (text-to-audio.php
 * registers the shortcodes, includes/helpers.php reads the options); it
 * stores and changes nothing. The admin screen (REST), `wp atlasvoice
 * embed` and an MCP server all read this one list (TTS-376), so a tool that
 * writes posts knows which options a player accepts.
 */
class Embed {

	const SHORTCODE = 'atlasvoice';

	/**
	 * The older name of the shortcode. It keeps working.
	 */
	const LEGACY_SHORTCODE = 'tta_listen_btn';

	const BLOCK = 'AtlasVoice';

	/**
	 * The reference.
	 *
	 * @return array {
	 *     shortcode: string, legacy_shortcode: string, block: string,
	 *     options: array<int, array{name:string, description:string, example:string}>
	 * }
	 */
	public static function get() {
		$tag = self::SHORTCODE;

		return array(
			'shortcode'        => '[' . $tag . ']',
			'legacy_shortcode' => '[' . self::LEGACY_SHORTCODE . ']',
			'block'            => self::BLOCK,
			'options'          => array(
				self::option( 'id', __( 'Reads another post, by its number.', 'text-to-audio' ), '[' . $tag . ' id="128"]' ),
				self::option( 'text_to_read', __( 'Reads your own text instead of the post.', 'text-to-audio' ), '[' . $tag . ' text_to_read="Welcome to our shop."]' ),
				self::option( 'lang', __( 'The language of this player.', 'text-to-audio' ), '[' . $tag . ' lang="es-ES"]' ),
				self::option( 'voice', __( 'The voice of this player, by its name.', 'text-to-audio' ), '[' . $tag . ' voice="Google UK English Female"]' ),
				self::option( 'listen_text', __( 'The word on the button before playing. Also pause_text, resume_text, replay_text, start_text and stop_text.', 'text-to-audio' ), '[' . $tag . ' listen_text="Hear it"]' ),
				self::option( 'backgroundColor', __( 'The background colour of this player.', 'text-to-audio' ), '[' . $tag . ' backgroundColor="#184c53"]' ),
				self::option( 'color', __( 'The colour of the text and icons of this player.', 'text-to-audio' ), '[' . $tag . ' color="#ffffff"]' ),
				self::option( 'width', __( 'The width of this player, as a percentage.', 'text-to-audio' ), '[' . $tag . ' width="60"]' ),
				self::option( 'class', __( 'Adds your own CSS class to the player.', 'text-to-audio' ), '[' . $tag . ' class="my-player"]' ),
				self::option( 'position', __( 'When the shortcode wraps some content: puts the player before or after it.', 'text-to-audio' ), '[' . $tag . ' position="before"]…[/' . $tag . ']' ),
			),
		);
	}

	/**
	 * One option of the shortcode.
	 *
	 * @param string $name        The option, as it is typed.
	 * @param string $description What it does.
	 * @param string $example     A shortcode that uses it.
	 *
	 * @return array{name:string, description:string, example:string}
	 */
	private static function option( $name, $description, $example ) {
		return array(
			'name'        => $name,
			'description' => $description,
			'example'     => $example,
		);
	}
}
