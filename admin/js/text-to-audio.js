const ttaGetData = async (url = '', data = {}) => {
	// Default options are marked with *
	const response = await fetch(url, {
		// headers: {
		//   "Content-Type": "application/json",
		// },
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		body: data, // body data type must match "Content-Type" header
	});
	const responseData = await response.json(); // parses JSON response into native JavaScript objects

	return responseData;
};

// media.webspeech.recognition.enable = true;
// media.webspeech.recognition.force_enable = true;
// media.webspeech.synth.enabled = true;

const TTA = {
	speechSynthesis: true,
	SpeechRecognition: true,
	recordStatus: 'record',
	listenStatus: 'listen',
	noticeClass: 'tta_notice',

	displayApiMissing(button_id = '', is_dashboard = false) {
		// console.log(this.SpeechRecognition, this.speechSynthesis);
		let notice = '';
		let link = '';

		if (!this.SpeechRecognition) {
			notice += 'Text To Audio: Please enable SpeechRecognition';
		}
		if (!this.speechSynthesis) {
			if (notice) {
				notice += ' , speechSynthesis.';
			} else {
				notice += 'Text To Audio: Please enable speechSynthesis.';
			}
		}

		if (button_id) {
			notice += ` Click here to <a href="https://wordpress.org/plugins/text-to-audio/#how%20to%20fix%20firefox%20%20browser%20issue%3F" target="_blank">enable</a>`;

			let previousSibling =
				document.getElementById(button_id).previousSibling;
			previousSibling.style.display = 'block';
			previousSibling.innerHTML = notice;
			setTimeout(() => {
				document.querySelector('.tta_notice').style.display = 'none';
				previousSibling.innerHTML = '';
			}, 5000);
		} else {
			if (is_dashboard) {
				link +=
					text_to_audio_obj.admin_url +
					'admin.php?page=text-to-audio#/docs';
			} else {
				link +=
					'https://wordpress.org/plugins/text-to-audio/#how%20to%20fix%20firefox%20%20browser%20issue%3F';
			}
			notice += `\nFollow this link to enable: \n${link}`;
			alert(notice);
		}
		throw new Error(notice);
	},
};

var SpeechRecognition =
	window.SpeechRecognition || window.webkitSpeechRecognition;
var SpeechGrammarList =
	window.SpeechGrammarList || window.webkitSpeechGrammarList;
var SpeechGrammar = window.SpeechGrammar || window.webkitSpeechGrammar;
var SpeechRecognitionEvent =
	window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

var browserName = (function (agent) {
	switch (true) {
		case agent.indexOf('edge') > -1:
			return 'MS Edge';
		case agent.indexOf('edg/') > -1:
			return 'Edge ( chromium based)';
		case agent.indexOf('opr') > -1 && !!window.opr:
			return 'Opera';
		case agent.indexOf('chrome') > -1 && !!window.chrome:
			return 'Chrome';
		case agent.indexOf('trident') > -1:
			return 'MS IE';
		case agent.indexOf('firefox') > -1:
			return 'Mozilla';
		case agent.indexOf('safari') > -1:
			return 'Safari';
		default:
			return 'other';
	}
})(window.navigator.userAgent.toLowerCase());

/**
 * Check if SpeechRecognition, speechSynthesis is definded in FireFox.
 * If not then show alert for enabling them.
 *
 */
if (window.SpeechRecognition == undefined) {
	TTA.SpeechRecognition = false;
} else {
	var recognition = new SpeechRecognition();
	var grammar =
		'#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;';
	var speechRecognitionList = new SpeechGrammarList();
	speechRecognitionList.addFromString(grammar, 1);
	recognition.grammars = speechRecognitionList;
	var newGrammar = new SpeechGrammar();
	newGrammar.src =
		'#JSGF V1.0; grammar names; public <name> = chris | kirsty | mike;';
	speechRecognitionList[1] = newGrammar; // should add the new SpeechGrammar object to the list.

	/**
	 * Get recording settings.
	 */
	let recordData = new FormData();
	let recordSettings = {};
	recordData.append('method', 'get');
	ttaGetData(text_to_audio_obj.json_url + 'tta/v1/record', recordData)
		.then((res) => {
			recordSettings = res.data;

			recognition.continuous = recordSettings.is_record_continously
				? recordSettings.is_record_continously
				: true;
			recognition.lang = recordSettings.tta__recording__lang
				? recordSettings.tta__recording__lang
				: 'en-US';
			localStorage.setItem(
				'tta__sentence_delimiter',
				recordSettings.tta__sentence_delimiter,
			);
		})
		.catch((err) => {
			console.log(err);
		});

	recognition.interimResults = false;
	recognition.maxAlternatives = 2;

	/**
	 *
	 * restart recording
	 */
	recognition.onsoundend = function () {
		TTA.recordStatus = 'record';
		let record_btn = document.getElementById('tta__start__record');
		if (record_btn) record_btn.innerHTML = record_start_button;
	};
}

