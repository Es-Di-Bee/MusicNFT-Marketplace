require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./src/utilities/artifacts",
    sources: "./src/model",
    cache: "./src/utilities/cache",
    tests: "./src/test"
  },
};
