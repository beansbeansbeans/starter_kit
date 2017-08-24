import helpers from './helpers/helpers'
const { radToDegrees, createInterpolator, viewportToLocal, intersectTriangle } = helpers
import sharedState from './sharedState'
import mediator from './mediator'
import reglImport from 'regl'
import cameraModule from 'canvas-orbit-camera'
import mat4 from 'gl-mat4'
import vec3 from 'gl-vec3'
import { difference } from 'underscore'
import { extrusionRange } from './config'
import randomModule from './helpers/random'
const random = randomModule.random(42)

const frames = [10],
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
  currentIndex = 0, lastIndex = 1, 
  projectionMatrix = new Float32Array(16),
  mouseX = -1, mouseY = -1, toLocal,
  frame = 0, extrusionFrame = 0, activeFrame = 0, iterations = 0, iterationSnapshot, 
  lastNow = Date.now(), activeIndex = 0, previousActiveIndex = 0,
  state = { rectWidth, nextRectWidth, activeDirection: 0, selectedIndex: -1 }, animationLength = 0,
  unusedIndices = [], positions = [{}, {}], idToIndex = {},
  supports = new Float32Array(maxArgumentCount),
  constraint = new Float32Array(maxArgumentCount),
  activeStatus = new Float32Array(maxArgumentCount),
  timers = new Float32Array(maxArgumentCount)

mediator.subscribe("mousemove", data => {
  mouseX = 2 * data.x / width - 1
  mouseY = -2 * data.y / height + 1  
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

    toLocal = viewportToLocal(width, height)

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
        selectedIndex: (ctx, props) => props.selectedIndex,
        bufferSize: buffer,
        animationLength: (ctx, props) => props.animationLength,
        canvasRect: [width, height],
        iterations: (ctx, props) => props.iterations,
        frame: (ctx, props) => props.frame,
        extrusionFrame: (ctx, props) => props.extrusionFrame,
        activeFrame: (ctx, props) => props.activeFrame,
        rectWidth: (ctx, props) => props.rectWidth,
        nextRectWidth: (ctx, props) => props.nextRectWidth,
        view: (ctx, props) => camera.view(),
        projection: ({ viewportWidth, viewportHeight }) => 
          mat4.perspective(projectionMatrix,
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

    camera.lookAt([0, 800, 700],
      [-250, 0, 0],
      [-0.5, 0.25, 0.1])
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
      constraint[index] = n.extraData.user === true ? 1 : 0

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

  activateNode(id) {
    let index = idToIndex[id]

    activeStatus[previousActiveIndex] = 0
    activeStatus[index] = 1

    previousActiveIndex = index
    state.activeStatus = activeStatus
  },

  deactivateNode(id) {
    if(typeof id !== 'undefined') {
      let index = idToIndex[id]
      activeStatus[index] = 0      
    } else {
      activeStatus[previousActiveIndex] = 0
    }
    state.activeStatus = activeStatus
  },

  resize() {
    onResize()
  }
}