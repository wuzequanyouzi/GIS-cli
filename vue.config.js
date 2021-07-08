const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

// ===cesium ====
let cesiumSource = "./node_modules/cesium/Source";
let cesiumWorkers = "../Build/Cesium/Workers";

module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: {
            loader: "worker-loader",
            options: {
              inline: "no-fallback",
              chunkFilename: "[id].[contenthash].worker.js",
            },
          },
        },
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    plugins: [
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./vendor-manifest.json"),
      }),
      new MiniCssExtractPlugin({
        filename: "css/[name][contenthash].css",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(cesiumSource, cesiumWorkers), to: "Workers" },
          { from: path.join(cesiumSource, "Assets"), to: "Assets" },
          { from: path.join(cesiumSource, "Widgets"), to: "Widgets" },
          {
            from: path.join(cesiumSource, "ThirdParty/Workers"),
            to: "ThirdParty/Workers",
          },
        ],
      }),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("./"),
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessor: require("cssnano"),
        cssProcessorPluginOptions: {
          preset: ["default", { discardComments: { removeAll: true } }],
        },
        canPrint: true,
      }),
    ],
  },
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].title = "3D地图展示";
      return args;
    });
  },
};
