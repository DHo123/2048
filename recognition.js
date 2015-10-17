// Test browser support
      window.SpeechRecognition = window.SpeechRecognition       ||
                                 window.webkitSpeechRecognition ||
                                 null;

	var stop = 0;

    if (window.SpeechRecognition === null) {
        document.getElementById('ws-unsupported').classList.remove('hidden');
        document.getElementById('button-play-ws').setAttribute('disabled', 'disabled');
        document.getElementById('button-stop-ws').setAttribute('disabled', 'disabled');
    }
    else {
        var recognizer = new window.SpeechRecognition();
        var transcription = document.getElementById('transcription');
        var log = document.getElementById('log');
		var snd = new Audio("file.wav");

        recognizer.continuous = true;

        // Start recognising
        recognizer.onresult = function(event) {
        transcription.textContent = '';

            var result;
            var win;
            for (var i = event.resultIndex; i < event.results.length; i++) {

                result = event.results[i][0].transcript;

                // Stops recognizing when "stop" is heard
                if (result.indexOf("stop") > -1 && stop == 0) {
                    recognizer.stop();
                    result = result.substring(0, result.indexOf("stop"));
                    log.innerHTML = 'Recognition stopped' + result + '<br />' + log.innerHTML;
                    stop = 1;
                }

                // Gets rid of weird extra whitespace.
                if (i > 0 && stop == 0) {
                  console.log("test\n");
                  result = result.substring(1);
                }

                // When result is finalized
                if (event.results[i].isFinal) {
                  transcription.textContent = result + ' (Confidence: ' + event.results[i][0].confidence + ')';

                    // First word will be some command.
                    var cmd = result.substr(0,result.indexOf(' '));

                    if (result.indexOf("print") == 0) {
                        log.innerHTML = result.substring(6) + '<br />' + log.innerHTML;
                    }
                    if (result == "hello") {
                        alert("Hello to you as well.");
                    }
                    if (result.indexOf("new page") > -1) {
                        window.open();
                    }
                    if (result.indexOf("go to ") > -1) {
                        window.open("https://" + result.substring(6), "_blank");
                    }
                    else if (result.indexOf("goto ") > -1) {
                        window.open("https://" + result.substring(5), "_blank");
                    }
/*
                    if(result.indexOf("down") > -1) {
                        var frame = document.getElementById("rightside");
                        frame.contentWindow.scrollBy(0,100);
                        window.scrollBy(0, 100);
                    }
*/
                }
                else if(stop == 0) {
                  transcription.textContent += result;
                }
            }
        };

        // Listen for errors
        recognizer.onerror = function(event) {
            log.innerHTML = 'Recognition error: ' + event.message + '<br />' + log.innerHTML;
        };

        window.onbeforeunload = function() {
            recognizer.abort();
            return "Please be sure you stopped recording.";
        }

        document.getElementById('button-play-ws').addEventListener('click', function() {
            // Set if we need interim results
            recognizer.interimResults = document.querySelector('input[name="recognition-type"][value="interim"]').checked;

            try {
                recognizer.start();
                // Play sound when started
                snd.play();
                stop = 0;
                log.innerHTML = 'Recognition started' + '<br />' + log.innerHTML;
            }
            catch(ex) {
                    log.innerHTML = 'Recognition error: ' + ex.message + '<br />' + log.innerHTML;
            }
        });

        document.getElementById('button-stop-ws').addEventListener('click', function() {
            recognizer.stop();
            log.innerHTML = 'Recognition stopped' + '<br />' + log.innerHTML;
        });

        document.getElementById('clear-all').addEventListener('click', function() {
          transcription.textContent = '';
          log.textContent = '';
        });
      }
