var exports = module.exports;
var fabric = fabric || {
    version: "1.4.13"
};

if (typeof exports !== "undefined") {
    exports.fabric = fabric;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
    fabric.document = document;
    fabric.window = window;
}

fabric.isTouchSupported = "ontouchstart" in fabric.document.documentElement;

fabric.SHARED_ATTRIBUTES = [ "display", "transform", "fill", "fill-opacity", "fill-rule", "opacity", "stroke", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width" ];

fabric.DPI = 96;

fabric.reNum = "(?:[-+]?(?:\\d+|\\d*\\.\\d+)(?:e[-+]?\\d+)?)";

var Cufon = function() {
    var api = function() {
        return api.replace.apply(null, arguments);
    };
    var DOM = api.DOM = {
        ready: function() {
            var complete = false, readyStatus = {
                loaded: 1,
                complete: 1
            };
            var queue = [], perform = function() {
                if (complete) return;
                complete = true;
                for (var fn; fn = queue.shift(); fn()) ;
            };
            if (fabric.document.addEventListener) {
                fabric.document.addEventListener("DOMContentLoaded", perform, false);
                fabric.window.addEventListener("pageshow", perform, false);
            }
            if (!fabric.window.opera && fabric.document.readyState) (function() {
                readyStatus[fabric.document.readyState] ? perform() : setTimeout(arguments.callee, 10);
            })();
            if (fabric.document.readyState && fabric.document.createStyleSheet) (function() {
                try {
                    fabric.document.body.doScroll("left");
                    perform();
                } catch (e) {
                    setTimeout(arguments.callee, 1);
                }
            })();
            addEvent(fabric.window, "load", perform);
            return function(listener) {
                if (!arguments.length) perform(); else complete ? listener() : queue.push(listener);
            };
        }()
    };
    var CSS = api.CSS = {
        Size: function(value, base) {
            this.value = parseFloat(value);
            this.unit = String(value).match(/[a-z%]*$/)[0] || "px";
            this.convert = function(value) {
                return value / base * this.value;
            };
            this.convertFrom = function(value) {
                return value / this.value * base;
            };
            this.toString = function() {
                return this.value + this.unit;
            };
        },
        getStyle: function(el) {
            return new Style(el.style);
        },
        quotedList: cached(function(value) {
            var list = [], re = /\s*((["'])([\s\S]*?[^\\])\2|[^,]+)\s*/g, match;
            while (match = re.exec(value)) list.push(match[3] || match[1]);
            return list;
        }),
        ready: function() {
            var complete = false;
            var queue = [], perform = function() {
                complete = true;
                for (var fn; fn = queue.shift(); fn()) ;
            };
            var styleElements = Object.prototype.propertyIsEnumerable ? elementsByTagName("style") : {
                length: 0
            };
            var linkElements = elementsByTagName("link");
            DOM.ready(function() {
                var linkStyles = 0, link;
                for (var i = 0, l = linkElements.length; link = linkElements[i], i < l; ++i) {
                    if (!link.disabled && link.rel.toLowerCase() == "stylesheet") ++linkStyles;
                }
                if (fabric.document.styleSheets.length >= styleElements.length + linkStyles) perform(); else setTimeout(arguments.callee, 10);
            });
            return function(listener) {
                if (complete) listener(); else queue.push(listener);
            };
        }(),
        supports: function(property, value) {
            var checker = fabric.document.createElement("span").style;
            if (checker[property] === undefined) return false;
            checker[property] = value;
            return checker[property] === value;
        },
        textAlign: function(word, style, position, wordCount) {
            if (style.get("textAlign") == "right") {
                if (position > 0) word = " " + word;
            } else if (position < wordCount - 1) word += " ";
            return word;
        },
        textDecoration: function(el, style) {
            if (!style) style = this.getStyle(el);
            var types = {
                underline: null,
                overline: null,
                "line-through": null
            };
            for (var search = el; search.parentNode && search.parentNode.nodeType == 1; ) {
                var foundAll = true;
                for (var type in types) {
                    if (types[type]) continue;
                    if (style.get("textDecoration").indexOf(type) != -1) types[type] = style.get("color");
                    foundAll = false;
                }
                if (foundAll) break;
                style = this.getStyle(search = search.parentNode);
            }
            return types;
        },
        textShadow: cached(function(value) {
            if (value == "none") return null;
            var shadows = [], currentShadow = {}, result, offCount = 0;
            var re = /(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)|(-?[\d.]+[a-z%]*)|,/gi;
            while (result = re.exec(value)) {
                if (result[0] == ",") {
                    shadows.push(currentShadow);
                    currentShadow = {}, offCount = 0;
                } else if (result[1]) {
                    currentShadow.color = result[1];
                } else {
                    currentShadow[[ "offX", "offY", "blur" ][offCount++]] = result[2];
                }
            }
            shadows.push(currentShadow);
            return shadows;
        }),
        color: cached(function(value) {
            var parsed = {};
            parsed.color = value.replace(/^rgba\((.*?),\s*([\d.]+)\)/, function($0, $1, $2) {
                parsed.opacity = parseFloat($2);
                return "rgb(" + $1 + ")";
            });
            return parsed;
        }),
        textTransform: function(text, style) {
            return text[{
                uppercase: "toUpperCase",
                lowercase: "toLowerCase"
            }[style.get("textTransform")] || "toString"]();
        }
    };
    function Font(data) {
        var face = this.face = data.face;
        this.glyphs = data.glyphs;
        this.w = data.w;
        this.baseSize = parseInt(face["units-per-em"], 10);
        this.family = face["font-family"].toLowerCase();
        this.weight = face["font-weight"];
        this.style = face["font-style"] || "normal";
        this.viewBox = function() {
            var parts = face.bbox.split(/\s+/);
            var box = {
                minX: parseInt(parts[0], 10),
                minY: parseInt(parts[1], 10),
                maxX: parseInt(parts[2], 10),
                maxY: parseInt(parts[3], 10)
            };
            box.width = box.maxX - box.minX, box.height = box.maxY - box.minY;
            box.toString = function() {
                return [ this.minX, this.minY, this.width, this.height ].join(" ");
            };
            return box;
        }();
        this.ascent = -parseInt(face.ascent, 10);
        this.descent = -parseInt(face.descent, 10);
        this.height = -this.ascent + this.descent;
    }
    function FontFamily() {
        var styles = {}, mapping = {
            oblique: "italic",
            italic: "oblique"
        };
        this.add = function(font) {
            (styles[font.style] || (styles[font.style] = {}))[font.weight] = font;
        };
        this.get = function(style, weight) {
            var weights = styles[style] || styles[mapping[style]] || styles.normal || styles.italic || styles.oblique;
            if (!weights) return null;
            weight = {
                normal: 400,
                bold: 700
            }[weight] || parseInt(weight, 10);
            if (weights[weight]) return weights[weight];
            var up = {
                1: 1,
                99: 0
            }[weight % 100], alts = [], min, max;
            if (up === undefined) up = weight > 400;
            if (weight == 500) weight = 400;
            for (var alt in weights) {
                alt = parseInt(alt, 10);
                if (!min || alt < min) min = alt;
                if (!max || alt > max) max = alt;
                alts.push(alt);
            }
            if (weight < min) weight = min;
            if (weight > max) weight = max;
            alts.sort(function(a, b) {
                return (up ? a > weight && b > weight ? a < b : a > b : a < weight && b < weight ? a > b : a < b) ? -1 : 1;
            });
            return weights[alts[0]];
        };
    }
    function HoverHandler() {
        function contains(node, anotherNode) {
            if (node.contains) return node.contains(anotherNode);
            return node.compareDocumentPosition(anotherNode) & 16;
        }
        function onOverOut(e) {
            var related = e.relatedTarget;
            if (!related || contains(this, related)) return;
            trigger(this);
        }
        function onEnterLeave(e) {
            trigger(this);
        }
        function trigger(el) {
            setTimeout(function() {
                api.replace(el, sharedStorage.get(el).options, true);
            }, 10);
        }
        this.attach = function(el) {
            if (el.onmouseenter === undefined) {
                addEvent(el, "mouseover", onOverOut);
                addEvent(el, "mouseout", onOverOut);
            } else {
                addEvent(el, "mouseenter", onEnterLeave);
                addEvent(el, "mouseleave", onEnterLeave);
            }
        };
    }
    function Storage() {
        var map = {}, at = 0;
        function identify(el) {
            return el.cufid || (el.cufid = ++at);
        }
        this.get = function(el) {
            var id = identify(el);
            return map[id] || (map[id] = {});
        };
    }
    function Style(style) {
        var custom = {}, sizes = {};
        this.get = function(property) {
            return custom[property] != undefined ? custom[property] : style[property];
        };
        this.getSize = function(property, base) {
            return sizes[property] || (sizes[property] = new CSS.Size(this.get(property), base));
        };
        this.extend = function(styles) {
            for (var property in styles) custom[property] = styles[property];
            return this;
        };
    }
    function addEvent(el, type, listener) {
        if (el.addEventListener) {
            el.addEventListener(type, listener, false);
        } else if (el.attachEvent) {
            el.attachEvent("on" + type, function() {
                return listener.call(el, fabric.window.event);
            });
        }
    }
    function attach(el, options) {
        var storage = sharedStorage.get(el);
        if (storage.options) return el;
        if (options.hover && options.hoverables[el.nodeName.toLowerCase()]) {
            hoverHandler.attach(el);
        }
        storage.options = options;
        return el;
    }
    function cached(fun) {
        var cache = {};
        return function(key) {
            if (!cache.hasOwnProperty(key)) cache[key] = fun.apply(null, arguments);
            return cache[key];
        };
    }
    function getFont(el, style) {
        if (!style) style = CSS.getStyle(el);
        var families = CSS.quotedList(style.get("fontFamily").toLowerCase()), family;
        for (var i = 0, l = families.length; i < l; ++i) {
            family = families[i];
            if (fonts[family]) return fonts[family].get(style.get("fontStyle"), style.get("fontWeight"));
        }
        return null;
    }
    function elementsByTagName(query) {
        return fabric.document.getElementsByTagName(query);
    }
    function merge() {
        var merged = {}, key;
        for (var i = 0, l = arguments.length; i < l; ++i) {
            for (key in arguments[i]) merged[key] = arguments[i][key];
        }
        return merged;
    }
    function process(font, text, style, options, node, el) {
        var separate = options.separate;
        if (separate == "none") return engines[options.engine].apply(null, arguments);
        var fragment = fabric.document.createDocumentFragment(), processed;
        var parts = text.split(separators[separate]), needsAligning = separate == "words";
        if (needsAligning && HAS_BROKEN_REGEXP) {
            if (/^\s/.test(text)) parts.unshift("");
            if (/\s$/.test(text)) parts.push("");
        }
        for (var i = 0, l = parts.length; i < l; ++i) {
            processed = engines[options.engine](font, needsAligning ? CSS.textAlign(parts[i], style, i, l) : parts[i], style, options, node, el, i < l - 1);
            if (processed) fragment.appendChild(processed);
        }
        return fragment;
    }
    function replaceElement(el, options) {
        var font, style, nextNode, redraw;
        for (var node = attach(el, options).firstChild; node; node = nextNode) {
            nextNode = node.nextSibling;
            redraw = false;
            if (node.nodeType == 1) {
                if (!node.firstChild) continue;
                if (!/cufon/.test(node.className)) {
                    arguments.callee(node, options);
                    continue;
                } else redraw = true;
            }
            if (!style) style = CSS.getStyle(el).extend(options);
            if (!font) font = getFont(el, style);
            if (!font) continue;
            if (redraw) {
                engines[options.engine](font, null, style, options, node, el);
                continue;
            }
            var text = node.data;
            if (typeof G_vmlCanvasManager != "undefined") {
                text = text.replace(/\r/g, "\n");
            }
            if (text === "") continue;
            var processed = process(font, text, style, options, node, el);
            if (processed) node.parentNode.replaceChild(processed, node); else node.parentNode.removeChild(node);
        }
    }
    var HAS_BROKEN_REGEXP = " ".split(/\s+/).length == 0;
    var sharedStorage = new Storage();
    var hoverHandler = new HoverHandler();
    var replaceHistory = [];
    var engines = {}, fonts = {}, defaultOptions = {
        engine: null,
        hover: false,
        hoverables: {
            a: true
        },
        printable: true,
        selector: fabric.window.Sizzle || fabric.window.jQuery && function(query) {
            return jQuery(query);
        } || fabric.window.dojo && dojo.query || fabric.window.$$ && function(query) {
            return $$(query);
        } || fabric.window.$ && function(query) {
            return $(query);
        } || fabric.document.querySelectorAll && function(query) {
            return fabric.document.querySelectorAll(query);
        } || elementsByTagName,
        separate: "words",
        textShadow: "none"
    };
    var separators = {
        words: /\s+/,
        characters: ""
    };
    api.now = function() {
        DOM.ready();
        return api;
    };
    api.refresh = function() {
        var currentHistory = replaceHistory.splice(0, replaceHistory.length);
        for (var i = 0, l = currentHistory.length; i < l; ++i) {
            api.replace.apply(null, currentHistory[i]);
        }
        return api;
    };
    api.registerEngine = function(id, engine) {
        if (!engine) return api;
        engines[id] = engine;
        return api.set("engine", id);
    };
    api.registerFont = function(data) {
        var font = new Font(data), family = font.family;
        if (!fonts[family]) fonts[family] = new FontFamily();
        fonts[family].add(font);
        return api.set("fontFamily", '"' + family + '"');
    };
    api.replace = function(elements, options, ignoreHistory) {
        options = merge(defaultOptions, options);
        if (!options.engine) return api;
        if (typeof options.textShadow == "string" && options.textShadow) options.textShadow = CSS.textShadow(options.textShadow);
        if (!ignoreHistory) replaceHistory.push(arguments);
        if (elements.nodeType || typeof elements == "string") elements = [ elements ];
        CSS.ready(function() {
            for (var i = 0, l = elements.length; i < l; ++i) {
                var el = elements[i];
                if (typeof el == "string") api.replace(options.selector(el), options, true); else replaceElement(el, options);
            }
        });
        return api;
    };
    api.replaceElement = function(el, options) {
        options = merge(defaultOptions, options);
        if (typeof options.textShadow == "string" && options.textShadow) options.textShadow = CSS.textShadow(options.textShadow);
        return replaceElement(el, options);
    };
    api.engines = engines;
    api.fonts = fonts;
    api.getOptions = function() {
        return merge(defaultOptions);
    };
    api.set = function(option, value) {
        defaultOptions[option] = value;
        return api;
    };
    return api;
}();

Cufon.registerEngine("canvas", function() {
    var HAS_INLINE_BLOCK = Cufon.CSS.supports("display", "inline-block");
    var HAS_BROKEN_LINEHEIGHT = !HAS_INLINE_BLOCK && (fabric.document.compatMode == "BackCompat" || /frameset|transitional/i.test(fabric.document.doctype.publicId));
    var styleSheet = fabric.document.createElement("style");
    styleSheet.type = "text/css";
    var textNode = fabric.document.createTextNode(".cufon-canvas{text-indent:0}" + "@media screen,projection{" + ".cufon-canvas{display:inline;display:inline-block;position:relative;vertical-align:middle" + (HAS_BROKEN_LINEHEIGHT ? "" : ";font-size:1px;line-height:1px") + "}.cufon-canvas .cufon-alt{display:-moz-inline-box;display:inline-block;width:0;height:0;overflow:hidden}" + (HAS_INLINE_BLOCK ? ".cufon-canvas canvas{position:relative}" : ".cufon-canvas canvas{position:absolute}") + "}" + "@media print{" + ".cufon-canvas{padding:0 !important}" + ".cufon-canvas canvas{display:none}" + ".cufon-canvas .cufon-alt{display:inline}" + "}");
    try {
        styleSheet.appendChild(textNode);
    } catch (e) {
        styleSheet.setAttribute("type", "text/css");
        styleSheet.styleSheet.cssText = textNode.data;
    }
    fabric.document.getElementsByTagName("head")[0].appendChild(styleSheet);
    function generateFromVML(path, context) {
        var atX = 0, atY = 0;
        var code = [], re = /([mrvxe])([^a-z]*)/g, match;
        generate: for (var i = 0; match = re.exec(path); ++i) {
            var c = match[2].split(",");
            switch (match[1]) {
              case "v":
                code[i] = {
                    m: "bezierCurveTo",
                    a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ]
                };
                break;

              case "r":
                code[i] = {
                    m: "lineTo",
                    a: [ atX += ~~c[0], atY += ~~c[1] ]
                };
                break;

              case "m":
                code[i] = {
                    m: "moveTo",
                    a: [ atX = ~~c[0], atY = ~~c[1] ]
                };
                break;

              case "x":
                code[i] = {
                    m: "closePath",
                    a: []
                };
                break;

              case "e":
                break generate;
            }
            context[code[i].m].apply(context, code[i].a);
        }
        return code;
    }
    function interpret(code, context) {
        for (var i = 0, l = code.length; i < l; ++i) {
            var line = code[i];
            context[line.m].apply(context, line.a);
        }
    }
    return function(font, text, style, options, node, el) {
        var redraw = text === null;
        var viewBox = font.viewBox;
        var size = style.getSize("fontSize", font.baseSize);
        var letterSpacing = style.get("letterSpacing");
        letterSpacing = letterSpacing == "normal" ? 0 : size.convertFrom(parseInt(letterSpacing, 10));
        var expandTop = 0, expandRight = 0, expandBottom = 0, expandLeft = 0;
        var shadows = options.textShadow, shadowOffsets = [];
        Cufon.textOptions.shadowOffsets = [];
        Cufon.textOptions.shadows = null;
        if (shadows) {
            Cufon.textOptions.shadows = shadows;
            for (var i = 0, l = shadows.length; i < l; ++i) {
                var shadow = shadows[i];
                var x = size.convertFrom(parseFloat(shadow.offX));
                var y = size.convertFrom(parseFloat(shadow.offY));
                shadowOffsets[i] = [ x, y ];
            }
        }
        var chars = Cufon.CSS.textTransform(redraw ? node.alt : text, style).split("");
        var width = 0, lastWidth = null;
        var maxWidth = 0, lines = 1, lineWidths = [];
        for (var i = 0, l = chars.length; i < l; ++i) {
            if (chars[i] === "\n") {
                lines++;
                if (width > maxWidth) {
                    maxWidth = width;
                }
                lineWidths.push(width);
                width = 0;
                continue;
            }
            var glyph = font.glyphs[chars[i]] || font.missingGlyph;
            if (!glyph) continue;
            width += lastWidth = Number(glyph.w || font.w) + letterSpacing;
        }
        lineWidths.push(width);
        width = Math.max(maxWidth, width);
        var lineOffsets = [];
        for (var i = lineWidths.length; i--; ) {
            lineOffsets[i] = width - lineWidths[i];
        }
        if (lastWidth === null) return null;
        expandRight += viewBox.width - lastWidth;
        expandLeft += viewBox.minX;
        var wrapper, canvas;
        if (redraw) {
            wrapper = node;
            canvas = node.firstChild;
        } else {
            wrapper = fabric.document.createElement("span");
            wrapper.className = "cufon cufon-canvas";
            wrapper.alt = text;
            canvas = fabric.document.createElement("canvas");
            wrapper.appendChild(canvas);
            if (options.printable) {
                var print = fabric.document.createElement("span");
                print.className = "cufon-alt";
                print.appendChild(fabric.document.createTextNode(text));
                wrapper.appendChild(print);
            }
        }
        var wStyle = wrapper.style;
        var cStyle = canvas.style || {};
        var height = size.convert(viewBox.height - expandTop + expandBottom);
        var roundedHeight = Math.ceil(height);
        var roundingFactor = roundedHeight / height;
        canvas.width = Math.ceil(size.convert(width + expandRight - expandLeft) * roundingFactor);
        canvas.height = roundedHeight;
        expandTop += viewBox.minY;
        cStyle.top = Math.round(size.convert(expandTop - font.ascent)) + "px";
        cStyle.left = Math.round(size.convert(expandLeft)) + "px";
        var _width = Math.ceil(size.convert(width * roundingFactor));
        var wrapperWidth = _width + "px";
        var _height = size.convert(font.height);
        var totalLineHeight = (options.lineHeight - 1) * size.convert(-font.ascent / 5) * (lines - 1);
        Cufon.textOptions.width = _width;
        Cufon.textOptions.height = _height * lines + totalLineHeight;
        Cufon.textOptions.lines = lines;
        Cufon.textOptions.totalLineHeight = totalLineHeight;
        if (HAS_INLINE_BLOCK) {
            wStyle.width = wrapperWidth;
            wStyle.height = _height + "px";
        } else {
            wStyle.paddingLeft = wrapperWidth;
            wStyle.paddingBottom = _height - 1 + "px";
        }
        var g = Cufon.textOptions.context || canvas.getContext("2d"), scale = roundedHeight / viewBox.height;
        Cufon.textOptions.fontAscent = font.ascent * scale;
        Cufon.textOptions.boundaries = null;
        for (var offsets = Cufon.textOptions.shadowOffsets, i = shadowOffsets.length; i--; ) {
            offsets[i] = [ shadowOffsets[i][0] * scale, shadowOffsets[i][1] * scale ];
        }
        g.save();
        g.scale(scale, scale);
        g.translate(-expandLeft - 1 / scale * canvas.width / 2 + (Cufon.fonts[font.family].offsetLeft || 0), -expandTop - Cufon.textOptions.height / scale / 2 + (Cufon.fonts[font.family].offsetTop || 0));
        g.lineWidth = font.face["underline-thickness"];
        g.save();
        function line(y, color) {
            g.strokeStyle = color;
            g.beginPath();
            g.moveTo(0, y);
            g.lineTo(width, y);
            g.stroke();
        }
        var textDecoration = Cufon.getTextDecoration(options), isItalic = options.fontStyle === "italic";
        function renderBackground() {
            g.save();
            var left = 0, lineNum = 0, boundaries = [ {
                left: 0
            } ];
            if (options.backgroundColor) {
                g.save();
                g.fillStyle = options.backgroundColor;
                g.translate(0, font.ascent);
                g.fillRect(0, 0, width + 10, (-font.ascent + font.descent) * lines);
                g.restore();
            }
            if (options.textAlign === "right") {
                g.translate(lineOffsets[lineNum], 0);
                boundaries[0].left = lineOffsets[lineNum] * scale;
            } else if (options.textAlign === "center") {
                g.translate(lineOffsets[lineNum] / 2, 0);
                boundaries[0].left = lineOffsets[lineNum] / 2 * scale;
            }
            for (var i = 0, l = chars.length; i < l; ++i) {
                if (chars[i] === "\n") {
                    lineNum++;
                    var topOffset = -font.ascent - font.ascent / 5 * options.lineHeight;
                    var boundary = boundaries[boundaries.length - 1];
                    var nextBoundary = {
                        left: 0
                    };
                    boundary.width = left * scale;
                    boundary.height = (-font.ascent + font.descent) * scale;
                    if (options.textAlign === "right") {
                        g.translate(-width, topOffset);
                        g.translate(lineOffsets[lineNum], 0);
                        nextBoundary.left = lineOffsets[lineNum] * scale;
                    } else if (options.textAlign === "center") {
                        g.translate(-left - lineOffsets[lineNum - 1] / 2, topOffset);
                        g.translate(lineOffsets[lineNum] / 2, 0);
                        nextBoundary.left = lineOffsets[lineNum] / 2 * scale;
                    } else {
                        g.translate(-left, topOffset);
                    }
                    boundaries.push(nextBoundary);
                    left = 0;
                    continue;
                }
                var glyph = font.glyphs[chars[i]] || font.missingGlyph;
                if (!glyph) continue;
                var charWidth = Number(glyph.w || font.w) + letterSpacing;
                if (options.textBackgroundColor) {
                    g.save();
                    g.fillStyle = options.textBackgroundColor;
                    g.translate(0, font.ascent);
                    g.fillRect(0, 0, charWidth + 10, -font.ascent + font.descent);
                    g.restore();
                }
                g.translate(charWidth, 0);
                left += charWidth;
                if (i == l - 1) {
                    boundaries[boundaries.length - 1].width = left * scale;
                    boundaries[boundaries.length - 1].height = (-font.ascent + font.descent) * scale;
                }
            }
            g.restore();
            Cufon.textOptions.boundaries = boundaries;
        }
        function renderText(color) {
            g.fillStyle = color || Cufon.textOptions.color || style.get("color");
            var left = 0, lineNum = 0;
            if (options.textAlign === "right") {
                g.translate(lineOffsets[lineNum], 0);
            } else if (options.textAlign === "center") {
                g.translate(lineOffsets[lineNum] / 2, 0);
            }
            for (var i = 0, l = chars.length; i < l; ++i) {
                if (chars[i] === "\n") {
                    lineNum++;
                    var topOffset = -font.ascent - font.ascent / 5 * options.lineHeight;
                    if (options.textAlign === "right") {
                        g.translate(-width, topOffset);
                        g.translate(lineOffsets[lineNum], 0);
                    } else if (options.textAlign === "center") {
                        g.translate(-left - lineOffsets[lineNum - 1] / 2, topOffset);
                        g.translate(lineOffsets[lineNum] / 2, 0);
                    } else {
                        g.translate(-left, topOffset);
                    }
                    left = 0;
                    continue;
                }
                var glyph = font.glyphs[chars[i]] || font.missingGlyph;
                if (!glyph) continue;
                var charWidth = Number(glyph.w || font.w) + letterSpacing;
                if (textDecoration) {
                    g.save();
                    g.strokeStyle = g.fillStyle;
                    g.lineWidth += g.lineWidth;
                    g.beginPath();
                    if (textDecoration.underline) {
                        g.moveTo(0, -font.face["underline-position"] + .5);
                        g.lineTo(charWidth, -font.face["underline-position"] + .5);
                    }
                    if (textDecoration.overline) {
                        g.moveTo(0, font.ascent + .5);
                        g.lineTo(charWidth, font.ascent + .5);
                    }
                    if (textDecoration["line-through"]) {
                        g.moveTo(0, -font.descent + .5);
                        g.lineTo(charWidth, -font.descent + .5);
                    }
                    g.stroke();
                    g.restore();
                }
                if (isItalic) {
                    g.save();
                    g.transform(1, 0, -.25, 1, 0, 0);
                }
                g.beginPath();
                if (glyph.d) {
                    if (glyph.code) interpret(glyph.code, g); else glyph.code = generateFromVML("m" + glyph.d, g);
                }
                g.fill();
                if (options.strokeStyle) {
                    g.closePath();
                    g.save();
                    g.lineWidth = options.strokeWidth;
                    g.strokeStyle = options.strokeStyle;
                    g.stroke();
                    g.restore();
                }
                if (isItalic) {
                    g.restore();
                }
                g.translate(charWidth, 0);
                left += charWidth;
            }
        }
        g.save();
        renderBackground();
        if (shadows) {
            for (var i = 0, l = shadows.length; i < l; ++i) {
                var shadow = shadows[i];
                g.save();
                g.translate.apply(g, shadowOffsets[i]);
                renderText(shadow.color);
                g.restore();
            }
        }
        renderText();
        g.restore();
        g.restore();
        g.restore();
        return wrapper;
    };
}());

Cufon.registerEngine("vml", function() {
    if (!fabric.document.namespaces) return;
    var canvasEl = fabric.document.createElement("canvas");
    if (canvasEl && canvasEl.getContext && canvasEl.getContext.apply) return;
    if (fabric.document.namespaces.cvml == null) {
        fabric.document.namespaces.add("cvml", "urn:schemas-microsoft-com:vml");
    }
    var check = fabric.document.createElement("cvml:shape");
    check.style.behavior = "url(#default#VML)";
    if (!check.coordsize) return;
    check = null;
    fabric.document.write('<style type="text/css">' + ".cufon-vml-canvas{text-indent:0}" + "@media screen{" + "cvml\\:shape,cvml\\:shadow{behavior:url(#default#VML);display:block;antialias:true;position:absolute}" + ".cufon-vml-canvas{position:absolute;text-align:left}" + ".cufon-vml{display:inline-block;position:relative;vertical-align:middle}" + ".cufon-vml .cufon-alt{position:absolute;left:-10000in;font-size:1px}" + "a .cufon-vml{cursor:pointer}" + "}" + "@media print{" + ".cufon-vml *{display:none}" + ".cufon-vml .cufon-alt{display:inline}" + "}" + "</style>");
    function getFontSizeInPixels(el, value) {
        return getSizeInPixels(el, /(?:em|ex|%)$/i.test(value) ? "1em" : value);
    }
    function getSizeInPixels(el, value) {
        if (/px$/i.test(value)) return parseFloat(value);
        var style = el.style.left, runtimeStyle = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value;
        var result = el.style.pixelLeft;
        el.style.left = style;
        el.runtimeStyle.left = runtimeStyle;
        return result;
    }
    return function(font, text, style, options, node, el, hasNext) {
        var redraw = text === null;
        if (redraw) text = node.alt;
        var viewBox = font.viewBox;
        var size = style.computedFontSize || (style.computedFontSize = new Cufon.CSS.Size(getFontSizeInPixels(el, style.get("fontSize")) + "px", font.baseSize));
        var letterSpacing = style.computedLSpacing;
        if (letterSpacing == undefined) {
            letterSpacing = style.get("letterSpacing");
            style.computedLSpacing = letterSpacing = letterSpacing == "normal" ? 0 : ~~size.convertFrom(getSizeInPixels(el, letterSpacing));
        }
        var wrapper, canvas;
        if (redraw) {
            wrapper = node;
            canvas = node.firstChild;
        } else {
            wrapper = fabric.document.createElement("span");
            wrapper.className = "cufon cufon-vml";
            wrapper.alt = text;
            canvas = fabric.document.createElement("span");
            canvas.className = "cufon-vml-canvas";
            wrapper.appendChild(canvas);
            if (options.printable) {
                var print = fabric.document.createElement("span");
                print.className = "cufon-alt";
                print.appendChild(fabric.document.createTextNode(text));
                wrapper.appendChild(print);
            }
            if (!hasNext) wrapper.appendChild(fabric.document.createElement("cvml:shape"));
        }
        var wStyle = wrapper.style;
        var cStyle = canvas.style;
        var height = size.convert(viewBox.height), roundedHeight = Math.ceil(height);
        var roundingFactor = roundedHeight / height;
        var minX = viewBox.minX, minY = viewBox.minY;
        cStyle.height = roundedHeight;
        cStyle.top = Math.round(size.convert(minY - font.ascent));
        cStyle.left = Math.round(size.convert(minX));
        wStyle.height = size.convert(font.height) + "px";
        var textDecoration = Cufon.getTextDecoration(options);
        var color = style.get("color");
        var chars = Cufon.CSS.textTransform(text, style).split("");
        var width = 0, offsetX = 0, advance = null;
        var glyph, shape, shadows = options.textShadow;
        for (var i = 0, k = 0, l = chars.length; i < l; ++i) {
            glyph = font.glyphs[chars[i]] || font.missingGlyph;
            if (glyph) width += advance = ~~(glyph.w || font.w) + letterSpacing;
        }
        if (advance === null) return null;
        var fullWidth = -minX + width + (viewBox.width - advance);
        var shapeWidth = size.convert(fullWidth * roundingFactor), roundedShapeWidth = Math.round(shapeWidth);
        var coordSize = fullWidth + "," + viewBox.height, coordOrigin;
        var stretch = "r" + coordSize + "nsnf";
        for (i = 0; i < l; ++i) {
            glyph = font.glyphs[chars[i]] || font.missingGlyph;
            if (!glyph) continue;
            if (redraw) {
                shape = canvas.childNodes[k];
                if (shape.firstChild) shape.removeChild(shape.firstChild);
            } else {
                shape = fabric.document.createElement("cvml:shape");
                canvas.appendChild(shape);
            }
            shape.stroked = "f";
            shape.coordsize = coordSize;
            shape.coordorigin = coordOrigin = minX - offsetX + "," + minY;
            shape.path = (glyph.d ? "m" + glyph.d + "xe" : "") + "m" + coordOrigin + stretch;
            shape.fillcolor = color;
            var sStyle = shape.style;
            sStyle.width = roundedShapeWidth;
            sStyle.height = roundedHeight;
            if (shadows) {
                var shadow1 = shadows[0], shadow2 = shadows[1];
                var color1 = Cufon.CSS.color(shadow1.color), color2;
                var shadow = fabric.document.createElement("cvml:shadow");
                shadow.on = "t";
                shadow.color = color1.color;
                shadow.offset = shadow1.offX + "," + shadow1.offY;
                if (shadow2) {
                    color2 = Cufon.CSS.color(shadow2.color);
                    shadow.type = "double";
                    shadow.color2 = color2.color;
                    shadow.offset2 = shadow2.offX + "," + shadow2.offY;
                }
                shadow.opacity = color1.opacity || color2 && color2.opacity || 1;
                shape.appendChild(shadow);
            }
            offsetX += ~~(glyph.w || font.w) + letterSpacing;
            ++k;
        }
        wStyle.width = Math.max(Math.ceil(size.convert(width * roundingFactor)), 0);
        return wrapper;
    };
}());

Cufon.getTextDecoration = function(options) {
    return {
        underline: options.textDecoration === "underline",
        overline: options.textDecoration === "overline",
        "line-through": options.textDecoration === "line-through"
    };
};

if (typeof exports != "undefined") {
    exports.Cufon = Cufon;
}

if (typeof JSON !== "object") {
    JSON = {};
}

(function() {
    "use strict";
    function f(n) {
        return n < 10 ? "0" + n : n;
    }
    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function() {
            return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null;
        };
        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
            return this.valueOf();
        };
    }
    var cx, escapable, gap, indent, meta, rep;
    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        var i, k, v, length, mind = gap, partial, value = holder[key];
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
          case "string":
            return quote(value);

          case "number":
            return isFinite(value) ? String(value) : "null";

          case "boolean":
          case "null":
            return String(value);

          case "object":
            if (!value) {
                return "null";
            }
            gap += indent;
            partial = [];
            if (Object.prototype.toString.apply(value) === "[object Array]") {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }
                v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            }
            v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }
    if (typeof JSON.stringify !== "function") {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {
            "\b": "\\b",
            "	": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            '"': '\\"',
            "\\": "\\\\"
        };
        JSON.stringify = function(value, replacer, space) {
            var i;
            gap = "";
            indent = "";
            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }
            } else if (typeof space === "string") {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }
            return str("", {
                "": value
            });
        };
    }
    if (typeof JSON.parse !== "function") {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function(text, reviver) {
            var j;
            function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                j = eval("(" + text + ")");
                return typeof reviver === "function" ? walk({
                    "": j
                }, "") : j;
            }
            throw new SyntaxError("JSON.parse");
        };
    }
})();

