

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
recognition.maxAlternatives = 1;
document.getElementById('wpa__start__record').addEventListener('click', function(e){
  e.preventDefault();
  if (record__status == 'stop') {
    record__status = 'record';
    recognition.stop();
    e.target.innerHTML = 'Start'
  }else if(record__status == 'record'){
    startRecording();
    record__status = 'stop';
    e.target.innerHTML = 'Stop'
  }
})


/**
 * 
 * restart recording
 */
recognition.onsoundend = function(){
  record__status = 'record';
  document.getElementById('wpa__start__record').innerHTML = 'Start'
}

/**
 * Start recording.
 * @param {string} textarea_id 
 */
function startRecording(textarea_id = 'content_ifr') {
    recognition.start();
     // This will run when the speech recognition service returns a result
     recognition.onstart = function () {
      console.log("Voice recognition started. Try speaking into the microphone.");
    };

    let classic_editor_iframe = document.getElementById(textarea_id).contentWindow.document.body;
    let current_text = "";
    recognition.onresult = function (event) {
      let event__length = event.results.length;
      current_text = event.results[event__length - 1][0].transcript + ".";
      let previous_text = classic_editor_iframe.innerHTML;
      classic_editor_iframe.innerHTML = previous_text + " " + current_text;
    };

};


/**
 * Listen content.
 */
var listen_status = 'listen'
document.getElementById("wpa__listent_content").addEventListener('click', function(e){
  e.preventDefault();
  // Speech Synthesis supported
  recognition.stop();
  let  classic_editor_iframe = document.getElementById('content_ifr').contentWindow.document.body;
    if ("speechSynthesis" in window) {
      var utterence = new SpeechSynthesisUtterance();
      var voices = speechSynthesis.getVoices();
      utterence.voice = voices[0];
      utterence.volume = 1; // From 0 to 1
      utterence.rate = 1; // From 0.1 to 10
      utterence.pitch = 2; // From 0 to 2
      utterence.text = classic_editor_iframe.innerHTML;
      utterence.lang = "en-US";

      if(listen_status == 'listen'){
        speechSynthesis.speak(utterence);
        this.innerHTML = 'Pause'
        listen_status = 'pause';
      }else if(listen_status == 'pause'){
        speechSynthesis.pause();
        this.innerHTML = 'Resume';
        listen_status = 'resume';
      }else if(listen_status == 'resume'){
        this.innerHTML = 'Pause';
        listen_status = 'pause';
        speechSynthesis.resume();
      }


      utterence.addEventListener('end', function(event) {
        console.log(event)
        document.getElementById("wpa__listent_content").innerHTML = 'Listen';
        listen_status = 'listen';
      });
      
      //console.log(utterence)
    }else {
      console.log("Speech speechSynthesis not supported 😢");
      // code to handle error
    }

})


