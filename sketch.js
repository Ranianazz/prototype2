let audioContext;
let shapes = [];
let noteIndex = 0;
const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // C4, D4, E4, G4, A4
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
];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");
  background(255, 255, 255, 0); // Transparent background
  audioContext = getAudioContext();
  console.log("Setup complete, audio context state:", audioContext.state);
  noLoop();
}

function draw() {
  clear();
  console.log("Drawing", shapes.length, "shapes");
  for (let i = shapes.length - 1; i >= 0; i--) {
    shapes[i].update();
    shapes[i].display();
    if (shapes[i].lifespan <= 0) {
      shapes.splice(i, 1);
    }
  }
}

function touchStarted() {
  if (audioContext.state !== "running") {
    audioContext
      .resume()
      .then(() => {
        console.log("AudioContext resumed successfully");
      })
      .catch((err) => {
        console.error("AudioContext resume failed:", err);
      });
  }
  createNoteAndShape(mouseX, mouseY);
  redraw();
  return false;
}

function mousePressed() {
  console.log("Mouse pressed at:", mouseX, mouseY);
  if (!touches.length) {
    createNoteAndShape(mouseX, mouseY);
    redraw();
  }
}

function createNoteAndShape(x, y) {
  console.log("Creating note and shape at:", x, y);
  try {
    // Primary oscillator (sine wave for soft base tone)
    let osc1 = new p5.Oscillator();
    osc1.setType("sine");
    let freq = cMajorPentatonic[songSequence[noteIndex % songSequence.length]];
    let duration = random(0.4, 0.6);
    let amplitude = random(0.3, 0.5); // Softer amplitude for chime-like effect
    osc1.freq(freq);
    osc1.amp(amplitude);
    osc1.start();
    osc1.amp(0, duration);

    // Secondary oscillator (higher harmonic for chime-like quality)
    let osc2 = new p5.Oscillator();
    osc2.setType("sine");
    osc2.freq(freq * 2); // Octave higher
    osc2.amp(amplitude * 0.3); // Lower amplitude for harmonic
    osc2.detune.setValueAtTime(random(-10, 10), 0); // Slight detune for warmth
    osc2.start();
    osc2.amp(0, duration);

    console.log(
      "Sound created: chime-like at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    );
    noteIndex = (noteIndex + 1) % songSequence.length;
  } catch (e) {
    console.error("p5.Oscillator failed:", e);
    // Fallback: Raw Web Audio API
    let freq = cMajorPentatonic[songSequence[noteIndex % songSequence.length]];
    let duration = random(0.4, 0.6);
    let amplitude = random(0.3, 0.5);

    // Primary oscillator
    let rawOsc1 = audioContext.createOscillator();
    rawOsc1.type = "sine";
    rawOsc1.frequency.setValueAtTime(freq, audioContext.currentTime);
    let gain1 = audioContext.createGain();
    gain1.gain.setValueAtTime(amplitude, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    rawOsc1.connect(gain1);
    gain1.connect(audioContext.destination);
    rawOsc1.start();
    rawOsc1.stop(audioContext.currentTime + duration);

    // Secondary oscillator
    let rawOsc2 = audioContext.createOscillator();
    rawOsc2.type = "sine";
    rawOsc2.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
    rawOsc2.detune.setValueAtTime(random(-10, 10), 0);
    let gain2 = audioContext.createGain();
    gain2.gain.setValueAtTime(amplitude * 0.3, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    rawOsc2.connect(gain2);
    gain2.connect(audioContext.destination);
    rawOsc2.start();
    rawOsc2.stop(audioContext.currentTime + duration);

    console.log(
      "Fallback sound created: chime-like at",
      freq,
      "Hz, duration:",
      duration,
      "amp:",
      amplitude
    );
    noteIndex = (noteIndex + 1) % songSequence.length;
  }
  shapes.push(
    new Shape(
      x,
      y,
      random(50, 150),
      color(random(255), random(255), random(255), 200)
    )
  );
}

class Shape {
  constructor(x, y, size, col) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.col = col;
    this.lifespan = 255;
    this.shapeType = floor(random(3)); // 0: circle, 1: star, 2: square
  }

  update() {
    this.lifespan -= 2;
    this.size += 0.5;
    this.col.setAlpha(this.lifespan);
  }

  display() {
    noStroke();
    fill(this.col);
    if (this.shapeType === 0) {
      ellipse(this.x, this.y, this.size);
    } else if (this.shapeType === 1) {
      this.drawStar(this.x, this.y, this.size / 2, this.size, 5);
    } else {
      rectMode(CENTER);
      rect(this.x, this.y, this.size, this.size);
    }
  }

  drawStar(cx, cy, r1, r2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cx + cos(a) * r2;
      let sy = cy + sin(a) * r2;
      vertex(sx, sy);
      sx = cx + cos(a + halfAngle) * r1;
      sy = cy + sin(a + halfAngle) * r1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