(function() {
    function _removeEventListener(eventName, handler) {
        if (!this.__eventListeners[eventName]) {
            return;
        }
        if (handler) {
            fabric.util.removeFromArray(this.__eventListeners[eventName], handler);
        } else {
            this.__eventListeners[eventName].length = 0;
        }
    }
    function observe(eventName, handler) {
        if (!this.__eventListeners) {
            this.__eventListeners = {};
        }
        if (arguments.length === 1) {
            for (var prop in eventName) {
                this.on(prop, eventName[prop]);
            }
        } else {
            if (!this.__eventListeners[eventName]) {
                this.__eventListeners[eventName] = [];
            }
            this.__eventListeners[eventName].push(handler);
        }
        return this;
    }
    function stopObserving(eventName, handler) {
        if (!this.__eventListeners) {
            return;
        }
        if (arguments.length === 0) {
            this.__eventListeners = {};
        } else if (arguments.length === 1 && typeof arguments[0] === "object") {
            for (var prop in eventName) {
                _removeEventListener.call(this, prop, eventName[prop]);
            }
        } else {
            _removeEventListener.call(this, eventName, handler);
        }
        return this;
    }
    function fire(eventName, options) {
        if (!this.__eventListeners) {
            return;
        }
        var listenersForEvent = this.__eventListeners[eventName];
        if (!listenersForEvent) {
            return;
        }
        for (var i = 0, len = listenersForEvent.length; i < len; i++) {
            listenersForEvent[i].call(this, options || {});
        }
        return this;
    }
    fabric.Observable = {
        observe: observe,
        stopObserving: stopObserving,
        fire: fire,
        on: observe,
        off: stopObserving,
        trigger: fire
    };
})();

fabric.Collection = {
    add: function() {
        this._objects.push.apply(this._objects, arguments);
        for (var i = 0, length = arguments.length; i < length; i++) {
            this._onObjectAdded(arguments[i]);
        }
        this.renderOnAddRemove && this.renderAll();
        return this;
    },
    insertAt: function(object, index, nonSplicing) {
        var objects = this.getObjects();
        if (nonSplicing) {
            objects[index] = object;
        } else {
            objects.splice(index, 0, object);
        }
        this._onObjectAdded(object);
        this.renderOnAddRemove && this.renderAll();
        return this;
    },
    remove: function() {
        var objects = this.getObjects(), index;
        for (var i = 0, length = arguments.length; i < length; i++) {
            index = objects.indexOf(arguments[i]);
            if (index !== -1) {
                objects.splice(index, 1);
                this._onObjectRemoved(arguments[i]);
            }
        }
        this.renderOnAddRemove && this.renderAll();
        return this;
    },
    forEachObject: function(callback, context) {
        var objects = this.getObjects(), i = objects.length;
        while (i--) {
            callback.call(context, objects[i], i, objects);
        }
        return this;
    },
    getObjects: function(type) {
        if (typeof type === "undefined") {
            return this._objects;
        }
        return this._objects.filter(function(o) {
            return o.type === type;
        });
    },
    item: function(index) {
        return this.getObjects()[index];
    },
    isEmpty: function() {
        return this.getObjects().length === 0;
    },
    size: function() {
        return this.getObjects().length;
    },
    contains: function(object) {
        return this.getObjects().indexOf(object) > -1;
    },
    complexity: function() {
        return this.getObjects().reduce(function(memo, current) {
            memo += current.complexity ? current.complexity() : 0;
            return memo;
        }, 0);
    }
};

(function(global) {
    var sqrt = Math.sqrt, atan2 = Math.atan2, PiBy180 = Math.PI / 180;
    fabric.util = {
        removeFromArray: function(array, value) {
            var idx = array.indexOf(value);
            if (idx !== -1) {
                array.splice(idx, 1);
            }
            return array;
        },
        getRandomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        degreesToRadians: function(degrees) {
            return degrees * PiBy180;
        },
        radiansToDegrees: function(radians) {
            return radians / PiBy180;
        },
        rotatePoint: function(point, origin, radians) {
            var sin = Math.sin(radians), cos = Math.cos(radians);
            point.subtractEquals(origin);
            var rx = point.x * cos - point.y * sin, ry = point.x * sin + point.y * cos;
            return new fabric.Point(rx, ry).addEquals(origin);
        },
        transformPoint: function(p, t, ignoreOffset) {
            if (ignoreOffset) {
                return new fabric.Point(t[0] * p.x + t[1] * p.y, t[2] * p.x + t[3] * p.y);
            }
            return new fabric.Point(t[0] * p.x + t[1] * p.y + t[4], t[2] * p.x + t[3] * p.y + t[5]);
        },
        invertTransform: function(t) {
            var r = t.slice(), a = 1 / (t[0] * t[3] - t[1] * t[2]);
            r = [ a * t[3], -a * t[1], -a * t[2], a * t[0], 0, 0 ];
            var o = fabric.util.transformPoint({
                x: t[4],
                y: t[5]
            }, r);
            r[4] = -o.x;
            r[5] = -o.y;
            return r;
        },
        toFixed: function(number, fractionDigits) {
            return parseFloat(Number(number).toFixed(fractionDigits));
        },
        parseUnit: function(value, fontSize) {
            var unit = /\D{0,2}$/.exec(value), number = parseFloat(value);
            if (!fontSize) {
                fontSize = fabric.Text.DEFAULT_SVG_FONT_SIZE;
            }
            switch (unit[0]) {
              case "mm":
                return number * fabric.DPI / 25.4;

              case "cm":
                return number * fabric.DPI / 2.54;

              case "in":
                return number * fabric.DPI;

              case "pt":
                return number * fabric.DPI / 72;

              case "pc":
                return number * fabric.DPI / 72 * 12;

              case "em":
                return number * fontSize;

              default:
                return number;
            }
        },
        falseFunction: function() {
            return false;
        },
        getKlass: function(type, namespace) {
            type = fabric.util.string.camelize(type.charAt(0).toUpperCase() + type.slice(1));
            return fabric.util.resolveNamespace(namespace)[type];
        },
        resolveNamespace: function(namespace) {
            if (!namespace) {
                return fabric;
            }
            var parts = namespace.split("."), len = parts.length, obj = global || fabric.window;
            for (var i = 0; i < len; ++i) {
                obj = obj[parts[i]];
            }
            return obj;
        },
        loadImage: function(url, callback, context, crossOrigin) {
            if (!url) {
                callback && callback.call(context, url);
                return;
            }
            var img = fabric.util.createImage();
            img.onload = function() {
                callback && callback.call(context, img);
                img = img.onload = img.onerror = null;
            };
            img.onerror = function() {
                fabric.log("Error loading " + img.src);
                callback && callback.call(context, null, true);
                img = img.onload = img.onerror = null;
            };
            if (url.indexOf("data") !== 0 && typeof crossOrigin !== "undefined") {
                img.crossOrigin = crossOrigin;
            }
            img.src = url;
        },
        enlivenObjects: function(objects, callback, namespace, reviver) {
            objects = objects || [];
            function onLoaded() {
                if (++numLoadedObjects === numTotalObjects) {
                    callback && callback(enlivenedObjects);
                }
            }
            var enlivenedObjects = [], numLoadedObjects = 0, numTotalObjects = objects.length;
            if (!numTotalObjects) {
                callback && callback(enlivenedObjects);
                return;
            }
            objects.forEach(function(o, index) {
                if (!o || !o.type) {
                    onLoaded();
                    return;
                }
                var klass = fabric.util.getKlass(o.type, namespace);
                if (klass.async) {
                    klass.fromObject(o, function(obj, error) {
                        if (!error) {
                            enlivenedObjects[index] = obj;
                            reviver && reviver(o, enlivenedObjects[index]);
                        }
                        onLoaded();
                    });
                } else {
                    enlivenedObjects[index] = klass.fromObject(o);
                    reviver && reviver(o, enlivenedObjects[index]);
                    onLoaded();
                }
            });
        },
        groupSVGElements: function(elements, options, path) {
            var object;
            object = new fabric.PathGroup(elements, options);
            if (typeof path !== "undefined") {
                object.setSourcePath(path);
            }
            return object;
        },
        populateWithProperties: function(source, destination, properties) {
            if (properties && Object.prototype.toString.call(properties) === "[object Array]") {
                for (var i = 0, len = properties.length; i < len; i++) {
                    if (properties[i] in source) {
                        destination[properties[i]] = source[properties[i]];
                    }
                }
            }
        },
        drawDashedLine: function(ctx, x, y, x2, y2, da) {
            var dx = x2 - x, dy = y2 - y, len = sqrt(dx * dx + dy * dy), rot = atan2(dy, dx), dc = da.length, di = 0, draw = true;
            ctx.save();
            ctx.translate(x, y);
            ctx.moveTo(0, 0);
            ctx.rotate(rot);
            x = 0;
            while (len > x) {
                x += da[di++ % dc];
                if (x > len) {
                    x = len;
                }
                ctx[draw ? "lineTo" : "moveTo"](x, 0);
                draw = !draw;
            }
            ctx.restore();
        },
        createCanvasElement: function(canvasEl) {
            canvasEl || (canvasEl = fabric.document.createElement("canvas"));
            if (!canvasEl.getContext && typeof G_vmlCanvasManager !== "undefined") {
                G_vmlCanvasManager.initElement(canvasEl);
            }
            return canvasEl;
        },
        createImage: function() {
            return fabric.document.createElement("img");
        },
        createAccessors: function(klass) {
            var proto = klass.prototype;
            for (var i = proto.stateProperties.length; i--; ) {
                var propName = proto.stateProperties[i], capitalizedPropName = propName.charAt(0).toUpperCase() + propName.slice(1), setterName = "set" + capitalizedPropName, getterName = "get" + capitalizedPropName;
                if (!proto[getterName]) {
                    proto[getterName] = function(property) {
                        return new Function('return this.get("' + property + '")');
                    }(propName);
                }
                if (!proto[setterName]) {
                    proto[setterName] = function(property) {
                        return new Function("value", 'return this.set("' + property + '", value)');
                    }(propName);
                }
            }
        },
        clipContext: function(receiver, ctx) {
            ctx.save();
            ctx.beginPath();
            receiver.clipTo(ctx);
            ctx.clip();
        },
        multiplyTransformMatrices: function(matrixA, matrixB) {
            var a = [ [ matrixA[0], matrixA[2], matrixA[4] ], [ matrixA[1], matrixA[3], matrixA[5] ], [ 0, 0, 1 ] ], b = [ [ matrixB[0], matrixB[2], matrixB[4] ], [ matrixB[1], matrixB[3], matrixB[5] ], [ 0, 0, 1 ] ], result = [];
            for (var r = 0; r < 3; r++) {
                result[r] = [];
                for (var c = 0; c < 3; c++) {
                    var sum = 0;
                    for (var k = 0; k < 3; k++) {
                        sum += a[r][k] * b[k][c];
                    }
                    result[r][c] = sum;
                }
            }
            return [ result[0][0], result[1][0], result[0][1], result[1][1], result[0][2], result[1][2] ];
        },
        getFunctionBody: function(fn) {
            return (String(fn).match(/function[^{]*\{([\s\S]*)\}/) || {})[1];
        },
        isTransparent: function(ctx, x, y, tolerance) {
            if (tolerance > 0) {
                if (x > tolerance) {
                    x -= tolerance;
                } else {
                    x = 0;
                }
                if (y > tolerance) {
                    y -= tolerance;
                } else {
                    y = 0;
                }
            }
            var _isTransparent = true, imageData = ctx.getImageData(x, y, tolerance * 2 || 1, tolerance * 2 || 1);
            for (var i = 3, l = imageData.data.length; i < l; i += 4) {
                var temp = imageData.data[i];
                _isTransparent = temp <= 0;
                if (_isTransparent === false) {
                    break;
                }
            }
            imageData = null;
            return _isTransparent;
        }
    };
})(typeof exports !== "undefined" ? exports : this);

(function() {
    var arcToSegmentsCache = {}, segmentToBezierCache = {}, boundsOfCurveCache = {}, _join = Array.prototype.join;
    function arcToSegments(toX, toY, rx, ry, large, sweep, rotateX) {
        var argsString = _join.call(arguments);
        if (arcToSegmentsCache[argsString]) {
            return arcToSegmentsCache[argsString];
        }
        var PI = Math.PI, th = rotateX * PI / 180, sinTh = Math.sin(th), cosTh = Math.cos(th), fromX = 0, fromY = 0;
        rx = Math.abs(rx);
        ry = Math.abs(ry);
        var px = -cosTh * toX * .5 - sinTh * toY * .5, py = -cosTh * toY * .5 + sinTh * toX * .5, rx2 = rx * rx, ry2 = ry * ry, py2 = py * py, px2 = px * px, pl = rx2 * ry2 - rx2 * py2 - ry2 * px2, root = 0;
        if (pl < 0) {
            var s = Math.sqrt(1 - pl / (rx2 * ry2));
            rx *= s;
            ry *= s;
        } else {
            root = (large === sweep ? -1 : 1) * Math.sqrt(pl / (rx2 * py2 + ry2 * px2));
        }
        var cx = root * rx * py / ry, cy = -root * ry * px / rx, cx1 = cosTh * cx - sinTh * cy + toX * .5, cy1 = sinTh * cx + cosTh * cy + toY * .5, mTheta = calcVectorAngle(1, 0, (px - cx) / rx, (py - cy) / ry), dtheta = calcVectorAngle((px - cx) / rx, (py - cy) / ry, (-px - cx) / rx, (-py - cy) / ry);
        if (sweep === 0 && dtheta > 0) {
            dtheta -= 2 * PI;
        } else if (sweep === 1 && dtheta < 0) {
            dtheta += 2 * PI;
        }
        var segments = Math.ceil(Math.abs(dtheta / PI * 2)), result = [], mDelta = dtheta / segments, mT = 8 / 3 * Math.sin(mDelta / 4) * Math.sin(mDelta / 4) / Math.sin(mDelta / 2), th3 = mTheta + mDelta;
        for (var i = 0; i < segments; i++) {
            result[i] = segmentToBezier(mTheta, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY);
            fromX = result[i][4];
            fromY = result[i][5];
            mTheta = th3;
            th3 += mDelta;
        }
        arcToSegmentsCache[argsString] = result;
        return result;
    }
    function segmentToBezier(th2, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY) {
        var argsString2 = _join.call(arguments);
        if (segmentToBezierCache[argsString2]) {
            return segmentToBezierCache[argsString2];
        }
        var costh2 = Math.cos(th2), sinth2 = Math.sin(th2), costh3 = Math.cos(th3), sinth3 = Math.sin(th3), toX = cosTh * rx * costh3 - sinTh * ry * sinth3 + cx1, toY = sinTh * rx * costh3 + cosTh * ry * sinth3 + cy1, cp1X = fromX + mT * (-cosTh * rx * sinth2 - sinTh * ry * costh2), cp1Y = fromY + mT * (-sinTh * rx * sinth2 + cosTh * ry * costh2), cp2X = toX + mT * (cosTh * rx * sinth3 + sinTh * ry * costh3), cp2Y = toY + mT * (sinTh * rx * sinth3 - cosTh * ry * costh3);
        segmentToBezierCache[argsString2] = [ cp1X, cp1Y, cp2X, cp2Y, toX, toY ];
        return segmentToBezierCache[argsString2];
    }
    function calcVectorAngle(ux, uy, vx, vy) {
        var ta = Math.atan2(uy, ux), tb = Math.atan2(vy, vx);
        if (tb >= ta) {
            return tb - ta;
        } else {
            return 2 * Math.PI - (ta - tb);
        }
    }
    fabric.util.drawArc = function(ctx, fx, fy, coords) {
        var rx = coords[0], ry = coords[1], rot = coords[2], large = coords[3], sweep = coords[4], tx = coords[5], ty = coords[6], segs = [ [], [], [], [] ], segsNorm = arcToSegments(tx - fx, ty - fy, rx, ry, large, sweep, rot);
        for (var i = 0, len = segsNorm.length; i < len; i++) {
            segs[i][0] = segsNorm[i][0] + fx;
            segs[i][1] = segsNorm[i][1] + fy;
            segs[i][2] = segsNorm[i][2] + fx;
            segs[i][3] = segsNorm[i][3] + fy;
            segs[i][4] = segsNorm[i][4] + fx;
            segs[i][5] = segsNorm[i][5] + fy;
            ctx.bezierCurveTo.apply(ctx, segs[i]);
        }
    };
    fabric.util.getBoundsOfArc = function(fx, fy, rx, ry, rot, large, sweep, tx, ty) {
        var fromX = 0, fromY = 0, bound = [], bounds = [], segs = arcToSegments(tx - fx, ty - fy, rx, ry, large, sweep, rot);
        for (var i = 0, len = segs.length; i < len; i++) {
            bound = getBoundsOfCurve(fromX, fromY, segs[i][0], segs[i][1], segs[i][2], segs[i][3], segs[i][4], segs[i][5]);
            bound[0].x += fx;
            bound[0].y += fy;
            bound[1].x += fx;
            bound[1].y += fy;
            bounds.push(bound[0]);
            bounds.push(bound[1]);
            fromX = segs[i][4];
            fromY = segs[i][5];
        }
        return bounds;
    };
    function getBoundsOfCurve(x0, y0, x1, y1, x2, y2, x3, y3) {
        var argsString = _join.call(arguments);
        if (boundsOfCurveCache[argsString]) {
            return boundsOfCurveCache[argsString];
        }
        var sqrt = Math.sqrt, min = Math.min, max = Math.max, abs = Math.abs, tvalues = [], bounds = [ [], [] ], a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        b = 6 * x0 - 12 * x1 + 6 * x2;
        a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
        c = 3 * x1 - 3 * x0;
        for (var i = 0; i < 2; ++i) {
            if (i > 0) {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < 1e-12) {
                if (abs(b) < 1e-12) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            if (b2ac < 0) {
                continue;
            }
            sqrtb2ac = sqrt(b2ac);
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }
        var x, y, j = tvalues.length, jlen = j, mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
            bounds[0][j] = x;
            y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
            bounds[1][j] = y;
        }
        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        var result = [ {
            x: min.apply(null, bounds[0]),
            y: min.apply(null, bounds[1])
        }, {
            x: max.apply(null, bounds[0]),
            y: max.apply(null, bounds[1])
        } ];
        boundsOfCurveCache[argsString] = result;
        return result;
    }
    fabric.util.getBoundsOfCurve = getBoundsOfCurve;
})();

(function() {
    var slice = Array.prototype.slice;
    function invoke(array, method) {
        var args = slice.call(arguments, 2), result = [];
        for (var i = 0, len = array.length; i < len; i++) {
            result[i] = args.length ? array[i][method].apply(array[i], args) : array[i][method].call(array[i]);
        }
        return result;
    }
    function max(array, byProperty) {
        return find(array, byProperty, function(value1, value2) {
            return value1 >= value2;
        });
    }
    function min(array, byProperty) {
        return find(array, byProperty, function(value1, value2) {
            return value1 < value2;
        });
    }
    function find(array, byProperty, condition) {
        if (!array || array.length === 0) {
            return;
        }
        var i = array.length - 1, result = byProperty ? array[i][byProperty] : array[i];
        if (byProperty) {
            while (i--) {
                if (condition(array[i][byProperty], result)) {
                    result = array[i][byProperty];
                }
            }
        } else {
            while (i--) {
                if (condition(array[i], result)) {
                    result = array[i];
                }
            }
        }
        return result;
    }
    fabric.util.array = {
        invoke: invoke,
        min: min,
        max: max
    };
})();

(function() {
    function extend(destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
        return destination;
    }
    function clone(object) {
        return extend({}, object);
    }
    fabric.util.object = {
        extend: extend,
        clone: clone
    };
})();

(function() {
    function camelize(string) {
        return string.replace(/-+(.)?/g, function(match, character) {
            return character ? character.toUpperCase() : "";
        });
    }
    function capitalize(string, firstLetterOnly) {
        return string.charAt(0).toUpperCase() + (firstLetterOnly ? string.slice(1) : string.slice(1).toLowerCase());
    }
    function escapeXml(string) {
        return string.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    fabric.util.string = {
        camelize: camelize,
        capitalize: capitalize,
        escapeXml: escapeXml
    };
})();

(function() {
    var slice = Array.prototype.slice, emptyFunction = function() {}, IS_DONTENUM_BUGGY = function() {
        for (var p in {
            toString: 1
        }) {
            if (p === "toString") {
                return false;
            }
        }
        return true;
    }(), addMethods = function(klass, source, parent) {
        for (var property in source) {
            if (property in klass.prototype && typeof klass.prototype[property] === "function" && (source[property] + "").indexOf("callSuper") > -1) {
                klass.prototype[property] = function(property) {
                    return function() {
                        var superclass = this.constructor.superclass;
                        this.constructor.superclass = parent;
                        var returnValue = source[property].apply(this, arguments);
                        this.constructor.superclass = superclass;
                        if (property !== "initialize") {
                            return returnValue;
                        }
                    };
                }(property);
            } else {
                klass.prototype[property] = source[property];
            }
            if (IS_DONTENUM_BUGGY) {
                if (source.toString !== Object.prototype.toString) {
                    klass.prototype.toString = source.toString;
                }
                if (source.valueOf !== Object.prototype.valueOf) {
                    klass.prototype.valueOf = source.valueOf;
                }
            }
        }
    };
    function Subclass() {}
    function callSuper(methodName) {
        var fn = this.constructor.superclass.prototype[methodName];
        return arguments.length > 1 ? fn.apply(this, slice.call(arguments, 1)) : fn.call(this);
    }
    function createClass() {
        var parent = null, properties = slice.call(arguments, 0);
        if (typeof properties[0] === "function") {
            parent = properties.shift();
        }
        function klass() {
            this.initialize.apply(this, arguments);
        }
        klass.superclass = parent;
        klass.subclasses = [];
        if (parent) {
            Subclass.prototype = parent.prototype;
            klass.prototype = new Subclass();
            parent.subclasses.push(klass);
        }
        for (var i = 0, length = properties.length; i < length; i++) {
            addMethods(klass, properties[i], parent);
        }
        if (!klass.prototype.initialize) {
            klass.prototype.initialize = emptyFunction;
        }
        klass.prototype.constructor = klass;
        klass.prototype.callSuper = callSuper;
        return klass;
    }
    fabric.util.createClass = createClass;
})();

(function() {
    var unknown = "unknown";
    function areHostMethods(object) {
        var methodNames = Array.prototype.slice.call(arguments, 1), t, i, len = methodNames.length;
        for (i = 0; i < len; i++) {
            t = typeof object[methodNames[i]];
            if (!/^(?:function|object|unknown)$/.test(t)) {
                return false;
            }
        }
        return true;
    }
    var getElement, setElement, getUniqueId = function() {
        var uid = 0;
        return function(element) {
            return element.__uniqueID || (element.__uniqueID = "uniqueID__" + uid++);
        };
    }();
    (function() {
        var elements = {};
        getElement = function(uid) {
            return elements[uid];
        };
        setElement = function(uid, element) {
            elements[uid] = element;
        };
    })();
    function createListener(uid, handler) {
        return {
            handler: handler,
            wrappedHandler: createWrappedHandler(uid, handler)
        };
    }
    function createWrappedHandler(uid, handler) {
        return function(e) {
            handler.call(getElement(uid), e || fabric.window.event);
        };
    }
    function createDispatcher(uid, eventName) {
        return function(e) {
            if (handlers[uid] && handlers[uid][eventName]) {
                var handlersForEvent = handlers[uid][eventName];
                for (var i = 0, len = handlersForEvent.length; i < len; i++) {
                    handlersForEvent[i].call(this, e || fabric.window.event);
                }
            }
        };
    }
    var shouldUseAddListenerRemoveListener = areHostMethods(fabric.document.documentElement, "addEventListener", "removeEventListener") && areHostMethods(fabric.window, "addEventListener", "removeEventListener"), shouldUseAttachEventDetachEvent = areHostMethods(fabric.document.documentElement, "attachEvent", "detachEvent") && areHostMethods(fabric.window, "attachEvent", "detachEvent"), listeners = {}, handlers = {}, addListener, removeListener;
    if (shouldUseAddListenerRemoveListener) {
        addListener = function(element, eventName, handler) {
            element.addEventListener(eventName, handler, false);
        };
        removeListener = function(element, eventName, handler) {
            element.removeEventListener(eventName, handler, false);
        };
    } else if (shouldUseAttachEventDetachEvent) {
        addListener = function(element, eventName, handler) {
            var uid = getUniqueId(element);
            setElement(uid, element);
            if (!listeners[uid]) {
                listeners[uid] = {};
            }
            if (!listeners[uid][eventName]) {
                listeners[uid][eventName] = [];
            }
            var listener = createListener(uid, handler);
            listeners[uid][eventName].push(listener);
            element.attachEvent("on" + eventName, listener.wrappedHandler);
        };
        removeListener = function(element, eventName, handler) {
            var uid = getUniqueId(element), listener;
            if (listeners[uid] && listeners[uid][eventName]) {
                for (var i = 0, len = listeners[uid][eventName].length; i < len; i++) {
                    listener = listeners[uid][eventName][i];
                    if (listener && listener.handler === handler) {
                        element.detachEvent("on" + eventName, listener.wrappedHandler);
                        listeners[uid][eventName][i] = null;
                    }
                }
            }
        };
    } else {
        addListener = function(element, eventName, handler) {
            var uid = getUniqueId(element);
            if (!handlers[uid]) {
                handlers[uid] = {};
            }
            if (!handlers[uid][eventName]) {
                handlers[uid][eventName] = [];
                var existingHandler = element["on" + eventName];
                if (existingHandler) {
                    handlers[uid][eventName].push(existingHandler);
                }
                element["on" + eventName] = createDispatcher(uid, eventName);
            }
            handlers[uid][eventName].push(handler);
        };
        removeListener = function(element, eventName, handler) {
            var uid = getUniqueId(element);
            if (handlers[uid] && handlers[uid][eventName]) {
                var handlersForEvent = handlers[uid][eventName];
                for (var i = 0, len = handlersForEvent.length; i < len; i++) {
                    if (handlersForEvent[i] === handler) {
                        handlersForEvent.splice(i, 1);
                    }
                }
            }
        };
    }
    fabric.util.addListener = addListener;
    fabric.util.removeListener = removeListener;
    function getPointer(event, upperCanvasEl) {
        event || (event = fabric.window.event);
        var element = event.target || (typeof event.srcElement !== unknown ? event.srcElement : null), scroll = fabric.util.getScrollLeftTop(element, upperCanvasEl);
        return {
            x: pointerX(event) + scroll.left,
            y: pointerY(event) + scroll.top
        };
    }
    var pointerX = function(event) {
        return typeof event.clientX !== unknown ? event.clientX : 0;
    }, pointerY = function(event) {
        return typeof event.clientY !== unknown ? event.clientY : 0;
    };
    function _getPointer(event, pageProp, clientProp) {
        var touchProp = event.type === "touchend" ? "changedTouches" : "touches";
        return event[touchProp] && event[touchProp][0] ? event[touchProp][0][pageProp] - (event[touchProp][0][pageProp] - event[touchProp][0][clientProp]) || event[clientProp] : event[clientProp];
    }
    if (fabric.isTouchSupported) {
        pointerX = function(event) {
            return _getPointer(event, "pageX", "clientX");
        };
        pointerY = function(event) {
            return _getPointer(event, "pageY", "clientY");
        };
    }
    fabric.util.getPointer = getPointer;
    fabric.util.object.extend(fabric.util, fabric.Observable);
})();

(function() {
    function setStyle(element, styles) {
        var elementStyle = element.style;
        if (!elementStyle) {
            return element;
        }
        if (typeof styles === "string") {
            element.style.cssText += ";" + styles;
            return styles.indexOf("opacity") > -1 ? setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
        }
        for (var property in styles) {
            if (property === "opacity") {
                setOpacity(element, styles[property]);
            } else {
                var normalizedProperty = property === "float" || property === "cssFloat" ? typeof elementStyle.styleFloat === "undefined" ? "cssFloat" : "styleFloat" : property;
                elementStyle[normalizedProperty] = styles[property];
            }
        }
        return element;
    }
    var parseEl = fabric.document.createElement("div"), supportsOpacity = typeof parseEl.style.opacity === "string", supportsFilters = typeof parseEl.style.filter === "string", reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/, setOpacity = function(element) {
        return element;
    };
    if (supportsOpacity) {
        setOpacity = function(element, value) {
            element.style.opacity = value;
            return element;
        };
    } else if (supportsFilters) {
        setOpacity = function(element, value) {
            var es = element.style;
            if (element.currentStyle && !element.currentStyle.hasLayout) {
                es.zoom = 1;
            }
            if (reOpacity.test(es.filter)) {
                value = value >= .9999 ? "" : "alpha(opacity=" + value * 100 + ")";
                es.filter = es.filter.replace(reOpacity, value);
            } else {
                es.filter += " alpha(opacity=" + value * 100 + ")";
            }
            return element;
        };
    }
    fabric.util.setStyle = setStyle;
})();

(function() {
    var _slice = Array.prototype.slice;
    function getById(id) {
        return typeof id === "string" ? fabric.document.getElementById(id) : id;
    }
    var sliceCanConvertNodelists, toArray = function(arrayLike) {
        return _slice.call(arrayLike, 0);
    };
    try {
        sliceCanConvertNodelists = toArray(fabric.document.childNodes) instanceof Array;
    } catch (err) {}
    if (!sliceCanConvertNodelists) {
        toArray = function(arrayLike) {
            var arr = new Array(arrayLike.length), i = arrayLike.length;
            while (i--) {
                arr[i] = arrayLike[i];
            }
            return arr;
        };
    }
    function makeElement(tagName, attributes) {
        var el = fabric.document.createElement(tagName);
        for (var prop in attributes) {
            if (prop === "class") {
                el.className = attributes[prop];
            } else if (prop === "for") {
                el.htmlFor = attributes[prop];
            } else {
                el.setAttribute(prop, attributes[prop]);
            }
        }
        return el;
    }
    function addClass(element, className) {
        if (element && (" " + element.className + " ").indexOf(" " + className + " ") === -1) {
            element.className += (element.className ? " " : "") + className;
        }
    }
    function wrapElement(element, wrapper, attributes) {
        if (typeof wrapper === "string") {
            wrapper = makeElement(wrapper, attributes);
        }
        if (element.parentNode) {
            element.parentNode.replaceChild(wrapper, element);
        }
        wrapper.appendChild(element);
        return wrapper;
    }
    function getScrollLeftTop(element, upperCanvasEl) {
        var firstFixedAncestor, origElement, left = 0, top = 0, docElement = fabric.document.documentElement, body = fabric.document.body || {
            scrollLeft: 0,
            scrollTop: 0
        };
        origElement = element;
        while (element && element.parentNode && !firstFixedAncestor) {
            element = element.parentNode;
            if (element.nodeType === 1 && fabric.util.getElementStyle(element, "position") === "fixed") {
                firstFixedAncestor = element;
            }
            if (element.nodeType === 1 && origElement !== upperCanvasEl && fabric.util.getElementStyle(element, "position") === "absolute") {
                left = 0;
                top = 0;
            } else if (element === fabric.document) {
                left = body.scrollLeft || docElement.scrollLeft || 0;
                top = body.scrollTop || docElement.scrollTop || 0;
            } else {
                left += element.scrollLeft || 0;
                top += element.scrollTop || 0;
            }
        }
        return {
            left: left,
            top: top
        };
    }
    function getElementOffset(element) {
        var docElem, doc = element && element.ownerDocument, box = {
            left: 0,
            top: 0
        }, offset = {
            left: 0,
            top: 0
        }, scrollLeftTop, offsetAttributes = {
            borderLeftWidth: "left",
            borderTopWidth: "top",
            paddingLeft: "left",
            paddingTop: "top"
        };
        if (!doc) {
            return {
                left: 0,
                top: 0
            };
        }
        for (var attr in offsetAttributes) {
            offset[offsetAttributes[attr]] += parseInt(getElementStyle(element, attr), 10) || 0;
        }
        docElem = doc.documentElement;
        if (typeof element.getBoundingClientRect !== "undefined") {
            box = element.getBoundingClientRect();
        }
        scrollLeftTop = fabric.util.getScrollLeftTop(element, null);
        return {
            left: box.left + scrollLeftTop.left - (docElem.clientLeft || 0) + offset.left,
            top: box.top + scrollLeftTop.top - (docElem.clientTop || 0) + offset.top
        };
    }
    var getElementStyle;
    if (fabric.document.defaultView && fabric.document.defaultView.getComputedStyle) {
        getElementStyle = function(element, attr) {
            var style = fabric.document.defaultView.getComputedStyle(element, null);
            return style ? style[attr] : undefined;
        };
    } else {
        getElementStyle = function(element, attr) {
            var value = element.style[attr];
            if (!value && element.currentStyle) {
                value = element.currentStyle[attr];
            }
            return value;
        };
    }
    (function() {
        var style = fabric.document.documentElement.style, selectProp = "userSelect" in style ? "userSelect" : "MozUserSelect" in style ? "MozUserSelect" : "WebkitUserSelect" in style ? "WebkitUserSelect" : "KhtmlUserSelect" in style ? "KhtmlUserSelect" : "";
        function makeElementUnselectable(element) {
            if (typeof element.onselectstart !== "undefined") {
                element.onselectstart = fabric.util.falseFunction;
            }
            if (selectProp) {
                element.style[selectProp] = "none";
            } else if (typeof element.unselectable === "string") {
                element.unselectable = "on";
            }
            return element;
        }
        function makeElementSelectable(element) {
            if (typeof element.onselectstart !== "undefined") {
                element.onselectstart = null;
            }
            if (selectProp) {
                element.style[selectProp] = "";
            } else if (typeof element.unselectable === "string") {
                element.unselectable = "";
            }
            return element;
        }
        fabric.util.makeElementUnselectable = makeElementUnselectable;
        fabric.util.makeElementSelectable = makeElementSelectable;
    })();
    (function() {
        function getScript(url, callback) {
            var headEl = fabric.document.getElementsByTagName("head")[0], scriptEl = fabric.document.createElement("script"), loading = true;
            scriptEl.onload = scriptEl.onreadystatechange = function(e) {
                if (loading) {
                    if (typeof this.readyState === "string" && this.readyState !== "loaded" && this.readyState !== "complete") {
                        return;
                    }
                    loading = false;
                    callback(e || fabric.window.event);
                    scriptEl = scriptEl.onload = scriptEl.onreadystatechange = null;
                }
            };
            scriptEl.src = url;
            headEl.appendChild(scriptEl);
        }
        fabric.util.getScript = getScript;
    })();
    fabric.util.getById = getById;
    fabric.util.toArray = toArray;
    fabric.util.makeElement = makeElement;
    fabric.util.addClass = addClass;
    fabric.util.wrapElement = wrapElement;
    fabric.util.getScrollLeftTop = getScrollLeftTop;
    fabric.util.getElementOffset = getElementOffset;
    fabric.util.getElementStyle = getElementStyle;
})();

(function() {
    function addParamToUrl(url, param) {
        return url + (/\?/.test(url) ? "&" : "?") + param;
    }
    var makeXHR = function() {
        var factories = [ function() {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }, function() {
            return new ActiveXObject("Msxml2.XMLHTTP");
        }, function() {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
        }, function() {
            return new XMLHttpRequest();
        } ];
        for (var i = factories.length; i--; ) {
            try {
                var req = factories[i]();
                if (req) {
                    return factories[i];
                }
            } catch (err) {}
        }
    }();
    function emptyFn() {}
    function request(url, options) {
        options || (options = {});
        var method = options.method ? options.method.toUpperCase() : "GET", onComplete = options.onComplete || function() {}, xhr = makeXHR(), body;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                onComplete(xhr);
                xhr.onreadystatechange = emptyFn;
            }
        };
        if (method === "GET") {
            body = null;
            if (typeof options.parameters === "string") {
                url = addParamToUrl(url, options.parameters);
            }
        }
        xhr.open(method, url, true);
        if (method === "POST" || method === "PUT") {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }
        xhr.send(body);
        return xhr;
    }
    fabric.util.request = request;
})();