/**
 * Play button content.
 */
let play_button =
	'<span class="dashicons dashicons-controls-play"></span> Play';
let replay_button =
	'<span class="dashicons dashicons-image-rotate"></span> Replay';
let pause_button =
	'<span class="dashicons dashicons-controls-pause"></span> Pause';
let resume_button =
	'<span class="dashicons dashicons-controls-play"></span> Resume';
/**
 * Record button
 */
let record_start_button =
	'<span class="dashicons dashicons-controls-volumeoff"></span> Start';
let record_stop_button =
	'<span class="dashicons dashicons-controls-volumeon"></span> Stop';

// Listen content.
if (window.speechSynthesis == undefined) {
	TTA.speechSynthesis = false;
} else {
	var utterence = new SpeechSynthesisUtterance();
}

/**
 *
 * @param {*} current_listening_content_id
 */

window.onload = function () {
	localStorage.setItem('recordStarted', false);
	setCurrentRecordContentId();
	if (window.speechSynthesis) speechSynthesis.cancel();
};
window.onload();

/**
 * Start recording.
 * @param {string} current_record_content_id
 */
function startRecording(
	current_record_content_id = '',
	tta__sentence_delimiter = '.',
) {
	if (
		current_record_content_id !== 'comment' &&
		current_record_content_id !== 'tta__demo_text_for_play'
	) {
		setCurrentRecordContentId();
	}
	current_record_content_id = localStorage.getItem(
		'current_recording_content_id',
	);
	/**
	 * Stop listening before recording.
	 */
	if (TTA.speechSynthesis) {
		speechSynthesis.cancel();
	}

	if (!TTA.SpeechRecognition) {
		TTA.displayApiMissing('', true);
	}
	/**
	 * Get current recording element
	 */
	let current_recording_element = getCurrrentRecordingElement(
		current_record_content_id,
	);
	if (current_recording_element === false) {
		alert('Please add a paragraph tag then start recording.');
		return;
	}

	/**
	 * Change voice recognition text and icon based on condition.
	 */
	changeRecordButtonText();

	/**
	 * Show current recorded text.
	 */
	showRecordedContent(
		current_record_content_id,
		tta__sentence_delimiter,
		current_recording_element,
	);
}

function setCurrentRecordContentId() {
	if (text_to_audio_obj.classic_editor_is_active) {
		localStorage.setItem('current_listening_content_id', 'content_ifr');
		localStorage.setItem('current_recording_content_id', 'content_ifr');
	} else if (document.getElementsByClassName('wp-block-post-title')) {
		/**
		 * Get last paragraph tag id for pasting voice text.
		 */
		let blockEditorContent = document.getElementsByClassName(
			'block-editor-block-list__layout',
		);

		if (blockEditorContent[0]) {
			for (child of blockEditorContent[0].children) {
				if (child.tagName === 'P') {
					localStorage.setItem(
						'current_recording_content_id',
						child.getAttribute('id'),
					);
				}
			}
		}
	}
}

/**
 * Show current recorded text.
 * @param {*} current_text
 * @param {*} tta__sentence_delimiter
 * @param {*} current_recording_element
 */
function showRecordedContent(
	current_record_content_id,
	tta__sentence_delimiter,
	current_recording_element,
) {
	let current_text = '';
	// let final_transcript = "";
	recognition.onresult = function (event) {
		let event__length = event.results.length;
		if (event.results[event__length - 1].isFinal) {
			current_text =
				event.results[event__length - 1][0].transcript +
				shouldAddDelimiter(tta__sentence_delimiter);
			current_text = captalizeString(current_text);
		}

		/**
		 * Customize page id.
		 */
		if (current_record_content_id == 'tta__demo_text_for_play') {
			let previous_text = current_recording_element.value;
			current_recording_element.value = previous_text + current_text;
		} else {
			let previous_text = current_recording_element.innerHTML;
			current_recording_element.innerHTML = previous_text + current_text;
		}
	};
}

/**
 * Should add delimiter.
 */
