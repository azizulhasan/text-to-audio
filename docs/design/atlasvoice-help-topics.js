/**
 * Help topics: one per screen, tab, setup step and stand-alone section.
 * Every topic has in-plugin steps, ONE documentation page and ONE video (owner rule, 2026-11-13).
 * All documentation and videos are new, written for the new screens; the old ones stay online
 * for sites that use the classic screens.
 *
 * Shape (the plugin ships the same list from PHP, filterable with `atlasvoice_help_topics`):
 *   key:   route id, 'screen', 'screen:tab' or 'screen:tab#section'
 *   t:     title, written as the task
 *   steps: how to do it, shown inside the plugin (translatable)
 *   doc:   slug under https://atlasaidev.com/docs/atlasvoice/
 *   vid:   planned length of the video; its URL is filled in when the video is published
 *   pro:   true when the topic only exists with Pro
 */
( function ( root ) {
	const T = ( key, t, steps, doc, vid, pro ) => ( { key, t, steps, doc, vid, pro: !! pro } );
	const topics = [
		T( 'overview', 'Read your Home screen', [ 'The top line says who can hear the player right now.', 'The four steps show your voice, player, content and live status. Click one to change it.', 'The cards below show plays and anything that needs you.' ], 'home', '2:00' ),
		T( 'setup', 'Set up AtlasVoice', [ 'Follow the steps on the left, top to bottom.', 'Each step saves when you click Continue. You can leave and come back.', 'The last step checks a real post and lets you go live.' ], 'setup', '3:00' ),
		T( 'setup:hear', 'Setup step: hear it', [ 'Press Listen on the sample post.', 'If you hear nothing, check your device volume and try another browser.', 'Click Continue.' ], 'setup-hear-it', '1:00' ),
		T( 'setup:where', 'Setup step: where the player appears', [ 'Tick the content types that should get a player.', 'Posts is a good start; add more later.', 'Click Continue.' ], 'setup-where', '1:30' ),
		T( 'setup:voice', 'Setup step: choose the voice', [ 'Pick what makes the sound: the device voice or a natural voice.', 'Press play on a voice to hear it.', 'Click Continue.' ], 'setup-voice', '2:00' ),
		T( 'setup:look', 'Setup step: choose the look', [ 'Pick a style. Classic teal matches older AtlasVoice sites.', 'The preview shows your choice at once.', 'Click Continue.' ], 'setup-look', '1:30' ),
		T( 'setup:mp3', 'Setup step: audio files', [ 'Choose when audio files are made.', 'Choose who may download them.', 'Click Continue.' ], 'setup-audio-files', '1:30', true ),
		T( 'setup:report', 'Setup step: email reports', [ 'Turn the report on or off.', 'Choose how often and who receives it.', 'Click Continue.' ], 'setup-reports', '1:00', true ),
		T( 'setup:live', 'Setup step: check and go live', [ 'Open the test post and listen as a visitor.', 'Use Test on your phone to hear it on a real phone.', 'Choose Go live, or finish in staging and go live later.' ], 'setup-go-live', '2:00' ),
		T( 'voice:voice', 'Choose your voice', [ 'Choose what makes the sound.', 'Pick a language, then press play on a voice to hear it.', 'Click Save changes.' ], 'voice-choose', '3:00' ),
		T( 'voice:pronunciation', 'Fix how a word is said', [ 'Click Add a word.', 'Type the word as written, then how it should sound.', 'Use Try it to listen, then Save changes.' ], 'voice-pronunciation', '2:30' ),
		T( 'voice:languages', 'Use a voice for each language', [ 'AtlasVoice finds your multilingual plugin by itself.', 'Pick a voice for each language in the list.', 'Use Check a page to hear one translation.' ], 'voice-languages', '3:00', true ),
		T( 'voice:providers', 'Connect your own voice provider', [ 'Choose Google Cloud, OpenAI or ElevenLabs.', 'Paste the key from your account with that provider. They bill you directly.', 'Click Test, then Save changes.' ], 'voice-own-provider', '4:00' ),
		T( 'voice:providers#gcs', 'Keep a copy of audio files in cloud storage', [ 'Open Keep a copy in Google Cloud Storage.', 'Upload the service-account key file and name the bucket.', 'Click Test connection, then Save changes.' ], 'voice-cloud-storage', '3:30', true ),
		T( 'player:look', 'Change how the player looks', [ 'Pick a style, or set your own colours.', 'Watch the preview on the right; switch it to a dark site or a phone.', 'Click Save changes.' ], 'player-look', '2:30' ),
		T( 'player:place', 'Choose where the player sits', [ 'Choose before the content, after it, or where you add it yourself.', 'Choose what happens while the visitor scrolls.', 'Choose who sees it, then Save changes.' ], 'player-placement', '2:30' ),
		T( 'player:words', 'Change the button words', [ 'Type your own words for Listen, Pause, Resume and Replay.', 'Turn the listening time on or off.', 'Click Save changes.' ], 'player-words', '1:30' ),
		T( 'player:read', 'Highlight the text while it is read', [ 'Turn on Highlight while reading.', 'Choose sentence or word highlighting and the colours.', 'Check the preview, then Save changes.' ], 'player-read-along', '2:30' ),
		T( 'player:ai', 'Show an AI voice notice', [ 'Turn the notice on.', 'Edit the text and choose before or after the player.', 'Click Save changes.' ], 'player-ai-notice', '1:00' ),
		T( 'player:embed', 'Add the player with a shortcode or block', [ 'Copy the shortcode, or add the AtlasVoice block in the editor.', 'Paste it where the player should appear.', 'Update the post and view it.' ], 'player-shortcode-block', '2:00' ),
		T( 'content:where', 'Choose which posts get a player', [ 'Tick the content types.', 'Skip posts by category, tag or one by one.', 'Click Save changes.' ], 'content-where', '2:30' ),
		T( 'content:text', 'Choose what text is read', [ 'Choose whether the title and excerpt are read.', 'Add words to say before or after each post.', 'Click Save changes.' ], 'content-text', '2:30' ),
		T( 'content:areas', 'Read only part of the page', [ 'Click Pick on a page.', 'Click the area that should be read, and the parts to skip.', 'Listen to the result, then Save.' ], 'content-page-areas', '3:30' ),
		T( 'library', 'See which posts have audio', [ 'Each post shows Ready, Outdated, Missing or Failed.', 'Click a post to see its audio and make it again.', 'Use the filters to find posts that need audio.' ], 'audio-library', '3:00' ),
		T( 'library:clean', 'Remove audio files nothing uses', [ 'Open Clean up.', 'Look at the list of files no post uses.', 'Tick the files and click Delete.' ], 'audio-clean-up', '1:30', true ),
		T( 'library:settings', 'Choose when audio is made', [ 'Choose on first play, on publish, or only when you ask.', 'Choose what happens when a post changes.', 'Set a daily limit, then Save changes.' ], 'audio-settings', '2:30' ),
		T( 'insights', 'Read your listening numbers', [ 'Choose the period at the top.', 'Plays, listening time and finished listening show how audio is used.', 'Click a post to see its own numbers.' ], 'insights', '3:00' ),
		T( 'seo', 'Show your audio in search and AI answers', [ 'Turn on audio in search results.', 'Check the name and description AtlasVoice sends.', 'Click Save changes, then test one post.' ], 'seo-ai-search', '3:00', true ),
		T( 'site:health', 'Fix something on the Health screen', [ 'Red items stop audio for visitors; fix those first.', 'Each item has one button that fixes it or shows how.', 'Click Check again.' ], 'site-health', '3:00' ),
		T( 'site:versions', 'Go back to an earlier version', [ 'Open Versions.', 'Choose the version and click Install.', 'Your settings and audio files are kept.' ], 'site-versions', '1:30' ),
		T( 'site:advanced', 'Advanced settings and the classic screens', [ 'Toolbar, dashboard widget and maintenance tools are here.', 'Use the classic screens switches back to the old layout.', 'Both layouts use the same saved settings.' ], 'site-advanced', '2:00' ),
		T( 'site:privacy', 'Privacy: what is collected', [ 'Read what AtlasVoice stores about visitors.', 'Copy the suggested text into your privacy policy.', 'Use the tools to export or delete visitor data.' ], 'site-privacy', '2:00' ),
		T( 'account:usage', 'Check your usage this month', [ 'The bar shows the characters used this month.', 'The list shows which posts used the most.', 'The date shows when the month starts again.' ], 'account-usage', '1:30' ),
		T( 'account:licence', 'Activate your Pro licence', [ 'Paste the licence key from your purchase email.', 'Click Activate.', 'Local and staging addresses do not use up a site.' ], 'account-licence', '1:30', true ),
		T( 'account:plans', 'Compare Free and Pro', [ 'The table shows what each plan includes.', 'Choose yearly or lifetime.', 'Upgrade to Pro opens the checkout on atlasaidev.com.' ], 'plans', '2:00' ),
		T( 'help:docs', 'Find an answer', [ 'Type a word in the search box.', 'Open a guide, or watch its video.', 'Still stuck? Contact support from the bottom of the list.' ], 'help', '1:00' ),
		T( 'help:moved', 'Find a setting from the old screens', [ 'Type the old name of the menu or setting.', 'The list shows where it lives now.', 'Click Open to go there.' ], 'where-things-moved', '1:30' ),
		T( 'help:more', 'Our other plugins', [ 'The list is loaded only when you open this tab.', 'Click Install to add a plugin from WordPress.org.', 'Activate it under Plugins.' ], 'more-plugins', '1:00' ),
		T( 'editor', 'Use AtlasVoice while you write', [ 'Open the AtlasVoice panel in the editor sidebar.', 'Listen to the post, or make its audio.', 'Turn the player off for this post if you need to.' ], 'editor-panel', '2:30' ),
	];
	const api = { base: 'https://atlasaidev.com/docs/atlasvoice/', topics };
	if ( typeof module !== 'undefined' && module.exports ) module.exports = api;
	if ( root ) root.AVM_HELP = api;
}( typeof window !== 'undefined' ? window : null ) );
