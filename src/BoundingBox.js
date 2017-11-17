// base for both NodeParser and SVGParser to use.
function BoundingBox(x1, y1, x2, y2) {
  this.x1 = Number.NaN;
  this.y1 = Number.NaN;
  this.x2 = Number.NaN;
  this.y2 = Number.NaN;

  Object.defineProperty(this, 'x', {
    get: function() {
      return this.x1;
    },
    set: function(val) {
      this.x1 = val;
    }
  });

  Object.defineProperty(this, 'y', {
    get: function() {
      return this.y1;
    },
    set: function(val) {
      this.y1 = val;
    }
  });

  Object.defineProperty(this, 'width', {
    get: function() {
      return this.x2 - this.x1;
    }
  });

  Object.defineProperty(this, 'height', {
    get: function() {
      return this.y2 - this.y1;
    }
  });

  this.addPoint(x1, y1);
  this.addPoint(x2, y2);
}

BoundingBox.prototype.addPoint = function(x, y) {
  if(x != null) {
    if(isNaN(this.x1) || isNaN(this.x2)) {
      this.x1 = x;
      this.x2 = x;
    }
    if(x < this.x1) this.x1 = x;
    if(x > this.x2) this.x2 = x;
  }

  if(y != null) {
    if(isNaN(this.y1) || isNaN(this.y2)) {
      this.y1 = y;
      this.y2 = y;
    }
    if(y < this.y1) this.y1 = y;
    if(y > this.y2) this.y2 = y;
  }
}

BoundingBox.prototype.inflate = function(paddingX, paddingY) {
  paddingY = paddingY || paddingX;

  this.x1 -= paddingX;
  this.y1 -= paddingY;
  this.x2 += paddingX;
  this.y2 += paddingY;

  return this;
}

BoundingBox.prototype.multScalar = function(scalar) {
  const dx = this.width * (scalar - 1) / 2;
  const dy = this.height * (scalar - 1) / 2;

  this.x1 -= dx;
  this.y1 -= dy;
  this.x2 += dx;
  this.y2 += dy;

  return this;
};

BoundingBox.prototype.clone = function() {
  return new BoundingBox(this.x1, this.y1, this.x2, this.y2);
};

module.exports = BoundingBox;