function shouldAddDelimiter(tta__sentence_delimiter) {
	if (
		(window.navigator.userAgent.indexOf('Opera') ||
			window.navigator.userAgent.indexOf('OPR')) != -1
	) {
		return tta__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf('Edg') != -1) {
		return '';
	} else if (window.navigator.userAgent.indexOf('Chrome') != -1) {
		return tta__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf('Safari') != -1) {
		return tta__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf('Firefox') != -1) {
		return tta__sentence_delimiter;
	} else if (
		window.navigator.userAgent.indexOf('MSIE') != -1 ||
		!!document.documentMode == true
	) {
		//IF IE > 10
		return tta__sentence_delimiter;
	} else {
		return tta__sentence_delimiter;
	}
}

/**
 * Change record button text.
 */
function changeRecordButtonText() {
	let record_btn = document.getElementById('tta__start__record');
	if (TTA.recordStatus == 'stop') {
		TTA.recordStatus = 'record';
		recognition.stop();
		localStorage.setItem('recordStarted', false);
		if (record_btn) record_btn.innerHTML = record_start_button;
	} else if (TTA.recordStatus == 'record') {
		if (
			localStorage.getItem('recordStarted') == null ||
			localStorage.getItem('recordStarted') == 'false'
		) {
			localStorage.setItem('recordStarted', true);
			recognition.start();
		}
		TTA.recordStatus = 'stop';
		if (record_btn) record_btn.innerHTML = record_stop_button;
	}
}

/**
 *
 * @param {*} current_record_content_id
 * @returns
 */
function getCurrrentRecordingElement(current_record_content_id) {
	let current_recording_element = '';
	// console.log(current_record_content_id)
	if (current_record_content_id == 'content_ifr') {
		current_recording_element = document.getElementById(
			current_record_content_id,
		).contentWindow.document.body;
	} else {
		current_recording_element = document.getElementById(
			current_record_content_id,
		);

		/**
		 * If block editor is active and current_record_content_id is null then give alert.
		 */
		if (
			document.getElementsByClassName('wp-block-post-title') &&
			!current_recording_element
		) {
			return false;
		}
	}

	return current_recording_element;
}

/**
 * Capitalize String.
 */
function captalizeString(string) {
	if (string[0] !== ' ') {
		return string[0].toUpperCase() + string.slice(1);
	} else {
		return ' ' + string[1].toUpperCase() + string.slice(2);
	}
}

/**
 * Listent/Pause/Resume content.
 */
function listenCotentInDashboard(btn_id, content, listeningSettings) {
	/**
	 * Stop recording before listening.
	 */
	if (TTA.SpeechRecognition && recognition) {
		recognition.stop();
	}

	if (!TTA.speechSynthesis) {
		TTA.displayApiMissing('', true);
	}

	localStorage.setItem('recordStarted', false);
	localStorage.setItem('current_play_btn_id', btn_id);
	setCurrentListeningContent();

	let text = localStorage.getItem('current_listening_content');

	startListening(btn_id, text, listeningSettings);
}

function setCurrentListeningContent() {
	let current_listening_content = '';
	let text = '';
	// True if classic editor active. and current reading content id is not "content_ifr"
	// if (
	// 	localStorage.getItem("current_listening_content_id") !== null &&
	// 	localStorage.getItem("current_listening_content_id") != "content_ifr"
	// ) {
	// 	current_listening_content = document.getElementById(
	// 		localStorage.getItem("current_listening_content_id"),
	// 	);
	// } else {
	/**
	 * Classsic editor
	 */
	if (text_to_audio_obj.classic_editor_is_active) {
		/**
		 * Get the title.
		 */
		let title = document.getElementById('title').value;
		text = title + '. ';
		current_listening_content =
			document.getElementById('content_ifr').contentWindow.document.body;

		text +=
			current_listening_content.innerText ||
			current_listening_content.textContent;
		// is block editor active.
	} else if (document.getElementsByClassName('wp-block-post-title')) {
		// Block Editor Title
		current_listening_content +=
			document.getElementsByClassName('wp-block-post-title')[0]
				.innerText + '. ';
		// Content
		let blockEditorContent = document.getElementsByClassName(
			'block-editor-block-list__layout',
		);
		for (child of blockEditorContent[0].children) {
			// Get only innerText.
			if (child.getAttribute('id')) {
				current_listening_content += document.getElementById(
					child.getAttribute('id'),
				).innerText;
			}
		}
		text = current_listening_content;
	}

	localStorage.setItem('current_listening_content', text);
	// }
}

// speechSynthesis.cancel()
/**
 * Start Reading content
 */
