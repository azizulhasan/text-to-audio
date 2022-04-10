

var  record__status = 'record';
var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
var SpeechGrammar = window.SpeechGrammar || webkitSpeechGrammar;
var SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
var recognition = new SpeechRecognition();
var grammar = '#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;'
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
var newGrammar = new SpeechGrammar();
newGrammar.src = '#JSGF V1.0; grammar names; public <name> = chris | kirsty | mike;'
speechRecognitionList[1] = newGrammar; // should add the new SpeechGrammar object to the list
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 2;




/**
 * Listen content.
 */
 var listen_status = 'listen'
if ("speechSynthesis" in window) {
  var utterence = new SpeechSynthesisUtterance();
  utterence.volume = 1; // From 0 to 1
  utterence.rate = 1; // From 0.1 to 10
  utterence.pitch = 2; // From 0 to 2
  utterence.lang = "en-US"; // It will be speaking language.
}else {
  console.log("Speech speechSynthesis not supported 😢");
  // code to handle error
}



/**
 * 
 * @param {*} current_reading_content_id 
 */

 window.onload = function(){
  localStorage.setItem('recordStarted', false)
  localStorage.setItem('current_reading_content_id', 'content_ifr')
  var voices = speechSynthesis.getVoices();
  utterence.voice = voices[0];
}
window.onload()

/**
 * Start recording.
 * @param {string} currnt_record_content_id 
 */
function startRecording(currnt_record_content_id = 'content_ifr') {
  /**
   * Stop listening before recording.
   */
   speechSynthesis.cancel();

  let record_btn = document.getElementById('wpa__start__record')
  if (record__status == 'stop') {
    record__status = 'record';
    recognition.stop()
    localStorage.setItem('recordStarted', false)
    if(record_btn) record_btn.innerHTML = "Start"
  }else if(record__status == 'record'){
    if(localStorage.getItem('recordStarted') == null  || localStorage.getItem('recordStarted') == 'false'){
      localStorage.setItem('recordStarted', true)
      recognition.start()
    }
    record__status = 'stop';
    if(record_btn) record_btn.innerHTML = "Stop"
  }
  
  let current_reading_content = '';
  // console.log(currnt_record_content_id)
  if(currnt_record_content_id == 'content_ifr'){
     current_reading_content = document.getElementById(currnt_record_content_id).contentWindow.document.body;
  }else{
    current_reading_content = document.getElementById(currnt_record_content_id)
  }
  // console.log(current_reading_content.innerHTML);


  let current_text = "";
  recognition.onresult = function (event) {
    let event__length = event.results.length;
    current_text = event.results[event__length - 1][0].transcript + ".";
    current_text = captalizeString(current_text)
    let previous_text = current_reading_content.innerHTML;
    
    current_reading_content.innerHTML = previous_text + current_text;
  };

};

/**
 * Capitalize String.
 */
function captalizeString(string){
  if(string[0] !== ' '){
    return string[0].toUpperCase()+string.slice(1)
  }else{
    return ' '+string[1].toUpperCase()+string.slice(2)
  }
}

/**
 * 
 * restart recording
 */
 recognition.onsoundend = function(){
  record__status = 'record';
  let record_btn = document.getElementById('wpa__start__record');
  if(record_btn) record_btn.innerHTML = 'Start'
}



/**
 * Listent/Pause/Resume content.
 */
function listenCotentInDashboard(){

  let  current_reading_content = '';
  if(localStorage.getItem('current_reading_content_id') !== null && localStorage.getItem('current_reading_content_id') != 'content_ifr'){
    current_reading_content = document.getElementById(localStorage.getItem('current_reading_content_id'));
  }else{
    current_reading_content = document.getElementById('content_ifr').contentWindow.document.body;
  }

  let text = current_reading_content.innerText || current_reading_content.textContent;
  current_reading_content.innerHTML = text;

  utterence.text = current_reading_content.innerHTML
  /**
   * Stop recording before listening.
   */
  recognition.stop();
  localStorage.setItem('recordStarted', false)
  localStorage.setItem('current_play_btn_id', 'wpa__listent_content')
  localStorage.setItem('current_reading_content', current_reading_content.innerHTML)

  startReadingContent('wpa__listent_content')
}
/**
 * Start Reading content
 */

function startReadingContent(btn_id){
  let listen_btn = document.getElementById(btn_id);
  // utterence.text = localStorage.getItem('current_reading_content')
  console.log(listen_status)
  if(listen_status == 'listen'){
    console.log(utterence)
    speechSynthesis.speak(utterence);
    listen_btn.innerHTML = '<span class="dashicons dashicons-controls-pause"></span> Pause';
    listen_btn.setAttribute('title', "WP Speech: Pause")
    listen_status = 'pause';
  }else if(listen_status == 'pause'){
    speechSynthesis.pause();
    listen_btn.innerHTML = '<span class="dashicons dashicons-controls-play"></span> Resume';
    listen_btn.setAttribute('title', "WP Speech: Resume")
    listen_status = 'resume';
  }else if(listen_status == 'resume'){
    listen_btn.innerHTML = '<span class="dashicons dashicons-controls-pause"></span> Pause'
    listen_status = 'pause';
    listen_btn.setAttribute('title', "WP Speech: Pause")
    speechSynthesis.resume();
  }
}



/**
 * Read the blog
 */

function listenCotentInFrontend(content ="Hellow World", btn_id= 'wpa__listent_content'){

  /**
     * Stop recording before listening.
     */
  recognition.stop();
  localStorage.setItem('recordStarted', false)
  localStorage.setItem('current_play_btn_id', btn_id)
  utterence.text = content;
  startReadingContent(btn_id)
}


/**
 * After ending reading the content.
 */
utterence.addEventListener('end', function(event) {

  let listen_btn = document.getElementById(localStorage.getItem('current_play_btn_id'));
  listen_btn.innerHTML = '<span class="dashicons dashicons-image-rotate"></span> Replay';
  listen_btn.setAttribute('title', "WP Speech: Replay")
  listen_status = 'listen';


});


/**
 * Get all textarea and start recording on focus event and stop recording on focusout event.
 */
Object.values(document.getElementsByTagName('textarea')).forEach((textarea, index)=>{
  // console.log(textarea.getAttribute('id'))
  let record_btn = document.getElementById('wpa__start__record')

  /**
   * Start recording on focus event.
   */
  textarea.addEventListener('focus', function(){
    /**
     * Stop listening before recording.
     */
    speechSynthesis.cancel();
    let listen_btn = document.getElementById('wpa__listent_content');
    if(listen_btn) listen_btn.innerHTML = '<span class="dashicons dashicons-controls-play"></span> Play';
    if(listen_btn)   listen_btn.setAttribute('title', "WP Speech: Play")
    listen_status = 'listen';
    /**
     * Start Recording.
     */
    startRecording(textarea.getAttribute('id'))
    localStorage.setItem('current_reading_content_id', textarea.getAttribute('id'))
    record__status = 'record';
    if(record_btn) record_btn.innerHTML = "Stop"
  })

  /**
   * Stop recording on focusout event.
   */
  textarea.addEventListener('focusout', function(){
    // recognition.stop();
    // localStorage.setItem('recordStarted', false)
    // record__status = 'record';
    // record_btn.innerHTML = 'Start'
  })
})


