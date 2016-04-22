const getFormat = (args) =>
  [
    `${(Date.now() - window.html2canvas.start)}ms`,
    'html2canvas:'
  ].concat(args);

module.exports = (...args) => {
  if(window.html2canvas.logging && window.console && window.console.log)
    console.log.apply(window.console, getFormat(args));
};

module.exports.getFormat = getFormat;
