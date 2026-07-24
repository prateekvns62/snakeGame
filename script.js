const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const speedLabel = document.getElementById("speedLabel");
const overlay = document.getElementById("overlay");
const statusText = document.getElementById("statusText");
const playPauseBtn = document.getElementById("playPauseBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");
const clockEl = document.getElementById("clock");

const tileCount = 18;
const tileSize = canvas.width / tileCount;
const startSnake = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
];
const directionKeys = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};
const vectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let gameTimer;
let playing;
let gameOver;
let soundOn = true;
let touchStart = null;
let bestScore = Number(localStorage.getItem("snakeBestScore")) || 0;

function resetGame() {
  snake = startSnake.map((segment) => ({ ...segment }));
  direction = "right";
  nextDirection = "right";
  score = 0;
  playing = false;
  gameOver = false;
  food = createFood();
  updateHud();
  draw();
  showOverlay("Ready?", "Press Space or tap Play to start");
  playPauseBtn.textContent = "▶ Play";
}

function createFood() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((segment) => sameCell(segment, candidate)));
  return candidate;
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedLabel.textContent = `${getSpeedMultiplier()}x`;
}

function getSpeedMultiplier() {
  return Math.min(5, 1 + Math.floor(score / 5));
}

function getTickDelay() {
  return Math.max(70, 160 - score * 5);
}

function startLoop() {
  clearInterval(gameTimer);
  gameTimer = setInterval(tick, getTickDelay());
}

function togglePlay() {
  if (gameOver) {
    resetGame();
  }

  playing = !playing;
  if (playing) {
    hideOverlay();
    playPauseBtn.textContent = "⏸ Pause";
    startLoop();
  } else {
    clearInterval(gameTimer);
    showOverlay("Paused", "Press Space or tap Play to continue");
    playPauseBtn.textContent = "▶ Play";
  }
}

function tick() {
  direction = nextDirection;
  const head = snake[0];
  const vector = vectors[direction];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  if (hitWall(nextHead) || snake.some((segment) => sameCell(segment, nextHead))) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (sameCell(nextHead, food)) {
    score += 1;
    pulseBeep(520, 0.05);
    food = createFood();
    updateHud();
    startLoop();
  } else {
    snake.pop();
  }

  draw();
}

function hitWall(cell) {
  return cell.x < 0 || cell.x >= tileCount || cell.y < 0 || cell.y >= tileCount;
}

function endGame() {
  clearInterval(gameTimer);
  playing = false;
  gameOver = true;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("snakeBestScore", bestScore);
  updateHud();
  pulseBeep(120, 0.18);
  draw();
  showOverlay("Game Over", "Press Space or tap Play to try again");
  playPauseBtn.textContent = "↻ Again";
}

function draw() {
  ctx.fillStyle = "#b9d98b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(31, 59, 31, 0.13)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const position = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#0f2f12" : "#173b19";
    roundRect(segment.x * tileSize + 2, segment.y * tileSize + 2, tileSize - 4, tileSize - 4, 5);
  });
}

function drawFood() {
  ctx.fillStyle = "#7c1d1d";
  ctx.beginPath();
  ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function setDirection(newDirection) {
  const reverse =
    (direction === "up" && newDirection === "down") ||
    (direction === "down" && newDirection === "up") ||
    (direction === "left" && newDirection === "right") ||
    (direction === "right" && newDirection === "left");

  if (!reverse) {
    nextDirection = newDirection;
  }
}

function showOverlay(title, hint) {
  statusText.textContent = title;
  overlay.querySelector(".hint").textContent = hint;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function pulseBeep(frequency, duration) {
  if (!soundOn || !window.AudioContext) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function updateClock() {
  clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
    return;
  }

  const newDirection = directionKeys[event.key];
  if (newDirection) {
    event.preventDefault();
    setDirection(newDirection);
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => setDirection(button.dataset.direction));
});

canvas.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 24) {
    setDirection(Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? "right" : "left") : deltaY > 0 ? "down" : "up");
  }
  touchStart = null;
});

playPauseBtn.addEventListener("click", togglePlay);
restartBtn.addEventListener("click", resetGame);
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
  soundBtn.setAttribute("aria-pressed", String(soundOn));
});

updateClock();
setInterval(updateClock, 1000);
resetGame();
