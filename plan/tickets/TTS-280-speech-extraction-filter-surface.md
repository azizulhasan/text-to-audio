# TTS-280 — Speech extraction: one filterable surface for excluded tags, delimiters and block boundaries (SSML-ready)

Reported by Yvonne Hayes (world-outlook.com): the generated MP3 does not pause between blocks.
Two weeks of her snippets failed because the hook she was told to target is not the one the plugin uses.
Investigated 2026-08-25 against **20 of her posts (1,395 blocks)**.

---

## Scope decision

- **Free reads content via PHP only.** No DOM extractor in Free.
- **Pro keeps both paths** and continues to choose with `get_content_from_dom`
  (`TTSProHelper.js:1261`, defaults `true`, already behind the `ttsProGetContentFromDOM` filter).
- **Defaults and filters live in Free**, because Pro hard-depends on Free. The DOM implementation stays Pro-only.
- **SSML is out of scope here** but must not require a rewrite later — see *The SSML seam*.

---

## Root cause: two implementations that disagree

| | PHP path — `TTA_Hooks.php:497` | DOM path — `TTSProHelper.js:382` |
|---|---|---|
| Tag list filter | `tts_delimiter_addable_tags` | `tts_pro_delimiter_addable_tags` |
| Default tags | `h1`–`h6` | `h1`–`h6`, `li` |
| Delimiter source | `tts_sentence_delimiter` filter | `tta__sentence_delimiter` **setting** |
| "Already punctuated?" | regex lookahead | hardcoded character list |

The same post produces different spoken text depending on which path ran, `tts_sentence_delimiter`
is silently ignored in Pro, and a snippet author must guess which of two filter names applies.

### The structural bug behind the whole ticket

`TTSProHelper.js:161-171` force-pushes `figure` and `figcaption` onto the exclude list **after** the
user's setting is read. Nothing set in the UI or in a filter can win. That is why no snippet Yvonne
wrote could ever have worked.

---

## Measured on her 20 posts (1,395 blocks)

| Block | Count | Posts |
|---|---|---|
| Paragraph | 1,232 | — |
| **Separator** | **116** | **20/20** |
| **Jetpack subscriptions** | **40** | **20/20** |
| Image | 87 | — |
| Heading | 24 | — |
| Pullquote | 5 | 2/20 |
| **Table** | **0** | **0/20** |

- Only **173 blocks (12.4%)** end without a terminator, and most are captions and `*` dividers, not
  prose — so "add a full stop where missing" changes almost nothing she can hear.
- **191 blocks end in a closing quote or bracket; 93 of those are already punctuated before the
  closer**, so today we append a second stop and produce `.”.` — 7% of her content.
- Her audio currently speaks *"Type your email… Subscribe"* twice per article, from the Jetpack
  block, which she has not even reported.

---

## Defects fixed by this ticket

| # | Defect |
|---|---|
| D1 | `figure` force-pushed after the setting — pullquotes and tables silently dropped, unoverridable |
| D2 | Closing quotes/brackets not walked past — produces `.”.` (93 occurrences on one site) |
| D3 | `delimiterArr` is Latin/Spanish/Arabic only — CJK/Devanagari get a second wrong-script stop (all 81 languages) |
| D4 | PHP `substr()` is byte-based so multibyte endings never match; JS `slice(-1)` splits surrogate pairs |
| D5 | Ellipsis is not a terminator — produces `….` |
| D6 | `cite`, `pre`, verse missing from the tag list — blocks run together |
| D7 | Separators produce no pause at all; `hr` is void so a closing-tag rule can never reach it (116 in her posts) |
| D8 | Two filter names for one job, and `tts_sentence_delimiter` ignored on the DOM path |
| D9 | **The DOM path reads a setting nobody can set.** `tta__sentence_delimiter` is written once by `TTA_Activator.php:199` as `"."` and has **no UI**. Four JS sites (`TTSProHelper.js:215, 385, 427, 700`) treat it as the source of truth, so the delimiter is effectively frozen at `.` in Pro and the `tts_sentence_delimiter` filter can never reach it. |
| D10 | PHP itself is inconsistent about the default: `'. '` at `helpers.php:219`, `TTA_Helper.php:428` and `StepRail.php:142`, but `'.'` at `TTA_Hooks.php:499` and `TTA_Helper.php:1414` — a trailing space present or absent depending on which line ran. |

