var Renderer = require('./Renderer');
var LinearGradientContainer = require('../gradient/LinearGradientContainer');
var RadialGradientContainer = require('../gradient/RadialGradientContainer');
var log = require('../log');

function CanvasRenderer(width, height, imageLoader, options) {
  Renderer.apply(this, arguments);
  this.canvas = this.options.canvas || document.createElement("canvas");
  this.scale = devicePixelRatio * (options.scale || 1);
  
  if(!this.options.canvas) {
    this.canvas.width = width * this.scale;
    this.canvas.style.width = (width * (options.scale || 1)) + 'px';
    this.canvas.height = height * this.scale;
    this.canvas.style.height = (height * (options.scale || 1)) + 'px';
  }

  this.ctx = this.canvas.getContext("2d");
  this.taintCtx = document.createElement("canvas").getContext("2d");

  this.ctx.scale(this.scale, this.scale);

  this.ctx.textBaseline = "bottom";
  this.variables = {};
  this.transforms = {};
  this.stackDepth = 1;
  log("Initialized CanvasRenderer with size", width, "x", height);
}

CanvasRenderer.prototype = Object.create(Renderer.prototype);

CanvasRenderer.prototype.save = function() {
  this.ctx.save();
  this.stackDepth++;
};

CanvasRenderer.prototype.restore = function() {
  this.ctx.restore();
  delete this.transforms[this.stackDepth.toString()];
  this.stackDepth--;
}

CanvasRenderer.prototype.setFillStyle = function(fillStyle) {
  this.ctx.fillStyle = typeof(fillStyle) === "object" && !!fillStyle.isColor ? fillStyle.toString() : fillStyle;
  return this.ctx;
};

CanvasRenderer.prototype.rectangle = function(left, top, width, height, color) {
  this.setFillStyle(color).fillRect(left, top, width, height);
};

CanvasRenderer.prototype.circle = function(left, top, size, color) {
  this.setFillStyle(color);
  this.ctx.beginPath();
  this.ctx.arc(left + size / 2, top + size / 2, size / 2, 0, Math.PI * 2, true);
  this.ctx.closePath();
  this.ctx.fill();
};

CanvasRenderer.prototype.circleStroke = function(left, top, size, color, stroke, strokeColor) {
  this.circle(left, top, size, color);
  this.ctx.strokeStyle = strokeColor.toString();
  this.ctx.stroke();
};

CanvasRenderer.prototype.drawShape = function(shape, color) {
  this.shape(shape);
  this.setFillStyle(color).fill();
};

CanvasRenderer.prototype.taints = function(imageContainer) {
  if(imageContainer.tainted === null) {
    this.taintCtx.drawImage(imageContainer.image, 0, 0);
    try {
      this.taintCtx.getImageData(0, 0, 1, 1);
      imageContainer.tainted = false;
    } catch(e) {
      this.taintCtx = document.createElement("canvas").getContext("2d");
      imageContainer.tainted = true;
    }
  }

  return imageContainer.tainted;
};

