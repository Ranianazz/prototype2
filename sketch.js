let audioContext;
let shapes = [];
let noteIndex = 0;
let synth;
let shapesEnabled = true; // toggle state

const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // C4, D4, E4, G4, A4
const songSequence = [
  0, 0, 3, 3, 4, 4, 3, 2, 2, 1, 1, 0, 0, 1, 3, 3, 2, 2, 1, 1, 0, 3, 3, 2, 2, 1,
  1, 0,
];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");
  background(255, 255, 255, 0); // Transparent background
  audioContext = getAudioContext();
  synth = new p5.PolySynth(); // 🎹 Add synthesizer
  console.log("Setup complete, audio context state:", audioContext.state);
  noLoop();
}

function draw() {
  clear();
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
    audioContext.resume();
  }
  createNoteAndShape(mouseX, mouseY);
  redraw();
  return false;
}

function mousePressed() {
  if (!touches.length) {
    createNoteAndShape(mouseX, mouseY);
    redraw();
  }
}

function createNoteAndShape(x, y) {
  let freq = cMajorPentatonic[songSequence[noteIndex % songSequence.length]];
  let duration = 0.5;

  // 🎵 Use synth instead of raw oscillators
  synth.play(freq, 0.5, 0, duration);

  noteIndex = (noteIndex + 1) % songSequence.length;

  // Only create shapes if enabled
  if (shapesEnabled) {
    shapes.push(
      new Shape(
        x,
        y,
        random(50, 150),
        color(random(255), random(255), random(255), 200)
      )
    );
  }
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

// 🎛 Toggle button function
function toggleShapes() {
  shapesEnabled = !shapesEnabled;
  let btn = document.getElementById("toggle-btn");
  btn.textContent = shapesEnabled ? "Turn Off Shapes" : "Turn On Shapes";
}