**Not fixed here: pause _length_.** A full stop is a short pause; a structural pause needs SSML.
Her blocks already end in full stops, so this ticket fixes her pullquotes, her Jetpack junk and her
separators — not how long the pause lasts.

---

## Design

One source of truth in Free: a new class `TTA\TTA_Speech`. **Every list is produced by a filter and
nothing is appended after the filter runs.** Pro consumes a localised payload and hardcodes nothing.

### Method naming

Free's PHP and Pro's JS were doing the same three jobs under different names. They now carry **the
same name**, written in WordPress PHP style (snake_case), so a reader moving between the two files
does not have to re-learn the vocabulary:

| Pro JS (`TTSProHelper.js`) | Free PHP (`TTA_Speech`) | Job |
|---|---|---|
| `haveExcludeTags()` | `have_exclude_tags()` | What is not spoken |
| `ttaShouldAddDelimiter()` | `tta_should_add_delimiter()` | Is this text already punctuated |
| `addDelimiterIfNeed()` | `add_delimiter_if_need()` | Insert the boundaries |

**Only these three cross over.** The rest of `TTSProHelper.js` — `removeDoubleDelimiters()`,
`htmlToString()`, `stringToHtml()`, `escapeRegex()`, `convertSentencesToArray()`, the number and
currency helpers — stays JS-only. They are DOM plumbing or Pro-only playback concerns and have no
business in Free.

`remove_double_delimiters()` is deliberately **not** ported: the new `tta_should_add_delimiter()`
walks back past closing marks before deciding, so PHP never creates a double in the first place.
Porting a cleanup for a defect we stopped producing would be dead code.

The remaining `TTA_Speech` methods (`void_boundary_tags()`, `delimiter_addable_tags()`,
`delimiter_characters()`, `closing_characters()`, `default_delimiter()`, `boundary_delimiter()`,
`payload()`) are filter accessors and the SSML seam. They have no JS counterpart to mirror.

The global helper in `helpers.php` is **renamed** `tta_should_add_delimiter()` → `tta_append_delimiter()`,
because the name should describe what it returns and "append" does while "should" does not. Its 7
callers move with it (5 in `helpers.php`, `TTA_Helper.php:428`, `TTA_Pro_Api_Routes.php:2960`), and
the old name stays as a deprecated one-line wrapper — **which is load-bearing, not politeness**: an
old Pro still calls `tta_should_add_delimiter()` at `TTA_Pro_Api_Routes.php:2960`, so deleting it
would fatal every site that updates Free before Pro. See *Update-order safety*.

### Filters (final names)

| Filter | Purpose |
|---|---|
| `tta__settings_exclude_tags` | Global include/exclude, seeded from the Settings UI. Only `script`/`style` are non-negotiable. `figure` stays excluded **by default** via the setting, so image captions stay out; a site wanting pullquotes read removes it. |
| `tts_delimiter_addable_tags` | One name for both paths. `tts_pro_delimiter_addable_tags` kept as a deprecated alias so existing snippets keep working. |
| `tta_delimiter_characters` | Terminator characters, multilingual. |
| `tta_closing_characters` | Closers to walk back past before deciding. |
| `tta_void_boundary_tags` | Tags that mark a boundary but carry no text (`hr`). |
| `tta_boundary_delimiter` | **The SSML seam.** Receives `(delimiter, tag, boundary_type)`. |
| `tts_sentence_delimiter` | The default string, now honoured on **both** paths and with **one** default (`'. '`). |

Jetpack is deliberately **not** excluded by default — it is a filter opt-in.

### The delimiter comes from the filter, never from a setting

`tta__sentence_delimiter` has no UI. It is an activation default masquerading as user config, and
reading it in JS is what makes `tts_sentence_delimiter` unreachable in Pro (D9). After this ticket:

- **PHP resolves the delimiter** through `tts_sentence_delimiter`, once, in `default_delimiter()`.
- **JS never reads `settings.recording.tta__sentence_delimiter` again.** All four sites take the
  resolved value out of the localised payload.
