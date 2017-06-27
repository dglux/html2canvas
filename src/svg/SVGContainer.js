var Promise = require('../promise');
var XHR = require('../xhr');
var decode64 = require('../utils').decode64;
var SVGParser = require('./SVGParser.js');

function SVGContainer(src, options) {
  this.src = src;
  this.image = document.createElement('canvas');

  this.scale = devicePixelRatio * (options.scale || 1);
  var self = this;

  this.getBounds = function(bounds) {
    bounds.x1 = bounds.x1 + this.bb.x1;
    bounds.x2 = bounds.x2 + this.bb.width;
    bounds.y1 = bounds.y1 + this.bb.y1;
    bounds.y2 = bounds.y2 + this.bb.height;

    return bounds;
  };

  // first pass is to get bounding box only
  // second pass is to render w/ scale
  this.promise = (self.isInline(src) ? Promise.resolve(self.inlineFormatting(src)) : XHR(src))
    .then(function(svg) {
      return new Promise(function(resolve) {
        // dummy canvas for first pass
        var canvas = document.createElement('canvas');
        SVGParser.parse(canvas, node, {
          renderCallback: function (obj) {
            self.bb = obj.bounds;

            self.image.style.width = self.bb.width + "px";
            self.image.style.height = self.bb.height + "px";

            self.image.width = self.bb.width * self.scale;
            self.image.height = self.bb.height * self.scale;

            SVGParser.parse(self.image, node, {
              ignoreDimensions: true,
              scale: self.scale,
              renderCallback: function (obj) {
                resolve();
              }
            });
          }
        });
      }.bind(this));
    }.bind(this));
}

SVGContainer.prototype.inlineFormatting = function(src) {
  return (/^data:image\/svg\+xml;base64,/.test(src)) ? this.decode64(this.removeContentType(src)) : this.removeContentType(src);
};

SVGContainer.prototype.removeContentType = function(src) {
  return src.replace(/^data:image\/svg\+xml(;base64)?,/, '');
};

SVGContainer.prototype.isInline = function(src) {
  return (/^data:image\/svg\+xml/i.test(src));
};

SVGContainer.prototype.decode64 = function(str) {
  return (typeof(window.atob) === "function") ? window.atob(str) : decode64(str);
};

module.exports = SVGContainer;
