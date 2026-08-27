<?php

namespace TTA;

defined( 'ABSPATH' ) || exit;

/**
 * TTS-280: single source of truth for what gets spoken and where a pause goes.
 *
 * Every list below is produced BY a filter. Nothing is appended after the filter
 * runs — that was the original defect: TTSProHelper.js pushed 'figure' onto the
 * exclude list after reading the user's setting, so neither the UI nor any
 * snippet could ever override it.
 *
 * Method names mirror their Pro JS counterparts (haveExcludeTags,
 * ttaShouldAddDelimiter, addDelimiterIfNeed) in WordPress snake_case, so the two
 * implementations of the same job are recognisably the same job.
 *
 * Lives in Free because Pro hard-depends on Free. Free uses it directly on the
 * PHP path; Pro consumes payload() in JS for the DOM path.
 *
 * @since 2.3.11
 */
class TTA_Speech {

	/**
	 * Void tags that mark a boundary but carry no text (a separator).
	 *
	 * @return array
	 */
	public static function void_boundary_tags() {
		// TTS-280: 'br' is in the default because tta_clean_content() already gave
		// <br> a pause before this ticket. Dropping it here would silently remove
		// line-break pauses from every existing site.
		return (array) apply_filters( 'tta_void_boundary_tags', array( 'hr', 'br' ) );
	}

	/**
	 * The shipped default exclude list, in one place.
	 *
	 * TTS-280: TTA_Activator writes this same list into tta__settings_exclude_tags
	 * on activation. Both sides read it from here so the activator default and the
	 * runtime fallback can never drift apart — which is exactly how the PHP path
	 * ended up hardcoding figure/figcaption/aside while the setting said something
	 * else entirely.
	 *
	 * @return array
	 */
	public static function default_exclude_tags() {
		return array(
			'aside',
			'figure',
			'blockquote',
			'pre',
			'code',
			'table',
			'form',
			'nav',
			'footer',
			'header',
			'script',
			'style',
		);
	}

	/**
	 * The shipped default as the pipe-joined string the option stores.
	 *
	 * @return string
	 */
	public static function default_exclude_tags_string() {
		return implode( '|', self::default_exclude_tags() );
	}

	/**
	 * Mirrors haveExcludeTags() in TTSProHelper.js.
	 *
	 * Global include/exclude list, seeded from the Settings UI value
	 * (pipe-separated). Only script/style are non-negotiable; every other tag comes
	 * from the setting, so a site that wants its pullquotes or tables read aloud
	 * removes them in the UI or via the filter and it actually takes effect.
	 *
	 * @return array
	 */
	public static function have_exclude_tags() {
		$settings = TTA_Helper::tts_get_settings( 'settings' );
		$tags     = isset( $settings['tta__settings_exclude_tags'] ) ? $settings['tta__settings_exclude_tags'] : '';

		if ( ! is_array( $tags ) ) {
			$tags = explode( '|', (string) $tags );
		}

		$tags = array_values( array_filter( array_map( 'trim', $tags ) ) );

		// TTS-280: fall back to the shipped default, the same list TTA_Activator
		// writes. This is a DEFAULT, not a hardcode: it applies only when the site
		// has no value at all. Re-adding it to a configured list would undo the
		// user's choice on every page load, which is the bug this ticket exists to
		// fix.
		if ( empty( $tags ) ) {
			$tags = self::default_exclude_tags();
		}

		foreach ( array( 'script', 'style' ) as $required ) {
			if ( ! in_array( $required, $tags, true ) ) {
				$tags[] = $required;
			}
		}

		return array_values( array_unique( (array) apply_filters( 'tta__settings_exclude_tags', $tags ) ) );
	}

	/**
	 * Remove excluded elements, with their inner text, from an HTML string.
	 *
	 * TTS-280: tta_clean_content() used to hardcode
	 * '#<(figure|figcaption|aside)\b[^>]*>.*?</\1>#is' — the PHP twin of the
	 * force-push bug in TTSProHelper.js. The list is now produced by
	 * have_exclude_tags(), so the Settings UI and the filter finally reach the PHP
	 * path, which they never did before.
	 *
	 * Only bare tag names are handled here. CSS selectors (.class / #id) stay with
	 * TTA_Helper::strip_elements_by_css_selectors(), which reads its own setting.
	 *
	 * @param string $html Raw post HTML.
	 *
	 * @return string
	 */
	public static function strip_excluded_tags( $html ) {
		$html = (string) $html;

		if ( '' === $html ) {
			return $html;
		}

		foreach ( self::have_exclude_tags() as $tag ) {
			$tag = trim( (string) $tag );

			// Skip CSS selectors and anything that is not a plain tag name.
			if ( '' === $tag || ! preg_match( '/^[a-z][a-z0-9]*$/i', $tag ) ) {
				continue;
			}

			$quoted = preg_quote( $tag, '#' );

			// Paired tag with its contents.
			$html = preg_replace( '#<\s*' . $quoted . '\b[^>]*>.*?</\s*' . $quoted . '\s*>#is', '', $html );

			// Self-closing / unclosed leftovers.
			$html = preg_replace( '#<\s*' . $quoted . '\b[^>]*/?>#i', '', $html );
		}

		return $html;
	}

