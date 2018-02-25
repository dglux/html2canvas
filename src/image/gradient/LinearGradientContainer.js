const Color = require("../../color");

const GradientContainer = require("./GradientContainer");

const STEP_REGEX = /((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/;

module.exports = class LinearGradientContainer extends GradientContainer {
  constructor(imageData, container) {
    super(imageData, container, container.parseBounds());
    const bounds = container.parseBounds();
    
    this.type = this.TYPES.LINEAR;

    const hasDirection = imageData.args[0].indexOf(STEP_REGEX) === -1;

    if (hasDirection) {
      imageData.args[0].split(" ").reverse().forEach(position => {
        switch(position) {
          case "left":
            this.x0 = 0;
            this.x1 = bounds.width;
            return;
          case "top":
            this.y0 = 0;
            this.y1 = bounds.height;
            return;
          case "right":
            this.x0 = bounds.width;
            this.x1 = 0;
            return;
          case "bottom":
            this.y0 = bounds.height;
            this.y1 = 0;
            return;
          case "to":
            const y0 = this.y0;
            const x0 = this.x0;
            this.y0 = this.y1;
            this.x0 = this.x1;
            this.x1 = x0;
            this.y1 = y0;
            return;
        }

        if (position.indexOf("deg") === -1) {
          return;
        }

        let deg = parseFloat(position.substr(0, position.length - 3));

        // Unprefixed radial gradients use bearings instead of polar coords.
        if (imageData.prefix === '-webkit-' || imageData.prefix === '-moz-') {
          deg = 90 - deg;
        }

        deg = deg % 360;
        while (deg < 0) {
          deg += 360;
        }

        if (deg % 90 === 0) {
          if (!deg) {
            // bottom
            this.y0 = bounds.height;
            this.y1 = 0;
          }

          if (deg === 90) {
              // left
            this.x0 = 0;
            this.x1 = bounds.width;
          }

          if (deg === 180) {
            // top
            this.y0 = 0;
            this.y1 = bounds.height;
          }

          if (deg === 270) {
            // right
            this.x0 = bounds.width;
            this.x1 = 0;
          }

          return;
        }

        const slope = Math.tan((90 - deg) * (Math.PI / 180));
        const pSlope = -1 / slope;

        const hW = bounds.width / 2;
        const hH = bounds.height / 2;

        let corner;
        if (deg < 90) {
          corner = [hW, hH];
        } else if (deg < 180) {
          corner = [hW, -hH];
        } else if (deg < 270) {
          corner = [-hW, -hH];
        } else {
          corner = [-hW, hH];
        }

        const c = corner[1] - pSlope * corner[0];
        const endX = c / (slope - pSlope);
        const endY = pSlope * endX + c;

        this.x0 = hW - endX;
        this.y0 = hH + endY;

        this.x1 = hW + endX;
        this.y1 = hH - endY;
      });
    } else {
      this.y0 = 0;
      this.y1 = bounds.height;
    }

    this.colorStops = imageData.args.slice(hasDirection ? 1 : 0).map((colorStop, i) => {
      const colorStopMatch = colorStop.replace(/transparent/g, 'rgba(0, 0, 0, 0.0)').match(STEP_REGEX);
      return {
        color: new Color(colorStopMatch[1]),
        stop: colorStopMatch[3] === "%" ? colorStopMatch[2] / 100 : null
      };
    });

    if (this.colorStops[0].stop === null) {
      this.colorStops[0].stop = 0;
    }

    if (this.colorStops[this.colorStops.length - 1].stop === null) {
      this.colorStops[this.colorStops.length - 1].stop = 1;
    }

    this.colorStops.forEach((colorStop, index) => {
      if (colorStop.stop === null) {
        this.colorStops.slice(index).some((find, count) => {
          if (find.stop !== null) {
            colorStop.stop = ((find.stop - this.colorStops[index - 1].stop) / (count + 1)) + this.colorStops[index - 1].stop;
            return true;
          } else {
            return false;
          }
        });
      }
    });
  }
}
