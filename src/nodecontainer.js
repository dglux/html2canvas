const Color = require("./color");
const BoundingBox = require("./BoundingBox");

const { Clip } = require("./bounds");
const { getBounds, parseBackgrounds, offsetBounds } = require("./utils");

const { parseTransform, parseTransformMatrix } = require("./parsing/transform");
const { parseBoxShadows } = require("./parsing/boxShadow");

function NodeContainer(node, parent) {
  this.node = node;
  this.parent = parent;
  this.stack = null;
  this.bounds = null;
  this.borders = null;
  this.clip = new Clip();
  this.backgroundClip = new Clip();
  this.offsetBounds = null;
  this.visible = null;
  this.computedStyles = null;
  this.colors = {};
  this.styles = {};
  this.backgroundImages = null;
  this.transformData = null;
  this.isPseudoElement = false;
  this.opacity = null;
}

NodeContainer.prototype.cloneTo = function(stack) {
  stack.visible = this.visible;
  stack.borders = this.borders;
  stack.drawnBounds = this.drawnBounds;
  stack.bounds = this.bounds;
  stack.clip = this.clip;
  stack.backgroundClip = this.backgroundClip;
  stack.computedStyles = this.computedStyles;
  stack.styles = this.styles;
  stack.backgroundImages = this.backgroundImages;
  stack.opacity = this.opacity;
};

NodeContainer.prototype.getOpacity = function() {
  return this.opacity === null ? (this.opacity = this.cssFloat('opacity')) : this.opacity;
};

NodeContainer.prototype.assignStack = function(stack) {
  this.stack = stack;
  stack.children.push(this);
};

NodeContainer.prototype.isElementVisible = function() {
  return this.node.nodeType === Node.TEXT_NODE ? this.parent.visible : (
  this.css('display') !== "none" &&
  this.css('visibility') !== "hidden" && !this.node.hasAttribute("data-html2canvas-ignore") &&
  (this.node.nodeName !== "INPUT" || this.node.getAttribute("type") !== "hidden")
  );
};

NodeContainer.prototype.css = function(attribute) {
  if(!this.computedStyles) {
    this.computedStyles = this.isPseudoElement ? this.parent.computedStyle(this.before ? ":before" : ":after") : this.computedStyle(null);
  }

  return this.styles[attribute] || (this.styles[attribute] = this.computedStyles[attribute]);
};

NodeContainer.prototype.prefixedCss = function(attribute) {
  var prefixes = ["webkit", "moz", "ms", "o"];
  var value = this.css(attribute);

  if(value === undefined) {
    const attributeTitleCase = attribute.substr(0, 1).toUpperCase() + attribute.substr(1);
    prefixes.some(prefix => {
      value = this.css(prefix + attributeTitleCase);
      return value !== undefined;
    });
  }

  return value === undefined ? null : value;
};

NodeContainer.prototype.computedStyle = function(type) {
  return this.node.ownerDocument.defaultView.getComputedStyle(this.node, type);
};

NodeContainer.prototype.cssInt = function(attribute) {
  var value = parseInt(this.css(attribute), 10);
  return (isNaN(value)) ? 0 : value; // borders in old IE are throwing 'medium' for demo.html
};

NodeContainer.prototype.color = function(attribute) {
  return this.colors[attribute] || (this.colors[attribute] = new Color(this.css(attribute)));
};

NodeContainer.prototype.cssFloat = function(attribute) {
  var value = parseFloat(this.css(attribute));
  return (isNaN(value)) ? 0 : value;
};

NodeContainer.prototype.fontWeight = function() {
  var weight = this.css("fontWeight");
  switch(parseInt(weight, 10)) {
    case 401:
      weight = "bold";
      break;
    case 400:
      weight = "normal";
      break;
  }
  return weight;
};

NodeContainer.prototype.parseClip = function() {
  var matches = this.css('clip').match(this.CLIP);
  if(matches) {
    return new BoundingBox(
      parseInt(matches[4], 10),
      parseInt(matches[1], 10),
      parseInt(matches[2], 10),
      parseInt(matches[3], 10)
    );
  }
  return null;
};

NodeContainer.prototype.parseBackgroundImages = function() {
  return this.backgroundImages || (this.backgroundImages = parseBackgrounds(this.css("backgroundImage")));
};

NodeContainer.prototype.cssList = function(property, index) {
  var value = (this.css(property) || '').split(',');
  value = value[index || 0] || value[0] || 'auto';
  value = value.trim().split(' ');
  if(value.length === 1) {
    value = [value[0], isPercentage(value[0]) ? 'auto' : value[0]];
  }
  return value;
};

