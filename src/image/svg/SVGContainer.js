const { Promise } = require("../../polyfill");
const { promiseDeferred } = require("../../utils");
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
        .then(svg => this.completePromise(svg));
  }

  static fromNode(node, options) {
    const self = Object.create(SVGContainer.prototype);

    self.isFromNode = true;
    self.src = node;

    self.isScaled = true;
    self.scale = devicePixelRatio * (options.scale || 1);

    self.image = document.createElement("canvas");
  
    // set inside promise
    self.bb = null;

    self.promise = self.completePromise.call(self, node);

    return self;
  }

  // first pass is to get bounding box only
  // second pass is to render w/ scale
  completePromise(renderObj) {
    const deferred = promiseDeferred();

    // dummy canvas for first pass
    const canvas = document.createElement("canvas");
    
    SVGParser.parse(canvas, renderObj, {
      renderCallback: obj => {
        this.bb = obj.bounds;

        this.image.width = this.bb.width * this.scale;
        this.image.height = this.bb.height * this.scale;

        SVGParser.parse(this.image, renderObj, {
          ignoreDimensions: true,
          scale: this.scale,
          renderCallback: obj => {
            deferred.resolve(this.image);
          }
        });
      }
    });

    return deferred;
  }

  getBounds(bounds) {
    const nb = new BoundingBox();

    nb.x1 = bounds.x1 + this.bb.x1;
    nb.x2 = bounds.x1 + this.bb.width;
    nb.y1 = bounds.y1 + this.bb.y1;
    nb.y2 = bounds.y1 + this.bb.height;

    return nb;
  }
}