- The activation default stays in the options row for backward compatibility but is no longer
  consulted by any code path. Removing it is a separate cleanup.

A filter is the right surface here precisely *because* there is no UI: a value the user cannot set
is not a setting, and pretending otherwise gave us a knob that looked adjustable and was not.

### The SSML seam

What gets inserted at a boundary is decided by `tta_boundary_delimiter` **with context**, never as a
fixed string at the insertion site. Today it returns punctuation. When SSML lands it returns
`<break time="600ms"/>` for a given tag and **no insertion site changes**.

Because JS cannot call `apply_filters`, `payload()` resolves the delimiter **per tag** in PHP and
ships a map — which is what keeps the seam working on the DOM path too.

The only genuinely new work when SSML arrives is provider-side: Google Cloud TTS needs
`input.ssml` instead of `input.text`, and `&`/`<`/`>` must be escaped. That is a provider-layer
concern this design does not touch.

---

## New file — `text-to-audio/includes/TTA_Speech.php`

```php
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
 */
class TTA_Speech {

	/** Void tags that mark a boundary but carry no text (a separator). */
	public static function void_boundary_tags() {
		return (array) apply_filters( 'tta_void_boundary_tags', array( 'hr' ) );
	}

	/**
	 * Mirrors haveExcludeTags() in TTSProHelper.js.
	 *
	 * Global include/exclude list, seeded from the Settings UI value
	 * (pipe-separated). Only script/style are non-negotiable; 'figure' comes from
	 * the setting so a site can remove it and have pullquotes read aloud.
	 */
	public static function have_exclude_tags() {
		$settings = TTA_Helper::tts_get_settings( 'settings' );
		$tags     = isset( $settings['tta__settings_exclude_tags'] ) ? $settings['tta__settings_exclude_tags'] : '';

		if ( ! is_array( $tags ) ) {
			$tags = explode( '|', (string) $tags );
		}

		$tags = array_values( array_filter( array_map( 'trim', $tags ) ) );

		foreach ( array( 'script', 'style' ) as $required ) {
			if ( ! in_array( $required, $tags, true ) ) {
				$tags[] = $required;
			}
		}

		return array_values( array_unique( (array) apply_filters( 'tta__settings_exclude_tags', $tags ) ) );
	}

	/** Tags whose closing tag ends a spoken unit. */
	public static function delimiter_addable_tags() {
		$tags = array(
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'li', 'blockquote', 'cite', 'figcaption',
			'pre', 'dd', 'dt', 'td', 'th',
		);

		// Deprecated Pro alias, kept so existing customer snippets keep working.
		$tags = (array) apply_filters( 'tts_pro_delimiter_addable_tags', $tags );

		return array_values( array_unique( (array) apply_filters( 'tts_delimiter_addable_tags', $tags ) ) );
	}

	/** Characters that already end a sentence, across scripts. */
	public static function delimiter_characters() {
		return (array) apply_filters( 'tta_delimiter_characters', array(
			'.', ',', '?', '!', '|', ';', ':', '…',
			'¿', '¡', '،', '؟', '۔', '؛',
			'。', '！', '？', '，', '、', '；', '：',
			'।', '॥', '։', '՞', '።', '፡', '·',
		) );
	}

	/** Closing marks to look past before deciding if text is punctuated. */
	public static function closing_characters() {
		return (array) apply_filters( 'tta_closing_characters', array(
			'"', "'", '”', '’', ')', ']', '}', '»', '›', '」', '』', '）', '】',
		) );
	}

	/**
	 * The default delimiter string — the ONLY place it is decided.
	 *
	 * TTS-280: deliberately NOT read from the tta__sentence_delimiter setting.
	 * That key has no UI, is written once at activation, and reading it in JS is
	 * what made this filter unreachable in Pro. One default ('. ') everywhere;
	 * PHP previously disagreed with itself about the trailing space.
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

		return false;
	}

	/**
	 * Mirrors addDelimiterIfNeed() in TTSProHelper.js.
	 *
	 * Insert boundary delimiters into an HTML string (the PHP path).
	 */
	public static function add_delimiter_if_need( $html ) {
		$html = (string) $html;

		// Void tags first. <hr> has no closing tag, so a </tag> rule can never give
		// a separator a pause — 116 separators on one customer site produced none.
		foreach ( self::void_boundary_tags() as $tag ) {
			$delimiter = self::boundary_delimiter( $tag, 'void' );
			$html      = preg_replace(
				'#<\s*' . preg_quote( $tag, '#' ) . '\b[^>]*>#i',
				$delimiter,
				$html
			);
		}

		$tags = self::delimiter_addable_tags();

		if ( empty( $tags ) ) {
			return $html;
		}

		$quoted  = array_map( function ( $tag ) { return preg_quote( $tag, '#' ); }, $tags );
		$pattern = '#</\s*(' . implode( '|', $quoted ) . ')\s*>#i';

		if ( ! preg_match_all( $pattern, $html, $matches, PREG_OFFSET_CAPTURE ) ) {
			return $html;
		}

		// Walk backwards so earlier byte offsets stay valid as we insert.
		for ( $i = count( $matches[0] ) - 1; $i >= 0; $i-- ) {
			$whole  = $matches[0][ $i ][0];
			$offset = $matches[0][ $i ][1];
			$tag    = strtolower( $matches[1][ $i ][0] );

			$before = wp_strip_all_tags( substr( $html, 0, $offset ) );

			if ( ! self::tta_should_add_delimiter( $before ) ) {
				continue;
			}

			$delimiter = self::boundary_delimiter( $tag, 'close' );
			$html      = substr_replace( $html, $whole . $delimiter, $offset, strlen( $whole ) );
		}

		return $html;
	}

	/**
	 * Everything the DOM path needs. Boundary delimiters are RESOLVED per tag here,
	 * so the PHP filter reaches JS — JS cannot call apply_filters, and this is what
	 * keeps the SSML seam working on both paths.
	 *
	 * 'default_delimiter' replaces every JS read of the tta__sentence_delimiter
	 * setting (D9).
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
```

