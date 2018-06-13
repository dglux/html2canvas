module.exports = class BaseImageContainer {
  constructor() {
    this.src = null; // string
    this.tainted = false; // boolean, default false
    this.promise = null; // Promise<Image>
    this.image = null; // Image
  }
};