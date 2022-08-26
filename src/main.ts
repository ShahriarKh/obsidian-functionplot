import functionPlot, { Chart } from 'function-plot'
import { FunctionPlotOptions } from 'function-plot/dist/types'
import { MarkdownPostProcessorContext, Plugin, parseYaml, Editor } from 'obsidian'
import CreatePlotModal from './app/CreatePlotModal'
import SettingsTab from './app/SettingsTab'
import { insertParagraphAtCursor, renderAsInteractive } from "./utils"
import createStylingPlugin from './plugins/styling'
import { PlotOptions, DEFAULT_PLOT_OPTIONS, PluginSettings, DEFAULT_PLUGIN_SETTINGS } from './types'

// The main plugin entrypoint.
export default class ObsidianFunctionPlot extends Plugin {
  settings: PluginSettings

  async onload() {
    // load settings
    await this.loadSettings();
    // add settings tab
    this.addSettingTab(new SettingsTab(this.app, this))
    // register command for CreatePlotModal
    this.addCommand({
      id: 'insert-functionplot',
      name: 'Plot a function',
      editorCallback: (editor: Editor) => {
        new CreatePlotModal(this, editor).open()
      },
    })
    // register code block renderer
    this.registerMarkdownCodeBlockProcessor(
      'functionplot',
      this.createFunctionPlotHandler(this)
    )
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * A closure creating a code-block handler that also has access to the plugin object
   * through the outer function's scope.
   * @param plugin The plugin
   * @returns The code-block handler
   */
  createFunctionPlotHandler(plugin: ObsidianFunctionPlot) {
    return async (
      source: string,
      el: HTMLElement,
      _ctx: MarkdownPostProcessorContext
    ) => {
      // parse functionplot options
      const header: string = (source.match(/-{3}[^]*-{3}/) || [null])[0]
      const functions = (header ? source.substring(header.length) : source)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
      const options: PlotOptions = Object.assign(
        {},
        DEFAULT_PLOT_OPTIONS,
        header ? parseYaml(header.match(/-{3,}([^]*?)-{3,}/)[1]) : {},
        { functions: functions }
      )
      await createPlot(options, el, plugin)
    }
  }

}

/**
 * Create a plot in the specified `target` element.
 * @param options The options for the plot
 * @param target The html element to target
 * @param plugin A reference to the plugin (accessed for settings)
 * @returns The chart object of the created plot
 */
export async function createPlot(
  options: PlotOptions,
  target: HTMLElement,
  plugin: ObsidianFunctionPlot
): Promise<Chart> {
  try {
    const fPlotOptions: FunctionPlotOptions = {
      target: target,
      plugins: [createStylingPlugin(plugin)],
      title: options.title,
      grid: options.grid,
      disableZoom: options.disableZoom,
      xAxis: {
        domain: options.bounds.slice(0, 2),
        label: options.xLabel,
      },
      yAxis: {
        domain: options.bounds.slice(2, 4),
        label: options.yLabel,
      },
      data: options.functions.map((line) => {
        return { fn: line.split('=')[1], graphType: 'polyline' }
      })
    }
    const plot = functionPlot(fPlotOptions)

    return plot
  } catch (e) {
    console.debug(e)
  }
}


