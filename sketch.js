let audioContext;
let shapes = [];
let noteIndex = 0;
let currentSong = "itsy";
let currentVolume = 0.5; // Default volume (midpoint)
let lastVolume = 0.5; // Store last non-zero volume
let isMuted = false; // Track mute state
let oscillators = []; // Track active oscillators

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
  canvas.style("pointer-events", "none"); // lets clicks pass through to buttons
  clear(); // make sure initial canvas is transparent
  audioContext = getAudioContext();
  // Resume audio context on setup
  if (audioContext.state !== "running") {
    audioContext.resume().then(() => {
      console.log(
        "Audio context resumed in setup at",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
      );
    });
  }
  setupSongButtons();
  setupVolumeControl();
  frameRate(30);
}

function draw() {
  // Use transparent background instead of solid white
  clear(); // keeps your CSS gradient visible

  // Optional: add a faint overlay for trails (uncomment for motion blur)
  // fill(255, 255, 255, 20);
  // rect(0, 0, width, height);

  for (let shape of shapes) {
    shape.update();
    shape.display();
  }
}

function setupVolumeControl() {
  const volumeSlider = document.getElementById("volume-slider");
  const muteButton = document.getElementById("mute-button");
  const volumeIcon = document.getElementById("volume-icon");

  // Resume audio context on first slider or button interaction
  let hasInteracted = false;

  // Slider event listeners
  ["input", "change"].forEach((eventType) => {
    volumeSlider.addEventListener(eventType, () => {
      if (!hasInteracted && audioContext.state !== "running") {
        audioContext.resume().then(() => {
          console.log(
            "Audio context resumed on volume slider interaction at",
            new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
          );
        });
        hasInteracted = true;
      }
      // Update volume (0 to 1), mute at left tip
      currentVolume = parseFloat(volumeSlider.value);
      isMuted = currentVolume === 0;
      if (!isMuted) {
        lastVolume = currentVolume; // Store non-zero volume
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
        oscillators = [];
      }
      // Update volume icon
      volumeIcon.className = isMuted
        ? "fas fa-volume-mute"
        : "fas fa-volume-up";
      console.log(`Volume set to: ${currentVolume}, Muted: ${isMuted}`);
    });
  });

  // Mute button event listener
  muteButton.addEventListener("click", () => {
    if (!hasInteracted && audioContext.state !== "running") {
      audioContext.resume().then(() => {
        console.log(
          "Audio context resumed on mute button click at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        );
      });
      hasInteracted = true;
    }
    isMuted = !isMuted;
    if (isMuted) {
      currentVolume = 0;
      volumeSlider.value = 0;
      // Stop all oscillators
      oscillators.forEach((osc) => {
        osc.stop();
        console.log(
          "Oscillator stopped due to mute button at",
          new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
        );
      });
      oscillators = [];
    } else {
      currentVolume = lastVolume;
      volumeSlider.value = lastVolume;
    }
    // Update volume icon
    volumeIcon.className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
    console.log(`Mute toggled: ${isMuted}, Volume: ${currentVolume}`);
  });
}

function mousePressed() {
  if (audioContext.state !== "running") {
    audioContext.resume().then(() => {
      console.log(
        "Audio context resumed on mouse press at",
        new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
      );
    });
  }
  createNoteAndShape(mouseX, mouseY);
}

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

function createNoteAndShape(x, y) {
  if (isMuted) {
    console.log("No sound: Muted state");
    // Create shape without sound
    shapes.push(
      new DancingShape(
        x,
        y,
        random(60, 150),
        color(random(150, 255), random(150, 255), random(150, 255))
      )
    );
    return;
  }

  const song = songs[currentSong];
  const note = song.notes[noteIndex % song.notes.length];
  const freq = cMajorPentatonic[note];
  const duration = song.durations[noteIndex % song.durations.length];
  noteIndex++;

  // Audio logic with envelope
  const osc = new p5.Oscillator("sine");
  const env = new p5.Envelope();
  env.setADSR(0.05, 0.2, 0.1, 0.2);
  env.setRange(currentVolume, 0); // Volume from 0 (mute) to 1 (loud)

  osc.freq(freq);
  osc.start();
  oscillators.push(osc); // Track oscillator
  env.play(osc, 0, duration);
  osc.stop(audioContext.currentTime + duration + 0.2);
  // Remove oscillator from list after stopping
  setTimeout(() => {
    oscillators = oscillators.filter((o) => o !== osc);
  }, (duration + 0.2) * 1000);

  // Create new dancing shape
  shapes.push(
    new DancingShape(
      x,
      y,
      random(60, 150),
      color(random(150, 255), random(150, 255), random(150, 255))
    )
  );
}

// Dancing Shape Class
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
