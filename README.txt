=== Text To Speech TTS ===
Contributors: atlasaidev, hasanazizul, 
Donate link: http://atlasaidev.com/
Tags: tts, speech, audio, text to speech, text to audio, record, voice comment, voice to text-comment,
Requires at least: 4.0
Tested up to: 6.2
Requires PHP: 5.6
Stable tag: 1.3.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add functionality to WordPress site to read blogs out loud in more than 30 languages and write blogs by speech in more than 30 languages.

== Description ==

Add functionality to WordPress site to read blogs out loud in more than 30 languages and write blogs by speech in more than 30 languages.

There is no need to create an account it’s completely free. Just install the plugin and enjoy the whole features of the plugin.

### Useful Links:
> * [Live Demo](http://atlasaidev.com/text-to-speech/)
> * [Request A Feature](http://atlasaidev.com/contact-us/)

**Support Languages:**

* Chrome Desktop: UK English, US English, Spanish ( Spain ), Spanish ( United States ), French, Deutsch, Italian, Russian, Dutch, Japanese, Korean, Chinese (China), Chinese (Hong Kong), Chinese (Taiwan) Hindi, Indonesian, Polish, Brazilian Portuguese.
* Chrome Mobile: English USA, English UK, German, Italian, Russian, French, Spanish, 

* Microsoft Edge Desktop : All Languages
* Microsoft Edge Mobile : All Languages

* FireFox Desktop: English
* FireFox Mobile: English USA, English UK, German, Italian, Russian, French, Spanish, 


**Features:**

* Add a play button to any post or page.
* Write post by voice from the mobile, desktop, tab, or any device.
* Write comments by speech on any post.
* Unlimited text to speech and vice versa.
* Add more functionality to the website for a range of users including the visually impaired and the old people.
* Customization of button color, width and button text.
* Live preview of play button during customization.
* Add custom CSS and custom class to the button.
* Change recording language to any language.
* Change listening language to any language.
* Choose a voice from more than 20 voices.
* Unlimited speech to text and vice versa.
* Customization of listening in block editor.
* Play button can be added by by shortcode “[tta_listen_btn]”.



== Installation ==
1. Download and unzip the plugin
2. Upload the entire "text-to-audio" directory to the `/wp-content/plugins/` directory
3. Activate the plugin through the 'Plugins' menu in WordPress
4. Go to "Text To Audio" menu and configure your settings


== Frequently Asked Questions ==

= How to enable ``speechSynthesis`` on FireFox? =
Notice: This solution only for FireFox Desktop.
Open FireFox browser,  search ```about:config``` on a new tab. Now search with this string and enable as true.
    a. ```media.webspeech.synth.enabled```
= How to enable ``SpeechRecognition`` on FireFox? =
Notice: This solution only for FireFox Desktop.
Open FireFox browser, search ```about:config``` on a new tab. Now search with this string and enable as true.
    a. ```media.webspeech.recognition.enable```
    b. ```media.webspeech.recognition.force_enable```
= Can I add button in Gutenburg block? =
Yes, you can add listening button from block editor. Open you block editor and search ```Customize Button``` then add it.
Now you can change ```color```, ```backgroundColor```, ```width```. And also add ```custom_css```.
= How to change button text? =
You can change button text 2 ways one is by shortcode attribute. Another way is adding filter. But filter always overrides the shortcode attributes. Here is short code Example :
	`[tta_listen_btn listen_text="Listen" pause_text="Pause"  resume_text="Resume" replay_text="Replay" start_text="Start" stop_text="Stop"]`

    Filter Example :
	Install the plugin Code Snippets Then Select Snippet > Add New Create a new snippet with this block of code

    add_filter( 'tta__button_text_arr', 'tta__button_text_arr_callback' );
    function tta__button_text_arr_callback ( $button_text_arr ) {

		// Listen button
		$text_arr['listen_text'] = 'Listen'; // paste custem text
		$text_arr['pause_text'] = 'Pause'; // paste custem text
		$text_arr['resume_text'] = 'Resume'; // paste custem text
		$text_arr['replay_text'] = 'Replay'; // paste custem text

		// Record button text
		$text_arr['start_text'] = 'Start'; // paste custem text
		$text_arr['stop_text'] = 'Stop'; // paste custem text
		
		return $text_arr;
    }
              
= How to add custom css class to button? =
Add class on shortcode as an attribute. Example : `[tta_listen_btn class="custom_class"]`
= How can I change button background and text color? =
Yes, you can change buttons background and text color from plugins dashboard's customization menu. also from block editor by applying the ```customization button``` block.



== Screenshots ==
1. Add play button to any post.
2. Write post by voice.
3. Customization of button.
4. Choose listening voice.
5. Choose recording language.
6. Documentation.
7. Gutenburg Support.
8. Customize the button in block editor, Block Name ( Customize Button ).

== Changelog ==

💎 TRANSLATION REQUEST 💎
We are looking for people to help translate this plugin. If you can help we would love here from you.
Help us & the WordPress community to translate the plugin [here](https://translate.wordpress.org/projects/wp-plugins/text-to-audio/)

= 1.3.4 (Apr 12, 2023) =
* Changed: [Page don't show the button](https://wordpress.org/support/topic/pages-dont-show-the-button/) issue solved.

= 1.3.3 (2023-04-05) =
* Tested: WP version 6.2 tested.
* Changed: Plugin name changed to "Text To Speech TTS"

= 1.3.2 (2023-03-30) =
* Improved: Dashboard Notice UI Improved.
* Fixed: Selection of listening language to any language.


= 1.3.1 (2023-03-24) =
* Added: Browser supported languages are added to documentation.
* Fixed: Documentation Improveed.


= 1.3.0 (2023-03-11) =
* Fixed: Chrome android play button issue fixed.
* Fixed: FireFox android play button issue fixed.
* Fixed: Microsoft edge android play button issue fixed.
* Fixed: IPhone Chrome android play button issue fixed.
* Fixed: Dashboard UI improved.
* Fixed: Listening voices are now based on browser API.


= 1.2.5 (2023-03-06) =
* Added: Play button display only single single page.
* Fixed: Database value delete after update plugin.

= 1.2.4 (2023-03-01) =
* Fixed: Button text position issue fixed.
* Fixed: Button icon position issue fixed.

= 1.2.3 (2023-02-27) =
* Fixed: Post title ASCII issue resolved.
* Fixed: Error on incognito mode issue solved.
* Fixed: Dashicons load in incognito mode or for non logged in users.
* Fixed: Dashicon related css issue fixed.
* Fixed: enable/disable button in single page.

= 1.2.2 (2023-02-04) =
* Updated: URL change.

= 1.2.1 (2023-01-28) =
* Improved: Documentation improved.
* Added: .pot file added for translation.
* Updated: Plugin name from Text To Audio to Text To Speech Ninja.

= 1.2.0 (2023-01-04) =
* Fixed: speechSynthesis pause after 10 - 15 seconds issue fixed.
* Tested: WordPress verison 6.1.1 tested.

= 1.1.6 (2022-10-22) =
* Tested: WordPress verison 6.1 tested .
* Improved: Button UI improved.

= 1.1.5 (2022-10-22) =
* Added:  enable/disable option for adding button to every post.
* Improved:  Settings UI improved.
* Improved:  Documentation improved.


= 1.1.4 (2022-10-09) =
* Button Icon : Button Icon display hide/show option added.
* Tabs: Settings tab rearranged.


= 1.1.3 (2022-09-24) =
* Button text : Listeing  and Recoding button text change option added throw filter and attribute.
* Action Links: Plugin action Links added.
* Documentation: Documentation Improved.
* Filter added: ```tta__button_text_arr```, ```tta__content_title```, ```tta__content_description``` filter added.

= 1.1.2 (2022-09-14)  =
* Bugfixed: is_plugin_active error fixed.
* Improved: FireFox api missing notice update.

= 1.1.1 (2022-07-23)  =
* Bugfixed: FireFox api missing alert bug fixed.
* Improved: Documentation Improved.

= 1.1.0 (2022-07-23)  =
* Feature: Customization of listening button from block editor. Block Name ( Customize Button )
* Added : Documentation added for how to enable ```SpeechRecognition``` and ```speechSynthesis``` on FireFox.
* Solved: FireFox ```SpeechRecognition``` and ```speechSynthesis``` issue solved.


= 1.0.4 (2022-07-12)  =
* Changed: shortcode from  ```[wps_listen_btn]``` to ```[tta_listen_btn]```
* Changed: Files name changed.
* Fixed: Customization UI issue fixed.

= 1.0.3 (2022-06-17)  =
* Fixed: Button CSS issue fixed.
* Fixed: Button alignment issue fixed.
* Added: Support ticket button added.
* Added: Review button added.

= 1.0.2 (2022-05-26)  =
* Make dashboard responsive.
* Ask for a feature button added.
* Browser support documentation added.
* Bugfixed.

= 1.0.1 (2022-05-23)  =
* Gutenburg support added.

= 1.0.0 (2022-05-18)  =
* Initial release.

== Upgrade Notice ==

= 0.1 =
This version fixes a security related bug. Upgrade immediately.