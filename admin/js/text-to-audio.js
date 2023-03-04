import Speech from "speak-tts";



// const ttaGetData = async (url = '', data = {}) => {
// 	// Default options are marked with *
// 	const response = await fetch(url, {
// 		// headers: {
// 		//   "Content-Type": "application/json",
// 		// },
// 		method: 'POST', // *GET, POST, PUT, DELETE, etc.
// 		body: data, // body data type must match "Content-Type" header
// 	});
// 	const responseData = await response.json(); // parses JSON response into native JavaScript objects

// 	return responseData;
// };
// let recordSettings = {}
// let recordData = new FormData();
// ttaGetData(ttsObj.json_url + 'tta/v1/record', recordData)
// 	.then((res) => {
// 		recordSettings = res.data;

// 		recognition.continuous = recordSettings.is_record_continously
// 			? recordSettings.is_record_continously
// 			: true;
// 		recognition.lang = recordSettings.tta__recording__lang
// 			? recordSettings.tta__recording__lang
// 			: 'en-US';
// 		localStorage.setItem(
// 			'tta__sentence_delimiter',
// 			recordSettings.tta__sentence_delimiter,
// 		);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});


let TTA = {

	speech: new Speech(),
	speechSynthesis: window.speechSynthesis,
	utterence: new SpeechSynthesisUtterance(),
	speechRecognitionIsActive: true,
	speechRecognition: window.speechRecognition || window.webkitSpeechRecognition,
	recordStatus: 'record',
	listenStatus: 'listen',
	noticeClass: 'tta_notice',
	cofiguration: {},
	timer: null,
	buttonId: window.buttonId,
	speakButton: document.getElementById("tta__listent_content_" + window.buttonId),
	conntent: window.ttsContent,
	ttsListeningSettings: window.ttsListeningSettings,
	languages: [],
	voices: {},
	voice: "Microsoft David - English (United States)",
	language: 'en-AU',
	speak: (speech) => {
		TTA.language = TTA.ttsListeningSettings.tta__listening_lang;
		TTA.voice = TTA.ttsListeningSettings.tta__listening_voice;
		if (TTA.language) speech.setLanguage(TTA.language);
		if (TTA.voice) speech.setVoice(TTA.voice);
		speech
			.speak({
				text: TTA.conntent,
				queue: false,
				listeners: {
					onstart: () => {
						console.log("Start utterance");
					},
					onend: () => {
						if (!TTA.speechSynthesis.speaking) {
							console.log('End utterance');
							TTA.speakButton.innerHTML = TTA.replayButtonContent();
							TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.replayButtonText());
							TTA.listenStatus = 'listen';
						}
					},
					onresume: () => {
						console.log("Resume utterance");
					},
					// onboundary: event => {
					// 	console.log(
					// 		event.name +
					// 		" boundary reached after " +
					// 		event.elapsedTime +
					// 		" milliseconds."
					// 	);
					// }
				}
			})
			.then(data => {
				// console.log("Success !", data);
			})
			.catch(e => {
				console.error("An error occurred :", e);
			});
	},
	buttonTextArr: ttsObj.buttonTextArr,
	playButtonText: function () {
		return this.buttonTextArr.listen_text;
	},

	playButtonContent: function () {

		return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.playButtonText() + '<span></span></span></div>'
	},
	replayButtonText: function () {
		return this.buttonTextArr.replay_text;
	},
	replayButtonContent: function () {
		return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-image-rotate"></span> <span> ' + this.replayButtonText() + '<span></span></span></div>'
	},
	pauseButtonText: function () {
		return this.buttonTextArr.pause_text;
	},
	pauseButtonContent: function () {
		return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-pause"></span> <span> ' + this.pauseButtonText() + '<span></span></span></div>'
	},
	resumeButtonText: function () {
		return this.buttonTextArr.resume_text;
	},
	resumeButtonContent: function () {
		return '<div style="display:flex;justify-content:center;align-items:center;"><span class="dashicons dashicons-controls-play"></span> <span> ' + this.buttonTextArr.resume_text + '<span></span></span></div>'
	},
	recordStartButtonContent: function () {
		return '<span class="dashicons dashicons-controls-volumeoff"></span> ' + this.buttonTextArr.start_text;
	},

	recordStopButtonConten: function () {
		return '<span class="dashicons dashicons-controls-volumeon"></span> ' + this.buttonTextArr.stop_text;
	},


	displayApiMissing(button_id = '', is_dashboard = false) {
		let notice = '';
		let link = '';

		if (!this.TTA.speechRecognitionIsActive) {
			notice += 'Text To Audio: Please enable speechRecognition';
		}
		if (!this.speechSynthesis) {
			if (notice) {
				notice += ' , speechSynthesis.';
			} else {
				notice += 'Text To Audio: Please enable speechSynthesis.';
			}
		}

		if (button_id) {
			let previousSibling =
				document.getElementById(button_id).previousSibling;
			if (previousSibling) {
				notice += ` Click here to <a href="https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F" target="_blank">enable</a>`;
				previousSibling.style.display = 'block';
				previousSibling.innerHTML = notice;
				setTimeout(() => {
					document.querySelector('.tta_notice').style.display =
						'none';
					previousSibling.innerHTML = '';
				}, 5000);
			} else {
				link +=
					ttsObj.admin_url +
					'admin.php?page=text-to-audio#/docs';
				notice += `\nFollow this link to enable: \n${link}`;
				alert(notice);
			}
		} else {
			if (is_dashboard) {
				link +=
					ttsObj.admin_url +
					'admin.php?page=text-to-audio#/docs';
			} else {
				if (
					location.search === '?page=text-to-audio' &&
					location.hash === '#/customize'
				) {
					link +=
						ttsObj.admin_url +
						'admin.php?page=text-to-audio#/docs';
				} else {
					link +=
						'https://wordpress.org/plugins/text-to-audio/#how%20to%20enable%20%60%60speechsynthesis%60%60%20on%20firefox%3F';
				}
			}
			notice += `\nFollow this link to enable: \n${link}`;
			alert(notice);
		}
		throw new Error(notice);
	},
};

