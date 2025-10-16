let audioContext;
let shapes = [];
let noteIndex = 0;
let currentSong = "itsy";
let masterVolume = 0.5; // volume variable

const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0];

const songs = {
  twinkle: {
    notes: [0, 0, 3, 3, 4, 4, 3],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.8],
  },
  itsy: {
    notes: [0, 0, 1, 2, 2, 1, 0],
    durations: [0.4, 0.4, 0.4, 0.5, 0.5, 0.4, 0.8],
  },
  happy: {
    notes: [0, 0, 1, 0, 3, 2],
    durations: [0.5, 0.5, 0.6, 0.5, 0.5, 0.8],
  },
};

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");
  canvas.style("pointer-events", "none");
  clear();
  audioContext = getAudioContext();
  setupSongButtons();
  setupVolumeSlider();
  frameRate(30);
}

function draw() {
  clear(); // transparent so background shows through
  for (let shape of shapes) {
    shape.update();
    shape.display();
  }
}

function mousePressed() {
  if (audioContext.state !== "running") {
    audioContext.resume();
  }
  createNoteAndShape(mouseX, mouseY);
}

// Setup song button functionality
function setupSongButtons() {
  const buttons = document.querySelectorAll(".song-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSong = btn.dataset.song;
      noteIndex = 0;
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  document.querySelector('.song-btn[data-song="itsy"]').classList.add("active");
}

// Volume slider setup
function setupVolumeSlider() {
  const slider = document.getElementById("volumeSlider");
  slider.addEventListener("input", () => {
    masterVolume = parseFloat(slider.value);
  });
}

// Sound and shape generation
function createNoteAndShape(x, y) {
  const song = songs[currentSong];
  const note = song.notes[noteIndex % song.notes.length];
  const freq = cMajorPentatonic[note];
  const duration = song.durations[noteIndex % song.durations.length];
  noteIndex++;

  // Play note with adjustable volume
  const osc = new p5.Oscillator("sine");
  const env = new p5.Envelope();
  env.setADSR(0.05, 0.2, 0.1, 0.2);
  env.setRange(masterVolume, 0);

  osc.freq(freq);
  osc.start();
  env.play(osc, 0, duration);
  osc.stop(audioContext.currentTime + duration + 0.2);

  // Dancing shape
  shapes.push(
    new DancingShape(
      x,
      y,
      random(60, 150),
      color(random(150, 255), random(150, 255), random(150, 255))
    )
  );
}

// Dancing shapes class
class DancingShape {
  constructor(x, y, size, col) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.size = size;
    this.col = col;
    this.lifespan = 255;
    this.shapeType = floor(random(3));
    this.angle = random(TWO_PI);
    this.wiggleSpeed = random(0.05, 0.15);
  }

  update() {
    this.angle += this.wiggleSpeed;
    this.x = this.baseX + sin(this.angle * 3) * 10;
    this.y = this.baseY + cos(this.angle * 2) * 10;
    this.lifespan -= 2;
  }

  display() {
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.lifespan);

    if (this.shapeType === 0) {
      ellipse(this.x, this.y, this.size);
    } else if (this.shapeType === 1) {
      rectMode(CENTER);
      rect(this.x, this.y, this.size, this.size);
    } else {
      this.drawStar(this.x, this.y, this.size / 3, this.size / 1.5, 5);
    }
  }

  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
