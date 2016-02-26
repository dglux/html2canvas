/*
  html2canvas 0.5.0-alpha2 <http://html2canvas.hertzen.com>
  Copyright (c) 2016 Niklas von Hertzen

  Released under MIT License
*/

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.html2canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(){
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

},{}],2:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.3.0
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.0 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
// base for both NodeParser and SVGParser to use.
function BoundingBox(x1, y1, x2, y2) {
  this.x1 = Number.NaN;
  this.y1 = Number.NaN;
  this.x2 = Number.NaN;
  this.y2 = Number.NaN;

  Object.defineProperty(this, 'x', {
    get: function() {
      return this.x1;
    },
    set: function(val) {
      this.x1 = val;
    }
  });

  Object.defineProperty(this, 'y', {
    get: function() {
      return this.y1;
    },
    set: function(val) {
      this.y1 = val;
    }
  });

  Object.defineProperty(this, 'width', {
    get: function() {
      return this.x2 - this.x1;
    }
  });

  Object.defineProperty(this, 'height', {
    get: function() {
      return this.y2 - this.y1;
    }
  });

  this.addPoint(x1, y1);
  this.addPoint(x2, y2);
}

BoundingBox.prototype.addPoint = function(x, y) {
  if(x != null) {
    if(isNaN(this.x1) || isNaN(this.x2)) {
      this.x1 = x;
      this.x2 = x;
    }
    if(x < this.x1) this.x1 = x;
    if(x > this.x2) this.x2 = x;
  }

  if(y != null) {
    if(isNaN(this.y1) || isNaN(this.y2)) {
      this.y1 = y;
      this.y2 = y;
    }
    if(y < this.y1) this.y1 = y;
    if(y > this.y2) this.y2 = y;
  }
}

BoundingBox.prototype.inflate = function(paddingX, paddingY) {
  paddingY = paddingY || paddingX;

  this.x1 -= paddingX;
  this.y1 -= paddingY;
  this.x2 += paddingX;
  this.y2 += paddingY;
}

BoundingBox.prototype.clone = function() {
  return new BoundingBox(this.x1, this.y1, this.x2, this.y2);
};

module.exports = BoundingBox;

},{}],6:[function(require,module,exports){
var log = require('./log');
var Promise = require('./promise');

function restoreOwnerScroll(ownerDocument, x, y) {
  if(ownerDocument.defaultView && (x !== ownerDocument.defaultView.pageXOffset || y !== ownerDocument.defaultView.pageYOffset)) {
    ownerDocument.defaultView.scrollTo(x, y);
  }
}

function cloneCanvasContents(canvas, clonedCanvas) {
  try {
    if(clonedCanvas) {
      clonedCanvas.width = canvas.width;
      clonedCanvas.height = canvas.height;
      clonedCanvas.getContext("2d").putImageData(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), 0, 0);
    }
  } catch(e) {
    log("Unable to copy canvas content from", canvas, e);
  }
}

function cloneNode(node, javascriptEnabled) {
  var clone = node.nodeType === 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);

  var child = node.firstChild;
  while(child) {
    if(javascriptEnabled === true || child.nodeType !== 1 || child.nodeName !== 'SCRIPT') {
      clone.appendChild(cloneNode(child, javascriptEnabled));
    }
    child = child.nextSibling;
  }

  if(node.nodeType === 1) {
    clone._scrollTop = node.scrollTop;
    clone._scrollLeft = node.scrollLeft;
    if(node.nodeName === "CANVAS") {
      cloneCanvasContents(node, clone);
    } else if(node.nodeName === "TEXTAREA" || node.nodeName === "SELECT") {
      clone.value = node.value;
    }
  }

  return clone;
}

function initNode(node) {
  if(node.nodeType === 1) {
    node.scrollTop = node._scrollTop;
    node.scrollLeft = node._scrollLeft;

    var child = node.firstChild;
    while(child) {
      initNode(child);
      child = child.nextSibling;
    }
  }
}

