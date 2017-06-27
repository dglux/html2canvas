var SVGContainer = require('./SVGContainer');
var Promise = require('../promise');
var SVGParser = require('./SVGParser.js');
var utils = require('../utils');

function SVGNodeContainer(node, options) {
  this.src = node;
  this.image = document.createElement('canvas');

  this.scale = devicePixelRatio * (options.scale || 1);

  this.bb = null;
  var self = this;

  this.getBounds = function(bounds) {
    bounds.x1 = bounds.x1 + this.bb.x1;
    bounds.x2 = bounds.x1 + this.bb.width;
    bounds.y1 = bounds.y1 + this.bb.y1;
    bounds.y2 = bounds.y1 + this.bb.height;

    return bounds;
  }.bind(this);

  // first pass is to get bounding box only
  // second pass is to render w/ scale
  this.promise = new Promise(function(resolve, reject) {
    // dummy canvas for first pass
    var canvas = document.createElement('canvas');
    SVGParser.parse(canvas, node, {
      renderCallback: function(obj) {
        self.bb = obj.bounds;

        self.image.style.width = self.bb.width + "px";
        self.image.style.height = self.bb.height + "px";

        self.image.width = self.bb.width * self.scale;
        self.image.height = self.bb.height * self.scale;

        SVGParser.parse(self.image, node, {
          ignoreDimensions: true,
          scale: self.scale,
          renderCallback: function(obj) {
            resolve();
          }
        });
      }
    });
  });
}

SVGNodeContainer.prototype = Object.create(SVGContainer.prototype);

module.exports = SVGNodeContainer;
