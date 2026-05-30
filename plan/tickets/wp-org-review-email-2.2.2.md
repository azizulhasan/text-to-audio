# Reviewer Email — TTS-247 Continuation Review

**Subject:** Re: [WordPress Plugin Directory] Closure Notice - Guideline Violation: Text To Speech TTS Accessibility
**From:** WordPress.org Plugin Directory `<plugins@wordpress.org>`
**To:** Azizul Hasan
**Date:** 05/27/2026 10:53 AM
**Review ID:** AUTO-SVN ... 27May26/4.0.1RC2 (P0TDX157366HGN)
**Thread tag:** `{#HS:3327588871-1050336#}`

---

Continuing with the plugin review for "hasanazizul". Let's dive in!

Our review tools have determined that your plugin is not yet ready for approval.

You are receiving this email because our automated systems have identified one or more issues that must be resolved before your submission can proceed to be reviewed by a volunteer.

🤖 Please note: This message was generated using a combination of algorithms and AI in varying proportions. It has not been individually reviewed by a human. All AI outputs are marked with the ✨ emoji.

We kindly ask that you:

Carefully review this email in full.

Address all listed issues.

Thoroughly test your updates.

Upload a corrected version of your plugin once everything has been resolved.

By doing so our tools will be happy to take another look at it.


## List of issues found


### 🔴 Trialware and Locked Features

Please review your plugin to ensure that it does not include any locked or restricted built-in functionality. This is not permitted under the WordPress.org Plugin Directory Guidelines you agreed to when submitting the plugin.


#### ❌ Guideline 5 – Trialware

Plugins must be fully functional. You may not:

Lock, disable or limit built-in features behind a license key, trial period, usage limit, time, quota or any other kind of intended restriction.

Even if the locked feature is present in the code "just in case the user upgrades," it's still **not allowed**. Your plugin may point out which features are available through a separated plugin, but that's it. All plugin code hosted on WordPress.org must be **free and fully functional**.


#### 🌐 Guideline 6 – Serviceware

Plugins may connect to a **legitimate external service to perform certain functionality**, provided:

- The service performs actual processing on external servers.
- The functionality provided cannot be done locally by the plugin.
- The service is clearly documented in your readme, including **Terms of Use** and **Privacy Policy** links.

For example: a "Spam checker" plugin that connects to a external service to check for spam (and thus uses it to provide that functionality) is generally acceptable. A plugin that simply checks a license key to unlock local features is not.


#### ✅ Ask yourself:

- Does any function **only work after a license check or payment**?
- Is any functionality in the plugin code **disabled or limited** until it's unlocked?
- Are there any limitations on the plugin **after a certain amount of time or usage**?

After excluding functionalities provided by legitimate external services, if the answer is **yes** to any of the above, the plugin **does not comply**.


#### 🔧 How to fix it:

- **Remove all license checks** or other mechanisms that control access to features built in in the plugin code.
- **Remove or fully enable** any built in features that are currently locked or limited.
- Make sure external services are compliant and clearly documented.


#### ℹ️ Important clarification:

WordPress.org is **not a marketplace**. It's a repository for **free, fully functional, GPL-compliant plugins**.

If you are not offering a service and want to offer additional features through a paid version, that code must be:

- **Hosted elsewhere** (e.g., your own website).
- **Not included** in the plugin hosted on WordPress.org.
- **GPL compliant**: Do **not** include any mechanisms that would prevent a plug-in from being used after a license has been checked.


> ✨ Local features are intentionally withheld: top-post and previous-period analytics are only calculated when `is_pro_active()`, and the player registry exposes only player 1 while this code already includes player-2 handling/customization

⚠️ The AI has highlighted the most apparent issues. There may be additional concerns not explicitly mentioned. You **must** read and comprehend the guidelines and **review the entire code thoroughly to ensure that there are no other issues**.

❗ If more issues of the same nature are found in the following review, **this plugin will not be reviewed again**. Ensure full compliance with the guidelines to avoid rejection.


### ## Attempting to process custom CSS/JS/PHP / Allowing arbitrary script insertion.

We no longer permit plugins to allow users to save arbitrary custom CSS, JavaScript, or PHP within the plugin.

The primary reason for this is that WordPress includes it's own, robust, error-checking, **CSS editor** in the Customizer or Editor already. Any time your plugin replicates functionality found in WordPress (i.e. the uploader, jquery) is frowned upon, as it presents a possible security risk. The features in WordPress have been tested by many more people than use most plugins, so the built in tools are less likely to have issues.

**As for JavaScript**, we recognize that script insertion plugins are amazing and powerful. They're also incredibly dangerous and require a high level understanding of sanitization, security, and usage. And in the case of most plugins, these are entirely unnecessary.

You should never be asking users to paste in arbitrary JavaScript. Instead, have them paste in the values custom to their scripts and generate the rest programmatically.

Also, if you are asking for code to make customization, make that a form instead. Besides security, you can't expect your users to know how to code.

**PHP is even more complex**. This is why WordPress itself allows you to lock people out of being able to edit theme and plugin files directly (via DEFINES that are used by many managed hosts), but also has a serious of post-processing checks that verify the site will still function after any changes.

Please, remove arbitrary code insertion from your plugin.

