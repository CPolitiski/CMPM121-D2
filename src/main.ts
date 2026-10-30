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
  type: "stroke";
  id: number;
  points: Point[];
  style: StrokeStyle;
}

interface Sticker {
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
  { type: "sticker", label: "★", content: "★", size: 32 },
  { type: "sticker", label: "❤", content: "❤", size: 32 },
  { type: "sticker", label: "♫", content: "♫", size: 32 },
];

let selectedTool: Tool = tools[0];
let currentCommand: DrawCommand | null = null;
let nextId = 1;
let display: Display;
const redoStack: DrawCommand[] = [];
const doc: PaintDocument = { width: 300, height: 300, commands: [] };
const canvas = document.querySelector<HTMLCanvasElement>("#paint-canvas")!;

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

  function drawSticker(sticker: Sticker) {
    ctx.font = `${sticker.size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.fillText(sticker.content, sticker.position.x, sticker.position.y);
  }

  function drawCommand(cmd: DrawCommand) {
    switch (cmd.type) {
      case "stroke":
        drawStroke(cmd);
        break;
      case "sticker":
        drawSticker(cmd);
        break;
    }
  }

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
      for (const cmd of commands) drawCommand(cmd);
    },
  };
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

function createCommand(tool: Tool, point: Point): DrawCommand {
  switch (tool.type) {
    case "marker":
      return {
        type: "stroke",
        id: nextId++,
        points: [point],
        style: { ...tool.style },
      };
    case "sticker":
      return {
        type: "sticker",
        id: nextId++,
        position: point,
        content: tool.content,
        size: tool.size,
      };
  }
}

function beginStroke(p: Point) {
  currentCommand = createCommand(selectedTool, p);
  requestRender();
}

function extendStroke(p: Point) {
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

function commitStroke() {
  if (!currentCommand) return;
  doc.commands.push(currentCommand);
  currentCommand = null;
  redoStack.length = 0;
  requestRender();
}

function cancelStroke() {
  if (!currentCommand) return;
  currentCommand = null;
  requestRender();
}

function undo() {
  if (currentCommand) return;
  const cmd = doc.commands.pop();
  if (!cmd) return;
  redoStack.push(cmd);
  requestRender();
}

function redo() {
  if (currentCommand) return;
  const stroke = redoStack.pop();
  if (!stroke) return;
  doc.commands.push(stroke);
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
canvas.addEventListener("pointercancel", cancelStroke);

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

const app = document.querySelector<HTMLElement>("#app")!;
const heading = document.createElement("h1");
heading.textContent = "D2 project";
const message = document.createElement("p");
message.textContent = "Your project starts here.";
app.append(heading, message);
app.append(palette);
app.append(newStickerButton);
app.append(undoButton, redoButton, redrawButton);

setDisplay(createCanvasDisplay(canvas));
