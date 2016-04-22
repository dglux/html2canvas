var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');

var fs = require('fs');

var instance = browserify('src/index.js', {
  cache: {},
  packageCache: {},
  standalone: 'html2canvas'
});

instance.transform(babelify, {
  presets: ['es2015'],
  compact: false
});

var i = 0;
function bundle() {
  i++;
  console.log(`[BUNDLE] (${i} updates)`);
  instance.bundle()
    .on('error', function(err) {
      console.log(err.message);
    })
    .pipe(fs.createWriteStream('./dist/html2canvas.js'));
}

if(process.argv.length >= 3 && process.argv[2] === 'watch') {
  var express = require('express');
  var app = express();

  app.use(express.static(__dirname));

  instance.plugin(watchify);
  instance.on('update', bundle);

  app.listen(8080);
}

bundle();
