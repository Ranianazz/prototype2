/* Global variables for audio context and shape management */
let audioContext; // Holds the Web Audio API context for sound generation
// Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
let shapes = []; // Array to store shape objects for animation
let noteIndex = 0; // Tracks current note in the song sequence
const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // Frequencies for C major pentatonic scale (C4, D4, E4, G4, A4)
// Source: https://en.wikipedia.org/wiki/Pentatonic_scale
const songs = {
  twinkle: {
    notes: [
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
    ],
    durations: Array(28).fill(0.5), // Default duration for Twinkle
  },
  itsy: {
    notes: [
      0,
      0,
      1,
      2,
      2,
      1,
      0, // C4, C4, D4, E4, E4, D4, C4 ("The itsy bitsy spider")
      1,
      2,
      3, // D4, E4, G4 ("climbed up the")
      4,
      4,
      3,
      2,
      1,
      0, // A4, A4, G4, E4, D4, C4 ("water spout")
      0,
      0,
      1,
      2,
      2,
      1,
      0, // C4, C4, D4, E4, E4, D4, C4 ("Out came the sun")
      1,
      2,
      3, // D4, E4, G4 ("dried up all")
      4,
      3,
      2,
      1,
      0, // A4, G4, E4, D4, C4 ("the rain")
    ],
    durations: [
      0.3,
      0.3,
      0.3,
      0.5,
      0.5,
      0.3,
      0.3, // Short for "itsy bitsy", normal for "spider"
      0.3,
      0.5,
      0.7, // Short for "climbed", longer for "up"
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.7, // Normal for "water", longer for "spout"
      0.3,
      0.3,
      0.3,
      0.5,
      0.5,
      0.3,
      0.3, // Short for "out came", normal for "sun"
      0.3,
      0.5,
      0.7, // Short for "dried", longer for "up"
      0.5,
      0.5,
      0.5,
      0.5,
      0.7, // Normal for "all the", longer for "rain"
    ],
  },
  happy: {
    notes: [
      0,
      0,
      1,
      0,
      3,
      2, // C4, C4, D4, C4, G4, E4
      0,
      0,
      1,
      0,
      4,
      3, // C4, C4, D4, C4, A4, G4
      0,
      0,
      0,
      2,
      3,
      1,
      0, // C4, C4, C4, E4, G4, D4, C4
      4,
      4,
      3,
      1,
      2,
      1, // A4, A4, G4, D4, E4, D4
    ],
    durations: Array(26).fill(0.5), // Default duration for Happy
  },
};
let currentSong = "itsy"; // Default song

// Sets up the p5.js canvas and audio context
// Source: https://p5js.org/reference/#/p5/setup
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); // Creates a canvas matching window dimensions
  canvas.parent("sketch-holder"); // Attaches canvas to the DOM element with id 'sketch-holder'
  background(255, 255, 255, 0); // Sets transparent background
  // Source: https://p5js.org/reference/#/p5/getAudioContext
  audioContext = getAudioContext(); // Initializes p5.js audio context
  console.log(
    "Setup complete, audio context state:",
    audioContext.state,
    "at",
    new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  ); // Logs setup
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
      console.log(
        "Selected song:",
        currentSong,
        "at",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
      ); // Logs song selection with timestamp
      if (currentSong === "twinkle") {
        console.log(
          "Twinkle Twinkle Little Star selected, sequence:",
          songs.twinkle.notes
        ); // Debug Twinkle selection
      } else if (currentSong === "itsy") {
        console.log(
          "Itsy Bitsy Spider selected, sequence:",
          songs.itsy.notes,
          "durations:",
          songs.itsy.durations
        ); // Debug Itsy selection
      } else if (currentSong === "happy") {
        console.log("Happy Birthday selected, sequence:", songs.happy.notes); // Debug Happy selection
      }
    });
  });
  // Set default song button as active
  document.querySelector('.song-btn[data-song="itsy"]').classList.add("active");
}

// Draws and updates all shapes on the canvas
// Source: https://p5js.org/reference/#/p5/draw
function draw() {
  clear(); // Clears the canvas for each frame
  console.log(
    "Drawing",
    shapes.length,
    "shapes at",
    new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  ); // Logs number of shapes being drawn
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
        console.log(
          "AudioContext resumed successfully at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        ); // Logs successful resume
      })
      .catch((err) => {
        console.error(
          "AudioContext resume failed:",
          err,
          "at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        ); // Logs any errors
      });
  }
  createNoteAndShape(mouseX, mouseY); // Creates a note and shape at touch position
  redraw(); // Triggers a redraw to update canvas
  return false; // Prevents default touch behavior
}

