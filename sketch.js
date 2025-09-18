/* Global variables for audio context and shape management */
let audioContext; // Holds the Web Audio API context for sound generation
// Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
let shapes = []; // Array to store shape objects for animation
let noteIndex = 0; // Tracks current note in the song sequence
const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // Frequencies for C major pentatonic scale (C4, D4, E4, G4, A4)
// Source: https://en.wikipedia.org/wiki/Pentatonic_scale
const songSequence = [
  0,
  0,
  3,
  3,
  4,
  4,
  3, // C4, C4, G4, G4, A4, A4, G4
  2,
  2,
  1,
  1,
  0,
  0,
  1, // E4, E4, D4, D4, C4, C4, D4
  3,
  3,
  2,
  2,
  1,
  1,
  0, // G4, G4, E4, E4, D4, D4, C4
  3,
  3,
  2,
  2,
  1,
  1,
  0, // G4, G4, E4, E4, D4, D4, C4
]; // Sequence inspired by "Twinkle Twinkle Little Star"

// Sets up the p5.js canvas and audio context
// Source: https://p5js.org/reference/#/p5/setup
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); // Creates a canvas matching window dimensions
  canvas.parent("sketch-holder"); // Attaches canvas to the DOM element with id 'sketch-holder'
  background(255, 255, 255, 0); // Sets transparent background
  // Source: https://p5js.org/reference/#/p5/getAudioContext
  audioContext = getAudioContext(); // Initializes p5.js audio context
  console.log("Setup complete, audio context state:", audioContext.state); // Logs audio context state
  noLoop(); // Disables automatic draw loop to optimize performance
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

// Creates a chime-like sound and a shape at the specified coordinates
function createNoteAndShape(x, y) {
  console.log("Creating note and shape at:", x, y); // Logs creation position
  try {
    // Primary oscillator for the base tone
    // Source: https://p5js.org/reference/#/p5.Oscillator
    let osc1 = new p5.Oscillator(); // Creates a new p5.js oscillator
    osc1.setType("sine"); // Sets sine wave for soft tone
    let freq = cMajorPentatonic[songSequence[noteIndex % songSequence.length]]; // Selects frequency from song sequence
    let duration = random(0.4, 0.6); // Random duration for note
    let amplitude = random(0.3, 0.5); // Random amplitude for chime effect
    osc1.freq(freq); // Sets oscillator frequency
    osc1.amp(amplitude); // Sets oscillator amplitude
    osc1.start(); // Starts the oscillator
    osc1.amp(0, duration); // Fades out amplitude over duration

    // Secondary oscillator for harmonic richness
    let osc2 = new p5.Oscillator(); // Creates a second oscillator
    osc2.setType("sine"); // Sets sine wave
    osc2.freq(freq * 2); // Sets frequency an octave higher
    osc2.amp(amplitude * 0.3); // Lower amplitude for harmonic
    // Source: https://p5js.org/reference/#/p5.Oscillator/detune
    osc2.detune.setValueAtTime(random(-10, 10), 0); // Adds slight detune for warmth
    osc2.start(); // Starts the oscillator
    osc2.amp(0, duration); // Fades out amplitude over duration

    console.log(
      "Sound created: chime-like at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    ); // Logs sound details
    noteIndex = (noteIndex + 1) % songSequence.length; // Advances to next note in sequence
  } catch (e) {
    console.error("p5.Oscillator failed:", e); // Logs any errors with p5.js oscillators
    // Fallback to raw Web Audio API
    let freq = cMajorPentatonic[songSequence[noteIndex % songSequence.length]]; // Selects frequency
    let duration = random(0.4, 0.6); // Random duration
    let amplitude = random(0.3, 0.5); // Random amplitude

    // Primary oscillator using Web Audio API
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
    let rawOsc1 = audioContext.createOscillator(); // Creates oscillator
    rawOsc1.type = "sine"; // Sets sine wave
    rawOsc1.frequency.setValueAtTime(freq, audioContext.currentTime); // Sets frequency
    let gain1 = audioContext.createGain(); // Creates gain node
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/GainNode
    gain1.gain.setValueAtTime(amplitude, audioContext.currentTime); // Sets initial gain
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    ); // Fades out gain
    rawOsc1.connect(gain1); // Connects oscillator to gain
    gain1.connect(audioContext.destination); // Connects gain to output
    rawOsc1.start(); // Starts oscillator
    rawOsc1.stop(audioContext.currentTime + duration); // Stops after duration

    // Secondary oscillator for harmonic
    let rawOsc2 = audioContext.createOscillator(); // Creates second oscillator
    rawOsc2.type = "sine"; // Sets sine wave
    rawOsc2.frequency.setValueAtTime(freq * 2, audioContext.currentTime); // Sets frequency an octave higher
    rawOsc2.detune.setValueAtTime(random(-10, 10), 0); // Adds slight detune
    let gain2 = audioContext.createGain(); // Creates second gain node
    gain2.gain.setValueAtTime(amplitude * 0.3, audioContext.currentTime); // Sets lower gain
    gain2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    ); // Fades out gain
    rawOsc2.connect(gain2); // Connects oscillator to gain
    gain2.connect(audioContext.destination); // Connects gain to output
    rawOsc2.start(); // Starts oscillator
    rawOsc2.stop(audioContext.currentTime + duration); // Stops after duration

    console.log(
      "Fallback sound created: chime-like at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    ); // Logs fallback sound details
    noteIndex = (noteIndex + 1) % songSequence.length; // Advances to next note
  }
  // Source: https://p5js.org/reference/#/p5/color
  shapes.push(
    new Shape(
      x,
      y,
      random(50, 150), // Random size for shape
      color(random(255), random(255), random(255), 200) // Random color with fixed alpha
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
