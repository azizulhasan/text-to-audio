const getData = async (url = "", data = {}) => {
	// Default options are marked with *
	const response = await fetch(url, {
		// headers: {
		//   "Content-Type": "application/json",
		// },
		method: "POST", // *GET, POST, PUT, DELETE, etc.
		body: data, // body data type must match "Content-Type" header
	});
	const responseData = await response.json(); // parses JSON response into native JavaScript objects

	return responseData;
};

// media.webspeech.recognition.enable = true;
// media.webspeech.recognition.force_enable = true;

var record__status = "record";
var SpeechRecognition =
	window.SpeechRecognition || window.webkitSpeechRecognition;
var SpeechGrammarList =
	window.SpeechGrammarList || window.webkitSpeechGrammarList;
var SpeechGrammar = window.SpeechGrammar || window.webkitSpeechGrammar;
var SpeechRecognitionEvent =
	window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;


var recognition = new SpeechRecognition();
var grammar =
	"#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;";
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
var newGrammar = new SpeechGrammar();
newGrammar.src =
	"#JSGF V1.0; grammar names; public <name> = chris | kirsty | mike;";
speechRecognitionList[1] = newGrammar; // should add the new SpeechGrammar object to the list.

/**
 * Get recording settings.
 */
let recordData = new FormData();
let recordSettings = {};
recordData.append("method", "get");
getData(text_to_audio_obj.json_url + "wps/v1/speech/record", recordData)
	.then((res) => {
		recordSettings = res.data;

		recognition.continuous = recordSettings.is_record_continously
			? recordSettings.is_record_continously
			: true;
		recognition.lang = recordSettings.wps__recording__lang
			? recordSettings.wps__recording__lang
			: "en-US";
		localStorage.setItem(
			"wps__sentence_delimiter",
			recordSettings.wps__sentence_delimiter
		);
	})
	.catch((err) => {
		console.log(err);
	});

recognition.interimResults = false;
recognition.maxAlternatives = 2;

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

/**
 * Listen content.
 */
var listen_status = "listen";
if ("speechSynthesis" in window) {
	var utterence = new SpeechSynthesisUtterance();
} else {
	console.log("Speech speechSynthesis not supported 😢");
	// code to handle error
}

/**
 *
 * @param {*} current_listening_content_id
 */

window.onload = function() {
	localStorage.setItem("recordStarted", false);
	setCurrentRecordContentId();
	speechSynthesis.cancel();
};
window.onload();

/**
 * Start recording.
 * @param {string} current_record_content_id
 */
function startRecording(
	current_record_content_id = "",
	wps__sentence_delimiter = "."
) {
	if (
		current_record_content_id !== "comment" &&
		current_record_content_id !== "wps__demo_text_for_play"
	) {
		setCurrentRecordContentId();
	}
	current_record_content_id = localStorage.getItem(
		"current_recording_content_id"
	);
	/**
	 * Stop listening before recording.
	 */
	speechSynthesis.cancel();

	/**
	 * Get current recording element
	 */
	let current_recording_element = getCurrrentRecordingElement(
		current_record_content_id
	);
	if (current_recording_element === false) {
		alert("Please add a paragraph tag then start recording.");
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
		wps__sentence_delimiter,
		current_recording_element
	);
}

function setCurrentRecordContentId() {
	if (text_to_audio_obj.classic_editor_is_active) {
		localStorage.setItem("current_listening_content_id", "content_ifr");
		localStorage.setItem("current_recording_content_id", "content_ifr");
	} else if (document.getElementsByClassName("wp-block-post-title")) {
		/**
		 * Get last paragraph tag id for pasting voice text.
		 */
		let blockEditorContent = document.getElementsByClassName(
			"block-editor-block-list__layout"
		);

		if (blockEditorContent[0]) {
			for (child of blockEditorContent[0].children) {
				if (child.tagName === "P") {
					localStorage.setItem(
						"current_recording_content_id",
						child.getAttribute("id")
					);
				}
			}
		}
	}
}

/**
 * Show current recorded text.
 * @param {*} current_text
 * @param {*} wps__sentence_delimiter
 * @param {*} current_recording_element
 */
