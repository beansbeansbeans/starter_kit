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
import deepAssign from 'deep-assign'
const random = randomModule.random(42)

const frames = [15],
  maxArgumentCount = 1000, nTriangles = 2 * maxArgumentCount,
  buffer = 10, cameraDist = 1000,
  onResize = () => {},
  measureFPS = () => {
    const now = Date.now()
    // console.log(Math.round((iterations - iterationSnapshot) / ((now - lastNow) / 1000)))
    
    lastNow = now
    iterationSnapshot = iterations
  },
  nextIndex = () => unusedIndices.shift()

let width, height, rectWidth = 0, nextRectWidth = 0, 
  config, regl, camera, draw, drawShadows,
  currentIndex = 0, lastIndex = 1, 
  projectionMatrix = new Float32Array(16),
  mouseX = -1, mouseY = -1, toLocal,
  frame = 0, extrusionFrame = 0, activeFrame = 0, iterations = 0, illuminationFrame = 0, iterationSnapshot, 
  lastNow = Date.now(), activeIndex = 0, previousActiveIndex = 0,
  state = { rectWidth, nextRectWidth, activeDirection: 0, selectedIndex: -1, illuminated: new Float32Array(maxArgumentCount), lastIlluminated: new Float32Array(maxArgumentCount), illuminateSupports: 1, solving: 0 }, animationLength = 0,
  unusedIndices = [], positions = [{}, {}], idToIndex = {},
  supports = new Float32Array(maxArgumentCount),
  illuminated = new Float32Array(maxArgumentCount),
  lastIlluminated = new Float32Array(maxArgumentCount),
  byUser = new Float32Array(maxArgumentCount),
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

const illuminateHistory = (id, supports) => {
  web.traverseDF(n => {
    if(n._id !== web._root._id) {
      let index = idToIndex[n._id]

      lastIlluminated[index] = illuminated[index]

      if((n.supportsRoot && supports) || (!n.supportsRoot && !supports)) {
        illuminated[index] = random.nextDouble()
      } else {
        illuminated[index] = 0
      }
    }

    return false
  })

  extrusionFrame = 0

  state.lastIlluminated = lastIlluminated
  state.illuminated = illuminated
  state.illuminateSupports = supports ? 1 : 0
}

