const { Promise } = require("../polyfill");

const BaseImageContainer = require("./BaseImageContainer");

module.exports = class ImageContainer extends BaseImageContainer {
  constructor(src, cors) {
    this.src = src;
    this.image = new Image();

    this.tainted = null;
    this.promise = new Promise((resolve, reject) => {
      this.image.onload = resolve;
      this.image.onerror = reject;

      if (cors) {
        this.image.crossOrigin = "anonymous";
      }

      this.image.src = src;

      if (this.image.complete === true) {
        resolve(this.image);
      }
    });
  }
}