NodeContainer.prototype.parseBackgroundSize = function(bounds, image, index) {
  var size = this.cssList("backgroundSize", index);
  var width, height;

  if(size[0] === 'auto' && size[1] === 'auto') {
    return { width: image.width, height: image.height };
  }

  if (/contain|cover/.test(size[0])) {
    var targetRatio = bounds.width / bounds.height;
    var currentRatio = image.width / image.height;

    return (targetRatio < currentRatio) !== (size[0] === "cover") ?
      {
        width: bounds.width,
        height: bounds.width / currentRatio
      } :
      {
        width: bounds.height * currentRatio,
        height: bounds.height
      };
  }
  
  if(isPercentage(size[0])) {
    width = bounds.width * parseFloat(size[0]) / 100;
  } else {
    width = parseInt(size[0], 10);
  }

  if (size[1] === 'auto') {
    height = width / image.width * image.height;
  } else if(isPercentage(size[1])) {
    height = bounds.height * parseFloat(size[1]) / 100;
  } else {
    height = parseInt(size[1], 10);
  }

  if(size[0] === 'auto') {
    width = height / image.height * image.width;
  }

  return { width, height };
};

NodeContainer.prototype.parseBackgroundPosition = function(bounds, image, index, backgroundSize) {
  var position = this.cssList('backgroundPosition', index);
  var left, top;

  if(isPercentage(position[0])) {
    left = (bounds.width - (backgroundSize || image).width) * (parseFloat(position[0]) / 100);
  } else {
    left = parseInt(position[0], 10);
  }

  if(position[1] === 'auto') {
    top = left / image.width * image.height;
  } else if(isPercentage(position[1])) {
    top = (bounds.height - (backgroundSize || image).height) * parseFloat(position[1]) / 100;
  } else {
    top = parseInt(position[1], 10);
  }

  if(position[0] === 'auto') {
    left = top / image.height * image.width;
  }

  return new BoundingBox(left, top);
};

NodeContainer.prototype.parseBackgroundRepeat = function(index) {
  return this.cssList("backgroundRepeat", index)[0];
};

NodeContainer.prototype.SHADOW_PROPERTY = /(?!\([0-9\s.]+),(?![0-9\s.,]+\))/g;

NodeContainer.prototype.TEXT_SHADOW_VALUES = /(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;

NodeContainer.prototype.parseBoxShadows = function() {
  return this.boxShadows || (this.boxShadows = parseBoxShadows(this));
};

NodeContainer.prototype.parseTextShadows = function() {
  var textShadow = this.css("textShadow");
  var results = [];

  if(textShadow && textShadow !== 'none') {
    var shadows = textShadow.split(this.SHADOW_PROPERTY);
    for(var i = 0; shadows && (i < shadows.length); i++) {
      var s = shadows[i].match(this.TEXT_SHADOW_VALUES);

      var ci = s[0].indexOf('rgb') > -1 ? 0 : 3;
      var color = new Color(s[ci]);

      results.push({
        color: color,
        offsetX: s[(ci + 1) % 4] ? parseFloat(s[(ci + 1) % 4].replace('px', '')) : 0,
        offsetY: s[(ci + 2) % 4] ? parseFloat(s[(ci + 2) % 4].replace('px', '')) : 0,
        blur: s[(ci + 3) % 4] ? s[(ci + 3) % 4].replace('px', '') : 0
      });
    }
  }
  return results;
};

NodeContainer.prototype.parseTransform = function() {
  if(!this.transformData) {
    this.transformData = parseTransform(this);
    this.transformData.add(this.parseBounds());
  }

  return this.transformData;
};

NodeContainer.prototype.hasTransform = function() {
  if (!this.transformData) {
    this.parseTransform();
  }

  return !this.transformData.isIdentity() || (this.parent && this.parent.hasTransform());
};

NodeContainer.prototype.parseBounds = function() {
  return this.bounds || (this.bounds = this.hasTransform() ? offsetBounds(this.node) : getBounds(this.node));
};

NodeContainer.prototype.getValue = function() {
  var value = this.node.value || "";
  if(this.node.tagName === "SELECT") {
    value = selectionValue(this.node);
  } else if(this.node.type === "password") {
    value = Array(value.length + 1).join('\u2022'); // jshint ignore:line
  }
  return value.length === 0 ? (this.node.placeholder || "") : value;
};

NodeContainer.prototype.CLIP = /^rect\((\d+)px,? (\d+)px,? (\d+)px,? (\d+)px\)$/;

function selectionValue(node) {
  var option = node.options[node.selectedIndex || 0];
  return option ? (option.text || "") : "";
}

function isPercentage(value) {
  return value.toString().indexOf("%") !== -1;
}

module.exports = NodeContainer;