	/**
	 * Tags whose closing tag ends a spoken unit.
	 *
	 * @return array
	 */
	public static function delimiter_addable_tags() {
		$tags = array(
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'p',
			'li',
			'blockquote',
			'cite',
			'figcaption',
			'pre',
			'dd',
			'dt',
			'td',
			'th',
		);

		// TTS-280: deprecated Pro alias, applied first so existing customer snippets
		// keep working. Remove only when Pro's minimum Free version is raised.
		$tags = (array) apply_filters( 'tts_pro_delimiter_addable_tags', $tags );

		return array_values( array_unique( (array) apply_filters( 'tts_delimiter_addable_tags', $tags ) ) );
	}

	/**
	 * Characters that already end a sentence, across scripts.
	 *
	 * @return array
	 */
	public static function delimiter_characters() {
		return (array) apply_filters(
			'tta_delimiter_characters',
			array(
				'.', ',', '?', '!', '|', ';', ':', '…',
				'¿', '¡', '،', '؟', '۔', '؛',
				'。', '！', '？', '，', '、', '；', '：',
				'।', '॥', '։', '՞', '።', '፡', '·',
			)
		);
	}

	/**
	 * Closing marks to look past before deciding if text is punctuated.
	 *
	 * @return array
	 */
	public static function closing_characters() {
		return (array) apply_filters(
			'tta_closing_characters',
			array( '"', "'", '”', '’', ')', ']', '}', '»', '›', '」', '』', '）', '】' )
		);
	}

	/**
	 * The default delimiter string — the ONLY place it is decided.
	 *
	 * TTS-280: deliberately NOT read from the tta__sentence_delimiter setting.
	 * That key has no UI, is written once at activation, and reading it in JS is
	 * what made this filter unreachable in Pro. One default ('. ') everywhere;
	 * PHP previously disagreed with itself about the trailing space.
	 *
	 * @return string
	 */
	public static function default_delimiter() {
		return (string) apply_filters( 'tts_sentence_delimiter', '. ' );
	}

	/**
	 * THE SSML SEAM.
	 *
	 * What gets inserted at a boundary is decided here, with context, never as a
	 * fixed string at the insertion site. Today it returns punctuation. When SSML
	 * lands, this filter returns '<break time="600ms"/>' for a given tag and no
	 * insertion site changes.
	 *
	 * @param string $tag           Tag that produced the boundary.
	 * @param string $boundary_type 'close' for a closing tag, 'void' for hr etc.
	 *
	 * @return string
	 */
	public static function boundary_delimiter( $tag, $boundary_type = 'close' ) {
		return (string) apply_filters(
			'tta_boundary_delimiter',
			self::default_delimiter(),
			$tag,
			$boundary_type
		);
	}

	/**
	 * Mirrors ttaShouldAddDelimiter() in TTSProHelper.js. Returns bool.
	 *
	 * Walks back past any run of closing marks, so '…that.”' is recognised as
	 * already punctuated while '…possible”' is not. mb_* throughout — substr() is
	 * byte-based and returned a broken partial byte for every multibyte script, so
	 * the check silently failed for CJK, Devanagari and the rest.
	 *
	 * @param string $text Text to inspect.
	 *
	 * @return bool True when a delimiter still needs appending.
	 */
	public static function tta_should_add_delimiter( $text ) {
		$text = trim( (string) $text );

		if ( '' === $text ) {
			return false;
		}

		$closers = self::closing_characters();
		$enders  = self::delimiter_characters();
		$len     = function_exists( 'mb_strlen' ) ? mb_strlen( $text ) : strlen( $text );

		for ( $i = $len - 1; $i >= 0; $i-- ) {
			$char = function_exists( 'mb_substr' ) ? mb_substr( $text, $i, 1 ) : substr( $text, $i, 1 );

			if ( in_array( $char, $closers, true ) ) {
				continue;
			}

			return ! in_array( $char, $enders, true );
		}

		// Nothing but closing marks — no sentence to terminate.
		return false;
	}

