class CSSTransform {
  constructor(origin, matrix) {
    this.origin = origin;
    this.matrix = matrix;
  }

  makeOriginAbsolute(container) {
      const offset = container.parseBounds();

      this.offsetX = offset.x;
      this.offsetY = offset.y;

      this.origin[0] += offset.x;
      this.origin[1] += offset.y;

      return this;
  }

  // multiply two affine transforms
  // https://chromium.googlesource.com/chromium/blink/+/master/Source/platform/transforms/AffineTransform.cpp#131
  mult(other) {
    if (other.isIdentity()) {
      return;
    }

    // origin
    if (this.offsetX !== undefined || this.offsetY !== undefined) {
      this.origin = [
        (other.origin[0] - this.offsetX) * this.matrix[0] + this.offsetX,
        (other.origin[1] - this.offsetY) * this.matrix[3] + this.offsetY
      ];
    } else {
      this.origin = [ ...other.origin ];
    }

    // horizontal scaling
    this.matrix[0] = this.matrix[0] * other.matrix[0] + this.matrix[2] * other.matrix[1];
    // horizontal skewing
    this.matrix[1] = this.matrix[1] * other.matrix[0] + this.matrix[3] * other.matrix[2];
    // vertical skewing
    this.matrix[2] = this.matrix[0] * other.matrix[2] + this.matrix[2] * other.matrix[3];
    // vertical scaling
    this.matrix[3] = this.matrix[1] * other.matrix[2] + this.matrix[3] * other.matrix[3];

    // horizontal offset
    this.matrix[4] += this.matrix[0] * other.matrix[4] + this.matrix[2] * other.matrix[5];
    // vertical offset
    this.matrix[5] += this.matrix[3] * other.matrix[5] + this.matrix[1] * other.matrix[4];

    return this;
  }

  isIdentity() {
    return isIdentity(this.matrix);
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