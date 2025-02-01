const dotenv = require("dotenv");
const path = require("path");
const envConfig = dotenv.config({
  path: path.join(__dirname, "/config.env"),
});

module.exports = envConfig;