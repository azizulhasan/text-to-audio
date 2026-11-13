<?php
/**
 * Help topics shown by the in-plugin Help screen (TTS-347).
 *
 * @package TTA
 */

namespace TTA\Help;

defined( 'ABSPATH' ) || exit;

/**
 * One topic per screen, tab, setup step and stand-alone section.
 */
class Help_Topics {

	/**
	 * Base address of the documentation pages. Must end with a slash.
	 */
	const DOCS_BASE = 'https://atlasaidev.com/docs/atlasvoice/';

	/**
	 * All help topics, keyed by route id ('screen', 'screen:tab' or 'screen:tab#section').
	 *
	 * @return array<string, array> Topics in display order.
	 */
	public static function all() {
		$topics = array(
			'overview'            => self::topic(
				__( 'Read your Home screen', 'text-to-audio' ),
				array(
					__( 'The top line says who can hear the player right now.', 'text-to-audio' ),
					__( 'The four steps show your voice, player, content and live status. Click one to change it.', 'text-to-audio' ),
					__( 'The cards below show plays and anything that needs you.', 'text-to-audio' ),
				),
				'home',
				'2:00'
			),
			'setup'               => self::topic(
				__( 'Set up AtlasVoice', 'text-to-audio' ),
				array(
					__( 'Follow the steps on the left, top to bottom.', 'text-to-audio' ),
					__( 'Each step saves when you click Continue. You can leave and come back.', 'text-to-audio' ),
					__( 'The last step checks a real post and lets you go live.', 'text-to-audio' ),
				),
				'setup',
				'3:00'
			),
			'setup:hear'          => self::topic(
				__( 'Setup step: hear it', 'text-to-audio' ),
				array(
					__( 'Press Listen on the sample post.', 'text-to-audio' ),
					__( 'If you hear nothing, check your device volume and try another browser.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-hear-it',
				'1:00'
			),
			'setup:where'         => self::topic(
				__( 'Setup step: where the player appears', 'text-to-audio' ),
				array(
					__( 'Tick the content types that should get a player.', 'text-to-audio' ),
					__( 'Posts is a good start; add more later.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-where',
				'1:30'
			),
			'setup:voice'         => self::topic(
				__( 'Setup step: choose the voice', 'text-to-audio' ),
				array(
					__( 'Pick what makes the sound: the device voice or a natural voice.', 'text-to-audio' ),
					__( 'Press play on a voice to hear it.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-voice',
				'2:00'
			),
			'setup:look'          => self::topic(
				__( 'Setup step: choose the look', 'text-to-audio' ),
				array(
					__( 'Pick a style. Classic teal matches older AtlasVoice sites.', 'text-to-audio' ),
					__( 'The preview shows your choice at once.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-look',
				'1:30'
			),
			'setup:mp3'           => self::topic(
				__( 'Setup step: audio files', 'text-to-audio' ),
				array(
					__( 'Choose when audio files are made.', 'text-to-audio' ),
					__( 'Choose who may download them.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-audio-files',
				'1:30',
				true
			),
			'setup:report'        => self::topic(
				__( 'Setup step: email reports', 'text-to-audio' ),
				array(
					__( 'Turn the report on or off.', 'text-to-audio' ),
					__( 'Choose how often and who receives it.', 'text-to-audio' ),
					__( 'Click Continue.', 'text-to-audio' ),
				),
				'setup-reports',
				'1:00',
				true
			),
			'setup:live'          => self::topic(
				__( 'Setup step: check and go live', 'text-to-audio' ),
				array(
					__( 'Open the test post and listen as a visitor.', 'text-to-audio' ),
					__( 'Use Test on your phone to hear it on a real phone.', 'text-to-audio' ),
					__( 'Choose Go live, or finish in staging and go live later.', 'text-to-audio' ),
				),
				'setup-go-live',
				'2:00'
			),
			'voice:voice'         => self::topic(
				__( 'Choose your voice', 'text-to-audio' ),
				array(
					__( 'Choose what makes the sound.', 'text-to-audio' ),
					__( 'Pick a language, then press play on a voice to hear it.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'voice-choose',
				'3:00'
			),
			'voice:pronunciation' => self::topic(
				__( 'Fix how a word is said', 'text-to-audio' ),
				array(
					__( 'Click Add a word.', 'text-to-audio' ),
					__( 'Type the word as written, then how it should sound.', 'text-to-audio' ),
					__( 'Use Try it to listen, then Save changes.', 'text-to-audio' ),
				),
				'voice-pronunciation',
				'2:30'
			),
			'voice:languages'     => self::topic(
				__( 'Use a voice for each language', 'text-to-audio' ),
				array(
					__( 'AtlasVoice finds your multilingual plugin by itself.', 'text-to-audio' ),
					__( 'Pick a voice for each language in the list.', 'text-to-audio' ),
					__( 'Use Check a page to hear one translation.', 'text-to-audio' ),
				),
				'voice-languages',
				'3:00',
				true
			),
			'voice:providers'     => self::topic(
				__( 'Connect your own voice provider', 'text-to-audio' ),
				array(
					__( 'Choose Google Cloud, OpenAI or ElevenLabs.', 'text-to-audio' ),
					__( 'Paste the key from your account with that provider. They bill you directly.', 'text-to-audio' ),
					__( 'Click Test, then Save changes.', 'text-to-audio' ),
				),
				'voice-own-provider',
				'4:00'
			),
			'voice:providers#gcs' => self::topic(
				__( 'Keep a copy of audio files in cloud storage', 'text-to-audio' ),
				array(
					__( 'Open Keep a copy in Google Cloud Storage.', 'text-to-audio' ),
					__( 'Upload the service-account key file and name the bucket.', 'text-to-audio' ),
					__( 'Click Test connection, then Save changes.', 'text-to-audio' ),
				),
				'voice-cloud-storage',
				'3:30',
				true
			),
			'player:look'         => self::topic(
				__( 'Change how the player looks', 'text-to-audio' ),
				array(
					__( 'Pick a style, or set your own colours.', 'text-to-audio' ),
					__( 'Watch the preview on the right; switch it to a dark site or a phone.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'player-look',
				'2:30'
			),
			'player:place'        => self::topic(
				__( 'Choose where the player sits', 'text-to-audio' ),
				array(
					__( 'Choose before the content, after it, or where you add it yourself.', 'text-to-audio' ),
					__( 'Choose what happens while the visitor scrolls.', 'text-to-audio' ),
					__( 'Choose who sees it, then Save changes.', 'text-to-audio' ),
				),
				'player-placement',
				'2:30'
			),
			'player:words'        => self::topic(
				__( 'Change the button words', 'text-to-audio' ),
				array(
					__( 'Type your own words for Listen, Pause, Resume and Replay.', 'text-to-audio' ),
					__( 'Turn the listening time on or off.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'player-words',
				'1:30'
			),
			'player:read'         => self::topic(
				__( 'Highlight the text while it is read', 'text-to-audio' ),
				array(
					__( 'Turn on Highlight while reading.', 'text-to-audio' ),
					__( 'Choose sentence or word highlighting and the colours.', 'text-to-audio' ),
					__( 'Check the preview, then Save changes.', 'text-to-audio' ),
				),
				'player-read-along',
				'2:30'
			),
			'player:ai'           => self::topic(
				__( 'Show an AI voice notice', 'text-to-audio' ),
				array(
					__( 'Turn the notice on.', 'text-to-audio' ),
					__( 'Edit the text and choose before or after the player.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'player-ai-notice',
				'1:00'
			),
			'player:embed'        => self::topic(
				__( 'Add the player with a shortcode or block', 'text-to-audio' ),
				array(
					__( 'Copy the shortcode, or add the AtlasVoice block in the editor.', 'text-to-audio' ),
					__( 'Paste it where the player should appear.', 'text-to-audio' ),
					__( 'Update the post and view it.', 'text-to-audio' ),
				),
				'player-shortcode-block',
				'2:00'
			),
			'content:where'       => self::topic(
				__( 'Choose which posts get a player', 'text-to-audio' ),
				array(
					__( 'Tick the content types.', 'text-to-audio' ),
					__( 'Skip posts by category, tag or one by one.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'content-where',
				'2:30'
			),
			'content:text'        => self::topic(
				__( 'Choose what text is read', 'text-to-audio' ),
				array(
					__( 'Choose whether the title and excerpt are read.', 'text-to-audio' ),
					__( 'Add words to say before or after each post.', 'text-to-audio' ),
					__( 'Click Save changes.', 'text-to-audio' ),
				),
				'content-text',
				'2:30'
			),
			'content:areas'       => self::topic(
				__( 'Read only part of the page', 'text-to-audio' ),
				array(
					__( 'Click Pick on a page.', 'text-to-audio' ),
					__( 'Click the area that should be read, and the parts to skip.', 'text-to-audio' ),
					__( 'Listen to the result, then Save.', 'text-to-audio' ),
				),
				'content-page-areas',
				'3:30'
			),
			'library'             => self::topic(
				__( 'See which posts have audio', 'text-to-audio' ),
				array(
					__( 'Each post shows Ready, Outdated, Missing or Failed.', 'text-to-audio' ),
					__( 'Click a post to see its audio and make it again.', 'text-to-audio' ),
					__( 'Use the filters to find posts that need audio.', 'text-to-audio' ),
				),
				'audio-library',
				'3:00'
			),
			'library:clean'       => self::topic(
				__( 'Remove audio files nothing uses', 'text-to-audio' ),
				array(
					__( 'Open Clean up.', 'text-to-audio' ),
					__( 'Look at the list of files no post uses.', 'text-to-audio' ),
					__( 'Tick the files and click Delete.', 'text-to-audio' ),
				),
				'audio-clean-up',
				'1:30',
				true
			),
			'library:settings'    => self::topic(
				__( 'Choose when audio is made', 'text-to-audio' ),
				array(
					__( 'Choose on first play, on publish, or only when you ask.', 'text-to-audio' ),
					__( 'Choose what happens when a post changes.', 'text-to-audio' ),
					__( 'Set a daily limit, then Save changes.', 'text-to-audio' ),
				),
				'audio-settings',
				'2:30'
			),
			'insights'            => self::topic(
				__( 'Read your listening numbers', 'text-to-audio' ),
				array(
					__( 'Choose the period at the top.', 'text-to-audio' ),
					__( 'Plays, listening time and finished listening show how audio is used.', 'text-to-audio' ),
					__( 'Click a post to see its own numbers.', 'text-to-audio' ),
				),
				'insights',
				'3:00'
			),
			'seo'                 => self::topic(
				__( 'Show your audio in search and AI answers', 'text-to-audio' ),
				array(
					__( 'Turn on audio in search results.', 'text-to-audio' ),
					__( 'Check the name and description AtlasVoice sends.', 'text-to-audio' ),
					__( 'Click Save changes, then test one post.', 'text-to-audio' ),
				),
				'seo-ai-search',
				'3:00',
				true
			),
			'site:health'         => self::topic(
				__( 'Fix something on the Health screen', 'text-to-audio' ),
				array(
					__( 'Red items stop audio for visitors; fix those first.', 'text-to-audio' ),
					__( 'Each item has one button that fixes it or shows how.', 'text-to-audio' ),
					__( 'Click Check again.', 'text-to-audio' ),
				),
				'site-health',
				'3:00'
			),
			'site:versions'       => self::topic(
				__( 'Go back to an earlier version', 'text-to-audio' ),
				array(
					__( 'Open Versions.', 'text-to-audio' ),
					__( 'Choose the version and click Install.', 'text-to-audio' ),
					__( 'Your settings and audio files are kept.', 'text-to-audio' ),
				),
				'site-versions',
				'1:30'
			),
			'site:advanced'       => self::topic(
				__( 'Advanced settings and the classic screens', 'text-to-audio' ),
				array(
					__( 'Toolbar, dashboard widget and maintenance tools are here.', 'text-to-audio' ),
					__( 'Use the classic screens switches back to the old layout.', 'text-to-audio' ),
					__( 'Both layouts use the same saved settings.', 'text-to-audio' ),
				),
				'site-advanced',
				'2:00'
			),
			'site:privacy'        => self::topic(
				__( 'Privacy: what is collected', 'text-to-audio' ),
				array(
					__( 'Read what AtlasVoice stores about visitors.', 'text-to-audio' ),
					__( 'Copy the suggested text into your privacy policy.', 'text-to-audio' ),
					__( 'Use the tools to export or delete visitor data.', 'text-to-audio' ),
				),
				'site-privacy',
				'2:00'
			),
			'account:usage'       => self::topic(
				__( 'Check your usage this month', 'text-to-audio' ),
				array(
					__( 'The bar shows the characters used this month.', 'text-to-audio' ),
					__( 'The list shows which posts used the most.', 'text-to-audio' ),
					__( 'The date shows when the month starts again.', 'text-to-audio' ),
				),
				'account-usage',
				'1:30'
			),
			'account:licence'     => self::topic(
				__( 'Activate your Pro licence', 'text-to-audio' ),
				array(
					__( 'Paste the licence key from your purchase email.', 'text-to-audio' ),
					__( 'Click Activate.', 'text-to-audio' ),
					__( 'Local and staging addresses do not use up a site.', 'text-to-audio' ),
				),
				'account-licence',
				'1:30',
				true
			),
			'account:plans'       => self::topic(
				__( 'Compare Free and Pro', 'text-to-audio' ),
				array(
					__( 'The table shows what each plan includes.', 'text-to-audio' ),
					__( 'Choose yearly or lifetime.', 'text-to-audio' ),
					__( 'Upgrade to Pro opens the checkout on atlasaidev.com.', 'text-to-audio' ),
				),
				'plans',
				'2:00'
			),
			'help:docs'           => self::topic(
				__( 'Find an answer', 'text-to-audio' ),
				array(
					__( 'Type a word in the search box.', 'text-to-audio' ),
					__( 'Open a guide, or watch its video.', 'text-to-audio' ),
					__( 'Still stuck? Contact support from the bottom of the list.', 'text-to-audio' ),
				),
				'help',
				'1:00'
			),
			'help:moved'          => self::topic(
				__( 'Find a setting from the old screens', 'text-to-audio' ),
				array(
					__( 'Type the old name of the menu or setting.', 'text-to-audio' ),
					__( 'The list shows where it lives now.', 'text-to-audio' ),
					__( 'Click Open to go there.', 'text-to-audio' ),
				),
				'where-things-moved',
				'1:30'
			),
			'help:more'           => self::topic(
				__( 'Our other plugins', 'text-to-audio' ),
				array(
					__( 'The list is loaded only when you open this tab.', 'text-to-audio' ),
					__( 'Click Install to add a plugin from WordPress.org.', 'text-to-audio' ),
					__( 'Activate it under Plugins.', 'text-to-audio' ),
				),
				'more-plugins',
				'1:00'
			),
			'editor'              => self::topic(
				__( 'Use AtlasVoice while you write', 'text-to-audio' ),
				array(
					__( 'Open the AtlasVoice panel in the editor sidebar.', 'text-to-audio' ),
					__( 'Listen to the post, or make its audio.', 'text-to-audio' ),
					__( 'Turn the player off for this post if you need to.', 'text-to-audio' ),
				),
				'editor-panel',
				'2:30'
			),
		);

		/**
		 * Filters the help topics, so Pro or a site can add topics or change URLs
		 * (for example to fill in a published video address).
		 *
		 * @since 2.5.0
		 *
		 * @param array $topics Topics keyed by route id.
		 */
		return (array) apply_filters( 'atlasvoice_help_topics', $topics );
	}

	/**
	 * Find the topic for a route, falling back from the most specific match to the least.
	 *
	 * Order: exact key, key without its #section, the screen before the first colon,
	 * then the first topic, so the Help panel always has something to show.
	 *
	 * @param string $route Route id.
	 * @return array The topic with an added 'key', or an empty array when there are no topics.
	 */
	public static function for_route( $route ) {
		$topics = self::all();
		$route  = (string) $route;

		if ( empty( $topics ) ) {
			return array();
		}

		$candidates = array( $route );
		$no_section = strstr( $route, '#', true );
		if ( false !== $no_section ) {
			$candidates[] = $no_section;
		}
		$screen = strstr( $route, ':', true );
		if ( false !== $screen ) {
			$candidates[] = $screen;
		}

		foreach ( $candidates as $key ) {
			if ( isset( $topics[ $key ] ) ) {
				return array( 'key' => $key ) + (array) $topics[ $key ];
			}
		}

		// A screen that is only tabs (Voice, Player) has no topic of its own:
		// its first tab is closer to what the user sees than the Home topic.
		$screen_part = false !== $screen ? $screen : $route;
		foreach ( $topics as $key => $topic ) {
			if ( '' !== $screen_part && 0 === strpos( (string) $key, $screen_part . ':' ) ) {
				return array( 'key' => (string) $key ) + (array) $topic;
			}
		}

		$first_key = (string) key( $topics );
		return array( 'key' => $first_key ) + (array) $topics[ $first_key ];
	}

	/**
	 * Build one topic. Strings are translated at the call site so translation tools can extract them.
	 *
	 * @param string   $title        Translated title.
	 * @param string[] $steps        Translated steps.
	 * @param string   $slug         Documentation page slug under DOCS_BASE.
	 * @param string   $video_length Planned video length, like '2:00'.
	 * @param bool     $pro          True when the topic only exists with Pro.
	 * @return array
	 */
	private static function topic( $title, array $steps, $slug, $video_length, $pro = false ) {
		return array(
			'title'                       => $title,
			'steps'                       => $steps,
			'docUrl'                      => self::DOCS_BASE . $slug . '/',
			'videoUrl'                    => '',
			// Filled in once the video is published.
							'videoLength' => $video_length,
			'pro'                         => (bool) $pro,
		);
	}
}