mediator.subscribe("mousedown", data => {
  if(data.target.nodeName === 'SELECT') return

  const vp = mat4.multiply([], projectionMatrix, state.cameraView),
    invVp = mat4.invert([], vp),
    rayPoint = vec3.transformMat4([], 
      [mouseX, mouseY, 0], invVp), // get a single point on the camera ray
    rayOrigin = vec3.transformMat4([],
      [0, 0, 0], mat4.invert([], state.cameraView)), // get position of camera
    rayDir = vec3.normalize([], vec3.subtract([], rayPoint, rayOrigin)),
    currentPosition = positions[currentIndex]

  let closestDistance = Infinity, closestIndex = -1, closestID = null, closestSupport

  sharedState.get("web").traverseBF(n => {
    const index = idToIndex[n._id],
      x = currentPosition.left[index],
      y = currentPosition.tops[index],
      z = currentPosition.extrusions[index],
      topLeft = toLocal([x, y]),
      bottomLeft = toLocal([x, y + currentPosition.heights[index]]),
      bottomRight = toLocal([x + state.nextRectWidth, y + currentPosition.heights[index]]),
      topRight = toLocal([x + state.nextRectWidth, y]),

      tri1 = [
        [topLeft[0], topLeft[1], z], // top left
        [bottomLeft[0], bottomLeft[1], z], // bottom left
        [bottomRight[0], bottomRight[1], z]], // bottom right
      t1 = intersectTriangle([], rayPoint, rayDir, tri1),

      tri2 = [
        [topLeft[0], topLeft[1], z],
        [bottomRight[0], bottomRight[1], z],
        [topRight[0], topRight[1], z]],
      t2 = intersectTriangle([], rayPoint, rayDir, tri2)

    let t
    if(typeof t1 === 'number') {
      t = t1
      if(typeof t2 === 'number') t = Math.min(t1, t2)
    } else {
      t = t2
    }

    if(typeof t === "number" && t < closestDistance) {
      closestDistance = t
      closestIndex = index
      closestID = n._id
      closestSupport = n.supportsRoot
    }

    return false
  })

  activeStatus[previousActiveIndex] = 0

  state.selectedIndex = closestIndex
  state.activeStatus = activeStatus

  config.selectedArgCB({ id: closestID })
  illuminateHistory(closestID, closestSupport)
})

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

    const renderObject = {
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
        selectedIndex: (ctx, props) => props.selectedIndex,
        bufferSize: buffer,
        solving: (ctx, props) => props.solving,
        animationLength: (ctx, props) => props.animationLength,
        canvasRect: [width, height],
        iterations: (ctx, props) => props.iterations,
        frame: (ctx, props) => props.frame,
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

        byUser: {
          buffer: regl.prop('byUser'),
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
        }
      },

      count: 3,

      instances: nTriangles
    }

    draw = regl(deepAssign({}, renderObject, {
      frag: opts.shaders['drawRect.fs'],
      vert: opts.shaders['drawRect.vs'],
      uniforms: {
        extrusionRange,
        extrusionFrame: (ctx, props) => props.extrusionFrame
      },
      attributes: {
        currentExtrusion: {
          buffer: regl.prop('currentExtrusion'),
          divisor: 2
        },

        lastExtrusion: {
          buffer: regl.prop('lastExtrusion'),
          divisor: 2
        }     
      }
    }))

    drawShadows = regl(deepAssign({}, renderObject, {
      frag: opts.shaders['drawShadow.fs'],
      vert: opts.shaders['drawShadow.vs'],
      uniforms: {
        illuminationFrame: (ctx, props) => props.illuminationFrame,
        illuminateSupports: (ctx, props) => props.illuminateSupports
      },
      attributes: {
        lastIlluminated: {
          buffer: regl.prop('lastIlluminated'),
          divisor: 2
        },

        illuminated: {
          buffer: regl.prop('illuminated'),
          divisor: 2
        }
      }
    }))

    indicesBuffer.subdata(indices)

    regl.frame(ctx => {
      regl.clear({
        color: [239/255, 238/255, 236/255, 1] 
      })

      Object.assign(state, {
        frame, extrusionFrame, illuminationFrame, iterations, activeFrame, mouseX, mouseY,
        cameraView: camera.view()
      })

      if(typeof state.lastExtrusion === 'undefined') {
        state.lastExtrusion = new Float32Array(maxArgumentCount)
        state.currentExtrusion = new Float32Array(maxArgumentCount)
      }

      draw(state)
      drawShadows(state)
      camera.tick()

      iterations++
      frame++
      extrusionFrame++
      illuminationFrame++
      activeFrame++

      if(frame === state.animationLength) mediator.publish("reconcileTree")
      if(extrusionFrame === state.animationLength) mediator.publish("extrusionAnimationComplete")
    })

    setInterval(measureFPS, 1000)

    camera.lookAt([0, 800, 700],
      [-200, -100, 0],
      [-0.5, 0.5, -0.5])
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
      let newNode = false
      if(typeof idToIndex[n._id] === 'undefined') {
        idToIndex[n._id] = nextIndex()
        newNode = true
      }

      let index = idToIndex[n._id]

      positions[lastIndex].tops[index] = positions[currentIndex].tops[index]
      positions[lastIndex].left[index] = positions[currentIndex].left[index]
      positions[lastIndex].heights[index] = positions[currentIndex].heights[index]
      positions[lastIndex].extrusions[index] = positions[currentIndex].extrusions[index]
      if(newNode) {
        positions[lastIndex].extrusions[index] = n.approbation
      }
      
      positions[currentIndex].tops[index] = n.top
      positions[currentIndex].left[index] = n.depth * rectWidth
      positions[currentIndex].heights[index] = n.height
      positions[currentIndex].extrusions[index] = n.approbation

      supports[index] = (n.supports || n.depth === 0) ? 1 : 0
      byUser[index] = n.extraData.user === true ? 1 : 0

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
      lastExtrusion: positions[lastIndex].extrusions,
      currentTop: positions[currentIndex].tops,
      currentLeft: positions[currentIndex].left,
      currentHeight: positions[currentIndex].heights,
      currentExtrusion: positions[currentIndex].extrusions,
      supports, byUser, timers, activeStatus, animationLength
    })

    frame = 0
  },

  extrudeNode(web, arr) {
    let activePosition = {}, previousActivePosition = {}

    for(let i=0; i<arr.length; i++) {
      let node = arr[i].node, value = arr[i].value, index = idToIndex[node._id]

      positions[lastIndex].extrusions[index] = positions[currentIndex].extrusions[index]
      positions[currentIndex].extrusions[index] = value * random.nextDouble() * 30

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
    state.byUser = byUser
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

  activateNode(id) {
    let index = idToIndex[id]

    state.selectedIndex = index
  },

  deactivateNode(id) {
    state.selectedIndex = -1
  },

  solve() {
    state.solving = 1
  },

  illuminateHistory,

  resize() {
    onResize()
  }
}