var utils = require('./utils');
var { Promise } = require("./polyfill");
var getBounds = utils.getBounds;

function FrameContainer(container, options) {
  this.image = null;
  this.src = container;
  var self = this;
  var bounds = getBounds(container);
  this.promise = new Promise(function(resolve, reject) {
    try {
      if(container.contentWindow.document.URL === "about:blank" || container.contentWindow.document.documentElement == null) {
        container.contentWindow.onload = container.onload = function() {
          resolve(container);
        };
      } else {
        resolve(container);
      }
    } catch(e) {
      reject(e);
    }
  }).then(function(container) {
      var html2canvas = require('./');
      return html2canvas(container.contentWindow.document.documentElement, {
        type: 'view',
        width: container.width,
        height: container.height,
        proxy: options.proxy,
        javascriptEnabled: options.javascriptEnabled,
        removeContainer: options.removeContainer,
        allowTaint: options.allowTaint,
        imageTimeout: options.imageTimeout / 2
      });
    }).then(function(canvas) {
      return self.image = canvas;
    });
}

module.exports = FrameContainer;
