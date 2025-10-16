// Global variables for managing audio and visual elements
let audioContext; // Web Audio API context for sound generation
// Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
let shapes = []; // Array to store dancing shape objects
let noteIndex = 0; // Tracks current note in song sequence
let currentSong = "itsy"; // Default song: Itsy Bitsy Spider
let currentVolume = 0.5; // Initial volume (0 to 1, midpoint)
let lastVolume = 0.5; // Stores last non-zero volume for mute toggle
let isMuted = false; // Tracks mute state (true = muted)
let oscillators = []; // Tracks active p5.Oscillator instances for muting
// Source: https://p5js.org/reference/#/p5.Oscillator

// C Major Pentatonic scale frequencies (Hz) for pleasant, kid-friendly notes
const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0];
// Source: https://en.wikipedia.org/wiki/Pentatonic_scale

// Song data: note indices (mapping to cMajorPentatonic) and durations (seconds)
const songs = {
  twinkle: {
    notes: [0, 0, 3, 3, 4, 4, 3], // Twinkle Twinkle Little Star sequence
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.8], // Note durations
  },
  itsy: {
    notes: [0, 0, 1, 2, 2, 1, 0], // Itsy Bitsy Spider sequence
    durations: [0.4, 0.4, 0.4, 0.5, 0.5, 0.4, 0.8],
  },
  happy: {
    notes: [0, 0, 1, 0, 3, 2], // Happy Birthday sequence
    durations: [0.5, 0.5, 0.6, 0.5, 0.5, 0.8],
  },
};

// Initialize canvas and setup event listeners
// Source: https://p5js.org/reference/#/p5/setup
function setup() {
  // Create full-screen canvas and attach to #sketch-holder
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");
  canvas.style("pointer-events", "none"); // Allow clicks to pass through to HTML buttons
  // Source: https://p5js.org/reference/#/p5.Element/style
  clear(); // Ensure canvas is transparent to show CSS gradient background
  // Source: https://p5js.org/reference/#/p5/clear

  // Initialize Web Audio API context for p5.sound
  audioContext = getAudioContext();
  // Source: https://p5js.org/reference/#/p5/getAudioContext

  // Resume audio context if suspended (required by browsers for user-initiated audio)
  if (audioContext.state !== "running") {
    audioContext.resume().then(() => {
      console.log(
        "Audio context resumed in setup at",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
      );
    });
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
  }

  setupSongButtons(); // Setup song selection buttons
  setupVolumeControl(); // Setup volume slider and mute button
  frameRate(30); // Limit to 30 FPS for smooth performance
  // Source: https://p5js.org/reference/#/p5/frameRate
}

// Render loop for updating and drawing shapes
// Source: https://p5js.org/reference/#/p5/draw
function draw() {
  clear(); // Clear canvas each frame to maintain transparent background
  // Optional: Uncomment for faint motion blur effect
  // fill(255, 255, 255, 20);
  // rect(0, 0, width, height);
  // Source: https://p5js.org/reference/#/p5/fill

  // Update and display each shape
  for (let shape of shapes) {
    shape.update(); // Update position and lifespan
    shape.display(); // Draw shape (ellipse, rect, or star)
  }
}

// Setup volume slider and mute button event listeners
function setupVolumeControl() {
  const volumeSlider = document.getElementById("volume-slider");
  const muteButton = document.getElementById("mute-button");
  const volumeIcon = document.getElementById("volume-icon");

  // Track first interaction to resume audio context
  let hasInteracted = false;

  // Add listeners for volume slider input/change events
  ["input", "change"].forEach((eventType) => {
    volumeSlider.addEventListener(eventType, () => {
      // Resume audio context on first interaction
      if (!hasInteracted && audioContext.state !== "running") {
        audioContext.resume().then(() => {
          console.log(
            "Audio context resumed on volume slider interaction at",
            new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
          );
        });
        hasInteracted = true;
      }
      // Update volume from slider (0 to 1), mute at leftmost tip
      currentVolume = parseFloat(volumeSlider.value);
      isMuted = currentVolume === 0;
      if (!isMuted) {
        lastVolume = currentVolume; // Store last non-zero volume
      }
      // Stop all oscillators if muted
      if (isMuted) {
        oscillators.forEach((osc) => {
          osc.stop();
          console.log(
            "Oscillator stopped due to mute at",
            new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
          );
        });
        oscillators = []; // Clear oscillator array
      }
      // Update volume icon based on mute state
      volumeIcon.className = isMuted
        ? "fas fa-volume-mute"
        : "fas fa-volume-up";
      // Source: https://fontawesome.com/docs/web/use-with/javascript
      console.log(`Volume set to: ${currentVolume}, Muted: ${isMuted}`);
    });
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event
  });

  // Add listener for mute button click
  muteButton.addEventListener("click", () => {
    // Resume audio context on first interaction
    if (!hasInteracted && audioContext.state !== "running") {
      audioContext.resume().then(() => {
        console.log(
          "Audio context resumed on mute button click at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        );
      });
      hasInteracted = true;
    }
    // Toggle mute state
    isMuted = !isMuted;
    if (isMuted) {
      currentVolume = 0;
      volumeSlider.value = 0;
      // Stop all active oscillators
      oscillators.forEach((osc) => {
        osc.stop();
        console.log(
          "Oscillator stopped due to mute button at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        );
      });
      oscillators = []; // Clear oscillator array
    } else {
      currentVolume = lastVolume;
      volumeSlider.value = lastVolume; // Restore last volume
    }
    // Update volume icon
    volumeIcon.className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
    console.log(`Mute toggled: ${isMuted}, Volume: ${currentVolume}`);
  });
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
}

// Handle mouse/touch input to create notes and shapes
// Source: https://p5js.org/reference/#/p5/mousePressed
function mousePressed() {
  // Resume audio context on user interaction
  if (audioContext.state !== "running") {
    audioContext.resume().then(() => {
      console.log(
        "Audio context resumed on mouse press at",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
      );
    });
  }
  createNoteAndShape(mouseX, mouseY); // Create note and shape at click position
}

// Setup song selection buttons
function setupSongButtons() {
  const buttons = document.querySelectorAll(".song-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSong = btn.dataset.song; // Set current song from button's data-song
      noteIndex = 0; // Reset note index for new song
      buttons.forEach((b) => b.classList.remove("active")); // Remove active class
      btn.classList.add("active"); // Highlight selected song button
    });
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
  });
  // Set default song (Itsy Bitsy Spider) as active
  document.querySelector('.song-btn[data-song="itsy"]').classList.add("active");
}