module.exports = function(ownerDocument, containerDocument, width, height, options, x, y) {
  var documentElement = cloneNode(ownerDocument.documentElement, options.javascriptEnabled);
  var container = containerDocument.createElement("iframe");

  container.className = "html2canvas-container";
  container.style.visibility = "hidden";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0px";
  container.style.border = "0";
  container.width = width;
  container.height = height;
  container.scrolling = "no"; // ios won't scroll without it
  containerDocument.body.appendChild(container);

  return new Promise(function(resolve) {
    var documentClone = container.contentWindow.document;

    /* Chrome doesn't detect relative background-images assigned in inline <style> sheets when fetched through getComputedStyle
     if window url is about:blank, we can assign the url to current by writing onto the document
     */
    container.contentWindow.onload = container.onload = function() {
      var interval = setInterval(function() {
        if(documentClone.body.childNodes.length > 0) {
          initNode(documentClone.documentElement);
          clearInterval(interval);
          if(options.type === "view") {
            container.contentWindow.scrollTo(x, y);
            if((/(iPad|iPhone|iPod)/g).test(navigator.userAgent) && (container.contentWindow.scrollY !== y || container.contentWindow.scrollX !== x)) {
              documentClone.documentElement.style.top = (-y) + "px";
              documentClone.documentElement.style.left = (-x) + "px";
              documentClone.documentElement.style.position = 'absolute';
            }
          }
          resolve(container);
        }
      }, 50);
    };

    documentClone.open();
    documentClone.write("<!DOCTYPE html><html></html>");
    // Chrome scrolls the parent document for some reason after the write to the cloned window???
    restoreOwnerScroll(ownerDocument, x, y);
    documentClone.replaceChild(documentClone.adoptNode(documentElement), documentClone.documentElement);
    documentClone.close();
  });
};

},{"./log":19,"./promise":22}],7:[function(require,module,exports){
// http://dev.w3.org/csswg/css-color/

function Color(value) {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = null;
  var result = this.fromArray(value) ||
    this.namedColor(value) ||
    this.rgb(value) ||
    this.rgba(value) ||
    this.hex6(value) ||
    this.hex3(value) || null;
  this.isColor = typeof result !== null;
}

Color.prototype.darken = function(amount) {
  var a = 1 - amount;
  return new Color([
    Math.round(this.r * a),
    Math.round(this.g * a),
    Math.round(this.b * a),
    this.a
  ]);
};

Color.prototype.isTransparent = function() {
  return this.a === 0;
};

Color.prototype.isBlack = function() {
  return this.r === 0 && this.g === 0 && this.b === 0;
};

Color.prototype.fromArray = function(array) {
  if(Array.isArray(array)) {
    this.r = Math.min(array[0], 255);
    this.g = Math.min(array[1], 255);
    this.b = Math.min(array[2], 255);
    if(array.length > 3) {
      this.a = array[3];
    }
  }

  return (Array.isArray(array));
};

var _hex3 = /^#([a-f0-9]{3})$/i;

Color.prototype.hex3 = function(value) {
  var match = null;
  if((match = value.match(_hex3)) !== null) {
    this.r = parseInt(match[1][0] + match[1][0], 16);
    this.g = parseInt(match[1][1] + match[1][1], 16);
    this.b = parseInt(match[1][2] + match[1][2], 16);
  }
  return match !== null;
};

var _hex6 = /^#([a-f0-9]{6})$/i;

Color.prototype.hex6 = function(value) {
  var match = null;
  if((match = value.match(_hex6)) !== null) {
    this.r = parseInt(match[1].substring(0, 2), 16);
    this.g = parseInt(match[1].substring(2, 4), 16);
    this.b = parseInt(match[1].substring(4, 6), 16);
  }
  return match !== null;
};


var _rgb = /^rgb\((\d{1,3}) *, *(\d{1,3}) *, *(\d{1,3})\)$/;

Color.prototype.rgb = function(value) {
  var match = null;
  if((match = value.match(_rgb)) !== null) {
    this.r = Number(match[1]);
    this.g = Number(match[2]);
    this.b = Number(match[3]);
  }
  return match !== null;
};

var _rgba = /^rgba\((\d{1,3}) *, *(\d{1,3}) *, *(\d{1,3}) *, *(\d+\.?\d*)\)$/;

Color.prototype.rgba = function(value) {
  var match = null;
  if((match = value.match(_rgba)) !== null) {
    this.r = Number(match[1]);
    this.g = Number(match[2]);
    this.b = Number(match[3]);
    this.a = Number(match[4]);
  }
  return match !== null;
};

Color.prototype.toString = function() {
  return this.a !== null && this.a !== 1 ?
  "rgba(" + [this.r, this.g, this.b, this.a].join(",") + ")" :
  "rgb(" + [this.r, this.g, this.b].join(",") + ")";
};

Color.prototype.namedColor = function(value) {
  var color = colors[value.toLowerCase()];
  if(color) {
    this.r = color[0];
    this.g = color[1];
    this.b = color[2];
  } else if(value.toLowerCase() === "transparent") {
    this.r = this.g = this.b = this.a = 0;
    return true;
  }

  return !!color;
};

// JSON.stringify([].slice.call($$('.named-color-table tr'), 1).map(function(row) { return [row.childNodes[3].textContent, row.childNodes[5].textContent.trim().split(",").map(Number)] }).reduce(function(data, row) {data[row[0]] = row[1]; return data}, {}))
var colors = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};

module.exports = Color;

},{}],8:[function(require,module,exports){
var Promise = require('./promise');
var log = require('./log');
var smallImage = require('./utils').smallImage;

function DummyImageContainer(src) {
  this.src = src;
  log("DummyImageContainer for", src);
  if(!this.promise || !this.image) {
    log("Initiating DummyImageContainer");
    DummyImageContainer.prototype.image = new Image();
    var image = this.image;
    DummyImageContainer.prototype.promise = new Promise(function(resolve, reject) {
      image.onload = resolve;
      image.onerror = reject;
      image.src = smallImage();
      if(image.complete === true) {
        resolve(image);
      }
    });
  }
}

module.exports = DummyImageContainer;

},{"./log":19,"./promise":22,"./utils":34}],9:[function(require,module,exports){
var smallImage = require('./utils').smallImage;

function Font(family, size) {
  var container = document.createElement('div'),
    img = document.createElement('img'),
    span = document.createElement('span'),
    sampleText = 'Hidden Text',
    baseline,
    middle;

  container.style.visibility = "hidden";
  container.style.fontFamily = family;
  container.style.fontSize = size;
  container.style.margin = 0;
  container.style.padding = 0;

  document.body.appendChild(container);

  img.src = smallImage();
  img.width = 1;
  img.height = 1;

  img.style.margin = 0;
  img.style.padding = 0;
  img.style.verticalAlign = "baseline";

  span.style.fontFamily = family;
  span.style.fontSize = size;
  span.style.margin = 0;
  span.style.padding = 0;

  span.appendChild(document.createTextNode(sampleText));
  container.appendChild(span);
  container.appendChild(img);
  baseline = (img.offsetTop - span.offsetTop) + 1;

  container.removeChild(span);
  container.appendChild(document.createTextNode(sampleText));

  container.style.lineHeight = "normal";
  img.style.verticalAlign = "super";

  middle = (img.offsetTop - container.offsetTop) + 1;

  document.body.removeChild(container);

  this.baseline = baseline;
  this.lineWidth = 1;
  this.middle = middle;
}

module.exports = Font;

},{"./utils":34}],10:[function(require,module,exports){
var Font = require('./font');

function FontMetrics() {
  this.data = {};
}

FontMetrics.prototype.getMetrics = function(family, size) {
  if(this.data[family + "-" + size] === undefined) {
    this.data[family + "-" + size] = new Font(family, size);
  }
  return this.data[family + "-" + size];
};

module.exports = FontMetrics;

},{"./font":9}],11:[function(require,module,exports){
var utils = require('./utils');
var Promise = require('./promise');
var getBounds = utils.getBounds;
var loadUrlDocument = require('./proxy').loadUrlDocument;

function FrameContainer(container, sameOrigin, options) {
  this.image = null;
  this.src = container;
  var self = this;
  var bounds = getBounds(container);
  this.promise = (!sameOrigin ? this.proxyLoad(options.proxy, bounds, options) : new Promise(function(resolve) {
    if(container.contentWindow.document.URL === "about:blank" || container.contentWindow.document.documentElement == null) {
      container.contentWindow.onload = container.onload = function() {
        resolve(container);
      };
    } else {
      resolve(container);
    }
  })).then(function(container) {
      var html2canvas = require('./');
      return html2canvas(container.contentWindow.document.documentElement, {
        type: 'view',
        width: container.width,
        height: container.height,
        proxy: options.proxy,
        javascriptEnabled: options.javascriptEnabled,
        removeContainer: options.removeContainer,
        allowTaint: options.allowTaint,
        imageTimeout: options.imageTimeout / 2
      });
    }).then(function(canvas) {
      return self.image = canvas;
    });
}

FrameContainer.prototype.proxyLoad = function(proxy, bounds, options) {
  var container = this.src;
  return loadUrlDocument(container.src, proxy, container.ownerDocument, bounds.width, bounds.height, options);
};

module.exports = FrameContainer;

},{"./":18,"./promise":22,"./proxy":23,"./utils":34}],12:[function(require,module,exports){
var Promise = require('../promise');

function GradientContainer(imageData, container, bounds) {
  this.src = JSON.stringify([imageData.value, bounds]);
  this.colorStops = [];
  this.type = null;
  this.x0 = bounds.width / 2;
  this.y0 = bounds.height / 2;
  this.x1 = this.x0;
  this.y1 = this.y0;
  this.promise = Promise.resolve(true);
}

GradientContainer.prototype.TYPES = {
  LINEAR: 1,
  RADIAL: 2
};

module.exports = GradientContainer;

},{"../promise":22}],13:[function(require,module,exports){
var GradientContainer = require('./GradientContainer');
var Color = require('../color');

function LinearGradientContainer(imageData, container) {
  var bounds = container.parseBounds();
  GradientContainer.call(this, imageData, container, bounds);
  this.type = this.TYPES.LINEAR;

  var hasDirection = imageData.args[0].indexOf(this.stepRegExp) === -1;

  if(hasDirection) {
    imageData.args[0].split(" ").reverse().forEach(function(position) {
      switch(position) {
        case "left":
          this.x0 = 0;
          this.x1 = bounds.width;
          break;
        case "top":
          this.y0 = 0;
          this.y1 = bounds.height;
          break;
        case "right":
          this.x0 = bounds.width;
          this.x1 = 0;
          break;
        case "bottom":
          this.y0 = bounds.height;
          this.y1 = 0;
          break;
        case "to":
          var y0 = this.y0;
          var x0 = this.x0;
          this.y0 = this.y1;
          this.x0 = this.x1;
          this.x1 = x0;
          this.y1 = y0;
          break;
        default:
          if(position.indexOf('deg') != -1) {
            var deg = parseFloat(position.substr(0, position.length - 3));

            // Unprefixed radial gradients use bearings instead of polar coords.
            if(imageData.prefix === '-webkit-') {
              deg = 90 - deg;
            }

            deg = deg % 360;
            while(deg < 0) {
              deg += 360;
            }

            if(deg % 90 === 0) {
              if(!deg) {
                // bottom
                this.y0 = bounds.height;
                this.y1 = 0;
              }

              if(deg === 90) {
                // left
                this.x0 = 0;
                this.x1 = bounds.width;
              }

              if(deg === 180) {
                // top
                this.y0 = 0;
                this.y1 = bounds.height;
              }

              if(deg === 270) {
                // right
                this.x0 = bounds.width;
                this.x1 = 0;
              }

              break;
            }

            var slope = Math.tan((90 - deg) * (Math.PI / 180));
            var pSlope = -1 / slope;

            var hW = bounds.width / 2;
            var hH = bounds.height / 2;

            var corner;
            if(deg < 90) {
              corner = [hW, hH];
            } else if(deg < 180) {
              corner = [hW, -hH];
            } else if(deg < 270) {
              corner = [-hW, -hH];
            } else {
              corner = [-hW, hH];
            }

            var c = corner[1] - pSlope * corner[0];
            var endX = c / (slope - pSlope);
            var endY = pSlope * endX + c;

            this.x0 = hW - endX;
            this.y0 = hH + endY;

            this.x1 = hW + endX;
            this.y1 = hH - endY;
          }
          break;
      }
    }, this);
  } else {
    this.y0 = 0;
    this.y1 = bounds.height;
  }

  this.colorStops = imageData.args.slice(hasDirection ? 1 : 0).map(function(colorStop) {
    var colorStopMatch = colorStop.replace(/transparent/g, 'rgba(0, 0, 0, 0.0)').match(this.stepRegExp);
    return {
      color: new Color(colorStopMatch[1]),
      stop: colorStopMatch[3] === "%" ? colorStopMatch[2] / 100 : null
    };
  }, this);

  if(this.colorStops[0].stop === null) {
    this.colorStops[0].stop = 0;
  }

  if(this.colorStops[this.colorStops.length - 1].stop === null) {
    this.colorStops[this.colorStops.length - 1].stop = 1;
  }

  this.colorStops.forEach(function(colorStop, index) {
    if(colorStop.stop === null) {
      this.colorStops.slice(index).some(function(find, count) {
        if(find.stop !== null) {
          colorStop.stop = ((find.stop - this.colorStops[index - 1].stop) / (count + 1)) + this.colorStops[index - 1].stop;
          return true;
        } else {
          return false;
        }
      }, this);
    }
  }, this);
}

LinearGradientContainer.prototype = Object.create(GradientContainer.prototype);

LinearGradientContainer.prototype.stepRegExp = /((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/;

module.exports = LinearGradientContainer;

},{"../color":7,"./GradientContainer":12}],14:[function(require,module,exports){
var GradientContainer = require('./GradientContainer');
var Color = require('../color');

function RadialGradientContainer(imageData, container) {
  var bounds = container.parseBounds();
  GradientContainer.call(this, imageData, container, bounds);
  this.type = this.TYPES.RADIAL;

  var args = imageData.args;
  var hasDirection = args[0].indexOf(this.stepRegExp) === -1;

  if(hasDirection) {
    // Transform webkit syntax to standard.
    if(imageData.prefix === '-webkit-' && imageData.args.length > 1 && imageData.args[1].indexOf(this.stepRegExp) === -1) {
      args = [imageData.args[1] + ' at ' + imageData.args[0]].concat(imageData.args.slice(2));
    }

    var direction = args[0].split('at')[0];
    var at = args[0].split('at')[1] || '';

    var matches = direction.match(this.lengthExp);
    if(matches.length > 0) {
      if(matches.length > 1) {
        // must be an ellipse

        var width = matches[0].indexOf("%") > -1 ? (parseFloat(matches[0]) / 100) * bounds.width : parseFloat(matches[0]);
        var height = matches[1].indexOf("%") > -1 ? (parseFloat(matches[1]) / 100) * bounds.height : parseFloat(matches[1]);

        width = (bounds.width - container.borders.borders[1].width - container.borders.borders[3].width) * (width / bounds.width);
        height = (bounds.height - container.borders.borders[0].width - container.borders.borders[2].width) * (height / bounds.height);

        if(Math.min(width, height) === width) {
          this.r = width;
          this.scaleY = height / width;
        } else {
          this.r = height;
          this.scaleX = width / height;
        }
      } else {
        // must be a circle
        // value cannot be a percentage

        this.r = parseFloat(matches[0]);
      }

      this.x0 = 0;
      this.y0 = 0;
    } else {
      var shape = 'ellipse';
      var extentKeyword;

      direction.split(' ').reverse().forEach(function(position) {
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

    var pMatches = at.match(this.lengthExp);
    if(pMatches.length > 1) {
      var x = pMatches[0].indexOf("%") > -1 ? (parseFloat(pMatches[0]) / 100) * bounds.width : parseFloat(pMatches[0]);
      var y = pMatches[1].indexOf("%") > -1 ? (parseFloat(pMatches[1]) / 100) * bounds.height : parseFloat(pMatches[1]);

      this.x0 = this.x0 + x;
      this.y0 = this.y0 + y;
    }
  }

  this.colorStops = args.slice(hasDirection ? 1 : 0).map(function(colorStop) {
    var colorStopMatch = colorStop.replace(/transparent/g, 'rgba(0, 0, 0, 0.0)').match(this.stepRegExp);
    return {
      color: new Color(colorStopMatch[1]),
      stop: colorStopMatch[3] === "%" ? 1 - (colorStopMatch[2] / 100) : null
    };
  }, this);

  if(this.colorStops[0].stop === null) {
    this.colorStops[0].stop = 0;
  }

  if(this.colorStops[this.colorStops.length - 1].stop === null) {
    this.colorStops[this.colorStops.length - 1].stop = 1;
  }

  this.colorStops.forEach(function(colorStop, index) {
    if(colorStop.stop === null) {
      this.colorStops.slice(index).some(function(find, count) {
        if(find.stop !== null) {
          colorStop.stop = ((find.stop - this.colorStops[index - 1].stop) / (count + 1)) + this.colorStops[index - 1].stop;
          return true;
        } else {
          return false;
        }
      }, this);
    }
  }, this);
}

RadialGradientContainer.prototype = Object.create(GradientContainer.prototype);

RadialGradientContainer.prototype.lengthExp = /([0-9]+(?:px|%){1})/g;
RadialGradientContainer.prototype.stepRegExp = /((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/;

module.exports = RadialGradientContainer;

},{"../color":7,"./GradientContainer":12}],15:[function(require,module,exports){
var GradientContainer = require('./GradientContainer');

function WebkitGradientContainer(imageData, container) {
  GradientContainer.call(this, imageData, container, container.parseBounds());
  this.type = (imageData.args[0] === "linear") ? this.TYPES.LINEAR : this.TYPES.RADIAL;
}

WebkitGradientContainer.prototype = Object.create(GradientContainer.prototype);

module.exports = WebkitGradientContainer;

},{"./GradientContainer":12}],16:[function(require,module,exports){
var Promise = require('./promise');

function ImageContainer(src, cors) {
  this.src = src;
  this.image = new Image();
  var self = this;
  this.tainted = null;
  this.promise = new Promise(function(resolve, reject) {
    self.image.onload = resolve;
    self.image.onerror = reject;
    if(cors) {
      self.image.crossOrigin = "anonymous";
    }
    self.image.src = src;
    if(self.image.complete === true) {
      resolve(self.image);
    }
  });
}

module.exports = ImageContainer;

},{"./promise":22}],17:[function(require,module,exports){
var Promise = require('./promise');
var log = require('./log');
var ImageContainer = require('./imagecontainer');
var DummyImageContainer = require('./dummyimagecontainer');
var ProxyImageContainer = require('./proxyimagecontainer');
var FrameContainer = require('./framecontainer');
var SVGContainer = require('./svg/SVGContainer');
var SVGNodeContainer = require('./svg/SVGNodeContainer');
var LinearGradientContainer = require('./gradient/LinearGradientContainer');
var RadialGradientContainer = require('./gradient/RadialGradientContainer');
var WebkitGradientContainer = require('./gradient/WebKitGradientContainer');
var bind = require('./utils').bind;

function ImageLoader(options, support) {
  this.link = null;
  this.options = options;
  this.support = support;
  this.origin = this.getOrigin(window.location.href);
}

ImageLoader.prototype.findImages = function(nodes) {
  var images = [];
  nodes.reduce(function(imageNodes, container) {
    switch(container.node.nodeName) {
      case "IMG":
        return imageNodes.concat([{
          args: [container.node.src],
          method: "url"
        }]);
      case "svg":
      case "IFRAME":
        return imageNodes.concat([{
          args: [container.node],
          method: container.node.nodeName
        }]);
    }
    return imageNodes;
  }, []).forEach(this.addImage(images, this.loadImage), this);
  return images;
};

ImageLoader.prototype.findBackgroundImage = function(images, container) {
  container.parseBackgroundImages().filter(this.hasImageBackground).forEach(this.addImage(images, this.loadImage, container), this);
  return images;
};

ImageLoader.prototype.addImage = function(images, callback, bounds) {
  return function(newImage) {
    newImage.args.forEach(function(image) {
      if(!this.imageExists(images, image)) {
        images.splice(0, 0, callback.call(this, newImage, bounds));
        log('Added image #' + (images.length), typeof(image) === "string" ? image.substring(0, 100) : image);
      }
    }, this);
  };
};

ImageLoader.prototype.hasImageBackground = function(imageData) {
  return imageData.method !== "none";
};

ImageLoader.prototype.loadImage = function(imageData, container) {
  if(imageData.method === "url") {
    var src = imageData.args[0];
    if(this.isSVG(src) && !this.options.allowTaint) {
      return new SVGContainer(src);
    } else if(src.match(/data:image\/.*;base64,/i)) {
      return new ImageContainer(src.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, ''), false);
    } else if(this.isSameOrigin(src) || this.options.allowTaint === true || this.isSVG(src)) {
      return new ImageContainer(src, false);
    } else if(this.support.cors && !this.options.allowTaint) {
      return new ImageContainer(src, true);
    } else if(this.options.proxy) {
      return new ProxyImageContainer(src, this.options.proxy);
    } else {
      return new DummyImageContainer(src);
    }
  } else if(imageData.method === "linear-gradient") {
    return new LinearGradientContainer(imageData, container);
  } else if(imageData.method === "radial-gradient") {
    return new RadialGradientContainer(imageData, container);
  } else if(imageData.method === "gradient") {
    return new WebkitGradientContainer(imageData, container);
  } else if(imageData.method === "svg") {
    return new SVGNodeContainer(imageData.args[0]);
  } else if(imageData.method === "IFRAME") {
    return new FrameContainer(imageData.args[0], this.isSameOrigin(imageData.args[0].src), this.options);
  } else {
    return new DummyImageContainer(imageData);
  }
};

ImageLoader.prototype.isSVG = function(src) {
  return src.substring(src.length - 3).toLowerCase() === "svg" || SVGContainer.prototype.isInline(src);
};

ImageLoader.prototype.imageExists = function(images, src) {
  return images.some(function(image) {
    return image.src === src;
  });
};

ImageLoader.prototype.isSameOrigin = function(url) {
  return (this.getOrigin(url) === this.origin);
};

ImageLoader.prototype.getOrigin = function(url) {
  var link = this.link || (this.link = document.createElement("a"));
  link.href = url;
  link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
  return link.protocol + link.hostname + link.port;
};

ImageLoader.prototype.getPromise = function(container) {
  return this.timeout(container, this.options.imageTimeout)['catch'](function() {
    var dummy = new DummyImageContainer(container.src);
    return dummy.promise.then(function(image) {
      container.image = image;
    });
  });
};

ImageLoader.prototype.get = function(src) {
  var found = null;
  return this.images.some(function(img) {
    return (found = img).src === src;
  }) ? found : null;
};

ImageLoader.prototype.fetch = function(nodes) {
  this.images = nodes.reduce(bind(this.findBackgroundImage, this), this.findImages(nodes));
  this.images.forEach(function(image, index) {
    image.promise.then(function() {
      log("Succesfully loaded image #" + (index + 1), image);
    }, function(e) {
      log("Failed loading image #" + (index + 1), image, e);
    });
  });
  this.ready = Promise.all(this.images.map(this.getPromise, this));
  log("Finished searching images");
  return this;
};

ImageLoader.prototype.timeout = function(container, timeout) {
  var timer;
  var promise = Promise.race([container.promise, new Promise(function(res, reject) {
    timer = setTimeout(function() {
      log("Timed out loading image", container);
      reject(container);
    }, timeout);
  })]).then(function(container) {
    clearTimeout(timer);
    return container;
  });
  promise['catch'](function() {
    clearTimeout(timer);
  });
  return promise;
};

module.exports = ImageLoader;

},{"./dummyimagecontainer":8,"./framecontainer":11,"./gradient/LinearGradientContainer":13,"./gradient/RadialGradientContainer":14,"./gradient/WebKitGradientContainer":15,"./imagecontainer":16,"./log":19,"./promise":22,"./proxyimagecontainer":24,"./svg/SVGContainer":30,"./svg/SVGNodeContainer":31,"./utils":34}],18:[function(require,module,exports){
var Promise = require('./promise');
var Support = require('./support');
var CanvasRenderer = require('./renderer/CanvasRenderer');
var ImageLoader = require('./imageloader');
var NodeParser = require('./nodeparser');
var NodeContainer = require('./nodecontainer');
var BoundingBox = require('./BoundingBox');
var log = require('./log');
var utils = require('./utils');
var createWindowClone = require('./clone');
var loadUrlDocument = require('./proxy').loadUrlDocument;
var getBounds = utils.getBounds;

var html2canvasNodeAttribute = "data-html2canvas-node";
var html2canvasCloneIndex = 0;

function html2canvas(nodeList, options) {
  var index = html2canvasCloneIndex++;
  options = options || {};
  if(!options.debug) {
    html2canvas.logging = true;
    html2canvas.start = Date.now();
  }

  options.async = typeof(options.async) === "undefined" ? true : options.async;
  options.allowTaint = typeof(options.allowTaint) === "undefined" ? false : options.allowTaint;
  options.removeContainer = typeof(options.removeContainer) === "undefined" ? true : options.removeContainer;
  options.javascriptEnabled = typeof(options.javascriptEnabled) === "undefined" ? false : options.javascriptEnabled;
  options.imageTimeout = typeof(options.imageTimeout) === "undefined" ? 10000 : options.imageTimeout;
  options.renderer = typeof(options.renderer) === "function" ? options.renderer : CanvasRenderer;
  options.strict = !!options.strict;

  if(typeof(nodeList) === "string") {
    log("Creating iframe for HTML contents");
    return new Promise(function(complete) {
      var frame = document.createElement("iframe");

      var blob = new Blob([nodeList], { type : 'text/html' });
      var src = URL.createObjectURL(blob);

      frame.src = src;
      frame.width = options.width || '100%';
      frame.height = options.height || '100%';
      frame.style.display = 'none';

      document.body.appendChild(frame);

      frame.onload = function() {
        var framedoc = frame.contentDocument || frame.contentWindow.document;

        html2canvas(framedoc.documentElement, options).then(function(canvas) {
          document.body.removeChild(frame);
          URL.revokeObjectURL(src);
          complete(canvas);
        });
      };
    });
  }

  var node = document.documentElement[0];

  if (nodeList) {
    node = (nodeList.length) ? nodeList[0] : nodeList;
  }

  function getWidth() {
    var children = Array.prototype.slice.call(node.ownerDocument.body.childNodes).map(function(child) {
      var bounds = utils.getBounds(child);
      return [bounds.x + child.innerWidth, bounds.x + child.scrollWidth];
    }).reduce(function(arr, child) {
      return arr.concat(child);
    }, []);

    return Math.max.apply(this, [
      node.scrollWidth,
      node.clientWidth,
      node.offsetWidth,
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    ].concat(children).filter(function(a) {
      return a;
    }));
  }

  function getHeight() {
    var children = Array.prototype.slice.call(node.ownerDocument.body.childNodes).map(function(child) {
      var bounds = utils.getBounds(child);
      return [bounds.y + child.innerHeight, bounds.y + child.scrollHeight];
    }).reduce(function(arr, child) {
      return arr.concat(child);
    }, []);

    return Math.max.apply(this, [
      node.scrollHeight,
      node.clientHeight,
      node.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ].concat(children).filter(function(a) {
      return a;
    }));
  }

  node.setAttribute(html2canvasNodeAttribute + index, index);
  var width = options.width != null ? options.width : getWidth();
  var height = options.height != null ? options.height : getHeight();

  return renderDocument(node.ownerDocument, options, width, height, index).then(function(canvas) {
    if(typeof(options.onrendered) === "function") {
      log("options.onrendered is deprecated, html2canvas returns a Promise containing the canvas");
      options.onrendered(canvas);
    }
    return canvas;
  });
}

html2canvas.Promise = Promise;
html2canvas.CanvasRenderer = CanvasRenderer;
html2canvas.NodeContainer = NodeContainer;
html2canvas.log = log;
html2canvas.utils = utils;

function renderDocument(document, options, windowWidth, windowHeight, html2canvasIndex) {
  return createWindowClone(document, document, windowWidth, windowHeight, options, document.defaultView.pageXOffset, document.defaultView.pageYOffset).then(function(container) {
    log("Document cloned");
    var attributeName = html2canvasNodeAttribute + html2canvasIndex;
    var selector = "[" + attributeName + "='" + html2canvasIndex + "']";
    document.querySelector(selector).removeAttribute(attributeName);
    var clonedWindow = container.contentWindow;
    var node = clonedWindow.document.querySelector(selector);
    var oncloneHandler = (typeof(options.onclone) === "function") ? Promise.resolve(options.onclone(clonedWindow.document)) : Promise.resolve(true);
    return oncloneHandler.then(function() {
      options.document = document;
      return renderWindow(node, container, options, windowWidth, windowHeight);
    });
  });
}

function renderWindow(node, container, options, windowWidth, windowHeight) {
  var clonedWindow = container.contentWindow;
  var support = new Support(clonedWindow.document);
  var imageLoader = new ImageLoader(options, support);
  var bounds = getBounds(node);
  var width = options.type === "view" ? windowWidth : documentWidth(clonedWindow.document);
  var height = options.type === "view" ? windowHeight : documentHeight(clonedWindow.document);
  var renderer = new options.renderer(width, height, imageLoader, options);
  var parser = new NodeParser(node, renderer, support, imageLoader, options);
  return parser.ready.then(function() {
    log("Finished rendering");
    var canvas;

    if(options.type === "view") {
      canvas = crop(renderer.canvas, new BoundingBox(
        0,
        0,
        renderer.canvas.width,
        renderer.canvas.height
      ));
    } else if(node === clonedWindow.document.body || node === clonedWindow.document.documentElement || options.canvas != null) {
      canvas = renderer.canvas;
    } else {
      canvas = crop(renderer.canvas, new BoundingBox(
        bounds.x,
        bounds.y,
        options.width != null ? bounds.x + options.width : bounds.y + bounds.width,
        options.width != null ? bounds.y + options.width : bounds.y + bounds.width
      ));
    }

    cleanupContainer(container, options);
    return canvas;
  });
}

function cleanupContainer(container, options) {
  if(options.removeContainer) {
    container.parentNode.removeChild(container);
    log("Cleaned up container");
  }
}

function crop(canvas, bounds) {
  var croppedCanvas = document.createElement("canvas");
  var x1 = Math.min(canvas.width - 1, Math.max(0, bounds.x));
  var x2 = Math.min(canvas.width, Math.max(1, bounds.x + bounds.width));
  var y1 = Math.min(canvas.height - 1, Math.max(0, bounds.y));
  var y2 = Math.min(canvas.height, Math.max(1, bounds.y + bounds.height));
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;
  log("Cropping canvas at:", "left:", bounds.x, "top:", bounds.y, "width:", (x2 - x1), "height:", (y2 - y1));
  log("Resulting crop with width", bounds.width, "and height", bounds.height, " with x", x1, "and y", y1);
  croppedCanvas.getContext("2d").drawImage(canvas, x1, y1, x2 - x1, y2 - y1, bounds.x, bounds.y, x2 - x1, y2 - y1);
  return croppedCanvas;
}

function documentWidth(doc) {
  return Math.max(
    Math.max(doc.body.scrollWidth, doc.documentElement.scrollWidth),
    Math.max(doc.body.offsetWidth, doc.documentElement.offsetWidth),
    Math.max(doc.body.clientWidth, doc.documentElement.clientWidth)
  );
}

function documentHeight(doc) {
  return Math.max(
    Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight),
    Math.max(doc.body.offsetHeight, doc.documentElement.offsetHeight),
    Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
  );
}

function absoluteUrl(url) {
  var link = document.createElement("a");
  link.href = url;
  link.href = link.href;
  return link;
}

module.exports = (typeof(document) === "undefined" || typeof(Object.create) !== "function" || typeof(document.createElement("canvas").getContext) !== "function") ? function() {
  return Promise.reject("No canvas support");
} : html2canvas;

},{"./BoundingBox":5,"./clone":6,"./imageloader":17,"./log":19,"./nodecontainer":20,"./nodeparser":21,"./promise":22,"./proxy":23,"./renderer/CanvasRenderer":26,"./support":29,"./utils":34}],19:[function(require,module,exports){
module.exports = function() {
  if(window.html2canvas.logging && window.console && window.console.log) {
    Function.prototype.bind.call(window.console.log, (window.console)).apply(window.console, [(Date.now() - window.html2canvas.start) + "ms", "html2canvas:"].concat([].slice.call(arguments, 0)));
  }
};

},{}],20:[function(require,module,exports){
var Color = require('./color');
var BoundingBox = require('./BoundingBox');
var utils = require('./utils');
var getBounds = utils.getBounds;
var parseBackgrounds = utils.parseBackgrounds;
var offsetBounds = utils.offsetBounds;

function NodeContainer(node, parent) {
  this.node = node;
  this.parent = parent;
  this.stack = null;
  this.bounds = null;
  this.borders = null;
  this.clip = [];
  this.backgroundClip = [];
  this.offsetBounds = null;
  this.visible = null;
  this.computedStyles = null;
  this.colors = {};
  this.styles = {};
  this.backgroundImages = null;
  this.transformData = null;
  this.transformMatrix = null;
  this.isPseudoElement = false;
  this.opacity = null;
}

NodeContainer.prototype.cloneTo = function(stack) {
  stack.visible = this.visible;
  stack.borders = this.borders;
  stack.bounds = this.bounds;
  stack.clip = this.clip;
  stack.backgroundClip = this.backgroundClip;
  stack.computedStyles = this.computedStyles;
  stack.styles = this.styles;
  stack.backgroundImages = this.backgroundImages;
  stack.opacity = this.opacity;
};

NodeContainer.prototype.getOpacity = function() {
  return this.opacity === null ? (this.opacity = this.cssFloat('opacity')) : this.opacity;
};

NodeContainer.prototype.assignStack = function(stack) {
  this.stack = stack;
  stack.children.push(this);
};

NodeContainer.prototype.isElementVisible = function() {
  return this.node.nodeType === Node.TEXT_NODE ? this.parent.visible : (
  this.css('display') !== "none" &&
  this.css('visibility') !== "hidden" && !this.node.hasAttribute("data-html2canvas-ignore") &&
  (this.node.nodeName !== "INPUT" || this.node.getAttribute("type") !== "hidden")
  );
};

NodeContainer.prototype.css = function(attribute) {
  if(!this.computedStyles) {
    this.computedStyles = this.isPseudoElement ? this.parent.computedStyle(this.before ? ":before" : ":after") : this.computedStyle(null);
  }

  return this.styles[attribute] || (this.styles[attribute] = this.computedStyles[attribute]);
};

NodeContainer.prototype.prefixedCss = function(attribute) {
  var prefixes = ["webkit", "moz", "ms", "o"];
  var value = this.css(attribute);
  if(value === undefined) {
    prefixes.some(function(prefix) {
      value = this.css(prefix + attribute.substr(0, 1).toUpperCase() + attribute.substr(1));
      return value !== undefined;
    }, this);
  }
  return value === undefined ? null : value;
};

NodeContainer.prototype.computedStyle = function(type) {
  return this.node.ownerDocument.defaultView.getComputedStyle(this.node, type);
};

NodeContainer.prototype.cssInt = function(attribute) {
  var value = parseInt(this.css(attribute), 10);
  return (isNaN(value)) ? 0 : value; // borders in old IE are throwing 'medium' for demo.html
};

NodeContainer.prototype.color = function(attribute) {
  return this.colors[attribute] || (this.colors[attribute] = new Color(this.css(attribute)));
};

NodeContainer.prototype.cssFloat = function(attribute) {
  var value = parseFloat(this.css(attribute));
  return (isNaN(value)) ? 0 : value;
};

NodeContainer.prototype.fontWeight = function() {
  var weight = this.css("fontWeight");
  switch(parseInt(weight, 10)) {
    case 401:
      weight = "bold";
      break;
    case 400:
      weight = "normal";
      break;
  }
  return weight;
};

NodeContainer.prototype.parseClip = function() {
  var matches = this.css('clip').match(this.CLIP);
  if(matches) {
    return new BoundingBox(
      parseInt(matches[4], 10),
      parseInt(matches[1], 10),
      parseInt(matches[2], 10),
      parseInt(matches[3], 10)
    );
  }
  return null;
};

NodeContainer.prototype.parseBackgroundImages = function() {
  return this.backgroundImages || (this.backgroundImages = parseBackgrounds(this.css("backgroundImage")));
};

NodeContainer.prototype.cssList = function(property, index) {
  var value = (this.css(property) || '').split(',');
  value = value[index || 0] || value[0] || 'auto';
  value = value.trim().split(' ');
  if(value.length === 1) {
    value = [value[0], isPercentage(value[0]) ? 'auto' : value[0]];
  }
  return value;
};

NodeContainer.prototype.parseBackgroundSize = function(bounds, image, index) {
  var size = this.cssList("backgroundSize", index);
  var width, height;

  if(isPercentage(size[0])) {
    width = bounds.width * parseFloat(size[0]) / 100;
  } else if(/contain|cover/.test(size[0])) {
    var targetRatio = bounds.width / bounds.height, currentRatio = image.width / image.height;
    return (targetRatio < currentRatio ^ size[0] === 'contain') ? {
      width: bounds.height * currentRatio,
      height: bounds.height
    } : {width: bounds.width, height: bounds.width / currentRatio};
  } else {
    width = parseInt(size[0], 10);
  }

  if(size[0] === 'auto' && size[1] === 'auto') {
    height = image.height;
  } else if(size[1] === 'auto') {
    height = width / image.width * image.height;
  } else if(isPercentage(size[1])) {
    height = bounds.height * parseFloat(size[1]) / 100;
  } else {
    height = parseInt(size[1], 10);
  }

  if(size[0] === 'auto') {
    width = height / image.height * image.width;
  }

  return {width: width, height: height};
};

NodeContainer.prototype.parseBackgroundPosition = function(bounds, image, index, backgroundSize) {
  var position = this.cssList('backgroundPosition', index);
  var left, top;

  if(isPercentage(position[0])) {
    left = (bounds.width - (backgroundSize || image).width) * (parseFloat(position[0]) / 100);
  } else {
    left = parseInt(position[0], 10);
  }

  if(position[1] === 'auto') {
    top = left / image.width * image.height;
  } else if(isPercentage(position[1])) {
    top = (bounds.height - (backgroundSize || image).height) * parseFloat(position[1]) / 100;
  } else {
    top = parseInt(position[1], 10);
  }

  if(position[0] === 'auto') {
    left = top / image.height * image.width;
  }

  return new BoundingBox(left, top);
};

NodeContainer.prototype.parseBackgroundRepeat = function(index) {
  return this.cssList("backgroundRepeat", index)[0];
};

NodeContainer.prototype.SHADOW_PROPERTY = /(?!\([0-9\s.]+),(?![0-9\s.,]+\))/g;

NodeContainer.prototype.BOX_SHADOW_VALUES = /(inset)|(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;
NodeContainer.prototype.TEXT_SHADOW_VALUES = /(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;

NodeContainer.prototype.parseBoxShadows = function() {
  var boxShadow = this.css("boxShadow");
  var results = [];

  if(boxShadow && boxShadow !== 'none') {
    var shadows = boxShadow.split(this.SHADOW_PROPERTY);
    for(var i = 0; shadows && (i < shadows.length); i++) {
      var s = shadows[i].match(this.BOX_SHADOW_VALUES);

      var ci = s[0] === 'inset' ? 1 : 0;
      var color = new Color(s[ci]);

      var result = {
        color: color,
        offsetX: s[ci + 1] && s[ci + 1] !== 'inset' ? parseFloat(s[ci + 1]) : 0,
        offsetY: s[ci + 2] && s[ci + 2] !== 'inset' ? parseFloat(s[ci + 2]) : 0,
        blur: s[ci + 3] && s[ci + 3] !== 'inset' ? parseFloat(s[ci + 3]) : 0,
        spread: s[ci + 4] && s[ci + 4] !== 'inset' ? parseFloat(s[ci + 4]) : 0
      };

      if(ci === 1 || s[s.length - 1] === 'inset') {
        result.inset = true;
      }

      results.push(result);
    }
  }

  return results;
};

NodeContainer.prototype.parseTextShadows = function() {
  var textShadow = this.css("textShadow");
  var results = [];

  if(textShadow && textShadow !== 'none') {
    var shadows = textShadow.split(this.SHADOW_PROPERTY);
    for(var i = 0; shadows && (i < shadows.length); i++) {
      var s = shadows[i].match(this.TEXT_SHADOW_VALUES);

      var ci = s[0].indexOf('rgb') > -1 ? 0 : 3;
      var color = new Color(s[ci]);

      results.push({
        color: color,
        offsetX: s[(ci + 1) % 4] ? parseFloat(s[(ci + 1) % 4].replace('px', '')) : 0,
        offsetY: s[(ci + 2) % 4] ? parseFloat(s[(ci + 2) % 4].replace('px', '')) : 0,
        blur: s[(ci + 3) % 4] ? s[(ci + 3) % 4].replace('px', '') : 0
      });
    }
  }
  return results;
};

NodeContainer.prototype.parseTransform = function() {
  if(!this.transformData) {
    if(this.hasTransform()) {
      var offset = this.parseBounds();
      var origin = this.prefixedCss("transformOrigin").split(" ").map(removePx).map(asFloat);
      origin[0] += offset.x;
      origin[1] += offset.y;
      this.transformData = {
        origin: origin,
        matrix: this.parseTransformMatrix()
      };
    } else {
      this.transformData = {
        origin: [0, 0],
        matrix: [1, 0, 0, 1, 0, 0]
      };
    }
  }
  return this.transformData;
};

NodeContainer.prototype.parseTransformMatrix = function() {
  if(!this.transformMatrix) {
    var transform = this.prefixedCss("transform");
    var matrix = transform ? parseMatrix(transform.match(this.MATRIX_PROPERTY)) : null;
    this.transformMatrix = matrix ? matrix : [1, 0, 0, 1, 0, 0];
  }
  return this.transformMatrix;
};

NodeContainer.prototype.parseBounds = function() {
  return this.bounds || (this.bounds = this.hasTransform() ? offsetBounds(this.node) : getBounds(this.node));
};

NodeContainer.prototype.hasTransform = function() {
  return this.parseTransformMatrix().join(",") !== "1,0,0,1,0,0" || (this.parent && this.parent.hasTransform());
};

NodeContainer.prototype.getValue = function() {
  var value = this.node.value || "";
  if(this.node.tagName === "SELECT") {
    value = selectionValue(this.node);
  } else if(this.node.type === "password") {
    value = Array(value.length + 1).join('\u2022'); // jshint ignore:line
  }
  return value.length === 0 ? (this.node.placeholder || "") : value;
};

NodeContainer.prototype.MATRIX_PROPERTY = /(matrix)\((.+)\)/;
NodeContainer.prototype.MATRIX_PROPERTY = /(matrix|matrix3d)\((.+)\)/;
NodeContainer.prototype.CLIP = /^rect\((\d+)px,? (\d+)px,? (\d+)px,? (\d+)px\)$/;

function selectionValue(node) {
  var option = node.options[node.selectedIndex || 0];
  return option ? (option.text || "") : "";
}

function parseMatrix(match) {
  if(match && match[1] === "matrix") {
    return match[2].split(",").map(function(s) {
      return parseFloat(s.trim());
    });
  } else if(match && match[1] === "matrix3d") {
    var matrix3d = match[2].split(",").map(function(s) {
      return parseFloat(s.trim());
    });
    return [matrix3d[0], matrix3d[1], matrix3d[4], matrix3d[5], matrix3d[12], matrix3d[13]];
  }
}

function isPercentage(value) {
  return value.toString().indexOf("%") !== -1;
}

function removePx(str) {
  return str.replace("px", "");
}

function asFloat(str) {
  return parseFloat(str);
}

module.exports = NodeContainer;

},{"./BoundingBox":5,"./color":7,"./utils":34}],21:[function(require,module,exports){
var log = require('./log');
var punycode = require('punycode');
var BoundingBox = require('./BoundingBox');
var NodeContainer = require('./nodecontainer');
var TextContainer = require('./textcontainer');
var PseudoElementContainer = require('./pseudoelementcontainer');
var FontMetrics = require('./fontmetrics');
var Color = require('./color');
var Promise = require('./promise');
var StackingContext = require('./stackingcontext');
var utils = require('./utils');
var bind = utils.bind;
var getBounds = utils.getBounds;
var parseBackgrounds = utils.parseBackgrounds;
var offsetBounds = utils.offsetBounds;

function NodeParser(element, renderer, support, imageLoader, options) {
  log("Starting NodeParser");
  this.renderer = renderer;
  this.options = options;
  this.range = null;
  this.support = support;
  this.renderQueue = [];
  this.stack = new StackingContext(true, 1, element.ownerDocument, null);
  var parent = new NodeContainer(element, null);
  if(options.background) {
    renderer.rectangle(0, 0, renderer.width, renderer.height, new Color(options.background));
  }
  if(element === element.ownerDocument.documentElement) {
    // http://www.w3.org/TR/css3-background/#special-backgrounds
    var canvasBackground = new NodeContainer(parent.color('backgroundColor').isTransparent() ? element.ownerDocument.body : element.ownerDocument.documentElement, null);
    renderer.rectangle(0, 0, renderer.width, renderer.height, canvasBackground.color('backgroundColor'));
  }

  parent.visibile = parent.isElementVisible();
  this.createPseudoHideStyles(element.ownerDocument);
  this.disableAnimations(element.ownerDocument);
  this.nodes = flatten([parent].concat(this.getChildren(parent)).filter(function(container) {
    return container.visible = container.isElementVisible();
  }).map(this.getPseudoElements, this));

  this.fontMetrics = new FontMetrics();
  log("Fetched nodes, total:", this.nodes.length);

  log("Calculate overflow clips");
  this.calculateOverflowClips();

  log("Start fetching images");
  this.images = imageLoader.fetch(this.nodes.filter(isElement));
  this.ready = this.images.ready.then(bind(function() {
    log("Images loaded, starting parsing");
    log("Creating stacking contexts");
    this.createStackingContexts();
    log("Sorting stacking contexts");
    this.sortStackingContexts(this.stack);
    this.parse(this.stack);
    log("Render queue created with " + this.renderQueue.length + " items");
    return new Promise(bind(function(resolve) {
      if(!options.async) {
        this.renderQueue.forEach(this.paint, this);
        resolve();
      } else if(typeof(options.async) === "function") {
        options.async.call(this, this.renderQueue, resolve);
      } else if(this.renderQueue.length > 0) {
        this.renderIndex = 0;
        this.asyncRenderer(this.renderQueue, resolve);
      } else {
        resolve();
      }
    }, this));
  }, this));
}

NodeParser.prototype.calculateOverflowClips = function() {
  this.nodes.forEach(function(container) {
    if(isElement(container)) {
      if(isPseudoElement(container)) {
        container.appendToDOM();
      }
      container.borders = this.parseBorders(container);

      var clip = (container.css('overflow') === "hidden") ? [["transform", container.parseTransform()], container.borders.clip] : [["transform", container.parseTransform()]];
      var cssClip = container.parseClip();
      if(cssClip && ["absolute", "fixed"].indexOf(container.css('position')) !== -1) {
        clip.push([["rect",
          container.bounds.x + cssClip.x,
          container.bounds.y + cssClip.y,
          cssClip.x2 - cssClip.x,
          cssClip.y2 - cssClip.y
        ]]);
      }

      container.clip = hasParentClip(container) ? container.parent.clip.concat(clip) : clip;
      container.backgroundClip = (container.css('overflow') !== "hidden") ? container.clip.concat([container.borders.clip]) : container.clip;
      if(isPseudoElement(container)) {
        container.cleanDOM();
      }
    } else if(isTextNode(container)) {
      container.clip = hasParentClip(container) ? container.parent.clip : [];
    }
    if(!isPseudoElement(container)) {
      container.bounds = null;
    }
  }, this);
};

function hasParentClip(container) {
  return container.parent && container.parent.clip.length;
}

NodeParser.prototype.asyncRenderer = function(queue, resolve, asyncTimer) {
  asyncTimer = asyncTimer || Date.now();
  this.paint(queue[this.renderIndex++]);
  if(queue.length === this.renderIndex) {
    resolve();
  } else if(asyncTimer + 20 > Date.now()) {
    this.asyncRenderer(queue, resolve, asyncTimer);
  } else {
    setTimeout(bind(function() {
      this.asyncRenderer(queue, resolve);
    }, this), 0);
  }
};

NodeParser.prototype.createPseudoHideStyles = function(document) {
  this.createStyles(document, '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + ':before { content: "" !important; display: none !important; }' +
  '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER + ':after { content: "" !important; display: none !important; }');
};

NodeParser.prototype.disableAnimations = function(document) {
  this.createStyles(document, '* { -webkit-animation: none !important; -moz-animation: none !important; -o-animation: none !important; animation: none !important; ' +
  '-webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; transition: none !important;}');
};

NodeParser.prototype.createStyles = function(document, styles) {
  var hidePseudoElements = document.createElement('style');
  hidePseudoElements.innerHTML = styles;
  document.body.appendChild(hidePseudoElements);
};

NodeParser.prototype.getPseudoElements = function(container) {
  var nodes = [[container]];
  if(container.node.nodeType === Node.ELEMENT_NODE) {
    var before = this.getPseudoElement(container, ":before");
    var after = this.getPseudoElement(container, ":after");

    if(before) {
      nodes.push(before);
    }

    if(after) {
      nodes.push(after);
    }
  }
  return flatten(nodes);
};

function toCamelCase(str) {
  return str.replace(/(\-[a-z])/g, function(match) {
    return match.toUpperCase().replace('-', '');
  });
}

NodeParser.prototype.getPseudoElement = function(container, type) {
  var style = container.computedStyle(type);
  if(!style || !style.content || style.content === "none" || style.content === "-moz-alt-content" || style.display === "none") {
    return null;
  }

  var content = stripQuotes(style.content);
  var isImage = content.substr(0, 3) === 'url';
  var pseudoNode = document.createElement(isImage ? 'img' : 'html2canvaspseudoelement');
  var pseudoContainer = new PseudoElementContainer(pseudoNode, container, type);

  for(var i = style.length - 1; i >= 0; i--) {
    var property = toCamelCase(style.item(i));
    pseudoNode.style[property] = style[property];
  }

  pseudoNode.className = PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + " " + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER;

  if(isImage) {
    pseudoNode.src = parseBackgrounds(content)[0].args[0];
    return [pseudoContainer];
  } else {
    var text = document.createTextNode(content);
    pseudoNode.appendChild(text);
    return [pseudoContainer, new TextContainer(text, pseudoContainer)];
  }
};


NodeParser.prototype.getChildren = function(parentContainer) {
  return flatten([].filter.call(parentContainer.node.childNodes, renderableNode).map(function(node) {
    var container = [node.nodeType === Node.TEXT_NODE ? new TextContainer(node, parentContainer) : new NodeContainer(node, parentContainer)].filter(nonIgnoredElement);
    return node.nodeType === Node.ELEMENT_NODE && container.length && node.tagName !== "TEXTAREA" && node.tagName !== "svg" ? (container[0].isElementVisible() ? container.concat(this.getChildren(container[0])) : []) : container;
  }, this));
};

NodeParser.prototype.newStackingContext = function(container, hasOwnStacking) {
  var stack = new StackingContext(hasOwnStacking, container.getOpacity(), container.node, container.parent);
  container.cloneTo(stack);
  var parentStack = hasOwnStacking ? stack.getParentStack(this) : stack.parent.stack;
  parentStack.contexts.push(stack);
  container.stack = stack;
};

NodeParser.prototype.createStackingContexts = function() {
  this.nodes.forEach(function(container) {
    if(isElement(container) && (this.isRootElement(container) || hasOpacity(container) || isPositionedForStacking(container) || this.isBodyWithTransparentRoot(container) || container.hasTransform())) {
      this.newStackingContext(container, true);
    } else if(isElement(container) && ((isPositioned(container) && zIndex0(container)) || isInlineBlock(container) || isFloating(container))) {
      this.newStackingContext(container, false);
    } else {
      container.assignStack(container.parent.stack);
    }
  }, this);
};

NodeParser.prototype.isBodyWithTransparentRoot = function(container) {
  return container.node.nodeName === "BODY" && container.parent.color('backgroundColor').isTransparent();
};

NodeParser.prototype.isRootElement = function(container) {
  return container.parent === null;
};

NodeParser.prototype.sortStackingContexts = function(stack) {
  stack.contexts.sort(zIndexSort(stack.contexts.slice(0)));
  stack.contexts.forEach(this.sortStackingContexts, this);
};

NodeParser.prototype.parseTextBounds = function(container) {
  return function(text, index, textList) {
    if(container.parent.css("textDecoration").substr(0, 4) !== "none" || text.trim().length !== 0) {
      if(this.support.rangeBounds && !container.parent.hasTransform()) {
        var offset = textList.slice(0, index).join("").length;
        return this.getRangeBounds(container.node, offset, text.length);
      } else if(container.node && typeof(container.node.data) === "string") {
        var replacementNode = container.node.splitText(text.length);
        var bounds = this.getWrapperBounds(container.node, container.parent.hasTransform());
        container.node = replacementNode;
        return bounds;
      }
    } else if(!this.support.rangeBounds || container.parent.hasTransform()) {
      container.node = container.node.splitText(text.length);
    }
    return new BoundingBox();
  };
};

NodeParser.prototype.getWrapperBounds = function(node, transform) {
  var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
  var parent = node.parentNode,
    backupText = node.cloneNode(true);

  wrapper.appendChild(node.cloneNode(true));
  parent.replaceChild(wrapper, node);
  var bounds = transform ? offsetBounds(wrapper) : getBounds(wrapper);
  parent.replaceChild(backupText, wrapper);
  return bounds;
};

NodeParser.prototype.getRangeBounds = function(node, offset, length) {
  var range = this.range || (this.range = node.ownerDocument.createRange());
  range.setStart(node, offset);
  range.setEnd(node, offset + length);
  var rect = range.getBoundingClientRect();
  return new BoundingBox(rect.left, rect.top, rect.right, rect.bottom);
};

function ClearTransform() {
}

NodeParser.prototype.parse = function(stack) {
  // http://www.w3.org/TR/CSS21/visuren.html#z-index
  var negativeZindex = stack.contexts.filter(negativeZIndex); // 2. the child stacking contexts with negative stack levels (most negative first).
  var descendantElements = stack.children.filter(isElement);
  var descendantNonFloats = descendantElements.filter(not(isFloating));
  var nonInlineNonPositionedDescendants = descendantNonFloats.filter(not(isPositioned)).filter(not(inlineLevel)); // 3 the in-flow, non-inline-level, non-positioned descendants.
  var nonPositionedFloats = descendantElements.filter(not(isPositioned)).filter(isFloating); // 4. the non-positioned floats.
  var inFlow = descendantNonFloats.filter(not(isPositioned)).filter(inlineLevel); // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
  var stackLevel0 = stack.contexts.concat(descendantNonFloats.filter(isPositioned)).filter(zIndex0); // 6. the child stacking contexts with stack level 0 and the positioned descendants with stack level 0.
  var text = stack.children.filter(isTextNode).filter(hasText);
  var positiveZindex = stack.contexts.filter(positiveZIndex); // 7. the child stacking contexts with positive stack levels (least positive first).
  negativeZindex.concat(nonInlineNonPositionedDescendants).concat(nonPositionedFloats)
    .concat(inFlow).concat(stackLevel0).concat(text).concat(positiveZindex).forEach(function(container) {
      this.renderQueue.push(container);
      if(isStackingContext(container)) {
        this.parse(container);
        this.renderQueue.push(new ClearTransform());
      }
    }, this);
};

NodeParser.prototype.paint = function(container) {
  try {
    if(container instanceof ClearTransform) {
      this.renderer.restore();
    } else if(isTextNode(container)) {
      if(isPseudoElement(container.parent)) {
        container.parent.appendToDOM();
      }
      this.paintText(container);
      if(isPseudoElement(container.parent)) {
        container.parent.cleanDOM();
      }
    } else {
      this.paintNode(container);
    }
  } catch(e) {
    log(e);
    if(this.options.strict) {
      throw e;
    }
  }
};

NodeParser.prototype.paintNode = function(container) {
  if(isStackingContext(container)) {
    this.renderer.setOpacity(container.opacity);
    this.renderer.save();
    this.renderer.setTransform(container.parseTransform());
  }

  if(container.node.nodeName === "INPUT" && container.node.type === "checkbox") {
    this.paintCheckbox(container);
  } else if(container.node.nodeName === "INPUT" && container.node.type === "radio") {
    this.paintRadio(container);
  } else {
    this.paintElement(container);
  }
};

NodeParser.prototype.paintElement = function(container) {
  var bounds = container.parseBounds();

  var shadows = container.parseBoxShadows();
  if(shadows.length > 0) {
    shadows.forEach(function(shadow) {
      if(shadow.inset)
        return;

      shadow.blur = shadow.blur * this.renderer.getTransform().matrix[0];

      var alpha = shadow.color.a;
      shadow.color.a = 255;
      this.renderer.setShadow(shadow.color.toString(), shadow.offsetX, shadow.offsetY, shadow.blur);
      shadow.color.a = alpha;

      var newBounds = bounds.clone();

      newBounds.inflate(shadow.spread);

      if(container.css('boxSizing') === 'content-box') {
        newBounds.x += container.borders.borders[3].width;
        newBounds.y += container.borders.borders[0].width;
        newBounds.x2 -= container.borders.borders[1].width;
        newBounds.y2 -= 2 * container.borders.borders[2].width;
      }

      newBounds.x += shadow.offsetX;
      newBounds.y += shadow.offsetY;
      newBounds.x2 += shadow.offsetX;
      newBounds.y2 += shadow.offsetY;

      var radius = getBorderRadiusData(container, container.borders.borders, newBounds);
      var borderPoints = calculateCurvePoints(newBounds, radius, container.borders.borders);

      this.renderer.drawShape(this.parseBackgroundClip(container, borderPoints, container.borders.borders, radius, newBounds), shadow.color);

      this.renderer.clearShadow();
    }, this);
  }

  this.renderer.clip(container.backgroundClip, function() {
    this.renderer.renderBackground(container, bounds, container.borders.borders.map(getWidth));
  }, this);

  this.renderer.clip(container.backgroundClip, function() {
    if(shadows.length > 0) {
      shadows.forEach(function(shadow) {
        if(!shadow.inset)
          return;

        shadow.blur = shadow.blur * this.renderer.getTransform().matrix[0];

        var alpha = shadow.color.a;
        shadow.color.a = 255;
        this.renderer.setShadow(shadow.color.toString(), 0, 0, shadow.blur);
        shadow.color.a = alpha;
        this.renderer.setFillStyle(shadow.color);

        var newBounds = bounds.clone();

        newBounds.inflate(-shadow.spread);

        if(container.css('boxSizing') === 'content-box') {
          newBounds.x += container.borders.borders[3].width;
          newBounds.y += container.borders.borders[0].width;
          newBounds.x2 -= container.borders.borders[1].width;
          newBounds.y2 -= container.borders.borders[2].width;
        }

        newBounds.x += shadow.offsetX;
        newBounds.y += shadow.offsetY;
        newBounds.x2 += shadow.offsetX;
        newBounds.y2 += shadow.offsetY;

        var radius = getBorderRadiusData(container, container.borders.borders, newBounds);
        var borderPoints = calculateCurvePoints(newBounds, radius, container.borders.borders);

        this.renderer.shape(this.parseBackgroundClip(container, borderPoints, container.borders.borders, radius, newBounds));
        this.renderer.ctx.rect(bounds.x - newBounds.width, newBounds.y - newBounds.height, newBounds.width * 3, newBounds.height * 3);
        this.renderer.ctx.fill('evenodd');

        this.renderer.clearShadow();
      }, this);
    }
  }, this);

  this.renderer.clip(container.clip, function() {
    this.renderer.renderBorders(container.borders.borders);
  }, this);

  function drawSvg() {
    var imgContainer = this.images.get(container.node);
    if(imgContainer) {
      this.renderer.renderImage(container, imgContainer.getBounds(bounds), container.borders, imgContainer);
    } else {
      log("Error loading <" + container.node.nodeName + ">", container.node);
    }
  }

  if(container.node.nodeName === 'svg') {
    if(container.css('overflow') === 'visible') {
      drawSvg.bind(this)();
    } else {
      this.renderer.clip(container.backgroundClip, function() {
        drawSvg.bind(this)();
      }, this);
    }
  }

  this.renderer.clip(container.backgroundClip, function() {
    switch(container.node.nodeName) {
      case "IFRAME":
        var imgContainer = this.images.get(container.node);
        if(imgContainer) {
          this.renderer.renderImage(container, bounds, container.borders, imgContainer);
        } else {
          log("Error loading <" + container.node.nodeName + ">", container.node);
        }
        break;
      case "IMG":
        var imageContainer = this.images.get(container.node.src);
        if(imageContainer) {
          this.renderer.renderImage(container, bounds, container.borders, imageContainer);
        } else {
          log("Error loading <img>", container.node.src);
        }
        break;
      case "CANVAS":
        this.renderer.renderImage(container, bounds, container.borders, {image: container.node});
        break;
      case "SELECT":
      case "INPUT":
      case "TEXTAREA":
        this.paintFormValue(container);
        break;
    }
  }, this);
};

NodeParser.prototype.paintCheckbox = function(container) {
  var b = container.parseBounds();

  var size = Math.min(b.width, b.height);
  var bounds = {width: size - 1, height: size - 1, top: b.y, left: b.x};
  var r = [3, 3];
  var radius = [r, r, r, r];
  var borders = [1, 1, 1, 1].map(function(w) {
    return {color: new Color('#A5A5A5'), width: w};
  });

  var borderPoints = calculateCurvePoints(bounds, radius, borders);

  this.renderer.clip(container.backgroundClip, function() {
    this.renderer.rectangle(bounds.x + 1, bounds.y + 1, bounds.width - 2, bounds.height - 2, new Color("#DEDEDE"));
    this.renderer.renderBorders(calculateBorders(borders, bounds, borderPoints, radius));
    if(container.node.checked) {
      this.renderer.font(new Color('#424242'), 'normal', 'normal', 'bold', (size - 3) + "px", 'arial');
      this.renderer.text("\u2714", bounds.x + size / 6, bounds.y + size - 1);
    }
  }, this);
};

NodeParser.prototype.paintRadio = function(container) {
  var bounds = container.parseBounds();

  var size = Math.min(bounds.width, bounds.height) - 2;

  this.renderer.clip(container.backgroundClip, function() {
    this.renderer.circleStroke(bounds.x + 1, bounds.y + 1, size, new Color('#DEDEDE'), 1, new Color('#A5A5A5'));
    if(container.node.checked) {
      this.renderer.circle(Math.ceil(bounds.x + size / 4) + 1, Math.ceil(bounds.y + size / 4) + 1, Math.floor(size / 2), new Color('#424242'));
    }
  }, this);
};

NodeParser.prototype.paintFormValue = function(container) {
  var value = container.getValue();
  if(value.length > 0) {
    var document = container.node.ownerDocument;
    var wrapper = document.createElement('html2canvaswrapper');
    var properties = ['lineHeight', 'textAlign', 'fontFamily', 'fontWeight', 'fontSize', 'color',
      'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
      'width', 'height', 'borderLeftStyle', 'borderTopStyle', 'borderLeftWidth', 'borderTopWidth',
      'boxSizing', 'whiteSpace', 'wordWrap'];

    properties.forEach(function(property) {
      try {
        wrapper.style[property] = container.css(property);
      } catch(e) {
        // Older IE has issues with "border"
        log("html2canvas: Parse: Exception caught in renderFormValue: " + e.message);
      }
    });
    var bounds = container.parseBounds();
    wrapper.style.position = "fixed";
    wrapper.style.x = bounds.x + "px";
    wrapper.style.y = bounds.y + "px";
    wrapper.textContent = value;
    document.body.appendChild(wrapper);
    this.paintText(new TextContainer(wrapper.firstChild, container));
    document.body.removeChild(wrapper);
  }
};

NodeParser.prototype.paintText = function(container) {
  container.applyTextTransform();
  var characters = punycode.ucs2.decode(container.node.data);
  var textList = (!this.options.letterRendering || noLetterSpacing(container)) && !hasUnicode(container.node.data) ? getWords(characters) : characters.map(function(character) {
    return punycode.ucs2.encode([character]);
  });

  var weight = container.parent.fontWeight();
  var size = container.parent.css('fontSize');
  var family = container.parent.css('fontFamily');
  var shadows = container.parent.parseTextShadows();

  this.renderer.font(container.parent.color('color'), container.parent.css('fontStyle'), container.parent.css('fontVariant'), weight, size, family);
  if(shadows.length) {
    // TODO: support multiple text shadows
    this.renderer.setShadow(shadows[0].color, shadows[0].offsetX, shadows[0].offsetY, shadows[0].blur);
  } else {
    this.renderer.clearShadow();
  }

  this.renderer.clip(container.parent.clip, function() {
    textList.map(this.parseTextBounds(container), this).forEach(function(bounds, index) {
      if(bounds) {
        this.renderer.text(textList[index], bounds.x, bounds.y2);
        this.renderTextDecoration(container.parent, bounds, this.fontMetrics.getMetrics(family, size));
      }
    }, this);
  }, this);
};

NodeParser.prototype.renderTextDecoration = function(container, bounds, metrics) {
  switch(container.css("textDecoration").split(" ")[0]) {
    case "underline":
      // Draws a line at the baseline of the font
      // TODO As some browsers display the line as more than 1px if the font-size is big, need to take that into account both in position and size
      this.renderer.rectangle(bounds.x, Math.round(bounds.y + metrics.baseline + metrics.lineWidth), bounds.width, 1, container.color("color"));
      break;
    case "overline":
      this.renderer.rectangle(bounds.x, Math.round(bounds.y), bounds.width, 1, container.color("color"));
      break;
    case "line-through":
      // TODO try and find exact position for line-through
      this.renderer.rectangle(bounds.x, Math.ceil(bounds.y + metrics.middle + metrics.lineWidth), bounds.width, 1, container.color("color"));
      break;
  }
};

var borderColorTransforms = {
  inset: [
    ["darken", 0.60],
    ["darken", 0.10],
    ["darken", 0.10],
    ["darken", 0.60]
  ]
};

NodeParser.prototype.parseBorders = function(container) {
  var nodeBounds = container.parseBounds();
  var borders = ["Top", "Right", "Bottom", "Left"].map(function(side, index) {
    var style = container.css('border' + side + 'Style');
    var color = container.color('border' + side + 'Color');
    if(style === "inset" && color.isBlack()) {
      color = new Color([255, 255, 255, color.a]); // this is wrong, but
    }
    var colorTransform = borderColorTransforms[style] ? borderColorTransforms[style][index] : null;
    return {
      width: container.cssInt('border' + side + 'Width'),
      color: colorTransform ? color[colorTransform[0]](colorTransform[1]) : color,
      args: null
    };
  });
  var radius = getBorderRadiusData(container, borders);
  var borderPoints = calculateCurvePoints(nodeBounds, radius, borders);

  return {
    clip: this.parseBackgroundClip(container, borderPoints, borders, radius, nodeBounds),
    borders: calculateBorders(borders, nodeBounds, borderPoints, radius)
  };
};

function calculateBorders(borders, nodeBounds, borderPoints, radius) {
  return borders.map(function(border, borderSide) {
    if(border.width > 0) {
      var bx = nodeBounds.x;
      var by = nodeBounds.y;
      var bw = nodeBounds.width;
      var bh = nodeBounds.height - (borders[2].width);

      switch(borderSide) {
        case 0:
          // top border
          bh = borders[0].width;
          border.args = drawSide({
              c1: [bx, by],
              c2: [bx + bw, by],
              c3: [bx + bw - borders[1].width, by + bh],
              c4: [bx + borders[3].width, by + bh]
            }, radius[0], radius[1],
            borderPoints.topLeftOuter, borderPoints.topLeftInner, borderPoints.topRightOuter, borderPoints.topRightInner);
          break;
        case 1:
          // right border
          bx = nodeBounds.x + nodeBounds.width - (borders[1].width);
          bw = borders[1].width;

          border.args = drawSide({
              c1: [bx + bw, by],
              c2: [bx + bw, by + bh + borders[2].width],
              c3: [bx, by + bh],
              c4: [bx, by + borders[0].width]
            }, radius[1], radius[2],
            borderPoints.topRightOuter, borderPoints.topRightInner, borderPoints.bottomRightOuter, borderPoints.bottomRightInner);
          break;
        case 2:
          // bottom border
          by = (by + nodeBounds.height) - (borders[2].width);
          bh = borders[2].width;
          border.args = drawSide({
              c1: [bx + bw, by + bh],
              c2: [bx, by + bh],
              c3: [bx + borders[3].width, by],
              c4: [bx + bw - borders[3].width, by]
            }, radius[2], radius[3],
            borderPoints.bottomRightOuter, borderPoints.bottomRightInner, borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner);
          break;
        case 3:
          // left border
          bw = borders[3].width;
          border.args = drawSide({
              c1: [bx, by + bh + borders[2].width],
              c2: [bx, by],
              c3: [bx + bw, by + borders[0].width],
              c4: [bx + bw, by + bh]
            }, radius[3], radius[0],
            borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner, borderPoints.topLeftOuter, borderPoints.topLeftInner);
          break;
      }
    }
    return border;
  });
}


NodeParser.prototype.parseBackgroundClip = function(container, borderPoints, borders, radius, bounds) {
  var backgroundClip = container.css('backgroundClip'),
    borderArgs = [];

    switch(backgroundClip) {
      case "content-box":
      case "padding-box":
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftInner, borderPoints.topRightInner, bounds.x + borders[3].width, bounds.y + borders[0].width);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightInner, borderPoints.bottomRightInner, bounds.x + bounds.width - borders[1].width, bounds.y + borders[0].width);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightInner, borderPoints.bottomLeftInner, bounds.x + bounds.width - borders[1].width, bounds.y + bounds.height - borders[2].width);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftInner, borderPoints.topLeftInner, bounds.x + borders[3].width, bounds.y + bounds.height - borders[2].width);
        break;

      default:
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftOuter, borderPoints.topRightOuter, bounds.x, bounds.y);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightOuter, borderPoints.bottomRightOuter, bounds.x + bounds.width, bounds.y);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightOuter, borderPoints.bottomLeftOuter, bounds.x + bounds.width, bounds.y + bounds.height);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftOuter, borderPoints.topLeftOuter, bounds.x, bounds.y + bounds.height);
        break;
    }

  return borderArgs;
};

function getCurvePoints(x, y, r1, r2) {
  var kappa = 4 * ((Math.sqrt(2) - 1) / 3);
  var ox = (r1) * kappa, // control point offset horizontal
    oy = (r2) * kappa, // control point offset vertical
    xm = x + r1, // x-middle
    ym = y + r2; // y-middle
  return {
    topLeft: bezierCurve({x: x, y: ym}, {x: x, y: ym - oy}, {x: xm - ox, y: y}, {x: xm, y: y}),
    topRight: bezierCurve({x: x, y: y}, {x: x + ox, y: y}, {x: xm, y: ym - oy}, {x: xm, y: ym}),
    bottomRight: bezierCurve({x: xm, y: y}, {x: xm, y: y + oy}, {x: x + ox, y: ym}, {x: x, y: ym}),
    bottomLeft: bezierCurve({x: xm, y: ym}, {x: xm - ox, y: ym}, {x: x, y: y + oy}, {x: x, y: y})
  };
}

function calculateCurvePoints(bounds, borderRadius, borders) {
  var x = bounds.x,
    y = bounds.y,
    width = bounds.width,
    height = bounds.height,
    tlh = borderRadius[0][0],
    tlv = borderRadius[0][1],
    trh = borderRadius[1][0],
    trv = borderRadius[1][1],
    brh = borderRadius[2][0],
    brv = borderRadius[2][1],
    blh = borderRadius[3][0],
    blv = borderRadius[3][1];

  var topWidth = width - trh,
    rightHeight = height - brv,
    bottomWidth = width - brh,
    leftHeight = height - blv;

  return {
    topLeftOuter: getCurvePoints(x, y, tlh, tlv).topLeft.subdivide(0.5),
    topLeftInner: getCurvePoints(x + borders[3].width, y + borders[0].width, Math.max(0, tlh - borders[3].width), Math.max(0, tlv - borders[0].width)).topLeft.subdivide(0.5),
    topRightOuter: getCurvePoints(x + topWidth, y, trh, trv).topRight.subdivide(0.5),
    topRightInner: getCurvePoints(x + Math.min(topWidth, width + borders[3].width), y + borders[0].width, (topWidth > width + borders[3].width) ? 0 : trh - borders[3].width, trv - borders[0].width).topRight.subdivide(0.5),
    bottomRightOuter: getCurvePoints(x + bottomWidth, y + rightHeight, brh, brv).bottomRight.subdivide(0.5),
    bottomRightInner: getCurvePoints(x + Math.min(bottomWidth, width - borders[3].width), y + Math.min(rightHeight, height + borders[0].width), Math.max(0, brh - borders[1].width), brv - borders[2].width).bottomRight.subdivide(0.5),
    bottomLeftOuter: getCurvePoints(x, y + leftHeight, blh, blv).bottomLeft.subdivide(0.5),
    bottomLeftInner: getCurvePoints(x + borders[3].width, y + leftHeight, Math.max(0, blh - borders[3].width), blv - borders[2].width).bottomLeft.subdivide(0.5)
  };
}

function bezierCurve(start, startControl, endControl, end) {
  var lerp = function(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  };

  return {
    start: start,
    startControl: startControl,
    endControl: endControl,
    end: end,
    subdivide: function(t) {
      var ab = lerp(start, startControl, t),
        bc = lerp(startControl, endControl, t),
        cd = lerp(endControl, end, t),
        abbc = lerp(ab, bc, t),
        bccd = lerp(bc, cd, t),
        dest = lerp(abbc, bccd, t);
      return [bezierCurve(start, ab, abbc, dest), bezierCurve(dest, bccd, cd, end)];
    },
    curveTo: function(borderArgs) {
      borderArgs.push(["bezierCurve", startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y]);
    },
    curveToReversed: function(borderArgs) {
      borderArgs.push(["bezierCurve", endControl.x, endControl.y, startControl.x, startControl.y, start.x, start.y]);
    }
  };
}

function drawSide(borderData, radius1, radius2, outer1, inner1, outer2, inner2) {
  var borderArgs = [];

  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", outer1[1].start.x, outer1[1].start.y]);
    outer1[1].curveTo(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c1[0], borderData.c1[1]]);
  }

  if(radius2[0] > 0 || radius2[1] > 0) {
    borderArgs.push(["line", outer2[0].start.x, outer2[0].start.y]);
    outer2[0].curveTo(borderArgs);
    borderArgs.push(["line", inner2[0].end.x, inner2[0].end.y]);
    inner2[0].curveToReversed(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c2[0], borderData.c2[1]]);
    borderArgs.push(["line", borderData.c3[0], borderData.c3[1]]);
  }

  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", inner1[1].end.x, inner1[1].end.y]);
    inner1[1].curveToReversed(borderArgs);
  } else {
    borderArgs.push(["line", borderData.c4[0], borderData.c4[1]]);
  }

  return borderArgs;
}