fabric.log = function() {};

fabric.warn = function() {};

if (typeof console !== "undefined") {
    [ "log", "warn" ].forEach(function(methodName) {
        if (typeof console[methodName] !== "undefined" && console[methodName].apply) {
            fabric[methodName] = function() {
                return console[methodName].apply(console, arguments);
            };
        }
    });
}

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, capitalize = fabric.util.string.capitalize, clone = fabric.util.object.clone, toFixed = fabric.util.toFixed, parseUnit = fabric.util.parseUnit, multiplyTransformMatrices = fabric.util.multiplyTransformMatrices, attributesMap = {
        cx: "left",
        x: "left",
        r: "radius",
        cy: "top",
        y: "top",
        display: "visible",
        visibility: "visible",
        transform: "transformMatrix",
        "fill-opacity": "fillOpacity",
        "fill-rule": "fillRule",
        "font-family": "fontFamily",
        "font-size": "fontSize",
        "font-style": "fontStyle",
        "font-weight": "fontWeight",
        "stroke-dasharray": "strokeDashArray",
        "stroke-linecap": "strokeLineCap",
        "stroke-linejoin": "strokeLineJoin",
        "stroke-miterlimit": "strokeMiterLimit",
        "stroke-opacity": "strokeOpacity",
        "stroke-width": "strokeWidth",
        "text-decoration": "textDecoration",
        "text-anchor": "originX"
    }, colorAttributes = {
        stroke: "strokeOpacity",
        fill: "fillOpacity"
    };
    fabric.cssRules = {};
    fabric.gradientDefs = {};
    function normalizeAttr(attr) {
        if (attr in attributesMap) {
            return attributesMap[attr];
        }
        return attr;
    }
    function normalizeValue(attr, value, parentAttributes, fontSize) {
        var isArray = Object.prototype.toString.call(value) === "[object Array]", parsed;
        if ((attr === "fill" || attr === "stroke") && value === "none") {
            value = "";
        } else if (attr === "strokeDashArray") {
            value = value.replace(/,/g, " ").split(/\s+/).map(function(n) {
                return parseFloat(n);
            });
        } else if (attr === "transformMatrix") {
            if (parentAttributes && parentAttributes.transformMatrix) {
                value = multiplyTransformMatrices(parentAttributes.transformMatrix, fabric.parseTransformAttribute(value));
            } else {
                value = fabric.parseTransformAttribute(value);
            }
        } else if (attr === "visible") {
            value = value === "none" || value === "hidden" ? false : true;
            if (parentAttributes && parentAttributes.visible === false) {
                value = false;
            }
        } else if (attr === "originX") {
            value = value === "start" ? "left" : value === "end" ? "right" : "center";
        } else {
            parsed = isArray ? value.map(parseUnit) : parseUnit(value, fontSize);
        }
        return !isArray && isNaN(parsed) ? value : parsed;
    }
    function _setStrokeFillOpacity(attributes) {
        for (var attr in colorAttributes) {
            if (!attributes[attr] || typeof attributes[colorAttributes[attr]] === "undefined") {
                continue;
            }
            if (attributes[attr].indexOf("url(") === 0) {
                continue;
            }
            var color = new fabric.Color(attributes[attr]);
            attributes[attr] = color.setAlpha(toFixed(color.getAlpha() * attributes[colorAttributes[attr]], 2)).toRgba();
        }
        return attributes;
    }
    fabric.parseTransformAttribute = function() {
        function rotateMatrix(matrix, args) {
            var angle = args[0];
            matrix[0] = Math.cos(angle);
            matrix[1] = Math.sin(angle);
            matrix[2] = -Math.sin(angle);
            matrix[3] = Math.cos(angle);
        }
        function scaleMatrix(matrix, args) {
            var multiplierX = args[0], multiplierY = args.length === 2 ? args[1] : args[0];
            matrix[0] = multiplierX;
            matrix[3] = multiplierY;
        }
        function skewXMatrix(matrix, args) {
            matrix[2] = Math.tan(fabric.util.degreesToRadians(args[0]));
        }
        function skewYMatrix(matrix, args) {
            matrix[1] = Math.tan(fabric.util.degreesToRadians(args[0]));
        }
        function translateMatrix(matrix, args) {
            matrix[4] = args[0];
            if (args.length === 2) {
                matrix[5] = args[1];
            }
        }
        var iMatrix = [ 1, 0, 0, 1, 0, 0 ], number = fabric.reNum, commaWsp = "(?:\\s+,?\\s*|,\\s*)", skewX = "(?:(skewX)\\s*\\(\\s*(" + number + ")\\s*\\))", skewY = "(?:(skewY)\\s*\\(\\s*(" + number + ")\\s*\\))", rotate = "(?:(rotate)\\s*\\(\\s*(" + number + ")(?:" + commaWsp + "(" + number + ")" + commaWsp + "(" + number + "))?\\s*\\))", scale = "(?:(scale)\\s*\\(\\s*(" + number + ")(?:" + commaWsp + "(" + number + "))?\\s*\\))", translate = "(?:(translate)\\s*\\(\\s*(" + number + ")(?:" + commaWsp + "(" + number + "))?\\s*\\))", matrix = "(?:(matrix)\\s*\\(\\s*" + "(" + number + ")" + commaWsp + "(" + number + ")" + commaWsp + "(" + number + ")" + commaWsp + "(" + number + ")" + commaWsp + "(" + number + ")" + commaWsp + "(" + number + ")" + "\\s*\\))", transform = "(?:" + matrix + "|" + translate + "|" + scale + "|" + rotate + "|" + skewX + "|" + skewY + ")", transforms = "(?:" + transform + "(?:" + commaWsp + transform + ")*" + ")", transformList = "^\\s*(?:" + transforms + "?)\\s*$", reTransformList = new RegExp(transformList), reTransform = new RegExp(transform, "g");
        return function(attributeValue) {
            var matrix = iMatrix.concat(), matrices = [];
            if (!attributeValue || attributeValue && !reTransformList.test(attributeValue)) {
                return matrix;
            }
            attributeValue.replace(reTransform, function(match) {
                var m = new RegExp(transform).exec(match).filter(function(match) {
                    return match !== "" && match != null;
                }), operation = m[1], args = m.slice(2).map(parseFloat);
                switch (operation) {
                  case "translate":
                    translateMatrix(matrix, args);
                    break;

                  case "rotate":
                    args[0] = fabric.util.degreesToRadians(args[0]);
                    rotateMatrix(matrix, args);
                    break;

                  case "scale":
                    scaleMatrix(matrix, args);
                    break;

                  case "skewX":
                    skewXMatrix(matrix, args);
                    break;

                  case "skewY":
                    skewYMatrix(matrix, args);
                    break;

                  case "matrix":
                    matrix = args;
                    break;
                }
                matrices.push(matrix.concat());
                matrix = iMatrix.concat();
            });
            var combinedMatrix = matrices[0];
            while (matrices.length > 1) {
                matrices.shift();
                combinedMatrix = fabric.util.multiplyTransformMatrices(combinedMatrix, matrices[0]);
            }
            return combinedMatrix;
        };
    }();
    function parseStyleString(style, oStyle) {
        var attr, value;
        style.replace(/;$/, "").split(";").forEach(function(chunk) {
            var pair = chunk.split(":");
            attr = normalizeAttr(pair[0].trim().toLowerCase());
            value = normalizeValue(attr, pair[1].trim());
            oStyle[attr] = value;
        });
    }
    function parseStyleObject(style, oStyle) {
        var attr, value;
        for (var prop in style) {
            if (typeof style[prop] === "undefined") {
                continue;
            }
            attr = normalizeAttr(prop.toLowerCase());
            value = normalizeValue(attr, style[prop]);
            oStyle[attr] = value;
        }
    }
    function getGlobalStylesForElement(element, svgUid) {
        var styles = {};
        for (var rule in fabric.cssRules[svgUid]) {
            if (elementMatchesRule(element, rule.split(" "))) {
                for (var property in fabric.cssRules[svgUid][rule]) {
                    styles[property] = fabric.cssRules[svgUid][rule][property];
                }
            }
        }
        return styles;
    }
    function elementMatchesRule(element, selectors) {
        var firstMatching, parentMatching = true;
        firstMatching = selectorMatches(element, selectors.pop());
        if (firstMatching && selectors.length) {
            parentMatching = doesSomeParentMatch(element, selectors);
        }
        return firstMatching && parentMatching && selectors.length === 0;
    }
    function doesSomeParentMatch(element, selectors) {
        var selector, parentMatching = true;
        while (element.parentNode && element.parentNode.nodeType === 1 && selectors.length) {
            if (parentMatching) {
                selector = selectors.pop();
            }
            element = element.parentNode;
            parentMatching = selectorMatches(element, selector);
        }
        return selectors.length === 0;
    }
    function selectorMatches(element, selector) {
        var nodeName = element.nodeName, classNames = element.getAttribute("class"), id = element.getAttribute("id"), matcher;
        matcher = new RegExp("^" + nodeName, "i");
        selector = selector.replace(matcher, "");
        if (id && selector.length) {
            matcher = new RegExp("#" + id + "(?![a-zA-Z\\-]+)", "i");
            selector = selector.replace(matcher, "");
        }
        if (classNames && selector.length) {
            classNames = classNames.split(" ");
            for (var i = classNames.length; i--; ) {
                matcher = new RegExp("\\." + classNames[i] + "(?![a-zA-Z\\-]+)", "i");
                selector = selector.replace(matcher, "");
            }
        }
        return selector.length === 0;
    }
    function parseUseDirectives(doc) {
        var nodelist = doc.getElementsByTagName("use");
        while (nodelist.length) {
            var el = nodelist[0], xlink = el.getAttribute("xlink:href").substr(1), x = el.getAttribute("x") || 0, y = el.getAttribute("y") || 0, el2 = doc.getElementById(xlink).cloneNode(true), currentTrans = (el2.getAttribute("transform") || "") + " translate(" + x + ", " + y + ")", parentNode;
            for (var j = 0, attrs = el.attributes, l = attrs.length; j < l; j++) {
                var attr = attrs.item(j);
                if (attr.nodeName === "x" || attr.nodeName === "y" || attr.nodeName === "xlink:href") {
                    continue;
                }
                if (attr.nodeName === "transform") {
                    currentTrans = attr.nodeValue + " " + currentTrans;
                } else {
                    el2.setAttribute(attr.nodeName, attr.nodeValue);
                }
            }
            el2.setAttribute("transform", currentTrans);
            el2.setAttribute("instantiated_by_use", "1");
            el2.removeAttribute("id");
            parentNode = el.parentNode;
            parentNode.replaceChild(el2, el);
        }
    }
    function addVBTransform(element, widthAttr, heightAttr) {
        var reViewBoxAttrValue = new RegExp("^" + "\\s*(" + fabric.reNum + "+)\\s*,?" + "\\s*(" + fabric.reNum + "+)\\s*,?" + "\\s*(" + fabric.reNum + "+)\\s*,?" + "\\s*(" + fabric.reNum + "+)\\s*" + "$"), viewBoxAttr = element.getAttribute("viewBox"), scaleX = 1, scaleY = 1, minX = 0, minY = 0, viewBoxWidth, viewBoxHeight, matrix, el;
        if (viewBoxAttr && (viewBoxAttr = viewBoxAttr.match(reViewBoxAttrValue))) {
            minX = -parseFloat(viewBoxAttr[1]), minY = -parseFloat(viewBoxAttr[2]), viewBoxWidth = parseFloat(viewBoxAttr[3]),
            viewBoxHeight = parseFloat(viewBoxAttr[4]);
        } else {
            return;
        }
        if (widthAttr && widthAttr !== viewBoxWidth) {
            scaleX = widthAttr / viewBoxWidth;
        }
        if (heightAttr && heightAttr !== viewBoxHeight) {
            scaleY = heightAttr / viewBoxHeight;
        }
        scaleY = scaleX = scaleX > scaleY ? scaleY : scaleX;
        if (!(scaleX !== 1 || scaleY !== 1 || minX !== 0 || minY !== 0)) {
            return;
        }
        matrix = "matrix(" + scaleX + " 0" + " 0 " + scaleY + " " + minX * scaleX + " " + minY * scaleY + ")";
        if (element.tagName === "svg") {
            el = element.ownerDocument.createElement("g");
            while (element.firstChild != null) {
                el.appendChild(element.firstChild);
            }
            element.appendChild(el);
        } else {
            el = element;
            matrix += el.getAttribute("transform");
        }
        el.setAttribute("transform", matrix);
    }
    fabric.parseSVGDocument = function() {
        var reAllowedSVGTagNames = /^(path|circle|polygon|polyline|ellipse|rect|line|image|text)$/, reViewBoxTagNames = /^(symbol|image|marker|pattern|view)$/;
        function hasAncestorWithNodeName(element, nodeName) {
            while (element && (element = element.parentNode)) {
                if (nodeName.test(element.nodeName) && !element.getAttribute("instantiated_by_use")) {
                    return true;
                }
            }
            return false;
        }
        return function(doc, callback, reviver) {
            if (!doc) {
                return;
            }
            parseUseDirectives(doc);
            var startTime = new Date(), svgUid = fabric.Object.__uid++, widthAttr = parseUnit(doc.getAttribute("width") || "100%"), heightAttr = parseUnit(doc.getAttribute("height") || "100%");
            addVBTransform(doc, widthAttr, heightAttr);
            var descendants = fabric.util.toArray(doc.getElementsByTagName("*"));
            var elements = descendants.filter(function(el) {
                reViewBoxTagNames.test(el.tagName) && addVBTransform(el, 0, 0);
                return reAllowedSVGTagNames.test(el.tagName) && !hasAncestorWithNodeName(el, /^(?:pattern|defs|symbol)$/);
            });
            if (!elements || elements && !elements.length) {
                callback && callback([], {});
                return;
            }
            var options = {
                width: widthAttr,
                height: heightAttr,
                widthAttr: widthAttr,
                heightAttr: heightAttr,
                svgUid: svgUid
            };
            fabric.gradientDefs[svgUid] = fabric.getGradientDefs(doc);
            fabric.cssRules[svgUid] = fabric.getCSSRules(doc);
            fabric.parseElements(elements, function(instances) {
                fabric.documentParsingTime = new Date() - startTime;
                if (callback) {
                    callback(instances, options);
                }
            }, clone(options), reviver);
        };
    }();
    var svgCache = {
        has: function(name, callback) {
            callback(false);
        },
        get: function() {},
        set: function() {}
    };
    function _enlivenCachedObject(cachedObject) {
        var objects = cachedObject.objects, options = cachedObject.options;
        objects = objects.map(function(o) {
            return fabric[capitalize(o.type)].fromObject(o);
        });
        return {
            objects: objects,
            options: options
        };
    }
    function _createSVGPattern(markup, canvas, property) {
        if (canvas[property] && canvas[property].toSVG) {
            markup.push('<pattern x="0" y="0" id="', property, 'Pattern" ', 'width="', canvas[property].source.width, '" height="', canvas[property].source.height, '" patternUnits="userSpaceOnUse">', '<image x="0" y="0" ', 'width="', canvas[property].source.width, '" height="', canvas[property].source.height, '" xlink:href="', canvas[property].source.src, '"></image></pattern>');
        }
    }
    extend(fabric, {
        parseFontDeclaration: function(value, oStyle) {
            var fontDeclaration = "(normal|italic)?\\s*(normal|small-caps)?\\s*" + "(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)?\\s*(" + fabric.reNum + "(?:px|cm|mm|em|pt|pc|in)*)(?:\\/(normal|" + fabric.reNum + "))?\\s+(.*)", match = value.match(fontDeclaration);
            if (!match) {
                return;
            }
            var fontStyle = match[1], fontWeight = match[3], fontSize = match[4], lineHeight = match[5], fontFamily = match[6];
            if (fontStyle) {
                oStyle.fontStyle = fontStyle;
            }
            if (fontWeight) {
                oStyle.fontWeight = isNaN(parseFloat(fontWeight)) ? fontWeight : parseFloat(fontWeight);
            }
            if (fontSize) {
                oStyle.fontSize = parseUnit(fontSize);
            }
            if (fontFamily) {
                oStyle.fontFamily = fontFamily;
            }
            if (lineHeight) {
                oStyle.lineHeight = lineHeight === "normal" ? 1 : lineHeight;
            }
        },
        getGradientDefs: function(doc) {
            var linearGradientEls = doc.getElementsByTagName("linearGradient"), radialGradientEls = doc.getElementsByTagName("radialGradient"), el, i, j = 0, id, xlink, elList = [], gradientDefs = {}, idsToXlinkMap = {};
            elList.length = linearGradientEls.length + radialGradientEls.length;
            i = linearGradientEls.length;
            while (i--) {
                elList[j++] = linearGradientEls[i];
            }
            i = radialGradientEls.length;
            while (i--) {
                elList[j++] = radialGradientEls[i];
            }
            while (j--) {
                el = elList[j];
                xlink = el.getAttribute("xlink:href");
                id = el.getAttribute("id");
                if (xlink) {
                    idsToXlinkMap[id] = xlink.substr(1);
                }
                gradientDefs[id] = el;
            }
            for (id in idsToXlinkMap) {
                var el2 = gradientDefs[idsToXlinkMap[id]].cloneNode(true);
                el = gradientDefs[id];
                while (el2.firstChild) {
                    el.appendChild(el2.firstChild);
                }
            }
            return gradientDefs;
        },
        parseAttributes: function(element, attributes, svgUid) {
            if (!element) {
                return;
            }
            var value, parentAttributes = {}, fontSize;
            if (typeof svgUid === "undefined") {
                svgUid = element.getAttribute("svgUid");
            }
            if (element.parentNode && /^symbol|[g|a]$/i.test(element.parentNode.nodeName)) {
                parentAttributes = fabric.parseAttributes(element.parentNode, attributes, svgUid);
            }
            fontSize = parentAttributes && parentAttributes.fontSize || element.getAttribute("font-size") || fabric.Text.DEFAULT_SVG_FONT_SIZE;
            var ownAttributes = attributes.reduce(function(memo, attr) {
                value = element.getAttribute(attr);
                if (value) {
                    attr = normalizeAttr(attr);
                    value = normalizeValue(attr, value, parentAttributes, fontSize);
                    memo[attr] = value;
                }
                return memo;
            }, {});
            ownAttributes = extend(ownAttributes, extend(getGlobalStylesForElement(element, svgUid), fabric.parseStyleAttribute(element)));
            if (ownAttributes.font) {
                fabric.parseFontDeclaration(ownAttributes.font, ownAttributes);
            }
            return _setStrokeFillOpacity(extend(parentAttributes, ownAttributes));
        },
        parseElements: function(elements, callback, options, reviver) {
            new fabric.ElementsParser(elements, callback, options, reviver).parse();
        },
        parseStyleAttribute: function(element) {
            var oStyle = {}, style = element.getAttribute("style");
            if (!style) {
                return oStyle;
            }
            if (typeof style === "string") {
                parseStyleString(style, oStyle);
            } else {
                parseStyleObject(style, oStyle);
            }
            return oStyle;
        },
        parsePointsAttribute: function(points) {
            if (!points) {
                return null;
            }
            points = points.replace(/,/g, " ").trim();
            points = points.split(/\s+/);
            var parsedPoints = [], i, len;
            i = 0;
            len = points.length;
            for (;i < len; i += 2) {
                parsedPoints.push({
                    x: parseFloat(points[i]),
                    y: parseFloat(points[i + 1])
                });
            }
            return parsedPoints;
        },
        getCSSRules: function(doc) {
            var styles = doc.getElementsByTagName("style"), allRules = {}, rules;
            for (var i = 0, len = styles.length; i < len; i++) {
                var styleContents = styles[i].textContent;
                styleContents = styleContents.replace(/\/\*[\s\S]*?\*\//g, "");
                if (styleContents.trim() === "") {
                    continue;
                }
                rules = styleContents.match(/[^{]*\{[\s\S]*?\}/g);
                rules = rules.map(function(rule) {
                    return rule.trim();
                });
                rules.forEach(function(rule) {
                    var match = rule.match(/([\s\S]*?)\s*\{([^}]*)\}/), ruleObj = {}, declaration = match[2].trim(), propertyValuePairs = declaration.replace(/;$/, "").split(/\s*;\s*/);
                    for (var i = 0, len = propertyValuePairs.length; i < len; i++) {
                        var pair = propertyValuePairs[i].split(/\s*:\s*/), property = normalizeAttr(pair[0]), value = normalizeValue(property, pair[1], pair[0]);
                        ruleObj[property] = value;
                    }
                    rule = match[1];
                    rule.split(",").forEach(function(_rule) {
                        _rule = _rule.replace(/^svg/i, "").trim();
                        if (_rule === "") {
                            return;
                        }
                        allRules[_rule] = fabric.util.object.clone(ruleObj);
                    });
                });
            }
            return allRules;
        },
        loadSVGFromURL: function(url, callback, reviver) {
            url = url.replace(/^\n\s*/, "").trim();
            svgCache.has(url, function(hasUrl) {
                if (hasUrl) {
                    svgCache.get(url, function(value) {
                        var enlivedRecord = _enlivenCachedObject(value);
                        callback(enlivedRecord.objects, enlivedRecord.options);
                    });
                } else {
                    new fabric.util.request(url, {
                        method: "get",
                        onComplete: onComplete
                    });
                }
            });
            function onComplete(r) {
                var xml = r.responseXML;
                if (xml && !xml.documentElement && fabric.window.ActiveXObject && r.responseText) {
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = "false";
                    xml.loadXML(r.responseText.replace(/<!DOCTYPE[\s\S]*?(\[[\s\S]*\])*?>/i, ""));
                }
                if (!xml || !xml.documentElement) {
                    return;
                }
                fabric.parseSVGDocument(xml.documentElement, function(results, options) {
                    svgCache.set(url, {
                        objects: fabric.util.array.invoke(results, "toObject"),
                        options: options
                    });
                    callback(results, options);
                }, reviver);
            }
        },
        loadSVGFromString: function(string, callback, reviver) {
            string = string.trim();
            var doc;
            if (typeof DOMParser !== "undefined") {
                var parser = new DOMParser();
                if (parser && parser.parseFromString) {
                    doc = parser.parseFromString(string, "text/xml");
                }
            } else if (fabric.window.ActiveXObject) {
                doc = new ActiveXObject("Microsoft.XMLDOM");
                doc.async = "false";
                doc.loadXML(string.replace(/<!DOCTYPE[\s\S]*?(\[[\s\S]*\])*?>/i, ""));
            }
            fabric.parseSVGDocument(doc.documentElement, function(results, options) {
                callback(results, options);
            }, reviver);
        },
        createSVGFontFacesMarkup: function(objects) {
            var markup = "";
            for (var i = 0, len = objects.length; i < len; i++) {
                if (objects[i].type !== "text" || !objects[i].path) {
                    continue;
                }
                markup += [ "@font-face {", "font-family: ", objects[i].fontFamily, "; ", "src: url('", objects[i].path, "')", "}" ].join("");
            }
            if (markup) {
                markup = [ '<style type="text/css">', "<![CDATA[", markup, "]]>", "</style>" ].join("");
            }
            return markup;
        },
        createSVGRefElementsMarkup: function(canvas) {
            var markup = [];
            _createSVGPattern(markup, canvas, "backgroundColor");
            _createSVGPattern(markup, canvas, "overlayColor");
            return markup.join("");
        }
    });
})(typeof exports !== "undefined" ? exports : this);

fabric.ElementsParser = function(elements, callback, options, reviver) {
    this.elements = elements;
    this.callback = callback;
    this.options = options;
    this.reviver = reviver;
    this.svgUid = options && options.svgUid || 0;
};

fabric.ElementsParser.prototype.parse = function() {
    this.instances = new Array(this.elements.length);
    this.numElements = this.elements.length;
    this.createObjects();
};

fabric.ElementsParser.prototype.createObjects = function() {
    for (var i = 0, len = this.elements.length; i < len; i++) {
        this.elements[i].setAttribute("svgUid", this.svgUid);
        (function(_this, i) {
            setTimeout(function() {
                _this.createObject(_this.elements[i], i);
            }, 0);
        })(this, i);
    }
};

fabric.ElementsParser.prototype.createObject = function(el, index) {
    var klass = fabric[fabric.util.string.capitalize(el.tagName)];
    if (klass && klass.fromElement) {
        try {
            this._createObject(klass, el, index);
        } catch (err) {
            fabric.log(err);
        }
    } else {
        this.checkIfDone();
    }
};

fabric.ElementsParser.prototype._createObject = function(klass, el, index) {
    if (klass.async) {
        klass.fromElement(el, this.createCallback(index, el), this.options);
    } else {
        var obj = klass.fromElement(el, this.options);
        this.resolveGradient(obj, "fill");
        this.resolveGradient(obj, "stroke");
        this.reviver && this.reviver(el, obj);
        this.instances[index] = obj;
        this.checkIfDone();
    }
};

fabric.ElementsParser.prototype.createCallback = function(index, el) {
    var _this = this;
    return function(obj) {
        _this.resolveGradient(obj, "fill");
        _this.resolveGradient(obj, "stroke");
        _this.reviver && _this.reviver(el, obj);
        _this.instances[index] = obj;
        _this.checkIfDone();
    };
};

fabric.ElementsParser.prototype.resolveGradient = function(obj, property) {
    var instanceFillValue = obj.get(property);
    if (!/^url\(/.test(instanceFillValue)) {
        return;
    }
    var gradientId = instanceFillValue.slice(5, instanceFillValue.length - 1);
    if (fabric.gradientDefs[this.svgUid][gradientId]) {
        obj.set(property, fabric.Gradient.fromElement(fabric.gradientDefs[this.svgUid][gradientId], obj));
    }
};

fabric.ElementsParser.prototype.checkIfDone = function() {
    if (--this.numElements === 0) {
        this.instances = this.instances.filter(function(el) {
            return el != null;
        });
        this.callback(this.instances);
    }
};

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Point) {
        fabric.warn("fabric.Point is already defined");
        return;
    }
    fabric.Point = Point;
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype = {
        constructor: Point,
        add: function(that) {
            return new Point(this.x + that.x, this.y + that.y);
        },
        addEquals: function(that) {
            this.x += that.x;
            this.y += that.y;
            return this;
        },
        scalarAdd: function(scalar) {
            return new Point(this.x + scalar, this.y + scalar);
        },
        scalarAddEquals: function(scalar) {
            this.x += scalar;
            this.y += scalar;
            return this;
        },
        subtract: function(that) {
            return new Point(this.x - that.x, this.y - that.y);
        },
        subtractEquals: function(that) {
            this.x -= that.x;
            this.y -= that.y;
            return this;
        },
        scalarSubtract: function(scalar) {
            return new Point(this.x - scalar, this.y - scalar);
        },
        scalarSubtractEquals: function(scalar) {
            this.x -= scalar;
            this.y -= scalar;
            return this;
        },
        multiply: function(scalar) {
            return new Point(this.x * scalar, this.y * scalar);
        },
        multiplyEquals: function(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        },
        divide: function(scalar) {
            return new Point(this.x / scalar, this.y / scalar);
        },
        divideEquals: function(scalar) {
            this.x /= scalar;
            this.y /= scalar;
            return this;
        },
        eq: function(that) {
            return this.x === that.x && this.y === that.y;
        },
        lt: function(that) {
            return this.x < that.x && this.y < that.y;
        },
        lte: function(that) {
            return this.x <= that.x && this.y <= that.y;
        },
        gt: function(that) {
            return this.x > that.x && this.y > that.y;
        },
        gte: function(that) {
            return this.x >= that.x && this.y >= that.y;
        },
        lerp: function(that, t) {
            return new Point(this.x + (that.x - this.x) * t, this.y + (that.y - this.y) * t);
        },
        distanceFrom: function(that) {
            var dx = this.x - that.x, dy = this.y - that.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        midPointFrom: function(that) {
            return new Point(this.x + (that.x - this.x) / 2, this.y + (that.y - this.y) / 2);
        },
        min: function(that) {
            return new Point(Math.min(this.x, that.x), Math.min(this.y, that.y));
        },
        max: function(that) {
            return new Point(Math.max(this.x, that.x), Math.max(this.y, that.y));
        },
        toString: function() {
            return this.x + "," + this.y;
        },
        setXY: function(x, y) {
            this.x = x;
            this.y = y;
        },
        setFromPoint: function(that) {
            this.x = that.x;
            this.y = that.y;
        },
        swap: function(that) {
            var x = this.x, y = this.y;
            this.x = that.x;
            this.y = that.y;
            that.x = x;
            that.y = y;
        }
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Intersection) {
        fabric.warn("fabric.Intersection is already defined");
        return;
    }
    function Intersection(status) {
        this.status = status;
        this.points = [];
    }
    fabric.Intersection = Intersection;
    fabric.Intersection.prototype = {
        appendPoint: function(point) {
            this.points.push(point);
        },
        appendPoints: function(points) {
            this.points = this.points.concat(points);
        }
    };
    fabric.Intersection.intersectLineLine = function(a1, a2, b1, b2) {
        var result, uaT = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x), ubT = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x), uB = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        if (uB !== 0) {
            var ua = uaT / uB, ub = ubT / uB;
            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                result = new Intersection("Intersection");
                result.points.push(new fabric.Point(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
            } else {
                result = new Intersection();
            }
        } else {
            if (uaT === 0 || ubT === 0) {
                result = new Intersection("Coincident");
            } else {
                result = new Intersection("Parallel");
            }
        }
        return result;
    };
    fabric.Intersection.intersectLinePolygon = function(a1, a2, points) {
        var result = new Intersection(), length = points.length;
        for (var i = 0; i < length; i++) {
            var b1 = points[i], b2 = points[(i + 1) % length], inter = Intersection.intersectLineLine(a1, a2, b1, b2);
            result.appendPoints(inter.points);
        }
        if (result.points.length > 0) {
            result.status = "Intersection";
        }
        return result;
    };
    fabric.Intersection.intersectPolygonPolygon = function(points1, points2) {
        var result = new Intersection(), length = points1.length;
        for (var i = 0; i < length; i++) {
            var a1 = points1[i], a2 = points1[(i + 1) % length], inter = Intersection.intersectLinePolygon(a1, a2, points2);
            result.appendPoints(inter.points);
        }
        if (result.points.length > 0) {
            result.status = "Intersection";
        }
        return result;
    };
    fabric.Intersection.intersectPolygonRectangle = function(points, r1, r2) {
        var min = r1.min(r2), max = r1.max(r2), topRight = new fabric.Point(max.x, min.y), bottomLeft = new fabric.Point(min.x, max.y), inter1 = Intersection.intersectLinePolygon(min, topRight, points), inter2 = Intersection.intersectLinePolygon(topRight, max, points), inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points), inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points), result = new Intersection();
        result.appendPoints(inter1.points);
        result.appendPoints(inter2.points);
        result.appendPoints(inter3.points);
        result.appendPoints(inter4.points);
        if (result.points.length > 0) {
            result.status = "Intersection";
        }
        return result;
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Color) {
        fabric.warn("fabric.Color is already defined.");
        return;
    }
    function Color(color) {
        if (!color) {
            this.setSource([ 0, 0, 0, 1 ]);
        } else {
            this._tryParsingColor(color);
        }
    }
    fabric.Color = Color;
    fabric.Color.prototype = {
        _tryParsingColor: function(color) {
            var source;
            if (color in Color.colorNameMap) {
                color = Color.colorNameMap[color];
            }
            if (color === "transparent") {
                this.setSource([ 255, 255, 255, 0 ]);
                return;
            }
            source = Color.sourceFromHex(color);
            if (!source) {
                source = Color.sourceFromRgb(color);
            }
            if (!source) {
                source = Color.sourceFromHsl(color);
            }
            if (source) {
                this.setSource(source);
            }
        },
        _rgbToHsl: function(r, g, b) {
            r /= 255, g /= 255, b /= 255;
            var h, s, l, max = fabric.util.array.max([ r, g, b ]), min = fabric.util.array.min([ r, g, b ]);
            l = (max + min) / 2;
            if (max === min) {
                h = s = 0;
            } else {
                var d = max - min;
                s = l > .5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                  case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;

                  case g:
                    h = (b - r) / d + 2;
                    break;

                  case b:
                    h = (r - g) / d + 4;
                    break;
                }
                h /= 6;
            }
            return [ Math.round(h * 360), Math.round(s * 100), Math.round(l * 100) ];
        },
        getSource: function() {
            return this._source;
        },
        setSource: function(source) {
            this._source = source;
        },
        toRgb: function() {
            var source = this.getSource();
            return "rgb(" + source[0] + "," + source[1] + "," + source[2] + ")";
        },
        toRgba: function() {
            var source = this.getSource();
            return "rgba(" + source[0] + "," + source[1] + "," + source[2] + "," + source[3] + ")";
        },
        toHsl: function() {
            var source = this.getSource(), hsl = this._rgbToHsl(source[0], source[1], source[2]);
            return "hsl(" + hsl[0] + "," + hsl[1] + "%," + hsl[2] + "%)";
        },
        toHsla: function() {
            var source = this.getSource(), hsl = this._rgbToHsl(source[0], source[1], source[2]);
            return "hsla(" + hsl[0] + "," + hsl[1] + "%," + hsl[2] + "%," + source[3] + ")";
        },
        toHex: function() {
            var source = this.getSource(), r, g, b;
            r = source[0].toString(16);
            r = r.length === 1 ? "0" + r : r;
            g = source[1].toString(16);
            g = g.length === 1 ? "0" + g : g;
            b = source[2].toString(16);
            b = b.length === 1 ? "0" + b : b;
            return r.toUpperCase() + g.toUpperCase() + b.toUpperCase();
        },
        getAlpha: function() {
            return this.getSource()[3];
        },
        setAlpha: function(alpha) {
            var source = this.getSource();
            source[3] = alpha;
            this.setSource(source);
            return this;
        },
        toGrayscale: function() {
            var source = this.getSource(), average = parseInt((source[0] * .3 + source[1] * .59 + source[2] * .11).toFixed(0), 10), currentAlpha = source[3];
            this.setSource([ average, average, average, currentAlpha ]);
            return this;
        },
        toBlackWhite: function(threshold) {
            var source = this.getSource(), average = (source[0] * .3 + source[1] * .59 + source[2] * .11).toFixed(0), currentAlpha = source[3];
            threshold = threshold || 127;
            average = Number(average) < Number(threshold) ? 0 : 255;
            this.setSource([ average, average, average, currentAlpha ]);
            return this;
        },
        overlayWith: function(otherColor) {
            if (!(otherColor instanceof Color)) {
                otherColor = new Color(otherColor);
            }
            var result = [], alpha = this.getAlpha(), otherAlpha = .5, source = this.getSource(), otherSource = otherColor.getSource();
            for (var i = 0; i < 3; i++) {
                result.push(Math.round(source[i] * (1 - otherAlpha) + otherSource[i] * otherAlpha));
            }
            result[3] = alpha;
            this.setSource(result);
            return this;
        }
    };
    fabric.Color.reRGBa = /^rgba?\(\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;
    fabric.Color.reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;
    fabric.Color.reHex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
    fabric.Color.colorNameMap = {
        aqua: "#00FFFF",
        black: "#000000",
        blue: "#0000FF",
        fuchsia: "#FF00FF",
        gray: "#808080",
        green: "#008000",
        lime: "#00FF00",
        maroon: "#800000",
        navy: "#000080",
        olive: "#808000",
        orange: "#FFA500",
        purple: "#800080",
        red: "#FF0000",
        silver: "#C0C0C0",
        teal: "#008080",
        white: "#FFFFFF",
        yellow: "#FFFF00"
    };
    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }
    fabric.Color.fromRgb = function(color) {
        return Color.fromSource(Color.sourceFromRgb(color));
    };
    fabric.Color.sourceFromRgb = function(color) {
        var match = color.match(Color.reRGBa);
        if (match) {
            var r = parseInt(match[1], 10) / (/%$/.test(match[1]) ? 100 : 1) * (/%$/.test(match[1]) ? 255 : 1), g = parseInt(match[2], 10) / (/%$/.test(match[2]) ? 100 : 1) * (/%$/.test(match[2]) ? 255 : 1), b = parseInt(match[3], 10) / (/%$/.test(match[3]) ? 100 : 1) * (/%$/.test(match[3]) ? 255 : 1);
            return [ parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), match[4] ? parseFloat(match[4]) : 1 ];
        }
    };
    fabric.Color.fromRgba = Color.fromRgb;
    fabric.Color.fromHsl = function(color) {
        return Color.fromSource(Color.sourceFromHsl(color));
    };
    fabric.Color.sourceFromHsl = function(color) {
        var match = color.match(Color.reHSLa);
        if (!match) {
            return;
        }
        var h = (parseFloat(match[1]) % 360 + 360) % 360 / 360, s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1), l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1), r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var q = l <= .5 ? l * (s + 1) : l + s - l * s, p = l * 2 - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), match[4] ? parseFloat(match[4]) : 1 ];
    };
    fabric.Color.fromHsla = Color.fromHsl;
    fabric.Color.fromHex = function(color) {
        return Color.fromSource(Color.sourceFromHex(color));
    };
    fabric.Color.sourceFromHex = function(color) {
        if (color.match(Color.reHex)) {
            var value = color.slice(color.indexOf("#") + 1), isShortNotation = value.length === 3, r = isShortNotation ? value.charAt(0) + value.charAt(0) : value.substring(0, 2), g = isShortNotation ? value.charAt(1) + value.charAt(1) : value.substring(2, 4), b = isShortNotation ? value.charAt(2) + value.charAt(2) : value.substring(4, 6);
            return [ parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), 1 ];
        }
    };
    fabric.Color.fromSource = function(source) {
        var oColor = new Color();
        oColor.setSource(source);
        return oColor;
    };
})(typeof exports !== "undefined" ? exports : this);

