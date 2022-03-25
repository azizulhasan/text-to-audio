(function( $ ) {
	'use strict';

	/**
	 * All of the code for your admin-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */
	$(function() {

		var tabs = $('.webappick-navbar-nav  li  a'); //grab tabs
		var contents = $('.webappick-dashboard-content .webappick-tab-pane'); //grab contents

		tabs.bind('click',function(e){
			e.preventDefault();
			var tabIndex = $(this).parent().prevAll().length;
			contents.hide(); //hide all contents
			tabs.removeClass('active'); //remove 'current' classes
			$(contents[tabIndex]).show(); //show tab content that matches tab title index
			$(this).addClass('active'); //add current class on clicked tab title
		});
	});

	/**
	 * Selextize select
	 */
	$('select.selectize').not('.selectized').each(function(){
		// noinspection ES6ConvertVarToLetConst
		var self = $(this), plugins = self.data('plugins');
		self.selectize({
			plugins: plugins ? plugins.split(',').map( function( s ) { return s.trim(); } ) : [],//['remove_button'],
			render: function( data, escape ) {
				return '<div class="item wapk-selectize-item">' + escape( data.text ) + '</div>'; // phpcs:ignore WordPressVIPMinimum.JS.StringConcat.Found
			}
		});
	});

})( jQuery );

/**
 * List js
 */

/*
var e = document.querySelectorAll('[data-toggle="lists"]'),
	t = document.querySelectorAll('[data-toggle="lists"] [data-sort]');
"undefined" != typeof List && (e && [].forEach.call(e, function(e) {
	var t, a;
	a = (t = e).dataset.options ? JSON.parse(t.dataset.options) : {}, new List(t, a)
}), t && [].forEach.call(t, function(e) {
	e.addEventListener("click", function(e) {
		e.preventDefault()
	})
}));
*/

var options = {
	valueNames: [ 'tables-row', 'tables-first', 'tables-last', 'tables-handles' ]
};
var TableList = new List('table-list', options);

/**
 *
 * Quill Rich text
 */

// var uid = 'webappick-rich-text';
// var quill = new Quill('#' + uid, {
// 	modules: {
// 		toolbar: [
// 			[{ header: [1, 2, false] }],
// 			['bold', 'italic', 'underline'],
// 			['align','image','code-block']
// 		]
// 	},
// 	placeholder: 'Quill WYSIWYG',
// 	theme: 'snow'  // or 'bubble'
// });

/**
 * Flatpickr date picker
 */

var e = document.querySelectorAll('[data-toggle="flatpickr"]');
"undefined" != typeof flatpickr && e && [].forEach.call(e, function(e) {
	var t, a;
	a = (a = (t = e).dataset.options) ? JSON.parse(a) : {}, flatpickr(t, a)
});

/**
 * color pickr js
 */
// Simple example, see optional options for more configuration.
// const pickr = Pickr.create({
// 	el: '.color-picker',
// 	theme: 'classic', // or 'monolith', or 'nano'
//
// 	swatches: [
// 		'rgba(244, 67, 54, 1)',
// 		'rgba(233, 30, 99, 0.95)',
// 		'rgba(156, 39, 176, 0.9)',
// 		'rgba(103, 58, 183, 0.85)',
// 		'rgba(63, 81, 181, 0.8)',
// 		'rgba(33, 150, 243, 0.75)',
// 		'rgba(3, 169, 244, 0.7)',
// 		'rgba(0, 188, 212, 0.7)',
// 		'rgba(0, 150, 136, 0.75)',
// 		'rgba(76, 175, 80, 0.8)',
// 		'rgba(139, 195, 74, 0.85)',
// 		'rgba(205, 220, 57, 0.9)',
// 		'rgba(255, 235, 59, 0.95)',
// 		'rgba(255, 193, 7, 1)'
// 	],
//
// 	components: {
//
// 		// Main components
// 		preview: true,
// 		opacity: true,
// 		hue: true,
//
// 		// Input / output Options
// 		interaction: {
// 			hex: true,
// 			rgba: true,
// 			hsla: true,
// 			hsva: true,
// 			cmyk: true,
// 			input: true,
// 			clear: true,
// 			save: true
// 		}
// 	}
// });

/**
 * highligt js
 */
var e = document.querySelectorAll(".webappick-highlight");
"undefined" != typeof hljs && e && [].forEach.call(e, function(e) {
	var t;
	t = e, hljs.highlightBlock(t)
});

