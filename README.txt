=== Text To Audio ===
Contributors: hasanazizul
Donate link: http://azizulhasan.com
Tags: audio, speech, voice, text to audio, text to speech, record, voice comment, voice to text-comment,
Requires at least: 4.0
Tested up to: 6.0.1
Requires PHP: 5.6
Stable tag: 1.1.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add functionality to WordPress site to read blogs out loud in more than 30 languages and write blogs by speech in more than 30 languages.

== Description ==

Add functionality to WordPress site to read blogs out loud in more than 30 languages and write blogs by speech in more than 30 languages.

There is no need to create an account it’s completely free. Just install the plugin and enjoy the whole features of the plugin.

### Useful Links:
> * [Live Demo](https://wp-speech.azizulhasan.com/text-to-audio/)
> * [Request A Feature](https://wp-speech.azizulhasan.com/contact/)

**Features:**

1. Add a play button to any post/page by shortcode “[tta_listen_btn]”.
2. Write your post by speech from the mobile, desktop, tab, or any device.
3. Write comment by speech on any post.
4. Unlimited text to speech and vice versa.
5. Add more functionality to the website for a range of users including the visually impaired and the old people.
6. Customization of button color, width and button text.
7. Live preview of play button during customization.
8. Add custom CSS and custom class to the button.
9. Change recording language to any language.
10. Change listening language to any language.
11. Choose a voice from more than 20 voices.
12. Unlimited speech to text and vice versa.
13. Customization of listening in block editor.



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
Add button text on shortcode as an attribute. Example :
`[tta_listen_btn btn_text="Your_text"]`
= How to add custom css class to button? =
Add class on shortcode as an attribute. Example : `[tta_listen_btn class="custom_class"]`
= How can I change button background and text color? =
Yes, you can change buttons background and text color from plugins dashboard's customization menu.



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