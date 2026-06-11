/**
 * TTA Admin Notice JavaScript
 *
 * Handles notice dismissal, action tracking, and URL button clicks
 * for the data-driven admin notice system.
 *
 * @since 2.2.0
 * @package TTA
 */

(function($) {
	'use strict';

	$(document).ready(function() {

		// RTL support: reposition dismiss buttons.
		if ( ttaNoticeData.isRtl === '1' ) {
			setTimeout(function() {
				$('.tta-admin-notice .notice-dismiss').css('left', '97%');
			}, 100);
		}

		/**
		 * Handle notice dismissal via X button.
		 *
		 * Uses stopImmediatePropagation to prevent WordPress core's
		 * dismiss handler from removing the DOM element before we
		 * can read the notice ID and fire the AJAX request.
		 */
		$(document).on('click', '.tta-admin-notice .notice-dismiss, .tta-admin-notice .tta-notice-dismiss', function(e) {
			e.preventDefault();
			e.stopImmediatePropagation();

			var $button  = $(this);
			var $notice  = $button.closest('.tta-admin-notice');
			var noticeId = $button.data('notice-id') || $notice.data('notice-id');

			if ( ! noticeId ) {
				$notice.fadeOut(300, function() { $(this).remove(); });
				return;
			}

			// Send AJAX request to dismiss notice.
			$.post(ttaNoticeData.ajaxurl, {
				action:    'tta_dismiss_notice',
				nonce:     ttaNoticeData.nonce,
				notice_id: noticeId
			});

			// Also track milestone dismissal if this is a milestone notice.
			if ( noticeId.indexOf('milestone_') === 0 ) {
				$.post(ttaNoticeData.ajaxurl, {
					action:       'tta_dismiss_milestone',
					nonce:        ttaNoticeData.nonce,
					milestone_id: noticeId
				});
			}

			// Remove the notice from the DOM.
			$notice.fadeOut(300, function() { $(this).remove(); });
		});

		/**
		 * Handle action button clicks (AJAX buttons with data-action).
		 */
		$(document).on('click', '.tta-admin-notice .tta-notice-action-btn', function(e) {
			e.preventDefault();

			var $button      = $(this);
			var $notice      = $button.closest('.tta-admin-notice');
			var noticeId     = $notice.data('notice-id');
			var actionName   = $button.data('action');
			var originalText = $button.html();

			if ( ! noticeId || ! actionName ) {
				return;
			}

			// Disable button and show loading state.
			$button.prop('disabled', true)
				.html('<span class="dashicons dashicons-update-alt" style="animation: ttaNoticeRotation 1s infinite linear; margin-top: 3px;"></span> Processing...');

			// Track action via AJAX.
			$.post(ttaNoticeData.ajaxurl, {
				action:      'tta_track_notice_action',
				nonce:       ttaNoticeData.nonce,
				notice_id:   noticeId,
				action_name: actionName
			}, function(response) {
				if ( response.success ) {
					$button.html('<span class="dashicons dashicons-yes" style="margin-top: 3px;"></span> Success!');

					// Handle redirect if provided.
					if ( response.data && response.data.redirect_url ) {
						setTimeout(function() {
							window.location.href = response.data.redirect_url;
						}, 500);
					} else if ( response.data && response.data.dismiss ) {
						// Auto-dismiss the notice after action.
						$notice.fadeOut(300, function() {
							$(this).remove();
						});
					} else {
						// Reload page after 1 second.
						setTimeout(function() {
							location.reload();
						}, 1000);
					}
				} else {
					// Show error.
					var message = ( response.data && response.data.message ) ? response.data.message : 'An error occurred. Please try again.';
					alert(message);
					$button.prop('disabled', false).html(originalText);
				}
			}).fail(function() {
				alert('Connection error. Please try again.');
				$button.prop('disabled', false).html(originalText);
			});
		});

		/**
		 * TTS-249 (I3): browser speechSynthesis feature-detect warning. Was an
		 * inline <script> printed by render_browser_support(); now runs here with
		 * strings from ttaNoticeData.browserSupport.
		 */
		if ( ttaNoticeData.browserSupport && ! ( 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window ) ) {
			var bsNotice = document.createElement('div');
			bsNotice.className = 'notice notice-warning tta-admin-notice';
			bsNotice.setAttribute('data-notice-id', 'browser_support');
			bsNotice.style.padding = '12px 20px';
			var bsP = document.createElement('p');
			var bsStrong = document.createElement('strong');
			bsStrong.textContent = ttaNoticeData.browserSupport.strongLabel;
			bsP.appendChild(bsStrong);
			bsP.appendChild(document.createTextNode(' ' + ttaNoticeData.browserSupport.message));
			bsNotice.appendChild(bsP);
			var bsWrap = document.querySelector('.wrap') || document.querySelector('#wpbody-content');
			if ( bsWrap ) {
				bsWrap.insertBefore(bsNotice, bsWrap.firstChild);
			}
		}

		/**
		 * TTS-249 (I3): translation-download handler. Was an inline <script> in
		 * the translation notice; strings from ttaNoticeData.translation.
		 */
		$(document).on('click', '#tta-download-translations', function(e) {
			e.preventDefault();
			var $btn    = $(this);
			var $status = $('#tta-download-status');
			var locale  = $btn.data('locale');
			var t       = ttaNoticeData.translation || {};

			$btn.prop('disabled', true).text(t.downloading || 'Downloading...');
			$status.show().html('<span class="spinner is-active" style="float: none; margin: 0;"></span>');

			$.ajax({
				url: ttaNoticeData.ajaxurl,
				type: 'POST',
				data: {
					action: 'tta_download_translations',
					locale: locale,
					nonce: ttaNoticeData.nonce
				},
				success: function(response) {
					if (response.success) {
						$status.html('<span style="color: #00a32a; font-weight: 600;">&#10003; ' + (t.downloadedReloading || '') + '</span>');
						$btn.text(t.downloaded || 'Downloaded!');
						setTimeout(function() { window.location.reload(); }, 1000);
					} else {
						$status.html('<span style="color: #d63638;">' + (response.data && response.data.message ? response.data.message : '') + '</span>');
						$btn.prop('disabled', false).text(t.retry || 'Retry Download');
					}
				},
				error: function() {
					$status.html('<span style="color: #d63638;">' + (t.networkError || '') + '</span>');
					$btn.prop('disabled', false).text(t.retry || 'Retry Download');
				}
			});
		});

		/**
		 * Handle URL buttons that also dismiss the notice.
		 */
		$(document).on('click', '.tta-admin-notice .tta-notice-url-btn', function(e) {
			e.preventDefault();

			var $button  = $(this);
			var $notice  = $button.closest('.tta-admin-notice');
			var noticeId = $notice.data('notice-id');
			var url      = $button.attr('href') || $button.data('url');
			var newTab   = $button.data('new-tab') !== false;

			// Open URL.
			if ( url && url !== '#' ) {
				if ( newTab ) {
					window.open(url, '_blank');
				} else {
					window.location.href = url;
				}
			}

			// Dismiss notice if marked as dismiss-on-click.
			if ( noticeId && $button.data('dismiss-on-click') ) {
				$.post(ttaNoticeData.ajaxurl, {
					action:    'tta_dismiss_notice',
					nonce:     ttaNoticeData.nonce,
					notice_id: noticeId
				});

				$notice.slideUp(200, 'linear');
			}
		});

	});

	// TTS-249 (I3): the rotation keyframe moved to the enqueued
	// admin/css/tta-admin-notice.css (no JS-injected <style>).

})(jQuery);