function parseCorner(borderArgs, radius1, radius2, corner1, corner2, x, y) {
  if(radius1[0] > 0 || radius1[1] > 0) {
    borderArgs.push(["line", corner1[0].start.x, corner1[0].start.y]);
    corner1[0].curveTo(borderArgs);
    corner1[1].curveTo(borderArgs);
  } else {
    borderArgs.push(["line", x, y]);
  }

  if(radius2[0] > 0 || radius2[1] > 0) {
    borderArgs.push(["line", corner2[0].start.x, corner2[0].start.y]);
  }
}

function negativeZIndex(container) {
  return container.cssInt("zIndex") < 0;
}

function positiveZIndex(container) {
  return container.cssInt("zIndex") > 0;
}

function zIndex0(container) {
  return container.cssInt("zIndex") === 0;
}

function inlineLevel(container) {
  return ["inline", "inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function isStackingContext(container) {
  return (container instanceof StackingContext);
}

function hasText(container) {
  return container.node.data.trim().length > 0;
}

function noLetterSpacing(container) {
  return (/^(normal|none|0px)$/.test(container.parent.css("letterSpacing")));
}

function getBorderRadiusData(container, borders, bounds) {
  bounds = bounds || container.parseBounds();
  return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(function(side) {
    var value = container.css('border' + side + 'Radius');
    var arr = value.split(" ");
    if(arr.length <= 1) {
      arr[1] = arr[0];
    }

    arr.forEach(function(val) {
      var size = (arr.indexOf(val) === 0) ? bounds.width : bounds.height;

      if(val.indexOf('%') !== -1) {
        arr[arr.indexOf(val)] = (asFloat(val) / 100) * size;
      }
    });

    return arr.map(asFloat);
  });
}

function renderableNode(node) {
  return (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE);
}

function isPositionedForStacking(container) {
  var position = container.css("position");
  var zIndex = (["absolute", "relative", "fixed"].indexOf(position) !== -1) ? container.css("zIndex") : "auto";
  return zIndex !== "auto";
}

function isPositioned(container) {
  return container.css("position") !== "static";
}

function isFloating(container) {
  return container.css("float") !== "none";
}

function isInlineBlock(container) {
  return ["inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function not(callback) {
  var context = this;
  return function() {
    return !callback.apply(context, arguments);
  };
}

function isElement(container) {
  return container.node.nodeType === Node.ELEMENT_NODE;
}

function isPseudoElement(container) {
  return container.isPseudoElement === true;
}

function isTextNode(container) {
  return container.node.nodeType === Node.TEXT_NODE;
}

function zIndexSort(contexts) {
  return function(a, b) {
    return (a.cssInt("zIndex") + (contexts.indexOf(a) / contexts.length)) - (b.cssInt("zIndex") + (contexts.indexOf(b) / contexts.length));
  };
}

function hasOpacity(container) {
  return container.getOpacity() < 1;
}

function asFloat(value) {
  return parseFloat(value);
}

function getWidth(border) {
  return border.width;
}

function nonIgnoredElement(nodeContainer) {
  return (nodeContainer.node.nodeType !== Node.ELEMENT_NODE || ["SCRIPT", "HEAD", "TITLE", "OBJECT", "BR", "OPTION"].indexOf(nodeContainer.node.nodeName) === -1);
}

function flatten(arrays) {
  return [].concat.apply([], arrays);
}

function stripQuotes(content) {
  var first = content.substr(0, 1);
  return (first === content.substr(content.length - 1) && first.match(/'|"/)) ? content.substr(1, content.length - 2) : content;
}

function getWords(characters) {
  var words = [], i = 0, onWordBoundary = false, word;
  while(characters.length) {
    if(isWordBoundary(characters[i]) === onWordBoundary) {
      word = characters.splice(0, i);
      if(word.length) {
        words.push(punycode.ucs2.encode(word));
      }
      onWordBoundary = !onWordBoundary;
      i = 0;
    } else {
      i++;
    }

    if(i >= characters.length) {
      word = characters.splice(0, i);
      if(word.length) {
        words.push(punycode.ucs2.encode(word));
      }
    }
  }
  return words;
}

function isWordBoundary(characterCode) {
  return [
      32, // <space>
      13, // \r
      10, // \n
      9, // \t
      45 // -
    ].indexOf(characterCode) !== -1;
}

function hasUnicode(string) {
  return (/[^\u0000-\u00ff]/).test(string);
}

module.exports = NodeParser;

},{"./BoundingBox":5,"./color":7,"./fontmetrics":10,"./log":19,"./nodecontainer":20,"./promise":22,"./pseudoelementcontainer":25,"./stackingcontext":28,"./textcontainer":33,"./utils":34,"punycode":4}],22:[function(require,module,exports){
module.exports = require('es6-promise').Promise;

},{"es6-promise":2}],23:[function(require,module,exports){
var Promise = require('./promise');
var XHR = require('./xhr');
var utils = require('./utils');
var log = require('./log');
var createWindowClone = require('./clone');
var decode64 = utils.decode64;

function Proxy(src, proxyUrl, document) {
  var supportsCORS = ('withCredentials' in new XMLHttpRequest());
  if(!proxyUrl) {
    return Promise.reject("No proxy configured");
  }
  var callback = createCallback(supportsCORS);
  var url = createProxyUrl(proxyUrl, src, callback);

  return supportsCORS ? XHR(url) : (jsonp(document, url, callback).then(function(response) {
    return decode64(response.content);
  }));
}
var proxyCount = 0;

function ProxyURL(src, proxyUrl, document) {
  var supportsCORSImage = ('crossOrigin' in new Image());
  var callback = createCallback(supportsCORSImage);
  var url = createProxyUrl(proxyUrl, src, callback);
  return (supportsCORSImage ? Promise.resolve(url) : jsonp(document, url, callback).then(function(response) {
    return "data:" + response.type + ";base64," + response.content;
  }));
}

function jsonp(document, url, callback) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement("script");
    var cleanup = function() {
      delete window.html2canvas.proxy[callback];
      document.body.removeChild(s);
    };
    window.html2canvas.proxy[callback] = function(response) {
      cleanup();
      resolve(response);
    };
    s.src = url;
    s.onerror = function(e) {
      cleanup();
      reject(e);
    };
    document.body.appendChild(s);
  });
}

function createCallback(useCORS) {
  return !useCORS ? "html2canvas_" + Date.now() + "_" + (++proxyCount) + "_" + Math.round(Math.random() * 100000) : "";
}

function createProxyUrl(proxyUrl, src, callback) {
  return proxyUrl + "?url=" + encodeURIComponent(src) + (callback.length ? "&callback=html2canvas.proxy." + callback : "");
}

function documentFromHTML(src) {
  return function(html) {
    var parser = new DOMParser(), doc;
    try {
      doc = parser.parseFromString(html, "text/html");
    } catch(e) {
      log("DOMParser not supported, falling back to createHTMLDocument");
      doc = document.implementation.createHTMLDocument("");
      try {
        doc.open();
        doc.write(html);
        doc.close();
      } catch(ee) {
        log("createHTMLDocument write not supported, falling back to document.body.innerHTML");
        doc.body.innerHTML = html; // ie9 doesnt support writing to documentElement
      }
    }

    var b = doc.querySelector("base");
    if(!b || !b.href.host) {
      var base = doc.createElement("base");
      base.href = src;
      doc.head.insertBefore(base, doc.head.firstChild);
    }

    return doc;
  };
}

function loadUrlDocument(src, proxy, document, width, height, options) {
  return new Proxy(src, proxy, window.document).then(documentFromHTML(src)).then(function(doc) {
    return createWindowClone(doc, document, width, height, options, 0, 0);
  });
}

exports.Proxy = Proxy;
exports.ProxyURL = ProxyURL;
exports.loadUrlDocument = loadUrlDocument;

},{"./clone":6,"./log":19,"./promise":22,"./utils":34,"./xhr":35}],24:[function(require,module,exports){
var ProxyURL = require('./proxy').ProxyURL;
var Promise = require('./promise');

function ProxyImageContainer(src, proxy) {
  var link = document.createElement("a");
  link.href = src;
  src = link.href;
  this.src = src;
  this.image = new Image();
  var self = this;
  this.promise = new Promise(function(resolve, reject) {
    self.image.crossOrigin = "Anonymous";
    self.image.onload = resolve;
    self.image.onerror = reject;

    new ProxyURL(src, proxy, document).then(function(url) {
      self.image.src = url;
    })['catch'](reject);
  });
}

module.exports = ProxyImageContainer;

},{"./promise":22,"./proxy":23}],25:[function(require,module,exports){
var NodeContainer = require('./nodecontainer');

function PseudoElementContainer(node, parent, type) {
  NodeContainer.call(this, node, parent);
  this.isPseudoElement = true;
  this.before = type === ":before";
}

PseudoElementContainer.prototype.cloneTo = function(stack) {
  PseudoElementContainer.prototype.cloneTo.call(this, stack);
  stack.isPseudoElement = true;
  stack.before = this.before;
};

PseudoElementContainer.prototype = Object.create(NodeContainer.prototype);

PseudoElementContainer.prototype.appendToDOM = function() {
  if(this.before) {
    this.parent.node.insertBefore(this.node, this.parent.node.firstChild);
  } else {
    this.parent.node.appendChild(this.node);
  }
  this.parent.node.className += " " + this.getHideClass();
};

PseudoElementContainer.prototype.cleanDOM = function() {
  this.node.parentNode.removeChild(this.node);
  this.parent.node.className = this.parent.node.className.replace(this.getHideClass(), "");
};

PseudoElementContainer.prototype.getHideClass = function() {
  return this["PSEUDO_HIDE_ELEMENT_CLASS_" + (this.before ? "BEFORE" : "AFTER")];
};

PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE = "___html2canvas___pseudoelement_before";
PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER = "___html2canvas___pseudoelement_after";

module.exports = PseudoElementContainer;

},{"./nodecontainer":20}],26:[function(require,module,exports){
var Renderer = require('./Renderer');
var LinearGradientContainer = require('../gradient/LinearGradientContainer');
var RadialGradientContainer = require('../gradient/RadialGradientContainer');
var log = require('../log');

function CanvasRenderer(width, height, imageLoader, options) {
  Renderer.apply(this, arguments);
  this.canvas = this.options.canvas || document.createElement("canvas");
  if(!this.options.canvas) {
    this.canvas.width = width * devicePixelRatio;
    this.canvas.style.width = width + 'px';
    this.canvas.height = height * devicePixelRatio;
    this.canvas.style.height = height + 'px';
  }

  this.ctx = this.canvas.getContext("2d");
  this.taintCtx = document.createElement("canvas").getContext("2d");

  this.ctx.scale(devicePixelRatio, devicePixelRatio);

  this.ctx.textBaseline = "bottom";
  this.variables = {};
  this.transforms = {};
  this.stackDepth = 1;
  log("Initialized CanvasRenderer with size", width, "x", height);
}

CanvasRenderer.prototype = Object.create(Renderer.prototype);

CanvasRenderer.prototype.save = function() {
  this.ctx.save();
  this.stackDepth++;
};

CanvasRenderer.prototype.restore = function() {
  this.ctx.restore();
  delete this.transforms[this.stackDepth.toString()];
  this.stackDepth--;
}

CanvasRenderer.prototype.setFillStyle = function(fillStyle) {
  this.ctx.fillStyle = typeof(fillStyle) === "object" && !!fillStyle.isColor ? fillStyle.toString() : fillStyle;
  return this.ctx;
};

CanvasRenderer.prototype.rectangle = function(left, top, width, height, color) {
  this.setFillStyle(color).fillRect(left, top, width, height);
};

CanvasRenderer.prototype.circle = function(left, top, size, color) {
  this.setFillStyle(color);
  this.ctx.beginPath();
  this.ctx.arc(left + size / 2, top + size / 2, size / 2, 0, Math.PI * 2, true);
  this.ctx.closePath();
  this.ctx.fill();
};

CanvasRenderer.prototype.circleStroke = function(left, top, size, color, stroke, strokeColor) {
  this.circle(left, top, size, color);
  this.ctx.strokeStyle = strokeColor.toString();
  this.ctx.stroke();
};

CanvasRenderer.prototype.drawShape = function(shape, color) {
  this.shape(shape);
  this.setFillStyle(color).fill();
};

CanvasRenderer.prototype.taints = function(imageContainer) {
  if(imageContainer.tainted === null) {
    this.taintCtx.drawImage(imageContainer.image, 0, 0);
    try {
      this.taintCtx.getImageData(0, 0, 1, 1);
      imageContainer.tainted = false;
    } catch(e) {
      this.taintCtx = document.createElement("canvas").getContext("2d");
      imageContainer.tainted = true;
    }
  }

  return imageContainer.tainted;
};

CanvasRenderer.prototype.drawImage = function(imageContainer, sx, sy, sw, sh, dx, dy, dw, dh) {
  if(!this.taints(imageContainer) || this.options.allowTaint) {
    this.ctx.drawImage(imageContainer.image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
};

CanvasRenderer.prototype.clip = function(shapes, callback, context) {
  if(shapes.length === 0)
    return;

  this.save();
  this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

/*
  shapes.filter(hasEntries).forEach(function(shape) {
    console.log(shape);
    this.ctx.strokeStyle = 'rgb(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ')';
    this.shape(shape).stroke();
  }, this);
*/

  shapes.filter(hasEntries).forEach(function(shape) {
    if(shape[0] === 'transform') {
      this.setTransform(shape[1]);
      return;
    }
    this.shape(shape).clip();
  }, this);
  callback.call(context);
  this.restore();
};

CanvasRenderer.prototype.shape = function(shape) {
  this.ctx.beginPath();
  shape.forEach(function(point, index) {
    if(point[0] === "rect") {
      this.ctx.rect.apply(this.ctx, point.slice(1));
    } else {
      this.ctx[(index === 0) ? "moveTo" : point[0] + "To"].apply(this.ctx, point.slice(1));
    }
  }, this);
  this.ctx.closePath();
  return this.ctx;
};

CanvasRenderer.prototype.font = function(color, style, variant, weight, size, family) {
  this.setFillStyle(color).font = [style, variant, weight, size, family].join(" ").split(",")[0];
};

CanvasRenderer.prototype.setShadow = function(color, offsetX, offsetY, blur) {
  this.setVariable("shadowColor", color.toString())
    .setVariable("shadowOffsetX", offsetX)
    .setVariable("shadowOffsetY", offsetY)
    .setVariable("shadowBlur", blur);
};

CanvasRenderer.prototype.clearShadow = function() {
  this.setVariable("shadowColor", "rgba(0,0,0,0)");
};

CanvasRenderer.prototype.setOpacity = function(opacity) {
  this.ctx.globalAlpha = opacity;
};

CanvasRenderer.prototype.getTransform = function() {
  var a = this.stackDepth;
  while(--a > 0) {
    if(typeof(this.transforms[a.toString()]) !== 'undefined') {
      var transform = this.transforms[a.toString()];
      if(typeof(transform.x1) !== 'undefined')
        continue;
      if(transform.matrix.join(',') === '1,0,0,1,0,0')
        continue;
      return transform;
    }
  }

  return {
    origin: [0, 0],
    matrix: [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0]
  };
};

CanvasRenderer.prototype.setTransform = function(transform) {
  this.ctx.translate(transform.origin[0], transform.origin[1]);
  this.transforms[this.stackDepth.toString()] = transform;
  this.ctx.transform.apply(this.ctx, transform.matrix);
  this.ctx.translate(-transform.origin[0], -transform.origin[1]);
};

CanvasRenderer.prototype.setVariable = function(property, value) {
  if(this.variables[property] !== value) {
    this.variables[property] = this.ctx[property] = value;
  }

  return this;
};

CanvasRenderer.prototype.text = function(text, left, bottom) {
  this.ctx.fillText(text, left, bottom);
};

CanvasRenderer.prototype.backgroundRepeatShape = function(imageContainer, backgroundPosition, size, bounds, left, top, width, height, borderData) {
  var shape = [
    ["line", Math.round(left), Math.round(top)],
    ["line", Math.round(left + width), Math.round(top)],
    ["line", Math.round(left + width), Math.round(height + top)],
    ["line", Math.round(left), Math.round(height + top)]
  ];
  this.clip([shape], function() {
    this.renderBackgroundRepeat(imageContainer, backgroundPosition, size, bounds, borderData[3], borderData[0]);
  }, this);
};

CanvasRenderer.prototype.renderBackgroundRepeat = function(imageContainer, backgroundPosition, size, bounds, borderLeft, borderTop) {
  var offsetX = Math.round(bounds.x + backgroundPosition.x + borderLeft), offsetY = Math.round(bounds.y + backgroundPosition.y + borderTop);
  this.setFillStyle(this.ctx.createPattern(this.resizeImage(imageContainer, size), "repeat"));
  this.ctx.translate(offsetX, offsetY);
  this.ctx.fill();
  this.ctx.translate(-offsetX, -offsetY);
};

CanvasRenderer.prototype.renderBackgroundGradient = function(gradientImage, bounds) {
  var gradient;
  if(gradientImage instanceof LinearGradientContainer) {
    gradient = this.ctx.createLinearGradient(
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0,
      bounds.x + gradientImage.x1,
      bounds.y + gradientImage.y1);
  } else if(gradientImage instanceof RadialGradientContainer) {
    if(typeof gradientImage.scaleX !== 'undefined' || typeof gradientImage.scaleY !== 'undefined') {
      gradientImage.scaleX = gradientImage.scaleX || 1;
      gradientImage.scaleY = gradientImage.scaleY || 1;

      gradient = this.ctx.createRadialGradient(
        (bounds.x + gradientImage.x0) / gradientImage.scaleX,
        (bounds.y + gradientImage.y0) / gradientImage.scaleY,
        gradientImage.r,
        (bounds.x + gradientImage.x0) / gradientImage.scaleX,
        (bounds.y + gradientImage.y0) / gradientImage.scaleY, 0);

      gradientImage.colorStops.forEach(function(colorStop) {
        gradient.addColorStop(colorStop.stop, colorStop.color.toString());
      });

      var currentTransform = this.ctx.currentTransform;
      this.ctx.setTransform(gradientImage.scaleX * devicePixelRatio, 0, 0, gradientImage.scaleY * devicePixelRatio, 0, 0);
      this.rectangle(bounds.x / gradientImage.scaleX, bounds.y / gradientImage.scaleY, bounds.width, bounds.height, gradient);

      // reset the old transform
      this.ctx.currentTransform = currentTransform;
      return;
    }

    gradient = this.ctx.createRadialGradient(
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0,
      gradientImage.r,
      bounds.x + gradientImage.x0,
      bounds.y + gradientImage.y0, 0);
  }

  gradientImage.colorStops.forEach(function(colorStop) {
    gradient.addColorStop(colorStop.stop, colorStop.color.toString());
  });

  this.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, gradient);
};

CanvasRenderer.prototype.resizeImage = function(imageContainer, size) {
  var image = imageContainer.image;
  if(image.width === size.width && image.height === size.height) {
    return image;
  }

  var ctx, canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width, size.height);
  return canvas;
};

function hasEntries(array) {
  return array.length > 0;
}

module.exports = CanvasRenderer;

},{"../gradient/LinearGradientContainer":13,"../gradient/RadialGradientContainer":14,"../log":19,"./Renderer":27}],27:[function(require,module,exports){
var log = require('../log');

function Renderer(width, height, images, options) {
  this.width = width;
  this.height = height;
  this.images = images;
  this.options = options;
}

Renderer.prototype.renderImage = function(container, bounds, borderData, imageContainer) {
  var paddingLeft = container.cssInt('paddingLeft'),
    paddingTop = container.cssInt('paddingTop'),
    paddingRight = container.cssInt('paddingRight'),
    paddingBottom = container.cssInt('paddingBottom'),
    borders = borderData.borders;

  var width = bounds.width - (borders[1].width + borders[3].width + paddingLeft + paddingRight);
  var height = bounds.height - (borders[0].width + borders[2].width + paddingTop + paddingBottom);
  this.drawImage(
    imageContainer,
    0,
    0,
    imageContainer.image.width || width,
    imageContainer.image.height || height,
    bounds.x + paddingLeft + borders[3].width,
    bounds.y + paddingTop + borders[0].width,
    width,
    height
  );
};

Renderer.prototype.renderBackground = function(container, bounds, borderData) {
  if(bounds.height > 0 && bounds.width > 0) {
    this.renderBackgroundColor(container, bounds);
    this.renderBackgroundImage(container, bounds, borderData);
  }
};

Renderer.prototype.renderBackgroundColor = function(container, bounds) {
  var color = container.color("backgroundColor");
  if(!color.isTransparent()) {
    this.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, color);
  }
};

Renderer.prototype.renderBorders = function(borders) {
  borders.forEach(this.renderBorder, this);
};

Renderer.prototype.renderBorder = function(data) {
  if(!data.color.isTransparent() && data.args !== null) {
    this.drawShape(data.args, data.color);
  }
};

Renderer.prototype.renderBackgroundImage = function(container, bounds, borderData) {
  var backgroundImages = container.parseBackgroundImages();
  backgroundImages.reverse().forEach(function(backgroundImage, index, arr) {
    switch(backgroundImage.method) {
      case "url":
        var image = this.images.get(backgroundImage.args[0]);
        if(image) {
          this.renderBackgroundRepeating(container, bounds, image, arr.length - (index + 1), borderData);
        } else {
          log("Error loading background-image", backgroundImage.args[0]);
        }
        break;
      case "linear-gradient":
      case "radial-gradient":
      case "gradient":
        var srcStr = JSON.stringify([backgroundImage.value, bounds]);
        var gradientImage = this.images.get(srcStr);
        if(gradientImage) {
          this.renderBackgroundGradient(gradientImage, bounds, borderData);
        } else {
          log("Error loading background-image", srcStr);
        }
        break;
      case "none":
        break;
      default:
        log("Unknown background-image type", backgroundImage.args[0]);
    }
  }, this);
};

Renderer.prototype.renderBackgroundRepeating = function(container, bounds, imageContainer, index, borderData) {
  var size = container.parseBackgroundSize(bounds, imageContainer.image, index);
  var position = container.parseBackgroundPosition(bounds, imageContainer.image, index, size);
  var repeat = container.parseBackgroundRepeat(index);
  switch(repeat) {
    case "repeat-x":
    case "repeat no-repeat":
      this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.x + borderData[3], bounds.y + position.y + borderData[0], 99999, size.height, borderData);
      break;
    case "repeat-y":
    case "no-repeat repeat":
      this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.x + position.x + borderData[3], bounds.y + borderData[0], size.width, 99999, borderData);
      break;
    case "no-repeat":
      this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.x + position.x + borderData[3], bounds.y + position.y + borderData[0], size.width, size.height, borderData);
      break;
    default:
      this.renderBackgroundRepeat(imageContainer, position, size, {
        y: bounds.y,
        x: bounds.x
      }, borderData[3], borderData[0]);
      break;
  }
};