function startListening(btn_id, content, listeningSettings = null) {
	let listen_btn = document.getElementById(btn_id);

	utterence.text = content;
	var voices = speechSynthesis.getVoices();
	if (listeningSettings) {
		utterence.voice = voices.filter(
			(voice, i) => voice.name === listeningSettings.tta__listening_voice,
		)[0];
	} else {
		utterence.voice = voices[0];
	}
	utterence.volume = listeningSettings.tta__listening_volume
		? listeningSettings.tta__listening_volume
		: 1; // From 0 to 1
	utterence.rate = listeningSettings.tta__listening_rate
		? listeningSettings.tta__listening_rate
		: 1; // From 0.1 to 10
	utterence.pitch = listeningSettings.tta__listening_pitch
		? listeningSettings.tta__listening_pitch
		: 2; // From 0 to 2
	utterence.lang = listeningSettings.tta__listening_lang
		? listeningSettings.tta__listening_lang
		: 'en-US'; // It will be speaking language.

	if (TTA.listenStatus == 'listen') {
		speechSynthesis.speak(utterence);
		listen_btn.innerHTML = pause_button;
		listen_btn.setAttribute('title', 'Text To Audio : Pause');
		TTA.listenStatus = 'pause';
	} else if (TTA.listenStatus == 'pause') {
		speechSynthesis.pause();
		listen_btn.innerHTML = resume_button;
		listen_btn.setAttribute('title', 'Text To Audio : Resume');
		TTA.listenStatus = 'resume';
	} else if (TTA.listenStatus == 'resume') {
		listen_btn.innerHTML = pause_button;
		TTA.listenStatus = 'pause';
		listen_btn.setAttribute('title', 'Text To Audio : Pause');
		speechSynthesis.resume();
	}
}

/**
 * After ending reading the content.
 */
if (TTA.speechSynthesis && utterence) {
	utterence.addEventListener('end', function (event) {
		speechSynthesis.cancel();
		let listen_btn = document.getElementById(
			localStorage.getItem('current_play_btn_id'),
		);
		listen_btn.innerHTML = replay_button;
		listen_btn.setAttribute('title', 'Text To Audio : Replay');
		TTA.listenStatus = 'listen';
	});
}

/**
 * Read the blog
 */

function listenCotentInFrontend(
	content = 'Hellow World',
	btn_id = 'wpa__listen_content',
	listeningSettings,
) {
	/**
	 * Stop recording before listening.
	 */
	if (TTA.SpeechRecognition && recognition) {
		recognition.stop();
	}

	if (!TTA.speechSynthesis) {
		TTA.displayApiMissing(btn_id);
	}

	// Check if speechSynthesis is enabled or not?
	localStorage.setItem('recordStarted', false);
	localStorage.setItem('current_play_btn_id', btn_id);

	startListening(btn_id, content, listeningSettings);
}

/**
 * Get all textarea and start recording on focus event and stop recording on focusout event.
 */
Object.values(document.getElementsByTagName('textarea')).forEach(
	(textarea, index) => {
		let record_btn = document.getElementById('tta__start__record');
		/**
		 * Start recording on focus event.
		 */
		textarea.addEventListener('focus', function () {
			/**
			 * Stop listening before recording.
			 */
			if (TTA.speechSynthesis) {
				speechSynthesis.cancel();
			}
			if (!TTA.SpeechRecognition) {
				TTA.displayApiMissing();
			}

			TTA.listenStatus = 'listen';
			let listen_btn = document.getElementById('wpa__listen_content');
			if (listen_btn) listen_btn.innerHTML = play_button;
			if (listen_btn)
				listen_btn.setAttribute('title', 'Text To Audio : Play');
			/**
			 * Start Recording.
			 */
			if (
				textarea.getAttribute('id') === 'comment' ||
				textarea.getAttribute('id') === 'tta__demo_text_for_play'
			) {
				localStorage.setItem(
					'current_recording_content_id',
					textarea.getAttribute('id'),
				);
				startRecording(
					textarea.getAttribute('id'),
					localStorage.getItem('tta__sentence_delimiter'),
				);

				TTA.recordStatus = 'record';
				if (record_btn) record_btn.innerHTML = record_stop_button;
			}
		});

		/**
		 * Stop recording on focusout event.
		 */
		textarea.addEventListener('focusout', function () {
			// recognition.stop();
			// localStorage.setItem('recordStarted', false)
			// TTA.recordStatus = 'record';
			// record_btn.innerHTML = 'Start'
		});
	},
);