---

## Changed — `text-to-audio/includes/TTA_Hooks.php:497`

The PHP path stops owning any of this logic.

```php
	public function tta_before_clean_content_callback( $htmlString ) {
		// TTS-280: all boundary logic now lives in TTA_Speech so the PHP and DOM
		// paths cannot drift apart. Previously this held its own tag list, its own
		// delimiter lookup and its own regex-lookahead "already punctuated" test.
		$htmlString = TTA_Speech::add_delimiter_if_need( $htmlString );

		return apply_filters( 'tta_pro_before_clean_content', $htmlString );
	}
```

---

## Changed — `text-to-audio/includes/helpers.php`, global helper renamed

`tta_should_add_delimiter()` → `tta_append_delimiter()`. Same signature, same return, honest name.
It stops carrying its own idea of what "punctuated" means and delegates to the class.

```php
/**
 * TTS-280: renamed from tta_should_add_delimiter(). It appends and returns a
 * string; it does not answer a yes/no question, and the old name said it did.
 */
function tta_append_delimiter( $title, $delimiter )
{
	// One definition of "already punctuated", shared with the DOM path.
	if ( ! \TTA\TTA_Speech::tta_should_add_delimiter( $title ) ) {
		return $title . ' ';
	}

	return $title . $delimiter . ' ';
}

/**
 * TTS-280: deprecated alias. DO NOT REMOVE without bumping Pro's minimum Free
 * version — an un-updated Pro calls this from TTA_Pro_Api_Routes.php:2960, so a
 * user who updates Free before Pro gets a fatal on every generation request.
 */
function tta_should_add_delimiter( $title, $delimiter )
{
	return tta_append_delimiter( $title, $delimiter );
}
```

Callers to update: `helpers.php:238, 264, 280, 285`, `TTA_Helper.php:428`,
`TTA_Pro_Api_Routes.php:2960`.

---

## Changed — Free localisation (`helpers.php`, alongside `get_content_from_dom`)

```php
		// TTS-280: the DOM path consumes this instead of hardcoding lists and
		// instead of reading the UI-less tta__sentence_delimiter setting.
		'speech' => \TTA\TTA_Speech::payload(),
```

---

## Changed — `text-to-audio-pro/Assets/js/TTSProHelper.js`

