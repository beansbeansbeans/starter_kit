import helpers from './helpers/helpers'
const { radToDegrees, createInterpolator } = helpers
import sharedState from './sharedState'
import mediator from './mediator'
import reglImport from 'regl'
import cameraModule from 'canvas-orbit-camera'
import mat4 from 'gl-mat4'
import { difference } from 'underscore'
import randomModule from './helpers/random'
const random = randomModule.random(42)

let width, height, config, regl, camera, mouseX = -1, mouseY = -1, tree, draw, rectWidth = 0, nextRectWidth = 0, frame = 0, iterations = 0, updateIterator = 0, lastNow = Date.now(), iterationSnapshot, state = {
  rectWidth, nextRectWidth
}

let animationLength = 0
const frames = [1]

const onResize = () => {}

const measureFPS = () => {
  const now = Date.now()

  // console.log(Math.round((iterations - iterationSnapshot) / ((now - lastNow) / 1000)))
  
  lastNow = now
  iterationSnapshot = iterations
}

mediator.subscribe("mousemove", data => {
  mouseX = data.x - width / 2
  mouseY = -1 * (data.y - height / 2)  
})

mediator.subscribe("mouseleave", data => {
  mouseX = -1
  mouseY = -1  
})

const maxArgumentCount = 1000
const nTriangles = 2 * maxArgumentCount // max # arguments
const buffer = 2
const cameraDist = 1000

let unusedIndices = []
for(let i=0; i<maxArgumentCount; i++) unusedIndices.push(i)
const nextIndex = () => unusedIndices.shift()

let supports = new Float32Array(maxArgumentCount)
let tops = new Float32Array(maxArgumentCount)
let tops2 = new Float32Array(maxArgumentCount)
let left = new Float32Array(maxArgumentCount)
let left2 = new Float32Array(maxArgumentCount)
let heights = new Float32Array(maxArgumentCount)
let heights2 = new Float32Array(maxArgumentCount)
let extrusions = new Float32Array(maxArgumentCount)
let idToIndex = {}

for(let i=0; i<maxArgumentCount; i++) {
  extrusions[i] = -15 + random.nextDouble() * 30
}

export default {
  initialize(opts) {
    width = sharedState.get('containerWidth')
    height = sharedState.get('containerHeight')

    regl = reglImport({ 
      extensions: ['angle_instanced_arrays'],
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

      uniforms: {
        bufferSize: buffer,
        animationLength: (ctx, props) => props.animationLength,
        canvasRect: [width, height],
        frame: (ctx, props) => props.frame,
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
          ([props.mouseX, props.mouseY])
      },

      attributes: {
        corner: [ 1, 2, 3 ],

        supports: {
          buffer: regl.prop('supports'),
          divisor: 2
        },

        nextLeft: {
          buffer: regl.prop('nextLeft'),
          divisor: 2
        },

        nextTop: {
          buffer: regl.prop('nextTops'),
          divisor: 2
        },

        nextHeight: {
          buffer: regl.prop('nextHeights'),
          divisor: 2
        },

        left: {
          buffer: regl.prop('currentLeft'),
          divisor: 2
        },

        top: {
          buffer: regl.prop('currentTops'),
          divisor: 2
        },

        height: {
          buffer: regl.prop('currentHeights'),
          divisor: 2
        },

        index: {
          buffer: indicesBuffer,
          divisor: 1
        },

        extrusion: {
          buffer: regl.prop('extrusions'),
          divisor: 2
        }
      },

      count: 3,

      instances: nTriangles
    })

    indicesBuffer.subdata(indices)

    regl.frame(ctx => {
      if(typeof tree === 'undefined') return

      regl.clear({ color: [255/255, 100/255, 104/255, 1] })

      state.frame = frame
      state.mouseX = mouseX
      state.mouseY = mouseY
      state.cameraView = camera.view()

      if(typeof state.extrusions === 'undefined') {
        state.extrusions = new Float32Array(maxArgumentCount)
      }

      for(let i=0; i<maxArgumentCount; i++) {
        state.extrusions[i] = Math.cos(iterations / 10) * extrusions[i]
      }

      draw(state)

      iterations++
      frame++

      if(frame === animationLength) {
        mediator.publish("reconcileTree")
      }

      camera.tick()
    })

    setInterval(measureFPS, 1000)

    mediator.subscribe("flip", () => {
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

  update(web) {
    tree = web
    tree.reconcile(width, height)

    let depth = tree.getDepth()
    animationLength = frames[Math.min(depth - 1, frames.length - 1)]

    state.rectWidth = rectWidth
    rectWidth = Math.round(width / depth)
    state.nextRectWidth = rectWidth

    let traversed = []

    tree.traverseDF(n => {
      if(typeof idToIndex[n._id] === 'undefined') {
        idToIndex[n._id] = nextIndex()
      }

      let index = idToIndex[n._id]

      if(updateIterator % 2 === 0) {
        tops[index] = n.top
        left[index] = n.depth * rectWidth
        heights[index] = n.height
      } else {
        tops2[index] = n.top
        left2[index] = n.depth * rectWidth
        heights2[index] = n.height    
      }

      supports[index] = (n.supports || n.depth === 0) ? 1 : 0

      traversed.push(n._id)
    })

    let deleted = difference(Object.keys(idToIndex), traversed)
    for(let i=0; i<deleted.length; i++) {
      let index = idToIndex[deleted[i]]

      tops[index] = 0
      left[index] = 0
      heights[index] = 0

      tops2[index] = 0
      left2[index] = 0
      heights2[index] = 0

      unusedIndices.push(index)
      delete idToIndex[deleted[i]]
    }

    if(updateIterator % 2 === 1) {
      state.currentTops = tops
      state.currentLeft = left
      state.currentHeights = heights
      state.nextTops = tops2
      state.nextLeft = left2
      state.nextHeights = heights2
    } else {
      state.currentTops = tops2
      state.currentLeft = left2
      state.currentHeights = heights2
      state.nextTops = tops
      state.nextLeft = left
      state.nextHeights = heights
    }
    
    state.supports = supports
    state.animationLength = animationLength

    updateIterator++
    frame = 0
  },

  resize() {
    onResize()
  }
}