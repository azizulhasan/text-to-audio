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

var record__status = "record";
var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
var SpeechGrammar = window.SpeechGrammar || webkitSpeechGrammar;
var SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
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
getData(
  "http://localhost/azizulhasan/pro_two/wp-json/wps/v1/speech/record",
  recordData
)
  .then((res) => {
    recordSettings = res.data;

    recognition.continuous = recordSettings.is_record_continously
      ? recordSettings.is_record_continously
      : true;
    recognition.lang = recordSettings.wps__recording__lang
      ? recordSettings.wps__recording__lang
      : "en-US";
      localStorage.setItem('wps__sentence_delimiter', recordSettings.wps__sentence_delimiter)
  })
  .catch((err) => {
    console.log(err);
  });

recognition.interimResults = false;
recognition.maxAlternatives = 2;

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
 * @param {*} current_reading_content_id
 */

window.onload = function() {
  localStorage.setItem("recordStarted", false);
  localStorage.setItem("current_reading_content_id", "content_ifr");
  speechSynthesis.cancel()
};
window.onload();

/**
 * Start recording.
 * @param {string} currnt_record_content_id
 */
function startRecording(currnt_record_content_id = "content_ifr", wps__sentence_delimiter= '.') {
  /**
   * Stop listening before recording.
   */
  speechSynthesis.cancel();

  let record_btn = document.getElementById("wps__start__record");
  if (record__status == "stop") {
    record__status = "record";
    recognition.stop();
    localStorage.setItem("recordStarted", false);
    if (record_btn) record_btn.innerHTML = '<span class="dashicons dashicons-controls-volumeoff"></span> Start';
  } else if (record__status == "record") {
    if (
      localStorage.getItem("recordStarted") == null ||
      localStorage.getItem("recordStarted") == "false"
    ) {
      localStorage.setItem("recordStarted", true);
      recognition.start();
    }
    record__status = "stop";
    if (record_btn) record_btn.innerHTML = '<span class="dashicons dashicons-controls-volumeon"></span> Stop';
  }

  let current_reading_content = "";
  // console.log(currnt_record_content_id)
  if (currnt_record_content_id == "content_ifr") {
    current_reading_content = document.getElementById(currnt_record_content_id)
      .contentWindow.document.body;
  } else {
    current_reading_content = document.getElementById(currnt_record_content_id);
  }
  // console.log(current_reading_content.innerHTML);

  let current_text = "";
  recognition.onresult = function(event) {
    let event__length = event.results.length;
    current_text = event.results[event__length - 1][0].transcript + wps__sentence_delimiter;
    current_text = captalizeString(current_text);
    /**
     * Customize page.
     */
    if (currnt_record_content_id == "wps__demo_text_for_play") {
      let previous_text = current_reading_content.value;
      current_reading_content.value = previous_text + current_text;
    } else {
      let previous_text = current_reading_content.innerHTML;
      current_reading_content.innerHTML = previous_text + current_text;
    }
  };
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
  if (record_btn) record_btn.innerHTML = '<span class="dashicons dashicons-controls-volumeoff"></span> Start';
};

/**
 * Listent/Pause/Resume content.
 */
function listenCotentInDashboard(btn_id, content, listeningSettings) {
  let current_reading_content = "";
  if (
    localStorage.getItem("current_reading_content_id") !== null &&
    localStorage.getItem("current_reading_content_id") != "content_ifr"
  ) {
    current_reading_content = document.getElementById(
      localStorage.getItem("current_reading_content_id")
    );
  } else {
    current_reading_content = document.getElementById("content_ifr")
      .contentWindow.document.body;
  }

  let text =
    current_reading_content.innerText || current_reading_content.textContent;


  /**
   * Stop recording before listening.
   */
  recognition.stop();
  localStorage.setItem("recordStarted", false);
  localStorage.setItem("current_play_btn_id", btn_id, );
  localStorage.setItem(
    "current_reading_content",
    text
  );

  startReadingContent(btn_id, text, listeningSettings);
}

// speechSynthesis.cancel()
/**
 * Start Reading content
 */
function startReadingContent(btn_id, content, listeningSettings=null) {
  let listen_btn = document.getElementById(btn_id);

 
  utterence.text = content;
  var voices = speechSynthesis.getVoices();
  if(listeningSettings){
    utterence.voice = voices.filter(
      (voice, i) => voice.name === listeningSettings.wps__listening_voice
    )[0];
  }else{
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
    // console.log(utterence)
    speechSynthesis.speak(utterence);
    listen_btn.innerHTML =
      '<span class="dashicons dashicons-controls-pause"></span> Pause';
    listen_btn.setAttribute("title", "WP Speech: Pause");
    listen_status = "pause";
  } else if (listen_status == "pause") {
    speechSynthesis.pause();
    listen_btn.innerHTML =
      '<span class="dashicons dashicons-controls-play"></span> Resume';
    listen_btn.setAttribute("title", "WP Speech: Resume");
    listen_status = "resume";
  } else if (listen_status == "resume") {
    listen_btn.innerHTML =
      '<span class="dashicons dashicons-controls-pause"></span> Pause';
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
    listen_btn.innerHTML =
      '<span class="dashicons dashicons-image-rotate"></span> Replay';
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

  startReadingContent(btn_id, content, listeningSettings);

 
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
      let listen_btn = document.getElementById("wpa__listen_content");
      if (listen_btn)
        listen_btn.innerHTML =
          '<span class="dashicons dashicons-controls-play"></span> Play';
      if (listen_btn) listen_btn.setAttribute("title", "WP Speech: Play");
      listen_status = "listen";
      /**
       * Start Recording.
       */
      startRecording(textarea.getAttribute("id"), localStorage.getItem('wps__sentence_delimiter'));
      localStorage.setItem(
        "current_reading_content_id",
        textarea.getAttribute("id")
      );
      record__status = "record";
      if (record_btn) record_btn.innerHTML = '<span class="dashicons dashicons-controls-volumeon"></span> Stop';
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
