const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Your project starts here.";

app.append(heading, message);

const canvas = document.querySelector<HTMLCanvasElement>("#paint-canvas")!;
const ctx = canvas.getContext("2d")!;

ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "#000";

let drawing = false;

function getPos(e: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  canvas.setPointerCapture(e.pointerId);
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
});

function stopDrawing() {
  drawing = false;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
