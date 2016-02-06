var Promise = require('../promise');

function GradientContainer(imageData, container, bounds) {
  this.src = JSON.stringify([imageData.value, bounds]);
  this.colorStops = [];
  this.type = null;
  this.x0 = bounds.width / 2;
  this.y0 = bounds.height / 2;
  this.x1 = this.x0;
  this.y1 = this.y0;
  this.promise = Promise.resolve(true);
}

GradientContainer.prototype.TYPES = {
  LINEAR: 1,
  RADIAL: 2
};

module.exports = GradientContainer;
