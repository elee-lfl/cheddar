Canvas = cheddar.Class(CanvasNode, {

  clear : true,
  frameLoop : false,
  opacity : 1,
  frame : 0,
  elapsed : 0,
  frameDuration : 30,
  speed : 1.0,
  time : 0,
  fps : 0,
  currentRealFps : 0,
  currentFps : 0,
  fpsFrames : 30,
  startTime : 0,
  realFps : 0,
  fixedTimestep : false,
  playOnlyWhenFocused : true,
  isPlaying : true,
  redrawOnlyWhenChanged : false,
  changed : true,
  drawBoundingBoxes : false,
  cursor : 'default',

  mouseDown : false,
  mouseEvents : [],

  // absolute pixel coordinates from canvas top-left
  absoluteMouseX : null,
  absoluteMouseY : null,

  /*
    Coordinates relative to the canvas's surface scale.
    Example:
      canvas.width
      #=> 100
      canvas.style.width
      #=> '100px'
      canvas.absoluteMouseX
      #=> 50
      canvas.mouseX
      #=> 50

      canvas.style.width = '200px'
      canvas.width
      #=> 100
      canvas.absoluteMouseX
      #=> 100
      canvas.mouseX
      #=> 50
  */
  mouseX : null,
  mouseY : null,

  elementNodeZIndexCounter : 0,

  initialize : function(canvas, config) {
    if (arguments.length > 2) {
      var container = arguments[0]
      var w = arguments[1]
      var h = arguments[2]
      var config = arguments[3]
      var canvas = E.canvas(w,h)
      var canvasContainer = E('div', canvas, {style:
        {overflow:'hidden', width:w+'px', height:h+'px', position:'relative'}
      })
      this.canvasContainer = canvasContainer
      if (container)
        container.appendChild(canvasContainer)
    }
    CanvasNode.initialize.call(this, config)
    this.mouseEventStack = []
    this.canvas = canvas
    canvas.canvas = this
    this.width = this.canvas.width
    this.height = this.canvas.height
    var th = this
    this.frameHandler = function() { th.onFrame() }
    this.canvas.addEventListener('DOMNodeInserted', function(ev) {
      if (ev.target == this)
        th.addEventListeners()
    }, false)
    this.canvas.addEventListener('DOMNodeRemoved', function(ev) {
      if (ev.target == this)
        th.removeEventListeners()
    }, false)
    if (this.canvas.parentNode) this.addEventListeners()
    this.startTime = new Date().getTime()
    if (this.isPlaying)
      this.play()
  },

  // FIXME
  removeEventListeners : function() {
  },

  addEventListeners : function() {
    var th = this
    this.canvas.parentNode.addMouseEvent = function(e){
      var xy = Mouse.getRelativeCoords(this, e)
      th.absoluteMouseX = xy.x
      th.absoluteMouseY = xy.y
      var style = document.defaultView.getComputedStyle(th.canvas,"")
      var w = parseFloat(style.getPropertyValue('width'))
      var h = parseFloat(style.getPropertyValue('height'))
      th.mouseX = th.absoluteMouseX * (w / th.canvas.width)
      th.mouseY = th.absoluteMouseY * (h / th.canvas.height)
      th.addMouseEvent(th.mouseX, th.mouseY, th.mouseDown)
    }
    this.canvas.parentNode.contains = this.contains

    this.canvas.parentNode.addEventListener('mousedown', function(e) {
      th.mouseDown = true
      if (th.keyTarget != th.target) {
        if (th.keyTarget)
          th.dispatchEvent({type: 'blur', canvasTarget: th.keyTarget})
        th.keyTarget = th.target
        if (th.keyTarget)
          th.dispatchEvent({type: 'focus', canvasTarget: th.keyTarget})
      }
      this.addMouseEvent(e)
    }, true)

    this.canvas.parentNode.addEventListener('mouseup', function(e) {
      this.addMouseEvent(e)
      th.mouseDown = false
    }, true)

    this.canvas.parentNode.addEventListener('mousemove', function(e) {
      this.addMouseEvent(e)
      if (th.prevClientX == null) {
        th.prevClientX = e.clientX
        th.prevClientY = e.clientY
      }
      if (th.dragTarget) {
        var nev = document.createEvent('MouseEvents')
        nev.initMouseEvent('drag', true, true, window, e.detail,
          e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
          e.shiftKey, e.metaKey, e.button, e.relatedTarget)
        nev.canvasTarget = th.dragTarget
        nev.dx = e.clientX - th.prevClientX
        nev.dy = e.clientY - th.prevClientY
        th.dragX += nev.dx
        th.dragY += nev.dy
        th.dispatchEvent(nev)
      }
      if (!th.mouseDown) {
        if (th.dragTarget) {
          var nev = document.createEvent('MouseEvents')
          nev.initMouseEvent('dragend', true, true, window, e.detail,
            e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
            e.shiftKey, e.metaKey, e.button, e.relatedTarget)
          nev.canvasTarget = th.dragTarget
          th.dispatchEvent(nev)
          th.dragX = th.dragY = 0
          th.dragTarget = false
        }
      } else if (!th.dragTarget && th.target) {
        th.dragTarget = th.target
        var nev = document.createEvent('MouseEvents')
        nev.initMouseEvent('dragstart', true, true, window, e.detail,
          e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
          e.shiftKey, e.metaKey, e.button, e.relatedTarget)
        nev.canvasTarget = th.dragTarget
        th.dragStartX = e.clientX
        th.dragStartY = e.clientY
        th.dragX = th.dragY = 0
        th.dispatchEvent(nev)
      }
      th.prevClientX = e.clientX
      th.prevClientY = e.clientY
    }, true)

    this.canvas.parentNode.addEventListener('mouseout', function(e) {
      if (!CanvasNode.contains.call(this, e.relatedTarget))
        th.absoluteMouseX = th.absoluteMouseY = th.mouseX = th.mouseY = null
    }, true)

    var dispatch = this.dispatchEvent.bind(this)
    var types = [
      'mousemove', 'mouseover', 'mouseout',
      'click', 'dblclick',
      'mousedown', 'mouseup',
      'keypress', 'keydown', 'keyup',
      'DOMMouseScroll', 'mousewheel', 'mousemultiwheel', 'textInput',
      'focus', 'blur'
    ]
    for (var i=0; i<types.length; i++) {
      this.canvas.parentNode.addEventListener(types[i], dispatch, false)
    }
    this.keys = {}

    this.windowEventListeners = {

      keydown : function(ev) {
        if (th.keyTarget) {
          th.updateKeys(ev)
          ev.canvasTarget = th.keyTarget
          th.dispatchEvent(ev)
        }
      },

      keyup : function(ev) {
        if (th.keyTarget) {
          th.updateKeys(ev)
          ev.canvasTarget = th.keyTarget
          th.dispatchEvent(ev)
        }
      },

      // do we even want to have this?
      keypress : function(ev) {
        if (th.keyTarget) {
          ev.canvasTarget = th.keyTarget
          th.dispatchEvent(ev)
        }
      },

      blur : function(ev) {
        th.absoluteMouseX = th.absoluteMouseY = null
        if (th.playOnlyWhenFocused && th.isPlaying) {
          th.stop()
          th.__blurStop = true
        }
      },

      focus : function(ev) {
        if (th.__blurStop && !th.isPlaying) th.play()
      },

      mouseup : function(e) {
        th.mouseDown = false
        if (th.dragTarget) {
          // TODO
          // find the object that receives the drag (i.e. drop target)
          var nev = document.createEvent('MouseEvents')
          nev.initMouseEvent('dragend', true, true, window, e.detail,
            e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
            e.shiftKey, e.metaKey, e.button, e.relatedTarget)
          nev.canvasTarget = th.dragTarget
          th.dispatchEvent(nev)
          th.dragTarget = false
        }
        if (!th.canvas.parentNode.contains(e.target)) {
          var rv = th.dispatchEvent(e)
          if (th.keyTarget) {
            th.dispatchEvent({type: 'blur', canvasTarget: th.keyTarget})
            th.keyTarget = null
          }
          return rv
        }
      },

      mousemove : function(ev) {
        if (th.__blurStop && !th.isPlaying) th.play()
        if (!th.canvas.parentNode.contains(ev.target) && th.mouseDown)
          return th.dispatchEvent(ev)
      }

    }

    this.canvas.parentNode.addEventListener('DOMNodeRemoved', function(ev) {
      if (ev.target == this)
        th.removeWindowEventListeners()
    }, false)
    this.canvas.parentNode.addEventListener('DOMNodeInserted', function(ev) {
      if (ev.target == this)
        th.addWindowEventListeners()
    }, false)
    if (this.canvas.parentNode.parentNode) this.addWindowEventListeners()
  },

  updateKeys : function(ev) {
    this.keys.shift = ev.shiftKey
    this.keys.ctrl = ev.ctrlKey
    this.keys.alt = ev.altKey
    this.keys.meta = ev.metaKey
    var state = (ev.type == 'keydown')
    switch (ev.keyCode) {
      case 37: this.keys.left = state; break
      case 38: this.keys.up = state; break
      case 39: this.keys.right = state; break
      case 40: this.keys.down = state; break
      case 32: this.keys.space = state; break
      case 13: this.keys.enter = state; break
      case 9: this.keys.tab = state; break
      case 8: this.keys.backspace = state; break
      case 16: this.keys.shift = state; break
      case 17: this.keys.ctrl = state; break
      case 18: this.keys.alt = state; break
    }
    this.keys[ev.keyCode] = state
  },

  addWindowEventListeners : function() {
    for (var i in this.windowEventListeners)
      window.addEventListener(i, this.windowEventListeners[i], false)
  },

  removeWindowEventListeners : function() {
    for (var i in this.windowEventListeners)
      window.removeEventListener(i, this.windowEventListeners[i], false)
  },

  addMouseEvent : function(x,y,mouseDown) {
    var a = this.allocMouseEvent()
    a[0] = x
    a[1] = y
    a[2] = mouseDown
    this.mouseEvents.push(a)
  },

  allocMouseEvent : function() {
    if (this.mouseEventStack.length > 0) {
      return this.mouseEventStack.pop()
    } else {
      return [null, null, null]
    }
  },

  freeMouseEvent : function(ev) {
    this.mouseEventStack.push(ev)
    if (this.mouseEventStack.length > 100)
      this.mouseEventStack.splice(0,this.mouseEventStack.length)
  },

  clearMouseEvents : function() {
    while (this.mouseEvents.length > 0)
      this.freeMouseEvent(this.mouseEvents.pop())
  },

  createFrameLoop : function() {
    var self = this;
    var fl = {
      running : true,
      stop : function() {
        this.running = false;
      },
      run : function() {
        if (fl.running) {
          self.onFrame();
          requestAnimFrame(fl.run, self.canvas);
        }
      }
    };
    requestAnimFrame(fl.run, this.canvas);
    return fl;
  },

  /**
    Start frame loop.

    The frame loop is an interval, where #onFrame is called every
    #frameDuration milliseconds.
    */
  play : function() {
    this.stop();
    this.realTime = new Date().getTime();
    this.frameLoop = this.createFrameLoop();
    this.isPlaying = true;
  },

  /**
    Stop frame loop.
    */
  stop : function() {
    this.__blurStop = false;
    if (this.frameLoop) {
      this.frameLoop.stop();
      this.frameLoop = null;
    }
    this.isPlaying = false;
  },

  dispatchEvent : function(ev) {
    var rv = CanvasNode.prototype.dispatchEvent.call(this, ev)
    if (ev.cursor) {
      if (this.canvas.style.cursor != ev.cursor)
        this.canvas.style.cursor = ev.cursor
    } else {
      if (this.canvas.style.cursor != this.cursor)
        this.canvas.style.cursor = this.cursor
    }
    return rv
  },

  /**
    The frame loop function. Called every #frameDuration milliseconds.
    Takes an optional external time parameter (for syncing Canvases with each
    other, e.g. when using a Canvas as an image.)

    If the time parameter is given, the second parameter is used as the frame
    time delta (i.e. the time elapsed since last frame.)

    If time or timeDelta is not given, the canvas computes its own timeDelta.

    @param time The external time. Optional.
    @param timeDelta Time since last frame in milliseconds. Optional.
    */
  onFrame : function(time, timeDelta) {
    this.elementNodeZIndexCounter = 0
    var ctx = this.getContext()
    try {
      var realTime = new Date().getTime()
      this.currentRealElapsed = (realTime - this.realTime)
      this.currentRealFps = 1000 / this.currentRealElapsed
      var dt = this.frameDuration * this.speed
      if (!this.fixedTimestep)
        dt = this.currentRealElapsed * this.speed
      this.realTime = realTime
      if (time != null) {
        this.time = time
        if (timeDelta)
          dt = timeDelta
      } else {
        this.time += dt
      }
      this.previousTarget = this.target
      this.target = null
      if (this.catchMouse)
        this.handlePick(ctx)
      if (this.previousTarget != this.target) {
        if (this.previousTarget) {
          var nev = document.createEvent('MouseEvents')
          nev.initMouseEvent('mouseout', true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null)
          nev.canvasTarget = this.previousTarget
          this.dispatchEvent(nev)
        }
        if (this.target) {
          var nev = document.createEvent('MouseEvents')
          nev.initMouseEvent('mouseover', true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null)
          nev.canvasTarget = this.target
          this.dispatchEvent(nev)
        }
      }
      this.handleUpdate(this.time, dt)
      this.clearMouseEvents()
      if (!this.redrawOnlyWhenChanged || this.changed) {
        try {
          this.handleDraw(ctx)
        } catch(e) {
          console.log(e)
          throw(e)
        }
        this.changed = false
      }
      this.currentElapsed = (new Date().getTime() - this.realTime)
      this.elapsed += this.currentElapsed
      this.currentFps = 1000 / this.currentElapsed
      this.frame++
      if (this.frame % this.fpsFrames == 0) {
        this.fps = this.fpsFrames*1000 / (this.elapsed)
        this.realFps = this.fpsFrames*1000 / (new Date().getTime() - this.startTime)
        this.elapsed = 0
        this.startTime = new Date().getTime()
      }
    } catch(e) {
      if (ctx) {
        // screwed up, context is borked
        try {
          // FIXME don't be stupid
          for (var i=0; i<1000; i++)
            ctx.restore()
        } catch(er) {}
      }
      delete this.context
      throw(e)
    }
  },

  /**
    Returns the canvas drawing context object.

    @return Canvas drawing context
    */
  getContext : function() {
    if (this.useMockContext)
      return this.getMockContext()
    else
      return this.get2DContext()
  },

  /**
    Gets and returns an augmented canvas 2D drawing context.

    The canvas 2D context is augmented by setter functions for all
    its instance variables, making it easier to record canvas operations in
    a cross-browser fashion.
    */
  get2DContext : function() {
    if (!this.context) {
      var ctx = CanvasSupport.getContext(this.canvas, '2d')
      this.context = ctx
    }
    return this.context
  },

  /**
    Creates and returns a mock drawing context.

    @return Mock drawing context
    */
  getMockContext : function() {
    if (!this.fakeContext) {
      var ctx = this.get2DContext()
      this.fakeContext = {}
      var f = function(){ return this }
      for (var i in ctx) {
        if (typeof(ctx[i]) == 'function')
          this.fakeContext[i] = f
        else
          this.fakeContext[i] = ctx[i]
      }
      this.fakeContext.isMockObject = true
      this.fakeContext.addColorStop = f
    }
    return this.fakeContext
  },



  /**
    Canvas drawPickingPath uses the canvas rectangle as its path.

    @param ctx Canvas drawing context
    */
  drawPickingPath : function(ctx) {
    ctx.rect(0,0, this.canvas.width, this.canvas.height)
  },

  isPointInPath : function(x,y) {
    return ((x >= 0) && (x <= this.canvas.width) && (y >= 0) && (y <= this.canvas.height))
  },

  /**
    Sets globalAlpha to this.opacity and clears the canvas if #clear is set to
    true. If #fill is also set to true, fills the canvas rectangle instead of
    clearing (using #fillStyle as the color.)

    @param ctx Canvas drawing context
    */
  draw : function(ctx) {
    ctx.setGlobalAlpha( this.opacity )
    if (this.clear) {
      if (ctx.fillOn) {
        ctx.beginPath()
        ctx.rect(0,0, this.canvas.width, this.canvas.height)
        ctx.fill()
      } else {
        ctx.clearRect(0,0, this.canvas.width, this.canvas.height)
      }
    }
    // set default fill and stroke for the canvas contents
    ctx.fillStyle = 'black'
    ctx.strokeStyle = 'black'
    ctx.fillOn = false
    ctx.strokeOn = false
  }
})