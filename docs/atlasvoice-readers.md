# AtlasVoice — Custom-field Readers (developer guide)

The `TTA\AtlasVoice\Readers\*` classes can pull text values from popular
custom-field plugins and append them to the audio AtlasVoice generates
for a post.

**They are dormant by default.** This document explains why, when (and
when not) to enable them, and exactly how.

---

## TL;DR — enable in two lines

Drop this in your theme's `functions.php` or a tiny mu-plugin:

```php
add_filter( 'atlasvoice_extra_field_text', function ( array $extra, int $post_id ) {
    if ( ! class_exists( '\\TTA\\AtlasVoice\\Readers\\ReaderRegistry' ) ) {
        return $extra;
    }
    return array_merge( $extra, \TTA\AtlasVoice\Readers\ReaderRegistry::read_all( $post_id ) );
}, 10, 2 );
```

That's it. Every text-like custom field on the post — across ACF,
Meta Box, Pods, JetEngine, Toolset Types, and Carbon Fields — will be
appended to the generated audio, separated by the configured sentence
delimiter (`tts_sentence_delimiter` filter, defaults to `". "`).

---

## Why are the readers dormant by default?

The maturing **step-rail picker** (Content region + Skip-these-areas +
Skip-tags + Skip-phrases + drag-to-include / drag-to-exclude) already
lets admins point AtlasVoice at any rendered field through normal CSS
selectors. That covers ~95% of practical cases.

Wiring a parallel "always voice every custom field" pipeline competes
with the picker's promise that *what you select is what gets read*. It
also reads aloud values the theme intentionally hides — overriding
editorial decisions made elsewhere on the site.

So readers ship loadable but unused. The escape hatch above exists for
the rare case where:

- Your theme renders a field in markup the picker can't cleanly select
  (deeply nested, JS-rendered, lazy-loaded behind a tab).
- You're driving a headless / API consumer where there is no rendered
  DOM at extract time.
- You have a server-side warm cache that pre-renders audio outside any
  visitor request.

If none of those describe you, **don't enable readers** — pick the
fields with the rail and you'll get more predictable output.

---

## Filter contract

There are two filters, layered. You only need to know about the
**developer-facing** one (`atlasvoice_extra_field_text`); the other
exists for plugin-internal isolation (P1 — keeps the legacy code path
byte-identical when AtlasVoice is uninstalled).

### Developer-facing filter

```php
/**
 * @param string[] $extra_texts Default empty array. Each string is
 *                              appended to the spoken text after the
 *                              main extracted body, joined by
 *                              `tts_sentence_delimiter`.
 * @param int      $post_id     The post whose audio is being assembled.
 * @return string[]             Modified array; non-string values are
 *                              dropped, every entry is wp_strip_all_tags()
 *                              and trim()-ed before joining.
 */
apply_filters( 'atlasvoice_extra_field_text', array(), $post_id );
```

If `$post_id` is `0` (no post context, e.g. a shortcode reading raw
text), the filter does **not** fire — there's no post to query for
custom fields.

### Plumbing (informational)

The free plugin emits a single one-line filter inside `tta_get_button_content()`
(`includes/helpers.php`):

```php
$content = apply_filters( 'atlasvoice_after_clean_content', $content, $post );
```

`TTA\AtlasVoice\ReadersIntegration::append_extras()` (in
`includes/atlasvoice/ReadersIntegration.php`) listens on that hook,
calls `atlasvoice_extra_field_text` for the dev opt-in payload, and
appends each returned string to `$content` joined by
`tts_sentence_delimiter`. Deleting `includes/atlasvoice/` cleanly
removes the listener; the legacy filter call returns its first arg
unchanged when no listener is attached.

---

## Per-reader configuration

`ReaderRegistry::read_all()` accepts a second `$options` array forwarded
to every reader's `read()`:

| Key            | Type      | Default | Effect |
| -------------- | --------- | ------- | ------ |
| `field_names`  | string[]  | `[]`    | Allowlist. When non-empty, only fields whose name appears here are read. |
| `max_fields`   | int       | `50`    | Hard ceiling so a runaway repeater can't make audio generation slow. |

Example — voice only the `recipe_ingredients` and `recipe_instructions`
ACF fields, capped at 20 entries:

```php
add_filter( 'atlasvoice_extra_field_text', function ( $extra, $post_id ) {
    return array_merge( $extra, \TTA\AtlasVoice\Readers\ReaderRegistry::read_all(
        $post_id,
        array(
            'field_names' => array( 'recipe_ingredients', 'recipe_instructions' ),
            'max_fields'  => 20,
        )
    ) );
}, 10, 2 );
```

---

## Calling individual readers

If you only want one plugin's fields, skip the registry:

```php
use TTA\AtlasVoice\Readers\AcfReader;

add_filter( 'atlasvoice_extra_field_text', function ( $extra, $post_id ) {
    if ( ! AcfReader::is_available() ) { return $extra; }
    $reader = new AcfReader();
    return array_merge( $extra, $reader->read( $post_id ) );
}, 10, 2 );
```

`is_available()` returns `false` cleanly when the underlying plugin
isn't installed, so wrapping calls in feature checks is optional but
recommended.

---

## Available readers

| Class                | Plugin                  | Detection |
| -------------------- | ----------------------- | --------- |
| `AcfReader`          | Advanced Custom Fields  | `function_exists('acf_get_field_groups')` |
| `MetaBoxReader`      | Meta Box (rwmb_*)       | `class_exists('RWMB_Core')` |
| `PodsReader`         | Pods Framework          | `function_exists('pods')` |
| `JetEngineReader`    | JetEngine (Crocoblock)  | `function_exists('jet_engine')` |
| `ToolsetReader`      | Toolset Types           | `function_exists('wpcf_admin_fields_get_fields')` |
| `CarbonFieldsReader` | Carbon Fields           | `function_exists('carbon_get_post_meta')` |

Each reader catches `\Throwable` around every plugin-API call, so a
broken reader can never bring down audio extraction — it just returns
an empty array and the next reader runs.

---

## Re-disabling after enabling

Remove the filter callback you added (or set its priority callback to
return the unmodified `$extra`). The classes themselves stay loaded
either way; they have no side effects unless `read_all()` is called.

---

## Where this is documented in the planning record

- Plan §13 row D13 — marks readers explicitly dormant + rationale.
- Plan §18 revision log entry `2026-04-28 — D13 finalised (Readers ship dormant)`.
- `ReaderRegistry::class` docblock — top-of-file note for anyone
  spelunking the source.

If you decide to wire readers into core for a future release,
re-read those entries first — the dormancy is a deliberate design
choice, not an oversight.
