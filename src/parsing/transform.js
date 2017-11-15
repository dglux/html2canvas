
// https://chromium.googlesource.com/chromium/blink/+/master/Source/platform/transforms/AffineTransform.cpp
class CSSTransform {
  constructor(origin, matrix) {
    this.origin = origin;
    this.matrix = matrix;

    this._inverse = null;
  }

  add(other) {
    // is BoundingBox
    this.origin[0] += other.x;
    this.origin[1] += other.y;

    return this;
  }

  det() {
    return this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2];
  }

  inverse() {
    if (this._inverse) {
      return this._inverse;
    }

    const det = this.det();
    const result = new CSSTransform([ ...this.origin ], identityMatrix());

    if (!det) {
      return (this._inverse = result);
    }

    if (this.isTranslation()) {
      result.matrix[4] -= this.matrix[4];
      result.matrix[5] -= this.matrix[5];
      return (this._inverse = result);
    }

    result.matrix = [
      this.matrix[3] / det,
      -this.matrix[1] / det,
      -this.matrix[2] / det,
      this.matrix[0] / det,
      (this.matrix[2] * this.matrix[5] - this.matrix[3] * this.matrix[4]) / det,
      (this.matrix[1] * this.matrix[4] - this.matrix[0] * this.matrix[5]) / det
    ];

    return (this._inverse = result);
  }

  isIdentity() {
    return isIdentity(this.matrix);
  }

  isTranslation() {
    return this.matrix[0] === 1 && !this.matrix[1] && !this.matrix[2] && this.matrix[3] === 1;
  }
}

const isIdentity = (matrix) => matrix.join(",") === "1,0,0,1,0,0"; 

const identityMatrix = () => [1, 0, 0, 1, 0, 0];

const identityTransform = () => new CSSTransform([0, 0], identityMatrix());

// parse transform functions

const MATRIX_PROPERTY = /(matrix|matrix3d)\((.+)\)/;

function parseTransform(container) {
  const matrix = parseTransformMatrix(container);

  if (!isIdentity(matrix) ||
      (container.parent && container.parent.hasTransform())) {
    const origin = parseTransformOrigin(container);

    return new CSSTransform(origin, matrix);
  } else {
    return identityTransform();
  }
}

function parseTransformOrigin(container) {
  return container.prefixedCss("transformOrigin")
    .split(" ")
    .map(str => str.replace("px", ""))
    .map(str => parseFloat(str));
}

function parseTransformMatrix(container) {
  const transform = container.prefixedCss("transform");
  const matrix = !!transform
      ? parseMatrix(transform.match(MATRIX_PROPERTY))
      : null;

  return matrix || identityMatrix();
}

function parseMatrix(match) {
  if (match && match[1] === "matrix") {
    return match[2].split(",").map(s => parseFloat(s.trim()));
  } else if (match && match[1] === "matrix3d") {
    const matrix3d = match[2].split(",").map(s => parseFloat(s.trim()));

    return [
      matrix3d[0],
      matrix3d[1],
      matrix3d[4],
      matrix3d[5],
      matrix3d[12],
      matrix3d[13]
    ];
  }
}

module.exports = {
  CSSTransform,
  identityTransform,
  parseTransform,
  parseTransformMatrix
};