// Handles mouse clicks to create shapes/notes (non-touch devices)
// Source: https://p5js.org/reference/#/p5/mousePressed
function mousePressed() {
  console.log(
    "Mouse pressed at:",
    mouseX,
    mouseY,
    "at",
    new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  ); // Logs click position
  if (!touches.length) {
    // Ensures mouse event doesn't fire during touch
    createNoteAndShape(mouseX, mouseY); // Creates a note and shape at click position
    redraw(); // Triggers a redraw to update canvas
  }
}

// Creates a note with instrument-specific sound and a shape at the specified coordinates
function createNoteAndShape(x, y) {
  console.log(
    "Creating note and shape at:",
    x,
    y,
    "for song:",
    currentSong,
    "note index:",
    noteIndex,
    "at",
    new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  ); // Logs creation details
  try {
    // Primary oscillator for the base tone
    // Source: https://p5js.org/reference/#/p5.Oscillator
    let osc = new p5.Oscillator("sine"); // Creates a new p5.js oscillator with sine wave
    let freq =
      cMajorPentatonic[
        songs[currentSong].notes[noteIndex % songs[currentSong].notes.length]
      ]; // Selects frequency from current song sequence
    let duration =
      songs[currentSong].durations[
        noteIndex % songs[currentSong].durations.length
      ] || random(0.4, 0.6); // Uses specific duration or random fallback
    let amplitude = random(0.4, 0.6); // Random amplitude for all songs
    osc.setType("sine"); // Sine wave for smooth tone
    osc.freq(freq);
    osc.amp(amplitude);
    if (currentSong === "twinkle") {
      osc.detune.setValueAtTime(random(-5, 5), 0); // Subtle detune for Twinkle
    }
    osc.start(); // Starts the oscillator
    osc.amp(0, duration); // Fades out amplitude
    console.log(
      "Sound created: sine wave for",
      currentSong,
      "at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude,
      "at",
      new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
    ); // Logs sound details
    if (currentSong === "twinkle") {
      console.log(
        "Twinkle note played, frequency:",
        freq,
        "note index:",
        noteIndex
      ); // Debug Twinkle note
    } else if (currentSong === "itsy") {
      console.log(
        "Itsy Bitsy Spider note played, frequency:",
        freq,
        "note index:",
        noteIndex,
        "duration:",
        duration
      ); // Debug Itsy note
    } else if (currentSong === "happy") {
      console.log(
        "Happy Birthday note played, frequency:",
        freq,
        "note index:",
        noteIndex
      ); // Debug Happy note
    }
    noteIndex = (noteIndex + 1) % songs[currentSong].notes.length; // Advances to next note
  } catch (e) {
    console.error(
      "p5.Oscillator failed for",
      currentSong,
      ":",
      e,
      "at",
      new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
    ); // Logs any errors with p5.js oscillator
    // Fallback to raw Web Audio API
    let freq =
      cMajorPentatonic[
        songs[currentSong].notes[noteIndex % songs[currentSong].notes.length]
      ]; // Selects frequency
    let duration =
      songs[currentSong].durations[
        noteIndex % songs[currentSong].durations.length
      ] || random(0.4, 0.6); // Uses specific duration or random fallback
    let amplitude = random(0.4, 0.6); // Random amplitude
    let rawOsc = audioContext.createOscillator(); // Creates oscillator
    let gain = audioContext.createGain(); // Creates gain node
    rawOsc.type = "sine";
    rawOsc.frequency.setValueAtTime(freq, audioContext.currentTime);
    if (currentSong === "twinkle") {
      rawOsc.detune.setValueAtTime(random(-5, 5), 0); // Subtle detune for Twinkle
    }
    gain.gain.setValueAtTime(amplitude, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    rawOsc.connect(gain);
    gain.connect(audioContext.destination);
    rawOsc.start();
    rawOsc.stop(audioContext.currentTime + duration);
    console.log(
      "Fallback sound created: sine wave for",
      currentSong,
      "at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude,
      "at",
      new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
    ); // Logs fallback sound details
    if (currentSong === "twinkle") {
      console.log(
        "Twinkle fallback note played, frequency:",
        freq,
        "note index:",
        noteIndex
      ); // Debug Twinkle fallback
    } else if (currentSong === "itsy") {
      console.log(
        "Itsy Bitsy Spider fallback note played, frequency:",
        freq,
        "note index:",
        noteIndex,
        "duration:",
        duration
      ); // Debug Itsy fallback
    } else if (currentSong === "happy") {
      console.log(
        "Happy Birthday fallback note played, frequency:",
        freq,
        "note index:",
        noteIndex
      ); // Debug Happy fallback
    }
    noteIndex = (noteIndex + 1) % songs[currentSong].notes.length; // Advances to next note
  }
  // Source: https://p5js.org/reference/#/p5/color
  shapes.push(
    new Shape(
      x,
      y,
      random(50, 150), // Random size for shape
      color(random(200, 255), random(200, 255), random(200, 255), 800) // Random color with fixed high alpha
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
