/*
CHEDDAR Canvas Animation Tools

Copyright (C) 2011  Eric Lee / Left Field Labs

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


/**
 * @fileoverview Bootstrap for the cheddar Library.
 */

 /**
  * Base namespace for cheddar tools.  Checks to see cheddar is
  * already defined in the current scope before assigning to prevent
  * clobbering if base.js is loaded more than once.
  *
  * @const
  */
var cheddar = cheddar || {}; // Identifies this file as the cheddar base.
var included_files = [];
 /**
  * Reference to the global context.  In most cases this will be 'window'.
  */
cheddar.global = this;


window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
})();

/**
  Delete the first instance of obj from the array.

  @param obj The object to delete
  @return true on success, false if array contains no instances of obj
  @type boolean
  @addon
  */

if (!Array.prototype.deleteFirst) {
    Array.prototype.deleteFirst = function(obj) {
      for (var i=0, ii=this.length; i<ii; i++) {
        if (this[i] == obj) {
          this.splice(i,1);
          return true;
        }
      }
      return false;
    }
}
if (!Array.prototype.stableSort) {
    Array.prototype.stableSort = function(cmp) {
      // hack to work around Chrome's qsort
      for (var i=0, ii=this.length; i<ii; i++) {
        this[i].__arrayPos = i;
      }
      return this.sort(Array.__stableSorter(cmp));
    }
    Array.__stableSorter = function(cmp) {
      return (function(c1, c2) {
        var r = cmp(c1,c2);
        if (!r) { // hack to work around Chrome's qsort
          return c1.__arrayPos - c2.__arrayPos;
        }
        return r;
      });
    }
}

/**
  Compares two arrays for equality. Returns true if the arrays are equal.
  */
Array.prototype.equals = function(array) {
  if (!array) return false;
  if (this.length != array.length) return false;
  for (var i=0, ii=this.length; i<ii; i++) {
    var a = this[i];
    var b = array[i];
    if (a.equals && typeof(a.equals) == 'function') {
      if (!a.equals(b)) return false;
    } else if (a != b) {
      return false;
    }
  }
  return true;
}

/**
  Rotates the first element of an array to be the last element.
  Rotates last element to be the first element when backToFront is true.

  @param {boolean} backToFront Whether to move the last element to the front or not
  @return The last element when backToFront is false, the first element when backToFront is true
  @addon
  */
Array.prototype.rotate = function(backToFront) {
  if (backToFront) {
    this.unshift(this.pop());
    return this[0];
  } else {
    this.push(this.shift());
    return this[this.length-1];
  }
}
/**
  Returns a random element from the array.

  @return A random element
  @addon
 */
Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
}

Array.prototype.flatten = function() {
  var a = [];
  for (var i=0, ii=this.length; i<ii; i++) {
    var e = this[i];
    if (e.flatten) {
      var ef = e.flatten();
      for (var j=0; j<ef.length; j++) {
        a[a.length] = ef[j];
      }
    } else {
      a[a.length] = e;
    }
  }
  return a;
}

Array.prototype.take = function() {
  var a = [];
  for (var i=0, ii=this.length; i<ii; i++) {
    var e = [];
    for (var j=0; j<arguments.length; j++) {
      e[j] = this[i][arguments[j]];
    }
    a[i] = e;
  }
  return a;
}

if (!Array.prototype.pluck) {
  Array.prototype.pluck = function(key) {
    var a = [];
    for (var i=0, ii=this.length; i<ii; i++) {
      a[i] = this[i][key];
    }
    return a;
  }
}

Array.prototype.set = function(key, value) {
  for (var i=0, ii=this.length; i<ii; i++) {
    this[i][key] = value;
  }
}

Array.prototype.allWith = function() {
  var a = [];
  topLoop:
  for (var i=0, ii=this.length; i<ii; i++) {
    var e = this[i];
    for (var j=0; j<arguments.length; j++) {
      if (!this[i][arguments[j]]);
        continue topLoop;
    }
    a[a.length] = e;
  }
  return a;
}

// some common helper methods

if (!Function.prototype.bind) {
  /**
    Creates a function that calls this function in the scope of the given
    object.

      var obj = { x: 'obj' }
      var f = function() { return this.x }
      window.x = 'window'
      f()
      // => 'window'
      var g = f.bind(obj)
      g()
      // => 'obj'

    @param object Object to bind this function to
    @return Function bound to object
    @addon
    */
  Function.prototype.bind = function(object) {
    var t = this;
    return function() {
      return t.apply(object, arguments);
    }
  }
}

if (!Array.prototype.last) {
  /**
    Returns the last element of the array.

    @return The last element of the array
    @addon
    */
  Array.prototype.last = function() {
    return this[this.length-1];
  }
}
if (!Array.prototype.indexOf) {
  /**
    Returns the index of obj if it is in the array.
    Returns -1 otherwise.

    @param obj The object to find from the array.
    @return The index of obj or -1 if obj isn't in the array.
    @addon
    */
  Array.prototype.indexOf = function(obj) {
    for (var i=0, ii=this.length; i<ii; i++)
      if (obj == this[i]) return i;
    return -1;
  }
}
if (!Array.prototype.includes) {
  /**
    Returns true if obj is in the array.
    Returns false if it isn't.

    @param obj The object to find from the array.
    @return True if obj is in the array, false if it isn't
    @addon
    */
  Array.prototype.includes = function(obj) {
    return (this.indexOf(obj) >= 0);
  }
}
/**
  Iterate function f over each element of the array and return an array
  of the return values.

  @param f Function to apply to each element
  @return An array of return values from applying f on each element of the array
  @type Array
  @addon
  */
