var log = require('./log');
var punycode = require('punycode');
var BoundingBox = require('./BoundingBox');
var NodeContainer = require('./nodecontainer');
var TextContainer = require('./textcontainer');
var PseudoElementContainer = require('./pseudoelementcontainer');
var FontMetrics = require('./fontmetrics');
var Color = require('./color');
var { Promise } = require("./polyfill");
var StackingContext = require('./StackingContext');
var utils = require('./utils');
var bind = utils.bind;
var getBounds = utils.getBounds;
var parseBackgrounds = utils.parseBackgrounds;

const Clip = require("./Clip");

function NodeParser(element, renderer, support, imageLoader, options) {
  log("Starting NodeParser");
  this.renderer = renderer;
  this.options = options;
  this.range = null;
  this.support = support;
  this.renderQueue = [];
  this.stack = new StackingContext(true, 1, element.ownerDocument, null);
  var parent = new NodeContainer(element, null);
  if(options.background) {
    renderer.rectangle(0, 0, renderer.width, renderer.height, new Color(options.background));
  }
  if(element === element.ownerDocument.documentElement) {
    // http://www.w3.org/TR/css3-background/#special-backgrounds
    var canvasBackground = new NodeContainer(parent.color('backgroundColor').isTransparent() ? element.ownerDocument.body : element.ownerDocument.documentElement, null);
    renderer.rectangle(0, 0, renderer.width, renderer.height, canvasBackground.color('backgroundColor'));
  }

  parent.visibile = parent.isElementVisible();
  this.createPseudoHideStyles(element.ownerDocument);
  this.disableAnimations(element.ownerDocument);
  this.nodes = flatten([parent].concat(this.getChildren(parent)).filter(function(container) {
    return container.visible = container.isElementVisible();
  }).map(this.getPseudoElements, this));

  this.fontMetrics = new FontMetrics();
  log("Fetched nodes, total:", this.nodes.length);

  log("Calculate overflow clips");
  this.calculateOverflowClips();

  log("Start fetching images");
  this.images = imageLoader.fetch(this.nodes.filter(isElement));
  this.ready = this.images.ready.then(bind(function() {
    log("Images loaded, starting parsing");
    log("Creating stacking contexts");
    this.createStackingContexts();
    log("Sorting stacking contexts");
    this.sortStackingContexts(this.stack);
    this.parse(this.stack);
    log("Render queue created with " + this.renderQueue.length + " items");
    return new Promise(bind(function(resolve) {
      if(!options.async) {
        this.renderQueue.forEach(this.paint, this);
        resolve();
      } else if(typeof(options.async) === "function") {
        options.async.call(this, this.renderQueue, resolve);
      } else if(this.renderQueue.length > 0) {
        this.renderIndex = 0;
        this.asyncRenderer(this.renderQueue, resolve);
      } else {
        resolve();
      }
    }, this));
  }, this));
}

NodeParser.prototype.calculateOverflowClips = function() {
  this.nodes.forEach(function(container) {
    if(isElement(container)) {
      if(isPseudoElement(container)) {
        container.appendToDOM();
      }
      
      container.borders = this.parseBorders(container);

      if (this.options.drawBounds) {
        container.drawnBounds = this.parseDrawnBounds(container);
      }

      var hasOverflowClip = container.css('overflow') !== "visible";

      const clip = new Clip([], container.hasTransform() ? container.parseTransform() : null);

      if (hasOverflowClip) {
        clip.addShape(container.borders.clip);
      }

      const cssClip = container.parseClip();
      if(cssClip && ["absolute", "fixed"].indexOf(container.css("position")) !== -1) {
        clip.addShape([["rect",
          container.bounds.x + cssClip.x,
          container.bounds.y + cssClip.y,
          cssClip.x2 - cssClip.x,
          cssClip.y2 - cssClip.y
        ]]);
      }

      if (hasParentClip(container)) {
        clip.parent = container.parent.clip;
      }

      container.clip = clip;
      container.backgroundClip = !hasOverflowClip ?
          container.clip.clone().addShape(container.borders.clip) :
          container.clip;
      
      if(isPseudoElement(container)) {
        container.cleanDOM();
      }
    } else if (isTextNode(container)) {
      container.clip = hasParentClip(container) ? container.parent.clip : new Clip();
    }
    if(!isPseudoElement(container)) {
      container.bounds = null;
    }
  }, this);
};

function hasParentClip(container) {
  return container.parent && container.parent.clip;
}

