const { Promise } = require("../../polyfill");

const BaseImageContainer = require("../BaseImageContainer");

const TYPES = {
  LINEAR: 1,
  RADIAL: 2
};

module.exports = class GradientContainer extends BaseImageContainer {
  constructor(imageData, container, bounds) {
    bounds = bounds || container.parseBounds();

    this.src = JSON.stringify([imageData.value, bounds]);

    this.colorStops = [];

    this.type = (imageData.args[0] === "linear") ? TYPES.LINEAR : TYPES.RADIAL;

    this.x0 = bounds.width / 2;
    this.y0 = bounds.height / 2;
    this.x1 = this.x0;
    this.y1 = this.y0;

    this.promise = Promise.resolve(true);
  }
};

module.exports.TYPES = TYPES;