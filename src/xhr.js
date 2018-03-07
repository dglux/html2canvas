const supportsFetch = window.fetch !== undefined;

if (supportsFetch) {
  module.exports = (url) => fetch(url, {credentials: "same-origin" }).then(res => {
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return res.text();
  });
} else {
  const { Promise } = require("./polyfill");

  module.exports = (url) => new Promise((resolve, reject) => {
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