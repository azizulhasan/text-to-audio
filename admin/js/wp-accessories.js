

    var  record__status = 0;
    if ("speechSynthesis" in window) {
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
    
} else {
  console.log("Speech recognition not supported 😢");
  // code to handle error
}




document.getElementById('wpa__start__record').addEventListener('click', function(e){
  e.preventDefault();
  if (record__status == 1) {
    record__status = 0;
    recognition.stop();
    e.target.innerHTML = 'start'
    setTimeout(()=> {
      startRecording();
    },100)
  }else{
    startRecording();
    record__status = 1;
    e.target.innerHTML = 'Restart'
  }



})


/**
 * Start recording.
 * @param {string} textarea_id 
 */
function startRecording(textarea_id = 'content_ifr') {
    // start recognition
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



document.getElementById("wpa__listent_content").addEventListener('click', function(e){
  e.preventDefault();


   
        /**********************************************
       * Listen speach
       */

      // Speech Synthesis supported

      
      
        let  classic_editor_iframe = document.getElementById('content_ifr').contentWindow.document.body;
        console.log(classic_editor_iframe.innerHTML)

        if ("speechSynthesis" in window) {
          var msg = new SpeechSynthesisUtterance();
          var voices = speechSynthesis.getVoices();
          msg.voice = voices[10];
          msg.volume = 1; // From 0 to 1
          msg.rate = 1; // From 0.1 to 10
          msg.pitch = 2; // From 0 to 2
          msg.text = 'text';
          msg.lang = "en";
    
    
          speechSynthesis.speak(msg);
          console.log(speechSynthesis.getVoices())
        }



  // speechSynthesis.getVoices().forEach(function(voice) {
  //   console.log(voice.name, voice.default ? voice.default :'');
  // });
})