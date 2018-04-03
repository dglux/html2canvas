const { Map } = require("../polyfill");
const Renderer = require("./Renderer");
const LinearGradientContainer = require("../image/gradient/LinearGradientContainer");
const RadialGradientContainer = require("../image/gradient/RadialGradientContainer");
const log = require("../log");

const Clip = require("../Clip");

const { identityTransform } = require("../parsing/transform");

class CanvasRenderer extends Renderer {
  /*
  canvas: HTMLCanvasElement;
  scale: num;

  ctx: CanvasRenderingContext2D;
  taintCtx: CanvasRenderingContext2D;

  variables: Map<string, object>;

  stackingContexts: Map<int, object>;
  filterScale: num;
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
    this.ctx.globalAlpha = 1;

    this.taintCtx = document.createElement("canvas").getContext("2d");

    this.ctx.scale(this.scale, this.scale);
    this.ctx.textBaseline = "bottom";

    this.variables = new Map();

    this.stackingContexts = new Map();
    this.filterScale = 1 / this.scale;
    this.stackDepth = 1;

    log("Initialized CanvasRenderer with size", width, "x", height);
  }

  save() {
    this.ctx.save();
  }

  restore() {
    this.ctx.restore();
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

  clip(clip, callback, context) {
    this.save();

    const traverse = (clip) => {
      if (clip.parent) {
        if (clip.transform) {
          this.setTransform(clip.transform.inverse());
        }

        traverse(clip.parent);

        if (clip.transform) {
          this.setTransform(clip.transform);
        }
      }

      if (!clip.shapes.length) {
        return;
      }

      clip.shapes.filter(shape => !!shape.length).forEach(shape => {
        /*
        this.ctx.strokeStyle = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")";
        this.shape(shape).stroke();
        */
      
        this.shape(shape).clip();
      });
    };

    traverse(clip);

    callback.call(context);
    this.restore();
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

  drawShadow(shape, shadow) {    
    // on newer Chrome/Firefox versions,
    // this is more accurate
    if (this.ctx.filter) {
      this.ctx.filter = `blur(${Math.round((shadow.blur || 0) * this.filterScale)}px)`;
      this.setFillStyle(shadow.color);
      
      this.shape(shape).fill();

      this.ctx.filter = "none";
      return;
    }

    this.setShadow(shadow.color, 0, 0, shadow.blur);
    this.setFillStyle(shadow.color);
    
    this.shape(shape).fill();

    this.clearShadow();    
  }

  drawInsetShadow(shape, box, shadow) {
    // on newer Chrome/Firefox versions,
    // this is more accurate
    if (this.ctx.filter) {
      this.ctx.filter = `blur(${Math.round((shadow.blur || 0) * this.filterScale)}px)`;
      this.setFillStyle(shadow.color);
      
      this.shape(shape);
      this.ctx.rect(box.x1, box.y1, box.width, box.height);
      this.ctx.fill("evenodd");

      this.ctx.filter = "none";
      return;
    }

    this.setShadow(shadow.color, 0, 0, shadow.blur);
    this.setFillStyle(shadow.color);

    this.shape(shape);
    this.ctx.rect(box.x1, box.y1, box.width, box.height);
    this.ctx.fill("evenodd");

    this.clearShadow();    
  }

  setTransform(transform) {
    this.ctx.translate(transform.origin[0], transform.origin[1]);
    this.ctx.transform.apply(this.ctx, transform.matrix);
    this.ctx.translate(-transform.origin[0], -transform.origin[1]);
  }

  pushStackingContext(transform, opacity) {
    this.save();

    this.stackDepth++;

    this.ctx.globalAlpha *= opacity;

    this.filterScale *= (transform.matrix[0] + transform.matrix[3]) / 2;
    this.stackingContexts.set(this.stackDepth, { transform, opacity });

    this.setTransform(transform);
  }

  popStackingContext() {
    if (this.stackingContexts.has(this.stackDepth)) {
      const { transform, opacity } = this.stackingContexts.get(this.stackDepth);

      this.filterScale /= (transform.matrix[0] + transform.matrix[3]) / 2;
      this.ctx.globalAlpha /= opacity;
    }

    this.stackingContexts.delete(this.stackDepth);
    this.stackDepth--;

    this.restore();
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

  backgroundRepeatShape(
    container,
    imageContainer,
    backgroundPosition,
    size,
    bounds,
    left,
    top,
    width,
    height,
    borderData,
    func
  ) {
    const shape = [
      ["line", Math.round(left), Math.round(top)],
      ["line", Math.round(left + width), Math.round(top)],
      ["line", Math.round(left + width), Math.round(height + top)],
      ["line", Math.round(left), Math.round(height + top)]
    ];
    
    this.clip(new Clip([shape]), () => {
      this.renderBackgroundRepeat(
        imageContainer,
        backgroundPosition,
        size,
        bounds,
        borderData[3],
        borderData[0],
        func
      );
    });
  }

  renderBackgroundRepeat(
    imageContainer,
    backgroundPosition,
    size,
    bounds,
    borderLeft,
    borderTop,
    func
  ) {
    if (imageContainer.image.constructor.name === "Event") {
      log("Accidently tried to render a non-image (event).");
      return;
    }

    const offsetX = Math.round(bounds.x + backgroundPosition.x + borderLeft);
    const offsetY = Math.round(bounds.y + backgroundPosition.y + borderTop);

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

  // issue with background gradients rendering in Chrome 65 (but not 67, or 64, hmm)
  // https://jsfiddle.net/mkbemorL/12/
  renderBackgroundGradient(gradientImage, bounds) {
    let gradient;

    var scaleX = 1;
    let scaleY = 1;

    if (gradientImage instanceof LinearGradientContainer) {
      gradient = this.ctx.createLinearGradient(
        bounds.x + gradientImage.x0,
        bounds.y + gradientImage.y0,
        bounds.x + gradientImage.x1,
        bounds.y + gradientImage.y1
      );
    } else if (gradientImage instanceof RadialGradientContainer) {
      scaleX = gradientImage.scaleX || 1;
      scaleY = gradientImage.scaleY || 1;

      gradient = this.ctx.createRadialGradient(
        (bounds.x + gradientImage.x0) / scaleX,
        (bounds.y + gradientImage.y0) / scaleY,
        gradientImage.r,
        (bounds.x + gradientImage.x0) / scaleX,
        (bounds.y + gradientImage.y0) / scaleY,
        0
      );
    }

    gradientImage.colorStops.forEach(colorStop => {
      gradient.addColorStop(colorStop.stop, colorStop.color.toString());
    });

    this.ctx.save();

    this.ctx.setTransform(
      scaleX * this.scale,
      0,
      0,
      scaleY * this.scale,
      0,
      0
    );

    this.rectangle(bounds.x / scaleX, bounds.y / scaleY, bounds.width, bounds.height, gradient);

    this.ctx.restore();
  }

  resizeImage(imageContainer, size) {
    var image = imageContainer.image;

    const canvas = document.createElement("canvas");
    canvas.width = size.width * this.scale;
    canvas.height = size.height * this.scale;
    
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      0,
      0,
      size.width * this.scale,
      size.height * this.scale
    );

    return canvas;
  }
}

module.exports = CanvasRenderer;
