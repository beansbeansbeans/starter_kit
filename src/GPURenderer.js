import helpers from './helpers/helpers'
const { radToDegrees, createInterpolator } = helpers
import sharedState from './sharedState'
import mediator from './mediator'
import reglImport from 'regl'
import cameraModule from 'canvas-orbit-camera'
import mat4 from 'gl-mat4'
import { difference } from 'underscore'
import { extrusionRange } from './config'
import randomModule from './helpers/random'
const random = randomModule.random(42)

const frames = [5],
  maxArgumentCount = 1000, nTriangles = 2 * maxArgumentCount,
  buffer = 4, cameraDist = 1000,
  onResize = () => {},
  measureFPS = () => {
    const now = Date.now()
    // console.log(Math.round((iterations - iterationSnapshot) / ((now - lastNow) / 1000)))
    
    lastNow = now
    iterationSnapshot = iterations
  },
  nextIndex = () => unusedIndices.shift()

let width, height, rectWidth = 0, nextRectWidth = 0, 
  config, regl, camera, draw, 
  mouseX = -1, mouseY = -1,
  frame = 0, extrusionFrame = 0, activeFrame = 0, iterations = 0, iterationSnapshot, 
  lastNow = Date.now(), activeIndex = 0, previousActiveIndex = 0,
  state = { rectWidth, nextRectWidth, activeDirection: 0 }, animationLength = 0,
  unusedIndices = [], positions = [{}, {}], idToIndex = {},
  supports = new Float32Array(maxArgumentCount),
  constraint = new Float32Array(maxArgumentCount),
  activeStatus = new Float32Array(maxArgumentCount),
  timers = new Float32Array(maxArgumentCount)

mediator.subscribe("mousemove", data => {
  mouseX = data.x - width / 2
  mouseY = -1 * (data.y - height / 2)  
})

mediator.subscribe("mouseleave", data => {
  mouseX = -1
  mouseY = -1  
})

for(let i=0; i<maxArgumentCount; i++) unusedIndices.push(i)

for(let i=0; i<2; i++) {
  positions[i].tops = new Float32Array(maxArgumentCount)
  positions[i].left = new Float32Array(maxArgumentCount)
  positions[i].heights = new Float32Array(maxArgumentCount)
  positions[i].extrusions = new Float32Array(maxArgumentCount)
}