NodeParser.prototype.asyncRenderer = function(queue, resolve, asyncTimer) {
  asyncTimer = asyncTimer || Date.now();
  this.paint(queue[this.renderIndex++]);

  if(queue.length === this.renderIndex) {
    resolve();
  } else if(asyncTimer + 20 > Date.now()) {
    this.asyncRenderer(queue, resolve, asyncTimer);
  } else {
    window.requestAnimationFrame(_ => {
      this.asyncRenderer(queue, resolve);
    });
  }
};

NodeParser.prototype.createPseudoHideStyles = function(document) {
  this.createStyles(document, '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + ':before { content: "" !important; display: none !important; }' +
  '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER + ':after { content: "" !important; display: none !important; }');
};

NodeParser.prototype.disableAnimations = function(document) {
  this.createStyles(document, '* { -webkit-animation: none !important; -moz-animation: none !important; -o-animation: none !important; animation: none !important; ' +
  '-webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; transition: none !important;}');
};

NodeParser.prototype.createStyles = function(document, styles) {
  var hidePseudoElements = document.createElement('style');
  hidePseudoElements.innerHTML = styles;
  document.body.appendChild(hidePseudoElements);
};

NodeParser.prototype.getPseudoElements = function(container) {
  var nodes = [[container]];
  if(container.node.nodeType === Node.ELEMENT_NODE) {
    var before = this.getPseudoElement(container, ":before");
    var after = this.getPseudoElement(container, ":after");

    if(before) {
      nodes.push(before);
    }

    if(after) {
      nodes.push(after);
    }
  }
  return flatten(nodes);
};

function toCamelCase(str) {
  return str.replace(/(\-[a-z])/g, function(match) {
    return match.toUpperCase().replace('-', '');
  });
}

NodeParser.prototype.getPseudoElement = function(container, type) {
  var style = container.computedStyle(type);
  if(!style || !style.content || style.content === "none" || style.content === "-moz-alt-content" || style.display === "none") {
    return null;
  }

  var content = stripQuotes(style.content);
  var isImage = content.substr(0, 3) === 'url';
  var pseudoNode = document.createElement(isImage ? 'img' : 'html2canvaspseudoelement');
  var pseudoContainer = new PseudoElementContainer(pseudoNode, container, type);

  for(var i = style.length - 1; i >= 0; i--) {
    var property = toCamelCase(style.item(i));
    pseudoNode.style[property] = style[property];
  }

  pseudoNode.className = PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + " " + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER;

  if(isImage) {
    pseudoNode.src = parseBackgrounds(content)[0].args[0];
    return [pseudoContainer];
  } else {
    var text = document.createTextNode(content);
    pseudoNode.appendChild(text);
    return [pseudoContainer, new TextContainer(text, pseudoContainer)];
  }
};


NodeParser.prototype.getChildren = function(parentContainer) {
  return flatten([].filter.call(parentContainer.node.childNodes, renderableNode).map(function(node) {
    var container = [node.nodeType === Node.TEXT_NODE ? new TextContainer(node, parentContainer) : new NodeContainer(node, parentContainer)].filter(nonIgnoredElement);
    return node.nodeType === Node.ELEMENT_NODE && container.length && node.tagName !== "TEXTAREA" && node.tagName !== "svg" ? (container[0].isElementVisible() ? container.concat(this.getChildren(container[0])) : []) : container;
  }, this));
};

NodeParser.prototype.newStackingContext = function(container, hasOwnStacking) {
  var stack = new StackingContext(hasOwnStacking, container.getOpacity(), container.node, container.parent);
  container.cloneTo(stack);
  var parentStack = hasOwnStacking ? stack.getParentStack(this) : stack.parent.stack;
  parentStack.contexts.push(stack);
  container.stack = stack;
};

NodeParser.prototype.createStackingContexts = function() {
  this.nodes.forEach(function(container) {
    if(isElement(container) && (this.isRootElement(container) || hasOpacity(container) || isPositionedForStacking(container) || this.isBodyWithTransparentRoot(container) || container.hasTransform())) {
      this.newStackingContext(container, true);
    } else if(isElement(container) && ((isPositioned(container) && zIndex0(container)) || isInlineBlock(container) || isFloating(container))) {
      this.newStackingContext(container, false);
    } else {
      container.assignStack(container.parent.stack);
    }
  }, this);
};

NodeParser.prototype.isBodyWithTransparentRoot = function(container) {
  return container.node.nodeName === "BODY" && container.parent.color('backgroundColor').isTransparent();
};

NodeParser.prototype.isRootElement = function(container) {
  return container.parent === null;
};

NodeParser.prototype.sortStackingContexts = function(stack) {
  stack.contexts.sort(zIndexSort(stack.contexts.slice(0)));
  stack.contexts.forEach(this.sortStackingContexts, this);
};

NodeParser.prototype.parseTextBounds = function(container) {
  return function(text, index, textList) {
    if(container.parent.css("textDecoration").substr(0, 4) !== "none" || text.trim().length !== 0) {
      if(this.support.rangeBounds && !container.parent.hasTransform()) {
        var offset = textList.slice(0, index).join("").length;
        return this.getRangeBounds(container.node, offset, text.length);
      } else if(container.node && typeof(container.node.data) === "string") {
        var replacementNode = container.node.splitText(text.length);
        var bounds = utils.wrapperBounds(container.node, container.parent.hasTransform());
        container.node = replacementNode;
        return bounds;
      }
    } else if(!this.support.rangeBounds || container.parent.hasTransform()) {
      container.node = container.node.splitText(text.length);
    }
    return new BoundingBox();
  };
};

NodeParser.prototype.getRangeBounds = function(node, offset, length) {
  var range = this.range || (this.range = node.ownerDocument.createRange());
  range.setStart(node, offset);
  range.setEnd(node, offset + length);
  var rect = range.getBoundingClientRect();
  return new BoundingBox(rect.left, rect.top, rect.right, rect.bottom);
};

NodeParser.FLAGS = {
  POP_STACKING_CONTEXT: "POP_STACKING_CONTEXT"
};

NodeParser.prototype.parse = function(stack) {
  // http://www.w3.org/TR/CSS21/visuren.html#z-index
  var negativeZindex = stack.contexts.filter(negativeZIndex); // 2. the child stacking contexts with negative stack levels (most negative first).
  var descendantElements = stack.children.filter(isElement);
  var descendantNonFloats = descendantElements.filter(not(isFloating));
  var nonInlineNonPositionedDescendants = descendantNonFloats.filter(not(isPositioned)).filter(not(inlineLevel)); // 3 the in-flow, non-inline-level, non-positioned descendants.
  var nonPositionedFloats = descendantElements.filter(not(isPositioned)).filter(isFloating); // 4. the non-positioned floats.
  var inFlow = descendantNonFloats.filter(not(isPositioned)).filter(inlineLevel); // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
  var stackLevel0 = stack.contexts.concat(descendantNonFloats.filter(isPositioned)).filter(zIndex0); // 6. the child stacking contexts with stack level 0 and the positioned descendants with stack level 0.
  var text = stack.children.filter(isTextNode).filter(hasText);
  var positiveZindex = stack.contexts.filter(positiveZIndex); // 7. the child stacking contexts with positive stack levels (least positive first).
  negativeZindex.concat(nonInlineNonPositionedDescendants).concat(nonPositionedFloats)
    .concat(inFlow).concat(stackLevel0).concat(text).concat(positiveZindex).forEach(function(container) {
      this.renderQueue.push(container);
      if(isStackingContext(container)) {
        this.parse(container);
        this.renderQueue.push(NodeParser.FLAGS.POP_STACKING_CONTEXT);
      }
    }, this);
};

NodeParser.prototype.paint = function(container) {
  try {
    if (container === NodeParser.FLAGS.POP_STACKING_CONTEXT) {
      this.renderer.popStackingContext();
    } else if (isTextNode(container)) {
      if (isPseudoElement(container.parent)) {
        container.parent.appendToDOM();
      }
      this.paintText(container);
      if (isPseudoElement(container.parent)) {
        container.parent.cleanDOM();
      }
    } else {
      this.paintNode(container);
    }
  } catch (e) {
    log(e);
    if (this.options.strict) {
      throw e;
    }
  }
};

NodeParser.prototype.paintNode = function(container) {
  if(isStackingContext(container)) {
    this.renderer.pushStackingContext(container.parseTransform(), container.opacity);
  }

  if (container.node.nodeName === "INPUT" && container.node.type === "checkbox") {
    this.paintCheckbox(container);
  } else if (container.node.nodeName === "INPUT" && container.node.type === "radio") {
    this.paintRadio(container);
  } else {
    this.paintElement(container);
  }
};

NodeParser.prototype.paintElement = function(container) {
  const bounds = container.parseBounds();
  
  const shadows = container.parseBoxShadows();
  const shadowsInset = [];

  if(shadows.length > 0) {
    shadows.forEach(shadow => {
      if(shadow.inset) {
        shadowsInset.push(shadow);
        return;
      }

      const newBounds = bounds.clone();

      newBounds.inflate(shadow.spread);

      newBounds.x1 += shadow.offsetX;
      newBounds.x2 += shadow.offsetX;
      
      newBounds.y1 += shadow.offsetY;
      newBounds.y2 += shadow.offsetY;

      const radius = getBorderRadiusData(container, container.borders.borders, newBounds);
      const borderPoints = calculateCurvePoints(newBounds, radius, container.borders.borders);
      const clipShape = this.parseBackgroundClip(container, borderPoints, container.borders.borders, radius, newBounds);
      
      this.renderer.drawShadow(clipShape, shadow);
    });
  }

  this.renderer.clip(container.backgroundClip, () => {
    this.renderer.renderBackground(container, bounds, container.borders.borders.map(getWidth));
  });

  this.renderer.clip(container.backgroundClip, () => {
    if(shadowsInset.length > 0) {
      // draw inset shadows
      shadowsInset.forEach(shadow => {
        const newBounds = bounds.clone();

        newBounds.inflate(-shadow.spread);

        newBounds.x1 += shadow.offsetX;
        newBounds.x2 += shadow.offsetX;
        
        newBounds.y1 += shadow.offsetY;
        newBounds.y2 += shadow.offsetY;

        const radius = getBorderRadiusData(container, container.borders.borders, newBounds);
        const borderPoints = calculateCurvePoints(newBounds, radius, container.borders.borders);
        const clipShape = this.parseBackgroundClip(container, borderPoints, container.borders.borders, radius, newBounds);

        this.renderer.drawInsetShadow(clipShape, newBounds.clone().multScalar(3), shadow);
      });
    }
  });

  this.renderer.clip(container.clip, function() {
    this.renderer.renderBorders(container.borders.borders);

    if (this.options.drawBounds) {
      this.renderer.renderBorders(container.drawnBounds.borders);
    }
  }, this);

  
  let imgContainer;
  if (container.node.nodeName === 'svg' && (imgContainer = this.images.get(container.node))) {
    this.renderer.clip(container.clip, () => {
      this.renderer.renderImage(container, imgContainer.getBounds(bounds), container.borders, imgContainer);
    });
  }

  this.renderer.clip(container.backgroundClip, function() {
    switch(container.node.nodeName) {
      case "IFRAME":
        var imgContainer = this.images.get(container.node);
        if(imgContainer) {
          this.renderer.renderImage(container, bounds, container.borders, imgContainer);
        } else {
          log("Error loading <" + container.node.nodeName + ">", container.node);
        }
        break;
      case "IMG":
        var imageContainer = this.images.get(container.node.src);
        if(imageContainer) {
          this.renderer.renderImage(container, bounds, container.borders, imageContainer);
        } else {
          log("Error loading <img>", container.node.src);
        }
        break;
      case "CANVAS":
        this.renderer.renderImage(container, bounds, container.borders, {image: container.node});
        break;
      case "SELECT":
      case "INPUT":
      case "TEXTAREA":
        this.paintFormValue(container);
        break;
    }
  }, this);
};

NodeParser.prototype.paintCheckbox = function(container) {
  var b = container.parseBounds();

  var size = Math.min(b.width, b.height);
  var bounds = {width: size - 1, height: size - 1, top: b.y, left: b.x};
  var r = [3, 3];
  var radius = [r, r, r, r];
  var borders = [1, 1, 1, 1].map(function(w) {
    return {color: new Color('#A5A5A5'), width: w};
  });

  var borderPoints = calculateCurvePoints(bounds, radius, borders);

  this.renderer.clip(container.backgroundClip, function() {
    this.renderer.rectangle(bounds.x + 1, bounds.y + 1, bounds.width - 2, bounds.height - 2, new Color("#DEDEDE"));
    this.renderer.renderBorders(calculateBorders(borders, bounds, borderPoints, radius));
    if(container.node.checked) {
      this.renderer.font(new Color('#424242'), 'normal', 'normal', 'bold', (size - 3) + "px", 'arial');
      this.renderer.text("\u2714", bounds.x + size / 6, bounds.y + size - 1);
    }
  }, this);
};

NodeParser.prototype.paintRadio = function(container) {
  var bounds = container.parseBounds();

  var size = Math.min(bounds.width, bounds.height) - 2;

  this.renderer.clip(container.backgroundClip, function() {
    this.renderer.circleStroke(bounds.x + 1, bounds.y + 1, size, new Color('#DEDEDE'), 1, new Color('#A5A5A5'));
    if(container.node.checked) {
      this.renderer.circle(Math.ceil(bounds.x + size / 4) + 1, Math.ceil(bounds.y + size / 4) + 1, Math.floor(size / 2), new Color('#424242'));
    }
  }, this);
};

NodeParser.prototype.paintFormValue = function(container) {
  var value = container.getValue();
  if(value.length > 0) {
    var document = container.node.ownerDocument;
    var wrapper = document.createElement('html2canvaswrapper');
    var properties = ['lineHeight', 'textAlign', 'fontFamily', 'fontWeight', 'fontSize', 'color',
      'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
      'width', 'height', 'borderLeftStyle', 'borderTopStyle', 'borderLeftWidth', 'borderTopWidth',
      'boxSizing', 'whiteSpace', 'wordWrap'];

    properties.forEach(function(property) {
      try {
        wrapper.style[property] = container.css(property);
      } catch(e) {
        // Older IE has issues with "border"
        log("html2canvas: Parse: Exception caught in renderFormValue: " + e.message);
      }
    });
    var bounds = container.parseBounds();
    wrapper.style.position = "fixed";
    wrapper.style.x = bounds.x + "px";
    wrapper.style.y = bounds.y + "px";
    wrapper.textContent = value;
    document.body.appendChild(wrapper);
    this.paintText(new TextContainer(wrapper.firstChild, container));
    document.body.removeChild(wrapper);
  }
};

NodeParser.prototype.paintText = function(container) {
  container.applyTextTransform();

  var characters = punycode.ucs2.decode(container.node.data);
  // character-by-character positioning if word-wrap: break-word
  var textListTest = container.parent.css('wordWrap') !== 'break-word' &&
    noLetterSpacing(container) &&
    !hasUnicode(container.node.data);

  var textList = textListTest ? getWords(characters) : characters.map(function(character) {
    return punycode.ucs2.encode([character]);
  });

  if (!textListTest) {
    container.parent.node.style.fontVariantLigatures = 'none';
  }

  var weight = container.parent.fontWeight();
  var size = container.parent.css('fontSize');
  var family = container.parent.css('fontFamily');
  var shadows = container.parent.parseTextShadows();

  this.renderer.font(container.parent.color('color'), container.parent.css('fontStyle'), container.parent.css('fontVariant'), weight, size, family);
  if(shadows.length) {
    // TODO: support multiple text shadows
    this.renderer.setShadow(shadows[0].color, shadows[0].offsetX, shadows[0].offsetY, shadows[0].blur);
  } else {
    this.renderer.clearShadow();
  }

  this.renderer.clip(container.parent.clip, function() {
    textList.map(this.parseTextBounds(container), this).forEach(function(bounds, index) {
      if(bounds) {
        this.renderer.text(textList[index], bounds.x, bounds.y2);
        this.renderTextDecoration(container.parent, bounds, this.fontMetrics.getMetrics(family, size));
      }
    }, this);
  }, this);
};

NodeParser.prototype.renderTextDecoration = function(container, bounds, metrics) {
  switch(container.css("textDecoration").split(" ")[0]) {
    case "underline":
      // Draws a line at the baseline of the font
      // TODO As some browsers display the line as more than 1px if the font-size is big, need to take that into account both in position and size
      this.renderer.rectangle(bounds.x, Math.round(bounds.y + metrics.baseline + metrics.lineWidth), bounds.width, 1, container.color("color"));
      break;
    case "overline":
      this.renderer.rectangle(bounds.x, Math.round(bounds.y), bounds.width, 1, container.color("color"));
      break;
    case "line-through":
      // TODO try and find exact position for line-through
      this.renderer.rectangle(bounds.x, Math.ceil(bounds.y + metrics.middle + metrics.lineWidth), bounds.width, 1, container.color("color"));
      break;
  }
};

const INSET_BORDER_VALUES = [0.60, 0.10, 0.10, 0.60];

NodeParser.prototype.parseBorders = function(container) {
  const nodeBounds = container.parseBounds();
  const borders = ["Top", "Right", "Bottom", "Left"].map((side, index) => {    
    const style = container.css(`border${side}Style`);
    const width = container.cssInt(`border${side}Width`);

    let color = container.color(`border${side}Color`);

    if (style === "inset") {
      // this is wrong, but...
      if (color.isBlack()) {
        color = new Color([255,255,255,color.a]);
      }

      color = color.darken(INSET_BORDER_VALUES[index]);
    }

    return {
      width,
      color,
      args: null
    };
  });

  const radius = getBorderRadiusData(container, borders);
  const borderPoints = calculateCurvePoints(nodeBounds, radius, borders);

  return {
    clip: this.parseBackgroundClip(container, borderPoints, borders, radius, nodeBounds),
    borders: calculateBorders(borders, nodeBounds, borderPoints, radius)
  };
};

NodeParser.prototype.parseDrawnBounds = function(container) {
  const nodeBounds = container.parseBounds();
  const color = new Color([
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    1
  ]);

  const borders = ["Top", "Right", "Bottom", "Left"].map(side => {
    return {
      width: 2,
      color,
      args: null
    };
  });

  const radius = getBorderRadiusData(container, borders);
  const borderPoints = calculateCurvePoints(nodeBounds, radius, borders);

  return {
    borders: calculateBorders(borders, nodeBounds, borderPoints, radius)
  };
};

function calculateBorders(borders, nodeBounds, borderPoints, radius) {
  return borders.map(function(border, borderSide) {
    if(border.width > 0) {
      var bx = nodeBounds.x;
      var by = nodeBounds.y;
      var bw = nodeBounds.width;
      var bh = nodeBounds.height - (borders[2].width);

      switch(borderSide) {
        case 0:
          // top border
          bh = borders[0].width;
          border.args = drawSide({
              c1: [bx, by],
              c2: [bx + bw, by],
              c3: [bx + bw - borders[1].width, by + bh],
              c4: [bx + borders[3].width, by + bh]
            }, radius[0], radius[1],
            borderPoints.topLeftOuter, borderPoints.topLeftInner, borderPoints.topRightOuter, borderPoints.topRightInner);
          break;
        case 1:
          // right border
          bx = nodeBounds.x + nodeBounds.width - (borders[1].width);
          bw = borders[1].width;

          border.args = drawSide({
              c1: [bx + bw, by],
              c2: [bx + bw, by + bh + borders[2].width],
              c3: [bx, by + bh],
              c4: [bx, by + borders[0].width]
            }, radius[1], radius[2],
            borderPoints.topRightOuter, borderPoints.topRightInner, borderPoints.bottomRightOuter, borderPoints.bottomRightInner);
          break;
        case 2:
          // bottom border
          by = (by + nodeBounds.height) - (borders[2].width);
          bh = borders[2].width;
          border.args = drawSide({
              c1: [bx + bw, by + bh],
              c2: [bx, by + bh],
              c3: [bx + borders[3].width, by],
              c4: [bx + bw - borders[3].width, by]
            }, radius[2], radius[3],
            borderPoints.bottomRightOuter, borderPoints.bottomRightInner, borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner);
          break;
        case 3:
          // left border
          bw = borders[3].width;
          border.args = drawSide({
              c1: [bx, by + bh + borders[2].width],
              c2: [bx, by],
              c3: [bx + bw, by + borders[0].width],
              c4: [bx + bw, by + bh]
            }, radius[3], radius[0],
            borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner, borderPoints.topLeftOuter, borderPoints.topLeftInner);
          break;
      }
    }
    return border;
  });
}


NodeParser.prototype.parseBackgroundClip = function(container, borderPoints, borders, radius, bounds) {
  var backgroundClip = container.css('backgroundClip'),
    borderArgs = [];

    switch(backgroundClip) {
      case "content-box":
      case "padding-box":
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftInner, borderPoints.topRightInner, bounds.x + borders[3].width, bounds.y + borders[0].width);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightInner, borderPoints.bottomRightInner, bounds.x + bounds.width - borders[1].width, bounds.y + borders[0].width);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightInner, borderPoints.bottomLeftInner, bounds.x + bounds.width - borders[1].width, bounds.y + bounds.height - borders[2].width);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftInner, borderPoints.topLeftInner, bounds.x + borders[3].width, bounds.y + bounds.height - borders[2].width);
        break;
      default:
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftOuter, borderPoints.topRightOuter, bounds.x, bounds.y);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightOuter, borderPoints.bottomRightOuter, bounds.x + bounds.width, bounds.y);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightOuter, borderPoints.bottomLeftOuter, bounds.x + bounds.width, bounds.y + bounds.height);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftOuter, borderPoints.topLeftOuter, bounds.x, bounds.y + bounds.height);
        break;
    }

  return borderArgs;
};

