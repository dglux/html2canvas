const { Promise } = require("../../polyfill");
const { Completer } = require("../../utils");
const BoundingBox = require("../../BoundingBox");
const XHR = require("../../xhr");

const BaseImageContainer = require("../BaseImageContainer");

const SVGParser = require("./SVGParser");
const { isInline, inlineFormatting } = require("./utils");

module.exports = class SVGContainer extends BaseImageContainer {
  constructor(src, options) {
    this.src = src;

    this.isScaled = true;
    this.scale = devicePixelRatio * (options.scale || 1);
    
    this.image = document.createElement("canvas");

    // set inside promise
    this.bb = null;

    this.promise = (isInline(src) ? Promise.resolve(inlineFormatting(src)) : XHR(src))
        .then(svg => this.completePromise(renderObj));
  }

  static fromNode(node, options) {
    const self = Object.create(SVGContainer.prototype);

    self.src = node;

    self.isScaled = true;
    self.scale = devicePixelRatio * (options.scale || 1);

    self.image = document.createElement("canvas");
  
    // set inside promise
    self.bb = null;

    self.promise = self.completePromise(node);

    return self;
  }

  // first pass is to get bounding box only
  // second pass is to render w/ scale
  completePromise(renderObj) {
    const completer = new Completer();

    // dummy canvas for first pass
    const canvas = document.createElement("canvas");
    
    SVGParser.parse(canvas, renderObj, {
      renderCallback: obj => {
        self.bb = obj.bounds;

        self.image.style.width = self.bb.width + "px";
        self.image.style.height = self.bb.height + "px";

        self.image.width = self.bb.width * self.scale;
        self.image.height = self.bb.height * self.scale;

        SVGParser.parse(self.image, renderObj, {
          ignoreDimensions: true,
          scale: self.scale,
          renderCallback: obj => {
            completer.resolve();
          }
        });
      }
    });

    return completer.promise;
  }

  getBounds(b) {
    const nb = new BoundingBox();

    nb.x1 = bounds.x1 + this.bb.x1;
    nb.x2 = bounds.x1 + this.bb.width;
    nb.y1 = bounds.y1 + this.bb.y1;
    nb.y2 = bounds.y1 + this.bb.height;

    return nb;
  }
}