function showRecordedContent(
	current_record_content_id,
	wps__sentence_delimiter,
	current_recording_element
) {
	let current_text = "";
	// let final_transcript = "";
	recognition.onresult = function(event) {
		let event__length = event.results.length;
		if (event.results[event__length - 1].isFinal) {
			current_text =
				event.results[event__length - 1][0].transcript +
				shouldAddDelimiter(wps__sentence_delimiter);
			current_text = captalizeString(current_text);
		}

		/**
		 * Customize page id.
		 */
		if (current_record_content_id == "wps__demo_text_for_play") {
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
function shouldAddDelimiter(wps__sentence_delimiter) {
	if (
		(window.navigator.userAgent.indexOf("Opera") ||
			window.navigator.userAgent.indexOf("OPR")) != -1
	) {
		return wps__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf("Edg") != -1) {
		return "";
	} else if (window.navigator.userAgent.indexOf("Chrome") != -1) {
		return wps__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf("Safari") != -1) {
		return wps__sentence_delimiter;
	} else if (window.navigator.userAgent.indexOf("Firefox") != -1) {
		return wps__sentence_delimiter;
	} else if (
		window.navigator.userAgent.indexOf("MSIE") != -1 ||
		!!document.documentMode == true
	) {
		//IF IE > 10
		return wps__sentence_delimiter;
	} else {
		return wps__sentence_delimiter;
	}
}

/**
 * Change record button text.
 */
function changeRecordButtonText() {
	let record_btn = document.getElementById("wps__start__record");
	if (record__status == "stop") {
		record__status = "record";
		recognition.stop();
		localStorage.setItem("recordStarted", false);
		if (record_btn) record_btn.innerHTML = record_start_button;
	} else if (record__status == "record") {
		if (
			localStorage.getItem("recordStarted") == null ||
			localStorage.getItem("recordStarted") == "false"
		) {
			localStorage.setItem("recordStarted", true);
			recognition.start();
		}
		record__status = "stop";
		if (record_btn) record_btn.innerHTML = record_stop_button;
	}
}

/**
 *
 * @param {*} current_record_content_id
 * @returns
 */
function getCurrrentRecordingElement(current_record_content_id) {
	let current_recording_element = "";
	// console.log(current_record_content_id)
	if (current_record_content_id == "content_ifr") {
		current_recording_element = document.getElementById(
			current_record_content_id
		).contentWindow.document.body;
	} else {
		current_recording_element = document.getElementById(
			current_record_content_id
		);

		/**
		 * If block editor is active and current_record_content_id is null then give alert.
		 */
		if (
			document.getElementsByClassName("wp-block-post-title") &&
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
	if (string[0] !== " ") {
		return string[0].toUpperCase() + string.slice(1);
	} else {
		return " " + string[1].toUpperCase() + string.slice(2);
	}
}

/**
 *
 * restart recording
 */
recognition.onsoundend = function() {
	record__status = "record";
	let record_btn = document.getElementById("wps__start__record");
	if (record_btn) record_btn.innerHTML = record_start_button;
};

/**
 * Listent/Pause/Resume content.
 */
function listenCotentInDashboard(btn_id, content, listeningSettings) {
	/**
	 * Stop recording before listening.
	 */
	recognition.stop();
	localStorage.setItem("recordStarted", false);
	localStorage.setItem("current_play_btn_id", btn_id);
	setCurrentListeningContent();

	let text = localStorage.getItem("current_listening_content");

	startListening(btn_id, text, listeningSettings);
}

function setCurrentListeningContent() {
	let current_listening_content = "";
	let text = "";
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
		let title = document.getElementById("title").value;
		text = title + ". ";
		current_listening_content = document.getElementById("content_ifr")
			.contentWindow.document.body;

		text +=
			current_listening_content.innerText ||
			current_listening_content.textContent;
		// is block editor active.
	} else if (document.getElementsByClassName("wp-block-post-title")) {
		// Block Editor Title
		current_listening_content +=
			document.getElementsByClassName("wp-block-post-title")[0]
				.innerText + ". ";
		// Content
		let blockEditorContent = document.getElementsByClassName(
			"block-editor-block-list__layout"
		);
		for (child of blockEditorContent[0].children) {
			// Get only innerText.
			if (child.getAttribute("id")) {
				current_listening_content += document.getElementById(
					child.getAttribute("id")
				).innerText;
			}
		}
		text = current_listening_content;
	}

	localStorage.setItem("current_listening_content", text);
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
			(voice, i) => voice.name === listeningSettings.wps__listening_voice
		)[0];
	} else {
		utterence.voice = voices[0];
	}
	utterence.volume = listeningSettings.wps__listening_volume
		? listeningSettings.wps__listening_volume
		: 1; // From 0 to 1
	utterence.rate = listeningSettings.wps__listening_rate
		? listeningSettings.wps__listening_rate
		: 1; // From 0.1 to 10
	utterence.pitch = listeningSettings.wps__listening_pitch
		? listeningSettings.wps__listening_pitch
		: 2; // From 0 to 2
	utterence.lang = listeningSettings.wps__listening_lang
		? listeningSettings.wps__listening_lang
		: "en-US"; // It will be speaking language.

	if (listen_status == "listen") {
		speechSynthesis.speak(utterence);
		listen_btn.innerHTML = pause_button;
		listen_btn.setAttribute("title", "WP Speech: Pause");
		listen_status = "pause";
	} else if (listen_status == "pause") {
		speechSynthesis.pause();
		listen_btn.innerHTML = resume_button;
		listen_btn.setAttribute("title", "WP Speech: Resume");
		listen_status = "resume";
	} else if (listen_status == "resume") {
		listen_btn.innerHTML = pause_button;
		listen_status = "pause";
		listen_btn.setAttribute("title", "WP Speech: Pause");
		speechSynthesis.resume();
	}
}

/**
 * After ending reading the content.
 */
utterence.addEventListener("end", function(event) {
	speechSynthesis.cancel();
	let listen_btn = document.getElementById(
		localStorage.getItem("current_play_btn_id")
	);
	listen_btn.innerHTML = replay_button;
	listen_btn.setAttribute("title", "WP Speech: Replay");
	listen_status = "listen";
});

/**
 * Read the blog
 */

function listenCotentInFrontend(
	content = "Hellow World",
	btn_id = "wpa__listen_content",
	listeningSettings
) {
	/**
	 * Stop recording before listening.
	 */
	recognition.stop();
	localStorage.setItem("recordStarted", false);
	localStorage.setItem("current_play_btn_id", btn_id);

	startListening(btn_id, content, listeningSettings);
}

/**
 * Get all textarea and start recording on focus event and stop recording on focusout event.
 */
Object.values(document.getElementsByTagName("textarea")).forEach(
	(textarea, index) => {
		let record_btn = document.getElementById("wps__start__record");
		/**
		 * Start recording on focus event.
		 */
		textarea.addEventListener("focus", function() {
			/**
			 * Stop listening before recording.
			 */
			speechSynthesis.cancel();
			listen_status = "listen";
			let listen_btn = document.getElementById("wpa__listen_content");
			if (listen_btn) listen_btn.innerHTML = play_button;
			if (listen_btn) listen_btn.setAttribute("title", "WP Speech: Play");
			/**
			 * Start Recording.
			 */
			if (
				textarea.getAttribute("id") === "comment" ||
				textarea.getAttribute("id") === "wps__demo_text_for_play"
			) {
				localStorage.setItem(
					"current_recording_content_id",
					textarea.getAttribute("id")
				);
				startRecording(
					textarea.getAttribute("id"),
					localStorage.getItem("wps__sentence_delimiter")
				);

				record__status = "record";
				if (record_btn) record_btn.innerHTML = record_stop_button;
			}
		});

		/**
		 * Stop recording on focusout event.
		 */
		textarea.addEventListener("focusout", function() {
			// recognition.stop();
			// localStorage.setItem('recordStarted', false)
			// record__status = 'record';
			// record_btn.innerHTML = 'Start'
		});
	}
);