### `:161-171` — stop force-pushing after the user's setting

```js
    if (haveExcludeTags(tts)) {
        let selectors = haveExcludeTags(tts)
        htmlSelectors[selectors.key] = selectors.value;
    } else {
        // TTS-280: no tag is appended after the filter has run. 'figure' now comes
        // from tta__settings_exclude_tags like everything else, so removing it in
        // the UI (or via the filter) actually reads pullquotes aloud instead of
        // being silently overridden here.
        //
        // The fallback reproduces the OLD hardcoded push on purpose: if Pro is
        // updated before Free, speech.excluded_tags is undefined, and falling back
        // to ['script','style'] would start reading every image caption aloud on
        // sites that changed nothing. Absent payload => old behaviour, exactly.
        htmlSelectors['tta__settings_exclude_tags'] =
            window.TTS?.settings?.speech?.excluded_tags
            ?? ['script', 'style', 'figure', 'figcaption'];
    }
```

### `:88` — `haveExcludeTags()` prefers the filtered list

```js
    // TTS-280: PHP-filtered list first, so tta__settings_exclude_tags applies on
    // both sides; raw setting only as a fallback.
    let exclude_tags = window.TTS?.settings?.speech?.excluded_tags
        ?? ttsObj.settings?.settings?.tta__settings_exclude_tags;
```

### `:215`, `:385`, `:427`, `:700` — the delimiter comes from the filter, not the setting

All four sites currently read a setting that has no UI, which is what makes
`tts_sentence_delimiter` unreachable in Pro (D9). Every one of them becomes:

```js
    // TTS-280: resolved in PHP by tts_sentence_delimiter. The old
    // settings.recording.tta__sentence_delimiter read survives ONLY as the
    // update-order fallback — that key has no UI, is written once at activation,
    // and treating it as the source of truth froze the delimiter at '.' for every
    // Pro site while silently ignoring the filter. Once Pro's minimum Free version
    // is raised past this release, drop the middle term.
    const delimiter = window.TTS?.settings?.speech?.default_delimiter
        ?? ttsObj.settings?.recording?.tta__sentence_delimiter
        ?? '. ';
```

`:427` is inside `removeDoubleDelimiters()` and uses `let`; keep `let` there, change only the source.

### `:191` — `ttaShouldAddDelimiter()` becomes closer-aware and multilingual

```js
export const ttaShouldAddDelimiter = (string, isCheckByOnlyDelimiter = false) => {
    const speech  = window.TTS?.settings?.speech ?? {};
    const enders  = speech.delimiter_characters ?? ['.', ',', '?', '!', ';', ':', '…'];
    const closers = speech.closing_characters ?? ['"', "'", '”', '’', ')', ']'];

    const text = String(string ?? '').trim();
    if (!text) { return false; }

    // TTS-280: Array.from, not slice(-1) — slice splits surrogate pairs so the
    // check never matched for characters outside the BMP. Then walk back past any
    // run of closing marks: '…that.”' is punctuated, '…possible”' is not. 93 of
    // 191 closer-ending blocks on one customer site were already punctuated and
    // were being given a second stop.
    const chars = Array.from(text);
    for (let i = chars.length - 1; i >= 0; i--) {
        if (closers.includes(chars[i])) { continue; }
        return !enders.includes(chars[i]);
    }

    return false;
}
```

### `:382` — `addDelimiterIfNeed()` uses the resolved per-tag map

