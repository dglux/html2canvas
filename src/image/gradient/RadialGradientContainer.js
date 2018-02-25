const Color = require("../../color");

const GradientContainer = require("./GradientContainer");

const LENGTH_REGEX = /([0-9]+(?:px|%){1})/g;
const STEP_REGEX = /((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/;

module.exports = class RadialGradientContainer extends GradientContainer {
  constructor(imageData, container) {
    super(imageData, container, container.parseBounds());
    const bounds = container.parseBounds();
    
    this.type = GradientContainer.TYPES.LINEAR;

    let args = imageData.args;
    const hasDirection = args[0].indexOf(this.stepRegExp) === -1;

    if (hasDirection) {
      // Transform webkit syntax to standard.
      if (imageData.prefix === '-webkit-' && imageData.args.length > 1 && imageData.args[1].indexOf(STEP_REGEX) === -1) {
        args = [imageData.args[1] + ' at ' + imageData.args[0]].concat(imageData.args.slice(2));
      }

      const direction = args[0].split('at')[0];
      const at = args[0].split('at')[1] || '';

      const matches = direction.match(LENGTH_REGEX);
      if (matches.length) {
        // must be an ellipse
        if (matches.length > 1) {
          let width = matches[0].indexOf("%") > -1 ? (parseFloat(matches[0]) / 100) * bounds.width : parseFloat(matches[0]);
          let height = matches[1].indexOf("%") > -1 ? (parseFloat(matches[1]) / 100) * bounds.height : parseFloat(matches[1]);

          width = (bounds.width - container.borders.borders[1].width - container.borders.borders[3].width) * (width / bounds.width);
          height = (bounds.height - container.borders.borders[0].width - container.borders.borders[2].width) * (height / bounds.height);

          if (Math.min(width, height) === width) {
            this.r = width;
            this.scaleY = height / width;
          } else {
            this.r = height;
            this.scaleX = width / height;
          }
        }
        // must be a circle
        // value cannot be a percentage
        else {
          this.r = parseFloat(matches[0]);
        }

        this.x0 = 0;
        this.y0 = 0;
      } else {
        let shape = 'ellipse';
        let extentKeyword;

        direction.split(" ").reverse().forEach(position => {
          switch(position) {
            case 'circle':
              shape = 'circle';
              extentKeyword = extentKeyword || 'farthest-corner';
              break;
            case 'ellipse':
              shape = 'ellipse';
              extentKeyword = extentKeyword || 'farthest-corner';
              break;
            case 'closest-side':
              extentKeyword = 'closest-side';
              break;
            case 'closest-corner':
              extentKeyword = 'closest-corner';
              break;
            case 'farthest-side':
              extentKeyword = 'farthest-side';
              break;
            case 'farthest-corner':
              extentKeyword = 'farthest-corner';
              break;
          }
        });
      }

      const pMatches = at.match(LENGTH_REGEX);
      if (pMatches.length > 1) {
        const x = pMatches[0].indexOf("%") > -1 ? (parseFloat(pMatches[0]) / 100) * bounds.width : parseFloat(pMatches[0]);
        const y = pMatches[1].indexOf("%") > -1 ? (parseFloat(pMatches[1]) / 100) * bounds.height : parseFloat(pMatches[1]);

        this.x0 = this.x0 + x;
        this.y0 = this.y0 + y;
      }
    }

    this.colorStops = args.slice(hasDirection ? 1 : 0).map(colorStop => {
      const colorStopMatch = colorStop.replace(/transparent/g, 'rgba(0, 0, 0, 0.0)').match(STEP_REGEX);
      return {
        color: new Color(colorStopMatch[1]),
        stop: colorStopMatch[3] === "%" ? 1 - (colorStopMatch[2] / 100) : null
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