(function() {
    function getColorStop(el) {
        var style = el.getAttribute("style"), offset = el.getAttribute("offset"), color, colorAlpha, opacity;
        offset = parseFloat(offset) / (/%$/.test(offset) ? 100 : 1);
        offset = offset < 0 ? 0 : offset > 1 ? 1 : offset;
        if (style) {
            var keyValuePairs = style.split(/\s*;\s*/);
            if (keyValuePairs[keyValuePairs.length - 1] === "") {
                keyValuePairs.pop();
            }
            for (var i = keyValuePairs.length; i--; ) {
                var split = keyValuePairs[i].split(/\s*:\s*/), key = split[0].trim(), value = split[1].trim();
                if (key === "stop-color") {
                    color = value;
                } else if (key === "stop-opacity") {
                    opacity = value;
                }
            }
        }
        if (!color) {
            color = el.getAttribute("stop-color") || "rgb(0,0,0)";
        }
        if (!opacity) {
            opacity = el.getAttribute("stop-opacity");
        }
        color = new fabric.Color(color);
        colorAlpha = color.getAlpha();
        opacity = isNaN(parseFloat(opacity)) ? 1 : parseFloat(opacity);
        opacity *= colorAlpha;
        return {
            offset: offset,
            color: color.toRgb(),
            opacity: opacity
        };
    }
    function getLinearCoords(el) {
        return {
            x1: el.getAttribute("x1") || 0,
            y1: el.getAttribute("y1") || 0,
            x2: el.getAttribute("x2") || "100%",
            y2: el.getAttribute("y2") || 0
        };
    }
    function getRadialCoords(el) {
        return {
            x1: el.getAttribute("fx") || el.getAttribute("cx") || "50%",
            y1: el.getAttribute("fy") || el.getAttribute("cy") || "50%",
            r1: 0,
            x2: el.getAttribute("cx") || "50%",
            y2: el.getAttribute("cy") || "50%",
            r2: el.getAttribute("r") || "50%"
        };
    }
    fabric.Gradient = fabric.util.createClass({
        offsetX: 0,
        offsetY: 0,
        initialize: function(options) {
            options || (options = {});
            var coords = {};
            this.id = fabric.Object.__uid++;
            this.type = options.type || "linear";
            coords = {
                x1: options.coords.x1 || 0,
                y1: options.coords.y1 || 0,
                x2: options.coords.x2 || 0,
                y2: options.coords.y2 || 0
            };
            if (this.type === "radial") {
                coords.r1 = options.coords.r1 || 0;
                coords.r2 = options.coords.r2 || 0;
            }
            this.coords = coords;
            this.colorStops = options.colorStops.slice();
            if (options.gradientTransform) {
                this.gradientTransform = options.gradientTransform;
            }
            this.offsetX = options.offsetX || this.offsetX;
            this.offsetY = options.offsetY || this.offsetY;
        },
        addColorStop: function(colorStop) {
            for (var position in colorStop) {
                var color = new fabric.Color(colorStop[position]);
                this.colorStops.push({
                    offset: position,
                    color: color.toRgb(),
                    opacity: color.getAlpha()
                });
            }
            return this;
        },
        toObject: function() {
            return {
                type: this.type,
                coords: this.coords,
                colorStops: this.colorStops,
                offsetX: this.offsetX,
                offsetY: this.offsetY
            };
        },
        toLive: function(ctx, object) {
            var gradient, coords = fabric.util.object.clone(this.coords);
            if (!this.type) {
                return;
            }
            if (object.group && object.group.type === "path-group") {
                for (var prop in coords) {
                    if (prop === "x1" || prop === "x2") {
                        coords[prop] += -this.offsetX + object.width / 2;
                    } else if (prop === "y1" || prop === "y2") {
                        coords[prop] += -this.offsetY + object.height / 2;
                    }
                }
            }
            if (this.type === "linear") {
                gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);
            } else if (this.type === "radial") {
                gradient = ctx.createRadialGradient(coords.x1, coords.y1, coords.r1, coords.x2, coords.y2, coords.r2);
            }
            for (var i = 0, len = this.colorStops.length; i < len; i++) {
                var color = this.colorStops[i].color, opacity = this.colorStops[i].opacity, offset = this.colorStops[i].offset;
                if (typeof opacity !== "undefined") {
                    color = new fabric.Color(color).setAlpha(opacity).toRgba();
                }
                gradient.addColorStop(parseFloat(offset), color);
            }
            return gradient;
        }
    });
    fabric.util.object.extend(fabric.Gradient, {
        fromElement: function(el, instance) {
            var colorStopEls = el.getElementsByTagName("stop"), type = el.nodeName === "linearGradient" ? "linear" : "radial", gradientUnits = el.getAttribute("gradientUnits") || "objectBoundingBox", gradientTransform = el.getAttribute("gradientTransform"), colorStops = [], coords = {}, ellipseMatrix;
            if (type === "linear") {
                coords = getLinearCoords(el);
            } else if (type === "radial") {
                coords = getRadialCoords(el);
            }
            for (var i = colorStopEls.length; i--; ) {
                colorStops.push(getColorStop(colorStopEls[i]));
            }
            ellipseMatrix = _convertPercentUnitsToValues(instance, coords, gradientUnits);
            var gradient = new fabric.Gradient({
                type: type,
                coords: coords,
                colorStops: colorStops,
                offsetX: -instance.left,
                offsetY: -instance.top
            });
            if (gradientTransform || ellipseMatrix !== "") {
                gradient.gradientTransform = fabric.parseTransformAttribute((gradientTransform || "") + ellipseMatrix);
            }
            return gradient;
        },
        forObject: function(obj, options) {
            options || (options = {});
            _convertPercentUnitsToValues(obj, options.coords, "userSpaceOnUse");
            return new fabric.Gradient(options);
        }
    });
    function _convertPercentUnitsToValues(object, options, gradientUnits) {
        var propValue, addFactor = 0, multFactor = 1, ellipseMatrix = "";
        for (var prop in options) {
            propValue = parseFloat(options[prop], 10);
            if (typeof options[prop] === "string" && /^\d+%$/.test(options[prop])) {
                multFactor = .01;
            } else {
                multFactor = 1;
            }
            if (prop === "x1" || prop === "x2" || prop === "r2") {
                multFactor *= gradientUnits === "objectBoundingBox" ? object.width : 1;
                addFactor = gradientUnits === "objectBoundingBox" ? object.left || 0 : 0;
            } else if (prop === "y1" || prop === "y2") {
                multFactor *= gradientUnits === "objectBoundingBox" ? object.height : 1;
                addFactor = gradientUnits === "objectBoundingBox" ? object.top || 0 : 0;
            }
            options[prop] = propValue * multFactor + addFactor;
        }
        if (object.type === "ellipse" && options.r2 !== null && gradientUnits === "objectBoundingBox" && object.rx !== object.ry) {
            var scaleFactor = object.ry / object.rx;
            ellipseMatrix = " scale(1, " + scaleFactor + ")";
            if (options.y1) {
                options.y1 /= scaleFactor;
            }
            if (options.y2) {
                options.y2 /= scaleFactor;
            }
        }
        return ellipseMatrix;
    }
})();

fabric.Pattern = fabric.util.createClass({
    repeat: "repeat",
    offsetX: 0,
    offsetY: 0,
    initialize: function(options) {
        options || (options = {});
        this.id = fabric.Object.__uid++;
        if (options.source) {
            if (typeof options.source === "string") {
                if (typeof fabric.util.getFunctionBody(options.source) !== "undefined") {
                    this.source = new Function(fabric.util.getFunctionBody(options.source));
                } else {
                    var _this = this;
                    this.source = fabric.util.createImage();
                    fabric.util.loadImage(options.source, function(img) {
                        _this.source = img;
                    });
                }
            } else {
                this.source = options.source;
            }
        }
        if (options.repeat) {
            this.repeat = options.repeat;
        }
        if (options.offsetX) {
            this.offsetX = options.offsetX;
        }
        if (options.offsetY) {
            this.offsetY = options.offsetY;
        }
    },
    toObject: function() {
        var source;
        if (typeof this.source === "function") {
            source = String(this.source);
        } else if (typeof this.source.src === "string") {
            source = this.source.src;
        }
        return {
            source: source,
            repeat: this.repeat,
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
    },
    toLive: function(ctx) {
        var source = typeof this.source === "function" ? this.source() : this.source;
        if (!source) {
            return "";
        }
        if (typeof source.src !== "undefined") {
            if (!source.complete) {
                return "";
            }
            if (source.naturalWidth === 0 || source.naturalHeight === 0) {
                return "";
            }
        }
        return ctx.createPattern(source, this.repeat);
    }
});

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Shadow) {
        fabric.warn("fabric.Shadow is already defined.");
        return;
    }
    fabric.Shadow = fabric.util.createClass({
        color: "rgb(0,0,0)",
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        includeDefaultValues: true,
        initialize: function(options) {
            if (typeof options === "string") {
                options = this._parseShadow(options);
            }
            for (var prop in options) {
                this[prop] = options[prop];
            }
            this.id = fabric.Object.__uid++;
        },
        _parseShadow: function(shadow) {
            var shadowStr = shadow.trim(), offsetsAndBlur = fabric.Shadow.reOffsetsAndBlur.exec(shadowStr) || [], color = shadowStr.replace(fabric.Shadow.reOffsetsAndBlur, "") || "rgb(0,0,0)";
            return {
                color: color.trim(),
                offsetX: parseInt(offsetsAndBlur[1], 10) || 0,
                offsetY: parseInt(offsetsAndBlur[2], 10) || 0,
                blur: parseInt(offsetsAndBlur[3], 10) || 0
            };
        },
        toString: function() {
            return [ this.offsetX, this.offsetY, this.blur, this.color ].join("px ");
        },
        toObject: function() {
            if (this.includeDefaultValues) {
                return {
                    color: this.color,
                    blur: this.blur,
                    offsetX: this.offsetX,
                    offsetY: this.offsetY
                };
            }
            var obj = {}, proto = fabric.Shadow.prototype;
            if (this.color !== proto.color) {
                obj.color = this.color;
            }
            if (this.blur !== proto.blur) {
                obj.blur = this.blur;
            }
            if (this.offsetX !== proto.offsetX) {
                obj.offsetX = this.offsetX;
            }
            if (this.offsetY !== proto.offsetY) {
                obj.offsetY = this.offsetY;
            }
            return obj;
        }
    });
    fabric.Shadow.reOffsetsAndBlur = /(?:\s|^)(-?\d+(?:px)?(?:\s?|$))?(-?\d+(?:px)?(?:\s?|$))?(\d+(?:px)?)?(?:\s?|$)(?:$|\s)/;
})(typeof exports !== "undefined" ? exports : this);

(function() {
    "use strict";
    if (fabric.StaticCanvas) {
        fabric.warn("fabric.StaticCanvas is already defined.");
        return;
    }
    var extend = fabric.util.object.extend, getElementOffset = fabric.util.getElementOffset, removeFromArray = fabric.util.removeFromArray, CANVAS_INIT_ERROR = new Error("Could not initialize `canvas` element");
    fabric.StaticCanvas = fabric.util.createClass({
        initialize: function(el, options) {
            options || (options = {});
            this._initStatic(el, options);
            fabric.StaticCanvas.activeInstance = this;
        },
        backgroundColor: "",
        backgroundImage: null,
        overlayColor: "",
        overlayImage: null,
        includeDefaultValues: true,
        stateful: true,
        renderOnAddRemove: true,
        clipTo: null,
        controlsAboveOverlay: false,
        allowTouchScrolling: false,
        imageSmoothingEnabled: true,
        preserveObjectStacking: false,
        viewportTransform: [ 1, 0, 0, 1, 0, 0 ],
        onBeforeScaleRotate: function() {},
        _initStatic: function(el, options) {
            this._objects = [];
            this._createLowerCanvas(el);
            this._initOptions(options);
            this._setImageSmoothing();
            if (options.overlayImage) {
                this.setOverlayImage(options.overlayImage, this.renderAll.bind(this));
            }
            if (options.backgroundImage) {
                this.setBackgroundImage(options.backgroundImage, this.renderAll.bind(this));
            }
            if (options.backgroundColor) {
                this.setBackgroundColor(options.backgroundColor, this.renderAll.bind(this));
            }
            if (options.overlayColor) {
                this.setOverlayColor(options.overlayColor, this.renderAll.bind(this));
            }
            this.calcOffset();
        },
        calcOffset: function() {
            this._offset = getElementOffset(this.lowerCanvasEl);
            return this;
        },
        setOverlayImage: function(image, callback, options) {
            return this.__setBgOverlayImage("overlayImage", image, callback, options);
        },
        setBackgroundImage: function(image, callback, options) {
            return this.__setBgOverlayImage("backgroundImage", image, callback, options);
        },
        setOverlayColor: function(overlayColor, callback) {
            return this.__setBgOverlayColor("overlayColor", overlayColor, callback);
        },
        setBackgroundColor: function(backgroundColor, callback) {
            return this.__setBgOverlayColor("backgroundColor", backgroundColor, callback);
        },
        _setImageSmoothing: function() {
            var ctx = this.getContext();
            ctx.imageSmoothingEnabled = this.imageSmoothingEnabled;
            ctx.webkitImageSmoothingEnabled = this.imageSmoothingEnabled;
            ctx.mozImageSmoothingEnabled = this.imageSmoothingEnabled;
            ctx.msImageSmoothingEnabled = this.imageSmoothingEnabled;
            ctx.oImageSmoothingEnabled = this.imageSmoothingEnabled;
        },
        __setBgOverlayImage: function(property, image, callback, options) {
            if (typeof image === "string") {
                fabric.util.loadImage(image, function(img) {
                    this[property] = new fabric.Image(img, options);
                    callback && callback();
                }, this, options && options.crossOrigin);
            } else {
                this[property] = image;
                callback && callback();
            }
            return this;
        },
        __setBgOverlayColor: function(property, color, callback) {
            if (color && color.source) {
                var _this = this;
                fabric.util.loadImage(color.source, function(img) {
                    _this[property] = new fabric.Pattern({
                        source: img,
                        repeat: color.repeat,
                        offsetX: color.offsetX,
                        offsetY: color.offsetY
                    });
                    callback && callback();
                });
            } else {
                this[property] = color;
                callback && callback();
            }
            return this;
        },
        _createCanvasElement: function() {
            var element = fabric.document.createElement("canvas");
            if (!element.style) {
                element.style = {};
            }
            if (!element) {
                throw CANVAS_INIT_ERROR;
            }
            this._initCanvasElement(element);
            return element;
        },
        _initCanvasElement: function(element) {
            fabric.util.createCanvasElement(element);
            if (typeof element.getContext === "undefined") {
                throw CANVAS_INIT_ERROR;
            }
        },
        _initOptions: function(options) {
            for (var prop in options) {
                this[prop] = options[prop];
            }
            this.width = this.width || parseInt(this.lowerCanvasEl.width, 10) || 0;
            this.height = this.height || parseInt(this.lowerCanvasEl.height, 10) || 0;
            if (!this.lowerCanvasEl.style) {
                return;
            }
            this.lowerCanvasEl.width = this.width;
            this.lowerCanvasEl.height = this.height;
            this.lowerCanvasEl.style.width = this.width + "px";
            this.lowerCanvasEl.style.height = this.height + "px";
            this.viewportTransform = this.viewportTransform.slice();
        },
        _createLowerCanvas: function(canvasEl) {
            this.lowerCanvasEl = fabric.util.getById(canvasEl) || this._createCanvasElement();
            this._initCanvasElement(this.lowerCanvasEl);
            fabric.util.addClass(this.lowerCanvasEl, "lower-canvas");
            if (this.interactive) {
                this._applyCanvasStyle(this.lowerCanvasEl);
            }
            this.contextContainer = this.lowerCanvasEl.getContext("2d");
        },
        getWidth: function() {
            return this.width;
        },
        getHeight: function() {
            return this.height;
        },
        setWidth: function(value, options) {
            return this.setDimensions({
                width: value
            }, options);
        },
        setHeight: function(value, options) {
            return this.setDimensions({
                height: value
            }, options);
        },
        setDimensions: function(dimensions, options) {
            var cssValue;
            options = options || {};
            for (var prop in dimensions) {
                cssValue = dimensions[prop];
                if (!options.cssOnly) {
                    this._setBackstoreDimension(prop, dimensions[prop]);
                    cssValue += "px";
                }
                if (!options.backstoreOnly) {
                    this._setCssDimension(prop, cssValue);
                }
            }
            if (!options.cssOnly) {
                this.renderAll();
            }
            this.calcOffset();
            return this;
        },
        _setBackstoreDimension: function(prop, value) {
            this.lowerCanvasEl[prop] = value;
            if (this.upperCanvasEl) {
                this.upperCanvasEl[prop] = value;
            }
            if (this.cacheCanvasEl) {
                this.cacheCanvasEl[prop] = value;
            }
            this[prop] = value;
            return this;
        },
        _setCssDimension: function(prop, value) {
            this.lowerCanvasEl.style[prop] = value;
            if (this.upperCanvasEl) {
                this.upperCanvasEl.style[prop] = value;
            }
            if (this.wrapperEl) {
                this.wrapperEl.style[prop] = value;
            }
            return this;
        },
        getZoom: function() {
            return Math.sqrt(this.viewportTransform[0] * this.viewportTransform[3]);
        },
        setViewportTransform: function(vpt) {
            this.viewportTransform = vpt;
            this.renderAll();
            for (var i = 0, len = this._objects.length; i < len; i++) {
                this._objects[i].setCoords();
            }
            return this;
        },
        zoomToPoint: function(point, value) {
            var before = point;
            point = fabric.util.transformPoint(point, fabric.util.invertTransform(this.viewportTransform));
            this.viewportTransform[0] = value;
            this.viewportTransform[3] = value;
            var after = fabric.util.transformPoint(point, this.viewportTransform);
            this.viewportTransform[4] += before.x - after.x;
            this.viewportTransform[5] += before.y - after.y;
            this.renderAll();
            for (var i = 0, len = this._objects.length; i < len; i++) {
                this._objects[i].setCoords();
            }
            return this;
        },
        setZoom: function(value) {
            this.zoomToPoint(new fabric.Point(0, 0), value);
            return this;
        },
        absolutePan: function(point) {
            this.viewportTransform[4] = -point.x;
            this.viewportTransform[5] = -point.y;
            this.renderAll();
            for (var i = 0, len = this._objects.length; i < len; i++) {
                this._objects[i].setCoords();
            }
            return this;
        },
        relativePan: function(point) {
            return this.absolutePan(new fabric.Point(-point.x - this.viewportTransform[4], -point.y - this.viewportTransform[5]));
        },
        getElement: function() {
            return this.lowerCanvasEl;
        },
        getActiveObject: function() {
            return null;
        },
        getActiveGroup: function() {
            return null;
        },
        _draw: function(ctx, object) {
            if (!object) {
                return;
            }
            ctx.save();
            var v = this.viewportTransform;
            ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
            if (this._shouldRenderObject(object)) {
                object.render(ctx);
            }
            ctx.restore();
            if (!this.controlsAboveOverlay) {
                object._renderControls(ctx);
            }
        },
        _shouldRenderObject: function(object) {
            if (!object) {
                return false;
            }
            return object !== this.getActiveGroup() || !this.preserveObjectStacking;
        },
        _onObjectAdded: function(obj) {
            this.stateful && obj.setupState();
            obj.canvas = this;
            obj.setCoords();
            this.fire("object:added", {
                target: obj
            });
            obj.fire("added");
        },
        _onObjectRemoved: function(obj) {
            if (this.getActiveObject() === obj) {
                this.fire("before:selection:cleared", {
                    target: obj
                });
                this._discardActiveObject();
                this.fire("selection:cleared");
            }
            this.fire("object:removed", {
                target: obj
            });
            obj.fire("removed");
        },
        clearContext: function(ctx) {
            ctx.clearRect(0, 0, this.width, this.height);
            return this;
        },
        getContext: function() {
            return this.contextContainer;
        },
        clear: function() {
            this._objects.length = 0;
            if (this.discardActiveGroup) {
                this.discardActiveGroup();
            }
            if (this.discardActiveObject) {
                this.discardActiveObject();
            }
            this.clearContext(this.contextContainer);
            if (this.contextTop) {
                this.clearContext(this.contextTop);
            }
            this.fire("canvas:cleared");
            this.renderAll();
            return this;
        },
        renderAll: function(allOnTop) {
            var canvasToDrawOn = this[allOnTop === true && this.interactive ? "contextTop" : "contextContainer"], activeGroup = this.getActiveGroup();
            if (this.contextTop && this.selection && !this._groupSelector) {
                this.clearContext(this.contextTop);
            }
            if (!allOnTop) {
                this.clearContext(canvasToDrawOn);
            }
            this.fire("before:render");
            if (this.clipTo) {
                fabric.util.clipContext(this, canvasToDrawOn);
            }
            this._renderBackground(canvasToDrawOn);
            this._renderObjects(canvasToDrawOn, activeGroup);
            this._renderActiveGroup(canvasToDrawOn, activeGroup);
            if (this.clipTo) {
                canvasToDrawOn.restore();
            }
            this._renderOverlay(canvasToDrawOn);
            if (this.controlsAboveOverlay && this.interactive) {
                this.drawControls(canvasToDrawOn);
            }
            this.fire("after:render");
            return this;
        },
        _renderObjects: function(ctx, activeGroup) {
            var i, length;
            if (!activeGroup || this.preserveObjectStacking) {
                for (i = 0, length = this._objects.length; i < length; ++i) {
                    this._draw(ctx, this._objects[i]);
                }
            } else {
                for (i = 0, length = this._objects.length; i < length; ++i) {
                    if (this._objects[i] && !activeGroup.contains(this._objects[i])) {
                        this._draw(ctx, this._objects[i]);
                    }
                }
            }
        },
        _renderActiveGroup: function(ctx, activeGroup) {
            if (activeGroup) {
                var sortedObjects = [];
                this.forEachObject(function(object) {
                    if (activeGroup.contains(object)) {
                        sortedObjects.push(object);
                    }
                });
                activeGroup._set("objects", sortedObjects);
                this._draw(ctx, activeGroup);
            }
        },
        _renderBackground: function(ctx) {
            if (this.backgroundColor) {
                ctx.fillStyle = this.backgroundColor.toLive ? this.backgroundColor.toLive(ctx) : this.backgroundColor;
                ctx.fillRect(this.backgroundColor.offsetX || 0, this.backgroundColor.offsetY || 0, this.width, this.height);
            }
            if (this.backgroundImage) {
                this._draw(ctx, this.backgroundImage);
            }
        },
        _renderOverlay: function(ctx) {
            if (this.overlayColor) {
                ctx.fillStyle = this.overlayColor.toLive ? this.overlayColor.toLive(ctx) : this.overlayColor;
                ctx.fillRect(this.overlayColor.offsetX || 0, this.overlayColor.offsetY || 0, this.width, this.height);
            }
            if (this.overlayImage) {
                this._draw(ctx, this.overlayImage);
            }
        },
        renderTop: function() {
            var ctx = this.contextTop || this.contextContainer;
            this.clearContext(ctx);
            if (this.selection && this._groupSelector) {
                this._drawSelection();
            }
            var activeGroup = this.getActiveGroup();
            if (activeGroup) {
                activeGroup.render(ctx);
            }
            this._renderOverlay(ctx);
            this.fire("after:render");
            return this;
        },
        getCenter: function() {
            return {
                top: this.getHeight() / 2,
                left: this.getWidth() / 2
            };
        },
        centerObjectH: function(object) {
            this._centerObject(object, new fabric.Point(this.getCenter().left, object.getCenterPoint().y));
            this.renderAll();
            return this;
        },
        centerObjectV: function(object) {
            this._centerObject(object, new fabric.Point(object.getCenterPoint().x, this.getCenter().top));
            this.renderAll();
            return this;
        },
        centerObject: function(object) {
            var center = this.getCenter();
            this._centerObject(object, new fabric.Point(center.left, center.top));
            this.renderAll();
            return this;
        },
        _centerObject: function(object, center) {
            object.setPositionByOrigin(center, "center", "center");
            return this;
        },
        toDatalessJSON: function(propertiesToInclude) {
            return this.toDatalessObject(propertiesToInclude);
        },
        toObject: function(propertiesToInclude) {
            return this._toObjectMethod("toObject", propertiesToInclude);
        },
        toDatalessObject: function(propertiesToInclude) {
            return this._toObjectMethod("toDatalessObject", propertiesToInclude);
        },
        _toObjectMethod: function(methodName, propertiesToInclude) {
            var activeGroup = this.getActiveGroup();
            if (activeGroup) {
                this.discardActiveGroup();
            }
            var data = {
                objects: this._toObjects(methodName, propertiesToInclude)
            };
            extend(data, this.__serializeBgOverlay());
            fabric.util.populateWithProperties(this, data, propertiesToInclude);
            if (activeGroup) {
                this.setActiveGroup(new fabric.Group(activeGroup.getObjects(), {
                    originX: "center",
                    originY: "center"
                }));
                activeGroup.forEachObject(function(o) {
                    o.set("active", true);
                });
                if (this._currentTransform) {
                    this._currentTransform.target = this.getActiveGroup();
                }
            }
            return data;
        },
        _toObjects: function(methodName, propertiesToInclude) {
            return this.getObjects().map(function(instance) {
                return this._toObject(instance, methodName, propertiesToInclude);
            }, this);
        },
        _toObject: function(instance, methodName, propertiesToInclude) {
            var originalValue;
            if (!this.includeDefaultValues) {
                originalValue = instance.includeDefaultValues;
                instance.includeDefaultValues = false;
            }
            var object = instance[methodName](propertiesToInclude);
            if (!this.includeDefaultValues) {
                instance.includeDefaultValues = originalValue;
            }
            return object;
        },
        __serializeBgOverlay: function() {
            var data = {
                background: this.backgroundColor && this.backgroundColor.toObject ? this.backgroundColor.toObject() : this.backgroundColor
            };
            if (this.overlayColor) {
                data.overlay = this.overlayColor.toObject ? this.overlayColor.toObject() : this.overlayColor;
            }
            if (this.backgroundImage) {
                data.backgroundImage = this.backgroundImage.toObject();
            }
            if (this.overlayImage) {
                data.overlayImage = this.overlayImage.toObject();
            }
            return data;
        },
        sendToBack: function(object) {
            removeFromArray(this._objects, object);
            this._objects.unshift(object);
            return this.renderAll && this.renderAll();
        },
        bringToFront: function(object) {
            removeFromArray(this._objects, object);
            this._objects.push(object);
            return this.renderAll && this.renderAll();
        },
        sendBackwards: function(object, intersecting) {
            var idx = this._objects.indexOf(object);
            if (idx !== 0) {
                var newIdx = this._findNewLowerIndex(object, idx, intersecting);
                removeFromArray(this._objects, object);
                this._objects.splice(newIdx, 0, object);
                this.renderAll && this.renderAll();
            }
            return this;
        },
        _findNewLowerIndex: function(object, idx, intersecting) {
            var newIdx;
            if (intersecting) {
                newIdx = idx;
                for (var i = idx - 1; i >= 0; --i) {
                    var isIntersecting = object.intersectsWithObject(this._objects[i]) || object.isContainedWithinObject(this._objects[i]) || this._objects[i].isContainedWithinObject(object);
                    if (isIntersecting) {
                        newIdx = i;
                        break;
                    }
                }
            } else {
                newIdx = idx - 1;
            }
            return newIdx;
        },
        bringForward: function(object, intersecting) {
            var idx = this._objects.indexOf(object);
            if (idx !== this._objects.length - 1) {
                var newIdx = this._findNewUpperIndex(object, idx, intersecting);
                removeFromArray(this._objects, object);
                this._objects.splice(newIdx, 0, object);
                this.renderAll && this.renderAll();
            }
            return this;
        },
        _findNewUpperIndex: function(object, idx, intersecting) {
            var newIdx;
            if (intersecting) {
                newIdx = idx;
                for (var i = idx + 1; i < this._objects.length; ++i) {
                    var isIntersecting = object.intersectsWithObject(this._objects[i]) || object.isContainedWithinObject(this._objects[i]) || this._objects[i].isContainedWithinObject(object);
                    if (isIntersecting) {
                        newIdx = i;
                        break;
                    }
                }
            } else {
                newIdx = idx + 1;
            }
            return newIdx;
        },
        moveTo: function(object, index) {
            removeFromArray(this._objects, object);
            this._objects.splice(index, 0, object);
            return this.renderAll && this.renderAll();
        },
        dispose: function() {
            this.clear();
            this.interactive && this.removeListeners();
            return this;
        },
        toString: function() {
            return "#<fabric.Canvas (" + this.complexity() + "): " + "{ objects: " + this.getObjects().length + " }>";
        }
    });
    extend(fabric.StaticCanvas.prototype, fabric.Observable);
    extend(fabric.StaticCanvas.prototype, fabric.Collection);
    extend(fabric.StaticCanvas.prototype, fabric.DataURLExporter);
    extend(fabric.StaticCanvas, {
        EMPTY_JSON: '{"objects": [], "background": "white"}',
        supports: function(methodName) {
            var el = fabric.util.createCanvasElement();
            if (!el || !el.getContext) {
                return null;
            }
            var ctx = el.getContext("2d");
            if (!ctx) {
                return null;
            }
            switch (methodName) {
              case "getImageData":
                return typeof ctx.getImageData !== "undefined";

              case "setLineDash":
                return typeof ctx.setLineDash !== "undefined";

              case "toDataURL":
                return typeof el.toDataURL !== "undefined";

              case "toDataURLWithQuality":
                try {
                    el.toDataURL("image/jpeg", 0);
                    return true;
                } catch (e) {}
                return false;

              default:
                return null;
            }
        }
    });
    fabric.StaticCanvas.prototype.toJSON = fabric.StaticCanvas.prototype.toObject;
})();

