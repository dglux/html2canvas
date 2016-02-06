var SVGContainer = require('./SVGContainer');
var Promise = require('../promise');
var SVGParser = require('./SVGParser.js');
var utils = require('../utils');

function SVGNodeContainer(node) {
  this.src = node;
  this.image = document.createElement('canvas');
  this.bb = null;
  var self = this;

  this.getBounds = function(bounds) {
    bounds.x1 = bounds.x1 + this.bb.x1;
    bounds.x2 = bounds.x1 + this.bb.width;
    bounds.y1 = bounds.y1 + this.bb.y1;
    bounds.y2 = bounds.y1 + this.bb.height;

    return bounds;
  }.bind(this);

  this.promise = new Promise(function(resolve, reject) {
    SVGParser.parse(this.image, node, {
      renderCallback: function(obj) {
        this.bb = obj.bounds;
        resolve();
      }.bind(this)
    });
  }.bind(this));
}

SVGNodeContainer.prototype = Object.create(SVGContainer.prototype);

module.exports = SVGNodeContainer;