function _init() {

	if (TTA.ttsListeningSettings === undefined) return;
	console.log(ttsListeningSettings)
	console.log(TTA.voice)
	console.log(TTA.speech)
	console.log(TTA.voices)
	TTA.speech
		.init({
			volume: TTA.ttsListeningSettings.tta__listening_volume
				? TTA.ttsListeningSettings.tta__listening_volume
				: 1, // From 0 to 1,
			lang: TTA.ttsListeningSettings.tta__listening_lang
				? TTA.ttsListeningSettings.tta__listening_lang
				: TTA.language, // It will be speaking language.
			rate: TTA.ttsListeningSettings.tta__listening_rate
				? TTA.ttsListeningSettings.tta__listening_rate
				: 1, // From 0.1 to 10
			pitch: TTA.ttsListeningSettings.tta__listening_pitch
				? TTA.ttsListeningSettings.tta__listening_pitch
				: 2, // From 0 to 2
			voice: TTA.ttsListeningSettings.tta__listening_voice
				? TTA.ttsListeningSettings.tta__listening_voice
				: TTA.voice,
			splitSentences: true,
			listeners: {
				onvoiceschanged: voices => {
					//
				}
			}
		})
		.then(data => {
			TTA.voices = data.voices;
			_prepareSpeakButton(TTA.speech);
		})
		.catch(e => {
			console.error("An error occured while initializing : ", e);
		});
	// This will require for later.
	// const text = TTA.speech.hasBrowserSupport()
	// 	? "Hurray, your browser supports speech synthesis"
	// 	: "Your browser does NOT support speech synthesis. Try using Chrome of Safari instead !";
	// document.getElementById("support").innerHTML = text;
}

function _prepareSpeakButton(speech) {
	TTA.speakButton.addEventListener("click", () => {
		if (TTA.listenStatus == 'listen') {
			TTA.speak(speech)
			TTA.speakButton.innerHTML = TTA.pauseButtonContent();
			TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
			TTA.listenStatus = 'pause';
		} else if (TTA.listenStatus == 'pause') {
			TTA.speech.pause();
			TTA.speakButton.innerHTML = TTA.resumeButtonContent();
			TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.resumeButtonText());
			TTA.listenStatus = 'resume';
		} else if (TTA.listenStatus == 'resume') {
			TTA.speech.resume();
			TTA.speakButton.innerHTML = TTA.pauseButtonContent();
			TTA.listenStatus = 'pause';
			TTA.speakButton.setAttribute('title', 'Text To Audio : ' + TTA.pauseButtonText());
		}
	});
}

window.tta = TTA;

_init();
