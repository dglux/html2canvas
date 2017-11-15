class Clip {
  constructor(shapes, transform, parent) {
    this.shapes = shapes || [];
    this.transform = transform;
    this.parent = parent;
  }

  addShape(shape) {
    this.shapes.push(shape);
    return this;
  }

  clone() {
    return new Clip([ ...this.shapes ], this.transform, this.parent);
  }
}

module.exports = {
  Clip
};