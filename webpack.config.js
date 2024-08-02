const path = require("path");

module.exports = {
  entry: {
    "slider": "./slider.js"
  },
  mode: "production",
  output: {
    filename: "[name].min.js",
    path: path.resolve(__dirname, ""),
  },
  optimization: {
    usedExports: false, // Disable tree shaking
  }
};
