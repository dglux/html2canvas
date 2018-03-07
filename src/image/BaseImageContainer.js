module.exports = class BaseImageContainer {
  constructor() {
    this.src; // string
    !this.tainted; // boolean, default false
    this.promise; // Promise<Image>
    this.image; // Image
  }
};