export default {
  initialize(opts) {
    width = sharedState.get('containerWidth')
    height = sharedState.get('containerHeight')

    regl = reglImport({ 
      extensions: ['angle_instanced_arrays', 'OES_standard_derivatives', 'EXT_shader_texture_lod'],
      container: opts.container
    })

    camera = cameraModule(opts.container.querySelector("canvas"))
    camera.distance = cameraDist
    camera.rotate([0.0, 0.0], [0.0, 0.0])

    config = opts

    let indices = []
    for (let i = 0; i < nTriangles; i++) indices[i] = i

    const indicesBuffer = regl.buffer({
      length: indices.length * 4,
      type: 'float',
      usage: 'dynamic'
    })

    draw = regl({
      frag: opts.shaders['drawRect.fs'],

      vert: opts.shaders['drawRect.vs'],

      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 1,
          dstRGB: 'one minus src alpha',
          dstAlpha: 1
        },
        equation: {
          rgb: 'add',
          alpha: 'add'
        },
        color: [1, 0, 0, 1]
      },

      uniforms: {
        extrusionRange,
        bufferSize: buffer,
        animationLength: (ctx, props) => props.animationLength,
        canvasRect: [width, height],
        iterations: (ctx, props) => props.iterations,
        frame: (ctx, props) => props.frame,
        extrusionFrame: (ctx, props) => props.extrusionFrame,
        activeFrame: (ctx, props) => props.activeFrame,
        rectWidth: (ctx, props) => props.rectWidth,
        nextRectWidth: (ctx, props) => props.nextRectWidth,
        view: (ctx, props) => props.cameraView,
        projection: ({ viewportWidth, viewportHeight }) => 
          mat4.perspective([],
                           2 * Math.atan(height / (2 * cameraDist)),
                           width / height,
                           0.01, 
                           3000),
        mousePosition: (ctx, props) => 
          ([props.mouseX, props.mouseY]),
        activeDirection: (ctx, props) => props.activeDirection
      },

      attributes: {
        corner: [ 1, 2, 3 ],

        supports: {
          buffer: regl.prop('supports'),
          divisor: 2
        },

        constraint: {
          buffer: regl.prop('constraint'),
          divisor: 2
        },

        timers: {
          buffer: regl.prop('timers'),
          divisor: 2
        },

        activeStatus: {
          buffer: regl.prop('activeStatus'),
          divisor: 2
        },

        currentLeft: {
          buffer: regl.prop('currentLeft'),
          divisor: 2
        },

        currentTop: {
          buffer: regl.prop('currentTop'),
          divisor: 2
        },

        currentHeight: {
          buffer: regl.prop('currentHeight'),
          divisor: 2
        },

        lastLeft: {
          buffer: regl.prop('lastLeft'),
          divisor: 2
        },

        lastTop: {
          buffer: regl.prop('lastTop'),
          divisor: 2
        },

        lastHeight: {
          buffer: regl.prop('lastHeight'),
          divisor: 2
        },

        index: {
          buffer: indicesBuffer,
          divisor: 1
        },

        currentExtrusion: {
          buffer: regl.prop('currentExtrusion'),
          divisor: 2
        },

        lastExtrusion: {
          buffer: regl.prop('lastExtrusion'),
          divisor: 2
        }
      },

      count: 3,

      instances: nTriangles
    })

    indicesBuffer.subdata(indices)

    regl.frame(ctx => {
      // regl.clear({ color: [255/255, 100/255, 104/255, 1] })
      regl.clear({
        color: [255/255, 248/255, 227/255, 1] 
      })

      Object.assign(state, {
        frame, extrusionFrame, iterations, activeFrame, mouseX, mouseY,
        cameraView: camera.view()
      })

      if(typeof state.lastExtrusion === 'undefined') {
        state.lastExtrusion = new Float32Array(maxArgumentCount)
        state.currentExtrusion = new Float32Array(maxArgumentCount)
      }

      draw(state)
      camera.tick()

      iterations++
      frame++
      extrusionFrame++
      activeFrame++

      if(frame === state.animationLength) mediator.publish("reconcileTree")
      if(extrusionFrame === state.animationLength) mediator.publish("extrusionAnimationComplete")
    })

    setInterval(measureFPS, 1000)

    mediator.subscribe("flip", () => {
      // return

      const currentEye = [0, 0, cameraDist], ticks = 30

      let interpolator = createInterpolator(ticks),
        cameraDistInterpolator = interpolator(cameraDist, 700),
        yEyeInterpolator = interpolator(0, 800),
        xPosInterpolator = interpolator(0, -250),
        xUpInterpolator = interpolator(0, -0.5),
        yUpInterpolator = interpolator(1, 0.25),
        zUpInterpolator = interpolator(0, 0.1),
        tick = 0

      const nudge = () => {
        camera.lookAt(
          [0, yEyeInterpolator(tick), cameraDistInterpolator(tick)] // eye
        , [xPosInterpolator(tick), 0, 0] // center
        , [xUpInterpolator(tick), yUpInterpolator(tick), zUpInterpolator(tick)] // up
        )

        if(tick < ticks) requestAnimationFrame(nudge)
        tick++
      }

      requestAnimationFrame(nudge)
    })
  },

  extrudeNode(web, arr) {
    let currentIndex = 0, lastIndex = 1, activePosition = {}, previousActivePosition = {}

    for(let i=0; i<arr.length; i++) {
      let node = arr[i].node, value = arr[i].value, index = idToIndex[node._id]

      positions[lastIndex].extrusions[index] = positions[currentIndex].extrusions[index]
      positions[currentIndex].extrusions[index] = value * random.nextDouble() * 30
      constraint[index] = node.constraintValue === true

      mediator.subscribe("extrusionAnimationComplete", () => {
        positions[lastIndex].extrusions[index] = positions[currentIndex].extrusions[index]
      }, true)

      if(i === arr.length - 1) {
        activeStatus[activeIndex] = 0
        activeStatus[previousActiveIndex] = 0

        previousActiveIndex = activeIndex
        activeStatus[previousActiveIndex] = 2
        
        activeIndex = index
        activeStatus[activeIndex] = 1

        activePosition.left = positions[0].left[activeIndex]
        activePosition.tops = positions[0].tops[activeIndex]

        previousActivePosition.left = positions[0].left[previousActiveIndex]
        previousActivePosition.tops = positions[0].tops[previousActiveIndex]
      }
    }

    state.activeStatus = activeStatus
    state.animationLength = 15
    state.constraint = constraint
    state.lastExtrusion = positions[lastIndex].extrusions
    state.currentExtrusion = positions[currentIndex].extrusions

    if(Math.abs(activePosition.left - previousActivePosition.left) > Math.abs(activePosition.tops - previousActivePosition.tops)) { // moving left or right
      if(activePosition.left < previousActivePosition.left) {
        state.activeDirection = 2
      } else {
        state.activeDirection = 0
      }
    } else { // moving top or down
      if(activePosition.tops < previousActivePosition.tops) {
        state.activeDirection = 3
      } else {
        state.activeDirection = 1
      }
    }

    activeFrame = 0
    extrusionFrame = 0
  },

  extrude(web, moralMatrix) {
    let scores = web.scoreArguments(moralMatrix),
      currentIndex = 0, lastIndex = 1

    web.traverseDF(n => {
      let index = idToIndex[n._id]

      positions[lastIndex].extrusions[index] = positions[currentIndex].extrusions[index]
      positions[currentIndex].extrusions[index] = scores[n._id]
    })

    state.animationLength = 20
    state.lastExtrusion = positions[lastIndex].extrusions
    state.currentExtrusion = positions[currentIndex].extrusions

    extrusionFrame = 0
  },

  update(web) {
    web.reconcile(width, height)

    let depth = web.getDepth(),
      currentIndex = 0, lastIndex = 1,
      traversed = []

    animationLength = frames[Math.min(depth - 1, frames.length - 1)]

    state.rectWidth = rectWidth
    rectWidth = Math.round(width / depth)
    state.nextRectWidth = rectWidth

    web.traverseDF(n => {
      if(typeof idToIndex[n._id] === 'undefined') idToIndex[n._id] = nextIndex()

      let index = idToIndex[n._id]

      positions[lastIndex].tops[index] = positions[currentIndex].tops[index]
      positions[lastIndex].left[index] = positions[currentIndex].left[index]
      positions[lastIndex].heights[index] = positions[currentIndex].heights[index]
      
      positions[currentIndex].tops[index] = n.top
      positions[currentIndex].left[index] = n.depth * rectWidth
      positions[currentIndex].heights[index] = n.height

      supports[index] = (n.supports || n.depth === 0) ? 1 : 0

      traversed.push(n._id)
    })

    let deleted = difference(Object.keys(idToIndex), traversed)
    for(let i=0; i<deleted.length; i++) {
      let index = idToIndex[deleted[i]]

      for(let i=0; i<2; i++) {
        positions[i].tops[index] = 0
        positions[i].left[index] = 0
        positions[i].heights[index] = 0
      }

      unusedIndices.push(index)
      delete idToIndex[deleted[i]]
    }

    Object.assign(state, {
      lastTop: positions[lastIndex].tops,
      lastLeft: positions[lastIndex].left,
      lastHeight: positions[lastIndex].heights,
      currentTop: positions[currentIndex].tops,
      currentLeft: positions[currentIndex].left,
      currentHeight: positions[currentIndex].heights,
      supports, constraint, timers, activeStatus, animationLength
    })

    frame = 0
  },

  flashWinners() {
    activeStatus = new Float32Array(maxArgumentCount)

    web.traverseDF(n => {
      let index = idToIndex[n._id]

      timers[index] = iterations

      if(n.value === true || n.provisionalValue === true) {
        activeStatus[index] = 3
      } else {
        activeStatus[index] = 4
      }

      return false
    })

    state.timers = timers
    state.activeStatus = activeStatus
    activeFrame = 0
  },

  resize() {
    onResize()
  }
}