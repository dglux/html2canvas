var GradientContainer = require('./GradientContainer');

function WebkitGradientContainer(imageData, container) {
  GradientContainer.call(this, imageData, container, container.parseBounds());
  this.type = (imageData.args[0] === "linear") ? this.TYPES.LINEAR : this.TYPES.RADIAL;
}

WebkitGradientContainer.prototype = Object.create(GradientContainer.prototype);

module.exports = WebkitGradientContainer;
