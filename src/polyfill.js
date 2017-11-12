module.exports = {
  Promise: global.Promise || require("es6-promise").Promise,
  Map: global.Map || require("es6-map")
};