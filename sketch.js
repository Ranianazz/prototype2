/* Global variables for audio context and shape management */
let audioContext; // Holds the Web Audio API context for sound generation
// Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
let shapes = []; // Array to store shape objects for animation
let noteIndex = 0; // Tracks current note in the song sequence
const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // Frequencies for C major pentatonic scale (C4, D4, E4, G4, A4)
// Source: https://en.wikipedia.org/wiki/Pentatonic_scale
const songSequences = {
  itsybitsy: [
    0,
    0,
    1,
    2,
    2,
    1,
    0, // C4, C4, D4, E4, E4, D4, C4
    1,
    1,
    2,
    3,
    3,
    2, // D4, D4, E4, G4, G4, E4
    0,
    0,
    1,
    2,
    2,
    1,
    0, // C4, C4, D4, E4, E4, D4, C4
    1,
    2,
    3,
    2,
    1,
    0, // D4, E4, G4, E4, D4, C4
  ], // Itsy Bitsy Spider
  oldmacdonald: [
    0,
    0,
    0,
    0,
    2,
    2,
    0, // C4, C4, C4, C4, E4, E4, C4
    1,
    1,
    0,
    0,
    1,
    1, // D4, D4, C4, C4, D4, D4
    2,
    2,
    3,
    3,
    2,
    1,
    0, // E4, E4, G4, G4, E4, D4, C4
    0,
    0,
    0,
    0,
    0,
    0, // C4, C4, C4, C4, C4, C4
  ], // Old MacDonald Had a Farm
  bingo: [
    0,
    0,
    2,
    2,
    3,
    3,
    2, // C4, C4, E4, E4, G4, G4, E4
    1,
    1,
    0,
    0,
    1,
    1, // D4, D4, C4, C4, D4, D4
    2,
    2,
    3,
    3,
    2,
    1,
    0, // E4, E4, G4, G4, E4, D4, C4
    0,
    0,
    0,
    0,
    0,
    0, // C4, C4, C4, C4, C4, C4
  ], // BINGO
  happy: [
    0,
    0,
    1,
    2,
    0,
    2,
    1, // C4, C4, D4, E4, C4, E4, D4
    0,
    0,
    1,
    2,
    1,
    0, // C4, C4, D4, E4, D4, C4
    1,
    1,
    2,
    3,
    2,
    1,
    0, // D4, D4, E4, G4, E4, D4, C4
    0,
    0,
    1,
    2,
    1,
    0, // C4, C4, D4, E4, D4, C4
  ], // If You're Happy and You Know It
};
let currentSong = "itsybitsy"; // Default song
let reverb, lowPass, delay, panner; // Audio effects

// Sets up the p5.js canvas and audio context
// Source: https://p5js.org/reference/#/p5/setup
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); // Creates a canvas matching window dimensions
  canvas.parent("sketch-holder"); // Attaches canvas to the DOM element with id 'sketch-holder'
  background(255, 255, 255, 0); // Sets transparent background
  // Source: https://p5js.org/reference/#/p5/getAudioContext
  audioContext = getAudioContext(); // Initializes p5.js audio context
  // Initialize audio effects
  // Source: https://p5js.org/reference/#/p5.Reverb
  reverb = new p5.Reverb();
  reverb.drywet(0.3); // Moderate reverb mix
  // Source: https://p5js.org/reference/#/p5.Filter
  lowPass = new p5.Filter("lowpass");
  lowPass.freq(800); // Low-pass filter at 800 Hz
  // Source: https://p5js.org/reference/#/p5.Delay
  delay = new p5.Delay();
  delay.delayTime(0.2); // 200ms delay
  delay.feedback(0.4); // Moderate feedback
  // Source: https://p5js.org/reference/#/p5.Panner
  panner = new p5.Panner();
  console.log("Setup complete, audio context state:", audioContext.state); // Logs audio context state
  noLoop(); // Disables automatic draw loop to optimize performance
  setupSongButtons(); // Sets up song selection buttons
}

// Sets up event listeners for song selection buttons
function setupSongButtons() {
  const buttons = document.querySelectorAll(".song-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      currentSong = button.dataset.song; // Sets current song
      noteIndex = 0; // Resets note index
      buttons.forEach((btn) => btn.classList.remove("active")); // Removes active class from all buttons
      button.classList.add("active"); // Adds active class to clicked button
      console.log("Selected song:", currentSong); // Logs song selection
    });
  });
  // Set default song button as active
  document
    .querySelector('.song-btn[data-song="itsybitsy"]')
    .classList.add("active");
}

