const { Promise } = require("../polyfill");
const html2canvas = require("../");

const BaseImageContainer = require("./BaseImageContainer");

module.exports = class FrameContainer extends BaseImageContainer {
  constructor(container, options) {
    this.image = null;
    this.src = container;
    this.isScaled = false;

    const bounds = container.parseBounds();
    this.promise = new Promise((resolve, reject) => {
      try {
        if (container.contentWindow.document.URL === "about:blank" || container.contentWindow.document.documentElement == null) {
          container.contentWindow.onload = container.onload = function() {
            resolve(container);
          };
        } else {
          resolve(container);
        }
      } catch(e) {
        reject(e);
      }
    }).then(container => {
      return html2canvas(container.contentWindow.document.documentElement, {
        type: "view",
        width: container.width,
        height: container.height,
        proxy: options.proxy,
        javascriptEnabled: options.javascriptEnabled,
        removeContainer: options.removeContainer,
        allowTaint: options.allowTaint,
        imageTimeout: options.imageTimeout / 2
      });
    }).then(canvas => (self.image = canvas));
  }
}
