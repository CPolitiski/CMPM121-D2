# User Documentation

## Theme

We decided to create our paint program based on the theme of music.

## How to run

For online use, click the Github pages link provided below.
For offline use, clone the repo and run with deno.

## What we did

We created a simple paint tool with multi step undo and redo functionality. The program features both sticker and export functions to allow for the user to create/use stickers, and then export the image to png.

## How to use the app

Use the mouse to draw on the canvas. Select a marker or sticker option to change the style of your strokes/sticker. The undo and redo features show how many steps are stored and can be used to adjust mistakes. You can also use "+New sticker" to make a custom sticker by with a name and emoji/short text. The redraw feature briefly clears the canvas and will reconstruct everything in order. Finally, you can save your image as a PNG with a white background through the export button.

## Commits

Commit 1: Created a canvas that has clear borders, and allowed for user mouse input to create lines based on user mouse movement.

Commit 2: Changed the internal code to retain the information on the canvas in a document collection.

Commit 3: Added a redraw button that clears the canvas and then after a short delay will reconstruct everything that was drawn without mistake.

Commit 4: Added both a undo and redo button that can save multiple instances of undone and redone actions to allow for multi step undo and redo.

Commit 5: Added new tools to the program for user creativity. Tools added include both a thin and thick marker for users. star, heart, and music note stickers available for use.

Commit 6: Added the ability for user created stickers. Users can save what they have drawn as a sticker that can be used.

Commit 7: Separated document and interaction states for tools. Input,document changes, and rendering are handled separately.

Commit 8: Added a button to export the current drawing as a png with a white background to the user's computer files. Exporting does not impact the functionality of other buttons.

Revision: Within commit 7 we fixed a long function code smell. Our old drawstroke function was a very long function that had many smaller functions inside of it. We divided everything up and separated the functions into their own individual smaller functions. This was also needed to separate drawing from the on-screen canvas.

Playtest: We had a friend test out the program and they were able to easily figure out and use each of the tools and functionality of the program without intervention.

# Developer Documentation

## Adding a new tool

This is an example on how to add a rectangle tool.

### 1. Add the tool to the `Tool` type and the `tools`

A tool describes the settings for what it will create. Add a `RectTool` next to [`MarkerTool`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L45-L58) and [`StickerTool`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L45-L58) as well as the`Tool`:

```ts
interface RectTool {
  type: "rect";
  label: string;
  style: StrokeStyle;
}

type Tool = MarkerTool | StickerTool | RectTool;
```

Next, add a preset entry to the [`tools`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L60-L74) list:

```ts
{ type: "rect", label: "Rectangle", style: { color: "#000000", width: 3, cap: "butt" } },
```

### 2. Add `Rect` drawing command with `makeRect` and `drawRect`

Each saved object is a command that can draw itself onto any canvas. Add a `Rect` alongside [`Stroke`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L16-L29) and[`Sticker`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L16-L29):

```ts
interface Rect extends Drawable {
  type: "rect";
  id: number;
  start: Point; // the corner where the initial click happened
  end: Point; // the corner that follows the pointer
  style: StrokeStyle;
}
```

Write `drawRect` to match [`drawStroke`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L119-L150) and [`drawSticker`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L119-L150):

```ts
function drawRect(ctx: CanvasRenderingContext2D, rect: Rect) {
  const x = Math.min(rect.start.x, rect.end.x);
  const y = Math.min(rect.start.y, rect.end.y);
  const w = Math.abs(rect.end.x - rect.start.x);
  const h = Math.abs(rect.end.y - rect.start.y);

  ctx.save();
  ctx.strokeStyle = rect.style.color;
  ctx.lineWidth = rect.style.width;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
```

Write `makeRect` to match [`makeStroke`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L152-L178) and [`makeSticker`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L152-L178):

```ts
function makeRect(id: number, start: Point, style: StrokeStyle): Rect {
  const rect: Rect = {
    type: "rect",
    id,
    start,
    end: { ...start },
    style,
    draw: (ctx) => drawRect(ctx, rect),
  };
  return rect;
}
```

### 3. Add `Rect` to the [`DrawCommand`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L31) union

```ts
type DrawCommand = Stroke | Sticker | Rect;
```

### 4. Handle case `"rect"` in [`createCommand`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L210-L217)

Add a case for `"rect"` to turn the tool into a new command when the user clicks:

```ts
case "rect":
  return makeRect(nextId++, point, { ...tool.style });
```

### 5. Handle `"rect"` in [`moveAction`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L224-L235)

[`moveAction`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L224-L235) updates the action while the user drags the cursor. In this case, the rectangle moves its far corner:

```ts
case "rect":
  currentCommand.end = p;
  break;
```

Nothing else requires changes. The other functions look at what kind of tool or command they are dealing with and therefore only use the `tools` list, `Tool` fields, or shared `draw(ctx)` method.

- [`undo`/`redo`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L252-L264): these move command objects between `doc.commands` and `redoStack`, and since a rectangle is one object like the other actions, it does not function any different.
- [`exportPNG`](https://github.com/CPolitiski/CMPM121-D2/blob/3b87be8505973f3eead2d87122962365dfae840b/src/main.ts#L376-L393): builds a second display on a 2x canvas and replays only `doc.commands` so they still show up in the PNG like how any other action would.

## Playable Link

https://cpolitiski.github.io/CMPM121-D2/

## Repository Link

https://github.com/CPolitiski/CMPM121-D2

# D2 starter

A minimal TypeScript/Vite browser project with Deno checks and GitHub Pages deployment.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