Array.prototype.map = function(f) {
  var na = new Array(this.length);
  if (f)
    for (var i=0, ii=this.length; i<ii; i++) na[i] = f(this[i], i, this);
  else
    for (var i=0, ii=this.length; i<ii; i++) na[i] = this[i];
  return na;
}
Array.prototype.forEach = function(f) {
  for (var i=0, ii=this.length; i<ii; i++) f(this[i], i, this);
}
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(f, s) {
    var i = 0;
    if (arguments.length == 1) {
      s = this[0];
      i++;
    }
    for(var i=0,ii=this.length; i<ii; i++) {
      s = f(s, this[i], i, this);
    }
    return s
  }
}
if (!Array.prototype.find) {
  Array.prototype.find = function(f) {
    for (var i=0, ii=this.length; i<ii; i++) {
      if (f(this[i], i, this)) return this[i];
    }
  }
}

if (!String.prototype.capitalize) {
  /**
    Returns a copy of this string with the first character uppercased.

    @return Capitalized version of the string
    @type String
    @addon
    */
  String.prototype.capitalize = function() {
    return this.replace(/^./, this.slice(0,1).toUpperCase())
  }
}

if (!String.prototype.escape) {
  /**
    Returns a version of the string that can be used as a string literal.

    @return Copy of string enclosed in double-quotes, with double-quotes
            inside string escaped.
    @type String
    @addon
    */
  String.prototype.escape = function() {
    return '"' + this.replace(/"/g, '\\"') + '"'
  }
}
if (!String.prototype.splice) {
  String.prototype.splice = function(start, count, replacement) {
    return this.slice(0,start) + replacement + this.slice(start+count)
  }
}
if (!String.prototype.strip) {
  /**
    Returns a copy of the string with preceding and trailing whitespace
    removed.

    @return Copy of string sans surrounding whitespace.
    @type String
    @addon
    */
  String.prototype.strip = function() {
    return this.replace(/^\s+|\s+$/g, '')
  }
}

if (!window['$A']) {
  /**
    Creates a new array from an object with #length.
    */
  $A = function(obj) {
    var a = new Array(obj.length)
    for (var i=0; i<obj.length; i++)
      a[i] = obj[i]
    return a
  }
}

if (!window['$']) {
  $ = function(id) {
    return document.getElementById(id)
  }
}



/**
  Shortcut for document.createTextNode.

  @param {String} text The text for the text node
  @return The created text node
  */
T = function(text) {
  return document.createTextNode(text)
}

/**
  Merges the src object's attributes with the dst object, ignoring errors.

  @param dst The destination object
  @param src The source object
  @return The dst object
  @addon
  */
Object.forceExtend = function(dst, src) {
  for (var i in src) {
    try{ dst[i] = src[i] } catch(e) {}
  }
  return dst
}
// In case Object.extend isn't defined already, set it to Object.forceExtend.
if (!Object.extend)
  Object.extend = Object.forceExtend

/**
  Merges the src object's attributes with the dst object, preserving all dst
  object's current attributes.

  @param dst The destination object
  @param src The source object
  @return The dst object
  @addon
  */
Object.conditionalExtend = function(dst, src) {
  for (var i in src) {
    if (dst[i] == null)
      dst[i] = src[i]
  }
  return dst
}

/**
  Creates and returns a shallow copy of the src object.

  @param src The source object
  @return A clone of the src object
  @addon
  */
Object.clone = function(src) {
  if (!src || src == true)
    return src
  switch (typeof(src)) {
    case 'string':
      return Object.extend(src+'', src)
      break
    case 'number':
      return src
      break
    case 'function':
      obj = eval(src.toSource())
      return Object.extend(obj, src)
      break
    case 'object':
      if (src instanceof Array) {
        return Object.extend([], src)
      } else {
        return Object.extend({}, src)
      }
      break
  }
}

/**
  Creates and returns an Image object, with source URL set to src and
  onload handler set to onload.

  @param {String} src The source URL for the image
  @param {Function} onload The onload handler for the image
  @return The created Image object
  @type {Image}
  */
Object.loadImage = function(src, onload) {
  var img = new Image()
  if (onload)
    img.onload = onload
  img.src = src
  return img
}

/**
  Returns true if image is fully loaded and ready for use.

  @param image The image to check
  @return Whether the image is loaded or not
  @type {boolean}
  @addon
  */
Object.isImageLoaded = function(image) {
  if (image.tagName == 'CANVAS') return true
  if (!image.complete) return false
  if (image.naturalWidth == null) return true
  return !!image.naturalWidth
}

/**
  Sums two objects.
  */
Object.sum = function(a,b) {
  if (a instanceof Array) {
    if (b instanceof Array) {
      var ab = []
      for (var i=0; i<a.length; i++) {
        ab[i] = a[i] + b[i]
      }
      return ab
    } else {
      return a.map(function(v){ return v + b })
    }
  } else if (b instanceof Array) {
    return b.map(function(v){ return v + a })
  } else {
    return a + b
  }
}

/**
  Substracts b from a.
  */
Object.sub = function(a,b) {
  if (a instanceof Array) {
    if (b instanceof Array) {
      var ab = []
      for (var i=0; i<a.length; i++) {
        ab[i] = a[i] - b[i]
      }
      return ab
    } else {
      return a.map(function(v){ return v - b })
    }
  } else if (b instanceof Array) {
    return b.map(function(v){ return a - v })
  } else {
    return a - b
  }
}



cheddar.Class = function() {
  var c = function() {
    this.initialize.apply(this, arguments)
  }
  c.ancestors = $A(arguments)
  c.prototype = {}
  for(var i = 0; i<arguments.length; i++) {
    var a = arguments[i];
    if (a.prototype) {
      Object.extend(c.prototype, a.prototype);
    } else {
      Object.extend(c.prototype, a);
    }
  }
  Object.extend(c, c.prototype);
  return c;
}




