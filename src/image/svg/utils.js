function isSVG(src) {
  return src.substring(src.length - 3).toLowerCase() === "svg" || isInline(src);
}

function inlineFormatting(src) {
  return (/^data:image\/svg\+xml;base64,/.test(src)) ? window.atob(removeContentType(src)) : removeContentType(src);
}

function removeContentType(src) {
  return src.replace(/^data:image\/svg\+xml(;base64)?,/, '');
}

function isInline(src) {
  return (/^data:image\/svg\+xml/i.test(src));
}

module.exports = {
  isSVG,
  inlineFormatting,
  removeContentType,
  isInline
};