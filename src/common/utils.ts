import { Editor, parseYaml } from "obsidian";
import ObsidianFunctionPlot, { createPlot } from "../main";
import { PlotOptions } from "./types";
import { toPng } from "html-to-image";

/**
 * Insert an interactive plot at the current cursor position.
 * @param plugin A reference to the plugin
 * @param editor A reference to the active editor
 * @param options The options for the plot
 */
export async function renderPlotAsInteractive(
  plugin: ObsidianFunctionPlot,
  editor: Editor,
  options: PlotOptions
) {
  const text = `\`\`\`functionplot
---
title: ${options.title}
xLabel: ${options.xLabel}
yLabel: ${options.yLabel}
bounds: [${options.bounds.join(",")}]
disableZoom: ${options.disableZoom}
grid: ${options.grid}
---
${(options.functions ?? []).join("\n")}
\`\`\``;
  insertParagraphAtCursor(plugin, editor, text);
}

/**
 * Render the plot as an image element using a data url.
 * @param plugin A reference to the plugin
 * @param editor A reference to the active editor
 * @param options The options for the plot
 */
export async function renderPlotAsImage(
  plugin: ObsidianFunctionPlot,
  editor: Editor,
  options: PlotOptions
) {
  const htmlTarget = document.createElement("div");
  await createPlot(options, htmlTarget, plugin);
  const dataURL = await toPng(htmlTarget);
  if (dataURL === "data:,") {
    new Error("Data URL is empty");
  }
  const text = `<img alt="Obsidian Functionplot Plot. Name: ${
    options.title
  }, X-Label: ${options.xLabel}, Y-Label: ${options.yLabel}, Functions: ${(
    options.functions ?? []
  ).join("\n")}."src="${dataURL}">`;
  htmlTarget.remove();
  insertParagraphAtCursor(plugin, editor, text);
}

/**
 * Insert the text as a new paragraph (newline before and after), and place the active cursor below.
 * @param editor The editor element
 * @param text The text to place
 */
export async function insertParagraphAtCursor(
  plugin: ObsidianFunctionPlot,
  editor: Editor,
  text: string
) {
  // TODO broken
  text = "\n" + text.trim() + "\n\n";
  editor.setLine(editor.getCursor().line, text);
}

export function parseCodeBlock(content: string): [object, string[]] {
  let header = {},
    offset = 0;
  if (/-{3}[^]*-{3}/.test(content)) {
    // header present
    const headerMatch = content.match(/-{3}([^]*?)-{3}/)[1];
    offset = headerMatch.length + 6;
    header = parseYaml(headerMatch);
  }
  const functions = content
    .slice(offset)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [header, functions];
}
