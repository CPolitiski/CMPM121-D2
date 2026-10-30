interface Point {
  x: number;
  y: number;
}

interface StrokeStyle {
  color: string;
  width: number;
  cap: CanvasLineCap;
}

interface Stroke {
  id: number;
  points: Point[];
  style: StrokeStyle;
}

interface PaintDocument {
  width: number;
  height: number;
  strokes: Stroke[];
}

const doc: PaintDocument = { width: 300, height: 300, strokes: [] };
let currentStroke: Stroke | null = null;
let nextId = 1;

const currentStyle: StrokeStyle = { color: "#000", width: 3, cap: "round" };

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Your project starts here.";

app.append(heading, message);

const canvas = document.querySelector<HTMLCanvasElement>("#paint-canvas")!;
const ctx = canvas.getContext("2d")!;

function toDocPoint(e: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * doc.width,
    y: ((e.clientY - rect.top) / rect.height) * doc.height,
  };
}

function drawStroke(stroke: Stroke) {
  const { points, style } = stroke;
  if (points.length === 0) return;

  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = style.cap;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 1) {
    ctx.lineTo(points[0].x, points[0].y);
  } else {
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.stroke();
}

function redraw() {
  const scaleX = canvas.width / doc.width;
  const scaleY = canvas.height / doc.height;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

  ctx.clearRect(0, 0, doc.width, doc.height);
  for (const stroke of doc.strokes) drawStroke(stroke);
  if (currentStroke) drawStroke(currentStroke);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  currentStroke = {
    id: nextId++,
    points: [toDocPoint(e)],
    style: { ...currentStyle },
  };
  redraw();
});

canvas.addEventListener("pointermove", (e) => {
  if (!currentStroke) return;
  currentStroke.points.push(toDocPoint(e));
  redraw();
});

function finishStroke() {
  if (!currentStroke) return;
  doc.strokes.push(currentStroke);
  currentStroke = null;
  redraw();
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);

redraw();
