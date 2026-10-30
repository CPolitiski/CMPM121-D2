interface Point {
  x: number;
  y: number;
}

interface StrokeStyle {
  color: string;
  width: number;
  cap: CanvasLineCap;
}

interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

interface Stroke extends Drawable {
  type: "stroke";
  id: number;
  points: Point[];
  style: StrokeStyle;
}

interface Sticker extends Drawable {
  type: "sticker";
  id: number;
  position: Point;
  content: string;
  size: number;
}

type DrawCommand = Stroke | Sticker;

interface PaintDocument {
  width: number;
  height: number;
  background: string;
  commands: DrawCommand[];
}

interface Display {
  clear(): void;
  render(commands: readonly DrawCommand[], doc: PaintDocument): void;
}

interface MarkerTool {
  type: "marker";
  label: string;
  style: StrokeStyle;
}

interface StickerTool {
  type: "sticker";
  label: string;
  content: string;
  size: number;
}

type Tool = MarkerTool | StickerTool;

const tools: Tool[] = [
  {
    type: "marker",
    label: "Thin Marker",
    style: { color: "#000000", width: 2, cap: "round" },
  },
  {
    type: "marker",
    label: "Thick Marker",
    style: { color: "#000000", width: 8, cap: "round" },
  },
  { type: "sticker", label: "♬", content: "♬", size: 32 },
  { type: "sticker", label: "♪", content: "♪", size: 32 },
  { type: "sticker", label: "♫", content: "♫", size: 32 },
];

let selectedTool: Tool = tools[0];
let currentCommand: DrawCommand | null = null;
let activePointerId: number | null = null;
let nextId = 1;
let display: Display;
const redoStack: DrawCommand[] = [];
const doc: PaintDocument = {
  width: 300,
  height: 300,
  background: "#ffffff",
  commands: [],
};
const canvas = document.querySelector<HTMLCanvasElement>("#paint-canvas")!;

function createCanvasDisplay(canvas: HTMLCanvasElement): Display {
  const ctx = canvas.getContext("2d")!;

  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return {
    clear,
    render(commands, doc) {
      clear();
      ctx.setTransform(
        canvas.width / doc.width,
        0,
        0,
        canvas.height / doc.height,
        0,
        0,
      );
      ctx.save();
      ctx.fillStyle = doc.background;
      ctx.fillRect(0, 0, doc.width, doc.height);
      ctx.restore();
      for (const cmd of commands) cmd.draw(ctx);
    },
  };
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, style } = stroke;
  if (points.length === 0) return;

  ctx.save();
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
  ctx.restore();
}