fabric.BaseBrush = fabric.util.createClass({
    color: "rgb(0, 0, 0)",
    width: 1,
    shadow: null,
    strokeLineCap: "round",
    strokeLineJoin: "round",
    setShadow: function(options) {
        this.shadow = new fabric.Shadow(options);
        return this;
    },
    _setBrushStyles: function() {
        var ctx = this.canvas.contextTop;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = this.strokeLineCap;
        ctx.lineJoin = this.strokeLineJoin;
    },
    _setShadow: function() {
        if (!this.shadow) {
            return;
        }
        var ctx = this.canvas.contextTop;
        ctx.shadowColor = this.shadow.color;
        ctx.shadowBlur = this.shadow.blur;
        ctx.shadowOffsetX = this.shadow.offsetX;
        ctx.shadowOffsetY = this.shadow.offsetY;
    },
    _resetShadow: function() {
        var ctx = this.canvas.contextTop;
        ctx.shadowColor = "";
        ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    }
});

(function() {
    fabric.PencilBrush = fabric.util.createClass(fabric.BaseBrush, {
        initialize: function(canvas) {
            this.canvas = canvas;
            this._points = [];
        },
        onMouseDown: function(pointer) {
            this._prepareForDrawing(pointer);
            this._captureDrawingPath(pointer);
            this._render();
        },
        onMouseMove: function(pointer) {
            this._captureDrawingPath(pointer);
            this.canvas.clearContext(this.canvas.contextTop);
            this._render();
        },
        onMouseUp: function() {
            this._finalizeAndAddPath();
        },
        _prepareForDrawing: function(pointer) {
            var p = new fabric.Point(pointer.x, pointer.y);
            this._reset();
            this._addPoint(p);
            this.canvas.contextTop.moveTo(p.x, p.y);
        },
        _addPoint: function(point) {
            this._points.push(point);
        },
        _reset: function() {
            this._points.length = 0;
            this._setBrushStyles();
            this._setShadow();
        },
        _captureDrawingPath: function(pointer) {
            var pointerPoint = new fabric.Point(pointer.x, pointer.y);
            this._addPoint(pointerPoint);
        },
        _render: function() {
            var ctx = this.canvas.contextTop, v = this.canvas.viewportTransform, p1 = this._points[0], p2 = this._points[1];
            ctx.save();
            ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
            ctx.beginPath();
            if (this._points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
                p1.x -= .5;
                p2.x += .5;
            }
            ctx.moveTo(p1.x, p1.y);
            for (var i = 1, len = this._points.length; i < len; i++) {
                var midPoint = p1.midPointFrom(p2);
                ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                p1 = this._points[i];
                p2 = this._points[i + 1];
            }
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            ctx.restore();
        },
        convertPointsToSVGPath: function(points) {
            var path = [], p1 = new fabric.Point(points[0].x, points[0].y), p2 = new fabric.Point(points[1].x, points[1].y);
            path.push("M ", points[0].x, " ", points[0].y, " ");
            for (var i = 1, len = points.length; i < len; i++) {
                var midPoint = p1.midPointFrom(p2);
                path.push("Q ", p1.x, " ", p1.y, " ", midPoint.x, " ", midPoint.y, " ");
                p1 = new fabric.Point(points[i].x, points[i].y);
                if (i + 1 < points.length) {
                    p2 = new fabric.Point(points[i + 1].x, points[i + 1].y);
                }
            }
            path.push("L ", p1.x, " ", p1.y, " ");
            return path;
        },
        createPath: function(pathData) {
            var path = new fabric.Path(pathData, {
                fill: null,
                stroke: this.color,
                strokeWidth: this.width,
                strokeLineCap: this.strokeLineCap,
                strokeLineJoin: this.strokeLineJoin,
                originX: "center",
                originY: "center"
            });
            if (this.shadow) {
                this.shadow.affectStroke = true;
                path.setShadow(this.shadow);
            }
            return path;
        },
        _finalizeAndAddPath: function() {
            var ctx = this.canvas.contextTop;
            ctx.closePath();
            var pathData = this.convertPointsToSVGPath(this._points).join("");
            if (pathData === "M 0 0 Q 0 0 0 0 L 0 0") {
                this.canvas.renderAll();
                return;
            }
            var path = this.createPath(pathData);
            this.canvas.add(path);
            path.setCoords();
            this.canvas.clearContext(this.canvas.contextTop);
            this._resetShadow();
            this.canvas.renderAll();
            this.canvas.fire("path:created", {
                path: path
            });
        }
    });
})();

fabric.CircleBrush = fabric.util.createClass(fabric.BaseBrush, {
    width: 10,
    initialize: function(canvas) {
        this.canvas = canvas;
        this.points = [];
    },
    drawDot: function(pointer) {
        var point = this.addPoint(pointer), ctx = this.canvas.contextTop, v = this.canvas.viewportTransform;
        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        ctx.fillStyle = point.fill;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    onMouseDown: function(pointer) {
        this.points.length = 0;
        this.canvas.clearContext(this.canvas.contextTop);
        this._setShadow();
        this.drawDot(pointer);
    },
    onMouseMove: function(pointer) {
        this.drawDot(pointer);
    },
    onMouseUp: function() {
        var originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
        this.canvas.renderOnAddRemove = false;
        var circles = [];
        for (var i = 0, len = this.points.length; i < len; i++) {
            var point = this.points[i], circle = new fabric.Circle({
                radius: point.radius,
                left: point.x,
                top: point.y,
                originX: "center",
                originY: "center",
                fill: point.fill
            });
            this.shadow && circle.setShadow(this.shadow);
            circles.push(circle);
        }
        var group = new fabric.Group(circles, {
            originX: "center",
            originY: "center"
        });
        group.canvas = this.canvas;
        this.canvas.add(group);
        this.canvas.fire("path:created", {
            path: group
        });
        this.canvas.clearContext(this.canvas.contextTop);
        this._resetShadow();
        this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
        this.canvas.renderAll();
    },
    addPoint: function(pointer) {
        var pointerPoint = new fabric.Point(pointer.x, pointer.y), circleRadius = fabric.util.getRandomInt(Math.max(0, this.width - 20), this.width + 20) / 2, circleColor = new fabric.Color(this.color).setAlpha(fabric.util.getRandomInt(0, 100) / 100).toRgba();
        pointerPoint.radius = circleRadius;
        pointerPoint.fill = circleColor;
        this.points.push(pointerPoint);
        return pointerPoint;
    }
});

fabric.SprayBrush = fabric.util.createClass(fabric.BaseBrush, {
    width: 10,
    density: 20,
    dotWidth: 1,
    dotWidthVariance: 1,
    randomOpacity: false,
    optimizeOverlapping: true,
    initialize: function(canvas) {
        this.canvas = canvas;
        this.sprayChunks = [];
    },
    onMouseDown: function(pointer) {
        this.sprayChunks.length = 0;
        this.canvas.clearContext(this.canvas.contextTop);
        this._setShadow();
        this.addSprayChunk(pointer);
        this.render();
    },
    onMouseMove: function(pointer) {
        this.addSprayChunk(pointer);
        this.render();
    },
    onMouseUp: function() {
        var originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
        this.canvas.renderOnAddRemove = false;
        var rects = [];
        for (var i = 0, ilen = this.sprayChunks.length; i < ilen; i++) {
            var sprayChunk = this.sprayChunks[i];
            for (var j = 0, jlen = sprayChunk.length; j < jlen; j++) {
                var rect = new fabric.Rect({
                    width: sprayChunk[j].width,
                    height: sprayChunk[j].width,
                    left: sprayChunk[j].x + 1,
                    top: sprayChunk[j].y + 1,
                    originX: "center",
                    originY: "center",
                    fill: this.color
                });
                this.shadow && rect.setShadow(this.shadow);
                rects.push(rect);
            }
        }
        if (this.optimizeOverlapping) {
            rects = this._getOptimizedRects(rects);
        }
        var group = new fabric.Group(rects, {
            originX: "center",
            originY: "center"
        });
        group.canvas = this.canvas;
        this.canvas.add(group);
        this.canvas.fire("path:created", {
            path: group
        });
        this.canvas.clearContext(this.canvas.contextTop);
        this._resetShadow();
        this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
        this.canvas.renderAll();
    },
    _getOptimizedRects: function(rects) {
        var uniqueRects = {}, key;
        for (var i = 0, len = rects.length; i < len; i++) {
            key = rects[i].left + "" + rects[i].top;
            if (!uniqueRects[key]) {
                uniqueRects[key] = rects[i];
            }
        }
        var uniqueRectsArray = [];
        for (key in uniqueRects) {
            uniqueRectsArray.push(uniqueRects[key]);
        }
        return uniqueRectsArray;
    },
    render: function() {
        var ctx = this.canvas.contextTop;
        ctx.fillStyle = this.color;
        var v = this.canvas.viewportTransform;
        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        for (var i = 0, len = this.sprayChunkPoints.length; i < len; i++) {
            var point = this.sprayChunkPoints[i];
            if (typeof point.opacity !== "undefined") {
                ctx.globalAlpha = point.opacity;
            }
            ctx.fillRect(point.x, point.y, point.width, point.width);
        }
        ctx.restore();
    },
    addSprayChunk: function(pointer) {
        this.sprayChunkPoints = [];
        var x, y, width, radius = this.width / 2;
        for (var i = 0; i < this.density; i++) {
            x = fabric.util.getRandomInt(pointer.x - radius, pointer.x + radius);
            y = fabric.util.getRandomInt(pointer.y - radius, pointer.y + radius);
            if (this.dotWidthVariance) {
                width = fabric.util.getRandomInt(Math.max(1, this.dotWidth - this.dotWidthVariance), this.dotWidth + this.dotWidthVariance);
            } else {
                width = this.dotWidth;
            }
            var point = new fabric.Point(x, y);
            point.width = width;
            if (this.randomOpacity) {
                point.opacity = fabric.util.getRandomInt(0, 100) / 100;
            }
            this.sprayChunkPoints.push(point);
        }
        this.sprayChunks.push(this.sprayChunkPoints);
    }
});

fabric.PatternBrush = fabric.util.createClass(fabric.PencilBrush, {
    getPatternSrc: function() {
        var dotWidth = 20, dotDistance = 5, patternCanvas = fabric.document.createElement("canvas"), patternCtx = patternCanvas.getContext("2d");
        patternCanvas.width = patternCanvas.height = dotWidth + dotDistance;
        patternCtx.fillStyle = this.color;
        patternCtx.beginPath();
        patternCtx.arc(dotWidth / 2, dotWidth / 2, dotWidth / 2, 0, Math.PI * 2, false);
        patternCtx.closePath();
        patternCtx.fill();
        return patternCanvas;
    },
    getPatternSrcFunction: function() {
        return String(this.getPatternSrc).replace("this.color", '"' + this.color + '"');
    },
    getPattern: function() {
        return this.canvas.contextTop.createPattern(this.source || this.getPatternSrc(), "repeat");
    },
    _setBrushStyles: function() {
        this.callSuper("_setBrushStyles");
        this.canvas.contextTop.strokeStyle = this.getPattern();
    },
    createPath: function(pathData) {
        var path = this.callSuper("createPath", pathData);
        path.stroke = new fabric.Pattern({
            source: this.source || this.getPatternSrcFunction()
        });
        return path;
    }
});

fabric.util.object.extend(fabric.StaticCanvas.prototype, {
    toDataURL: function(options) {
        options || (options = {});
        var format = options.format || "png", quality = options.quality || 1, multiplier = options.multiplier || 1, cropping = {
            left: options.left,
            top: options.top,
            width: options.width,
            height: options.height
        };
        if (multiplier !== 1) {
            return this.__toDataURLWithMultiplier(format, quality, cropping, multiplier);
        } else {
            return this.__toDataURL(format, quality, cropping);
        }
    },
    __toDataURL: function(format, quality, cropping) {
        this.renderAll(true);
        var canvasEl = this.upperCanvasEl || this.lowerCanvasEl, croppedCanvasEl = this.__getCroppedCanvas(canvasEl, cropping);
        if (format === "jpg") {
            format = "jpeg";
        }
        var data = fabric.StaticCanvas.supports("toDataURLWithQuality") ? (croppedCanvasEl || canvasEl).toDataURL("image/" + format, quality) : (croppedCanvasEl || canvasEl).toDataURL("image/" + format);
        this.contextTop && this.clearContext(this.contextTop);
        this.renderAll();
        if (croppedCanvasEl) {
            croppedCanvasEl = null;
        }
        return data;
    },
    __getCroppedCanvas: function(canvasEl, cropping) {
        var croppedCanvasEl, croppedCtx, shouldCrop = "left" in cropping || "top" in cropping || "width" in cropping || "height" in cropping;
        if (shouldCrop) {
            croppedCanvasEl = fabric.util.createCanvasElement();
            croppedCtx = croppedCanvasEl.getContext("2d");
            croppedCanvasEl.width = cropping.width || this.width;
            croppedCanvasEl.height = cropping.height || this.height;
            croppedCtx.drawImage(canvasEl, -cropping.left || 0, -cropping.top || 0);
        }
        return croppedCanvasEl;
    },
    __toDataURLWithMultiplier: function(format, quality, cropping, multiplier) {
        var origWidth = this.getWidth(), origHeight = this.getHeight(), scaledWidth = origWidth * multiplier, scaledHeight = origHeight * multiplier, activeObject = this.getActiveObject(), activeGroup = this.getActiveGroup(), ctx = this.contextTop || this.contextContainer;
        if (multiplier > 1) {
            this.setWidth(scaledWidth).setHeight(scaledHeight);
        }
        ctx.scale(multiplier, multiplier);
        if (cropping.left) {
            cropping.left *= multiplier;
        }
        if (cropping.top) {
            cropping.top *= multiplier;
        }
        if (cropping.width) {
            cropping.width *= multiplier;
        } else if (multiplier < 1) {
            cropping.width = scaledWidth;
        }
        if (cropping.height) {
            cropping.height *= multiplier;
        } else if (multiplier < 1) {
            cropping.height = scaledHeight;
        }
        if (activeGroup) {
            this._tempRemoveBordersControlsFromGroup(activeGroup);
        } else if (activeObject && this.deactivateAll) {
            this.deactivateAll();
        }
        this.renderAll(true);
        var data = this.__toDataURL(format, quality, cropping);
        this.width = origWidth;
        this.height = origHeight;
        ctx.scale(1 / multiplier, 1 / multiplier);
        this.setWidth(origWidth).setHeight(origHeight);
        if (activeGroup) {
            this._restoreBordersControlsOnGroup(activeGroup);
        } else if (activeObject && this.setActiveObject) {
            this.setActiveObject(activeObject);
        }
        this.contextTop && this.clearContext(this.contextTop);
        this.renderAll();
        return data;
    },
    toDataURLWithMultiplier: function(format, multiplier, quality) {
        return this.toDataURL({
            format: format,
            multiplier: multiplier,
            quality: quality
        });
    },
    _tempRemoveBordersControlsFromGroup: function(group) {
        group.origHasControls = group.hasControls;
        group.origBorderColor = group.borderColor;
        group.hasControls = true;
        group.borderColor = "rgba(0,0,0,0)";
        group.forEachObject(function(o) {
            o.origBorderColor = o.borderColor;
            o.borderColor = "rgba(0,0,0,0)";
        });
    },
    _restoreBordersControlsOnGroup: function(group) {
        group.hideControls = group.origHideControls;
        group.borderColor = group.origBorderColor;
        group.forEachObject(function(o) {
            o.borderColor = o.origBorderColor;
            delete o.origBorderColor;
        });
    }
});

fabric.util.object.extend(fabric.StaticCanvas.prototype, {
    loadFromDatalessJSON: function(json, callback, reviver) {
        return this.loadFromJSON(json, callback, reviver);
    },
    loadFromJSON: function(json, callback, reviver) {
        if (!json) {
            return;
        }
        var serialized = typeof json === "string" ? JSON.parse(json) : json;
        this.clear();
        var _this = this;
        this._enlivenObjects(serialized.objects, function() {
            _this._setBgOverlay(serialized, callback);
        }, reviver);
        return this;
    },
    _setBgOverlay: function(serialized, callback) {
        var _this = this, loaded = {
            backgroundColor: false,
            overlayColor: false,
            backgroundImage: false,
            overlayImage: false
        };
        if (!serialized.backgroundImage && !serialized.overlayImage && !serialized.background && !serialized.overlay) {
            callback && callback();
            return;
        }
        var cbIfLoaded = function() {
            if (loaded.backgroundImage && loaded.overlayImage && loaded.backgroundColor && loaded.overlayColor) {
                _this.renderAll();
                callback && callback();
            }
        };
        this.__setBgOverlay("backgroundImage", serialized.backgroundImage, loaded, cbIfLoaded);
        this.__setBgOverlay("overlayImage", serialized.overlayImage, loaded, cbIfLoaded);
        this.__setBgOverlay("backgroundColor", serialized.background, loaded, cbIfLoaded);
        this.__setBgOverlay("overlayColor", serialized.overlay, loaded, cbIfLoaded);
        cbIfLoaded();
    },
    __setBgOverlay: function(property, value, loaded, callback) {
        var _this = this;
        if (!value) {
            loaded[property] = true;
            return;
        }
        if (property === "backgroundImage" || property === "overlayImage") {
            fabric.Image.fromObject(value, function(img) {
                _this[property] = img;
                loaded[property] = true;
                callback && callback();
            });
        } else {
            this["set" + fabric.util.string.capitalize(property, true)](value, function() {
                loaded[property] = true;
                callback && callback();
            });
        }
    },
    _enlivenObjects: function(objects, callback, reviver) {
        var _this = this;
        if (!objects || objects.length === 0) {
            callback && callback();
            return;
        }
        var renderOnAddRemove = this.renderOnAddRemove;
        this.renderOnAddRemove = false;
        fabric.util.enlivenObjects(objects, function(enlivenedObjects) {
            enlivenedObjects.forEach(function(obj, index) {
                _this.insertAt(obj, index, true);
            });
            _this.renderOnAddRemove = renderOnAddRemove;
            callback && callback();
        }, null, reviver);
    },
    _toDataURL: function(format, callback) {
        this.clone(function(clone) {
            callback(clone.toDataURL(format));
        });
    },
    _toDataURLWithMultiplier: function(format, multiplier, callback) {
        this.clone(function(clone) {
            callback(clone.toDataURLWithMultiplier(format, multiplier));
        });
    },
    clone: function(callback, properties) {
        var data = JSON.stringify(this.toJSON(properties));
        this.cloneWithoutData(function(clone) {
            clone.loadFromJSON(data, function() {
                callback && callback(clone);
            });
        });
    },
    cloneWithoutData: function(callback) {
        var el = fabric.document.createElement("canvas");
        el.width = this.getWidth();
        el.height = this.getHeight();
        var clone = new fabric.Canvas(el);
        clone.clipTo = this.clipTo;
        if (this.backgroundImage) {
            clone.setBackgroundImage(this.backgroundImage.src, function() {
                clone.renderAll();
                callback && callback(clone);
            });
            clone.backgroundImageOpacity = this.backgroundImageOpacity;
            clone.backgroundImageStretch = this.backgroundImageStretch;
        } else {
            callback && callback(clone);
        }
    }
});

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, toFixed = fabric.util.toFixed, capitalize = fabric.util.string.capitalize, degreesToRadians = fabric.util.degreesToRadians, supportsLineDash = fabric.StaticCanvas.supports("setLineDash");
    if (fabric.Object) {
        return;
    }
    fabric.Object = fabric.util.createClass({
        type: "object",
        originX: "left",
        originY: "top",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false,
        opacity: 1,
        angle: 0,
        cornerSize: 12,
        transparentCorners: true,
        hoverCursor: null,
        padding: 0,
        borderColor: "rgba(102,153,255,0.75)",
        cornerColor: "rgba(102,153,255,0.5)",
        centeredScaling: false,
        centeredRotation: true,
        fill: "rgb(0,0,0)",
        fillRule: "nonzero",
        globalCompositeOperation: "source-over",
        backgroundColor: "",
        stroke: null,
        strokeWidth: 1,
        strokeDashArray: null,
        strokeLineCap: "butt",
        strokeLineJoin: "miter",
        strokeMiterLimit: 10,
        shadow: null,
        borderOpacityWhenMoving: .4,
        borderScaleFactor: 1,
        transformMatrix: null,
        minScaleLimit: .01,
        selectable: true,
        evented: true,
        visible: true,
        hasControls: true,
        hasBorders: true,
        hasRotatingPoint: true,
        rotatingPointOffset: 40,
        perPixelTargetFind: false,
        includeDefaultValues: true,
        clipTo: null,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        lockUniScaling: false,
        lockScalingFlip: false,
        stateProperties: ("top left width height scaleX scaleY flipX flipY originX originY transformMatrix " + "stroke strokeWidth strokeDashArray strokeLineCap strokeLineJoin strokeMiterLimit " + "angle opacity fill fillRule globalCompositeOperation shadow clipTo visible backgroundColor").split(" "),
        initialize: function(options) {
            if (options) {
                this.setOptions(options);
            }
        },
        _initGradient: function(options) {
            if (options.fill && options.fill.colorStops && !(options.fill instanceof fabric.Gradient)) {
                this.set("fill", new fabric.Gradient(options.fill));
            }
        },
        _initPattern: function(options) {
            if (options.fill && options.fill.source && !(options.fill instanceof fabric.Pattern)) {
                this.set("fill", new fabric.Pattern(options.fill));
            }
            if (options.stroke && options.stroke.source && !(options.stroke instanceof fabric.Pattern)) {
                this.set("stroke", new fabric.Pattern(options.stroke));
            }
        },
        _initClipping: function(options) {
            if (!options.clipTo || typeof options.clipTo !== "string") {
                return;
            }
            var functionBody = fabric.util.getFunctionBody(options.clipTo);
            if (typeof functionBody !== "undefined") {
                this.clipTo = new Function("ctx", functionBody);
            }
        },
        setOptions: function(options) {
            for (var prop in options) {
                this.set(prop, options[prop]);
            }
            this._initGradient(options);
            this._initPattern(options);
            this._initClipping(options);
        },
        transform: function(ctx, fromLeft) {
            if (this.group) {
                this.group.transform(ctx, fromLeft);
            }
            var center = fromLeft ? this._getLeftTopCoords() : this.getCenterPoint();
            ctx.translate(center.x, center.y);
            ctx.rotate(degreesToRadians(this.angle));
            ctx.scale(this.scaleX * (this.flipX ? -1 : 1), this.scaleY * (this.flipY ? -1 : 1));
        },
        toObject: function(propertiesToInclude) {
            var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS, object = {
                type: this.type,
                originX: this.originX,
                originY: this.originY,
                left: toFixed(this.left, NUM_FRACTION_DIGITS),
                top: toFixed(this.top, NUM_FRACTION_DIGITS),
                width: toFixed(this.width, NUM_FRACTION_DIGITS),
                height: toFixed(this.height, NUM_FRACTION_DIGITS),
                fill: this.fill && this.fill.toObject ? this.fill.toObject() : this.fill,
                stroke: this.stroke && this.stroke.toObject ? this.stroke.toObject() : this.stroke,
                strokeWidth: toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
                strokeDashArray: this.strokeDashArray,
                strokeLineCap: this.strokeLineCap,
                strokeLineJoin: this.strokeLineJoin,
                strokeMiterLimit: toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
                scaleX: toFixed(this.scaleX, NUM_FRACTION_DIGITS),
                scaleY: toFixed(this.scaleY, NUM_FRACTION_DIGITS),
                angle: toFixed(this.getAngle(), NUM_FRACTION_DIGITS),
                flipX: this.flipX,
                flipY: this.flipY,
                opacity: toFixed(this.opacity, NUM_FRACTION_DIGITS),
                shadow: this.shadow && this.shadow.toObject ? this.shadow.toObject() : this.shadow,
                visible: this.visible,
                clipTo: this.clipTo && String(this.clipTo),
                backgroundColor: this.backgroundColor,
                fillRule: this.fillRule,
                globalCompositeOperation: this.globalCompositeOperation
            };
            if (!this.includeDefaultValues) {
                object = this._removeDefaultValues(object);
            }
            fabric.util.populateWithProperties(this, object, propertiesToInclude);
            return object;
        },
        toDatalessObject: function(propertiesToInclude) {
            return this.toObject(propertiesToInclude);
        },
        _removeDefaultValues: function(object) {
            var prototype = fabric.util.getKlass(object.type).prototype, stateProperties = prototype.stateProperties;
            stateProperties.forEach(function(prop) {
                if (object[prop] === prototype[prop]) {
                    delete object[prop];
                }
            });
            return object;
        },
        toString: function() {
            return "#<fabric." + capitalize(this.type) + ">";
        },
        get: function(property) {
            return this[property];
        },
        _setObject: function(obj) {
            for (var prop in obj) {
                this._set(prop, obj[prop]);
            }
        },
        set: function(key, value) {
            if (typeof key === "object") {
                this._setObject(key);
            } else {
                if (typeof value === "function" && key !== "clipTo") {
                    this._set(key, value(this.get(key)));
                } else {
                    this._set(key, value);
                }
            }
            return this;
        },
        _set: function(key, value) {
            var shouldConstrainValue = key === "scaleX" || key === "scaleY";
            if (shouldConstrainValue) {
                value = this._constrainScale(value);
            }
            if (key === "scaleX" && value < 0) {
                this.flipX = !this.flipX;
                value *= -1;
            } else if (key === "scaleY" && value < 0) {
                this.flipY = !this.flipY;
                value *= -1;
            } else if (key === "width" || key === "height") {
                this.minScaleLimit = toFixed(Math.min(.1, 1 / Math.max(this.width, this.height)), 2);
            } else if (key === "shadow" && value && !(value instanceof fabric.Shadow)) {
                value = new fabric.Shadow(value);
            }
            this[key] = value;
            return this;
        },
        toggle: function(property) {
            var value = this.get(property);
            if (typeof value === "boolean") {
                this.set(property, !value);
            }
            return this;
        },
        setSourcePath: function(value) {
            this.sourcePath = value;
            return this;
        },
        getViewportTransform: function() {
            if (this.canvas && this.canvas.viewportTransform) {
                return this.canvas.viewportTransform;
            }
            return [ 1, 0, 0, 1, 0, 0 ];
        },
        render: function(ctx, noTransform) {
            if (this.width === 0 && this.height === 0 || !this.visible) {
                return;
            }
            ctx.save();
            this._setupCompositeOperation(ctx);
            if (!noTransform) {
                this.transform(ctx);
            }
            this._setStrokeStyles(ctx);
            this._setFillStyles(ctx);
            if (this.group && this.group.type === "path-group") {
                ctx.translate(-this.group.width / 2, -this.group.height / 2);
            }
            if (this.transformMatrix) {
                ctx.transform.apply(ctx, this.transformMatrix);
            }
            this._setOpacity(ctx);
            this._setShadow(ctx);
            this.clipTo && fabric.util.clipContext(this, ctx);
            this._render(ctx, noTransform);
            this.clipTo && ctx.restore();
            this._removeShadow(ctx);
            this._restoreCompositeOperation(ctx);
            ctx.restore();
        },
        _setOpacity: function(ctx) {
            if (this.group) {
                this.group._setOpacity(ctx);
            }
            ctx.globalAlpha *= this.opacity;
        },
        _setStrokeStyles: function(ctx) {
            if (this.stroke) {
                ctx.lineWidth = this.strokeWidth;
                ctx.lineCap = this.strokeLineCap;
                ctx.lineJoin = this.strokeLineJoin;
                ctx.miterLimit = this.strokeMiterLimit;
                ctx.strokeStyle = this.stroke.toLive ? this.stroke.toLive(ctx, this) : this.stroke;
            }
        },
        _setFillStyles: function(ctx) {
            if (this.fill) {
                ctx.fillStyle = this.fill.toLive ? this.fill.toLive(ctx, this) : this.fill;
            }
        },
        _renderControls: function(ctx, noTransform) {
            var vpt = this.getViewportTransform();
            ctx.save();
            if (this.active && !noTransform) {
                var center;
                if (this.group) {
                    center = fabric.util.transformPoint(this.group.getCenterPoint(), vpt);
                    ctx.translate(center.x, center.y);
                    ctx.rotate(degreesToRadians(this.group.angle));
                }
                center = fabric.util.transformPoint(this.getCenterPoint(), vpt, null != this.group);
                if (this.group) {
                    center.x *= this.group.scaleX;
                    center.y *= this.group.scaleY;
                }
                ctx.translate(center.x, center.y);
                ctx.rotate(degreesToRadians(this.angle));
                this.drawBorders(ctx);
                this.drawControls(ctx);
            }
            ctx.restore();
        },
        _setShadow: function(ctx) {
            if (!this.shadow) {
                return;
            }
            var mult = this.canvas && this.canvas._currentMultiplier || 1;
            ctx.shadowColor = this.shadow.color;
            ctx.shadowBlur = this.shadow.blur * mult * (this.scaleX + this.scaleY) / 2;
            ctx.shadowOffsetX = this.shadow.offsetX * mult * this.scaleX;
            ctx.shadowOffsetY = this.shadow.offsetY * mult * this.scaleY;
        },
        _removeShadow: function(ctx) {
            if (!this.shadow) {
                return;
            }
            ctx.shadowColor = "";
            ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
        },
        _renderFill: function(ctx) {
            if (!this.fill) {
                return;
            }
            ctx.save();
            if (this.fill.gradientTransform) {
                var g = this.fill.gradientTransform;
                ctx.transform.apply(ctx, g);
            }
            if (this.fill.toLive) {
                ctx.translate(-this.width / 2 + this.fill.offsetX || 0, -this.height / 2 + this.fill.offsetY || 0);
            }
            if (this.fillRule === "evenodd") {
                ctx.fill("evenodd");
            } else {
                ctx.fill();
            }
            ctx.restore();
            if (this.shadow && !this.shadow.affectStroke) {
                this._removeShadow(ctx);
            }
        },
        _renderStroke: function(ctx) {
            if (!this.stroke || this.strokeWidth === 0) {
                return;
            }
            ctx.save();
            if (this.strokeDashArray) {
                if (1 & this.strokeDashArray.length) {
                    this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
                }
                if (supportsLineDash) {
                    ctx.setLineDash(this.strokeDashArray);
                    this._stroke && this._stroke(ctx);
                } else {
                    this._renderDashedStroke && this._renderDashedStroke(ctx);
                }
                ctx.stroke();
            } else {
                if (this.stroke.gradientTransform) {
                    var g = this.stroke.gradientTransform;
                    ctx.transform.apply(ctx, g);
                }
                this._stroke ? this._stroke(ctx) : ctx.stroke();
            }
            this._removeShadow(ctx);
            ctx.restore();
        },
        clone: function(callback, propertiesToInclude) {
            if (this.constructor.fromObject) {
                return this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
            }
            return new fabric.Object(this.toObject(propertiesToInclude));
        },
        cloneAsImage: function(callback) {
            var dataUrl = this.toDataURL();
            fabric.util.loadImage(dataUrl, function(img) {
                if (callback) {
                    callback(new fabric.Image(img));
                }
            });
            return this;
        },
        toDataURL: function(options) {
            options || (options = {});
            var el = fabric.util.createCanvasElement(), boundingRect = this.getBoundingRect();
            el.width = boundingRect.width;
            el.height = boundingRect.height;
            fabric.util.wrapElement(el, "div");
            var canvas = new fabric.Canvas(el);
            if (options.format === "jpg") {
                options.format = "jpeg";
            }
            if (options.format === "jpeg") {
                canvas.backgroundColor = "#fff";
            }
            var origParams = {
                active: this.get("active"),
                left: this.getLeft(),
                top: this.getTop()
            };
            this.set("active", false);
            this.setPositionByOrigin(new fabric.Point(el.width / 2, el.height / 2), "center", "center");
            var originalCanvas = this.canvas;
            canvas.add(this);
            var data = canvas.toDataURL(options);
            this.set(origParams).setCoords();
            this.canvas = originalCanvas;
            canvas.dispose();
            canvas = null;
            return data;
        },
        isType: function(type) {
            return this.type === type;
        },
        complexity: function() {
            return 0;
        },
        toJSON: function(propertiesToInclude) {
            return this.toObject(propertiesToInclude);
        },
        setGradient: function(property, options) {
            options || (options = {});
            var gradient = {
                colorStops: []
            };
            gradient.type = options.type || (options.r1 || options.r2 ? "radial" : "linear");
            gradient.coords = {
                x1: options.x1,
                y1: options.y1,
                x2: options.x2,
                y2: options.y2
            };
            if (options.r1 || options.r2) {
                gradient.coords.r1 = options.r1;
                gradient.coords.r2 = options.r2;
            }
            for (var position in options.colorStops) {
                var color = new fabric.Color(options.colorStops[position]);
                gradient.colorStops.push({
                    offset: position,
                    color: color.toRgb(),
                    opacity: color.getAlpha()
                });
            }
            return this.set(property, fabric.Gradient.forObject(this, gradient));
        },
        setPatternFill: function(options) {
            return this.set("fill", new fabric.Pattern(options));
        },
        setShadow: function(options) {
            return this.set("shadow", options ? new fabric.Shadow(options) : null);
        },
        setColor: function(color) {
            this.set("fill", color);
            return this;
        },
        setAngle: function(angle) {
            var shouldCenterOrigin = (this.originX !== "center" || this.originY !== "center") && this.centeredRotation;
            if (shouldCenterOrigin) {
                this._setOriginToCenter();
            }
            this.set("angle", angle);
            if (shouldCenterOrigin) {
                this._resetOrigin();
            }
            return this;
        },
        centerH: function() {
            this.canvas.centerObjectH(this);
            return this;
        },
        centerV: function() {
            this.canvas.centerObjectV(this);
            return this;
        },
        center: function() {
            this.canvas.centerObject(this);
            return this;
        },
        remove: function() {
            this.canvas.remove(this);
            return this;
        },
        getLocalPointer: function(e, pointer) {
            pointer = pointer || this.canvas.getPointer(e);
            var objectLeftTop = this.translateToOriginPoint(this.getCenterPoint(), "left", "top");
            return {
                x: pointer.x - objectLeftTop.x,
                y: pointer.y - objectLeftTop.y
            };
        },
        _setupCompositeOperation: function(ctx) {
            if (this.globalCompositeOperation) {
                this._prevGlobalCompositeOperation = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = this.globalCompositeOperation;
            }
        },
        _restoreCompositeOperation: function(ctx) {
            if (this.globalCompositeOperation && this._prevGlobalCompositeOperation) {
                ctx.globalCompositeOperation = this._prevGlobalCompositeOperation;
            }
        }
    });
    fabric.util.createAccessors(fabric.Object);
    fabric.Object.prototype.rotate = fabric.Object.prototype.setAngle;
    extend(fabric.Object.prototype, fabric.Observable);
    fabric.Object.NUM_FRACTION_DIGITS = 2;
    fabric.Object.__uid = 0;
})(typeof exports !== "undefined" ? exports : this);

