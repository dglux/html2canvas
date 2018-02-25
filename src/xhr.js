const supportsFetch = typeof(window.fetch) === "function";

if (supportsFetch) {
  module.exports = (url) => fetch(url).then(res => res.text());
} else {
  const { Promise } = require("./polyfill");

  module.exports = (url) => new Promise((resolve, reject) => {
    if (typeof(window.fetch) === "function") {
      return 
    }
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
  
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(xhr.statusText));
      }
    };
  
    xhr.onerror = (err) => {
      reject(err);
    };
  
    xhr.send();
  });  
}