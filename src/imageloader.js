/* jshint -W079 */
const { Promise } = require("./polyfill");
/* jshint +W079 */
const { promiseTimeout } = require("./utils");
const log = require("./log");

const ImageContainer = require("./image/ImageContainer");
const DummyImageContainer = require("./image/DummyImageContainer");
const FrameContainer = require("./image/FrameContainer");
const SVGContainer = require("./image/svg/SVGContainer");

const LinearGradientContainer = require("./image/gradient/LinearGradientContainer");
const RadialGradientContainer = require("./image/gradient/RadialGradientContainer");
const GradientContainer = require("./image/gradient/GradientContainer");

const { isSVG } = require("./image/svg/utils");

function hasImageBackground(imageData) {
  return imageData.method !== "none";
}

function imageExists(images, src) {
  return images.some(image => {
    return image.src === src;
  });
}

module.exports = class ImageLoader {
  constructor(options, support) {
    this.link = null;
    this.options = options;
    this.support = support;
    this.origin = this.getOrigin(window.location.href);
  }

  findImages(nodes) {
    const images = [];
    nodes.reduce((imageNodes, container) => {
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
    }, []).forEach(this.addImage(images, this.loadImage));

    return images;
  }
  
  findBackgroundImage(images, container) {
    container.parseBackgroundImages()
        .filter(hasImageBackground)
        .forEach(this.addImage(images, this.loadImage, container));
    return images;
  }
  
  addImage(images, callback, bounds) {
    return newImage => {
      newImage.args.forEach(image => {
        if (!imageExists(images, image)) {
          images.splice(0, 0, callback.call(this, newImage, bounds));
        }
      });
    };
  }
    
  loadImage(imageData, container) {
    if(imageData.method === "url") {
      var src = imageData.args[0];
      if(isSVG(src) && !this.options.allowTaint) {
        return new SVGContainer(src, this.options);
      } else if(src.match(/data:image\/.*;base64,/i)) {
        return new ImageContainer(src.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, ''), false);
      } else if(this.isSameOrigin(src) || this.options.allowTaint === true || isSVG(src)) {
        return new ImageContainer(src, false);
      } else if(this.support.cors && !this.options.allowTaint) {
        return new ImageContainer(src, true);
      } else {
        return new DummyImageContainer(src);
      }
    } else if(imageData.method === "linear-gradient") {
      return new LinearGradientContainer(imageData, container);
    } else if(imageData.method === "radial-gradient") {
      return new RadialGradientContainer(imageData, container);
    } else if(imageData.method === "gradient") {
      return new GradientContainer(imageData, container);
    } else if(imageData.method === "svg") {
      return new SVGContainer.fromNode(imageData.args[0], this.options);
    } else if(imageData.method === "IFRAME") {
      return new FrameContainer(imageData.args[0], this.options);
    } else {
      return new DummyImageContainer(imageData);
    }
  }

  isSameOrigin(url) {
    return (this.getOrigin(url) === this.origin);
  }
  
  getOrigin(url) {
    var link = this.link || (this.link = document.createElement("a"));
    link.href = url;

    return link.protocol + link.hostname + link.port;
  }
  
  waitForImage(container) {
    return promiseTimeout(container.promise, this.options.imageTimeout)
        .catch(err => {
          if (err === this.options.imageTimeout) {
            log("Timed out loading image", container);
          }

          return (new DummyImageContainer()).promise.then(image => (container.image = image));
        });
  }
  
  get(src) {
    let found = null;
    return this.images.some(img => ((found = img).src === src)) ? found : null;
  }
  
  fetch(nodes) {
    const logQueue = {};
    let successCount = 0;
    let failureCount = 0;
  
    this.images = nodes.reduce(this.findBackgroundImage.bind(this), this.findImages(nodes));

    this.images.forEach((image, index) => {
      const i = index + 1;
      image.promise.then(() => {
        logQueue[i] = [`Image #${i}: SUCCESS (${image.constructor.name})`, image];
        successCount++;
      }, e => {
        logQueue[i] = [`Image #${i}: FAILED (${image.constructor.name})`, image];
        failureCount++;
      });
    });

    this.ready = Promise.all(this.images.map(this.waitForImage.bind(this)));
    log("Finished searching images");
  
    this.ready.then(() => {
      console.groupCollapsed(log.getFormat([`Finished loading images, success: ${successCount}, failed: ${failureCount}`]).join(' '));
  
      // TODO: make them sort numerically
      const keys = Object.keys(logQueue).sort();
      keys.forEach(key => {
        const [message, image] = logQueue[key];
        console.info(message, image);
      });

      console.groupEnd();
    });
  
    return this;
  }
};