(function() {
    var degreesToRadians = fabric.util.degreesToRadians;
    fabric.util.object.extend(fabric.Object.prototype, {
        translateToCenterPoint: function(point, originX, originY) {
            var cx = point.x, cy = point.y, strokeWidth = this.stroke ? this.strokeWidth : 0;
            if (originX === "left") {
                cx = point.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
            } else if (originX === "right") {
                cx = point.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
            }
            if (originY === "top") {
                cy = point.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
            } else if (originY === "bottom") {
                cy = point.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
            }
            return fabric.util.rotatePoint(new fabric.Point(cx, cy), point, degreesToRadians(this.angle));
        },
        translateToOriginPoint: function(center, originX, originY) {
            var x = center.x, y = center.y, strokeWidth = this.stroke ? this.strokeWidth : 0;
            if (originX === "left") {
                x = center.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
            } else if (originX === "right") {
                x = center.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
            }
            if (originY === "top") {
                y = center.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
            } else if (originY === "bottom") {
                y = center.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
            }
            return fabric.util.rotatePoint(new fabric.Point(x, y), center, degreesToRadians(this.angle));
        },
        getCenterPoint: function() {
            var leftTop = new fabric.Point(this.left, this.top);
            return this.translateToCenterPoint(leftTop, this.originX, this.originY);
        },
        getPointByOrigin: function(originX, originY) {
            var center = this.getCenterPoint();
            return this.translateToOriginPoint(center, originX, originY);
        },
        toLocalPoint: function(point, originX, originY) {
            var center = this.getCenterPoint(), strokeWidth = this.stroke ? this.strokeWidth : 0, x, y;
            if (originX && originY) {
                if (originX === "left") {
                    x = center.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
                } else if (originX === "right") {
                    x = center.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
                } else {
                    x = center.x;
                }
                if (originY === "top") {
                    y = center.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
                } else if (originY === "bottom") {
                    y = center.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
                } else {
                    y = center.y;
                }
            } else {
                x = this.left;
                y = this.top;
            }
            return fabric.util.rotatePoint(new fabric.Point(point.x, point.y), center, -degreesToRadians(this.angle)).subtractEquals(new fabric.Point(x, y));
        },
        setPositionByOrigin: function(pos, originX, originY) {
            var center = this.translateToCenterPoint(pos, originX, originY), position = this.translateToOriginPoint(center, this.originX, this.originY);
            this.set("left", position.x);
            this.set("top", position.y);
        },
        adjustPosition: function(to) {
            var angle = degreesToRadians(this.angle), hypotHalf = this.getWidth() / 2, xHalf = Math.cos(angle) * hypotHalf, yHalf = Math.sin(angle) * hypotHalf, hypotFull = this.getWidth(), xFull = Math.cos(angle) * hypotFull, yFull = Math.sin(angle) * hypotFull;
            if (this.originX === "center" && to === "left" || this.originX === "right" && to === "center") {
                this.left -= xHalf;
                this.top -= yHalf;
            } else if (this.originX === "left" && to === "center" || this.originX === "center" && to === "right") {
                this.left += xHalf;
                this.top += yHalf;
            } else if (this.originX === "left" && to === "right") {
                this.left += xFull;
                this.top += yFull;
            } else if (this.originX === "right" && to === "left") {
                this.left -= xFull;
                this.top -= yFull;
            }
            this.setCoords();
            this.originX = to;
        },
        _setOriginToCenter: function() {
            this._originalOriginX = this.originX;
            this._originalOriginY = this.originY;
            var center = this.getCenterPoint();
            this.originX = "center";
            this.originY = "center";
            this.left = center.x;
            this.top = center.y;
        },
        _resetOrigin: function() {
            var originPoint = this.translateToOriginPoint(this.getCenterPoint(), this._originalOriginX, this._originalOriginY);
            this.originX = this._originalOriginX;
            this.originY = this._originalOriginY;
            this.left = originPoint.x;
            this.top = originPoint.y;
            this._originalOriginX = null;
            this._originalOriginY = null;
        },
        _getLeftTopCoords: function() {
            return this.translateToOriginPoint(this.getCenterPoint(), "left", "center");
        }
    });
})();

(function() {
    var degreesToRadians = fabric.util.degreesToRadians;
    fabric.util.object.extend(fabric.Object.prototype, {
        oCoords: null,
        intersectsWithRect: function(pointTL, pointBR) {
            var oCoords = this.oCoords, tl = new fabric.Point(oCoords.tl.x, oCoords.tl.y), tr = new fabric.Point(oCoords.tr.x, oCoords.tr.y), bl = new fabric.Point(oCoords.bl.x, oCoords.bl.y), br = new fabric.Point(oCoords.br.x, oCoords.br.y), intersection = fabric.Intersection.intersectPolygonRectangle([ tl, tr, br, bl ], pointTL, pointBR);
            return intersection.status === "Intersection";
        },
        intersectsWithObject: function(other) {
            function getCoords(oCoords) {
                return {
                    tl: new fabric.Point(oCoords.tl.x, oCoords.tl.y),
                    tr: new fabric.Point(oCoords.tr.x, oCoords.tr.y),
                    bl: new fabric.Point(oCoords.bl.x, oCoords.bl.y),
                    br: new fabric.Point(oCoords.br.x, oCoords.br.y)
                };
            }
            var thisCoords = getCoords(this.oCoords), otherCoords = getCoords(other.oCoords), intersection = fabric.Intersection.intersectPolygonPolygon([ thisCoords.tl, thisCoords.tr, thisCoords.br, thisCoords.bl ], [ otherCoords.tl, otherCoords.tr, otherCoords.br, otherCoords.bl ]);
            return intersection.status === "Intersection";
        },
        isContainedWithinObject: function(other) {
            var boundingRect = other.getBoundingRect(), point1 = new fabric.Point(boundingRect.left, boundingRect.top), point2 = new fabric.Point(boundingRect.left + boundingRect.width, boundingRect.top + boundingRect.height);
            return this.isContainedWithinRect(point1, point2);
        },
        isContainedWithinRect: function(pointTL, pointBR) {
            var boundingRect = this.getBoundingRect();
            return boundingRect.left >= pointTL.x && boundingRect.left + boundingRect.width <= pointBR.x && boundingRect.top >= pointTL.y && boundingRect.top + boundingRect.height <= pointBR.y;
        },
        containsPoint: function(point) {
            var lines = this._getImageLines(this.oCoords), xPoints = this._findCrossPoints(point, lines);
            return xPoints !== 0 && xPoints % 2 === 1;
        },
        _getImageLines: function(oCoords) {
            return {
                topline: {
                    o: oCoords.tl,
                    d: oCoords.tr
                },
                rightline: {
                    o: oCoords.tr,
                    d: oCoords.br
                },
                bottomline: {
                    o: oCoords.br,
                    d: oCoords.bl
                },
                leftline: {
                    o: oCoords.bl,
                    d: oCoords.tl
                }
            };
        },
        _findCrossPoints: function(point, oCoords) {
            var b1, b2, a1, a2, xi, yi, xcount = 0, iLine;
            for (var lineKey in oCoords) {
                iLine = oCoords[lineKey];
                if (iLine.o.y < point.y && iLine.d.y < point.y) {
                    continue;
                }
                if (iLine.o.y >= point.y && iLine.d.y >= point.y) {
                    continue;
                }
                if (iLine.o.x === iLine.d.x && iLine.o.x >= point.x) {
                    xi = iLine.o.x;
                    yi = point.y;
                } else {
                    b1 = 0;
                    b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
                    a1 = point.y - b1 * point.x;
                    a2 = iLine.o.y - b2 * iLine.o.x;
                    xi = -(a1 - a2) / (b1 - b2);
                    yi = a1 + b1 * xi;
                }
                if (xi >= point.x) {
                    xcount += 1;
                }
                if (xcount === 2) {
                    break;
                }
            }
            return xcount;
        },
        getBoundingRectWidth: function() {
            return this.getBoundingRect().width;
        },
        getBoundingRectHeight: function() {
            return this.getBoundingRect().height;
        },
        getBoundingRect: function() {
            this.oCoords || this.setCoords();
            var xCoords = [ this.oCoords.tl.x, this.oCoords.tr.x, this.oCoords.br.x, this.oCoords.bl.x ], minX = fabric.util.array.min(xCoords), maxX = fabric.util.array.max(xCoords), width = Math.abs(minX - maxX), yCoords = [ this.oCoords.tl.y, this.oCoords.tr.y, this.oCoords.br.y, this.oCoords.bl.y ], minY = fabric.util.array.min(yCoords), maxY = fabric.util.array.max(yCoords), height = Math.abs(minY - maxY);
            return {
                left: minX,
                top: minY,
                width: width,
                height: height
            };
        },
        getWidth: function() {
            return this.width * this.scaleX;
        },
        getHeight: function() {
            return this.height * this.scaleY;
        },
        _constrainScale: function(value) {
            if (Math.abs(value) < this.minScaleLimit) {
                if (value < 0) {
                    return -this.minScaleLimit;
                } else {
                    return this.minScaleLimit;
                }
            }
            return value;
        },
        scale: function(value) {
            value = this._constrainScale(value);
            if (value < 0) {
                this.flipX = !this.flipX;
                this.flipY = !this.flipY;
                value *= -1;
            }
            this.scaleX = value;
            this.scaleY = value;
            this.setCoords();
            return this;
        },
        scaleToWidth: function(value) {
            var boundingRectFactor = this.getBoundingRectWidth() / this.getWidth();
            return this.scale(value / this.width / boundingRectFactor);
        },
        scaleToHeight: function(value) {
            var boundingRectFactor = this.getBoundingRectHeight() / this.getHeight();
            return this.scale(value / this.height / boundingRectFactor);
        },
        setCoords: function() {
            var strokeWidth = this.strokeWidth, theta = degreesToRadians(this.angle), vpt = this.getViewportTransform(), f = function(p) {
                return fabric.util.transformPoint(p, vpt);
            }, w = this.width, h = this.height, capped = this.strokeLineCap === "round" || this.strokeLineCap === "square", vLine = this.type === "line" && this.width === 0, hLine = this.type === "line" && this.height === 0, sLine = vLine || hLine, strokeW = capped && hLine || !sLine, strokeH = capped && vLine || !sLine;
            if (vLine) {
                w = strokeWidth;
            } else if (hLine) {
                h = strokeWidth;
            }
            if (strokeW) {
                w += w > 0 ? strokeWidth : -strokeWidth;
            }
            if (strokeH) {
                h += h > 0 ? strokeWidth : -strokeWidth;
            }
            this.currentWidth = w * this.scaleX;
            this.currentHeight = h * this.scaleY;
            if (this.currentWidth < 0) {
                this.currentWidth = Math.abs(this.currentWidth);
            }
            var _hypotenuse = Math.sqrt(Math.pow(this.currentWidth / 2, 2) + Math.pow(this.currentHeight / 2, 2)), _angle = Math.atan(isFinite(this.currentHeight / this.currentWidth) ? this.currentHeight / this.currentWidth : 0), offsetX = Math.cos(_angle + theta) * _hypotenuse, offsetY = Math.sin(_angle + theta) * _hypotenuse, sinTh = Math.sin(theta), cosTh = Math.cos(theta), coords = this.getCenterPoint(), wh = new fabric.Point(this.currentWidth, this.currentHeight), _tl = new fabric.Point(coords.x - offsetX, coords.y - offsetY), _tr = new fabric.Point(_tl.x + wh.x * cosTh, _tl.y + wh.x * sinTh), _bl = new fabric.Point(_tl.x - wh.y * sinTh, _tl.y + wh.y * cosTh), _mt = new fabric.Point(_tl.x + wh.x / 2 * cosTh, _tl.y + wh.x / 2 * sinTh), tl = f(_tl), tr = f(_tr), br = f(new fabric.Point(_tr.x - wh.y * sinTh, _tr.y + wh.y * cosTh)), bl = f(_bl), ml = f(new fabric.Point(_tl.x - wh.y / 2 * sinTh, _tl.y + wh.y / 2 * cosTh)), mt = f(_mt), mr = f(new fabric.Point(_tr.x - wh.y / 2 * sinTh, _tr.y + wh.y / 2 * cosTh)), mb = f(new fabric.Point(_bl.x + wh.x / 2 * cosTh, _bl.y + wh.x / 2 * sinTh)), mtr = f(new fabric.Point(_mt.x, _mt.y)), padX = Math.cos(_angle + theta) * this.padding * Math.sqrt(2), padY = Math.sin(_angle + theta) * this.padding * Math.sqrt(2);
            tl = tl.add(new fabric.Point(-padX, -padY));
            tr = tr.add(new fabric.Point(padY, -padX));
            br = br.add(new fabric.Point(padX, padY));
            bl = bl.add(new fabric.Point(-padY, padX));
            ml = ml.add(new fabric.Point((-padX - padY) / 2, (-padY + padX) / 2));
            mt = mt.add(new fabric.Point((padY - padX) / 2, -(padY + padX) / 2));
            mr = mr.add(new fabric.Point((padY + padX) / 2, (padY - padX) / 2));
            mb = mb.add(new fabric.Point((padX - padY) / 2, (padX + padY) / 2));
            mtr = mtr.add(new fabric.Point((padY - padX) / 2, -(padY + padX) / 2));
            this.oCoords = {
                tl: tl,
                tr: tr,
                br: br,
                bl: bl,
                ml: ml,
                mt: mt,
                mr: mr,
                mb: mb,
                mtr: mtr
            };
            this._setCornerCoords && this._setCornerCoords();
            return this;
        }
    });
})();

fabric.util.object.extend(fabric.Object.prototype, {
    sendToBack: function() {
        if (this.group) {
            fabric.StaticCanvas.prototype.sendToBack.call(this.group, this);
        } else {
            this.canvas.sendToBack(this);
        }
        return this;
    },
    bringToFront: function() {
        if (this.group) {
            fabric.StaticCanvas.prototype.bringToFront.call(this.group, this);
        } else {
            this.canvas.bringToFront(this);
        }
        return this;
    },
    sendBackwards: function(intersecting) {
        if (this.group) {
            fabric.StaticCanvas.prototype.sendBackwards.call(this.group, this, intersecting);
        } else {
            this.canvas.sendBackwards(this, intersecting);
        }
        return this;
    },
    bringForward: function(intersecting) {
        if (this.group) {
            fabric.StaticCanvas.prototype.bringForward.call(this.group, this, intersecting);
        } else {
            this.canvas.bringForward(this, intersecting);
        }
        return this;
    },
    moveTo: function(index) {
        if (this.group) {
            fabric.StaticCanvas.prototype.moveTo.call(this.group, this, index);
        } else {
            this.canvas.moveTo(this, index);
        }
        return this;
    }
});

