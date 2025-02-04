module.exports = {
  default: {
    require: ["features/step-definitions/*.ts"],
    requireModule: ["ts-node/register"],
    format: ["progress"],
    paths: ["features/*.feature"],
  },
};