function drawSticker(ctx: CanvasRenderingContext2D, sticker: Sticker) {
  ctx.save();
  ctx.font = `${sticker.size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText(sticker.content, sticker.position.x, sticker.position.y);
  ctx.restore();
}

function makeStroke(id: number, start: Point, style: StrokeStyle): Stroke {
  const stroke: Stroke = {
    type: "stroke",
    id,
    points: [start],
    style,
    draw: (ctx) => drawStroke(ctx, stroke),
  };
  return stroke;
}

function makeSticker(
  id: number,
  position: Point,
  content: string,
  size: number,
): Sticker {
  const sticker: Sticker = {
    type: "sticker",
    id,
    position,
    content,
    size,
    draw: (ctx) => drawSticker(ctx, sticker),
  };
  return sticker;
}

function render() {
  const ordered = currentCommand
    ? [...doc.commands, currentCommand]
    : doc.commands;
  display.render(ordered, doc);
  updateHistoryControls();
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

function commitCommand(cmd: DrawCommand) {
  doc.commands.push(cmd);
  redoStack.length = 0;
  requestRender();
}

function createCommand(tool: Tool, point: Point): DrawCommand {
  switch (tool.type) {
    case "marker":
      return makeStroke(nextId++, point, { ...tool.style });
    case "sticker":
      return makeSticker(nextId++, point, tool.content, tool.size);
  }
}

function beginAction(p: Point) {
  currentCommand = createCommand(selectedTool, p);
  requestRender();
}

function moveAction(p: Point) {
  if (!currentCommand) return;
  switch (currentCommand.type) {
    case "stroke":
      currentCommand.points.push(p);
      break;
    case "sticker":
      currentCommand.position = p;
      break;
  }
  requestRender();
}

function endAction() {
  if (!currentCommand) return;
  const finished = currentCommand;
  currentCommand = null;
  activePointerId = null;
  commitCommand(finished);
}

function cancelAction() {
  if (!currentCommand) return;
  currentCommand = null;
  activePointerId = null;
  requestRender();
}

function undo() {
  const cmd = doc.commands.pop();
  if (!cmd) return;
  redoStack.push(cmd);
  requestRender();
}

function redo() {
  const cmd = redoStack.pop();
  if (!cmd) return;
  doc.commands.push(cmd);
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
  if (e.button !== 0 || currentCommand) return;
  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  beginAction(toDocPoint(e));
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId !== activePointerId) return;
  moveAction(toDocPoint(e));
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerId !== activePointerId) return;
  endAction();
});
canvas.addEventListener("pointercancel", (e) => {
  if (e.pointerId !== activePointerId) return;
  cancelAction();
});

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", () => {
  display.clear();
  setTimeout(requestRender, 500);
});

const undoButton = document.createElement("button");
undoButton.addEventListener("click", undo);

const redoButton = document.createElement("button");
redoButton.addEventListener("click", redo);

function updateHistoryControls() {
  const canUndo = doc.commands.length > 0 && !currentCommand;
  const canRedo = redoStack.length > 0 && !currentCommand;

  undoButton.disabled = !canUndo;
  undoButton.textContent = `Undo (${doc.commands.length})`;
  undoButton.title = canUndo ? "Undo the last action" : "Nothing to undo";

  redoButton.disabled = !canRedo;
  redoButton.textContent = `Redo (${redoStack.length})`;
  redoButton.title = canRedo
    ? "Restore the last undone action"
    : "Nothing to redo";
}

const palette = document.createElement("div");
const toolButtons = new Map<Tool, HTMLButtonElement>();

function updateToolButtons() {
  for (const [tool, button] of toolButtons) {
    const selected = tool === selectedTool;
    button.setAttribute("aria-pressed", String(selected));
    button.style.outline = selected ? "2px solid #000000" : "";
  }
}

function selectTool(tool: Tool) {
  selectedTool = tool;
  updateToolButtons();
}

function addToolButton(tool: Tool) {
  const button = document.createElement("button");
  button.textContent = tool.label;
  button.addEventListener("click", () => selectTool(tool));
  toolButtons.set(tool, button);
  palette.append(button);
}

function addTool(tool: Tool) {
  tools.push(tool);
  addToolButton(tool);
}

for (const tool of tools) addToolButton(tool);
updateToolButtons();

const CUSTOM_STICKER_SIZE = 32;
const newStickerButton = document.createElement("button");
newStickerButton.textContent = "+ New sticker";
newStickerButton.title = "Create a sticker from an emoji or short text";
newStickerButton.addEventListener("click", () => {
  const content = prompt("Sticker content:")?.trim();
  if (!content) return;

  const name = prompt("Name for this sticker:", content)?.trim();
  if (name === undefined) return;

  const tool: StickerTool = {
    type: "sticker",
    label: name || content,
    content,
    size: CUSTOM_STICKER_SIZE,
  };
  addTool(tool);
  selectTool(tool);
});

const EXPORT_SCALE = 2;

function exportPNG() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * EXPORT_SCALE;
  exportCanvas.height = canvas.height * EXPORT_SCALE;

  const exportDisplay = createCanvasDisplay(exportCanvas);
  exportDisplay.render(doc.commands, doc);

  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
exportButton.title = "Download as PNG";
exportButton.addEventListener("click", exportPNG);

const app = document.querySelector<HTMLElement>("#app")!;
const heading = document.createElement("h1");
heading.textContent = "Music Paint";
const message = document.createElement("p");
message.textContent = "Draw your musical dream";
app.append(heading, message);
app.append(palette);
app.append(newStickerButton);
app.append(undoButton, redoButton, redrawButton);
app.append(exportButton);

setDisplay(createCanvasDisplay(canvas));
