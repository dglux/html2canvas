const { Promise } = require("../polyfill");
const { smallImage } = require("../utils");

const BaseImageContainer = require("./BaseImageContainer");

module.exports = class DummyImageContainer extends BaseImageContainer {
  constructor(src) {
    this.src = src;

    this.image = new Image();
    this.promise = new Promise((resolve, reject) => {
      const { image } = this;
      image.onload = resolve;
      image.onerror = reject;
      image.src = smallImage();
      if (image.complete === true) {
        resolve(image);
      }
    });
  }
}