const KAPPA = 4 * (Math.sqrt(2) - 1) / 3;

function getCurvePoints(x, y, r1, r2) {
  const ox = (r1) * KAPPA; // control point offset horizontal
  const oy = (r2) * KAPPA; // control point offset vertical
  const xm = x + r1; // x-middle
  const ym = y + r2; // y-middle

  return {
    topLeft() {
      return bezierCurve({x: x, y: ym}, {x: x, y: ym - oy}, {x: xm - ox, y: y}, {x: xm, y: y});
    },
    topRight() {
      return bezierCurve({x: x, y: y}, {x: x + ox, y: y}, {x: xm, y: ym - oy}, {x: xm, y: ym});
    },
    bottomRight() {
      return bezierCurve({x: xm, y: y}, {x: xm, y: y + oy}, {x: x + ox, y: ym}, {x: x, y: ym});
    },
    bottomLeft() {
      return bezierCurve({x: xm, y: ym}, {x: xm - ox, y: ym}, {x: x, y: y + oy}, {x: x, y: y});
    }
  };
}

function calculateCurvePoints(bounds, borderRadius, borders) {
  const { x, y, width, height } = bounds;

  const [[tlh, tlv], [trh, trv], [brh, brv], [blh, blv]] = borderRadius;

  const topWidth = width - trh; 
  const rightHeight = height - brv;
  const bottomWidth = width - brh;
  const leftHeight = height - blv;

  return {
    topLeftOuter:
      getCurvePoints(
        x,
        y,
        tlh,
        tlv
      )
      .topLeft().subdivide(0.5),
    topLeftInner:
      getCurvePoints(
        x + borders[3].width,
        y + borders[0].width,
        Math.max(0, tlh - borders[3].width),
        Math.max(0, tlv - borders[0].width)
      )
      .topLeft()
      .subdivide(0.5),
    topRightOuter:
      getCurvePoints(
        x + topWidth,
        y,
        trh,
        trv
      )
      .topRight()
      .subdivide(0.5),
    topRightInner:
      getCurvePoints(
        x + Math.min(topWidth, width + borders[3].width),
        y + borders[0].width,
        (topWidth > width + borders[3].width) ? 0 : trh - borders[3].width,
        trv - borders[0].width
      )
      .topRight()
      .subdivide(0.5),
    bottomRightOuter: 
      getCurvePoints(
        x + bottomWidth,
        y + rightHeight,
        brh,
        brv
      )
      .bottomRight()
      .subdivide(0.5),
    bottomRightInner:
      getCurvePoints(
        x + Math.min(bottomWidth, width - borders[3].width),
        y + Math.min(rightHeight, height + borders[0].width),
        Math.max(0, brh - borders[1].width),
        brv - borders[2].width
      )
      .bottomRight()
      .subdivide(0.5),
    bottomLeftOuter:
      getCurvePoints(
        x,
        y + leftHeight,
        blh,
        blv
      )
      .bottomLeft()
      .subdivide(0.5),
    bottomLeftInner:
      getCurvePoints(
        x + borders[3].width,
        y + leftHeight,
        Math.max(0, blh - borders[3].width),
        blv - borders[2].width
      )
      .bottomLeft()
      .subdivide(0.5)
  };
}