// Draws and updates all shapes on the canvas
// Source: https://p5js.org/reference/#/p5/draw
function draw() {
  clear(); // Clears the canvas for each frame
  console.log("Drawing", shapes.length, "shapes"); // Logs number of shapes being drawn
  for (let i = shapes.length - 1; i >= 0; i--) {
    // Iterates through shapes in reverse to safely remove them
    shapes[i].update(); // Updates shape properties (size, lifespan)
    shapes[i].display(); // Renders shape to canvas
    if (shapes[i].lifespan <= 0) {
      // Removes shapes when their lifespan expires
      shapes.splice(i, 1); // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    }
  }
}

// Handles touch input to start audio and create shapes/notes
// Source: https://p5js.org/reference/#/p5/touchStarted
function touchStarted() {
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/state
  if (audioContext.state !== "running") {
    // Checks if audio context is not running
    audioContext
      .resume() // Resumes audio context for user interaction compliance
      .then(() => {
        console.log("AudioContext resumed successfully"); // Logs successful resume
      })
      .catch((err) => {
        console.error("AudioContext resume failed:", err); // Logs any errors
      });
  }
  createNoteAndShape(mouseX, mouseY); // Creates a note and shape at touch position
  redraw(); // Triggers a redraw to update canvas
  return false; // Prevents default touch behavior
}

// Handles mouse clicks to create shapes/notes (non-touch devices)
// Source: https://p5js.org/reference/#/p5/mousePressed
function mousePressed() {
  console.log("Mouse pressed at:", mouseX, mouseY); // Logs click position
  if (!touches.length) {
    // Ensures mouse event doesn't fire during touch
    createNoteAndShape(mouseX, mouseY); // Creates a note and shape at click position
    redraw(); // Triggers a redraw to update canvas
  }
}

// Creates a note with instrument-specific sound and a shape at the specified coordinates
function createNoteAndShape(x, y) {
  console.log("Creating note and shape at:", x, y, "for song:", currentSong); // Logs creation position and song
  try {
    // Primary oscillator for the base tone
    // Source: https://p5js.org/reference/#/p5.Oscillator
    let osc1 = new p5.Oscillator(); // Creates a new p5.js oscillator
    let osc2 = new p5.Oscillator(); // Secondary oscillator for harmonic richness
    let freq =
      cMajorPentatonic[
        songSequences[currentSong][
          noteIndex % songSequences[currentSong].length
        ]
      ]; // Selects frequency from current song sequence
    let duration = random(0.4, 0.6); // Random duration for note
    let amplitude = random(0.3, 0.5); // Random amplitude for effect

    // Configure instrument based on song
    if (currentSong === "itsybitsy") {
      osc1.setType("triangle"); // Triangle wave for light, spidery feel
      osc2.setType("triangle");
      osc1.freq(freq); // Sets oscillator frequency
      osc1.amp(amplitude); // Sets amplitude
      osc2.freq(freq * 2); // Octave higher
      osc2.amp(amplitude * 0.3); // Lower amplitude for harmonic
      osc2.detune.setValueAtTime(random(-10, 10), 0); // Slight detune
      osc1.connect(reverb); // Apply reverb
      osc2.connect(reverb);
    } else if (currentSong === "oldmacdonald") {
      osc1.setType("square"); // Square wave for rustic tone
      osc2.setType("square");
      osc1.freq(freq);
      osc1.amp(amplitude);
      osc2.freq(freq * 1.5); // Fifth higher for harmony
      osc2.amp(amplitude * 0.2);
      osc2.detune.setValueAtTime(random(-5, 5), 0);
      osc1.connect(lowPass); // Apply low-pass filter
      osc2.connect(lowPass);
    } else if (currentSong === "bingo") {
      osc1.setType("sawtooth"); // Sawtooth wave for lively tone
      osc2.setType("sawtooth");
      osc1.freq(freq);
      osc1.amp(amplitude);
      osc2.freq(freq * 2);
      osc2.amp(amplitude * 0.3);
      osc2.detune.setValueAtTime(random(-15, 15), 0);
      panner.pan(random(-0.5, 0.5)); // Random panning
      osc1.connect(panner);
      osc2.connect(panner);
    } else if (currentSong === "happy") {
      osc1.setType("sine"); // Sine wave for bright, happy tone
      osc2.setType("sine");
      osc1.freq(freq);
      osc1.amp(amplitude);
      osc2.freq(freq * 2);
      osc2.amp(amplitude * 0.3);
      osc2.detune.setValueAtTime(random(-10, 10), 0);
      osc1.connect(delay); // Apply delay
      osc2.connect(delay);
    }

    osc1.start(); // Starts the oscillator
    osc1.amp(0, duration); // Fades out amplitude
    osc2.start();
    osc2.amp(0, duration);

    console.log(
      "Sound created: instrument for",
      currentSong,
      "at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    ); // Logs sound details
    noteIndex = (noteIndex + 1) % songSequences[currentSong].length; // Advances to next note
  } catch (e) {
    console.error("p5.Oscillator failed:", e); // Logs any errors with p5.js oscillators
    // Fallback to raw Web Audio API
    let freq =
      cMajorPentatonic[
        songSequences[currentSong][
          noteIndex % songSequences[currentSong].length
        ]
      ]; // Selects frequency
    let duration = random(0.4, 0.6); // Random duration
    let amplitude = random(0.3, 0.5); // Random amplitude

    // Primary oscillator using Web Audio API
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
    let rawOsc1 = audioContext.createOscillator(); // Creates oscillator
    let rawOsc2 = audioContext.createOscillator(); // Secondary oscillator
    let gain1 = audioContext.createGain(); // Creates gain node
    let gain2 = audioContext.createGain(); // Secondary gain node
    let oscType, connectNode;

    // Configure fallback instrument
    if (currentSong === "itsybitsy") {
      oscType = "triangle";
      connectNode = audioContext.createConvolver(); // Simplified reverb fallback
    } else if (currentSong === "oldmacdonald") {
      oscType = "square";
      connectNode = audioContext.createBiquadFilter();
      connectNode.type = "lowpass";
      connectNode.frequency.setValueAtTime(800, audioContext.currentTime);
    } else if (currentSong === "bingo") {
      oscType = "sawtooth";
      connectNode = audioContext.createStereoPanner();
      connectNode.pan.setValueAtTime(
        random(-0.5, 0.5),
        audioContext.currentTime
      );
    } else {
      oscType = "sine";
      connectNode = audioContext.createGain(); // Simplified delay fallback
    }

    rawOsc1.type = oscType;
    rawOsc1.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain1.gain.setValueAtTime(amplitude, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    rawOsc1.connect(gain1);
    gain1.connect(connectNode);
    connectNode.connect(audioContext.destination);
    rawOsc1.start();
    rawOsc1.stop(audioContext.currentTime + duration);

    rawOsc2.type = oscType;
    rawOsc2.frequency.setValueAtTime(
      freq * (currentSong === "oldmacdonald" ? 1.5 : 2),
      audioContext.currentTime
    );
    rawOsc2.detune.setValueAtTime(random(-15, 15), 0);
    gain2.gain.setValueAtTime(
      amplitude * (currentSong === "oldmacdonald" ? 0.2 : 0.3),
      audioContext.currentTime
    );
    gain2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    rawOsc2.connect(gain2);
    gain2.connect(connectNode);
    rawOsc2.start();
    rawOsc2.stop(audioContext.currentTime + duration);

    console.log(
      "Fallback sound created: instrument for",
      currentSong,
      "at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    ); // Logs fallback sound details
    noteIndex = (noteIndex + 1) % songSequences[currentSong].length; // Advances to next note
  }
  // Source: https://p5js.org/reference/#/p5/color
  shapes.push(
    new Shape(
      x,
      y,
      random(50, 150), // Random size for shape
      color(random(200, 255), random(200, 255), random(200, 255), 800) // Random color with fixed alpha
    )
  ); // Adds new shape to array
}

// Class to manage shape properties and rendering
class Shape {
  constructor(x, y, size, col) {
    this.x = x; // X-coordinate of shape
    this.y = y; // Y-coordinate of shape
    this.size = size; // Initial size of shape
    this.col = col; // Color of shape
    this.lifespan = 255; // Initial lifespan for fading effect
    this.shapeType = floor(random(3)); // Randomly selects shape: 0 (circle), 1 (star), 2 (square)
    // Source: https://p5js.org/reference/#/p5/floor
  }

  // Updates shape properties for animation
  update() {
    this.lifespan -= 2; // Decrements lifespan for fade effect
    this.size += 0.5; // Slightly increases size for expansion effect
    this.col.setAlpha(this.lifespan); // Updates color alpha based on lifespan
    // Source: https://p5js.org/reference/#/p5.Color/setAlpha
  }

  // Renders the shape to the canvas
  display() {
    noStroke(); // Disables outline
    fill(this.col); // Sets fill color
    // Source: https://p5js.org/reference/#/p5/fill
    if (this.shapeType === 0) {
      ellipse(this.x, this.y, this.size); // Draws circle
      // Source: https://p5js.org/reference/#/p5/ellipse
    } else if (this.shapeType === 1) {
      this.drawStar(this.x, this.y, this.size / 2, this.size, 5); // Draws star
    } else {
      rectMode(CENTER); // Sets rectangle mode to center
      // Source: https://p5js.org/reference/#/p5/rectMode
      rect(this.x, this.y, this.size, this.size); // Draws square
      // Source: https://p5js.org/reference/#/p5/rect
    }
  }

  // Draws a star shape with specified parameters
  drawStar(cx, cy, r1, r2, npoints) {
    let angle = TWO_PI / npoints; // Calculates angle between star points
    let halfAngle = angle / 2.0; // Half-angle for inner points
    beginShape(); // Starts a custom shape
    // Source: https://p5js.org/reference/#/p5/beginShape
    for (let a = 0; a < TWO_PI; a += angle) {
      // Loops through angles to draw star
      let sx = cx + cos(a) * r2; // Outer point x-coordinate
      let sy = cy + sin(a) * r2; // Outer point y-coordinate
      vertex(sx, sy); // Adds outer point vertex
      // Source: https://p5js.org/reference/#/p5/vertex
      sx = cx + cos(a + halfAngle) * r1; // Inner point x-coordinate
      sy = cy + sin(a + halfAngle) * r1; // Inner point y-coordinate
      vertex(sx, sy); // Adds inner point vertex
    }
    endShape(CLOSE); // Closes the shape
    // Source: https://p5js.org/reference/#/p5/endShape
  }
}

// Resizes the canvas when the window size changes
// Source: https://p5js.org/reference/#/p5/windowResized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Resizes canvas to match window dimensions
}
