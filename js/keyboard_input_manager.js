function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

// TODO: Edit this
KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Respond to voice commands
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

                  // 2048 Commands
                  if (result.indexOf("up") > -1) {
                      self.emit("move", 0);
                  }
                  if (result.indexOf("right") > -1) {
                      self.emit("move", 1);
                  }
                  if (result.indexOf("down") > -1) {
                      self.emit("move", 2);
                  }
                  if (result.indexOf("left") > -1) {
                      self.emit("move", 3);
                  }
                  if (result.indexOf("restart") > -1 ||
                      result.indexOf("retry") > -1) {
                      self.emit("restart");
                  }
                  if (result.indexOf("continue") > -1) {
                      self.emit("keepPlaying");
                  }

                  /* Voice commands for page zoom control
                     1. Zoom in/out by the default 10% or a specified offset
                     2. Zoom to a specified absolute percentage
                     3. Reset zoom to 100% */
                  if (result.indexOf("zoom in") > -1 || result.indexOf("zoom out") > -1) {
                      var curZoom = parseFloat(document.body.style.zoom);
                      var zoomStep = 10;               // 10% step by default
                      var numericMatches = result.match(/[0-9]+$/);

                      if (isNaN(curZoom)) {
                         curZoom = 1.0;
                      }
                      if (numericMatches != null && numericMatches.length > 0) {
                         zoomStep = parseFloat(numericMatches[0]);
                      }

                      if (result.indexOf("in") > -1) { // Zoom in
                         curZoom += zoomStep / 100;
                      }
                      else {                           // Zoom out
                         curZoom -= zoomStep / 100;
                      }
                      // alert("zooming to " + curZoom);
                      document.body.style.zoom = curZoom;
                  }
                  if (result.indexOf("set zoom ") > -1) {
                      var numericMatches = result.match(/[0-9]+$/);
                      if (numericMatches.length > 0) {
                         var newZoom = parseFloat(numericMatches[0]);
                         // alert("zooming to " + newZoom);
                         document.body.style.zoom = newZoom / 100;
                      }
                      else {
                         alert("set zoom: must specify percentage to zoom to");
                      }
                  }
                  if (result.indexOf("reset zoom") > -1) {
                      // alert("resetting zoom to 100%")
                      document.body.style.zoom = 1.0;
                  }

                  /* Voice commands for scrolling control
                     1. Scroll to top of the game container */
                  if (result.indexOf("scroll to game") > -1) {
                      var gameContainer = document.getElementsByClassName("game-container")[0];
                      var gameContainerY = gameContainer.getBoundingClientRect().top;
                      $('html, body').animate({
                         'scrollTop': gameContainerY
                      });
                  }
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

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    // Ignore the event if it's happening in a text field
    if (self.targetIsInput(event)) return;

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1 ||
        self.targetIsInput(event)) {
      return; // Ignore if touching with more than 1 finger or touching input
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0 ||
        self.targetIsInput(event)) {
      return; // Ignore if still touching with one or more fingers or input
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.targetIsInput = function (event) {
  return event.target.tagName.toLowerCase() === "input";
};