> ✨ Plugin exposes a Custom CSS setting (`custom_css`) in its customization data, carries the raw user-supplied CSS through frontend rendering params, and injects it into the client-side settings object, enabling arbitrary CSS insertion via the plugin UI


### ## The URL(s) declared in your plugin seems to be invalid or does not work.

From your plugin:

Terms/Privacy URL: `https://atlasaidev.com/terms-of-use/` - readme.txt - This URL replies us with a 404 HTTP code, meaning that it does not exists or it is not a public URL.


### ## Out of Date Libraries

At least one of the 3rd party libraries you're using is out of date. Please upgrade to the latest stable version for better support and security. We do not recommend you use beta releases.

From your plugin:

```
admin/js/vendor/chart.umd.min.js:1   🔴   Chart.js v4.4.7
   # ↳ Possible URL: https://github.com/chartjs/Chart.js
```


### ## Other possible issues

The AI detected certain cases not classified to specific sections of this report that can be related to security, compatibility, guidelines or other potential issues.

We know that the AI can be picky at times, so please review these cases carefully.

If there are issues, please resolve them. That way, we won't need to expend AI tokens checking the same thing again :)

From your plugin:

```
includes/TTA_Translation_Downloader.php:164   file_put_contents($local_path, $body);
# ✨ Writes downloaded translation files directly with file_put_contents to a local path in the plugin area, which is not a recommended WordPress filesystem practice.
```


## Remember to check everything

While our algorithms and AI are not yet able to make definitive judgments on this, they have **flagged potential issues with the following**:

- Multiple `<script>` and `<style>` HTML tags were detected in the code. **In most cases, these should not be present.** For compatibility and performance reasons, CSS and JavaScript files — including inline code — are expected to be **loaded using the core `wp_enqueue_*` functions**.
  *We understand there may be limited exceptions (for example, styles embedded within email or PDF templates). However, admin screens are not considered an exception, and neither are inline styles or scripts.*

- **When using a third party or external service it must serve a purpose for the functionality of the plugin and must be clearly documented**. Please review your code for any connections to external services such as API calls, remote downloads, any external transmission or receipt of data. For each external service used, you must clearly document the following information in your readme file: 1) What the service is and what it is used for, 2) What data is sent, and under what circumstances it is transmitted, 3) Links to the service's Terms of Service and Privacy Policy.
  *This transparency is required so users can make informed decisions about installing and using your plugin.*


Please review and correct these items as needed.

If this is not done on your end, a volunteer will need to check everything manually. This slows down the process and places unnecessary burden on the team. Submissions may be rejected if your actions (or inaction) make it clear that you have chosen not to follow the instructions.

If you already checked and are confident that everything is properly implemented, there's no need to worry. We will review it, and if no issues are found, we will not need to follow up regarding this matter.


## 👉 Continue with the review process.


### Read this email thoroughly.

Take the time to thoroughly review and understand the issues identified by our tools. Examine the provided examples, consult the relevant documentation, and conduct any additional research necessary. The goal of our review process is to help you clearly understand the reported issues so you can resolve them effectively and prevent similar problems in future updates to your plugin.

Please note that false positives are possible. As an automated system, we may occasionally make mistakes, and we apologize if anything has been flagged incorrectly. If you have doubts you can ask us for clarification, when doing so, please be clear, concise, and include a specific example so we can assist you efficiently.


### 📋 Complete your checklist.

- ✔️ I fixed all the issues in my plugin based on the feedback I received and my own review, as I know that the Plugins Team may not share all cases of the same issue. I am familiar with tools such as Plugin Check, PHPCS + WPCS, and similar utilities to help me identify problems in my code.
- ✔️ I tested my updated plugin on a clean WordPress installation with `WP_DEBUG` set to true.

  ⚠️ Do not skip this step. Testing is essential to make sure your fixes actually work and that you haven't introduced new issues.

- ✔️ I acknowledge that the volunteers won't continue reviewing this plugin if I overlook the issues or fail to test my code.
- ✔️ I created a new version of this plugin and uploaded it to the SVN repository. Details below.
- ✔️ I replied to this email. I was concise and shared any clarifications or important context that the team needed to know.
  *I didn't list all the changes, as the team will review the entire plugin again and that is not necessary at all.*

ℹ️ To help speed up the review process, we kindly ask that you carefully verify and address all reported issues before resubmitting your code.


### Upload your changes to SVN

You should update your code by creating a new version in the SVN repository for this plugin.
*Even if the plugin is closed you can still upload code to SVN.*

Please, remember:

- Update "Version:" in the plugin headers.
- Update "Stable tag:" in the readme file.
- Commit and push the updated code to `trunk/` and create the new tag in the `tags/` folder.

If you have any doubts, please read the SVN documentation. Everything is explained there.


### Disclaimer

We do our best to make these reviews as thorough as possible—but let's be honest, I'm just a machine. If something looks off, it is probably my programmer's fault (you're welcome to direct your disappointment their way). On the other hand, if everything is spot-on, they'd certainly appreciate the gratitude. Either way, we truly value your patience, understanding and collaboration on making this process worthwhile and efficient.


**Review ID:** AUTO-SVN ... 27May26/4.0.1RC2 (P0TDX157366HGN)


---

WordPress Plugins Team | plugins@wordpress.org
https://make.wordpress.org/plugins/
https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
https://wordpress.org/plugins/plugin-check/

`{#HS:3327588871-1050336#}`