function bezierCurve(start, startControl, endControl, end) {
  var lerp = function(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  };

  return {
    start: start,
    startControl: startControl,
    endControl: endControl,
    end: end,
    subdivide: function(t) {
      var ab = lerp(start, startControl, t),
        bc = lerp(startControl, endControl, t),
        cd = lerp(endControl, end, t),
        abbc = lerp(ab, bc, t),
        bccd = lerp(bc, cd, t),
        dest = lerp(abbc, bccd, t);
      return [bezierCurve(start, ab, abbc, dest), bezierCurve(dest, bccd, cd, end)];
    },
    curveTo: function(borderArgs) {
      borderArgs.push(["bezierCurve", startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y]);
    },
    curveToReversed: function(borderArgs) {
      borderArgs.push(["bezierCurve", endControl.x, endControl.y, startControl.x, startControl.y, start.x, start.y]);
    }
  };
}

function drawSide(borderData, radius1, radius2, outer1, inner1, outer2, inner2) {
  var borderArgs = [];

  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", outer1[1].start.x, outer1[1].start.y]);
    outer1[1].curveTo(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c1[0], borderData.c1[1]]);
  }

  if(radius2[0] > 0 || radius2[1] > 0) {
    borderArgs.push(["line", outer2[0].start.x, outer2[0].start.y]);
    outer2[0].curveTo(borderArgs);
    borderArgs.push(["line", inner2[0].end.x, inner2[0].end.y]);
    inner2[0].curveToReversed(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c2[0], borderData.c2[1]]);
    borderArgs.push(["line", borderData.c3[0], borderData.c3[1]]);
  }

  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", inner1[1].end.x, inner1[1].end.y]);
    inner1[1].curveToReversed(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c4[0], borderData.c4[1]]);
  }

  return borderArgs;
}

