const { Promise } = require("../polyfill");
const { smallImage } = require("../utils");

const BaseImageContainer = require("./BaseImageContainer");

module.exports = class DummyImageContainer extends BaseImageContainer {
  constructor(src) {
    this.src = src;
    this.isScaled = false;

    this._promise;
    this._image;
  }

  get image() {
    return this._image || (this._image = new Image());
  }

  get promise() {
    if (this.promise) {
      return this.promise;
    }

    const image = this.image;
    return this.promise = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = smallImage();
      if (image.complete === true) {
        resolve(image);
      }
    });
  }
}