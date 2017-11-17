const Color = require("../color");

const SHADOW_PROPERTY = /(?!\([0-9\s.]+),(?![0-9\s.,]+\))/g;
const BOX_SHADOW_VALUES = /(inset)|(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;

function parseBoxShadows(container) {
  const boxShadow = container.css("boxShadow");
  var results = [];

  if(boxShadow && boxShadow !== 'none') {
    var shadows = boxShadow.split(SHADOW_PROPERTY);
    for(var i = 0; shadows && (i < shadows.length); i++) {
      const s = shadows[i].match(BOX_SHADOW_VALUES);

      let ci = 0;

      var insetEndTest = s[s.length - 1] === 'inset';
      var isInset = s[0] === 'inset' || insetEndTest;

      var color = new Color((!isInset || insetEndTest) ? s[ci] : s[s.length - 1]);
      
      if(!isInset && !color.isColor) {
        ci = -1;
        color = new Color(s[s.length - 1]);
      }
      
      var result = {
        color: color,
        offsetX: s[ci + 1] && s[ci + 1] !== 'inset' ? parseFloat(s[ci + 1]) : 0,
        offsetY: s[ci + 2] && s[ci + 2] !== 'inset' ? parseFloat(s[ci + 2]) : 0,
        blur: s[ci + 3] && s[ci + 3] !== 'inset' ? parseFloat(s[ci + 3]) : 0,
        spread: (s[ci + 4] && s[ci + 4] !== 'inset') ? parseFloat(s[ci + 4]) : 0,
        inset: isInset
      };
      
      results.push(result);
    }
  }
  return results;
};

module.exports = {
  parseBoxShadows
};