fabric.util.object.extend(fabric.Object.prototype, {
    hasStateChanged: function() {
        return this.stateProperties.some(function(prop) {
            return this.get(prop) !== this.originalState[prop];
        }, this);
    },
    saveState: function(options) {
        this.stateProperties.forEach(function(prop) {
            this.originalState[prop] = this.get(prop);
        }, this);
        if (options && options.stateProperties) {
            options.stateProperties.forEach(function(prop) {
                this.originalState[prop] = this.get(prop);
            }, this);
        }
        return this;
    },
    setupState: function() {
        this.originalState = {};
        this.saveState();
        return this;
    }
});

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, coordProps = {
        x1: 1,
        x2: 1,
        y1: 1,
        y2: 1
    }, supportsLineDash = fabric.StaticCanvas.supports("setLineDash");
    if (fabric.Line) {
        fabric.warn("fabric.Line is already defined");
        return;
    }
    fabric.Line = fabric.util.createClass(fabric.Object, {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        initialize: function(points, options) {
            options = options || {};
            if (!points) {
                points = [ 0, 0, 0, 0 ];
            }
            this.callSuper("initialize", options);
            this.set("x1", points[0]);
            this.set("y1", points[1]);
            this.set("x2", points[2]);
            this.set("y2", points[3]);
            this._setWidthHeight(options);
        },
        _setWidthHeight: function(options) {
            options || (options = {});
            this.width = Math.abs(this.x2 - this.x1);
            this.height = Math.abs(this.y2 - this.y1);
            this.left = "left" in options ? options.left : this._getLeftToOriginX();
            this.top = "top" in options ? options.top : this._getTopToOriginY();
        },
        _set: function(key, value) {
            this.callSuper("_set", key, value);
            if (typeof coordProps[key] !== "undefined") {
                this._setWidthHeight();
            }
            return this;
        },
        _getLeftToOriginX: makeEdgeToOriginGetter({
            origin: "originX",
            axis1: "x1",
            axis2: "x2",
            dimension: "width"
        }, {
            nearest: "left",
            center: "center",
            farthest: "right"
        }),
        _getTopToOriginY: makeEdgeToOriginGetter({
            origin: "originY",
            axis1: "y1",
            axis2: "y2",
            dimension: "height"
        }, {
            nearest: "top",
            center: "center",
            farthest: "bottom"
        }),
        _render: function(ctx, noTransform) {
            ctx.beginPath();
            if (noTransform) {
                var cp = this.getCenterPoint();
                ctx.translate(cp.x - this.strokeWidth / 2, cp.y - this.strokeWidth / 2);
            }
            if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {
                var p = this.calcLinePoints();
                ctx.moveTo(p.x1, p.y1);
                ctx.lineTo(p.x2, p.y2);
            }
            ctx.lineWidth = this.strokeWidth;
            var origStrokeStyle = ctx.strokeStyle;
            ctx.strokeStyle = this.stroke || ctx.fillStyle;
            this.stroke && this._renderStroke(ctx);
            ctx.strokeStyle = origStrokeStyle;
        },
        _renderDashedStroke: function(ctx) {
            var p = this.calcLinePoints();
            ctx.beginPath();
            fabric.util.drawDashedLine(ctx, p.x1, p.y1, p.x2, p.y2, this.strokeDashArray);
            ctx.closePath();
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), this.calcLinePoints());
        },
        calcLinePoints: function() {
            var xMult = this.x1 <= this.x2 ? -1 : 1, yMult = this.y1 <= this.y2 ? -1 : 1, x1 = xMult * this.width * .5, y1 = yMult * this.height * .5, x2 = xMult * this.width * -.5, y2 = yMult * this.height * -.5;
            return {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            };
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Line.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("x1 y1 x2 y2".split(" "));
    fabric.Line.fromElement = function(element, options) {
        var parsedAttributes = fabric.parseAttributes(element, fabric.Line.ATTRIBUTE_NAMES), points = [ parsedAttributes.x1 || 0, parsedAttributes.y1 || 0, parsedAttributes.x2 || 0, parsedAttributes.y2 || 0 ];
        return new fabric.Line(points, extend(parsedAttributes, options));
    };
    fabric.Line.fromObject = function(object) {
        var points = [ object.x1, object.y1, object.x2, object.y2 ];
        return new fabric.Line(points, object);
    };
    function makeEdgeToOriginGetter(propertyNames, originValues) {
        var origin = propertyNames.origin, axis1 = propertyNames.axis1, axis2 = propertyNames.axis2, dimension = propertyNames.dimension, nearest = originValues.nearest, center = originValues.center, farthest = originValues.farthest;
        return function() {
            switch (this.get(origin)) {
              case nearest:
                return Math.min(this.get(axis1), this.get(axis2));

              case center:
                return Math.min(this.get(axis1), this.get(axis2)) + .5 * this.get(dimension);

              case farthest:
                return Math.max(this.get(axis1), this.get(axis2));
            }
        };
    }
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), pi = Math.PI, extend = fabric.util.object.extend;
    if (fabric.Circle) {
        fabric.warn("fabric.Circle is already defined.");
        return;
    }
    fabric.Circle = fabric.util.createClass(fabric.Object, {
        type: "circle",
        radius: 0,
        startAngle: 0,
        endAngle: pi * 2,
        initialize: function(options) {
            options = options || {};
            this.callSuper("initialize", options);
            this.set("radius", options.radius || 0);
            this.startAngle = options.startAngle || this.startAngle;
            this.endAngle = options.endAngle || this.endAngle;
        },
        _set: function(key, value) {
            this.callSuper("_set", key, value);
            if (key === "radius") {
                this.setRadius(value);
            }
            return this;
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), {
                radius: this.get("radius"),
                startAngle: this.startAngle,
                endAngle: this.endAngle
            });
        },
        _render: function(ctx, noTransform) {
            ctx.beginPath();
            ctx.arc(noTransform ? this.left + this.radius : 0, noTransform ? this.top + this.radius : 0, this.radius, this.startAngle, this.endAngle, false);
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        getRadiusX: function() {
            return this.get("radius") * this.get("scaleX");
        },
        getRadiusY: function() {
            return this.get("radius") * this.get("scaleY");
        },
        setRadius: function(value) {
            this.radius = value;
            this.set("width", value * 2).set("height", value * 2);
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Circle.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("cx cy r".split(" "));
    fabric.Circle.fromElement = function(element, options) {
        options || (options = {});
        var parsedAttributes = fabric.parseAttributes(element, fabric.Circle.ATTRIBUTE_NAMES);
        if (!isValidRadius(parsedAttributes)) {
            throw new Error("value of `r` attribute is required and can not be negative");
        }
        parsedAttributes.left = parsedAttributes.left || 0;
        parsedAttributes.top = parsedAttributes.top || 0;
        var obj = new fabric.Circle(extend(parsedAttributes, options));
        obj.left -= obj.radius;
        obj.top -= obj.radius;
        return obj;
    };
    function isValidRadius(attributes) {
        return "radius" in attributes && attributes.radius > 0;
    }
    fabric.Circle.fromObject = function(object) {
        return new fabric.Circle(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Triangle) {
        fabric.warn("fabric.Triangle is already defined");
        return;
    }
    fabric.Triangle = fabric.util.createClass(fabric.Object, {
        type: "triangle",
        initialize: function(options) {
            options = options || {};
            this.callSuper("initialize", options);
            this.set("width", options.width || 100).set("height", options.height || 100);
        },
        _render: function(ctx) {
            var widthBy2 = this.width / 2, heightBy2 = this.height / 2;
            ctx.beginPath();
            ctx.moveTo(-widthBy2, heightBy2);
            ctx.lineTo(0, -heightBy2);
            ctx.lineTo(widthBy2, heightBy2);
            ctx.closePath();
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        _renderDashedStroke: function(ctx) {
            var widthBy2 = this.width / 2, heightBy2 = this.height / 2;
            ctx.beginPath();
            fabric.util.drawDashedLine(ctx, -widthBy2, heightBy2, 0, -heightBy2, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, 0, -heightBy2, widthBy2, heightBy2, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, widthBy2, heightBy2, -widthBy2, heightBy2, this.strokeDashArray);
            ctx.closePath();
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Triangle.fromObject = function(object) {
        return new fabric.Triangle(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), piBy2 = Math.PI * 2, extend = fabric.util.object.extend;
    if (fabric.Ellipse) {
        fabric.warn("fabric.Ellipse is already defined.");
        return;
    }
    fabric.Ellipse = fabric.util.createClass(fabric.Object, {
        type: "ellipse",
        rx: 0,
        ry: 0,
        initialize: function(options) {
            options = options || {};
            this.callSuper("initialize", options);
            this.set("rx", options.rx || 0);
            this.set("ry", options.ry || 0);
        },
        _set: function(key, value) {
            this.callSuper("_set", key, value);
            switch (key) {
              case "rx":
                this.rx = value;
                this.set("width", value * 2);
                break;

              case "ry":
                this.ry = value;
                this.set("height", value * 2);
                break;
            }
            return this;
        },
        getRx: function() {
            return this.get("rx") * this.get("scaleX");
        },
        getRy: function() {
            return this.get("ry") * this.get("scaleY");
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), {
                rx: this.get("rx"),
                ry: this.get("ry")
            });
        },
        _render: function(ctx, noTransform) {
            ctx.beginPath();
            ctx.save();
            ctx.transform(1, 0, 0, this.ry / this.rx, 0, 0);
            ctx.arc(noTransform ? this.left + this.rx : 0, noTransform ? (this.top + this.ry) * this.rx / this.ry : 0, this.rx, 0, piBy2, false);
            ctx.restore();
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Ellipse.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("cx cy rx ry".split(" "));
    fabric.Ellipse.fromElement = function(element, options) {
        options || (options = {});
        var parsedAttributes = fabric.parseAttributes(element, fabric.Ellipse.ATTRIBUTE_NAMES);
        parsedAttributes.left = parsedAttributes.left || 0;
        parsedAttributes.top = parsedAttributes.top || 0;
        var ellipse = new fabric.Ellipse(extend(parsedAttributes, options));
        ellipse.top -= ellipse.ry;
        ellipse.left -= ellipse.rx;
        return ellipse;
    };
    fabric.Ellipse.fromObject = function(object) {
        return new fabric.Ellipse(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    if (fabric.Rect) {
        console.warn("fabric.Rect is already defined");
        return;
    }
    var stateProperties = fabric.Object.prototype.stateProperties.concat();
    stateProperties.push("rx", "ry", "x", "y");
    fabric.Rect = fabric.util.createClass(fabric.Object, {
        stateProperties: stateProperties,
        type: "rect",
        rx: 0,
        ry: 0,
        strokeDashArray: null,
        initialize: function(options) {
            options = options || {};
            this.callSuper("initialize", options);
            this._initRxRy();
        },
        _initRxRy: function() {
            if (this.rx && !this.ry) {
                this.ry = this.rx;
            } else if (this.ry && !this.rx) {
                this.rx = this.ry;
            }
        },
        _render: function(ctx, noTransform) {
            if (this.width === 1 && this.height === 1) {
                ctx.fillRect(0, 0, 1, 1);
                return;
            }
            var rx = this.rx ? Math.min(this.rx, this.width / 2) : 0, ry = this.ry ? Math.min(this.ry, this.height / 2) : 0, w = this.width, h = this.height, x = noTransform ? this.left : -this.width / 2, y = noTransform ? this.top : -this.height / 2, isRounded = rx !== 0 || ry !== 0, k = 1 - .5522847498;
            ctx.beginPath();
            ctx.moveTo(x + rx, y);
            ctx.lineTo(x + w - rx, y);
            isRounded && ctx.bezierCurveTo(x + w - k * rx, y, x + w, y + k * ry, x + w, y + ry);
            ctx.lineTo(x + w, y + h - ry);
            isRounded && ctx.bezierCurveTo(x + w, y + h - k * ry, x + w - k * rx, y + h, x + w - rx, y + h);
            ctx.lineTo(x + rx, y + h);
            isRounded && ctx.bezierCurveTo(x + k * rx, y + h, x, y + h - k * ry, x, y + h - ry);
            ctx.lineTo(x, y + ry);
            isRounded && ctx.bezierCurveTo(x, y + k * ry, x + k * rx, y, x + rx, y);
            ctx.closePath();
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        _renderDashedStroke: function(ctx) {
            var x = -this.width / 2, y = -this.height / 2, w = this.width, h = this.height;
            ctx.beginPath();
            fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x + w, y, x + w, y + h, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x + w, y + h, x, y + h, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
            ctx.closePath();
        },
        toObject: function(propertiesToInclude) {
            var object = extend(this.callSuper("toObject", propertiesToInclude), {
                rx: this.get("rx") || 0,
                ry: this.get("ry") || 0
            });
            if (!this.includeDefaultValues) {
                this._removeDefaultValues(object);
            }
            return object;
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Rect.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("x y rx ry width height".split(" "));
    fabric.Rect.fromElement = function(element, options) {
        if (!element) {
            return null;
        }
        options = options || {};
        var parsedAttributes = fabric.parseAttributes(element, fabric.Rect.ATTRIBUTE_NAMES);
        parsedAttributes.left = parsedAttributes.left || 0;
        parsedAttributes.top = parsedAttributes.top || 0;
        return new fabric.Rect(extend(options ? fabric.util.object.clone(options) : {}, parsedAttributes));
    };
    fabric.Rect.fromObject = function(object) {
        return new fabric.Rect(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    if (fabric.Polyline) {
        fabric.warn("fabric.Polyline is already defined");
        return;
    }
    fabric.Polyline = fabric.util.createClass(fabric.Object, {
        type: "polyline",
        points: null,
        minX: 0,
        minY: 0,
        initialize: function(points, options) {
            return fabric.Polygon.prototype.initialize.call(this, points, options);
        },
        _calcDimensions: function() {
            return fabric.Polygon.prototype._calcDimensions.call(this);
        },
        _applyPointOffset: function() {
            return fabric.Polygon.prototype._applyPointOffset.call(this);
        },
        toObject: function(propertiesToInclude) {
            return fabric.Polygon.prototype.toObject.call(this, propertiesToInclude);
        },
        _render: function(ctx) {
            fabric.Polygon.prototype.commonRender.call(this, ctx);
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        _renderDashedStroke: function(ctx) {
            var p1, p2;
            ctx.beginPath();
            for (var i = 0, len = this.points.length; i < len; i++) {
                p1 = this.points[i];
                p2 = this.points[i + 1] || p1;
                fabric.util.drawDashedLine(ctx, p1.x, p1.y, p2.x, p2.y, this.strokeDashArray);
            }
        },
        complexity: function() {
            return this.get("points").length;
        }
    });
    fabric.Polyline.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();
    fabric.Polyline.fromElement = function(element, options) {
        if (!element) {
            return null;
        }
        options || (options = {});
        var points = fabric.parsePointsAttribute(element.getAttribute("points")), parsedAttributes = fabric.parseAttributes(element, fabric.Polyline.ATTRIBUTE_NAMES);
        if (points === null) {
            return null;
        }
        return new fabric.Polyline(points, fabric.util.object.extend(parsedAttributes, options));
    };
    fabric.Polyline.fromObject = function(object) {
        var points = object.points;
        return new fabric.Polyline(points, object, true);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, min = fabric.util.array.min, max = fabric.util.array.max, toFixed = fabric.util.toFixed;
    if (fabric.Polygon) {
        fabric.warn("fabric.Polygon is already defined");
        return;
    }
    fabric.Polygon = fabric.util.createClass(fabric.Object, {
        type: "polygon",
        points: null,
        minX: 0,
        minY: 0,
        initialize: function(points, options) {
            options = options || {};
            this.points = points;
            this.callSuper("initialize", options);
            this._calcDimensions();
            if (!("top" in options)) {
                this.top = this.minY;
            }
            if (!("left" in options)) {
                this.left = this.minX;
            }
        },
        _calcDimensions: function() {
            var points = this.points, minX = min(points, "x"), minY = min(points, "y"), maxX = max(points, "x"), maxY = max(points, "y");
            this.width = maxX - minX || 1;
            this.height = maxY - minY || 1;
            this.minX = minX, this.minY = minY;
        },
        _applyPointOffset: function() {
            this.points.forEach(function(p) {
                p.x -= this.minX + this.width / 2;
                p.y -= this.minY + this.height / 2;
            }, this);
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), {
                points: this.points.concat()
            });
        },
        _render: function(ctx) {
            this.commonRender(ctx);
            this._renderFill(ctx);
            if (this.stroke || this.strokeDashArray) {
                ctx.closePath();
                this._renderStroke(ctx);
            }
        },
        commonRender: function(ctx) {
            var point;
            ctx.beginPath();
            if (this._applyPointOffset) {
                if (!(this.group && this.group.type === "path-group")) {
                    this._applyPointOffset();
                }
                this._applyPointOffset = null;
            }
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (var i = 0, len = this.points.length; i < len; i++) {
                point = this.points[i];
                ctx.lineTo(point.x, point.y);
            }
        },
        _renderDashedStroke: function(ctx) {
            fabric.Polyline.prototype._renderDashedStroke.call(this, ctx);
            ctx.closePath();
        },
        complexity: function() {
            return this.points.length;
        }
    });
    fabric.Polygon.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();
    fabric.Polygon.fromElement = function(element, options) {
        if (!element) {
            return null;
        }
        options || (options = {});
        var points = fabric.parsePointsAttribute(element.getAttribute("points")), parsedAttributes = fabric.parseAttributes(element, fabric.Polygon.ATTRIBUTE_NAMES);
        if (points === null) {
            return null;
        }
        return new fabric.Polygon(points, extend(parsedAttributes, options));
    };
    fabric.Polygon.fromObject = function(object) {
        return new fabric.Polygon(object.points, object, true);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), min = fabric.util.array.min, max = fabric.util.array.max, extend = fabric.util.object.extend, _toString = Object.prototype.toString, drawArc = fabric.util.drawArc, commandLengths = {
        m: 2,
        l: 2,
        h: 1,
        v: 1,
        c: 6,
        s: 4,
        q: 4,
        t: 2,
        a: 7
    }, repeatedCommands = {
        m: "l",
        M: "L"
    };
    if (fabric.Path) {
        fabric.warn("fabric.Path is already defined");
        return;
    }
    fabric.Path = fabric.util.createClass(fabric.Object, {
        type: "path",
        path: null,
        minX: 0,
        minY: 0,
        initialize: function(path, options) {
            options = options || {};
            this.setOptions(options);
            if (!path) {
                throw new Error("`path` argument is required");
            }
            var fromArray = _toString.call(path) === "[object Array]";
            this.path = fromArray ? path : path.match && path.match(/[mzlhvcsqta][^mzlhvcsqta]*/gi);
            if (!this.path) {
                return;
            }
            if (!fromArray) {
                this.path = this._parsePath();
            }
            var calcDim = this._parseDimensions();
            this.minX = calcDim.left;
            this.minY = calcDim.top;
            this.width = calcDim.width;
            this.height = calcDim.height;
            calcDim.left += this.originX === "center" ? this.width / 2 : this.originX === "right" ? this.width : 0;
            calcDim.top += this.originY === "center" ? this.height / 2 : this.originY === "bottom" ? this.height : 0;
            this.top = this.top || calcDim.top;
            this.left = this.left || calcDim.left;
            this.pathOffset = this.pathOffset || {
                x: this.minX + this.width / 2,
                y: this.minY + this.height / 2
            };
            if (options.sourcePath) {
                this.setSourcePath(options.sourcePath);
            }
        },
        _render: function(ctx) {
            var current, previous = null, subpathStartX = 0, subpathStartY = 0, x = 0, y = 0, controlX = 0, controlY = 0, tempX, tempY, tempControlX, tempControlY, l = -this.pathOffset.x, t = -this.pathOffset.y;
            if (this.group && this.group.type === "path-group") {
                l = 0;
                t = 0;
            }
            ctx.beginPath();
            for (var i = 0, len = this.path.length; i < len; ++i) {
                current = this.path[i];
                switch (current[0]) {
                  case "l":
                    x += current[1];
                    y += current[2];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "L":
                    x = current[1];
                    y = current[2];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "h":
                    x += current[1];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "H":
                    x = current[1];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "v":
                    y += current[1];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "V":
                    y = current[1];
                    ctx.lineTo(x + l, y + t);
                    break;

                  case "m":
                    x += current[1];
                    y += current[2];
                    subpathStartX = x;
                    subpathStartY = y;
                    ctx.moveTo(x + l, y + t);
                    break;

                  case "M":
                    x = current[1];
                    y = current[2];
                    subpathStartX = x;
                    subpathStartY = y;
                    ctx.moveTo(x + l, y + t);
                    break;

                  case "c":
                    tempX = x + current[5];
                    tempY = y + current[6];
                    controlX = x + current[3];
                    controlY = y + current[4];
                    ctx.bezierCurveTo(x + current[1] + l, y + current[2] + t, controlX + l, controlY + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    break;

                  case "C":
                    x = current[5];
                    y = current[6];
                    controlX = current[3];
                    controlY = current[4];
                    ctx.bezierCurveTo(current[1] + l, current[2] + t, controlX + l, controlY + t, x + l, y + t);
                    break;

                  case "s":
                    tempX = x + current[3];
                    tempY = y + current[4];
                    controlX = controlX ? 2 * x - controlX : x;
                    controlY = controlY ? 2 * y - controlY : y;
                    ctx.bezierCurveTo(controlX + l, controlY + t, x + current[1] + l, y + current[2] + t, tempX + l, tempY + t);
                    controlX = x + current[1];
                    controlY = y + current[2];
                    x = tempX;
                    y = tempY;
                    break;

                  case "S":
                    tempX = current[3];
                    tempY = current[4];
                    controlX = 2 * x - controlX;
                    controlY = 2 * y - controlY;
                    ctx.bezierCurveTo(controlX + l, controlY + t, current[1] + l, current[2] + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    controlX = current[1];
                    controlY = current[2];
                    break;

                  case "q":
                    tempX = x + current[3];
                    tempY = y + current[4];
                    controlX = x + current[1];
                    controlY = y + current[2];
                    ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    break;

                  case "Q":
                    tempX = current[3];
                    tempY = current[4];
                    ctx.quadraticCurveTo(current[1] + l, current[2] + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    controlX = current[1];
                    controlY = current[2];
                    break;

                  case "t":
                    tempX = x + current[1];
                    tempY = y + current[2];
                    if (previous[0].match(/[QqTt]/) === null) {
                        controlX = x;
                        controlY = y;
                    } else if (previous[0] === "t") {
                        controlX = 2 * x - tempControlX;
                        controlY = 2 * y - tempControlY;
                    } else if (previous[0] === "q") {
                        controlX = 2 * x - controlX;
                        controlY = 2 * y - controlY;
                    }
                    tempControlX = controlX;
                    tempControlY = controlY;
                    ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    controlX = x + current[1];
                    controlY = y + current[2];
                    break;

                  case "T":
                    tempX = current[1];
                    tempY = current[2];
                    controlX = 2 * x - controlX;
                    controlY = 2 * y - controlY;
                    ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
                    x = tempX;
                    y = tempY;
                    break;

                  case "a":
                    drawArc(ctx, x + l, y + t, [ current[1], current[2], current[3], current[4], current[5], current[6] + x + l, current[7] + y + t ]);
                    x += current[6];
                    y += current[7];
                    break;

                  case "A":
                    drawArc(ctx, x + l, y + t, [ current[1], current[2], current[3], current[4], current[5], current[6] + l, current[7] + t ]);
                    x = current[6];
                    y = current[7];
                    break;

                  case "z":
                  case "Z":
                    x = subpathStartX;
                    y = subpathStartY;
                    ctx.closePath();
                    break;
                }
                previous = current;
            }
            this._renderFill(ctx);
            this._renderStroke(ctx);
        },
        render: function(ctx, noTransform) {
            if (!this.visible) {
                return;
            }
            ctx.save();
            this._setupCompositeOperation(ctx);
            if (!noTransform) {
                this.transform(ctx);
            }
            this._setStrokeStyles(ctx);
            this._setFillStyles(ctx);
            if (this.group && this.group.type === "path-group") {
                ctx.translate(-this.group.width / 2, -this.group.height / 2);
            }
            if (this.transformMatrix) {
                ctx.transform.apply(ctx, this.transformMatrix);
            }
            this._setOpacity(ctx);
            this._setShadow(ctx);
            this.clipTo && fabric.util.clipContext(this, ctx);
            this._render(ctx, noTransform);
            this.clipTo && ctx.restore();
            this._removeShadow(ctx);
            this._restoreCompositeOperation(ctx);
            ctx.restore();
        },
        toString: function() {
            return "#<fabric.Path (" + this.complexity() + '): { "top": ' + this.top + ', "left": ' + this.left + " }>";
        },
        toObject: function(propertiesToInclude) {
            var o = extend(this.callSuper("toObject", propertiesToInclude), {
                path: this.path.map(function(item) {
                    return item.slice();
                }),
                pathOffset: this.pathOffset
            });
            if (this.sourcePath) {
                o.sourcePath = this.sourcePath;
            }
            if (this.transformMatrix) {
                o.transformMatrix = this.transformMatrix;
            }
            return o;
        },
        toDatalessObject: function(propertiesToInclude) {
            var o = this.toObject(propertiesToInclude);
            if (this.sourcePath) {
                o.path = this.sourcePath;
            }
            delete o.sourcePath;
            return o;
        },
        complexity: function() {
            return this.path.length;
        },
        _parsePath: function() {
            var result = [], coords = [], currentPath, parsed, re = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/gi, match, coordsStr;
            for (var i = 0, coordsParsed, len = this.path.length; i < len; i++) {
                currentPath = this.path[i];
                coordsStr = currentPath.slice(1).trim();
                coords.length = 0;
                while (match = re.exec(coordsStr)) {
                    coords.push(match[0]);
                }
                coordsParsed = [ currentPath.charAt(0) ];
                for (var j = 0, jlen = coords.length; j < jlen; j++) {
                    parsed = parseFloat(coords[j]);
                    if (!isNaN(parsed)) {
                        coordsParsed.push(parsed);
                    }
                }
                var command = coordsParsed[0], commandLength = commandLengths[command.toLowerCase()], repeatedCommand = repeatedCommands[command] || command;
                if (coordsParsed.length - 1 > commandLength) {
                    for (var k = 1, klen = coordsParsed.length; k < klen; k += commandLength) {
                        result.push([ command ].concat(coordsParsed.slice(k, k + commandLength)));
                        command = repeatedCommand;
                    }
                } else {
                    result.push(coordsParsed);
                }
            }
            return result;
        },
        _parseDimensions: function() {
            var aX = [], aY = [], current, previous = null, subpathStartX = 0, subpathStartY = 0, x = 0, y = 0, controlX = 0, controlY = 0, tempX, tempY, tempControlX, tempControlY, bounds;
            for (var i = 0, len = this.path.length; i < len; ++i) {
                current = this.path[i];
                switch (current[0]) {
                  case "l":
                    x += current[1];
                    y += current[2];
                    bounds = [];
                    break;

                  case "L":
                    x = current[1];
                    y = current[2];
                    bounds = [];
                    break;

                  case "h":
                    x += current[1];
                    bounds = [];
                    break;

                  case "H":
                    x = current[1];
                    bounds = [];
                    break;

                  case "v":
                    y += current[1];
                    bounds = [];
                    break;

                  case "V":
                    y = current[1];
                    bounds = [];
                    break;

                  case "m":
                    x += current[1];
                    y += current[2];
                    subpathStartX = x;
                    subpathStartY = y;
                    bounds = [];
                    break;

                  case "M":
                    x = current[1];
                    y = current[2];
                    subpathStartX = x;
                    subpathStartY = y;
                    bounds = [];
                    break;

                  case "c":
                    tempX = x + current[5];
                    tempY = y + current[6];
                    controlX = x + current[3];
                    controlY = y + current[4];
                    bounds = fabric.util.getBoundsOfCurve(x, y, x + current[1], y + current[2], controlX, controlY, tempX, tempY);
                    x = tempX;
                    y = tempY;
                    break;

                  case "C":
                    x = current[5];
                    y = current[6];
                    controlX = current[3];
                    controlY = current[4];
                    bounds = fabric.util.getBoundsOfCurve(x, y, current[1], current[2], controlX, controlY, x, y);
                    break;

                  case "s":
                    tempX = x + current[3];
                    tempY = y + current[4];
                    controlX = controlX ? 2 * x - controlX : x;
                    controlY = controlY ? 2 * y - controlY : y;
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, x + current[1], y + current[2], tempX, tempY);
                    controlX = x + current[1];
                    controlY = y + current[2];
                    x = tempX;
                    y = tempY;
                    break;

                  case "S":
                    tempX = current[3];
                    tempY = current[4];
                    controlX = 2 * x - controlX;
                    controlY = 2 * y - controlY;
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, current[1], current[2], tempX, tempY);
                    x = tempX;
                    y = tempY;
                    controlX = current[1];
                    controlY = current[2];
                    break;

                  case "q":
                    tempX = x + current[3];
                    tempY = y + current[4];
                    controlX = x + current[1];
                    controlY = y + current[2];
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, controlX, controlY, tempX, tempY);
                    x = tempX;
                    y = tempY;
                    break;

                  case "Q":
                    controlX = current[1];
                    controlY = current[2];
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, controlX, controlY, current[3], current[4]);
                    x = current[3];
                    y = current[4];
                    break;

                  case "t":
                    tempX = x + current[1];
                    tempY = y + current[2];
                    if (previous[0].match(/[QqTt]/) === null) {
                        controlX = x;
                        controlY = y;
                    } else if (previous[0] === "t") {
                        controlX = 2 * x - tempControlX;
                        controlY = 2 * y - tempControlY;
                    } else if (previous[0] === "q") {
                        controlX = 2 * x - controlX;
                        controlY = 2 * y - controlY;
                    }
                    tempControlX = controlX;
                    tempControlY = controlY;
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, controlX, controlY, tempX, tempY);
                    x = tempX;
                    y = tempY;
                    controlX = x + current[1];
                    controlY = y + current[2];
                    break;

                  case "T":
                    tempX = current[1];
                    tempY = current[2];
                    controlX = 2 * x - controlX;
                    controlY = 2 * y - controlY;
                    bounds = fabric.util.getBoundsOfCurve(x, y, controlX, controlY, controlX, controlY, tempX, tempY);
                    x = tempX;
                    y = tempY;
                    break;

                  case "a":
                    bounds = fabric.util.getBoundsOfArc(x, y, current[1], current[2], current[3], current[4], current[5], current[6] + x, current[7] + y);
                    x += current[6];
                    y += current[7];
                    break;

                  case "A":
                    bounds = fabric.util.getBoundsOfArc(x, y, current[1], current[2], current[3], current[4], current[5], current[6], current[7]);
                    x = current[6];
                    y = current[7];
                    break;

                  case "z":
                  case "Z":
                    x = subpathStartX;
                    y = subpathStartY;
                    break;
                }
                previous = current;
                bounds.forEach(function(point) {
                    aX.push(point.x);
                    aY.push(point.y);
                });
                aX.push(x);
                aY.push(y);
            }
            var minX = min(aX), minY = min(aY), maxX = max(aX), maxY = max(aY), deltaX = maxX - minX, deltaY = maxY - minY, o = {
                left: minX,
                top: minY,
                width: deltaX,
                height: deltaY
            };
            return o;
        }
    });
    fabric.Path.fromObject = function(object, callback) {
        if (typeof object.path === "string") {
            fabric.loadSVGFromURL(object.path, function(elements) {
                var path = elements[0], pathUrl = object.path;
                delete object.path;
                fabric.util.object.extend(path, object);
                path.setSourcePath(pathUrl);
                callback(path);
            });
        } else {
            callback(new fabric.Path(object.path, object));
        }
    };
    fabric.Path.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat([ "d" ]);
    fabric.Path.fromElement = function(element, callback, options) {
        var parsedAttributes = fabric.parseAttributes(element, fabric.Path.ATTRIBUTE_NAMES);
        callback && callback(new fabric.Path(parsedAttributes.d, extend(parsedAttributes, options)));
    };
    fabric.Path.async = true;
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, invoke = fabric.util.array.invoke, parentToObject = fabric.Object.prototype.toObject;
    if (fabric.PathGroup) {
        fabric.warn("fabric.PathGroup is already defined");
        return;
    }
    fabric.PathGroup = fabric.util.createClass(fabric.Path, {
        type: "path-group",
        fill: "",
        initialize: function(paths, options) {
            options = options || {};
            this.paths = paths || [];
            for (var i = this.paths.length; i--; ) {
                this.paths[i].group = this;
            }
            this.setOptions(options);
            if (options.widthAttr) {
                this.scaleX = options.widthAttr / options.width;
            }
            if (options.heightAttr) {
                this.scaleY = options.heightAttr / options.height;
            }
            this.setCoords();
            if (options.sourcePath) {
                this.setSourcePath(options.sourcePath);
            }
        },
        render: function(ctx) {
            if (!this.visible) {
                return;
            }
            ctx.save();
            var m = this.transformMatrix;
            if (m) {
                ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
            this.transform(ctx);
            this._setShadow(ctx);
            this.clipTo && fabric.util.clipContext(this, ctx);
            for (var i = 0, l = this.paths.length; i < l; ++i) {
                this.paths[i].render(ctx, true);
            }
            this.clipTo && ctx.restore();
            this._removeShadow(ctx);
            ctx.restore();
        },
        _set: function(prop, value) {
            if (prop === "fill" && value && this.isSameColor()) {
                var i = this.paths.length;
                while (i--) {
                    this.paths[i]._set(prop, value);
                }
            }
            return this.callSuper("_set", prop, value);
        },
        toObject: function(propertiesToInclude) {
            var o = extend(parentToObject.call(this, propertiesToInclude), {
                paths: invoke(this.getObjects(), "toObject", propertiesToInclude)
            });
            if (this.sourcePath) {
                o.sourcePath = this.sourcePath;
            }
            return o;
        },
        toDatalessObject: function(propertiesToInclude) {
            var o = this.toObject(propertiesToInclude);
            if (this.sourcePath) {
                o.paths = this.sourcePath;
            }
            return o;
        },
        toString: function() {
            return "#<fabric.PathGroup (" + this.complexity() + "): { top: " + this.top + ", left: " + this.left + " }>";
        },
        isSameColor: function() {
            var firstPathFill = (this.getObjects()[0].get("fill") || "").toLowerCase();
            return this.getObjects().every(function(path) {
                return (path.get("fill") || "").toLowerCase() === firstPathFill;
            });
        },
        complexity: function() {
            return this.paths.reduce(function(total, path) {
                return total + (path && path.complexity ? path.complexity() : 0);
            }, 0);
        },
        getObjects: function() {
            return this.paths;
        }
    });
    fabric.PathGroup.fromObject = function(object, callback) {
        if (typeof object.paths === "string") {
            fabric.loadSVGFromURL(object.paths, function(elements) {
                var pathUrl = object.paths;
                delete object.paths;
                var pathGroup = fabric.util.groupSVGElements(elements, object, pathUrl);
                callback(pathGroup);
            });
        } else {
            fabric.util.enlivenObjects(object.paths, function(enlivenedObjects) {
                delete object.paths;
                callback(new fabric.PathGroup(enlivenedObjects, object));
            });
        }
    };
    fabric.PathGroup.async = true;
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, min = fabric.util.array.min, max = fabric.util.array.max, invoke = fabric.util.array.invoke;
    if (fabric.Group) {
        return;
    }
    var _lockProperties = {
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        lockUniScaling: true
    };
    fabric.Group = fabric.util.createClass(fabric.Object, fabric.Collection, {
        type: "group",
        initialize: function(objects, options) {
            options = options || {};
            this._objects = objects || [];
            for (var i = this._objects.length; i--; ) {
                this._objects[i].group = this;
            }
            this.originalState = {};
            this.callSuper("initialize");
            if (options.originX) {
                this.originX = options.originX;
            }
            if (options.originY) {
                this.originY = options.originY;
            }
            this._calcBounds();
            this._updateObjectsCoords();
            if (options) {
                extend(this, options);
            }
            this.setCoords();
            this.saveCoords();
        },
        _updateObjectsCoords: function() {
            this.forEachObject(this._updateObjectCoords, this);
        },
        _updateObjectCoords: function(object) {
            var objectLeft = object.getLeft(), objectTop = object.getTop(), center = this.getCenterPoint();
            object.set({
                originalLeft: objectLeft,
                originalTop: objectTop,
                left: objectLeft - center.x,
                top: objectTop - center.y
            });
            object.setCoords();
            object.__origHasControls = object.hasControls;
            object.hasControls = false;
        },
        toString: function() {
            return "#<fabric.Group: (" + this.complexity() + ")>";
        },
        addWithUpdate: function(object) {
            this._restoreObjectsState();
            if (object) {
                this._objects.push(object);
                object.group = this;
            }
            this.forEachObject(this._setObjectActive, this);
            this._calcBounds();
            this._updateObjectsCoords();
            return this;
        },
        _setObjectActive: function(object) {
            object.set("active", true);
            object.group = this;
        },
        removeWithUpdate: function(object) {
            this._moveFlippedObject(object);
            this._restoreObjectsState();
            this.forEachObject(this._setObjectActive, this);
            this.remove(object);
            this._calcBounds();
            this._updateObjectsCoords();
            return this;
        },
        _onObjectAdded: function(object) {
            object.group = this;
        },
        _onObjectRemoved: function(object) {
            delete object.group;
            object.set("active", false);
        },
        delegatedProperties: {
            fill: true,
            opacity: true,
            fontFamily: true,
            fontWeight: true,
            fontSize: true,
            fontStyle: true,
            lineHeight: true,
            textDecoration: true,
            textAlign: true,
            backgroundColor: true
        },
        _set: function(key, value) {
            if (key in this.delegatedProperties) {
                var i = this._objects.length;
                this[key] = value;
                while (i--) {
                    this._objects[i].set(key, value);
                }
            } else {
                this[key] = value;
            }
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), {
                objects: invoke(this._objects, "toObject", propertiesToInclude)
            });
        },
        render: function(ctx) {
            if (!this.visible) {
                return;
            }
            ctx.save();
            this.clipTo && fabric.util.clipContext(this, ctx);
            for (var i = 0, len = this._objects.length; i < len; i++) {
                this._renderObject(this._objects[i], ctx);
            }
            this.clipTo && ctx.restore();
            ctx.restore();
        },
        _renderControls: function(ctx, noTransform) {
            this.callSuper("_renderControls", ctx, noTransform);
            for (var i = 0, len = this._objects.length; i < len; i++) {
                this._objects[i]._renderControls(ctx);
            }
        },
        _renderObject: function(object, ctx) {
            var originalHasRotatingPoint = object.hasRotatingPoint;
            if (!object.visible) {
                return;
            }
            object.hasRotatingPoint = false;
            object.render(ctx);
            object.hasRotatingPoint = originalHasRotatingPoint;
        },
        _restoreObjectsState: function() {
            this._objects.forEach(this._restoreObjectState, this);
            return this;
        },
        _moveFlippedObject: function(object) {
            var oldOriginX = object.get("originX"), oldOriginY = object.get("originY"), center = object.getCenterPoint();
            object.set({
                originX: "center",
                originY: "center",
                left: center.x,
                top: center.y
            });
            this._toggleFlipping(object);
            var newOrigin = object.getPointByOrigin(oldOriginX, oldOriginY);
            object.set({
                originX: oldOriginX,
                originY: oldOriginY,
                left: newOrigin.x,
                top: newOrigin.y
            });
            return this;
        },
        _toggleFlipping: function(object) {
            if (this.flipX) {
                object.toggle("flipX");
                object.set("left", -object.get("left"));
                object.setAngle(-object.getAngle());
            }
            if (this.flipY) {
                object.toggle("flipY");
                object.set("top", -object.get("top"));
                object.setAngle(-object.getAngle());
            }
        },
        _restoreObjectState: function(object) {
            this._setObjectPosition(object);
            object.setCoords();
            object.hasControls = object.__origHasControls;
            delete object.__origHasControls;
            object.set("active", false);
            object.setCoords();
            delete object.group;
            return this;
        },
        _setObjectPosition: function(object) {
            var center = this.getCenterPoint(), rotated = this._getRotatedLeftTop(object);
            object.set({
                angle: object.getAngle() + this.getAngle(),
                left: center.x + rotated.left,
                top: center.y + rotated.top,
                scaleX: object.get("scaleX") * this.get("scaleX"),
                scaleY: object.get("scaleY") * this.get("scaleY")
            });
        },
        _getRotatedLeftTop: function(object) {
            var groupAngle = this.getAngle() * (Math.PI / 180);
            return {
                left: -Math.sin(groupAngle) * object.getTop() * this.get("scaleY") + Math.cos(groupAngle) * object.getLeft() * this.get("scaleX"),
                top: Math.cos(groupAngle) * object.getTop() * this.get("scaleY") + Math.sin(groupAngle) * object.getLeft() * this.get("scaleX")
            };
        },
        destroy: function() {
            this._objects.forEach(this._moveFlippedObject, this);
            return this._restoreObjectsState();
        },
        saveCoords: function() {
            this._originalLeft = this.get("left");
            this._originalTop = this.get("top");
            return this;
        },
        hasMoved: function() {
            return this._originalLeft !== this.get("left") || this._originalTop !== this.get("top");
        },
        setObjectsCoords: function() {
            this.forEachObject(function(object) {
                object.setCoords();
            });
            return this;
        },
        _calcBounds: function(onlyWidthHeight) {
            var aX = [], aY = [], o;
            for (var i = 0, len = this._objects.length; i < len; ++i) {
                o = this._objects[i];
                o.setCoords();
                for (var prop in o.oCoords) {
                    aX.push(o.oCoords[prop].x);
                    aY.push(o.oCoords[prop].y);
                }
            }
            this.set(this._getBounds(aX, aY, onlyWidthHeight));
        },
        _getBounds: function(aX, aY, onlyWidthHeight) {
            var ivt = fabric.util.invertTransform(this.getViewportTransform()), minXY = fabric.util.transformPoint(new fabric.Point(min(aX), min(aY)), ivt), maxXY = fabric.util.transformPoint(new fabric.Point(max(aX), max(aY)), ivt), obj = {
                width: maxXY.x - minXY.x || 0,
                height: maxXY.y - minXY.y || 0
            };
            if (!onlyWidthHeight) {
                obj.left = minXY.x || 0;
                obj.top = minXY.y || 0;
                if (this.originX === "center") {
                    obj.left += obj.width / 2;
                }
                if (this.originX === "right") {
                    obj.left += obj.width;
                }
                if (this.originY === "center") {
                    obj.top += obj.height / 2;
                }
                if (this.originY === "bottom") {
                    obj.top += obj.height;
                }
            }
            return obj;
        },
        get: function(prop) {
            if (prop in _lockProperties) {
                if (this[prop]) {
                    return this[prop];
                } else {
                    for (var i = 0, len = this._objects.length; i < len; i++) {
                        if (this._objects[i][prop]) {
                            return true;
                        }
                    }
                    return false;
                }
            } else {
                if (prop in this.delegatedProperties) {
                    return this._objects[0] && this._objects[0].get(prop);
                }
                return this[prop];
            }
        }
    });
    fabric.Group.fromObject = function(object, callback) {
        fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
            delete object.objects;
            callback && callback(new fabric.Group(enlivenedObjects, object));
        });
    };
    fabric.Group.async = true;
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var extend = fabric.util.object.extend;
    if (!global.fabric) {
        global.fabric = {};
    }
    if (global.fabric.Image) {
        fabric.warn("fabric.Image is already defined.");
        return;
    }
    fabric.Image = fabric.util.createClass(fabric.Object, {
        type: "image",
        crossOrigin: "",
        alignX: "none",
        alignY: "none",
        meetOrSlice: "meet",
        _lastScaleX: 1,
        _lastScaleY: 1,
        initialize: function(element, options) {
            options || (options = {});
            this.filters = [];
            this.resizeFilters = [];
            this.callSuper("initialize", options);
            this._initElement(element, options);
            this._initConfig(options);
            if (options.filters) {
                this.filters = options.filters;
                this.applyFilters();
            }
        },
        getElement: function() {
            return this._element;
        },
        setElement: function(element, callback, options) {
            this._element = element;
            this._originalElement = element;
            this._initConfig(options);
            if (this.filters.length !== 0) {
                this.applyFilters(callback);
            } else if (callback) {
                callback();
            }
            return this;
        },
        setCrossOrigin: function(value) {
            this.crossOrigin = value;
            this._element.crossOrigin = value;
            return this;
        },
        getOriginalSize: function() {
            var element = this.getElement();
            return {
                width: element.width,
                height: element.height
            };
        },
        _stroke: function(ctx) {
            ctx.save();
            this._setStrokeStyles(ctx);
            ctx.beginPath();
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.closePath();
            ctx.restore();
        },
        _renderDashedStroke: function(ctx) {
            var x = -this.width / 2, y = -this.height / 2, w = this.width, h = this.height;
            ctx.save();
            this._setStrokeStyles(ctx);
            ctx.beginPath();
            fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x + w, y, x + w, y + h, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x + w, y + h, x, y + h, this.strokeDashArray);
            fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
            ctx.closePath();
            ctx.restore();
        },
        toObject: function(propertiesToInclude) {
            return extend(this.callSuper("toObject", propertiesToInclude), {
                src: this._originalElement.src || this._originalElement._src,
                filters: this.filters.map(function(filterObj) {
                    return filterObj && filterObj.toObject();
                }),
                crossOrigin: this.crossOrigin,
                alignX: this.alignX,
                alignY: this.alignY,
                meetOrSlice: this.meetOrSlice
            });
        },
        getSrc: function() {
            if (this.getElement()) {
                return this.getElement().src || this.getElement()._src;
            }
        },
        setSrc: function(src, callback, options) {
            fabric.util.loadImage(src, function(img) {
                return this.setElement(img, callback, options);
            }, this, options && options.crossOrigin);
        },
        toString: function() {
            return '#<fabric.Image: { src: "' + this.getSrc() + '" }>';
        },
        clone: function(callback, propertiesToInclude) {
            this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
        },
        applyFilters: function(callback, filters, imgElement, forResizing) {
            filters = filters || this.filters;
            imgElement = imgElement || this._originalElement;
            if (!imgElement) {
                return;
            }
            var imgEl = imgElement, canvasEl = fabric.util.createCanvasElement(), replacement = fabric.util.createImage(), _this = this;
            canvasEl.width = imgEl.width;
            canvasEl.height = imgEl.height;
            canvasEl.getContext("2d").drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
            if (filters.length === 0) {
                this._element = imgElement;
                callback && callback();
                return canvasEl;
            }
            filters.forEach(function(filter) {
                filter && filter.applyTo(canvasEl, filter.scaleX || _this.scaleX, filter.scaleY || _this.scaleY);
                if (!forResizing && filter.type === "Resize") {
                    _this.width *= filter.scaleX;
                    _this.height *= filter.scaleY;
                }
            });
            replacement.width = canvasEl.width;
            replacement.height = canvasEl.height;

            replacement.onload = function() {
                _this._element = replacement;
                !forResizing && (_this._filteredEl = replacement);
                callback && callback();
                replacement.onload = canvasEl = imgEl = null;
            };
            replacement.src = canvasEl.toDataURL("image/png");
            return canvasEl;
        },
        _render: function(ctx, noTransform) {
            var x, y, imageMargins = this._findMargins(), elementToDraw;
            x = noTransform ? this.left : -this.width / 2;
            y = noTransform ? this.top : -this.height / 2;
            if (this.meetOrSlice === "slice") {
                ctx.beginPath();
                ctx.rect(x, y, this.width, this.height);
                ctx.clip();
            }
            if (this.isMoving === false && this.resizeFilters.length && this._needsResize()) {
                this._lastScaleX = this.scaleX;
                this._lastScaleY = this.scaleY;
                elementToDraw = this.applyFilters(null, this.resizeFilters, this._filteredEl || this._originalElement, false);
            } else {
                elementToDraw = this._element;
            }
            elementToDraw && ctx.drawImage(elementToDraw, x + imageMargins.marginX, y + imageMargins.marginY, imageMargins.width, imageMargins.height);
            this._renderStroke(ctx);
        },
        _needsResize: function() {
            return this.scaleX !== this._lastScaleX || this.scaleY !== this._lastScaleY;
        },
        _findMargins: function() {
            var width = this.width, height = this.height, scales, scale, marginX = 0, marginY = 0;
            if (this.alignX !== "none" || this.alignY !== "none") {
                scales = [ this.width / this._element.width, this.height / this._element.height ];
                scale = this.meetOrSlice === "meet" ? Math.min.apply(null, scales) : Math.max.apply(null, scales);
                width = this._element.width * scale;
                height = this._element.height * scale;
                if (this.alignX === "Mid") {
                    marginX = (this.width - width) / 2;
                }
                if (this.alignX === "Max") {
                    marginX = this.width - width;
                }
                if (this.alignY === "Mid") {
                    marginY = (this.height - height) / 2;
                }
                if (this.alignY === "Max") {
                    marginY = this.height - height;
                }
            }
            return {
                width: width,
                height: height,
                marginX: marginX,
                marginY: marginY
            };
        },
        _resetWidthHeight: function() {
            var element = this.getElement();
            this.set("width", element.width);
            this.set("height", element.height);
        },
        _initElement: function(element) {
            this.setElement(fabric.util.getById(element));
            fabric.util.addClass(this.getElement(), fabric.Image.CSS_CANVAS);
        },
        _initConfig: function(options) {
            options || (options = {});
            this.setOptions(options);
            this._setWidthHeight(options);
            if (this._element && this.crossOrigin) {
                this._element.crossOrigin = this.crossOrigin;
            }
        },
        _initFilters: function(object, callback) {
            if (object.filters && object.filters.length) {
                fabric.util.enlivenObjects(object.filters, function(enlivenedObjects) {
                    callback && callback(enlivenedObjects);
                }, "fabric.Image.filters");
            } else {
                callback && callback();
            }
        },
        _setWidthHeight: function(options) {
            this.width = "width" in options ? options.width : this.getElement() ? this.getElement().width || 0 : 0;
            this.height = "height" in options ? options.height : this.getElement() ? this.getElement().height || 0 : 0;
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Image.CSS_CANVAS = "canvas-img";
    fabric.Image.prototype.getSvgSrc = fabric.Image.prototype.getSrc;
    fabric.Image.fromObject = function(object, callback) {
        fabric.util.loadImage(object.src, function(img) {
            fabric.Image.prototype._initFilters.call(object, object, function(filters) {
                object.filters = filters || [];
                var instance = new fabric.Image(img, object);
                callback && callback(instance);
            });
        }, null, object.crossOrigin);
    };
    fabric.Image.fromURL = function(url, callback, imgOptions) {
        fabric.util.loadImage(url, function(img) {
            callback(new fabric.Image(img, imgOptions));
        }, null, imgOptions && imgOptions.crossOrigin);
    };
    fabric.Image.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("x y width height preserveAspectRatio xlink:href".split(" "));
    fabric.Image.fromElement = function(element, callback, options) {
        var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES), align = "xMidYMid", meetOrSlice = "meet", alignX, alignY, aspectRatioAttrs;
        if (parsedAttributes.preserveAspectRatio) {
            aspectRatioAttrs = parsedAttributes.preserveAspectRatio.split(" ");
        }
        if (aspectRatioAttrs && aspectRatioAttrs.length) {
            meetOrSlice = aspectRatioAttrs.pop();
            if (meetOrSlice !== "meet" && meetOrSlice !== "slice") {
                align = meetOrSlice;
                meetOrSlice = "meet";
            } else if (aspectRatioAttrs.length) {
                align = aspectRatioAttrs.pop();
            }
        }
        alignX = align !== "none" ? align.slice(1, 4) : "none";
        alignY = align !== "none" ? align.slice(5, 8) : "none";
        parsedAttributes.alignX = alignX;
        parsedAttributes.alignY = alignY;
        parsedAttributes.meetOrSlice = meetOrSlice;
        fabric.Image.fromURL(parsedAttributes["xlink:href"], callback, extend(options ? fabric.util.object.clone(options) : {}, parsedAttributes));
    };
    fabric.Image.async = true;
    fabric.Image.pngCompression = 1;
})(typeof exports !== "undefined" ? exports : this);

fabric.Image.filters = fabric.Image.filters || {};

fabric.Image.filters.BaseFilter = fabric.util.createClass({
    type: "BaseFilter",
    initialize: function(options) {
        if (options) {
            this.setOptions(options);
        }
    },
    setOptions: function(options) {
        for (var prop in options) {
            this[prop] = options[prop];
        }
    },
    toObject: function() {
        return {
            type: this.type
        };
    },
    toJSON: function() {
        return this.toObject();
    }
});

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Brightness = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Brightness",
        initialize: function(options) {
            options = options || {};
            this.brightness = options.brightness || 0;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, brightness = this.brightness;
            for (var i = 0, len = data.length; i < len; i += 4) {
                data[i] += brightness;
                data[i + 1] += brightness;
                data[i + 2] += brightness;
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                brightness: this.brightness
            });
        }
    });
    fabric.Image.filters.Brightness.fromObject = function(object) {
        return new fabric.Image.filters.Brightness(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Convolute = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Convolute",
        initialize: function(options) {
            options = options || {};
            this.opaque = options.opaque;
            this.matrix = options.matrix || [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ];
            var canvasEl = fabric.util.createCanvasElement();
            this.tmpCtx = canvasEl.getContext("2d");
        },
        _createImageData: function(w, h) {
            return this.tmpCtx.createImageData(w, h);
        },
        applyTo: function(canvasEl) {
            var weights = this.matrix, context = canvasEl.getContext("2d"), pixels = context.getImageData(0, 0, canvasEl.width, canvasEl.height), side = Math.round(Math.sqrt(weights.length)), halfSide = Math.floor(side / 2), src = pixels.data, sw = pixels.width, sh = pixels.height, w = sw, h = sh, output = this._createImageData(w, h), dst = output.data, alphaFac = this.opaque ? 1 : 0;
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var sy = y, sx = x, dstOff = (y * w + x) * 4, r = 0, g = 0, b = 0, a = 0;
                    for (var cy = 0; cy < side; cy++) {
                        for (var cx = 0; cx < side; cx++) {
                            var scy = sy + cy - halfSide, scx = sx + cx - halfSide;
                            if (scy < 0 || scy > sh || scx < 0 || scx > sw) {
                                continue;
                            }
                            var srcOff = (scy * sw + scx) * 4, wt = weights[cy * side + cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff + 1] * wt;
                            b += src[srcOff + 2] * wt;
                            a += src[srcOff + 3] * wt;
                        }
                    }
                    dst[dstOff] = r;
                    dst[dstOff + 1] = g;
                    dst[dstOff + 2] = b;
                    dst[dstOff + 3] = a + alphaFac * (255 - a);
                }
            }
            context.putImageData(output, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                opaque: this.opaque,
                matrix: this.matrix
            });
        }
    });
    fabric.Image.filters.Convolute.fromObject = function(object) {
        return new fabric.Image.filters.Convolute(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.GradientTransparency = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "GradientTransparency",
        initialize: function(options) {
            options = options || {};
            this.threshold = options.threshold || 100;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, threshold = this.threshold, total = data.length;
            for (var i = 0, len = data.length; i < len; i += 4) {
                data[i + 3] = threshold + 255 * (total - i) / total;
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                threshold: this.threshold
            });
        }
    });
    fabric.Image.filters.GradientTransparency.fromObject = function(object) {
        return new fabric.Image.filters.GradientTransparency(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    fabric.Image.filters.Grayscale = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Grayscale",
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, len = imageData.width * imageData.height * 4, index = 0, average;
            while (index < len) {
                average = (data[index] + data[index + 1] + data[index + 2]) / 3;
                data[index] = average;
                data[index + 1] = average;
                data[index + 2] = average;
                index += 4;
            }
            context.putImageData(imageData, 0, 0);
        }
    });
    fabric.Image.filters.Grayscale.fromObject = function() {
        return new fabric.Image.filters.Grayscale();
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    fabric.Image.filters.Invert = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Invert",
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = data.length, i;
            for (i = 0; i < iLen; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            context.putImageData(imageData, 0, 0);
        }
    });
    fabric.Image.filters.Invert.fromObject = function() {
        return new fabric.Image.filters.Invert();
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Mask = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Mask",
        initialize: function(options) {
            options = options || {};
            this.mask = options.mask;
            this.channel = [ 0, 1, 2, 3 ].indexOf(options.channel) > -1 ? options.channel : 0;
        },
        applyTo: function(canvasEl) {
            if (!this.mask) {
                return;
            }
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, maskEl = this.mask.getElement(), maskCanvasEl = fabric.util.createCanvasElement(), channel = this.channel, i, iLen = imageData.width * imageData.height * 4;
            maskCanvasEl.width = maskEl.width;
            maskCanvasEl.height = maskEl.height;
            maskCanvasEl.getContext("2d").drawImage(maskEl, 0, 0, maskEl.width, maskEl.height);
            var maskImageData = maskCanvasEl.getContext("2d").getImageData(0, 0, maskEl.width, maskEl.height), maskData = maskImageData.data;
            for (i = 0; i < iLen; i += 4) {
                data[i + 3] = maskData[i + channel];
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                mask: this.mask.toObject(),
                channel: this.channel
            });
        }
    });
    fabric.Image.filters.Mask.fromObject = function(object, callback) {
        fabric.util.loadImage(object.mask.src, function(img) {
            object.mask = new fabric.Image(img, object.mask);
            callback && callback(new fabric.Image.filters.Mask(object));
        });
    };
    fabric.Image.filters.Mask.async = true;
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Noise = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Noise",
        initialize: function(options) {
            options = options || {};
            this.noise = options.noise || 0;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, noise = this.noise, rand;
            for (var i = 0, len = data.length; i < len; i += 4) {
                rand = (.5 - Math.random()) * noise;
                data[i] += rand;
                data[i + 1] += rand;
                data[i + 2] += rand;
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                noise: this.noise
            });
        }
    });
    fabric.Image.filters.Noise.fromObject = function(object) {
        return new fabric.Image.filters.Noise(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Pixelate = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Pixelate",
        initialize: function(options) {
            options = options || {};
            this.blocksize = options.blocksize || 4;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = imageData.height, jLen = imageData.width, index, i, j, r, g, b, a;
            for (i = 0; i < iLen; i += this.blocksize) {
                for (j = 0; j < jLen; j += this.blocksize) {
                    index = i * 4 * jLen + j * 4;
                    r = data[index];
                    g = data[index + 1];
                    b = data[index + 2];
                    a = data[index + 3];
                    for (var _i = i, _ilen = i + this.blocksize; _i < _ilen; _i++) {
                        for (var _j = j, _jlen = j + this.blocksize; _j < _jlen; _j++) {
                            index = _i * 4 * jLen + _j * 4;
                            data[index] = r;
                            data[index + 1] = g;
                            data[index + 2] = b;
                            data[index + 3] = a;
                        }
                    }
                }
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                blocksize: this.blocksize
            });
        }
    });
    fabric.Image.filters.Pixelate.fromObject = function(object) {
        return new fabric.Image.filters.Pixelate(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.RemoveWhite = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "RemoveWhite",
        initialize: function(options) {
            options = options || {};
            this.threshold = options.threshold || 30;
            this.distance = options.distance || 20;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, threshold = this.threshold, distance = this.distance, limit = 255 - threshold, abs = Math.abs, r, g, b;
            for (var i = 0, len = data.length; i < len; i += 4) {
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                if (r > limit && g > limit && b > limit && abs(r - g) < distance && abs(r - b) < distance && abs(g - b) < distance) {
                    data[i + 3] = 1;
                }
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                threshold: this.threshold,
                distance: this.distance
            });
        }
    });
    fabric.Image.filters.RemoveWhite.fromObject = function(object) {
        return new fabric.Image.filters.RemoveWhite(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    fabric.Image.filters.Sepia = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Sepia",
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = data.length, i, avg;
            for (i = 0; i < iLen; i += 4) {
                avg = .3 * data[i] + .59 * data[i + 1] + .11 * data[i + 2];
                data[i] = avg + 100;
                data[i + 1] = avg + 50;
                data[i + 2] = avg + 255;
            }
            context.putImageData(imageData, 0, 0);
        }
    });
    fabric.Image.filters.Sepia.fromObject = function() {
        return new fabric.Image.filters.Sepia();
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {});
    fabric.Image.filters.Sepia2 = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Sepia2",
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = data.length, i, r, g, b;
            for (i = 0; i < iLen; i += 4) {
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                data[i] = (r * .393 + g * .769 + b * .189) / 1.351;
                data[i + 1] = (r * .349 + g * .686 + b * .168) / 1.203;
                data[i + 2] = (r * .272 + g * .534 + b * .131) / 2.14;
            }
            context.putImageData(imageData, 0, 0);
        }
    });
    fabric.Image.filters.Sepia2.fromObject = function() {
        return new fabric.Image.filters.Sepia2();
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Tint = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Tint",
        initialize: function(options) {
            options = options || {};
            this.color = options.color || "#000000";
            this.opacity = typeof options.opacity !== "undefined" ? options.opacity : new fabric.Color(this.color).getAlpha();
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = data.length, i, tintR, tintG, tintB, r, g, b, alpha1, source;
            source = new fabric.Color(this.color).getSource();
            tintR = source[0] * this.opacity;
            tintG = source[1] * this.opacity;
            tintB = source[2] * this.opacity;
            alpha1 = 1 - this.opacity;
            for (i = 0; i < iLen; i += 4) {
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                data[i] = tintR + r * alpha1;
                data[i + 1] = tintG + g * alpha1;
                data[i + 2] = tintB + b * alpha1;
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                color: this.color,
                opacity: this.opacity
            });
        }
    });
    fabric.Image.filters.Tint.fromObject = function(object) {
        return new fabric.Image.filters.Tint(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend;
    fabric.Image.filters.Multiply = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Multiply",
        initialize: function(options) {
            options = options || {};
            this.color = options.color || "#000000";
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, iLen = data.length, i, source;
            source = new fabric.Color(this.color).getSource();
            for (i = 0; i < iLen; i += 4) {
                data[i] *= source[0] / 255;
                data[i + 1] *= source[1] / 255;
                data[i + 2] *= source[2] / 255;
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return extend(this.callSuper("toObject"), {
                color: this.color
            });
        }
    });
    fabric.Image.filters.Multiply.fromObject = function(object) {
        return new fabric.Image.filters.Multiply(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric;
    fabric.Image.filters.Blend = fabric.util.createClass({
        type: "Blend",
        initialize: function(options) {
            options = options || {};
            this.color = options.color || "#000";
            this.image = options.image || false;
            this.mode = options.mode || "multiply";
            this.alpha = options.alpha || 1;
        },
        applyTo: function(canvasEl) {
            var context = canvasEl.getContext("2d"), imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height), data = imageData.data, tr, tg, tb, r, g, b, source, isImage = false;
            if (this.image) {
                isImage = true;
                var _el = fabric.util.createCanvasElement();
                _el.width = this.image.width;
                _el.height = this.image.height;
                var tmpCanvas = new fabric.StaticCanvas(_el);
                tmpCanvas.add(this.image);
                var context2 = tmpCanvas.getContext("2d");
                source = context2.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
            } else {
                source = new fabric.Color(this.color).getSource();
                tr = source[0] * this.alpha;
                tg = source[1] * this.alpha;
                tb = source[2] * this.alpha;
            }
            for (var i = 0, len = data.length; i < len; i += 4) {
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                if (isImage) {
                    tr = source[i] * this.alpha;
                    tg = source[i + 1] * this.alpha;
                    tb = source[i + 2] * this.alpha;
                }
                switch (this.mode) {
                  case "multiply":
                    data[i] = r * tr / 255;
                    data[i + 1] = g * tg / 255;
                    data[i + 2] = b * tb / 255;
                    break;

                  case "screen":
                    data[i] = 1 - (1 - r) * (1 - tr);
                    data[i + 1] = 1 - (1 - g) * (1 - tg);
                    data[i + 2] = 1 - (1 - b) * (1 - tb);
                    break;

                  case "add":
                    data[i] = Math.min(255, r + tr);
                    data[i + 1] = Math.min(255, g + tg);
                    data[i + 2] = Math.min(255, b + tb);
                    break;

                  case "diff":
                  case "difference":
                    data[i] = Math.abs(r - tr);
                    data[i + 1] = Math.abs(g - tg);
                    data[i + 2] = Math.abs(b - tb);
                    break;

                  case "subtract":
                    var _r = r - tr, _g = g - tg, _b = b - tb;
                    data[i] = _r < 0 ? 0 : _r;
                    data[i + 1] = _g < 0 ? 0 : _g;
                    data[i + 2] = _b < 0 ? 0 : _b;
                    break;

                  case "darken":
                    data[i] = Math.min(r, tr);
                    data[i + 1] = Math.min(g, tg);
                    data[i + 2] = Math.min(b, tb);
                    break;

                  case "lighten":
                    data[i] = Math.max(r, tr);
                    data[i + 1] = Math.max(g, tg);
                    data[i + 2] = Math.max(b, tb);
                    break;
                }
            }
            context.putImageData(imageData, 0, 0);
        },
        toObject: function() {
            return {
                color: this.color,
                image: this.image,
                mode: this.mode,
                alpha: this.alpha
            };
        }
    });
    fabric.Image.filters.Blend.fromObject = function(object) {
        return new fabric.Image.filters.Blend(object);
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), pow = Math.pow, floor = Math.floor, sqrt = Math.sqrt, abs = Math.abs, max = Math.max, round = Math.round, sin = Math.sin, ceil = Math.ceil;
    fabric.Image.filters.Resize = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
        type: "Resize",
        resizeType: "hermite",
        scaleX: 0,
        scaleY: 0,
        lanczosLobes: 3,
        applyTo: function(canvasEl, scaleX, scaleY) {
            this.rcpScaleX = 1 / scaleX;
            this.rcpScaleY = 1 / scaleY;
            var oW = canvasEl.width, oH = canvasEl.height, dW = round(oW * scaleX), dH = round(oH * scaleY), imageData;
            if (this.resizeType === "sliceHack") {
                imageData = this.sliceByTwo(canvasEl, oW, oH, dW, dH);
            }
            if (this.resizeType === "hermite") {
                imageData = this.hermiteFastResize(canvasEl, oW, oH, dW, dH);
            }
            if (this.resizeType === "bilinear") {
                imageData = this.bilinearFiltering(canvasEl, oW, oH, dW, dH);
            }
            if (this.resizeType === "lanczos") {
                imageData = this.lanczosResize(canvasEl, oW, oH, dW, dH);
            }
            canvasEl.width = dW;
            canvasEl.height = dH;
            canvasEl.getContext("2d").putImageData(imageData, 0, 0);
        },
        sliceByTwo: function(canvasEl, width, height, newWidth, newHeight) {
            var context = canvasEl.getContext("2d"), imageData, multW = .5, multH = .5, signW = 1, signH = 1, doneW = false, doneH = false, stepW = width, stepH = height, tmpCanvas = fabric.util.createCanvasElement(), tmpCtx = tmpCanvas.getContext("2d");
            newWidth = floor(newWidth);
            newHeight = floor(newHeight);
            tmpCanvas.width = max(newWidth, width);
            tmpCanvas.height = max(newHeight, height);
            if (newWidth > width) {
                multW = 2;
                signW = -1;
            }
            if (newHeight > height) {
                multH = 2;
                signH = -1;
            }
            imageData = context.getImageData(0, 0, width, height);
            canvasEl.width = max(newWidth, width);
            canvasEl.height = max(newHeight, height);
            context.putImageData(imageData, 0, 0);
            while (!doneW || !doneH) {
                width = stepW;
                height = stepH;
                if (newWidth * signW < floor(stepW * multW * signW)) {
                    stepW = floor(stepW * multW);
                } else {
                    stepW = newWidth;
                    doneW = true;
                }
                if (newHeight * signH < floor(stepH * multH * signH)) {
                    stepH = floor(stepH * multH);
                } else {
                    stepH = newHeight;
                    doneH = true;
                }
                imageData = context.getImageData(0, 0, width, height);
                tmpCtx.putImageData(imageData, 0, 0);
                context.clearRect(0, 0, stepW, stepH);
                context.drawImage(tmpCanvas, 0, 0, width, height, 0, 0, stepW, stepH);
            }
            return context.getImageData(0, 0, newWidth, newHeight);
        },
        lanczosResize: function(canvasEl, oW, oH, dW, dH) {
            function lanczosCreate(lobes) {
                return function(x) {
                    if (x > lobes) {
                        return 0;
                    }
                    x *= Math.PI;
                    if (abs(x) < 1e-16) {
                        return 1;
                    }
                    var xx = x / lobes;
                    return sin(x) * sin(xx) / x / xx;
                };
            }
            function process(u) {
                var v, i, weight, idx, a, red, green, blue, alpha, fX, fY;
                center.x = (u + .5) * ratioX;
                icenter.x = floor(center.x);
                for (v = 0; v < dH; v++) {
                    center.y = (v + .5) * ratioY;
                    icenter.y = floor(center.y);
                    a = 0, red = 0, green = 0, blue = 0, alpha = 0;
                    for (i = icenter.x - range2X; i <= icenter.x + range2X; i++) {
                        if (i < 0 || i >= oW) {
                            continue;
                        }
                        fX = floor(1e3 * abs(i - center.x));
                        if (!cacheLanc[fX]) {
                            cacheLanc[fX] = {};
                        }
                        for (var j = icenter.y - range2Y; j <= icenter.y + range2Y; j++) {
                            if (j < 0 || j >= oH) {
                                continue;
                            }
                            fY = floor(1e3 * abs(j - center.y));
                            if (!cacheLanc[fX][fY]) {
                                cacheLanc[fX][fY] = lanczos(sqrt(pow(fX * rcpRatioX, 2) + pow(fY * rcpRatioY, 2)) / 1e3);
                            }
                            weight = cacheLanc[fX][fY];
                            if (weight > 0) {
                                idx = (j * oW + i) * 4;
                                a += weight;
                                red += weight * srcData[idx];
                                green += weight * srcData[idx + 1];
                                blue += weight * srcData[idx + 2];
                                alpha += weight * srcData[idx + 3];
                            }
                        }
                    }
                    idx = (v * dW + u) * 4;
                    destData[idx] = red / a;
                    destData[idx + 1] = green / a;
                    destData[idx + 2] = blue / a;
                    destData[idx + 3] = alpha / a;
                }
                if (++u < dW) {
                    return process(u);
                } else {
                    return destImg;
                }
            }
            var context = canvasEl.getContext("2d"), srcImg = context.getImageData(0, 0, oW, oH), destImg = context.getImageData(0, 0, dW, dH), srcData = srcImg.data, destData = destImg.data, lanczos = lanczosCreate(this.lanczosLobes), ratioX = this.rcpScaleX, ratioY = this.rcpScaleY, rcpRatioX = 2 / this.rcpScaleX, rcpRatioY = 2 / this.rcpScaleY, range2X = ceil(ratioX * this.lanczosLobes / 2), range2Y = ceil(ratioY * this.lanczosLobes / 2), cacheLanc = {}, center = {}, icenter = {};
            return process(0);
        },
        bilinearFiltering: function(canvasEl, w, h, w2, h2) {
            var a, b, c, d, x, y, i, j, xDiff, yDiff, chnl, color, offset = 0, origPix, ratioX = this.rcpScaleX, ratioY = this.rcpScaleY, context = canvasEl.getContext("2d"), w4 = 4 * (w - 1), img = context.getImageData(0, 0, w, h), pixels = img.data, destImage = context.getImageData(0, 0, w2, h2), destPixels = destImage.data;
            for (i = 0; i < h2; i++) {
                for (j = 0; j < w2; j++) {
                    x = floor(ratioX * j);
                    y = floor(ratioY * i);
                    xDiff = ratioX * j - x;
                    yDiff = ratioY * i - y;
                    origPix = 4 * (y * w + x);
                    for (chnl = 0; chnl < 4; chnl++) {
                        a = pixels[origPix + chnl];
                        b = pixels[origPix + 4 + chnl];
                        c = pixels[origPix + w4 + chnl];
                        d = pixels[origPix + w4 + 4 + chnl];
                        color = a * (1 - xDiff) * (1 - yDiff) + b * xDiff * (1 - yDiff) + c * yDiff * (1 - xDiff) + d * xDiff * yDiff;
                        destPixels[offset++] = color;
                    }
                }
            }
            return destImage;
        },
        hermiteFastResize: function(canvasEl, oW, oH, dW, dH) {
            var ratioW = this.rcpScaleX, ratioH = this.rcpScaleY, ratioWHalf = ceil(ratioW / 2), ratioHHalf = ceil(ratioH / 2), context = canvasEl.getContext("2d"), img = context.getImageData(0, 0, oW, oH), data = img.data, img2 = context.getImageData(0, 0, dW, dH), data2 = img2.data;
            for (var j = 0; j < dH; j++) {
                for (var i = 0; i < dW; i++) {
                    var x2 = (i + j * dW) * 4, weight = 0, weights = 0, weightsAlpha = 0, gxR = 0, gxG = 0, gxB = 0, gxA = 0, centerY = (j + .5) * ratioH;
                    for (var yy = floor(j * ratioH); yy < (j + 1) * ratioH; yy++) {
                        var dy = abs(centerY - (yy + .5)) / ratioHHalf, centerX = (i + .5) * ratioW, w0 = dy * dy;
                        for (var xx = floor(i * ratioW); xx < (i + 1) * ratioW; xx++) {
                            var dx = abs(centerX - (xx + .5)) / ratioWHalf, w = sqrt(w0 + dx * dx);
                            if (w > 1 && w < -1) {
                                continue;
                            }
                            weight = 2 * w * w * w - 3 * w * w + 1;
                            if (weight > 0) {
                                dx = 4 * (xx + yy * oW);
                                gxA += weight * data[dx + 3];
                                weightsAlpha += weight;
                                if (data[dx + 3] < 255) {
                                    weight = weight * data[dx + 3] / 250;
                                }
                                gxR += weight * data[dx];
                                gxG += weight * data[dx + 1];
                                gxB += weight * data[dx + 2];
                                weights += weight;
                            }
                        }
                    }
                    data2[x2] = gxR / weights;
                    data2[x2 + 1] = gxG / weights;
                    data2[x2 + 2] = gxB / weights;
                    data2[x2 + 3] = gxA / weightsAlpha;
                }
            }
            return img2;
        }
    });
    fabric.Image.filters.Resize.fromObject = function() {
        return new fabric.Image.filters.Resize();
    };
})(typeof exports !== "undefined" ? exports : this);