```js
function addDelimiterIfNeed(html, tts) {
    const speech = window.TTS?.settings?.speech ?? {};

    // TTS-280: if Pro is updated before Free the payload is absent. An empty map
    // would mean tags.length === 0 and this function would return having inserted
    // NOTHING — no pauses anywhere, a worse regression than the bug we are fixing.
    // So rebuild the old defaults locally when the payload is missing.
    const fallbackDelimiter = ttsObj.settings?.recording?.tta__sentence_delimiter ?? '. ';
    const fallbackClose = ['h1','h2','h3','h4','h5','h6','li'].reduce(
        (map, tag) => { map[tag] = fallbackDelimiter; return map; }, {}
    );

    const close = speech.boundary_delimiters ?? fallbackClose;
    const voids = speech.void_delimiters ?? {};   // hr pauses are new; absent = old behaviour.

    let htmlString = htmlToString(html);

    // TTS-280: void boundaries first — <hr> has no closing tag, so the rule below
    // can never reach a separator.
    Object.keys(voids).forEach(function (tag) {
        htmlString = htmlString.replace(
            new RegExp('<\\s*' + tag + '\\b[^>]*>', 'gi'),
            voids[tag]
        );
    });

    const tags = Object.keys(close);
    if (!tags.length) { return stringToHtml(htmlString); }

    const pattern = new RegExp('(<\\s*\\/\\s*(?:' + tags.join('|') + ')\\s*>)', 'gi');

    htmlString = htmlString.replace(pattern, (match, p1, offset) => {
        const tag = match.replace(/[<>\/\s]/g, '').toLowerCase();
        // TTS-280: the delimiter is resolved per tag in PHP by
        // tta_boundary_delimiter, so SSML later needs no change here.
        const delimiter = close[tag] ?? '';
        const before = htmlToString(htmlString.slice(0, offset));

        return ttaShouldAddDelimiter(before) ? `${match}${delimiter}` : match;
    });

    return stringToHtml(htmlString);
}
```

---

## Customer-facing result

Yvonne's snippet becomes a single line that actually works:

```php
// Read pullquotes aloud (removes 'figure' from the exclude list).
add_filter( 'tta__settings_exclude_tags', function ( $tags ) {
	return array_values( array_diff( $tags, array( 'figure' ) ) );
} );
```

```php
// Stop reading the Jetpack subscription form (spoken twice per article today).
add_filter( 'tta__settings_exclude_tags', function ( $tags ) {
	$tags[] = '.wp-block-jetpack-subscriptions';
	return $tags;
} );
```

```php
// Longer pause after headings, once SSML lands — no plugin change required.
add_filter( 'tta_boundary_delimiter', function ( $delimiter, $tag, $type ) {
	return in_array( $tag, array( 'h1', 'h2', 'h3' ), true ) ? '. . ' : $delimiter;
}, 10, 3 );
```

---

## Update-order safety — MANDATORY

WordPress updates plugins independently. A user may update Free first, Pro first, or sit on one of
them for months. **Changed spoken output is acceptable; a broken site is not.** Every item below is
a release blocker, not a nice-to-have.

### Free updated first, Pro still old

| Coupling | Outcome |
|---|---|
| Old Pro calls `tta_should_add_delimiter()` (`TTA_Pro_Api_Routes.php:2960`) | **Deprecated wrapper must ship in the same Free release.** Without it: fatal on every generation request. |
| Old Pro filters `tts_pro_delimiter_addable_tags` | Still applied by `delimiter_addable_tags()` as an alias. Safe. |
| Old Pro JS reads `recording.tta__sentence_delimiter` | The option row is **not** deleted. Safe. |
| New Free localises `speech` | Old Pro ignores the extra key. Safe. |
| Old Pro JS owns its own lists | DOM path behaves exactly as today until Pro updates. Safe. |

### Pro updated first, Free still old — the dangerous direction

| Coupling | Outcome |
|---|---|
| New Pro PHP calling `\TTA\TTA_Speech::*` | **FATAL** — class does not exist in old Free. Every such call site must be `class_exists( '\TTA\TTA_Speech' )`-guarded and fall through to the pre-TTS-280 code. Known sites: `TTA_Pro_Helper.php:1665`, `TTA_Pro_Actions.php:77-78`. See *The guard pattern*. |
| `speech.excluded_tags` undefined | Fallback restores `figure`/`figcaption`, so captions are not suddenly read aloud. |
| `speech.boundary_delimiters` undefined | Fallback rebuilds `h1`–`h6` + `li` locally. An empty map would have removed **all** pauses. |
| `speech.default_delimiter` undefined | Falls back to the old setting read, then `'. '`. |
| `speech.void_delimiters` undefined | No `hr` pause — that is the old behaviour, which is correct for an old Free. |

**Rule for every new JS read: the fallback must reproduce today's behaviour, never a bare minimum.**
A `?? []` or `?? {}` that silently disables a feature is a regression disguised as a default.

