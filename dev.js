const fs = require("fs");

const browserify = require("browserify");

// browserify plugins
const bubleify = require("bubleify");
const derequire = require("derequire/plugin");
const watchify = require("watchify");

const instance = browserify("src/index.js", {
  cache: {},
  packageCache: {},
  standalone: "html2canvas"
});

instance.transform(bubleify, {
  bubleError: true
});

instance.plugin(derequire, [
  {
    from: "require",
    to: "_dh2cr_"
  }
]);

let bundleCount = 0;
function bundle() {
  bundleCount++;
  console.log(`[BUNDLE] (${bundleCount} updates)`);

  instance.bundle()
    .on("error", err => {
      console.log(err.message);
    })
    .pipe(fs.createWriteStream("./dist/html2canvas.js"));
}

if(process.argv.length >= 3 && process.argv[2] === "watch") {
  const serve = require("serve");
  serve(__dirname, {
    port: 5000,
    ignore: ["node_modules"]
  });

  instance.plugin(watchify);
  instance.on("update", bundle);
}

bundle();
