/**
* Voice4Game voice command library by Calvin Wong and Stanley Tang
* with special thanks to Derrick J. Ho and Steven HokSeu Tan
**/
window.Voice4Game = (function() {
   var Voice4Game = {};

   /*
   * Maps voice commands to corresponding functions
   * String -> Function
   */
   Voice4Game.textToFunc = {};

   /*
   * Prepends HTML child node to document for debugging purposes.
   * NOTE: Chose to prepend/remove the node based on this field instead of
   * prepending it unconditionally and showing/hiding it so that the user the
   * may preserve their HTML's DOM structure if debugging is not needed.
   */
   Voice4Game.showDebug = false;

   /* Debug object with containers for transcription and log text */
   Voice4Game.debug = {
      transcription: {},
      log: {}
   };

   /**
   * Initialize the Voice4Game library with a mapping of voice commands to
   * corresponding functions
   */
   Voice4Game.init = function(textToFuncMap, showDebug) {
      Voice4Game.textToFunc = textToFuncMap;

      var doc = document.getElementsByTagName('html')[0];
      if (!Voice4Game.showDebug && showDebug) { // show debug if it was disabled
         var debugViewDOM = document.createElement("div");
         debugViewDOM.innerHTML =
           "<p>\
               <strong class=\"important\">Transcription:</strong>\
               <textarea id=\"transcription\" readonly=\"readonly\"></textarea>\
               <span id=\"ws-unsupported\" class=\"hidden\">API not supported</span>\
            </p>\
            <p>\
               <strong class=\"important\">Log:</strong>\
               <div id=\"log\"></div>\
            </p>";
         doc.insertBefore(debugViewDOM, doc.firstChild);
         // Direct debug text to prepended DOM elements
         Voice4Game.debug.transcription = document.getElementById('transcription');
         Voice4Game.debug.log = document.getElementById('log');
      }
      if (Voice4Game.showDebug && !showDebug) { // remove debug if it was enabled
         doc.removeChild(doc.childNodes[0]);
         // Direct debug text to empty objects
         Voice4Game.debug.transcription = {};
         Voice4Game.debug.log = {};
      }

      Voice4Game.showDebug = showDebug; // update showDebug
   };

   /**
   * Register a voice command in mapping
   */
   Voice4Game.registerVoiceCmd = function(voiceCmd, cmdFunc) {
      Voice4Game.textToFunc[voiceCmd] = cmdFunc;
   };

   /**
   * Unregister a voice command from mapping
   */
   Voice4Game.unregisterVoiceCmd = function(voiceCmd) {
      delete Voice4Game.textToFunc[voiceCmd];
   };

   // Respond to voice commands
   window.SpeechRecognition = window.SpeechRecognition       ||
                              window.webkitSpeechRecognition ||
                              null;

   var stop = 0;
   if (window.SpeechRecognition === null) {
       if (Voice4Game.showDebug) {
          document.getElementById('ws-unsupported').classList.remove('hidden');
       }
       // document.getElementById('button-play-ws').setAttribute('disabled', 'disabled');
       // document.getElementById('button-stop-ws').setAttribute('disabled', 'disabled');
   }
   else {
       var recognizer = new window.SpeechRecognition();
       // reference debug object (because contents within ref obj may change)
       var debugRef = Voice4Game.debug;
       var snd = new Audio("file.wav");

       // Interim results always on for demo purposes.
       recognizer.interimResults = true;

       recognizer.continuous = false;

       // Start recognising
       recognizer.onresult = function(event) {
           debugRef.transcription.textContent = '';

           var result;

           // Loop to find final result.
           for (var i = event.resultIndex; i < event.results.length; i++) {
               result = event.results[i][0].transcript;

               // Stops recognizing when "stop" is potentially heard
               if (result.indexOf("stop") > -1 && stop == 0) {
                   recognizer.stop();
                   result = result.substring(0, result.indexOf("stop"));
                   debugRef.log.innerHTML = 'Recognition stopped' + result + '<br />' + debugRef.log.innerHTML;
                   stop = 1;
               }

               // Gets rid of weird extra whitespace.
               if (i > 0 && stop == 0) {
                 console.log("test\n");
                 result = result.substring(1);
               }

               // When result is finalized
               if (event.results[i].isFinal) {
                 debugRef.transcription.textContent = result + ' (Confidence: ' + event.results[i][0].confidence + ')';

                 if (event.results[i][0].confidence < 0.5) {
                   console.log("voice4game error: confidence too low");
                 }

                 /*
                 * Check if result matches any registered Voice4Game commands
                 */
                 for (var voiceCmd in Voice4Game.textToFunc) {
                    if (result.indexOf(voiceCmd) > -1) {
                       Voice4Game.textToFunc[voiceCmd](result);
                       break;
                    }
                 }
               }
               else if(stop == 0) {
                 debugRef.transcription.textContent += result;
               }
           }
       };
       // Listen for errors
       recognizer.onerror = function(event) {
           debugRef.log.innerHTML = 'Recognition error: ' + event.error + '<br />' + debugRef.log.innerHTML;
       };

       recognizer.onend = function(event) {
           if (stop == 0) {
             recognizer.start();
           }
       };
   }

   Voice4Game.start = function() {
      try {
          recognizer.start();
          // Play sound when started
          snd.play();
          stop = 0;
           debugRef.log.innerHTML = 'Recognition started' + '<br />' + debugRef.log.innerHTML;
      }
      catch(ex) {
           debugRef.log.innerHTML = 'Recognition error: ' + ex.message + '<br />' + debugRef.log.innerHTML;
      }
   };

   Voice4Game.stop = function() {
      stop = 1;
      recognizer.stop();
      debugRef.log.innerHTML = 'Recognition stopped' + '<br />' + debugRef.log.innerHTML;
   };

   return Voice4Game;
}());
