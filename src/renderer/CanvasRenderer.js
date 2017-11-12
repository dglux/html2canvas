const { Map } = require("../polyfill");
const Renderer = require("./Renderer");
const LinearGradientContainer = require("../gradient/LinearGradientContainer");
const RadialGradientContainer = require("../gradient/RadialGradientContainer");
const log = require("../log");

function hasEntries(array) {
  return !!array.length;
}

function identityMatrix() {
  return {
    origin: [0, 0],
    matrix: [1, 0, 0, 1, 0, 0]
  };
}

function isIdentityMatrix(transform) {
  return transform.matrix.join(",") === "1,0,0,1,0,0";
}

class CanvasRenderer extends Renderer {
  /*
  canvas: HTMLCanvasElement;
  scale: num;

  ctx: CanvasRenderingContext2D;
  taintCtx: CanvasRenderingContext2D;

  variables: Map<string, object>;

  transforms: Map<int, object>;
  stackDepth: int;
  */

  constructor(width, height, imageLoader, options) {
    super(width, height, imageLoader, options);

    this.canvas = this.options.canvas || document.createElement("canvas");
    this.scale = devicePixelRatio * (options.scale || 1);

    if (!this.options.canvas) {
      this.canvas.width = width * this.scale;
      this.canvas.style.width = width * (options.scale || 1) + "px";
      this.canvas.height = height * this.scale;
      this.canvas.style.height = height * (options.scale || 1) + "px";
    }

    this.ctx = this.canvas.getContext("2d");
    this.taintCtx = document.createElement("canvas").getContext("2d");

    this.ctx.scale(this.scale, this.scale);
    this.ctx.textBaseline = "bottom";

    this.variables = new Map();

    this.transforms = new Map();
    this.stackDepth = 1;

    log("Initialized CanvasRenderer with size", width, "x", height);
  }

  save() {
    this.ctx.save();
    this.stackDepth++;
  }

  restore(popStack) {
    this.ctx.restore();

    if (!!popStack) {
      this.transforms.delete(this.stackDepth);
      this.stackDepth--;
    }
  }

  setFillStyle(fillStyle) {
    this.ctx.fillStyle =
      typeof fillStyle === "object" && !!fillStyle.isColor
        ? fillStyle.toString()
        : fillStyle;

    return this.ctx;
  }

  rectangle(left, top, width, height, color) {
    this.setFillStyle(color).fillRect(left, top, width, height);
  }

  circle(left, top, size, color) {
    this.setFillStyle(color);

    this.ctx.beginPath();
    this.ctx.arc(
      left + size / 2,
      top + size / 2,
      size / 2,
      0,
      Math.PI * 2,
      true
    );
    this.ctx.closePath();

    this.ctx.fill();
  }

  circleStroke(left, top, size, color, stroke, strokeColor) {
    this.circle(left, top, size, color);
    this.ctx.strokeStyle = strokeColor.toString();
    this.ctx.stroke();
  }

  drawShape(shape, color) {
    this.shape(shape);
    this.setFillStyle(color).fill();
  }

  taints(imageContainer) {
    if (imageContainer.tainted === null) {
      this.taintCtx.drawImage(imageContainer.image, 0, 0);
      try {
        this.taintCtx.getImageData(0, 0, 1, 1);
        imageContainer.tainted = false;
      } catch (e) {
        this.taintCtx = document.createElement("canvas").getContext("2d");
        imageContainer.tainted = true;
      }
    }

    return imageContainer.tainted;
  }

