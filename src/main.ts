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

interface Display {
  clear(): void;
  render(strokes: readonly Stroke[], doc: PaintDocument): void;
}

function createCanvasDisplay(canvas: HTMLCanvasElement): Display {
  const ctx = canvas.getContext("2d")!;

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
  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return {
    clear,
    render(strokes, doc) {
      clear();
      ctx.setTransform(
        canvas.width / doc.width,
        0,
        0,
        canvas.height / doc.height,
        0,
        0,
      );
      for (const stroke of strokes) drawStroke(stroke);
    },
  };
}

const doc: PaintDocument = { width: 300, height: 300, strokes: [] };
let currentStroke: Stroke | null = null;
let nextId = 1;
const currentStyle: StrokeStyle = { color: "#000", width: 3, cap: "round" };

const canvas = document.querySelector<HTMLCanvasElement>("#paint-canvas")!;

let display: Display;

function render() {
  const ordered = currentStroke ? [...doc.strokes, currentStroke] : doc.strokes;
  display.render(ordered, doc);
}

let renderQueued = false;

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function setDisplay(next: Display) {
  display = next;
  requestRender();
}

function beginStroke(p: Point) {
  currentStroke = { id: nextId++, points: [p], style: { ...currentStyle } };
  requestRender();
}

function extendStroke(p: Point) {
  if (!currentStroke) return;
  currentStroke.points.push(p);
  requestRender();
}

function commitStroke() {
  if (!currentStroke) return;
  doc.strokes.push(currentStroke);
  currentStroke = null;
  requestRender();
}

function toDocPoint(e: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * doc.width,
    y: ((e.clientY - rect.top) / rect.height) * doc.height,
  };
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  beginStroke(toDocPoint(e));
});
canvas.addEventListener("pointermove", (e) => extendStroke(toDocPoint(e)));
canvas.addEventListener("pointerup", commitStroke);
canvas.addEventListener("pointercancel", commitStroke);

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", () => {
  display.clear();
  setTimeout(requestRender, 500);
});

const app = document.querySelector<HTMLElement>("#app")!;
const heading = document.createElement("h1");
heading.textContent = "D2 project";
const message = document.createElement("p");
message.textContent = "Your project starts here.";
app.append(heading, message);
app.append(redrawButton);

setDisplay(createCanvasDisplay(canvas));