module.exports = Renderer;

},{"../log":19}],28:[function(require,module,exports){
var NodeContainer = require('./nodecontainer');

function StackingContext(hasOwnStacking, opacity, element, parent) {
  NodeContainer.call(this, element, parent);
  this.ownStacking = hasOwnStacking;
  this.contexts = [];
  this.children = [];
  this.opacity = (this.parent ? this.parent.stack.opacity : 1) * opacity;
}

StackingContext.prototype = Object.create(NodeContainer.prototype);

StackingContext.prototype.getParentStack = function(context) {
  var parentStack = (this.parent) ? this.parent.stack : null;
  return parentStack ? (parentStack.ownStacking ? parentStack : parentStack.getParentStack(context)) : context.stack;
};

module.exports = StackingContext;

},{"./nodecontainer":20}],29:[function(require,module,exports){
function Support(document) {
  this.rangeBounds = this.testRangeBounds(document);
  this.cors = this.testCORS();
}

Support.prototype.testRangeBounds = function(document) {
  var range, testElement, rangeBounds, rangeHeight, support = false;

  if(document.createRange) {
    range = document.createRange();
    if(range.getBoundingClientRect) {
      testElement = document.createElement('boundtest');
      testElement.style.height = "123px";
      testElement.style.display = "block";
      document.body.appendChild(testElement);

      range.selectNode(testElement);
      rangeBounds = range.getBoundingClientRect();
      rangeHeight = rangeBounds.height;

      // wierd chrome bug
      if(Math.round(rangeHeight) === 123) {
        support = true;
      }
      document.body.removeChild(testElement);
    }
  }

  return support;
};

Support.prototype.testCORS = function() {
  return typeof((new Image()).crossOrigin) !== "undefined";
};

module.exports = Support;

},{}],30:[function(require,module,exports){
var Promise = require('../promise');
var XHR = require('../xhr');
var decode64 = require('../utils').decode64;
var SVGParser = require('./SVGParser.js');

function SVGContainer(src) {
  this.src = src;
  this.image = document.createElement('canvas');
  var self = this;

  this.getBounds = function(bounds) {
    bounds.x1 = bounds.x1 + this.bb.x1;
    bounds.x2 = bounds.x2 + this.bb.width;
    bounds.y1 = bounds.y1 + this.bb.y1;
    bounds.y2 = bounds.y2 + this.bb.height;

    return bounds;
  };

  this.promise = (self.isInline(src) ? Promise.resolve(self.inlineFormatting(src)) : XHR(src))
    .then(function(svg) {
      return new Promise(function(resolve) {
        SVGParser.parse(this.image, svg, {
          renderCallback: function(obj) {
            this.bb = obj.bounds;
            resolve();
          }.bind(this)
        });
      }.bind(this));
    }.bind(this));
}

SVGContainer.prototype.inlineFormatting = function(src) {
  return (/^data:image\/svg\+xml;base64,/.test(src)) ? this.decode64(this.removeContentType(src)) : this.removeContentType(src);
};

SVGContainer.prototype.removeContentType = function(src) {
  return src.replace(/^data:image\/svg\+xml(;base64)?,/, '');
};

SVGContainer.prototype.isInline = function(src) {
  return (/^data:image\/svg\+xml/i.test(src));
};

SVGContainer.prototype.decode64 = function(str) {
  return (typeof(window.atob) === "function") ? window.atob(str) : decode64(str);
};

module.exports = SVGContainer;

},{"../promise":22,"../utils":34,"../xhr":35,"./SVGParser.js":32}],31:[function(require,module,exports){
var SVGContainer = require('./SVGContainer');
var Promise = require('../promise');
var SVGParser = require('./SVGParser.js');
var utils = require('../utils');

function SVGNodeContainer(node) {
  this.src = node;
  this.image = document.createElement('canvas');
  this.bb = null;
  var self = this;

  this.getBounds = function(bounds) {
    bounds.x1 = bounds.x1 + this.bb.x1;
    bounds.x2 = bounds.x1 + this.bb.width;
    bounds.y1 = bounds.y1 + this.bb.y1;
    bounds.y2 = bounds.y1 + this.bb.height;

    return bounds;
  }.bind(this);

  this.promise = new Promise(function(resolve, reject) {
    SVGParser.parse(this.image, node, {
      renderCallback: function(obj) {
        this.bb = obj.bounds;
        resolve();
      }.bind(this)
    });
  }.bind(this));
}

SVGNodeContainer.prototype = Object.create(SVGContainer.prototype);

module.exports = SVGNodeContainer;

},{"../promise":22,"../utils":34,"./SVGContainer":30,"./SVGParser.js":32}],32:[function(require,module,exports){
var Color = require('../color');
var log = require('../log');
var XHR = require('../xhr');
var BoundingBox = require('../BoundingBox');

/*
 target: canvas element or the id of a canvas element
 s: svg string, url to svg file, or xml document
 opts: optional hash of options
 ignoreMouse: true => ignore mouse events
 ignoreAnimation: true => ignore animations
 ignoreDimensions: true => does not try to resize canvas
 ignoreClear: true => does not clear canvas
 offsetX: int => draws at a x offset
 offsetY: int => draws at a y offset
 scaleWidth: int => scales horizontally to width
 scaleHeight: int => scales vertically to height
 renderCallback: function => will call the function after the first render is completed
 forceRedraw: function => will call the function on every frame, if it returns true, will redraw
 */
module.exports.parse = function(target, s, opts) {
  // no parameters
  if(target == null && s == null && opts == null) {
    var svgTags = document.querySelectorAll('svg');
    for(var i = 0; i < svgTags.length; i++) {
      var svgTag = svgTags[i];
      var c = document.createElement('canvas');
      c.width = svgTag.clientWidth;
      c.height = svgTag.clientHeight;
      svgTag.parentNode.insertBefore(c, svgTag);
      svgTag.parentNode.removeChild(svgTag);
      var div = document.createElement('div');
      div.appendChild(svgTag);
      module.exports.parse(c, div.innerHTML);
    }
    return;
  }

  if(typeof target == 'string') {
    target = document.getElementById(target);
  }

  // store class on canvas
  if(target.svg != null) target.svg.stop();
  var svg = build(opts || {});
  // on i.e. 8 for flash canvas, we can't assign the property so check for it
  if(!(target.childNodes.length == 1 && target.childNodes[0].nodeName == 'OBJECT')) target.svg = svg;

  var ctx = target.getContext('2d');
  if(typeof(s.nodeName) !== 'undefined') {
    // load from xml doc
    svg.loadXmlDoc(ctx, s);
  } else {
    // load from xml string
    svg.loadXml(ctx, s);
  }
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Element.matches
var matchesSelector;
if(typeof(Element.prototype.matches) != 'undefined') {
  matchesSelector = function(node, selector) {
    return node.matches(selector);
  };
} else if(typeof(Element.prototype.webkitMatchesSelector) != 'undefined') {
  matchesSelector = function(node, selector) {
    return node.webkitMatchesSelector(selector);
  };
} else if(typeof(Element.prototype.mozMatchesSelector) != 'undefined') {
  matchesSelector = function(node, selector) {
    return node.mozMatchesSelector(selector);
  };
} else if(typeof(Element.prototype.msMatchesSelector) != 'undefined') {
  matchesSelector = function(node, selector) {
    return node.msMatchesSelector(selector);
  };
} else if(typeof(Element.prototype.oMatchesSelector) != 'undefined') {
  matchesSelector = function(node, selector) {
    return node.oMatchesSelector(selector);
  };
} else {
  // requires Sizzle: https://github.com/jquery/sizzle/wiki/Sizzle-Documentation
  // without Sizzle, this is a ReferenceError
  matchesSelector = Sizzle.matchesSelector;
}

// slightly modified version of https://github.com/keeganstreet/specificity/blob/master/specificity.js
var attributeRegex = /(\[[^\]]+\])/g;
var idRegex = /(#[^\s\+>~\.\[:]+)/g;
var classRegex = /(\.[^\s\+>~\.\[:]+)/g;
var pseudoElementRegex = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/gi;
var pseudoClassWithBracketsRegex = /(:[\w-]+\([^\)]*\))/gi;
var pseudoClassRegex = /(:[^\s\+>~\.\[:]+)/g;
var elementRegex = /([^\s\+>~\.\[:]+)/g;

function getSelectorSpecificity(selector) {
  var typeCount = [0, 0, 0];
  var findMatch = function(regex, type) {
    var matches = selector.match(regex);
    if(matches == null) {
      return;
    }
    typeCount[type] += matches.length;
    selector = selector.replace(regex, ' ');
  };

  selector = selector.replace(/:not\(([^\)]*)\)/g, '     $1 ');
  selector = selector.replace(/{[^]*/gm, ' ');
  findMatch(attributeRegex, 1);
  findMatch(idRegex, 0);
  findMatch(classRegex, 1);
  findMatch(pseudoElementRegex, 2);
  findMatch(pseudoClassWithBracketsRegex, 1);
  findMatch(pseudoClassRegex, 1);
  selector = selector.replace(/[\*\s\+>~]/g, ' ');
  selector = selector.replace(/[#\.]/g, ' ');
  findMatch(elementRegex, 2);
  return typeCount.join('');
}

function build(opts) {
  var svg = {opts: opts};

  svg.FRAMERATE = 30;
  svg.MAX_VIRTUAL_PIXELS = 30000;

  svg.log = log;

  // globals
  svg.init = function(ctx) {
    var uniqueId = 0;
    svg.UniqueId = function() {
      uniqueId++;
      return 'canvg' + uniqueId;
    };
    svg.Definitions = {};
    svg.Styles = {};
    svg.StylesSpecificity = {};
    svg.Animations = [];
    svg.Images = [];
    svg.ctx = ctx;

    svg.ViewPort = new (function() {
      this.viewPorts = [];
      this.Clear = function() {
        this.viewPorts = [];
      }
      this.SetCurrent = function(width, height) {
        this.viewPorts.push({width: width, height: height});
      }
      this.RemoveCurrent = function() {
        this.viewPorts.pop();
      }
      this.Current = function() {
        return this.viewPorts[this.viewPorts.length - 1];
      }
      this.width = function() {
        return this.Current().width;
      }
      this.height = function() {
        return this.Current().height;
      }
      this.ComputeSize = function(d) {
        if(d != null && typeof(d) == 'number') return d;
        if(d == 'x') return this.width();
        if(d == 'y') return this.height();
        return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2)) / Math.sqrt(2);
      }
    });

  }
  svg.init();

  // images loaded
  svg.ImagesLoaded = function() {
    for(var i = 0; i < svg.Images.length; i++) {
      if(!svg.Images[i].loaded) return false;
    }
    return true;
  }

  // trim
  svg.trim = function(s) {
    return s.replace(/^\s+|\s+$/g, '');
  }

  // compress spaces
  svg.compressSpaces = function(s) {
    return s.replace(/[\s\r\t\n]+/gm, ' ');
  }

  // parse xml
  svg.parseXml = function(xml) {
    if(typeof(Windows) != 'undefined' && typeof(Windows.Data) != 'undefined' && typeof(Windows.Data.Xml) != 'undefined') {
      var xmlDoc = new Windows.Data.Xml.Dom.XmlDocument();
      var settings = new Windows.Data.Xml.Dom.XmlLoadSettings();
      settings.prohibitDtd = false;
      xmlDoc.loadXml(xml, settings);
      return xmlDoc;
    }
    else if(window.DOMParser) {
      var parser = new DOMParser();
      return parser.parseFromString(xml, 'text/xml');
    }
    else {
      xml = xml.replace(/<!DOCTYPE svg[^>]*>/, '');
      var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
      xmlDoc.async = 'false';
      xmlDoc.loadXML(xml);
      return xmlDoc;
    }
  }

  svg.Property = function(name, value) {
    this.name = name;
    this.value = value;
  }
  svg.Property.prototype.getValue = function() {
    return this.value;
  }

  svg.Property.prototype.hasValue = function() {
    return (this.value != null && this.value !== '');
  }

  // return the numerical value of the property
  svg.Property.prototype.numValue = function() {
    if(!this.hasValue()) return 0;

    var n = parseFloat(this.value);
    if((this.value + '').match(/%$/)) {
      n = n / 100.0;
    }
    return n;
  }

  svg.Property.prototype.valueOrDefault = function(def) {
    if(this.hasValue()) return this.value;
    return def;
  }

  svg.Property.prototype.numValueOrDefault = function(def) {
    if(this.hasValue()) return this.numValue();
    return def;
  }

  // color extensions
  // augment the current color value with the opacity
  svg.Property.prototype.addOpacity = function(opacityProp) {
    var newValue = this.value;
    if(opacityProp.value != null && opacityProp.value != '' && typeof(this.value) == 'string') { // can only add opacity to colors, not patterns
      var color = new Color(this.value);
      if(color.a === null)
        color.a = opacityProp.numValue();

      if(color.isColor) {
        newValue = color.toString();
      }
    }
    return new svg.Property(this.name, newValue);
  }

  // definition extensions
  // get the definition from the definitions table
  svg.Property.prototype.getDefinition = function() {
    var name = this.value.match(/#([^\)'"]+)/);
    if(name) {
      name = name[1];
    }
    if(!name) {
      name = this.value;
    }
    return svg.Definitions[name];
  }

  svg.Property.prototype.isUrlDefinition = function() {
    return this.value.indexOf('url(') == 0
  }

  svg.Property.prototype.getFillStyleDefinition = function(e, opacityProp) {
    var def = this.getDefinition();

    // gradient
    if(def != null && def.createGradient) {
      return def.createGradient(svg.ctx, e, opacityProp);
    }

    // pattern
    if(def != null && def.createPattern) {
      if(def.getHrefAttribute().hasValue()) {
        var pt = def.attribute('patternTransform');
        def = def.getHrefAttribute().getDefinition();
        if(pt.hasValue()) {
          def.attribute('patternTransform', true).value = pt.value;
        }
      }
      return def.createPattern(svg.ctx, e);
    }

    return null;
  }

  // length extensions
  svg.Property.prototype.getDPI = function(viewPort) {
    return 96.0; // TODO: compute?
  }

  svg.Property.prototype.getEM = function(viewPort) {
    var em = 12;

    var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
    if(fontSize.hasValue()) em = fontSize.toPixels(viewPort);

    return em;
  }

  svg.Property.prototype.getUnits = function() {
    var s = this.value + '';
    return s.replace(/[0-9\.\-]/g, '');
  }

  // get the length as pixels
  svg.Property.prototype.toPixels = function(viewPort, processPercent) {
    if(!this.hasValue()) return 0;
    var s = this.value + '';
    if(s.match(/em$/)) return this.numValue() * this.getEM(viewPort);
    if(s.match(/ex$/)) return this.numValue() * this.getEM(viewPort) / 2.0;
    if(s.match(/px$/)) return this.numValue();
    if(s.match(/pt$/)) return this.numValue() * this.getDPI(viewPort) * (1.0 / 72.0);
    if(s.match(/pc$/)) return this.numValue() * 15;
    if(s.match(/cm$/)) return this.numValue() * this.getDPI(viewPort) / 2.54;
    if(s.match(/mm$/)) return this.numValue() * this.getDPI(viewPort) / 25.4;
    if(s.match(/in$/)) return this.numValue() * this.getDPI(viewPort);
    if(s.match(/%$/)) return this.numValue() * svg.ViewPort.ComputeSize(viewPort);
    var n = this.numValue();
    if(processPercent && n < 1.0) return n * svg.ViewPort.ComputeSize(viewPort);
    return n;
  }

  // time extensions
  // get the time as milliseconds
  svg.Property.prototype.toMilliseconds = function() {
    if(!this.hasValue()) return 0;
    var s = this.value + '';
    if(s.match(/s$/)) return this.numValue() * 1000;
    if(s.match(/ms$/)) return this.numValue();
    return this.numValue();
  }

  // angle extensions
  // get the angle as radians
  svg.Property.prototype.toRadians = function() {
    if(!this.hasValue()) return 0;
    var s = this.value + '';
    if(s.match(/deg$/)) return this.numValue() * (Math.PI / 180.0);
    if(s.match(/grad$/)) return this.numValue() * (Math.PI / 200.0);
    if(s.match(/rad$/)) return this.numValue();
    return this.numValue() * (Math.PI / 180.0);
  }

  // text extensions
  // get the text baseline
  var textBaselineMapping = {
    'baseline': 'alphabetic',
    'before-edge': 'top',
    'text-before-edge': 'top',
    'middle': 'middle',
    'central': 'middle',
    'after-edge': 'bottom',
    'text-after-edge': 'bottom',
    'ideographic': 'ideographic',
    'alphabetic': 'alphabetic',
    'hanging': 'hanging',
    'mathematical': 'alphabetic'
  };
  svg.Property.prototype.toTextBaseline = function() {
    if(!this.hasValue()) return null;
    return textBaselineMapping[this.value];
  }

  // fonts
  svg.Font = new (function() {
    this.Styles = 'normal|italic|oblique|inherit';
    this.Variants = 'normal|small-caps|inherit';
    this.Weights = 'normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900|inherit';

    this.CreateFont = function(fontStyle, fontVariant, fontWeight, fontSize, fontFamily, inherit) {
      var f = inherit != null ? this.Parse(inherit) : this.CreateFont('', '', '', '', '', svg.ctx.font);
      return {
        fontFamily: fontFamily || f.fontFamily,
        fontSize: fontSize || f.fontSize,
        fontStyle: fontStyle || f.fontStyle,
        fontWeight: fontWeight || f.fontWeight,
        fontVariant: fontVariant || f.fontVariant,
        toString: function() {
          return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontSize, this.fontFamily].join(' ')
        }
      }
    }

    var that = this;
    this.Parse = function(s) {
      var f = {};
      var d = svg.trim(svg.compressSpaces(s || '')).split(' ');
      var set = {fontSize: false, fontStyle: false, fontWeight: false, fontVariant: false}
      var ff = '';
      for(var i = 0; i < d.length; i++) {
        if(!set.fontStyle && that.Styles.indexOf(d[i]) != -1) {
          if(d[i] != 'inherit') f.fontStyle = d[i];
          set.fontStyle = true;
        }
        else if(!set.fontVariant && that.Variants.indexOf(d[i]) != -1) {
          if(d[i] != 'inherit') f.fontVariant = d[i];
          set.fontStyle = set.fontVariant = true;
        }
        else if(!set.fontWeight && that.Weights.indexOf(d[i]) != -1) {
          if(d[i] != 'inherit') f.fontWeight = d[i];
          set.fontStyle = set.fontVariant = set.fontWeight = true;
        }
        else if(!set.fontSize) {
          if(d[i] != 'inherit') f.fontSize = d[i].split('/')[0];
          set.fontStyle = set.fontVariant = set.fontWeight = set.fontSize = true;
        }
        else {
          if(d[i] != 'inherit') ff += d[i];
        }
      }
      if(ff != '') f.fontFamily = ff;
      return f;
    }
  });

  // points and paths
  svg.ToNumberArray = function(s) {
    var a = svg.trim(svg.compressSpaces((s || '').replace(/,/g, ' '))).split(' ');
    for(var i = 0; i < a.length; i++) {
      a[i] = parseFloat(a[i]);
    }
    return a;
  }
  svg.Point = function(x, y) {
    this.x = x;
    this.y = y;
  }
  svg.Point.prototype.angleTo = function(p) {
    return Math.atan2(p.y - this.y, p.x - this.x);
  }

  svg.Point.prototype.applyTransform = function(v) {
    var xp = this.x * v[0] + this.y * v[2] + v[4];
    var yp = this.x * v[1] + this.y * v[3] + v[5];
    this.x = xp;
    this.y = yp;
  }

  svg.CreatePoint = function(s) {
    var a = svg.ToNumberArray(s);
    return new svg.Point(a[0], a[1]);
  }
  svg.CreatePath = function(s) {
    var a = svg.ToNumberArray(s);
    var path = [];
    for(var i = 0; i < a.length; i += 2) {
      path.push(new svg.Point(a[i], a[i + 1]));
    }
    return path;
  }

  // bounding box
  svg.BoundingBox = function(x1, y1, x2, y2) { // pass in initial points if you want
    BoundingBox.call(this, x1, y1, x2, y2);

    this.addX = function(x) {
      this.addPoint(x, null);
    }
    this.addY = function(y) {
      this.addPoint(null, y);
    }

    this.addBoundingBox = function(bb) {
      this.addPoint(bb.x1, bb.y1);
      this.addPoint(bb.x2, bb.y2);
    }

    this.addQuadraticCurve = function(p0x, p0y, p1x, p1y, p2x, p2y) {
      var cp1x = p0x + 2 / 3 * (p1x - p0x); // CP1 = QP0 + 2/3 *(QP1-QP0)
      var cp1y = p0y + 2 / 3 * (p1y - p0y); // CP1 = QP0 + 2/3 *(QP1-QP0)
      var cp2x = cp1x + 1 / 3 * (p2x - p0x); // CP2 = CP1 + 1/3 *(QP2-QP0)
      var cp2y = cp1y + 1 / 3 * (p2y - p0y); // CP2 = CP1 + 1/3 *(QP2-QP0)
      this.addBezierCurve(p0x, p0y, cp1x, cp2x, cp1y, cp2y, p2x, p2y);
    }

    this.addBezierCurve = function(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
      // from http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
      var p0 = [p0x, p0y], p1 = [p1x, p1y], p2 = [p2x, p2y], p3 = [p3x, p3y];
      this.addPoint(p0[0], p0[1]);
      this.addPoint(p3[0], p3[1]);

      for(i = 0; i <= 1; i++) {
        var f = function(t) {
          return Math.pow(1 - t, 3) * p0[i]
            + 3 * Math.pow(1 - t, 2) * t * p1[i]
            + 3 * (1 - t) * Math.pow(t, 2) * p2[i]
            + Math.pow(t, 3) * p3[i];
        }

        var b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
        var a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
        var c = 3 * p1[i] - 3 * p0[i];

        if(a == 0) {
          if(b == 0) continue;
          var t = -c / b;
          if(0 < t && t < 1) {
            if(i == 0) this.addX(f(t));
            if(i == 1) this.addY(f(t));
          }
          continue;
        }

        var b2ac = Math.pow(b, 2) - 4 * c * a;
        if(b2ac < 0) continue;
        var t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
        if(0 < t1 && t1 < 1) {
          if(i == 0) this.addX(f(t1));
          if(i == 1) this.addY(f(t1));
        }
        var t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
        if(0 < t2 && t2 < 1) {
          if(i == 0) this.addX(f(t2));
          if(i == 1) this.addY(f(t2));
        }
      }
    }

    this.isPointInBox = function(x, y) {
      return (this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2);
    }
  }

  svg.BoundingBox.prototype = Object.create(BoundingBox.prototype);

  svg.CanvasBoundingBox = new svg.BoundingBox(0, 0, 0, 0);

  svg.CanvasBoundingBox.expand = function(bb) {
    if(this.freeze) {
      return false;
    }

    if(bb.x1 < -500)
      throw new Error(bb);
    var a = false;

    if(bb.x1 < this.x1) {
      this.x1 = bb.x1;
      a = true;
    }

    if(bb.x2 > this.x2) {
      this.x2 = bb.x2;
      a = true;
    }

    if(bb.y1 < this.y1) {
      this.y1 = bb.y1;
      a = true;
    }

    if(bb.y2 > this.y2) {
      this.y2 = bb.y2;
      a = true;
    }

    if(typeof(this.overflow) === 'undefined') {
      return false;
    }

    return a;
  };

  svg.CanvasBoundingBox.apply = function(ctx, bb) {
    if(Math.floor(bb.width) !== Math.floor(this.width)) {
      ctx.canvas.width = this.width;
      ctx.canvas.style.width = ctx.canvas.width + 'px';
    }

    if(Math.floor(bb.height) !== Math.floor(this.height)) {
      ctx.canvas.height = this.height;
      ctx.canvas.style.height = ctx.canvas.height + 'px';
    }

    if(this.x1 !== 0 || this.y1 !== 0) {
      ctx.translate(-this.x1, -this.y1);
      ctx.translate(bb.x1, bb.y1);
    }
  };

  // transforms
  svg.Transform = function(v, f) {
    f = f || 1;
    var that = this;
    this.Type = {}

    // translate
    this.Type.translate = function(s) {
      this.p = svg.CreatePoint(s);
      this.apply = function(ctx) {
        ctx.translate(this.p.x || 0.0, this.p.y || 0.0);
      }
      this.unapply = function(ctx) {
        ctx.translate(-1.0 * this.p.x || 0.0, -1.0 * this.p.y || 0.0);
      }
      this.applyToPoint = function(p) {
        p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
      }
    }

    // rotate
    this.Type.rotate = function(s) {
      var a = svg.ToNumberArray(s);
      this.angle = new svg.Property('angle', a[0]);
      this.cx = a[1] * f || 0;
      this.cy = a[2] * f || 0;

      this.apply = function(ctx) {
        ctx.translate(this.cx, this.cy);
        var a = this.angle.toRadians();
        ctx.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0);
        ctx.translate(-this.cx, -this.cy);
      }
      this.unapply = function(ctx) {
        ctx.translate(this.cx, this.cy);
        ctx.rotate(-1.0 * this.angle.toRadians());
        ctx.translate(-this.cx, -this.cy);
      }
      this.applyToPoint = function(p) {
        var a = this.angle.toRadians();
        p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
        p.applyTransform([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]);
        p.applyTransform([1, 0, 0, 1, -this.p.x || 0.0, -this.p.y || 0.0]);
      }
    }

    this.Type.scale = function(s) {
      this.p = svg.CreatePoint(s);
      this.apply = function(ctx) {
        ctx.scale(this.p.x || 1.0, this.p.y || this.p.x || 1.0);
      }
      this.unapply = function(ctx) {
        ctx.scale(1.0 / this.p.x || 1.0, 1.0 / this.p.y || this.p.x || 1.0);
      }
      this.applyToPoint = function(p) {
        p.applyTransform([this.p.x || 0.0, 0, 0, this.p.y || 0.0, 0, 0]);
      }
    }

    this.Type.matrix = function(s) {
      this.m = svg.ToNumberArray(s);
      this.apply = function(ctx) {
        ctx.transform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
      }
      this.unapply = function(ctx) {
        var a = this.m[0];
        var b = this.m[2];
        var c = this.m[4];
        var d = this.m[1];
        var e = this.m[3];
        var f = this.m[5];
        var g = 0.0;
        var h = 0.0;
        var i = 1.0;
        var det = 1 / (a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g));
        ctx.transform(
          det * (e * i - f * h),
          det * (f * g - d * i),
          det * (c * h - b * i),
          det * (a * i - c * g),
          det * (b * f - c * e),
          det * (c * d - a * f)
        );
      }
      this.applyToPoint = function(p) {
        p.applyTransform(this.m);
      }
    }

    this.Type.SkewBase = function(s) {
      this.base = that.Type.matrix;
      this.base(s);
      this.angle = new svg.Property('angle', s);
    }
    this.Type.SkewBase.prototype = new this.Type.matrix;

    this.Type.skewX = function(s) {
      this.base = that.Type.SkewBase;
      this.base(s);
      this.m = [1, 0, Math.tan(this.angle.toRadians()), 1, 0, 0];
    }
    this.Type.skewX.prototype = new this.Type.SkewBase;

    this.Type.skewY = function(s) {
      this.base = that.Type.SkewBase;
      this.base(s);
      this.m = [1, Math.tan(this.angle.toRadians()), 0, 1, 0, 0];
    }
    this.Type.skewY.prototype = new this.Type.SkewBase;

    this.transforms = [];

    this.apply = function(ctx) {
      for(var i = 0; i < this.transforms.length; i++) {
        this.transforms[i].apply(ctx);
      }
    }

    this.unapply = function(ctx) {
      for(var i = this.transforms.length - 1; i >= 0; i--) {
        this.transforms[i].unapply(ctx);
      }
    }

    this.applyToPoint = function(p) {
      for(var i = 0; i < this.transforms.length; i++) {
        this.transforms[i].applyToPoint(p);
      }
    }

    var data = svg.trim(svg.compressSpaces(v)).replace(/\)([a-zA-Z])/g, ') $1').replace(/\)(\s?,\s?)/g, ') ').split(/\s(?=[a-z])/);
    for(var i = 0; i < data.length; i++) {
      var type = svg.trim(data[i].split('(')[0]);
      var s = data[i].split('(')[1].replace(')', '');
      var transform = new this.Type[type](s);
      transform.type = type;
      this.transforms.push(transform);
    }
  }

  // aspect ratio
  svg.AspectRatio = function(ctx, aspectRatio, width, desiredWidth, height, desiredHeight, minX, minY, refX, refY) {
    // aspect ratio - http://www.w3.org/TR/SVG/coords.html#PreserveAspectRatioAttribute
    aspectRatio = svg.compressSpaces(aspectRatio);
    aspectRatio = aspectRatio.replace(/^defer\s/, ''); // ignore defer
    var align = aspectRatio.split(' ')[0] || 'xMidYMid';
    var meetOrSlice = aspectRatio.split(' ')[1] || 'meet';

    // calculate scale
    var scaleX = width / desiredWidth;
    var scaleY = height / desiredHeight;
    var scaleMin = Math.min(scaleX, scaleY);
    var scaleMax = Math.max(scaleX, scaleY);
    if(meetOrSlice == 'meet') {
      desiredWidth *= scaleMin;
      desiredHeight *= scaleMin;
    }
    if(meetOrSlice == 'slice') {
      desiredWidth *= scaleMax;
      desiredHeight *= scaleMax;
    }

    refX = new svg.Property('refX', refX);
    refY = new svg.Property('refY', refY);
    if(refX.hasValue() && refY.hasValue()) {
      ctx.translate(-scaleMin * refX.toPixels('x'), -scaleMin * refY.toPixels('y'));
    }
    else {
      // align
      if(align.match(/^xMid/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width / 2.0 - desiredWidth / 2.0, 0);
      if(align.match(/YMid$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height / 2.0 - desiredHeight / 2.0);
      if(align.match(/^xMax/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width - desiredWidth, 0);
      if(align.match(/YMax$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height - desiredHeight);
    }

    // scale
    if(align == 'none') ctx.scale(scaleX, scaleY);
    else if(meetOrSlice == 'meet') ctx.scale(scaleMin, scaleMin);
    else if(meetOrSlice == 'slice') ctx.scale(scaleMax, scaleMax);

    // translate
    ctx.translate(minX == null ? 0 : -minX, minY == null ? 0 : -minY);
  }

  // elements
  svg.Element = {}

  svg.EmptyProperty = new svg.Property('EMPTY', '');

  svg.Element.ElementBase = function(node) {
    this.attributes = {};
    this.styles = {};
    this.stylesSpecificity = {};
    this.children = [];

    // get or create attribute
    this.attribute = function(name, createIfNotExists) {
      var a = this.attributes[name];
      if(a != null) return a;

      if(createIfNotExists == true) {
        a = new svg.Property(name, '');
        this.attributes[name] = a;
      }
      return a || svg.EmptyProperty;
    }

    this.getHrefAttribute = function() {
      for(var a in this.attributes) {
        if(a.match(/:href$/)) {
          return this.attributes[a];
        }
      }
      return svg.EmptyProperty;
    }

    // get or create style, crawls up node tree
    this.style = function(name, createIfNotExists, skipAncestors) {
      var s = this.styles[name];
      if(s != null) return s;

      var a = this.attribute(name);
      if(a != null && a.hasValue()) {
        this.styles[name] = a; // move up to me to cache
        return a;
      }

      if(skipAncestors != true) {
        var p = this.parent;
        if(p != null) {
          var ps = p.style(name);
          if(ps != null && ps.hasValue()) {
            return ps;
          }
        }
      }

      if(createIfNotExists == true) {
        s = new svg.Property(name, '');
        this.styles[name] = s;
      }
      return s || svg.EmptyProperty;
    }

    // base render
    this.render = function(ctx) {
      // don't render display=none
      if(this.style('display').value == 'none') return;

      // don't render visibility=hidden
      if(this.style('visibility').value == 'hidden') return;

      ctx.save();
      if(this.attribute('mask').hasValue()) { // mask
        var mask = this.attribute('mask').getDefinition();
        if(mask != null) mask.apply(ctx, this);
      }
      else if(this.style('filter').hasValue()) { // filter
        var filter = this.style('filter').getDefinition();
        if(filter != null) filter.apply(ctx, this);
      }
      else {
        this.setContext(ctx);
        this.renderChildren(ctx);
        this.clearContext(ctx);
      }
      ctx.restore();
    }

    // base set context
    this.setContext = function(ctx) {
      // OVERRIDE ME!
    }

    // base clear context
    this.clearContext = function(ctx) {
      // OVERRIDE ME!
    }

    // base render children
    this.renderChildren = function(ctx) {
      for(var i = 0; i < this.children.length; i++) {
        this.children[i].render(ctx);
      }
    }

    this.addChild = function(childNode, create) {
      var child = childNode;
      if(create) child = svg.CreateElement(childNode);
      child.parent = this;
      if(child.type != 'title') {
        this.children.push(child);
      }
    }

    this.addStylesFromStyleDefinition = function() {
      // add styles
      for(var selector in svg.Styles) {
        if(matchesSelector(node, selector)) {
          var styles = svg.Styles[selector];
          var specificity = svg.StylesSpecificity[selector];
          if(styles != null) {
            for(var name in styles) {
              var existingSpecificity = this.stylesSpecificity[name];
              if(typeof(existingSpecificity) == 'undefined') {
                existingSpecificity = '000';
              }
              if(specificity > existingSpecificity) {
                this.styles[name] = styles[name];
                this.stylesSpecificity[name] = specificity;
              }
            }
          }
        }
      }
    };

    if(node != null && node.nodeType == 1) { //ELEMENT_NODE
      // add attributes
      for(var i = 0; i < node.attributes.length; i++) {
        var attribute = node.attributes[i];
        this.attributes[attribute.nodeName] = new svg.Property(attribute.nodeName, attribute.value);
      }

      this.addStylesFromStyleDefinition();

      // add inline styles
      if(this.attribute('style').hasValue()) {
        var styles = this.attribute('style').value.split(';');
        for(var i = 0; i < styles.length; i++) {
          if(svg.trim(styles[i]) != '') {
            var style = styles[i].split(':');
            var name = svg.trim(style[0]);
            var value = svg.trim(style[1]);
            this.styles[name] = new svg.Property(name, value);
          }
        }
      }

      // add id
      if(this.attribute('id').hasValue()) {
        if(svg.Definitions[this.attribute('id').value] == null) {
          svg.Definitions[this.attribute('id').value] = this;
        }
      }

      // add children
      for(var i = 0; i < node.childNodes.length; i++) {
        var childNode = node.childNodes[i];
        if(childNode.nodeType == 1) this.addChild(childNode, true); //ELEMENT_NODE
        if(this.captureTextNodes && (childNode.nodeType == 3 || childNode.nodeType == 4)) {
          var text = childNode.value || childNode.text || childNode.textContent || '';
          if(svg.compressSpaces(text) != '') {
            this.addChild(new svg.Element.tspan(childNode), false); // TEXT_NODE
          }
        }
      }
    }
  }

  svg.Element.RenderedElementBase = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.setContext = function(ctx) {
      // fill
      if(this.style('fill').isUrlDefinition()) {
        var fs = this.style('fill').getFillStyleDefinition(this, this.style('fill-opacity'));
        if(fs != null) ctx.fillStyle = fs;
      }
      else if(this.style('fill').hasValue()) {
        var fillStyle = this.style('fill');
        if(fillStyle.value == 'currentColor') fillStyle.value = this.style('color').value;
        if(fillStyle.value != 'inherit') ctx.fillStyle = (fillStyle.value == 'none' ? 'rgba(0,0,0,0)' : fillStyle.value);
      }
      if(this.style('fill-opacity').hasValue()) {
        var fillStyle = new svg.Property('fill', ctx.fillStyle);
        fillStyle = fillStyle.addOpacity(this.style('fill-opacity'));
        ctx.fillStyle = fillStyle.value;
      }

      // stroke
      if(this.style('stroke').isUrlDefinition()) {
        var fs = this.style('stroke').getFillStyleDefinition(this, this.style('stroke-opacity'));
        if(fs != null) ctx.strokeStyle = fs;
      }
      else if(this.style('stroke').hasValue()) {
        var strokeStyle = this.style('stroke');
        if(strokeStyle.value == 'currentColor') strokeStyle.value = this.style('color').value;
        if(strokeStyle.value != 'inherit') ctx.strokeStyle = (strokeStyle.value == 'none' ? 'rgba(0,0,0,0)' : strokeStyle.value);
      }
      if(this.style('stroke-opacity').hasValue()) {
        var strokeStyle = new svg.Property('stroke', ctx.strokeStyle);
        strokeStyle = strokeStyle.addOpacity(this.style('stroke-opacity'));
        ctx.strokeStyle = strokeStyle.value;
      }
      if(this.style('stroke-width').hasValue()) {
        var newLineWidth = this.style('stroke-width').toPixels();
        ctx.lineWidth = newLineWidth == 0 ? 0.001 : newLineWidth; // browsers don't respect 0
      }
      if(this.style('stroke-linecap').hasValue()) ctx.lineCap = this.style('stroke-linecap').value;
      if(this.style('stroke-linejoin').hasValue()) ctx.lineJoin = this.style('stroke-linejoin').value;
      if(this.style('stroke-miterlimit').hasValue()) ctx.miterLimit = this.style('stroke-miterlimit').value;
      if(this.style('stroke-dasharray').hasValue() && this.style('stroke-dasharray').value != 'none') {
        var gaps = svg.ToNumberArray(this.style('stroke-dasharray').value);
        if(typeof(ctx.setLineDash) != 'undefined') {
          ctx.setLineDash(gaps);
        }
        else if(typeof(ctx.webkitLineDash) != 'undefined') {
          ctx.webkitLineDash = gaps;
        }
        else if(typeof(ctx.mozDash) != 'undefined' && !(gaps.length == 1 && gaps[0] == 0)) {
          ctx.mozDash = gaps;
        }

        var offset = this.style('stroke-dashoffset').numValueOrDefault(1);
        if(typeof(ctx.lineDashOffset) != 'undefined') {
          ctx.lineDashOffset = offset;
        }
        else if(typeof(ctx.webkitLineDashOffset) != 'undefined') {
          ctx.webkitLineDashOffset = offset;
        }
        else if(typeof(ctx.mozDashOffset) != 'undefined') {
          ctx.mozDashOffset = offset;
        }
      }

      // font
      if(typeof(ctx.font) != 'undefined') {
        ctx.font = svg.Font.CreateFont(
          this.style('font-style').value,
          this.style('font-variant').value,
          this.style('font-weight').value,
          this.style('font-size').hasValue() ? this.style('font-size').toPixels() + 'px' : '',
          this.style('font-family').value).toString();
      }

      // transform
      if(this.attribute('transform').hasValue()) {
        var transform = new svg.Transform(this.attribute('transform').value);
        transform.apply(ctx);
      }

      // clip
      if(this.attribute('clip-path', false, true).hasValue()) {
        var clip = this.attribute('clip-path', false, true).getDefinition();
        if(clip != null) clip.apply(ctx);
      }

      // opacity
      if(this.style('opacity').hasValue()) {
        ctx.globalAlpha = this.style('opacity').numValue();
      }
    }
  }
  svg.Element.RenderedElementBase.prototype = new svg.Element.ElementBase;

  svg.Element.PathElementBase = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.path = function(ctx) {
      if(ctx != null) ctx.beginPath();
      return new svg.BoundingBox();
    }

    this.baseSetContext = this.setContext;
    this.setContext = function(ctx) {
      var bb = this.getBoundingBox();
      var bt = {
        width: svg.CanvasBoundingBox.width,
        height: svg.CanvasBoundingBox.height,
        x1: svg.CanvasBoundingBox.x1,
        y1: svg.CanvasBoundingBox.y1
      };

      if(svg.CanvasBoundingBox.expand(bb)) {
        svg.CanvasBoundingBox.apply(ctx, bt);
      }

      this.baseSetContext(ctx);
    };

    this.renderChildren = function(ctx) {
      this.path(ctx);

      svg.Mouse.checkPath(this, ctx);
      if(ctx.fillStyle != '') {
        if(this.style('fill-rule').valueOrDefault('inherit') != 'inherit') {
          ctx.fill(this.style('fill-rule').value);
        }
        else {
          ctx.fill();
        }
      }
      if(ctx.strokeStyle != '') ctx.stroke();

      var markers = this.getMarkers();
      if(markers != null) {
        if(this.style('marker-start').isUrlDefinition()) {
          var marker = this.style('marker-start').getDefinition();
          marker.render(ctx, markers[0][0], markers[0][1]);
        }
        if(this.style('marker-mid').isUrlDefinition()) {
          var marker = this.style('marker-mid').getDefinition();
          for(var i = 1; i < markers.length - 1; i++) {
            marker.render(ctx, markers[i][0], markers[i][1]);
          }
        }
        if(this.style('marker-end').isUrlDefinition()) {
          var marker = this.style('marker-end').getDefinition();
          marker.render(ctx, markers[markers.length - 1][0], markers[markers.length - 1][1]);
        }
      }
    }

    this.getBoundingBox = function() {
      if(node != null && typeof(node.getBBox) !== 'undefined') {
        var box = node.getBBox();
        return new svg.BoundingBox(box.x, box.y, box.x + box.width, box.y + box.height);
      }
      return this.path();
    }

    this.getMarkers = function() {
      return null;
    }
  }
  svg.Element.PathElementBase.prototype = new svg.Element.RenderedElementBase;

  // svg element
  svg.Element.svg = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.baseClearContext = this.clearContext;
    this.clearContext = function(ctx) {
      this.baseClearContext(ctx);
      svg.ViewPort.RemoveCurrent();
    }

    this.baseSetContext = this.setContext;
    this.setContext = function(ctx) {
      // initial values and defaults
      ctx.strokeStyle = 'rgba(0,0,0,0)';
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 4;
      if(typeof(ctx.font) != 'undefined' && typeof(window.getComputedStyle) != 'undefined') {
        ctx.font = window.getComputedStyle(ctx.canvas).getPropertyValue('font');
      }

      this.baseSetContext(ctx);

      // create new view port
      if(!this.attribute('x').hasValue()) this.attribute('x', true).value = 0;
      if(!this.attribute('y').hasValue()) this.attribute('y', true).value = 0;
      ctx.translate(this.attribute('x').toPixels('x'), this.attribute('y').toPixels('y'));

      var width = svg.ViewPort.width();
      var height = svg.ViewPort.height();

      if(!this.attribute('width').hasValue()) this.attribute('width', true).value = '100%';
      if(!this.attribute('height').hasValue()) this.attribute('height', true).value = '100%';
      if(typeof(this.root) == 'undefined') {
        width = this.attribute('width').toPixels('x');
        height = this.attribute('height').toPixels('y');

        var x = 0;
        var y = 0;
        if(this.attribute('refX').hasValue() && this.attribute('refY').hasValue()) {
          x = -this.attribute('refX').toPixels('x');
          y = -this.attribute('refY').toPixels('y');
        }
      }
      svg.ViewPort.SetCurrent(width, height);

      // viewbox
      if(this.attribute('viewBox').hasValue()) {
        var viewBox = svg.ToNumberArray(this.attribute('viewBox').value);
        var minX = viewBox[0];
        var minY = viewBox[1];
        width = viewBox[2];
        height = viewBox[3];

        svg.AspectRatio(ctx,
          this.attribute('preserveAspectRatio').value,
          svg.ViewPort.width(),
          width,
          svg.ViewPort.height(),
          height,
          minX,
          minY,
          this.attribute('refX').value,
          this.attribute('refY').value);

        svg.ViewPort.RemoveCurrent();
        svg.ViewPort.SetCurrent(viewBox[2], viewBox[3]);
      }

      if(this.styles.overflow && this.styles.overflow.value === 'visible') {
        svg.CanvasBoundingBox.overflow = true;
      }

      svg.CanvasBoundingBox.expand(new svg.BoundingBox(0, 0, svg.ViewPort.width(), svg.ViewPort.height()));
    }
  }
  svg.Element.svg.prototype = new svg.Element.RenderedElementBase;

  // rect element
  svg.Element.rect = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    this.path = function(ctx) {
      var x = this.attribute('x').toPixels('x');
      var y = this.attribute('y').toPixels('y');
      var width = this.attribute('width').toPixels('x');
      var height = this.attribute('height').toPixels('y');
      var rx = this.attribute('rx').toPixels('x');
      var ry = this.attribute('ry').toPixels('y');
      if(this.attribute('rx').hasValue() && !this.attribute('ry').hasValue()) ry = rx;
      if(this.attribute('ry').hasValue() && !this.attribute('rx').hasValue()) rx = ry;
      rx = Math.min(rx, width / 2.0);
      ry = Math.min(ry, height / 2.0);
      if(ctx != null) {
        ctx.beginPath();
        ctx.moveTo(x + rx, y);
        ctx.lineTo(x + width - rx, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + ry)
        ctx.lineTo(x + width, y + height - ry);
        ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height)
        ctx.lineTo(x + rx, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - ry)
        ctx.lineTo(x, y + ry);
        ctx.quadraticCurveTo(x, y, x + rx, y)
        ctx.closePath();
      }

      return new svg.BoundingBox(x, y, x + width, y + height);
    }
  }
  svg.Element.rect.prototype = new svg.Element.PathElementBase;

  // circle element
  svg.Element.circle = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    this.path = function(ctx) {
      var cx = this.attribute('cx').toPixels('x');
      var cy = this.attribute('cy').toPixels('y');
      var r = this.attribute('r').toPixels();

      if(ctx != null) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
        ctx.closePath();
      }

      return new svg.BoundingBox(cx - r, cy - r, cx + r, cy + r);
    }
  }
  svg.Element.circle.prototype = new svg.Element.PathElementBase;

  // ellipse element
  svg.Element.ellipse = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    this.path = function(ctx) {
      var KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
      var rx = this.attribute('rx').toPixels('x');
      var ry = this.attribute('ry').toPixels('y');
      var cx = this.attribute('cx').toPixels('x');
      var cy = this.attribute('cy').toPixels('y');

      if(ctx != null) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.bezierCurveTo(cx + (KAPPA * rx), cy - ry, cx + rx, cy - (KAPPA * ry), cx + rx, cy);
        ctx.bezierCurveTo(cx + rx, cy + (KAPPA * ry), cx + (KAPPA * rx), cy + ry, cx, cy + ry);
        ctx.bezierCurveTo(cx - (KAPPA * rx), cy + ry, cx - rx, cy + (KAPPA * ry), cx - rx, cy);
        ctx.bezierCurveTo(cx - rx, cy - (KAPPA * ry), cx - (KAPPA * rx), cy - ry, cx, cy - ry);
        ctx.closePath();
      }

      return new svg.BoundingBox(cx - rx, cy - ry, cx + rx, cy + ry);
    }
  }
  svg.Element.ellipse.prototype = new svg.Element.PathElementBase;

  // line element
  svg.Element.line = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    this.getPoints = function() {
      return [
        new svg.Point(this.attribute('x1').toPixels('x'), this.attribute('y1').toPixels('y')),
        new svg.Point(this.attribute('x2').toPixels('x'), this.attribute('y2').toPixels('y'))];
    }

    this.path = function(ctx) {
      var points = this.getPoints();

      if(ctx != null) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
      }

      return new svg.BoundingBox(points[0].x, points[0].y, points[1].x, points[1].y);
    }

    this.getMarkers = function() {
      var points = this.getPoints();
      var a = points[0].angleTo(points[1]);
      return [[points[0], a], [points[1], a]];
    }
  }
  svg.Element.line.prototype = new svg.Element.PathElementBase;

  // polyline element
  svg.Element.polyline = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    this.points = svg.CreatePath(this.attribute('points').value);
    this.path = function(ctx) {
      var bb = new svg.BoundingBox(this.points[0].x, this.points[0].y);
      if(ctx != null) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
      }
      for(var i = 1; i < this.points.length; i++) {
        bb.addPoint(this.points[i].x, this.points[i].y);
        if(ctx != null) ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      return bb;
    }

    this.getMarkers = function() {
      var markers = [];
      for(var i = 0; i < this.points.length - 1; i++) {
        markers.push([this.points[i], this.points[i].angleTo(this.points[i + 1])]);
      }
      markers.push([this.points[this.points.length - 1], markers[markers.length - 1][1]]);
      return markers;
    }
  }
  svg.Element.polyline.prototype = new svg.Element.PathElementBase;

  // polygon element
  svg.Element.polygon = function(node) {
    this.base = svg.Element.polyline;
    this.base(node);

    this.basePath = this.path;
    this.path = function(ctx) {
      var bb = this.basePath(ctx);
      if(ctx != null) {
        ctx.lineTo(this.points[0].x, this.points[0].y);
        ctx.closePath();
      }
      return bb;
    }
  }
  svg.Element.polygon.prototype = new svg.Element.polyline;

  // path element
  svg.Element.path = function(node) {
    this.base = svg.Element.PathElementBase;
    this.base(node);

    var d = this.attribute('d').value;
    // TODO: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
    d = d.replace(/,/gm, ' '); // get rid of all commas
    // As the end of a match can also be the start of the next match, we need to run this replace twice.
    for(var i = 0; i < 2; i++)
      d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm, '$1 $2'); // suffix commands with spaces
    d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // prefix commands with spaces
    d = d.replace(/([0-9])([+\-])/gm, '$1 $2'); // separate digits on +- signs
    // Again, we need to run this twice to find all occurances
    for(var i = 0; i < 2; i++)
      d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2'); // separate digits when they start with a comma
    d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm, '$1 $3 $4 '); // shorthand elliptical arc path syntax
    d = svg.compressSpaces(d); // compress multiple spaces
    d = svg.trim(d);
    this.PathParser = new (function(d) {
      this.tokens = d.split(' ');

      this.reset = function() {
        this.i = -1;
        this.command = '';
        this.previousCommand = '';
        this.start = new svg.Point(0, 0);
        this.control = new svg.Point(0, 0);
        this.current = new svg.Point(0, 0);
        this.points = [];
        this.angles = [];
      }

      this.isEnd = function() {
        return this.i >= this.tokens.length - 1;
      }

      this.isCommandOrEnd = function() {
        if(this.isEnd()) return true;
        return this.tokens[this.i + 1].match(/^[A-Za-z]$/) != null;
      }

      this.isRelativeCommand = function() {
        switch(this.command) {
          case 'm':
          case 'l':
          case 'h':
          case 'v':
          case 'c':
          case 's':
          case 'q':
          case 't':
          case 'a':
          case 'z':
            return true;
            break;
        }
        return false;
      }

      this.getToken = function() {
        this.i++;
        return this.tokens[this.i];
      }

      this.getScalar = function() {
        return parseFloat(this.getToken());
      }

      this.nextCommand = function() {
        this.previousCommand = this.command;
        this.command = this.getToken();
      }

      this.getPoint = function() {
        var p = new svg.Point(this.getScalar(), this.getScalar());
        return this.makeAbsolute(p);
      }

      this.getAsControlPoint = function() {
        var p = this.getPoint();
        this.control = p;
        return p;
      }

      this.getAsCurrentPoint = function() {
        var p = this.getPoint();
        this.current = p;
        return p;
      }

      this.getReflectedControlPoint = function() {
        if(this.previousCommand.toLowerCase() != 'c' &&
          this.previousCommand.toLowerCase() != 's' &&
          this.previousCommand.toLowerCase() != 'q' &&
          this.previousCommand.toLowerCase() != 't') {
          return this.current;
        }

        // reflect point
        var p = new svg.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
        return p;
      }

      this.makeAbsolute = function(p) {
        if(this.isRelativeCommand()) {
          p.x += this.current.x;
          p.y += this.current.y;
        }
        return p;
      }

      this.addMarker = function(p, from, priorTo) {
        // if the last angle isn't filled in because we didn't have this point yet ...
        if(priorTo != null && this.angles.length > 0 && this.angles[this.angles.length - 1] == null) {
          this.angles[this.angles.length - 1] = this.points[this.points.length - 1].angleTo(priorTo);
        }
        this.addMarkerAngle(p, from == null ? null : from.angleTo(p));
      }

      this.addMarkerAngle = function(p, a) {
        this.points.push(p);
        this.angles.push(a);
      }

      this.getMarkerPoints = function() {
        return this.points;
      }
      this.getMarkerAngles = function() {
        for(var i = 0; i < this.angles.length; i++) {
          if(this.angles[i] == null) {
            for(var j = i + 1; j < this.angles.length; j++) {
              if(this.angles[j] != null) {
                this.angles[i] = this.angles[j];
                break;
              }
            }
          }
        }
        return this.angles;
      }
    })(d);

    this.path = function(ctx) {
      var pp = this.PathParser;
      pp.reset();

      var bb = new svg.BoundingBox();
      if(ctx != null) ctx.beginPath();
      while(!pp.isEnd()) {
        pp.nextCommand();
        switch(pp.command) {
          case 'M':
          case 'm':
            var p = pp.getAsCurrentPoint();
            pp.addMarker(p);
            bb.addPoint(p.x, p.y);
            if(ctx != null) ctx.moveTo(p.x, p.y);
            pp.start = pp.current;
            while(!pp.isCommandOrEnd()) {
              var p = pp.getAsCurrentPoint();
              pp.addMarker(p, pp.start);
              bb.addPoint(p.x, p.y);
              if(ctx != null) ctx.lineTo(p.x, p.y);
            }
            break;
          case 'L':
          case 'l':
            while(!pp.isCommandOrEnd()) {
              var c = pp.current;
              var p = pp.getAsCurrentPoint();
              pp.addMarker(p, c);
              bb.addPoint(p.x, p.y);
              if(ctx != null) ctx.lineTo(p.x, p.y);
            }
            break;
          case 'H':
          case 'h':
            while(!pp.isCommandOrEnd()) {
              var newP = new svg.Point((pp.isRelativeCommand() ? pp.current.x : 0) + pp.getScalar(), pp.current.y);
              pp.addMarker(newP, pp.current);
              pp.current = newP;
              bb.addPoint(pp.current.x, pp.current.y);
              if(ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
            }
            break;
          case 'V':
          case 'v':
            while(!pp.isCommandOrEnd()) {
              var newP = new svg.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + pp.getScalar());
              pp.addMarker(newP, pp.current);
              pp.current = newP;
              bb.addPoint(pp.current.x, pp.current.y);
              if(ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
            }
            break;
          case 'C':
          case 'c':
            while(!pp.isCommandOrEnd()) {
              var curr = pp.current;
              var p1 = pp.getPoint();
              var cntrl = pp.getAsControlPoint();
              var cp = pp.getAsCurrentPoint();
              pp.addMarker(cp, cntrl, p1);
              bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
              if(ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
            }
            break;
          case 'S':
          case 's':
            while(!pp.isCommandOrEnd()) {
              var curr = pp.current;
              var p1 = pp.getReflectedControlPoint();
              var cntrl = pp.getAsControlPoint();
              var cp = pp.getAsCurrentPoint();
              pp.addMarker(cp, cntrl, p1);
              bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
              if(ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
            }
            break;
          case 'Q':
          case 'q':
            while(!pp.isCommandOrEnd()) {
              var curr = pp.current;
              var cntrl = pp.getAsControlPoint();
              var cp = pp.getAsCurrentPoint();
              pp.addMarker(cp, cntrl, cntrl);
              bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
              if(ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
            }
            break;
          case 'T':
          case 't':
            while(!pp.isCommandOrEnd()) {
              var curr = pp.current;
              var cntrl = pp.getReflectedControlPoint();
              pp.control = cntrl;
              var cp = pp.getAsCurrentPoint();
              pp.addMarker(cp, cntrl, cntrl);
              bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
              if(ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
            }
            break;
          case 'A':
          case 'a':
            while(!pp.isCommandOrEnd()) {
              var curr = pp.current;
              var rx = pp.getScalar();
              var ry = pp.getScalar();
              var xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
              var largeArcFlag = pp.getScalar();
              var sweepFlag = pp.getScalar();
              var cp = pp.getAsCurrentPoint();

              // Conversion from endpoint to center parameterization
              // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
              // x1', y1'
              var currp = new svg.Point(
                Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0,
                -Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0
              );
              // adjust radii
              var l = Math.pow(currp.x, 2) / Math.pow(rx, 2) + Math.pow(currp.y, 2) / Math.pow(ry, 2);
              if(l > 1) {
                rx *= Math.sqrt(l);
                ry *= Math.sqrt(l);
              }
              // cx', cy'
              var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
                  ((Math.pow(rx, 2) * Math.pow(ry, 2)) - (Math.pow(rx, 2) * Math.pow(currp.y, 2)) - (Math.pow(ry, 2) * Math.pow(currp.x, 2))) /
                  (Math.pow(rx, 2) * Math.pow(currp.y, 2) + Math.pow(ry, 2) * Math.pow(currp.x, 2))
                );
              if(isNaN(s)) s = 0;
              var cpp = new svg.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
              // cx, cy
              var centp = new svg.Point(
                (curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
                (curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
              );
              // vector magnitude
              var m = function(v) {
                return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
              }
              // ratio between two vectors
              var r = function(u, v) {
                return (u[0] * v[0] + u[1] * v[1]) / (m(u) * m(v))
              }
              // angle between two vectors
              var a = function(u, v) {
                return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(r(u, v));
              }
              // initial angle
              var a1 = a([1, 0], [(currp.x - cpp.x) / rx, (currp.y - cpp.y) / ry]);
              // angle delta
              var u = [(currp.x - cpp.x) / rx, (currp.y - cpp.y) / ry];
              var v = [(-currp.x - cpp.x) / rx, (-currp.y - cpp.y) / ry];
              var ad = a(u, v);
              if(r(u, v) <= -1) ad = Math.PI;
              if(r(u, v) >= 1) ad = 0;

              // for markers
              var dir = 1 - sweepFlag ? 1.0 : -1.0;
              var ah = a1 + dir * (ad / 2.0);
              var halfWay = new svg.Point(
                centp.x + rx * Math.cos(ah),
                centp.y + ry * Math.sin(ah)
              );
              pp.addMarkerAngle(halfWay, ah - dir * Math.PI / 2);
              pp.addMarkerAngle(cp, ah - dir * Math.PI);

              bb.addPoint(cp.x, cp.y); // TODO: this is too naive, make it better
              if(ctx != null) {
                var r = rx > ry ? rx : ry;
                var sx = rx > ry ? 1 : rx / ry;
                var sy = rx > ry ? ry / rx : 1;

                ctx.translate(centp.x, centp.y);
                ctx.rotate(xAxisRotation);
                ctx.scale(sx, sy);
                ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
                ctx.scale(1 / sx, 1 / sy);
                ctx.rotate(-xAxisRotation);
                ctx.translate(-centp.x, -centp.y);
              }
            }
            break;
          case 'Z':
          case 'z':
            if(ctx != null) ctx.closePath();
            pp.current = pp.start;
        }
      }

      return bb;
    }

    this.getMarkers = function() {
      var points = this.PathParser.getMarkerPoints();
      var angles = this.PathParser.getMarkerAngles();

      var markers = [];
      for(var i = 0; i < points.length; i++) {
        markers.push([points[i], angles[i]]);
      }
      return markers;
    }
  }
  svg.Element.path.prototype = new svg.Element.PathElementBase;

  // pattern element
  svg.Element.pattern = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.createPattern = function(ctx, element) {
      var width = this.attribute('width').toPixels('x', true);
      var height = this.attribute('height').toPixels('y', true);

      // render me using a temporary svg element
      var tempSvg = new svg.Element.svg();
      tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
      tempSvg.attributes['width'] = new svg.Property('width', width + 'px');
      tempSvg.attributes['height'] = new svg.Property('height', height + 'px');
      tempSvg.attributes['transform'] = new svg.Property('transform', this.attribute('patternTransform').value);
      tempSvg.children = this.children;

      var c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      var cctx = c.getContext('2d');
      if(this.attribute('x').hasValue() && this.attribute('y').hasValue()) {
        cctx.translate(this.attribute('x').toPixels('x', true), this.attribute('y').toPixels('y', true));
      }


      svg.CanvasBoundingBox.freeze = true;
      tempSvg.render(cctx);
      svg.CanvasBoundingBox.freeze = false;

      var pattern = ctx.createPattern(c, 'repeat');
      return pattern;
    }
  }
  svg.Element.pattern.prototype = new svg.Element.ElementBase;

  // marker element
  svg.Element.marker = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.baseRender = this.render;
    this.render = function(ctx, point, angle) {
      ctx.translate(point.x, point.y);
      if(this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(angle);
      if(this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(ctx.lineWidth, ctx.lineWidth);
      ctx.save();

      // render me using a temporary svg element
      var tempSvg = new svg.Element.svg();
      tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
      tempSvg.attributes['refX'] = new svg.Property('refX', this.attribute('refX').value);
      tempSvg.attributes['refY'] = new svg.Property('refY', this.attribute('refY').value);
      tempSvg.attributes['width'] = new svg.Property('width', this.attribute('markerWidth').value);
      tempSvg.attributes['height'] = new svg.Property('height', this.attribute('markerHeight').value);
      tempSvg.attributes['fill'] = new svg.Property('fill', this.attribute('fill').valueOrDefault('black'));
      tempSvg.attributes['stroke'] = new svg.Property('stroke', this.attribute('stroke').valueOrDefault('none'));
      tempSvg.children = this.children;
      tempSvg.render(ctx);

      ctx.restore();
      if(this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(1 / ctx.lineWidth, 1 / ctx.lineWidth);
      if(this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(-angle);
      ctx.translate(-point.x, -point.y);
    }
  }
  svg.Element.marker.prototype = new svg.Element.ElementBase;

  // definitions element
  svg.Element.defs = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.render = function(ctx) {
      // NOOP
    }
  }
  svg.Element.defs.prototype = new svg.Element.ElementBase;

  // base for gradients
  svg.Element.GradientBase = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.gradientUnits = this.attribute('gradientUnits').valueOrDefault('objectBoundingBox');

    this.stops = [];
    for(var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      if(child.type == 'stop') this.stops.push(child);
    }

    this.getGradient = function() {
      // OVERRIDE ME!
    }

    this.createGradient = function(ctx, element, parentOpacityProp) {
      var stopsContainer = this;
      if(this.getHrefAttribute().hasValue()) {
        stopsContainer = this.getHrefAttribute().getDefinition();
      }

      var addParentOpacity = function(color) {
        if(parentOpacityProp.hasValue()) {
          var p = new svg.Property('color', color);
          return p.addOpacity(parentOpacityProp).value;
        }
        return color;
      };

      var g = this.getGradient(ctx, element);
      if(g == null) return addParentOpacity(stopsContainer.stops[stopsContainer.stops.length - 1].color);
      for(var i = 0; i < stopsContainer.stops.length; i++) {
        g.addColorStop(stopsContainer.stops[i].offset, addParentOpacity(stopsContainer.stops[i].color));
      }

      if(this.attribute('gradientTransform').hasValue()) {
        // render as transformed pattern on temporary canvas
        var rootView = svg.ViewPort.Current();
        var bb = this.gradientUnits == 'objectBoundingBox' ? element.getBoundingBox() : null;

        var unit = Math.min(rootView.width, rootView.height);

        var c = document.createElement('canvas');
        c.width = rootView.width;
        c.height = rootView.height;

        var tempCtx = c.getContext('2d');
        var transform = new svg.Transform(this.attribute('gradientTransform').value, unit);

        tempCtx.fillStyle = g;

        svg.CanvasBoundingBox.freeze = true;

        var scaleX = rootView.width > rootView.height ? rootView.width / rootView.height : 1;
        var scaleY = rootView.height > rootView.width ? rootView.height / rootView.width : 1;

        tempCtx.scale(scaleX, scaleY);

        if(element.style('stroke-width').hasValue()) {
          var radix = -element.style('stroke-width').toPixels();
          tempCtx.translate(radix, radix);
        }

        transform.apply(tempCtx);

        if(bb.x1 < 0)
          tempCtx.translate(bb.x1 / scaleX, 0);

        if(bb.y1 < 0)
          tempCtx.translate(0, bb.y1 / scaleY);

        tempCtx.fillRect(-svg.MAX_VIRTUAL_PIXELS / 3.0, -svg.MAX_VIRTUAL_PIXELS / 3.0, svg.MAX_VIRTUAL_PIXELS, svg.MAX_VIRTUAL_PIXELS);
        svg.CanvasBoundingBox.freeze = false;

        return tempCtx.createPattern(c, 'no-repeat');
      }

      return g;
    }
  }
  svg.Element.GradientBase.prototype = new svg.Element.ElementBase;

  // linear gradient element
  svg.Element.linearGradient = function(node) {
    this.base = svg.Element.GradientBase;
    this.base(node);

    this.getGradient = function(ctx, element) {
      var bb = this.gradientUnits == 'objectBoundingBox' ? element.getBoundingBox() : null;

      if(!this.attribute('x1').hasValue()
        && !this.attribute('y1').hasValue()
        && !this.attribute('x2').hasValue()
        && !this.attribute('y2').hasValue()) {
        this.attribute('x1', true).value = 0;
        this.attribute('y1', true).value = 0;
        this.attribute('x2', true).value = 1;
        this.attribute('y2', true).value = 0;
      }

      var offset = 0;
      var unit = Math.min(bb.width, bb.height);

      var x1 = (this.gradientUnits == 'objectBoundingBox'
        ? unit * this.attribute('x1').numValue() + offset
        : this.attribute('x1').toPixels('x'));
      var y1 = (this.gradientUnits == 'objectBoundingBox'
        ? unit * this.attribute('y1').numValue() + offset
        : this.attribute('y1').toPixels('y'));
      var x2 = (this.gradientUnits == 'objectBoundingBox'
        ? unit * this.attribute('x2').numValue() + offset
        : this.attribute('x2').toPixels('x'));
      var y2 = (this.gradientUnits == 'objectBoundingBox'
        ? unit * this.attribute('y2').numValue() + offset
        : this.attribute('y2').toPixels('y'));

      if(x1 == x2 && y1 == y2) return null;
      return ctx.createLinearGradient(x1, y1, x2, y2);
    }
  }
  svg.Element.linearGradient.prototype = new svg.Element.GradientBase;

  // radial gradient element
  svg.Element.radialGradient = function(node) {
    this.base = svg.Element.GradientBase;
    this.base(node);

    this.getGradient = function(ctx, element) {
      var bb = element.getBoundingBox();

      if(!this.attribute('cx').hasValue()) this.attribute('cx', true).value = '50%';
      if(!this.attribute('cy').hasValue()) this.attribute('cy', true).value = '50%';
      if(!this.attribute('r').hasValue()) this.attribute('r', true).value = '50%';

      var cx = (this.gradientUnits == 'objectBoundingBox'
        ? bb.x + bb.width * this.attribute('cx').numValue()
        : this.attribute('cx').toPixels('x'));
      var cy = (this.gradientUnits == 'objectBoundingBox'
        ? bb.y + bb.height * this.attribute('cy').numValue()
        : this.attribute('cy').toPixels('y'));

      var fx = cx;
      var fy = cy;
      if(this.attribute('fx').hasValue()) {
        fx = (this.gradientUnits == 'objectBoundingBox'
          ? bb.x + bb.width * this.attribute('fx').numValue()
          : this.attribute('fx').toPixels('x'));
      }
      if(this.attribute('fy').hasValue()) {
        fy = (this.gradientUnits == 'objectBoundingBox'
          ? bb.y + bb.height * this.attribute('fy').numValue()
          : this.attribute('fy').toPixels('y'));
      }

      var r = (this.gradientUnits == 'objectBoundingBox'
        ? (bb.width + bb.height) / 2.0 * this.attribute('r').numValue()
        : this.attribute('r').toPixels());

      return ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
    }
  }
  svg.Element.radialGradient.prototype = new svg.Element.GradientBase;

  // gradient stop element
  svg.Element.stop = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.offset = this.attribute('offset').numValue();
    if(this.offset < 0) this.offset = 0;
    if(this.offset > 1) this.offset = 1;

    var stopColor = this.style('stop-color', true);
    if(stopColor.value === '') stopColor.value = '#000';
    if(this.style('stop-opacity').hasValue()) stopColor = stopColor.addOpacity(this.style('stop-opacity'));
    this.color = stopColor.value;
  }
  svg.Element.stop.prototype = new svg.Element.ElementBase;

  // animation base element
  svg.Element.AnimateBase = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    svg.Animations.push(this);

    this.duration = 0.0;
    this.begin = this.attribute('begin').toMilliseconds();
    this.maxDuration = this.begin + this.attribute('dur').toMilliseconds();

    this.getProperty = function() {
      var attributeType = this.attribute('attributeType').value;
      var attributeName = this.attribute('attributeName').value;

      if(attributeType == 'CSS') {
        return this.parent.style(attributeName, true);
      }
      return this.parent.attribute(attributeName, true);
    };

    this.initialValue = null;
    this.initialUnits = '';
    this.removed = false;

    this.calcValue = function() {
      // OVERRIDE ME!
      return '';
    }

    this.update = function(delta) {
      // set initial value
      if(this.initialValue == null) {
        this.initialValue = this.getProperty().value;
        this.initialUnits = this.getProperty().getUnits();
      }

      // if we're past the end time
      if(this.duration > this.maxDuration) {
        // loop for indefinitely repeating animations
        if(this.attribute('repeatCount').value == 'indefinite'
          || this.attribute('repeatDur').value == 'indefinite') {
          this.duration = 0.0
        }
        else if(this.attribute('fill').valueOrDefault('remove') == 'freeze' && !this.frozen) {
          this.frozen = true;
          this.parent.animationFrozen = true;
          this.parent.animationFrozenValue = this.getProperty().value;
        }
        else if(this.attribute('fill').valueOrDefault('remove') == 'remove' && !this.removed) {
          this.removed = true;
          this.getProperty().value = this.parent.animationFrozen ? this.parent.animationFrozenValue : this.initialValue;
          return true;
        }
        return false;
      }
      this.duration = this.duration + delta;

      // if we're past the begin time
      var updated = false;
      if(this.begin < this.duration) {
        var newValue = this.calcValue(); // tween

        if(this.attribute('type').hasValue()) {
          // for transform, etc.
          var type = this.attribute('type').value;
          newValue = type + '(' + newValue + ')';
        }

        this.getProperty().value = newValue;
        updated = true;
      }

      return updated;
    }

    this.from = this.attribute('from');
    this.to = this.attribute('to');
    this.values = this.attribute('values');
    if(this.values.hasValue()) this.values.value = this.values.value.split(';');

    // fraction of duration we've covered
    this.progress = function() {
      var ret = {progress: (this.duration - this.begin) / (this.maxDuration - this.begin)};
      if(this.values.hasValue()) {
        var p = ret.progress * (this.values.value.length - 1);
        var lb = Math.floor(p), ub = Math.ceil(p);
        ret.from = new svg.Property('from', parseFloat(this.values.value[lb]));
        ret.to = new svg.Property('to', parseFloat(this.values.value[ub]));
        ret.progress = (p - lb) / (ub - lb);
      }
      else {
        ret.from = this.from;
        ret.to = this.to;
      }
      return ret;
    }
  }
  svg.Element.AnimateBase.prototype = new svg.Element.ElementBase;

  // animate element
  svg.Element.animate = function(node) {
    this.base = svg.Element.AnimateBase;
    this.base(node);

    this.calcValue = function() {
      var p = this.progress();

      // tween value linearly
      var newValue = p.from.numValue() + (p.to.numValue() - p.from.numValue()) * p.progress;
      return newValue + this.initialUnits;
    };
  }
  svg.Element.animate.prototype = new svg.Element.AnimateBase;

  // animate color element
  svg.Element.animateColor = function(node) {
    this.base = svg.Element.AnimateBase;
    this.base(node);

    this.calcValue = function() {
      var p = this.progress();
      var from = new Color(p.from.value);
      var to = new Color(p.to.value);

      if(from.isColor && to.isColor) {
        // tween color linearly
        var r = from.r + (to.r - from.r) * p.progress;
        var g = from.g + (to.g - from.g) * p.progress;
        var b = from.b + (to.b - from.b) * p.progress;
        return 'rgb(' + parseInt(r, 10) + ',' + parseInt(g, 10) + ',' + parseInt(b, 10) + ')';
      }
      return this.attribute('from').value;
    };
  }
  svg.Element.animateColor.prototype = new svg.Element.AnimateBase;

  // animate transform element
  svg.Element.animateTransform = function(node) {
    this.base = svg.Element.AnimateBase;
    this.base(node);

    this.calcValue = function() {
      var p = this.progress();

      // tween value linearly
      var from = svg.ToNumberArray(p.from.value);
      var to = svg.ToNumberArray(p.to.value);
      var newValue = '';
      for(var i = 0; i < from.length; i++) {
        newValue += from[i] + (to[i] - from[i]) * p.progress + ' ';
      }
      return newValue;
    };
  }
  svg.Element.animateTransform.prototype = new svg.Element.animate;

  // font element
  svg.Element.font = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.horizAdvX = this.attribute('horiz-adv-x').numValue();

    this.isRTL = false;
    this.isArabic = false;
    this.fontFace = null;
    this.missingGlyph = null;
    this.glyphs = [];
    for(var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      if(child.type == 'font-face') {
        this.fontFace = child;
        if(child.style('font-family').hasValue()) {
          svg.Definitions[child.style('font-family').value] = this;
        }
      }
      else if(child.type == 'missing-glyph') this.missingGlyph = child;
      else if(child.type == 'glyph') {
        if(child.arabicForm != '') {
          this.isRTL = true;
          this.isArabic = true;
          if(typeof(this.glyphs[child.unicode]) == 'undefined') this.glyphs[child.unicode] = [];
          this.glyphs[child.unicode][child.arabicForm] = child;
        }
        else {
          this.glyphs[child.unicode] = child;
        }
      }
    }
  }
  svg.Element.font.prototype = new svg.Element.ElementBase;

  // font-face element
  svg.Element.fontface = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.ascent = this.attribute('ascent').value;
    this.descent = this.attribute('descent').value;
    this.unitsPerEm = this.attribute('units-per-em').numValue();
  }
  svg.Element.fontface.prototype = new svg.Element.ElementBase;

  // missing-glyph element
  svg.Element.missingglyph = function(node) {
    this.base = svg.Element.path;
    this.base(node);

    this.horizAdvX = 0;
  }
  svg.Element.missingglyph.prototype = new svg.Element.path;

  // glyph element
  svg.Element.glyph = function(node) {
    this.base = svg.Element.path;
    this.base(node);

    this.horizAdvX = this.attribute('horiz-adv-x').numValue();
    this.unicode = this.attribute('unicode').value;
    this.arabicForm = this.attribute('arabic-form').value;
  }
  svg.Element.glyph.prototype = new svg.Element.path;

  // text element
  svg.Element.text = function(node) {
    this.captureTextNodes = true;
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.baseSetContext = this.setContext;
    this.setContext = function(ctx) {
      this.baseSetContext(ctx);

      var textBaseline = this.style('dominant-baseline').toTextBaseline();
      if(textBaseline == null) textBaseline = this.style('alignment-baseline').toTextBaseline();
      if(textBaseline != null) ctx.textBaseline = textBaseline;
    }

    this.getBoundingBox = function() {
      var x = this.attribute('x').toPixels('x');
      var y = this.attribute('y').toPixels('y');
      var fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
      return new svg.BoundingBox(x, y - fontSize, x + Math.floor(fontSize * 2.0 / 3.0) * this.children[0].getText().length, y);
    }

    this.renderChildren = function(ctx) {
      this.x = this.attribute('x').toPixels('x');
      this.y = this.attribute('y').toPixels('y');
      this.x += this.getAnchorDelta(ctx, this, 0);
      for(var i = 0; i < this.children.length; i++) {
        this.renderChild(ctx, this, i);
      }
    }

    this.getAnchorDelta = function(ctx, parent, startI) {
      var textAnchor = this.style('text-anchor').valueOrDefault('start');
      if(textAnchor != 'start') {
        var width = 0;
        for(var i = startI; i < parent.children.length; i++) {
          var child = parent.children[i];
          if(i > startI && child.attribute('x').hasValue()) break; // new group
          width += child.measureTextRecursive(ctx);
        }
        return -1 * (textAnchor == 'end' ? width : width / 2.0);
      }
      return 0;
    }

    this.renderChild = function(ctx, parent, i) {
      var child = parent.children[i];
      if(child.attribute('x').hasValue()) {
        child.x = child.attribute('x').toPixels('x') + this.getAnchorDelta(ctx, parent, i);
        if(child.attribute('dx').hasValue()) child.x += child.attribute('dx').toPixels('x');
      }
      else {
        if(this.attribute('dx').hasValue()) this.x += this.attribute('dx').toPixels('x');
        if(child.attribute('dx').hasValue()) this.x += child.attribute('dx').toPixels('x');
        child.x = this.x;
      }
      this.x = child.x + child.measureText(ctx);

      if(child.attribute('y').hasValue()) {
        child.y = child.attribute('y').toPixels('y');
        if(child.attribute('dy').hasValue()) child.y += child.attribute('dy').toPixels('y');
      }
      else {
        if(this.attribute('dy').hasValue()) this.y += this.attribute('dy').toPixels('y');
        if(child.attribute('dy').hasValue()) this.y += child.attribute('dy').toPixels('y');
        child.y = this.y;
      }
      this.y = child.y;

      child.render(ctx);

      for(var i = 0; i < child.children.length; i++) {
        this.renderChild(ctx, child, i);
      }
    }
  }
  svg.Element.text.prototype = new svg.Element.RenderedElementBase;

  // text base
  svg.Element.TextElementBase = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.getGlyph = function(font, text, i) {
      var c = text[i];
      var glyph = null;
      if(font.isArabic) {
        var arabicForm = 'isolated';
        if((i == 0 || text[i - 1] == ' ') && i < text.length - 2 && text[i + 1] != ' ') arabicForm = 'terminal';
        if(i > 0 && text[i - 1] != ' ' && i < text.length - 2 && text[i + 1] != ' ') arabicForm = 'medial';
        if(i > 0 && text[i - 1] != ' ' && (i == text.length - 1 || text[i + 1] == ' ')) arabicForm = 'initial';
        if(typeof(font.glyphs[c]) != 'undefined') {
          glyph = font.glyphs[c][arabicForm];
          if(glyph == null && font.glyphs[c].type == 'glyph') glyph = font.glyphs[c];
        }
      }
      else {
        glyph = font.glyphs[c];
      }
      if(glyph == null) glyph = font.missingGlyph;
      return glyph;
    }

    this.renderChildren = function(ctx) {
      var customFont = this.parent.style('font-family').getDefinition();
      if(customFont != null) {
        var fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
        var fontStyle = this.parent.style('font-style').valueOrDefault(svg.Font.Parse(svg.ctx.font).fontStyle);
        var text = this.getText();
        if(customFont.isRTL) text = text.split("").reverse().join("");

        var dx = svg.ToNumberArray(this.parent.attribute('dx').value);
        for(var i = 0; i < text.length; i++) {
          var glyph = this.getGlyph(customFont, text, i);
          var scale = fontSize / customFont.fontFace.unitsPerEm;
          ctx.translate(this.x, this.y);
          ctx.scale(scale, -scale);
          var lw = ctx.lineWidth;
          ctx.lineWidth = ctx.lineWidth * customFont.fontFace.unitsPerEm / fontSize;
          if(fontStyle == 'italic') ctx.transform(1, 0, .4, 1, 0, 0);
          glyph.render(ctx);
          if(fontStyle == 'italic') ctx.transform(1, 0, -.4, 1, 0, 0);
          ctx.lineWidth = lw;
          ctx.scale(1 / scale, -1 / scale);
          ctx.translate(-this.x, -this.y);

          this.x += fontSize * (glyph.horizAdvX || customFont.horizAdvX) / customFont.fontFace.unitsPerEm;
          if(typeof(dx[i]) != 'undefined' && !isNaN(dx[i])) {
            this.x += dx[i];
          }
        }
        return;
      }

      if(ctx.fillStyle != '') ctx.fillText(svg.compressSpaces(this.getText()), this.x, this.y);
      if(ctx.strokeStyle != '') ctx.strokeText(svg.compressSpaces(this.getText()), this.x, this.y);
    }

    this.getText = function() {
      // OVERRIDE ME
    }

    this.measureTextRecursive = function(ctx) {
      var width = this.measureText(ctx);
      for(var i = 0; i < this.children.length; i++) {
        width += this.children[i].measureTextRecursive(ctx);
      }
      return width;
    }

    this.measureText = function(ctx) {
      var customFont = this.parent.style('font-family').getDefinition();
      if(customFont != null) {
        var fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
        var measure = 0;
        var text = this.getText();
        if(customFont.isRTL) text = text.split("").reverse().join("");
        var dx = svg.ToNumberArray(this.parent.attribute('dx').value);
        for(var i = 0; i < text.length; i++) {
          var glyph = this.getGlyph(customFont, text, i);
          measure += (glyph.horizAdvX || customFont.horizAdvX) * fontSize / customFont.fontFace.unitsPerEm;
          if(typeof(dx[i]) != 'undefined' && !isNaN(dx[i])) {
            measure += dx[i];
          }
        }
        return measure;
      }

      var textToMeasure = svg.compressSpaces(this.getText());
      if(!ctx.measureText) return textToMeasure.length * 10;

      ctx.save();
      this.setContext(ctx);
      var width = ctx.measureText(textToMeasure).width;
      ctx.restore();
      return width;
    }
  }
  svg.Element.TextElementBase.prototype = new svg.Element.RenderedElementBase;

  // tspan
  svg.Element.tspan = function(node) {
    this.captureTextNodes = true;
    this.base = svg.Element.TextElementBase;
    this.base(node);

    this.text = svg.compressSpaces(node.value || node.text || node.textContent || '');
    this.getText = function() {
      // if this node has children, then they own the text
      if(this.children.length > 0) {
        return '';
      }
      return this.text;
    }
  }
  svg.Element.tspan.prototype = new svg.Element.TextElementBase;

  // tref
  svg.Element.tref = function(node) {
    this.base = svg.Element.TextElementBase;
    this.base(node);

    this.getText = function() {
      var element = this.getHrefAttribute().getDefinition();
      if(element != null) return element.children[0].getText();
    }
  }
  svg.Element.tref.prototype = new svg.Element.TextElementBase;

  // a element
  svg.Element.a = function(node) {
    this.base = svg.Element.TextElementBase;
    this.base(node);

    this.hasText = node.childNodes.length > 0;
    for(var i = 0; i < node.childNodes.length; i++) {
      if(node.childNodes[i].nodeType != 3) this.hasText = false;
    }

    // this might contain text
    this.text = this.hasText ? node.childNodes[0].value : '';
    this.getText = function() {
      return this.text;
    }

    this.baseRenderChildren = this.renderChildren;
    this.renderChildren = function(ctx) {
      if(this.hasText) {
        // render as text element
        this.baseRenderChildren(ctx);
        var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
        svg.Mouse.checkBoundingBox(this, new svg.BoundingBox(this.x, this.y - fontSize.toPixels('y'), this.x + this.measureText(ctx), this.y));
      }
      else if(this.children.length > 0) {
        // render as temporary group
        var g = new svg.Element.g();
        g.children = this.children;
        g.parent = this;
        g.render(ctx);
      }
    }

    this.onclick = function() {
      window.open(this.getHrefAttribute().value);
    }

    this.onmousemove = function() {
      svg.ctx.canvas.style.cursor = 'pointer';
    }
  }
  svg.Element.a.prototype = new svg.Element.TextElementBase;

  // image element
  svg.Element.image = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    var href = this.getHrefAttribute().value;
    if(href == '') {
      return;
    }
    var isSvg = href.match(/\.svg$/)

    svg.Images.push(this);
    this.loaded = false;
    if(!isSvg) {
      this.img = document.createElement('img');
      if(svg.opts['useCORS'] == true) {
        this.img.crossOrigin = 'Anonymous';
      }
      var self = this;
      this.img.onload = function() {
        console.log(href);
        self.loaded = true;
      }
      this.img.onerror = function() {
        svg.log('ERROR: image "' + href + '" not found');
        self.loaded = true;
      }
      this.img.src = href;
    }
    else {
      XHR(href).then(function(text) {
        this.img = text;
        this.loaded = true;
      }.bind(this));
    }

    this.drawSvg = function(ctx, dx, dy, dw, dh) {
      var c = document.createElement('canvas');
      c.width = dw;
      c.height = dh;

      module.exports.parse(c, this.img, {
        ignoreMouse: true,
        ignoreAnimation: true,
        ignoreDimensions: true,
        ignoreClear: true,
        scaleWidth: dw,
        scaleHeight: dh
      });

      ctx.drawImage(c, dx, dy);
    };

    this.renderChildren = function(ctx) {
      var x = this.attribute('x').toPixels('x');
      var y = this.attribute('y').toPixels('y');

      var width = this.attribute('width').toPixels('x');
      var height = this.attribute('height').toPixels('y');
      if(width == 0 || height == 0) return;

      ctx.save();
      if(isSvg) {
        this.drawSvg(ctx, x, y, width, height);
      }
      else {
        ctx.translate(x, y);
        svg.AspectRatio(ctx,
          this.attribute('preserveAspectRatio').value,
          width,
          this.img.width,
          height,
          this.img.height,
          0,
          0);
        ctx.drawImage(this.img, 0, 0);
      }
      ctx.restore();
    }

    this.getBoundingBox = function() {
      var x = this.attribute('x').toPixels('x');
      var y = this.attribute('y').toPixels('y');
      var width = this.attribute('width').toPixels('x');
      var height = this.attribute('height').toPixels('y');
      return new svg.BoundingBox(x, y, x + width, y + height);
    }
  }
  svg.Element.image.prototype = new svg.Element.RenderedElementBase;

  // group element
  svg.Element.g = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.getBoundingBox = function() {
      var bb = new svg.BoundingBox();
      for(var i = 0; i < this.children.length; i++) {
        bb.addBoundingBox(this.children[i].getBoundingBox());
      }
      return bb;
    };
  }
  svg.Element.g.prototype = new svg.Element.RenderedElementBase;

  // symbol element
  svg.Element.symbol = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.render = function(ctx) {
      // NO RENDER
    };
  }
  svg.Element.symbol.prototype = new svg.Element.RenderedElementBase;

  // style element
  svg.Element.style = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    // text, or spaces then CDATA
    var css = ''
    for(var i = 0; i < node.childNodes.length; i++) {
      css += node.childNodes[i].data;
    }
    css = css.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(^[\s]*\/\/.*)/gm, ''); // remove comments
    css = svg.compressSpaces(css); // replace whitespace
    var cssDefs = css.split('}');
    for(var i = 0; i < cssDefs.length; i++) {
      if(svg.trim(cssDefs[i]) != '') {
        var cssDef = cssDefs[i].split('{');
        var cssClasses = cssDef[0].split(',');
        var cssProps = cssDef[1].split(';');
        for(var j = 0; j < cssClasses.length; j++) {
          var cssClass = svg.trim(cssClasses[j]);
          if(cssClass != '') {
            var props = {};
            for(var k = 0; k < cssProps.length; k++) {
              var prop = cssProps[k].indexOf(':');
              var name = cssProps[k].substr(0, prop);
              var value = cssProps[k].substr(prop + 1, cssProps[k].length - prop);
              if(name != null && value != null) {
                props[svg.trim(name)] = new svg.Property(svg.trim(name), svg.trim(value));
              }
            }
            svg.Styles[cssClass] = props;
            svg.StylesSpecificity[cssClass] = getSelectorSpecificity(cssClass);
            if(cssClass == '@font-face') {
              var fontFamily = props['font-family'].value.replace(/"/g, '');
              var srcs = props['src'].value.split(',');
              for(var s = 0; s < srcs.length; s++) {
                if(srcs[s].indexOf('format("svg")') > 0) {
                  var urlStart = srcs[s].indexOf('url');
                  var urlEnd = srcs[s].indexOf(')', urlStart);
                  var url = srcs[s].substr(urlStart + 5, urlEnd - urlStart - 6);
                  XHR(url).then(function(doc) {
                    doc = svg.parseXml(doc);

                    var fonts = doc.getElementsByTagName('font');
                    for(var f = 0; f < fonts.length; f++) {
                      var font = svg.CreateElement(fonts[f]);
                      svg.Definitions[fontFamily] = font;
                    }
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  svg.Element.style.prototype = new svg.Element.ElementBase;

  // use element
  svg.Element.use = function(node) {
    this.base = svg.Element.RenderedElementBase;
    this.base(node);

    this.baseSetContext = this.setContext;
    this.setContext = function(ctx) {
      this.baseSetContext(ctx);
      if(this.attribute('x').hasValue()) ctx.translate(this.attribute('x').toPixels('x'), 0);
      if(this.attribute('y').hasValue()) ctx.translate(0, this.attribute('y').toPixels('y'));
    }

    var element = this.getHrefAttribute().getDefinition();

    this.path = function(ctx) {
      if(element != null) element.path(ctx);
    }

    this.getBoundingBox = function() {
      if(element != null) return element.getBoundingBox();
    }

    this.renderChildren = function(ctx) {
      if(element != null) {
        var tempSvg = element;
        if(element.type == 'symbol') {
          // render me using a temporary svg element in symbol cases (http://www.w3.org/TR/SVG/struct.html#UseElement)
          tempSvg = new svg.Element.svg();
          tempSvg.type = 'svg';
          tempSvg.attributes['viewBox'] = new svg.Property('viewBox', element.attribute('viewBox').value);
          tempSvg.attributes['preserveAspectRatio'] = new svg.Property('preserveAspectRatio', element.attribute('preserveAspectRatio').value);
          tempSvg.attributes['overflow'] = new svg.Property('overflow', element.attribute('overflow').value);
          tempSvg.children = element.children;
        }
        if(tempSvg.type == 'svg') {
          // if symbol or svg, inherit width/height from me
          if(this.attribute('width').hasValue()) tempSvg.attributes['width'] = new svg.Property('width', this.attribute('width').value);
          if(this.attribute('height').hasValue()) tempSvg.attributes['height'] = new svg.Property('height', this.attribute('height').value);
        }
        var oldParent = tempSvg.parent;
        tempSvg.parent = null;
        tempSvg.render(ctx);
        tempSvg.parent = oldParent;
      }
    }
  }
  svg.Element.use.prototype = new svg.Element.RenderedElementBase;

  // mask element
  svg.Element.mask = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.apply = function(ctx, element) {
      // render as temp svg
      var x = this.attribute('x').toPixels('x');
      var y = this.attribute('y').toPixels('y');
      var width = this.attribute('width').toPixels('x');
      var height = this.attribute('height').toPixels('y');

      if(width == 0 && height == 0) {
        var bb = new svg.BoundingBox();
        for(var i = 0; i < this.children.length; i++) {
          bb.addBoundingBox(this.children[i].getBoundingBox());
        }
        var x = Math.floor(bb.x1);
        var y = Math.floor(bb.y1);
        var width = Math.floor(bb.width);
        var height = Math.floor(bb.height);
      }

      // temporarily remove mask to avoid recursion
      var mask = element.attribute('mask').value;
      element.attribute('mask').value = '';

      var cMask = document.createElement('canvas');
      cMask.width = x + width;
      cMask.height = y + height;
      var maskCtx = cMask.getContext('2d');
      svg.CanvasBoundingBox.freeze = true;
      this.renderChildren(maskCtx);
      svg.CanvasBoundingBox.freeze = false;

      var c = document.createElement('canvas');
      c.width = x + width;
      c.height = y + height;
      var tempCtx = c.getContext('2d');
      svg.CanvasBoundingBox.freeze = true;
      element.render(tempCtx);
      svg.CanvasBoundingBox.freeze = false;
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.fillStyle = maskCtx.createPattern(cMask, 'no-repeat');
      tempCtx.fillRect(0, 0, x + width, y + height);

      ctx.fillStyle = tempCtx.createPattern(c, 'no-repeat');
      ctx.fillRect(0, 0, x + width, y + height);

      // reassign mask
      element.attribute('mask').value = mask;
    }

    this.render = function(ctx) {
      // NO RENDER
    }
  }
  svg.Element.mask.prototype = new svg.Element.ElementBase;

  // clip element
  svg.Element.clipPath = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.apply = function(ctx) {
      var oldBeginPath = CanvasRenderingContext2D.prototype.beginPath;
      CanvasRenderingContext2D.prototype.beginPath = function() {
      };

      var oldClosePath = CanvasRenderingContext2D.prototype.closePath;
      CanvasRenderingContext2D.prototype.closePath = function() {
      };

      oldBeginPath.call(ctx);
      for(var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if(typeof(child.path) != 'undefined') {
          var transform = null;
          if(child.attribute('transform').hasValue()) {
            transform = new svg.Transform(child.attribute('transform').value);
            transform.apply(ctx);
          }
          child.path(ctx);
          CanvasRenderingContext2D.prototype.closePath = oldClosePath;
          if(transform) {
            transform.unapply(ctx);
          }
        }
      }
      oldClosePath.call(ctx);
      ctx.clip();

      CanvasRenderingContext2D.prototype.beginPath = oldBeginPath;
      CanvasRenderingContext2D.prototype.closePath = oldClosePath;
    }

    this.render = function(ctx) {
      // NO RENDER
    }
  }
  svg.Element.clipPath.prototype = new svg.Element.ElementBase;

  // filters
  svg.Element.filter = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.apply = function(ctx, element) {
      // render as temp svg
      var bb = element.getBoundingBox();
      var x = Math.floor(bb.x1);
      var y = Math.floor(bb.y1);
      var width = Math.floor(bb.width);
      var height = Math.floor(bb.height);

      // temporarily remove filter to avoid recursion
      var filter = element.style('filter').value;
      element.style('filter').value = '';

      var px = 0, py = 0;
      for(var i = 0; i < this.children.length; i++) {
        var efd = this.children[i].extraFilterDistance || 0;
        px = Math.max(px, efd);
        py = Math.max(py, efd);
      }

      var c = document.createElement('canvas');
      c.width = width + 2 * px;
      c.height = height + 2 * py;
      var tempCtx = c.getContext('2d');
      tempCtx.translate(-x + px, -y + py);
      element.render(tempCtx);

      // apply filters
      for(var i = 0; i < this.children.length; i++) {
        this.children[i].apply(tempCtx, 0, 0, width + 2 * px, height + 2 * py);
      }

      // render on me
      ctx.drawImage(c, 0, 0, width + 2 * px, height + 2 * py, x - px, y - py, width + 2 * px, height + 2 * py);

      // reassign filter
      element.style('filter', true).value = filter;
    }

    this.render = function(ctx) {
      // NO RENDER
    }
  }
  svg.Element.filter.prototype = new svg.Element.ElementBase;

  svg.Element.feMorphology = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.apply = function(ctx, x, y, width, height) {
      // TODO: implement
    }
  }
  svg.Element.feMorphology.prototype = new svg.Element.ElementBase;

  svg.Element.feComposite = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.apply = function(ctx, x, y, width, height) {
      // TODO: implement
    }
  }
  svg.Element.feComposite.prototype = new svg.Element.ElementBase;

  svg.Element.feColorMatrix = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    var matrix = svg.ToNumberArray(this.attribute('values').value);
    switch(this.attribute('type').valueOrDefault('matrix')) { // http://www.w3.org/TR/SVG/filters.html#feColorMatrixElement
      case 'saturate':
        var s = matrix[0];
        matrix = [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
          0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
          0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
          0, 0, 0, 1, 0,
          0, 0, 0, 0, 1];
        break;
      case 'hueRotate':
        var a = matrix[0] * Math.PI / 180.0;
        var c = function(m1, m2, m3) {
          return m1 + Math.cos(a) * m2 + Math.sin(a) * m3;
        };
        matrix = [c(0.213, 0.787, -0.213), c(0.715, -0.715, -0.715), c(0.072, -0.072, 0.928), 0, 0,
          c(0.213, -0.213, 0.143), c(0.715, 0.285, 0.140), c(0.072, -0.072, -0.283), 0, 0,
          c(0.213, -0.213, -0.787), c(0.715, -0.715, 0.715), c(0.072, 0.928, 0.072), 0, 0,
          0, 0, 0, 1, 0,
          0, 0, 0, 0, 1];
        break;
      case 'luminanceToAlpha':
        matrix = [0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0.2125, 0.7154, 0.0721, 0, 0,
          0, 0, 0, 0, 1];
        break;
    }

    function imGet(img, x, y, width, height, rgba) {
      return img[y * width * 4 + x * 4 + rgba];
    }

    function imSet(img, x, y, width, height, rgba, val) {
      img[y * width * 4 + x * 4 + rgba] = val;
    }

    function m(i, v) {
      var mi = matrix[i];
      return mi * (mi < 0 ? v - 255 : v);
    }

    this.apply = function(ctx, x, y, width, height) {
      // assuming x==0 && y==0 for now
      var srcData = ctx.getImageData(0, 0, width, height);
      for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
          var r = imGet(srcData.data, x, y, width, height, 0);
          var g = imGet(srcData.data, x, y, width, height, 1);
          var b = imGet(srcData.data, x, y, width, height, 2);
          var a = imGet(srcData.data, x, y, width, height, 3);
          imSet(srcData.data, x, y, width, height, 0, m(0, r) + m(1, g) + m(2, b) + m(3, a) + m(4, 1));
          imSet(srcData.data, x, y, width, height, 1, m(5, r) + m(6, g) + m(7, b) + m(8, a) + m(9, 1));
          imSet(srcData.data, x, y, width, height, 2, m(10, r) + m(11, g) + m(12, b) + m(13, a) + m(14, 1));
          imSet(srcData.data, x, y, width, height, 3, m(15, r) + m(16, g) + m(17, b) + m(18, a) + m(19, 1));
        }
      }
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(srcData, 0, 0);
    }
  }
  svg.Element.feColorMatrix.prototype = new svg.Element.ElementBase;

  svg.Element.feGaussianBlur = function(node) {
    this.base = svg.Element.ElementBase;
    this.base(node);

    this.blurRadius = Math.floor(this.attribute('stdDeviation').numValue());
    this.extraFilterDistance = this.blurRadius;

    this.apply = function(ctx, x, y, width, height) {
      if(typeof(stackBlurCanvasRGBA) == 'undefined') {
        svg.log('ERROR: StackBlur.js must be included for blur to work');
        return;
      }

      // StackBlur requires canvas be on document
      ctx.canvas.id = svg.UniqueId();
      ctx.canvas.style.display = 'none';
      document.body.appendChild(ctx.canvas);
      stackBlurCanvasRGBA(ctx.canvas.id, x, y, width, height, this.blurRadius);
      document.body.removeChild(ctx.canvas);
    }
  }
  svg.Element.feGaussianBlur.prototype = new svg.Element.ElementBase;

  // title element, do nothing
  svg.Element.title = function(node) {
  }
  svg.Element.title.prototype = new svg.Element.ElementBase;

  // desc element, do nothing
  svg.Element.desc = function(node) {
  }
  svg.Element.desc.prototype = new svg.Element.ElementBase;

  svg.Element.MISSING = function(node) {
    svg.log('ERROR: Element \'' + node.nodeName + '\' not yet implemented.');
  }
  svg.Element.MISSING.prototype = new svg.Element.ElementBase;

  // element factory
  svg.CreateElement = function(node) {
    var className = node.nodeName.replace(/^[^:]+:/, ''); // remove namespace
    className = className.replace(/\-/g, ''); // remove dashes
    var e = null;
    if(typeof(svg.Element[className]) != 'undefined') {
      e = new svg.Element[className](node);
    }
    else {
      e = new svg.Element.MISSING(node);
    }

    e.type = node.nodeName;
    return e;
  }

  // load from xml
  svg.loadXml = function(ctx, xml) {
    svg.loadXmlDoc(ctx, svg.parseXml(xml));
  }

  svg.loadXmlDoc = function(ctx, dom) {
    if(dom.nodeName !== 'svg') {
      if(dom.children.length > 0 || dom.children[0].nodeName !== 'svg') {
        dom = dom.children[0];
      } else {
        throw new Error("ERROR: File missing SVG declaration");
      }
    }

    svg.init(ctx);

    var e = svg.CreateElement(dom);
    e.root = true;
    e.addStylesFromStyleDefinition();

    // render loop
    var isFirstRender = true;
    var draw = function() {
      svg.ViewPort.Clear();
      if(ctx.canvas.parentNode)
        svg.ViewPort.SetCurrent(ctx.canvas.parentNode.clientWidth, ctx.canvas.parentNode.clientHeight);
      else if(dom.parentNode)
        svg.ViewPort.SetCurrent(dom.parentNode.clientWidth, dom.parentNode.clientHeight);

      if(svg.opts['ignoreDimensions'] != true) {
        // set canvas size
        if(e.style('width').hasValue()) {
          ctx.canvas.width = e.style('width').toPixels('x');
          ctx.canvas.style.width = ctx.canvas.width + 'px';
        }
        if(e.style('height').hasValue()) {
          ctx.canvas.height = e.style('height').toPixels('y');
          ctx.canvas.style.height = ctx.canvas.height + 'px';
        }
      }
      var cWidth = ctx.canvas.clientWidth || ctx.canvas.width;
      var cHeight = ctx.canvas.clientHeight || ctx.canvas.height;
      if(svg.opts['ignoreDimensions'] == true && e.style('width').hasValue() && e.style('height').hasValue()) {
        cWidth = e.style('width').toPixels('x');
        cHeight = e.style('height').toPixels('y');
      }

      svg.ViewPort.SetCurrent(cWidth, cHeight);

      if(svg.opts['offsetX'] != null) e.attribute('x', true).value = svg.opts['offsetX'];
      if(svg.opts['offsetY'] != null) e.attribute('y', true).value = svg.opts['offsetY'];
      if(svg.opts['scaleWidth'] != null || svg.opts['scaleHeight'] != null) {
        var xRatio = null, yRatio = null, viewBox = svg.ToNumberArray(e.attribute('viewBox').value);

        if(svg.opts['scaleWidth'] != null) {
          if(e.attribute('width').hasValue()) xRatio = e.attribute('width').toPixels('x') / svg.opts['scaleWidth'];
          else if(!isNaN(viewBox[2])) xRatio = viewBox[2] / svg.opts['scaleWidth'];
        }

        if(svg.opts['scaleHeight'] != null) {
          if(e.attribute('height').hasValue()) yRatio = e.attribute('height').toPixels('y') / svg.opts['scaleHeight'];
          else if(!isNaN(viewBox[3])) yRatio = viewBox[3] / svg.opts['scaleHeight'];
        }

        if(xRatio == null) {
          xRatio = yRatio;
        }
        if(yRatio == null) {
          yRatio = xRatio;
        }

        e.attribute('width', true).value = svg.opts['scaleWidth'];
        e.attribute('height', true).value = svg.opts['scaleHeight'];
        e.attribute('transform', true).value += ' scale(' + (1.0 / xRatio) + ',' + (1.0 / yRatio) + ')';
      }

      // clear and render
      if(svg.opts['ignoreClear'] != true) {
        ctx.clearRect(0, 0, cWidth, cHeight);
      }
      e.render(ctx);

      if(e.style('overflow') === 'visible') {

      }

      if(isFirstRender) {
        isFirstRender = false;
        if(typeof(svg.opts['renderCallback']) == 'function') svg.opts['renderCallback']({
          element: dom,
          bounds: svg.CanvasBoundingBox
        });
      }
    }

    var waitingForImages = true;
    if(svg.ImagesLoaded()) {
      waitingForImages = false;
      draw();
    }
    svg.intervalID = setInterval(function() {
      var needUpdate = false;

      if(waitingForImages && svg.ImagesLoaded()) {
        waitingForImages = false;
        needUpdate = true;
      }

      // need update from mouse events?
      if(svg.opts['ignoreMouse'] != true) {
        needUpdate = needUpdate | svg.Mouse.hasEvents();
      }

      // need update from animations?
      if(svg.opts['ignoreAnimation'] != true) {
        for(var i = 0; i < svg.Animations.length; i++) {
          needUpdate = needUpdate | svg.Animations[i].update(1000 / svg.FRAMERATE);
        }
      }

      // need update from redraw?
      if(typeof(svg.opts['forceRedraw']) == 'function') {
        if(svg.opts['forceRedraw']() == true) needUpdate = true;
      }

      // render if needed
      if(needUpdate) {
        draw();
        svg.Mouse.runEvents(); // run and clear our events
      }
    }, 1000 / svg.FRAMERATE);
  }

  svg.stop = function() {
    if(svg.intervalID) {
      clearInterval(svg.intervalID);
    }
  }

  svg.Mouse = new (function() {
    this.events = [];
    this.hasEvents = function() {
      return this.events.length != 0;
    }

    this.onclick = function(x, y) {
      this.events.push({
        type: 'onclick', x: x, y: y,
        run: function(e) {
          if(e.onclick) e.onclick();
        }
      });
    }

    this.onmousemove = function(x, y) {
      this.events.push({
        type: 'onmousemove', x: x, y: y,
        run: function(e) {
          if(e.onmousemove) e.onmousemove();
        }
      });
    }

    this.eventElements = [];

    this.checkPath = function(element, ctx) {
      for(var i = 0; i < this.events.length; i++) {
        var e = this.events[i];
        if(ctx.isPointInPath && ctx.isPointInPath(e.x, e.y)) this.eventElements[i] = element;
      }
    }

    this.checkBoundingBox = function(element, bb) {
      for(var i = 0; i < this.events.length; i++) {
        var e = this.events[i];
        if(bb.isPointInBox(e.x, e.y)) this.eventElements[i] = element;
      }
    }

    this.runEvents = function() {
      svg.ctx.canvas.style.cursor = '';

      for(var i = 0; i < this.events.length; i++) {
        var e = this.events[i];
        var element = this.eventElements[i];
        while(element) {
          e.run(element);
          element = element.parent;
        }
      }

      // done running, clear
      this.events = [];
      this.eventElements = [];
    }
  });

  return svg;
}

},{"../BoundingBox":5,"../color":7,"../log":19,"../xhr":35}],33:[function(require,module,exports){
var NodeContainer = require('./nodecontainer');

function TextContainer(node, parent) {
  NodeContainer.call(this, node, parent);
}

TextContainer.prototype = Object.create(NodeContainer.prototype);

TextContainer.prototype.applyTextTransform = function() {
  this.node.data = this.transform(this.parent.css("textTransform"));
};

TextContainer.prototype.transform = function(transform) {
  var text = this.node.data;
  switch(transform) {
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/(^|\s|:|-|\(|\))([a-z])/g, capitalize);
    case "uppercase":
      return text.toUpperCase();
    default:
      return text;
  }
};

function capitalize(m, p1, p2) {
  if(m.length > 0) {
    return p1 + p2.toUpperCase();
  }
}

module.exports = TextContainer;

},{"./nodecontainer":20}],34:[function(require,module,exports){
var BoundingBox = require('./BoundingBox');

exports.smallImage = function smallImage() {
  return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
};

exports.bind = function(callback, context) {
  return function() {
    return callback.apply(context, arguments);
  };
};

exports.decode64 = require('base64-arraybuffer').decode;

exports.getBounds = function(node) {
  if(node.getBoundingClientRect) {
    var clientRect = node.getBoundingClientRect();
    var width = node.offsetWidth == null ? clientRect.width : node.offsetWidth;

    return new BoundingBox(clientRect.left,
                           clientRect.top,
                           clientRect.left + width,
                           clientRect.bottom || (clientRect.top + clientRect.height));
  }
  return new BoundingBox();
};

exports.offsetBounds = function(node) {
  var parent = node.offsetParent ? exports.offsetBounds(node.offsetParent) : {y: 0, x: 0};
  return new BoundingBox(node.offsetLeft + parent.x,
                         node.offsetTop + parent.y,
                         node.offsetLeft + parent.x + node.offsetWidth,
                         node.offsetTop + node.offsetHeight + parent.y);
};

exports.parseBackgrounds = function(backgroundImage) {
  var whitespace = ' \r\n\t',
    method, definition, prefix, prefix_i, block, results = [],
    mode = 0, numParen = 0, quote, args;
  var appendResult = function() {
    if(method) {
      if(definition.substr(0, 1) === '"') {
        definition = definition.substr(1, definition.length - 2);
      }
      if(definition) {
        args.push(definition);
      }
      if(method.substr(0, 1) === '-' && (prefix_i = method.indexOf('-', 1) + 1) > 0) {
        prefix = method.substr(0, prefix_i);
        method = method.substr(prefix_i);
      }
      results.push({
        prefix: prefix,
        method: method.toLowerCase(),
        value: block,
        args: args,
        image: null
      });
    }
    args = [];
    method = prefix = definition = block = '';
  };
  args = [];
  method = prefix = definition = block = '';
  backgroundImage.split("").forEach(function(c) {
    if(mode === 0 && whitespace.indexOf(c) > -1) {
      return;
    }
    switch(c) {
      case '"':
        if(!quote) {
          quote = c;
        } else if(quote === c) {
          quote = null;
        }
        break;
      case '(':
        if(quote) {
          break;
        } else if(mode === 0) {
          mode = 1;
          block += c;
          return;
        } else {
          numParen++;
        }
        break;
      case ')':
        if(quote) {
          break;
        } else if(mode === 1) {
          if(numParen === 0) {
            mode = 0;
            block += c;
            appendResult();
            return;
          } else {
            numParen--;
          }
        }
        break;

      case ',':
        if(quote) {
          break;
        } else if(mode === 0) {
          appendResult();
          return;
        } else if(mode === 1) {
          if(numParen === 0 && !method.match(/^url$/i)) {
            args.push(definition);
            definition = '';
            block += c;
            return;
          }
        }
        break;
    }

    block += c;
    if(mode === 0) {
      method += c;
    } else {
      definition += c;
    }
  });

  appendResult();
  return results;
};

},{"./BoundingBox":5,"base64-arraybuffer":1}],35:[function(require,module,exports){
var Promise = require('./promise');

function XHR(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onload = function() {
      if(xhr.status === 200) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(xhr.statusText));
      }
    };

    xhr.onerror = function() {
      reject(new Error("Network Error"));
    };

    xhr.send();
  });
}

module.exports = XHR;

},{"./promise":22}]},{},[18])(18)
});