  drawImage(imageContainer, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!this.taints(imageContainer) || this.options.allowTaint) {
      this.ctx.drawImage(imageContainer.image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }

  clip(shapes, callback, context) {
    if (!shapes.length) return;

    this.save();
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

    shapes.filter(hasEntries).forEach(function(shape) {
      if (shape[0] == "transform") {
        this.setTransform(shape[1]);
        return;
      }

      this.shape(shape).clip();
    }, this);

    callback.call(context);
    this.restore(true);
  }

  shape(shape) {
    this.ctx.beginPath();
    shape.forEach(function(point, index) {
      if (point[0] === "rect") {
        this.ctx.rect.apply(this.ctx, point.slice(1));
      } else {
        this.ctx[index === 0 ? "moveTo" : point[0] + "To"].apply(
          this.ctx,
          point.slice(1)
        );
      }
    }, this);
    this.ctx.closePath();
    return this.ctx;
  }

  font(color, style, variant, weight, size, family) {
    variant = /^(normal|small-caps)$/i.test(variant) ? variant : "";
    this.setFillStyle(color).font =
      [style, variant, weight, size].join(" ").split(",")[0] + " " + family;
  }

  setShadow(color, offsetX, offsetY, blur) {
    this.setVariable("shadowColor", color.toString())
      .setVariable("shadowOffsetX", offsetX)
      .setVariable("shadowOffsetY", offsetY)
      .setVariable("shadowBlur", blur);
  }

  clearShadow() {
    this.setVariable("shadowColor", "rgba(0,0,0,0)");
  }

  drawInsetShadow(left, top, width, height) {
    this.ctx.rect(left, top, width, height);
    this.ctx.fill("evenodd");
  }

  setOpacity(opacity) {
    this.ctx.globalAlpha = opacity;
  }

  getTransform() {
    var a = this.stackDepth;
    while (--a > 0) {
      if (this.transforms.has(a)) {
        var transform = this.transforms.get(a);
        if (typeof transform.x1 !== "undefined") continue;
        if (isIdentityMatrix(transform)) continue;
        return transform;
      }
    }

    return identityMatrix();
  }

  setTransform(transform) {
    this.ctx.translate(transform.origin[0], transform.origin[1]);
    this.transforms[this.stackDepth.toString()] = transform;
    this.ctx.transform.apply(this.ctx, transform.matrix);
    this.ctx.translate(-transform.origin[0], -transform.origin[1]);
  }

  setVariable(property, value) {
    if (
      !this.variables.has(property) ||
      this.variables.get(property) !== value
    ) {
      this.variables[property] = this.ctx[property] = value;
    }

    return this;
  }

  text(text, left, bottom) {
    this.ctx.fillText(text, left, bottom);
  }

  backgroundRepeatShape(container, imageContainer, backgroundPosition, size,
      bounds, left, top, width, height,
      borderData, func) {
    const shape = [
      ["line", Math.round(left), Math.round(top)],
      ["line", Math.round(left + width), Math.round(top)],
      ["line", Math.round(left + width), Math.round(height + top)],
      ["line", Math.round(left), Math.round(height + top)]
    ];

    const arr = [];
    if (container.hasTransform()) {
      arr.push(["transform", this.getTransform()]);
    }

    arr.push(shape);

    this.clip(
      arr,
      function() {
        this.renderBackgroundRepeat(
          imageContainer,
          backgroundPosition,
          size,
          bounds,
          borderData[3],
          borderData[0],
          func
        );
      },
      this
    );
  }

  renderBackgroundRepeat(imageContainer, backgroundPosition, size,
      bounds, borderLeft, borderTop, func) {
    var offsetX = Math.round(bounds.x + backgroundPosition.x + borderLeft),
      offsetY = Math.round(bounds.y + backgroundPosition.y + borderTop);

    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(1 / this.scale, 1 / this.scale);
    this.setFillStyle(
      this.ctx.createPattern(
        this.resizeImage(imageContainer, size),
        func || "repeat"
      )
    );
    this.ctx.fill();
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-offsetX, -offsetY);
  }

  renderBackgroundGradient(gradientImage, bounds) {
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
  }

  resizeImage(imageContainer, size) {
    var image = imageContainer.image;

    var ctx, canvas = document.createElement('canvas');
    canvas.width = size.width * this.scale;
    canvas.height = size.height * this.scale;
    ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width * this.scale, size.height * this.scale);
    return canvas;
  }
}

module.exports = CanvasRenderer;
