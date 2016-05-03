html2canvas
===========

[Homepage](http://html2canvas.hertzen.com) | [Downloads](https://github.com/niklasvh/html2canvas/releases) | [Questions](http://stackoverflow.com/questions/tagged/html2canvas?sort=newest) | [Donate](https://www.gittip.com/niklasvh/)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/niklasvh/html2canvas?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [![Build Status](https://travis-ci.org/niklasvh/html2canvas.png)](https://travis-ci.org/niklasvh/html2canvas)

#### Notice ####

Modified for use within DGLogik. If you want to use it or expand on it compared to the normal html2canvas, go ahead. Support for this version of html2canvas is not guaranteed outside of DGLogik, use this at your own risk.

DGLogik is targeting the following browsers, recent versions unless otherwise specified:

- IE10+
- Microsoft Edge
- Chromium / Google Chrome (therefore also Opera and all Electron derivatives)
- Firefox
- Safari

All below documentation should still be accurate. Here's a rather incomplete list of what this modified version supports that the upstream version does not:

- Fix some bugs with the text-shadow property.
- Fixed overflow issue with border-radius property.
- Allowed linear-gradient to be specified in degrees.
- Partially implement radial-gradient property, supports positioned elliptic and radial gradients.
- Implement box-shadow property.
- Integrated a modified version of canvg into html2canvas as SVGParser, with canvg bugfixes.
- Fix issues with SVG overflow and other positioning issues.
- Allow for specifying width and height in html2canvas's options.
- Better support for iframes, element can now be of a different document.
- html2canvas function now accepts HTML as a String, and will parse it correctly inside a hidden iframe.
- Will work in Chrome 50+, solves issue with SVGElement.offset[Parent,Left,Top,Width,Height] no longer existing (this also allows for real Firefox support).
- Broke (and then fixed) support for IE11 and Microsoft Edge.
- Added a scale property that will scale the entire canvas, width, and height.

To build, run `npm run build`, to start a watch server on port 8080, run `npm run watch`.

#### TODO ####

- [ ] New unit tests
- [ ] Fully reimplement left/top properties for SVG's offsetLeft/offsetTop (removed in Chrome 50, non-existent elsewhere)
- [ ] Scale SVG with the scale property
- [ ] More accurate implementation of CSS properties
- [ ] Clean up code base for ES2015, make code a lot easier to read, remove a lot of hacks, etc.
