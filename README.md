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

Revision: Within commit 7 we fixed a long function code smell. Our old drawstroke function was a very long function that had many smaller functions inside of it. We divided everything up and separated the functions into their own individual smaller functions.

Playtest: We had a friend test out the program and they were able to easily figure out and use each of the tools and functionality of the program without intervention.

# Developer Documentation

## Adding a new tool

This is an example on how to add a rectangle tool.

### 1. Add the tool to the `Tool` type and the `tools`

A tool describes the settings for what it will create.

```ts
interface RectTool {
  type: "rect";
  label: string;
  style: StrokeStyle;
}

type Tool = MarkerTool | StickerTool | RectTool;
```

Next, add a preset entry to the `tools` list:

```ts
{ type: "rect", label: "Rectangle", style: { color: "#000000", width: 3, cap: "butt" } },
```

## Playable Link

https://cpolitiski.github.io/CMPM121-D2/

## Repository Link

https://github.com/CPolitiski/CMPM121-D2

# D2 starter

A minimal TypeScript/Vite browser project with Deno checks and GitHub Pages deployment.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.

```
```