### The guard pattern — `class_exists()` in PHP, payload-presence in JS

One rule, expressed twice because JS cannot test a PHP class: **ask whether the new surface is
there; if it is not, run exactly what ran before.** Never assume Free has been updated.

Pro's PHP already owns a copy of the tag list at `TTA_Pro_Helper.php:1665`. It delegates, guarded:

```php
	/**
	 * TTS-280: delegate to Free's single source of truth when it exists.
	 *
	 * The guard is not defensive style — it is the update-order contract. A user
	 * who updates Pro before Free has no TTA_Speech class, and an unguarded static
	 * call is a fatal on every page that renders a player.
	 */
	public static function get_delimiter_addable_tags() {

		if ( class_exists( '\TTA\TTA_Speech' ) ) {
			return \TTA\TTA_Speech::delimiter_addable_tags();
		}

		// Old Free still installed — behave exactly as this release always has.
		return apply_filters( 'tts_pro_delimiter_addable_tags', [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li' ] );
	}
```

Same shape where Pro localises to JS (`TTA_Pro_Actions.php:77-78`), so the `speech` key is simply
absent on an old Free rather than half-populated:

```php
		// TTS-280: only ship the key when Free can actually produce it. Absent key
		// is the signal JS uses to keep its old behaviour — a partially-filled key
		// would be worse than none.
		if ( class_exists( '\TTA\TTA_Speech' ) ) {
			$data['speech'] = \TTA\TTA_Speech::payload();
		}
```

And the JS side of the same contract — one gate read once, not a `??` scattered per call site:

```js
// TTS-280: the JS equivalent of class_exists(). If Free has not been updated the
// payload is absent, and every consumer below falls back to the pre-TTS-280 code.
const ttaSpeechAvailable = () => !!window.TTS?.settings?.speech?.boundary_delimiters;
```

**Every Pro PHP call into `\TTA\TTA_Speech` added by this ticket must sit behind that
`class_exists()`.** A review of the diff that finds one unguarded static call blocks the release.

### Sequencing

1. Ship **Free first** with `TTA_Speech`, the deprecated wrapper, and the `speech` payload. Free is
   fully correct on its own PHP path and Pro is untouched.
2. Ship **Pro second**, consuming the payload, with `class_exists()` guards on every PHP call.
3. Raise Pro's minimum Free version in a **later** release, then delete the fallbacks and the
   deprecated wrapper. Not in this ticket.

### Regenerated audio is not "breakage" — but confirm the cost

Changed extraction changes the text hash, so existing MP3s regenerate. Confirm before release:
regeneration is **on demand**, not a bulk sweep on update. A mass re-generation would mean a
surprise vendor bill for ElevenLabs/Google Cloud customers and a load spike on our own gTTS server.
Verify against `getContentSettingsFingerprint()` (`TTSProHelper.js:1183`) before shipping.

---

## Acceptance criteria

1. A pullquote is spoken; today it is silently dropped.
2. A table is spoken.
3. A block already ending in a full stop before a closing quote gets no second stop.
4. A CJK block ending in `。` gets no Latin stop appended.
5. An ellipsis counts as a terminator.
6. A separator produces a break.
7. `cite`, `pre` and verse no longer run into the next block.
8. Removing `figure` via the filter restores pullquote reading exactly.
9. Free (PHP path) and Pro (DOM path) produce the same spoken string for the same post.
10. `tts_sentence_delimiter` changes the spoken output on **both** paths; `tta__sentence_delimiter`
    is no longer read anywhere.
11. An existing site with no filters and no changed settings produces byte-identical output apart
    from the fixed defects.
12. **New Free + old Pro**: no fatal, DOM path unchanged, generation still works.
13. **New Pro + old Free**: no fatal, captions still excluded, pauses still inserted.
14. Both above verified on a real install by updating one plugin only and playing a post — not by
    reading the code.
15. Every Pro PHP call into `\TTA\TTA_Speech` is `class_exists()`-guarded with a fall-through to the
    pre-TTS-280 code; one unguarded static call blocks the release.

---

## Risk

Changing extraction changes the text hash, so cached MP3s regenerate. Confirm the regeneration path
is acceptable before release.