CanvasRenderer.prototype.drawImage = function(imageContainer, sx, sy, sw, sh, dx, dy, dw, dh) {
  if(!this.taints(imageContainer) || this.options.allowTaint) {
    this.ctx.drawImage(imageContainer.image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
};

CanvasRenderer.prototype.clip = function(shapes, callback, context) {
  if(shapes.length === 0)
    return;

  this.save();
  this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

/*
  shapes.filter(hasEntries).forEach(function(shape) {
    console.log(shape);
    this.ctx.strokeStyle = 'rgb(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ')';
    this.shape(shape).stroke();
  }, this);
*/

  shapes.filter(hasEntries).forEach(function(shape) {
    if(shape[0] === 'transform') {
      this.setTransform(shape[1]);
      return;
    }
    this.shape(shape).clip();
  }, this);
  callback.call(context);
  this.restore();
};

CanvasRenderer.prototype.shape = function(shape) {
  this.ctx.beginPath();
  shape.forEach(function(point, index) {
    if(point[0] === "rect") {
      this.ctx.rect.apply(this.ctx, point.slice(1));
    } else {
      this.ctx[(index === 0) ? "moveTo" : point[0] + "To"].apply(this.ctx, point.slice(1));
    }
  }, this);
  this.ctx.closePath();
  return this.ctx;
};

CanvasRenderer.prototype.font = function(color, style, variant, weight, size, family) {
  variant = /^(normal|small-caps)$/i.test(variant) ? variant : '';
  this.setFillStyle(color).font = [style, variant, weight, size].join(" ").split(",")[0] + ' ' + family;
};

CanvasRenderer.prototype.setShadow = function(color, offsetX, offsetY, blur) {
  this.setVariable("shadowColor", color.toString())
    .setVariable("shadowOffsetX", offsetX)
    .setVariable("shadowOffsetY", offsetY)
    .setVariable("shadowBlur", blur);
};

CanvasRenderer.prototype.clearShadow = function() {
  this.setVariable("shadowColor", "rgba(0,0,0,0)");
};

CanvasRenderer.prototype.setOpacity = function(opacity) {
  this.ctx.globalAlpha = opacity;
};

CanvasRenderer.prototype.getTransform = function() {
  var a = this.stackDepth;
  while(--a > 0) {
    if(typeof(this.transforms[a.toString()]) !== 'undefined') {
      var transform = this.transforms[a.toString()];
      if(typeof(transform.x1) !== 'undefined')
        continue;
      if(transform.matrix.join(',') === '1,0,0,1,0,0')
        continue;
      return transform;
    }
  }

  return {
    origin: [0, 0],
    matrix: [this.scale, 0, 0, this.scale, 0, 0]
  };
};

CanvasRenderer.prototype.setTransform = function(transform) {
  this.ctx.translate(transform.origin[0], transform.origin[1]);
  this.transforms[this.stackDepth.toString()] = transform;
  this.ctx.transform.apply(this.ctx, transform.matrix);
  this.ctx.translate(-transform.origin[0], -transform.origin[1]);
};

CanvasRenderer.prototype.setVariable = function(property, value) {
  if(this.variables[property] !== value) {
    this.variables[property] = this.ctx[property] = value;
  }

  return this;
};

CanvasRenderer.prototype.text = function(text, left, bottom) {
  this.ctx.fillText(text, left, bottom);
};

CanvasRenderer.prototype.backgroundRepeatShape = function(imageContainer, backgroundPosition, size, bounds, left, top, width, height, borderData) {
  var shape = [
    ["line", Math.round(left), Math.round(top)],
    ["line", Math.round(left + width), Math.round(top)],
    ["line", Math.round(left + width), Math.round(height + top)],
    ["line", Math.round(left), Math.round(height + top)]
  ];
  this.clip([shape], function() {
    this.renderBackgroundRepeat(imageContainer, backgroundPosition, size, bounds, borderData[3], borderData[0]);
  }, this);
};

CanvasRenderer.prototype.renderBackgroundRepeat = function(imageContainer, backgroundPosition, size, bounds, borderLeft, borderTop) {
  var offsetX = Math.round(bounds.x + backgroundPosition.x + borderLeft), offsetY = Math.round(bounds.y + backgroundPosition.y + borderTop);
  this.setFillStyle(this.ctx.createPattern(this.resizeImage(imageContainer, size), "repeat"));
  this.ctx.translate(offsetX, offsetY);
  this.ctx.fill();
  this.ctx.translate(-offsetX, -offsetY);
};

CanvasRenderer.prototype.renderBackgroundGradient = function(gradientImage, bounds) {
  var gradient;
  if(gradientImage instanceof LinearGradientContainer) {
    gradient = this.ctx.createLinearGradient(
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0,
      bounds.x + gradientImage.x1,
      bounds.y + gradientImage.y1);
  } else if(gradientImage instanceof RadialGradientContainer) {
    if(typeof gradientImage.scaleX !== 'undefined' || typeof gradientImage.scaleY !== 'undefined') {
      gradientImage.scaleX = gradientImage.scaleX || 1;
      gradientImage.scaleY = gradientImage.scaleY || 1;

      gradient = this.ctx.createRadialGradient(
        (bounds.x + gradientImage.x0) / gradientImage.scaleX,
        (bounds.y + gradientImage.y0) / gradientImage.scaleY,
        gradientImage.r,
        (bounds.x + gradientImage.x0) / gradientImage.scaleX,
        (bounds.y + gradientImage.y0) / gradientImage.scaleY, 0);

      gradientImage.colorStops.forEach(function(colorStop) {
        gradient.addColorStop(colorStop.stop, colorStop.color.toString());
      });

      var currentTransform = this.ctx.currentTransform;
      this.ctx.setTransform(gradientImage.scaleX * this.scale, 0, 0, gradientImage.scaleY * this.scale, 0, 0);
      this.rectangle(bounds.x / gradientImage.scaleX, bounds.y / gradientImage.scaleY, bounds.width, bounds.height, gradient);

      // reset the old transform
      this.ctx.currentTransform = currentTransform;
      return;
    }

    gradient = this.ctx.createRadialGradient(
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0,
      gradientImage.r,
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0, 0);
  }

  gradientImage.colorStops.forEach(function(colorStop) {
    gradient.addColorStop(colorStop.stop, colorStop.color.toString());
  });

  this.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, gradient);
};

CanvasRenderer.prototype.resizeImage = function(imageContainer, size) {
  var image = imageContainer.image;
  if(image.width === size.width && image.height === size.height) {
    return image;
  }

  var ctx, canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width, size.height);
  return canvas;
};

function hasEntries(array) {
  return array.length > 0;
}

module.exports = CanvasRenderer;
