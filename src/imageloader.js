var Promise = require('./promise');
var log = require('./log');
var ImageContainer = require('./imagecontainer');
var DummyImageContainer = require('./dummyimagecontainer');
var ProxyImageContainer = require('./proxyimagecontainer');
var FrameContainer = require('./framecontainer');
var SVGContainer = require('./svg/SVGContainer');
var SVGNodeContainer = require('./svg/SVGNodeContainer');

var LinearGradientContainer = require('./gradient/LinearGradientContainer');
var RadialGradientContainer = require('./gradient/RadialGradientContainer');
var WebkitGradientContainer = require('./gradient/WebKitGradientContainer');

var bind = require('./utils').bind;

function ImageLoader(options, support) {
  this.link = null;
  this.options = options;
  this.support = support;
  this.origin = this.getOrigin(window.location.href);
}

ImageLoader.prototype.findImages = function(nodes) {
  var images = [];
  nodes.reduce(function(imageNodes, container) {
    switch(container.node.nodeName) {
      case "IMG":
        return imageNodes.concat([{
          args: [container.node.src],
          method: "url"
        }]);
      case "svg":
      case "IFRAME":
        return imageNodes.concat([{
          args: [container.node],
          method: container.node.nodeName
        }]);
    }
    return imageNodes;
  }, []).forEach(this.addImage(images, this.loadImage), this);
  return images;
};

ImageLoader.prototype.findBackgroundImage = function(images, container) {
  container.parseBackgroundImages().filter(this.hasImageBackground).forEach(this.addImage(images, this.loadImage, container), this);
  return images;
};

ImageLoader.prototype.addImage = function(images, callback, bounds) {
  return function(newImage) {
    newImage.args.forEach(function(image) {
      if(!this.imageExists(images, image)) {
        images.splice(0, 0, callback.call(this, newImage, bounds));
      }
    }, this);
  };
};

ImageLoader.prototype.hasImageBackground = function(imageData) {
  return imageData.method !== "none";
};

ImageLoader.prototype.loadImage = function(imageData, container) {
  if(imageData.method === "url") {
    var src = imageData.args[0];
    if(this.isSVG(src) && !this.options.allowTaint) {
      return new SVGContainer(src);
    } else if(src.match(/data:image\/.*;base64,/i)) {
      return new ImageContainer(src.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, ''), false);
    } else if(this.isSameOrigin(src) || this.options.allowTaint === true || this.isSVG(src)) {
      return new ImageContainer(src, false);
    } else if(this.support.cors && !this.options.allowTaint) {
      return new ImageContainer(src, true);
    } else if(this.options.proxy) {
      return new ProxyImageContainer(src, this.options.proxy);
    } else {
      return new DummyImageContainer(src);
    }
  } else if(imageData.method === "linear-gradient") {
    return new LinearGradientContainer(imageData, container);
  } else if(imageData.method === "radial-gradient") {
    return new RadialGradientContainer(imageData, container);
  } else if(imageData.method === "gradient") {
    return new WebkitGradientContainer(imageData, container);
  } else if(imageData.method === "svg") {
    return new SVGNodeContainer(imageData.args[0]);
  } else if(imageData.method === "IFRAME") {
    return new FrameContainer(imageData.args[0], this.isSameOrigin(imageData.args[0].src), this.options);
  } else {
    return new DummyImageContainer(imageData);
  }
};

ImageLoader.prototype.isSVG = function(src) {
  return src.substring(src.length - 3).toLowerCase() === "svg" || SVGContainer.prototype.isInline(src);
};

ImageLoader.prototype.imageExists = function(images, src) {
  return images.some(function(image) {
    return image.src === src;
  });
};

ImageLoader.prototype.isSameOrigin = function(url) {
  return (this.getOrigin(url) === this.origin);
};

ImageLoader.prototype.getOrigin = function(url) {
  var link = this.link || (this.link = document.createElement("a"));
  link.href = url;
  link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
  return link.protocol + link.hostname + link.port;
};

ImageLoader.prototype.getPromise = function(container) {
  return this.timeout(container, this.options.imageTimeout)['catch'](function() {
    var dummy = new DummyImageContainer(container.src);
    return dummy.promise.then(function(image) {
      container.image = image;
    });
  });
};

ImageLoader.prototype.get = function(src) {
  var found = null;
  return this.images.some(function(img) {
    return (found = img).src === src;
  }) ? found : null;
};

ImageLoader.prototype.fetch = function(nodes) {
  const logQueue = {};
  let successCount = 0;
  let failureCount = 0;

  this.images = nodes.reduce(bind(this.findBackgroundImage, this), this.findImages(nodes));
  this.images.forEach(function(image, index) {
    const i = index + 1;
    image.promise.then(function() {
      logQueue[i] = [`Image #${i}: SUCCESS (${image.constructor.name})`, image];
      successCount++;
    }, function(e) {
      logQueue[i] = [`Image #${i}: FAILED (${image.constructor.name})`, image];
      failureCount++;
    });
  });
  this.ready = Promise.all(this.images.map(this.getPromise, this));
  log("Finished searching images");

  this.ready.then(() => {
    console.groupCollapsed(log.getFormat([`Finished loading images, success: ${successCount}, failed: ${failureCount}`]).join(' '));

    var i = 0, length = Object.keys(logQueue).length;
    for(; i < length; i++) {
      const arr = logQueue[(i + 1).toString()];
      console.info(arr[0], arr[1]);
    }

    console.groupEnd();
  });

  return this;
};

ImageLoader.prototype.timeout = function(container, timeout) {
  var timer;
  var promise = Promise.race([container.promise, new Promise(function(res, reject) {
    timer = setTimeout(function() {
      log("Timed out loading image", container);
      reject(container);
    }, timeout);
  })]).then(function(container) {
    clearTimeout(timer);
    return container;
  });
  promise['catch'](function() {
    clearTimeout(timer);
  });
  return promise;
};

module.exports = ImageLoader;
