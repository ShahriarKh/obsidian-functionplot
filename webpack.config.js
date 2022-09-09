import { fileURLToPath, URL } from "url";
import pkg from "webpack";
const { EnvironmentPlugin, DefinePlugin } = pkg;

export default function (env) {
  const mode = env.mode || "development";
  const prod = ["production", "release"].includes(mode);

  return {
    mode: prod ? "production" : "development",
    entry: "./src/main.ts",
    devtool:
      mode === "development"
        ? "inline-source-map"
        : mode === "release"
        ? "nosources-source-map"
        : false,
    performance: {
      hints: false, // ignore size since the bundle is run locally
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                inlineSourceMap: !prod,
                inlineSources: !prod,
              },
            },
          },
        },
      ],
    },
    plugins: [
      new EnvironmentPlugin({
        SENTRY_DSN: null,
      }),
      new DefinePlugin({
        __SENTRY_DEBUG__: !prod,
      }),
    ],
    resolve: {
      extensions: [".ts", ".js"],
    },
    externals: {
      obsidian: "commonjs obsidian",
    },
    output: {
      path: fileURLToPath(new URL(".", import.meta.url)),
      filename: "main.js",
      libraryTarget: "commonjs",
    },
  };
}