// Create a musical note and corresponding visual shape
function createNoteAndShape(x, y) {
  if (isMuted) {
    console.log("No sound: Muted state");
    // Create shape without sound when muted
    shapes.push(
      new DancingShape(
        x,
        y,
        random(60, 150), // Random size between 60-150 pixels
        color(random(150, 255), random(150, 255), random(150, 255)) // Random color
      )
    );
    // Source: https://p5js.org/reference/#/p5/random
    return;
  }

  // Get current song's note and duration
  const song = songs[currentSong];
  const note = song.notes[noteIndex % song.notes.length]; // Cycle through notes
  const freq = cMajorPentatonic[note]; // Map note index to frequency
  const duration = song.durations[noteIndex % song.durations.length]; // Get note duration
  noteIndex++; // Advance to next note

  // Create oscillator and envelope for audio
  const osc = new p5.Oscillator("sine"); // Sine wave for clean tone
  const env = new p5.Envelope();
  env.setADSR(0.05, 0.2, 0.1, 0.2); // Attack, Decay, Sustain, Release
  env.setRange(currentVolume, 0); // Volume range based on slider
  // Source: https://p5js.org/reference/#/p5.Envelope

  osc.freq(freq); // Set oscillator frequency
  osc.start(); // Start oscillator
  // Source: https://p5js.org/reference/#/p5.Oscillator
  oscillators.push(osc); // Track oscillator for muting
  env.play(osc, 0, duration); // Play note with envelope
  osc.stop(audioContext.currentTime + duration + 0.2); // Stop after duration
  // Source: https://p5js.org/reference/#/p5.Oscillator/stop

  // Clean up oscillator after stopping
  setTimeout(() => {
    oscillators = oscillators.filter((o) => o !== osc);
  }, (duration + 0.2) * 1000);
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout

  // Create dancing shape at click position
  shapes.push(
    new DancingShape(
      x,
      y,
      random(60, 150), // Random size
      color(random(50, 400), random(50, 400), random(50, 400)) // Random RGB
    )
  );
}

// Class for animated shapes (ellipse, rectangle, star)
class DancingShape {
  constructor(x, y, size, col) {
    this.baseX = x; // Base x-coordinate
    this.baseY = y; // Base y-coordinate
    this.x = x; // Current x-coordinate (for animation)
    this.y = y; // Current y-coordinate
    this.size = size; // Shape size
    this.col = col; // Shape color
    this.lifespan = 255; // Opacity for fade-out (255 to 0)
    this.shapeType = floor(random(3)); // Randomly select shape (0=ellipse, 1=rect, 2=star)
    this.angle = random(TWO_PI); // Random starting angle for wiggle
    this.wiggleSpeed = random(0.05, 0.15); // Random speed for animation
    // Source: https://p5js.org/reference/#/p5/random
  }

  // Update shape position and lifespan
  update() {
    this.angle += this.wiggleSpeed; // Increment angle for oscillation
    this.x = this.baseX + sin(this.angle * 3) * 10; // Wiggle x-position
    this.y = this.baseY + cos(this.angle * 2) * 10; // Wiggle y-position
    this.lifespan -= 2; // Decrease opacity for fade-out
    // Source: https://p5js.org/reference/#/p5/sin
  }

  // Draw shape based on type
  display() {
    noStroke(); // No outline for shapes
    fill(red(this.col), green(this.col), blue(this.col), this.lifespan); // Apply color with fading opacity
    // Source: https://p5js.org/reference/#/p5/fill

    if (this.shapeType === 0) {
      ellipse(this.x, this.y, this.size); // Draw circle
      // Source: https://p5js.org/reference/#/p5/ellipse
    } else if (this.shapeType === 1) {
      rectMode(CENTER); // Center rectangle on position
      rect(this.x, this.y, this.size, this.size); // Draw square
      // Source: https://p5js.org/reference/#/p5/rect
    } else {
      this.drawStar(this.x, this.y, this.size / 3, this.size / 1.5, 5); // Draw star
    }
  }

  // Draw star shape with inner/outer radii and points
  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints; // Angle between star points
    let halfAngle = angle / 2.0; // Half-angle for inner points
    beginShape(); // Start custom shape
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2; // Outer point x
      let sy = y + sin(a) * radius2; // Outer point y
      vertex(sx, sy); // Add outer vertex
      sx = x + cos(a + halfAngle) * radius1; // Inner point x
      sy = y + sin(a + halfAngle) * radius1; // Inner point y
      vertex(sx, sy); // Add inner vertex
    }
    endShape(CLOSE); // Close shape
    // Source: https://p5js.org/reference/#/p5/beginShape
  }
}

// Resize canvas on window resize
// Source: https://p5js.org/reference/#/p5/windowResized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas to new window size
}