(function(global) {
    "use strict";
    var fabric = global.fabric || (global.fabric = {}), extend = fabric.util.object.extend, clone = fabric.util.object.clone, toFixed = fabric.util.toFixed, supportsLineDash = fabric.StaticCanvas.supports("setLineDash");
    if (fabric.Text) {
        fabric.warn("fabric.Text is already defined");
        return;
    }
    var stateProperties = fabric.Object.prototype.stateProperties.concat();
    stateProperties.push("fontFamily", "fontWeight", "fontSize", "text", "textDecoration", "textAlign", "fontStyle", "lineHeight", "textBackgroundColor", "useNative", "path");
    fabric.Text = fabric.util.createClass(fabric.Object, {
        _dimensionAffectingProps: {
            fontSize: true,
            fontWeight: true,
            fontFamily: true,
            textDecoration: true,
            fontStyle: true,
            lineHeight: true,
            stroke: true,
            strokeWidth: true,
            text: true
        },
        _reNewline: /\r?\n/,
        type: "text",
        fontSize: 40,
        fontWeight: "normal",
        fontFamily: "Times New Roman",
        textDecoration: "",
        textAlign: "left",
        fontStyle: "",
        lineHeight: 1.3,
        textBackgroundColor: "",
        path: null,
        useNative: true,
        stateProperties: stateProperties,
        stroke: null,
        shadow: null,
        initialize: function(text, options) {
            options = options || {};
            this.text = text;
            this.__skipDimension = true;
            this.setOptions(options);
            this.__skipDimension = false;
            this._initDimensions();
        },
        _initDimensions: function() {
            if (this.__skipDimension) {
                return;
            }
            var canvasEl = fabric.util.createCanvasElement();
            this._render(canvasEl.getContext("2d"));
        },
        toString: function() {
            return "#<fabric.Text (" + this.complexity() + '): { "text": "' + this.text + '", "fontFamily": "' + this.fontFamily + '" }>';
        },
        _render: function(ctx) {
            if (typeof Cufon === "undefined" || this.useNative === true) {
                this._renderViaNative(ctx);
            } else {
                this._renderViaCufon(ctx);
            }
        },
        _renderViaNative: function(ctx) {
            var textLines = this.text.split(this._reNewline);
            this._setTextStyles(ctx);
            this.width = this._getTextWidth(ctx, textLines);
            this.height = this._getTextHeight(ctx, textLines);
            this.clipTo && fabric.util.clipContext(this, ctx);
            this._renderTextBackground(ctx, textLines);
            this._translateForTextAlign(ctx);
            this._renderText(ctx, textLines);
            if (this.textAlign !== "left" && this.textAlign !== "justify") {
                ctx.restore();
            }
            this._renderTextDecoration(ctx, textLines);
            this.clipTo && ctx.restore();
            this._setBoundaries(ctx, textLines);
            this._totalLineHeight = 0;
        },
        _renderText: function(ctx, textLines) {
            ctx.save();
            this._setOpacity(ctx);
            this._setShadow(ctx);
            this._setupCompositeOperation(ctx);
            this._renderTextFill(ctx, textLines);
            this._renderTextStroke(ctx, textLines);
            this._restoreCompositeOperation(ctx);
            this._removeShadow(ctx);
            ctx.restore();
        },
        _translateForTextAlign: function(ctx) {
            if (this.textAlign !== "left" && this.textAlign !== "justify") {
                ctx.save();
                ctx.translate(this.textAlign === "center" ? this.width / 2 : this.width, 0);
            }
        },
        _setBoundaries: function(ctx, textLines) {
            this._boundaries = [];
            for (var i = 0, len = textLines.length; i < len; i++) {
                var lineWidth = this._getLineWidth(ctx, textLines[i]), lineLeftOffset = this._getLineLeftOffset(lineWidth);
                this._boundaries.push({
                    height: this.fontSize * this.lineHeight,
                    width: lineWidth,
                    left: lineLeftOffset
                });
            }
        },
        _setTextStyles: function(ctx) {
            this._setFillStyles(ctx);
            this._setStrokeStyles(ctx);
            ctx.textBaseline = "alphabetic";
            if (!this.skipTextAlign) {
                ctx.textAlign = this.textAlign;
            }
            ctx.font = this._getFontDeclaration();
        },
        _getTextHeight: function(ctx, textLines) {
            return this.fontSize * textLines.length * this.lineHeight;
        },
        _getTextWidth: function(ctx, textLines) {
            var maxWidth = ctx.measureText(textLines[0] || "|").width;
            for (var i = 1, len = textLines.length; i < len; i++) {
                var currentLineWidth = ctx.measureText(textLines[i]).width;
                if (currentLineWidth > maxWidth) {
                    maxWidth = currentLineWidth;
                }
            }
            return maxWidth;
        },
        _renderChars: function(method, ctx, chars, left, top) {
            ctx[method](chars, left, top);
        },
        _renderTextLine: function(method, ctx, line, left, top, lineIndex) {
            top -= this.fontSize / 4;
            if (this.textAlign !== "justify") {
                this._renderChars(method, ctx, line, left, top, lineIndex);
                return;
            }
            var lineWidth = ctx.measureText(line).width, totalWidth = this.width;
            if (totalWidth > lineWidth) {
                var words = line.split(/\s+/), wordsWidth = ctx.measureText(line.replace(/\s+/g, "")).width, widthDiff = totalWidth - wordsWidth, numSpaces = words.length - 1, spaceWidth = widthDiff / numSpaces, leftOffset = 0;
                for (var i = 0, len = words.length; i < len; i++) {
                    this._renderChars(method, ctx, words[i], left + leftOffset, top, lineIndex);
                    leftOffset += ctx.measureText(words[i]).width + spaceWidth;
                }
            } else {
                this._renderChars(method, ctx, line, left, top, lineIndex);
            }
        },
        _getLeftOffset: function() {
            return -this.width / 2;
        },
        _getTopOffset: function() {
            return -this.height / 2;
        },
        _renderTextFill: function(ctx, textLines) {
            if (!this.fill && !this._skipFillStrokeCheck) {
                return;
            }
            this._boundaries = [];
            var lineHeights = 0;
            for (var i = 0, len = textLines.length; i < len; i++) {
                var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
                lineHeights += heightOfLine;
                this._renderTextLine("fillText", ctx, textLines[i], this._getLeftOffset(), this._getTopOffset() + lineHeights, i);
            }
            if (this.shadow && !this.shadow.affectStroke) {
                this._removeShadow(ctx);
            }
        },
        _renderTextStroke: function(ctx, textLines) {
            if ((!this.stroke || this.strokeWidth === 0) && !this._skipFillStrokeCheck) {
                return;
            }
            var lineHeights = 0;
            ctx.save();
            if (this.strokeDashArray) {
                if (1 & this.strokeDashArray.length) {
                    this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
                }
                supportsLineDash && ctx.setLineDash(this.strokeDashArray);
            }
            ctx.beginPath();
            for (var i = 0, len = textLines.length; i < len; i++) {
                var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
                lineHeights += heightOfLine;
                this._renderTextLine("strokeText", ctx, textLines[i], this._getLeftOffset(), this._getTopOffset() + lineHeights, i);
            }
            ctx.closePath();
            ctx.restore();
        },
        _getHeightOfLine: function() {
            return this.fontSize * this.lineHeight;
        },
        _renderTextBackground: function(ctx, textLines) {
            this._renderTextBoxBackground(ctx);
            this._renderTextLinesBackground(ctx, textLines);
        },
        _renderTextBoxBackground: function(ctx) {
            if (!this.backgroundColor) {
                return;
            }
            ctx.save();
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this._getLeftOffset(), this._getTopOffset(), this.width, this.height);
            ctx.restore();
        },
        _renderTextLinesBackground: function(ctx, textLines) {
            if (!this.textBackgroundColor) {
                return;
            }
            ctx.save();
            ctx.fillStyle = this.textBackgroundColor;
            for (var i = 0, len = textLines.length; i < len; i++) {
                if (textLines[i] !== "") {
                    var lineWidth = this._getLineWidth(ctx, textLines[i]), lineLeftOffset = this._getLineLeftOffset(lineWidth);
                    ctx.fillRect(this._getLeftOffset() + lineLeftOffset, this._getTopOffset() + i * this.fontSize * this.lineHeight, lineWidth, this.fontSize * this.lineHeight);
                }
            }
            ctx.restore();
        },
        _getLineLeftOffset: function(lineWidth) {
            if (this.textAlign === "center") {
                return (this.width - lineWidth) / 2;
            }
            if (this.textAlign === "right") {
                return this.width - lineWidth;
            }
            return 0;
        },
        _getLineWidth: function(ctx, line) {
            return this.textAlign === "justify" ? this.width : ctx.measureText(line).width;
        },
        _renderTextDecoration: function(ctx, textLines) {
            if (!this.textDecoration) {
                return;
            }
            var halfOfVerticalBox = this._getTextHeight(ctx, textLines) / 2, _this = this;
            function renderLinesAtOffset(offset) {
                for (var i = 0, len = textLines.length; i < len; i++) {
                    var lineWidth = _this._getLineWidth(ctx, textLines[i]), lineLeftOffset = _this._getLineLeftOffset(lineWidth);
                    ctx.fillRect(_this._getLeftOffset() + lineLeftOffset, ~~(offset + i * _this._getHeightOfLine(ctx, i, textLines) - halfOfVerticalBox), lineWidth, 1);
                }
            }
            if (this.textDecoration.indexOf("underline") > -1) {
                renderLinesAtOffset(this.fontSize * this.lineHeight);
            }
            if (this.textDecoration.indexOf("line-through") > -1) {
                renderLinesAtOffset(this.fontSize * this.lineHeight - this.fontSize / 2);
            }
            if (this.textDecoration.indexOf("overline") > -1) {
                renderLinesAtOffset(this.fontSize * this.lineHeight - this.fontSize);
            }
        },
        _getFontDeclaration: function() {
            return [ this.fontStyle, this.fontWeight, this.fontSize + "px", this.fontFamily ].join(" ");
        },
        render: function(ctx, noTransform) {
            if (!this.visible) {
                return;
            }
            ctx.save();
            if (!noTransform) {
                this.transform(ctx);
            }
            var isInPathGroup = this.group && this.group.type === "path-group";
            if (isInPathGroup) {
                ctx.translate(-this.group.width / 2, -this.group.height / 2);
            }
            if (this.transformMatrix) {
                ctx.transform.apply(ctx, this.transformMatrix);
            }
            if (isInPathGroup) {
                ctx.translate(this.left, this.top);
            }
            this._render(ctx);
            ctx.restore();
        },
        toObject: function(propertiesToInclude) {
            var object = extend(this.callSuper("toObject", propertiesToInclude), {
                text: this.text,
                fontSize: this.fontSize,
                fontWeight: this.fontWeight,
                fontFamily: this.fontFamily,
                fontStyle: this.fontStyle,
                lineHeight: this.lineHeight,
                textDecoration: this.textDecoration,
                textAlign: this.textAlign,
                path: this.path,
                textBackgroundColor: this.textBackgroundColor,
                useNative: this.useNative
            });
            if (!this.includeDefaultValues) {
                this._removeDefaultValues(object);
            }
            return object;
        },
        _set: function(key, value) {
            if (key === "fontFamily" && this.path) {
                this.path = this.path.replace(/(.*?)([^\/]*)(\.font\.js)/, "$1" + value + "$3");
            }
            this.callSuper("_set", key, value);
            if (key in this._dimensionAffectingProps) {
                this._initDimensions();
                this.setCoords();
            }
        },
        complexity: function() {
            return 1;
        }
    });
    fabric.Text.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat("x y dx dy font-family font-style font-weight font-size text-decoration text-anchor".split(" "));
    fabric.Text.DEFAULT_SVG_FONT_SIZE = 16;
    fabric.Text.fromElement = function(element, options) {
        if (!element) {
            return null;
        }
        var parsedAttributes = fabric.parseAttributes(element, fabric.Text.ATTRIBUTE_NAMES);
        options = fabric.util.object.extend(options ? fabric.util.object.clone(options) : {}, parsedAttributes);
        options.top = options.top || 0;
        options.left = options.left || 0;
        if ("dx" in parsedAttributes) {
            options.left += parsedAttributes.dx;
        }
        if ("dy" in parsedAttributes) {
            options.top += parsedAttributes.dy;
        }
        if (!("fontSize" in options)) {
            options.fontSize = fabric.Text.DEFAULT_SVG_FONT_SIZE;
        }
        if (!options.originX) {
            options.originX = "left";
        }
        options.top += options.fontSize / 4;
        var text = new fabric.Text(element.textContent, options), offX = 0;
        if (text.originX === "left") {
            offX = text.getWidth() / 2;
        }
        if (text.originX === "right") {
            offX = -text.getWidth() / 2;
        }
        text.set({
            left: text.getLeft() + offX,
            top: text.getTop() - text.getHeight() / 2
        });
        return text;
    };
    fabric.Text.fromObject = function(object) {
        return new fabric.Text(object.text, clone(object));
    };
    fabric.util.createAccessors(fabric.Text);
})(typeof exports !== "undefined" ? exports : this);

window.fabric = fabric;

var exports = exports || {};

exports.fabric = fabric;

if (typeof define === "function" && define.amd) {
    define([], function() {
        return fabric;
    });
}