	/**
	 * Mirrors addDelimiterIfNeed() in TTSProHelper.js.
	 *
	 * Insert boundary delimiters into an HTML string (the PHP path).
	 *
	 * @param string $html Raw post HTML.
	 *
	 * @return string
	 */
	public static function add_delimiter_if_need( $html ) {
		$html = (string) $html;

		if ( '' === $html ) {
			return $html;
		}

		$close_tags = self::delimiter_addable_tags();
		$void_tags  = self::void_boundary_tags();

		if ( empty( $close_tags ) && empty( $void_tags ) ) {
			return $html;
		}

		$quote = function ( $tag ) {
			return preg_quote( $tag, '#' );
		};

		// TTS-280: closing tags AND void tags are matched in ONE pass, on purpose.
		// Two passes double-insert at a '</p><hr/>' seam: the paragraph gets its
		// delimiter, then the separator adds a second one because it cannot see it.
		// <hr> also needs to be here at all — it has no closing tag, so a </tag>
		// rule can never give a separator a pause (116 of them on one customer
		// site produced none).
		$alternatives = array();

		if ( ! empty( $close_tags ) ) {
			$alternatives[] = '</\s*(?P<close>' . implode( '|', array_map( $quote, $close_tags ) ) . ')\s*>';
		}

		if ( ! empty( $void_tags ) ) {
			$alternatives[] = '<\s*(?P<void>' . implode( '|', array_map( $quote, $void_tags ) ) . ')\b[^>]*>';
		}

		$pattern = '#' . implode( '|', $alternatives ) . '#i';

		if ( ! preg_match_all( $pattern, $html, $matches, PREG_OFFSET_CAPTURE ) ) {
			return $html;
		}

		// TTS-280: walk FORWARDS, rebuilding the string, so each boundary sees the
		// delimiter the previous one just inserted. Walking backwards looks tempting
		// (offsets stay valid) but it makes '</p><hr/>' emit two delimiters: when
		// the separator is examined the paragraph's delimiter does not exist yet.
		//
		// A running tail is kept instead of re-stripping the whole document at every
		// boundary — that would be O(n^2) on a long post, and only the last few
		// characters can ever affect the decision.
		$out  = '';
		$tail = '';
		$last = 0;

		foreach ( $matches[0] as $i => $match ) {
			$whole  = $match[0];
			$offset = $match[1];

			$is_void = isset( $matches['void'][ $i ] ) && -1 !== $matches['void'][ $i ][1];
			$tag     = $is_void ? strtolower( $matches['void'][ $i ][0] ) : strtolower( $matches['close'][ $i ][0] );

			$segment = substr( $html, $last, $offset - $last );
			$last    = $offset + strlen( $whole );

			$plain = trim( wp_strip_all_tags( $segment ) );

			if ( '' !== $plain ) {
				$tail = $plain;
			}

			$out .= $segment;

			// TTS-280: the delimiter goes BEFORE the tag, attached to the text it
			// terminates. Appending it after the tag instead looks equivalent but is
			// not: the TTS-235 rule below inserts a space in front of any tag that
			// follows a word character, and TTA_Helper::clean_string() then discards
			// a delimiter that has become space-separated — so the pause silently
			// vanished from the finished audio.
			if ( '' !== $tail && self::tta_should_add_delimiter( $tail ) ) {
				$delimiter = self::boundary_delimiter( $tag, $is_void ? 'void' : 'close' );
				$out      .= $delimiter;
				$tail      = $delimiter;
			} elseif ( '' !== $plain ) {
				// TTS-280: an already-punctuated block still needs a SPACE, or the
				// next block glues onto it — 'full stop.E3 list item'. The old code
				// always emitted '. ' and got the space for free; skipping the
				// delimiter must not also skip the separator.
				$out .= ' ';
			}

			$out .= $whole;
		}

		return $out . substr( $html, $last );
	}

	/**
	 * Everything the DOM path needs. Boundary delimiters are RESOLVED per tag here,
	 * so the PHP filter reaches JS — JS cannot call apply_filters, and this is what
	 * keeps the SSML seam working on both paths.
	 *
	 * 'default_delimiter' replaces every JS read of the tta__sentence_delimiter
	 * setting.
	 *
	 * @return array
	 */
	public static function payload() {
		$close = array();
		foreach ( self::delimiter_addable_tags() as $tag ) {
			$close[ $tag ] = self::boundary_delimiter( $tag, 'close' );
		}

		$void = array();
		foreach ( self::void_boundary_tags() as $tag ) {
			$void[ $tag ] = self::boundary_delimiter( $tag, 'void' );
		}

		return array(
			'excluded_tags'        => self::have_exclude_tags(),
			'delimiter_characters' => self::delimiter_characters(),
			'closing_characters'   => self::closing_characters(),
			'default_delimiter'    => self::default_delimiter(),
			'boundary_delimiters'  => $close,
			'void_delimiters'      => $void,
		);
	}
}
