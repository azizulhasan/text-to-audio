

/**
 * Get classic editor iframe content.
 */
function getIframeContent() {

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
    // This will run when the speech recognition service returns a result
    recognition.onstart = function () {
      console.log("Voice recognition started. Try speaking into the microphone.");
    };

    let classic_editor_iframe = document.getElementById("content_ifr").contentWindow.document.body;
    let current_text = "";
    recognition.onresult = function (event) {
      let event__length = event.results.length;
      current_text = event.results[event__length - 1][0].transcript + ".";
      let previous_text = classic_editor_iframe.innerHTML;
      classic_editor_iframe.innerHTML = previous_text + " " + current_text;
    };

    // start recognition
    recognition.start();

    // Restart on sound end.
    recognition.addEventListener('soundend', function(){
      console.log('speach end')
      setTimeout(() => {
        recognition.start();
      }, 100);
    })
    } else {
      console.log("Speech recognition not supported 😢");
      // code to handle error
    }
  };

  
  setTimeout(() => {
      getIframeContent()
  }, 1000);