function parseCorner(borderArgs, radius1, radius2, corner1, corner2, x, y) {
  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", corner1[0].start.x, corner1[0].start.y]);
    corner1[0].curveTo(borderArgs);
    corner1[1].curveTo(borderArgs);
  } else {
    borderArgs.push(["line", x, y]);
  }

  if(radius2[0] > 0 || radius2[1] > 0) {
    borderArgs.push(["line", corner2[0].start.x, corner2[0].start.y]);
  }
}

function negativeZIndex(container) {
  return container.cssInt("zIndex") < 0;
}

function positiveZIndex(container) {
  return container.cssInt("zIndex") > 0;
}

function zIndex0(container) {
  return container.cssInt("zIndex") === 0;
}

function inlineLevel(container) {
  return ["inline", "inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function isStackingContext(container) {
  return (container instanceof StackingContext);
}

function hasText(container) {
  return container.node.data.trim().length > 0;
}

function noLetterSpacing(container) {
  return (/^(normal|none|0px)$/.test(container.parent.css("letterSpacing")));
}

function getBorderRadiusData(container, borders, bounds) {
  bounds = bounds || container.parseBounds();
  return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(side => {
    const value = container.css(`border${side}Radius`);

    const dimens = value.split(" ");
    if(dimens.length === 1) {
      dimens.push(dimens[0]);
    }

    return dimens.map((val, i) => {
      const size = i === 0 ? bounds.width : bounds.height;
      const maxValue = size / 2;

      if (val.indexOf("%") !== -1) {
        return Math.min(size * asFloat(val) / 100, maxValue);
      } else {
        return Math.min(asFloat(val), maxValue);
      }
    });
  });
}

function renderableNode(node) {
  return (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE);
}

function isPositionedForStacking(container) {
  var position = container.css("position");
  var zIndex = (["absolute", "relative", "fixed"].indexOf(position) !== -1) ? container.css("zIndex") : "auto";
  return zIndex !== "auto";
}

function isPositioned(container) {
  return container.css("position") !== "static";
}

function isFloating(container) {
  return container.css("float") !== "none";
}

function isInlineBlock(container) {
  return ["inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function not(callback) {
  var context = this;
  return function() {
    return !callback.apply(context, arguments);
  };
}

function isElement(container) {
  return container.node.nodeType === Node.ELEMENT_NODE;
}

function isPseudoElement(container) {
  return container.isPseudoElement === true;
}

function isTextNode(container) {
  return container.node.nodeType === Node.TEXT_NODE;
}

function zIndexSort(contexts) {
  return function(a, b) {
    return (a.cssInt("zIndex") + (contexts.indexOf(a) / contexts.length)) - (b.cssInt("zIndex") + (contexts.indexOf(b) / contexts.length));
  };
}

function hasOpacity(container) {
  return container.getOpacity() < 1;
}

function asFloat(value) {
  return parseFloat(value);
}

function getWidth(border) {
  return border.width;
}

function nonIgnoredElement(nodeContainer) {
  return (nodeContainer.node.nodeType !== Node.ELEMENT_NODE || ["SCRIPT", "HEAD", "TITLE", "OBJECT", "BR", "OPTION"].indexOf(nodeContainer.node.nodeName) === -1);
}

function flatten(arrays) {
  return [].concat.apply([], arrays);
}

function stripQuotes(content) {
  var first = content.substr(0, 1);
  return (first === content.substr(content.length - 1) && first.match(/'|"/)) ? content.substr(1, content.length - 2) : content;
}

function getWords(characters) {
  var words = [], i = 0, onWordBoundary = false, word;
  while(characters.length) {
    if(isWordBoundary(characters[i]) === onWordBoundary) {
      word = characters.splice(0, i);
      if(word.length) {
        words.push(punycode.ucs2.encode(word));
      }
      onWordBoundary = !onWordBoundary;
      i = 0;
    } else {
      i++;
    }

    if(i >= characters.length) {
      word = characters.splice(0, i);
      if(word.length) {
        words.push(punycode.ucs2.encode(word));
      }
    }
  }
  return words;
}

function isWordBoundary(characterCode) {
  return [
      32, // <space>
      13, // \r
      10, // \n
      9, // \t
      45 // -
    ].indexOf(characterCode) !== -1;
}

function hasUnicode(string) {
  return (/[^\u0000-\u00ff]/).test(string);
}

module.exports = NodeParser;
