var BoundingBox = require('./BoundingBox');

exports.smallImage = function smallImage() {
  return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
};

exports.hideContainer = function(container) {
  container.className = "html2canvas-container";
  container.style.visibility = "hidden";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0px";
  container.style.border = "0";
  container.scrolling = "no"; // ios won't scroll without it
};

exports.bind = function(callback, context) {
  return function() {
    return callback.apply(context, arguments);
  };
};

exports.decode64 = require('base64-arraybuffer').decode;

exports.getBounds = function(node) {
  if(node.getBoundingClientRect) {
    var clientRect = node.getBoundingClientRect();
    var width = (node.tagName === 'svg' || node.offsetWidth == null) ? clientRect.width : node.offsetWidth;

    return new BoundingBox(Math.floor(clientRect.left),
                           Math.floor(clientRect.top),
                           Math.floor(clientRect.left + width),
                           Math.floor(clientRect.bottom || (clientRect.top + clientRect.height)));
  }
  return new BoundingBox();
};

exports.offsetBounds = function(node) {
  const isSvg = node.tagName === 'svg';
  var parent = (isSvg || node.offsetParent) ? exports.offsetBounds(exports.offsetParent(node)) : {x: 0, y: 0};

  // TODO: Support left/top values
  if(isSvg) {
    const windowContext = node.ownerDocument.defaultView;
    const style = windowContext.getComputedStyle(node);

    let left = parseInt(style.getPropertyValue('margin-left'), 10);
    let top = parseInt(style.getPropertyValue('margin-top'), 10);

    return new BoundingBox(
      left + parent.x,
      top + parent.y,
      left + parent.x + parent.width,
      top + parent.y + parent.height);
  }

  return new BoundingBox(
    Math.floor(node.offsetLeft + parent.x),
    Math.floor(node.offsetTop + parent.y),
    Math.floor(node.offsetLeft + parent.x + node.offsetWidth),
    Math.floor(node.offsetTop + node.offsetHeight + parent.y));
};

exports.offsetParent = function(node) {
  if(node.tagName !== 'svg')
    return node.offsetParent;

  let parent = node.parentNode;
  let windowContext = parent.ownerDocument.defaultView;

  const position = windowContext.getComputedStyle(parent).getPropertyValue('position');
  if(position === 'absolute' || position === 'relative' || parent.tagName === 'BODY')
    return parent;

  return parent.offsetParent;
};

exports.wrapperBounds = function(node, transform) {
  var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
  var parent = node.parentNode;
  var clone = node.cloneNode(true);

  if(!parent) return new BoundingBox();

  wrapper.appendChild(node.cloneNode(true));
  parent.replaceChild(wrapper, node);
  var bounds = transform ? exports.offsetBounds(wrapper) : exports.getBounds(wrapper);
  parent.replaceChild(clone, wrapper);
  return bounds;
};

exports.parseBackgrounds = function(backgroundImage) {
  var whitespace = ' \r\n\t',
    method, definition, prefix, prefix_i, block, results = [],
    mode = 0, numParen = 0, quote, args;
  var appendResult = function() {
    if(method) {
      if(definition.substr(0, 1) === '"') {
        definition = definition.substr(1, definition.length - 2);
      }
      if(definition) {
        args.push(definition);
      }
      if(method.substr(0, 1) === '-' && (prefix_i = method.indexOf('-', 1) + 1) > 0) {
        prefix = method.substr(0, prefix_i);
        method = method.substr(prefix_i);
      }
      results.push({
        prefix: prefix,
        method: method.toLowerCase(),
        value: block,
        args: args,
        image: null
      });
    }
    args = [];
    method = prefix = definition = block = '';
  };
  args = [];
  method = prefix = definition = block = '';
  backgroundImage.split("").forEach(function(c) {
    if(mode === 0 && whitespace.indexOf(c) > -1) {
      return;
    }
    switch(c) {
      case '"':
        if(!quote) {
          quote = c;
        } else if(quote === c) {
          quote = null;
        }
        break;
      case '(':
        if(quote) {
          break;
        } else if(mode === 0) {
          mode = 1;
          block += c;
          return;
        } else {
          numParen++;
        }
        break;
      case ')':
        if(quote) {
          break;
        } else if(mode === 1) {
          if(numParen === 0) {
            mode = 0;
            block += c;
            appendResult();
            return;
          } else {
            numParen--;
          }
        }
        break;

      case ',':
        if(quote) {
          break;
        } else if(mode === 0) {
          appendResult();
          return;
        } else if(mode === 1) {
          if(numParen === 0 && !method.match(/^url$/i)) {
            args.push(definition);
            definition = '';
            block += c;
            return;
          }
        }
        break;
    }

    block += c;
    if(mode === 0) {
      method += c;
    } else {
      definition += c;
    }
  });

  appendResult();
  return results;
};
