var { Promise } = require("./polyfill");
var log = require('./log');
var smallImage = require('./utils').smallImage;

function DummyImageContainer(src) {
  this.src = src;
  log("DummyImageContainer for", src);
  if(!this.promise || !this.image) {
    log("Initiating DummyImageContainer");
    DummyImageContainer.prototype.image = new Image();
    var image = this.image;
    DummyImageContainer.prototype.promise = new Promise(function(resolve, reject) {
      image.onload = resolve;
      image.onerror = reject;
      image.src = smallImage();
      if(image.complete === true) {
        resolve(image);
      }
    });
  }
}

module.exports = DummyImageContainer;
