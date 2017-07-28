import helpers from './helpers/helpers'
import sharedState from './sharedState'
import reglImport from 'regl'
import cameraModule from 'canvas-orbit-camera'
import mat4 from 'gl-mat4'

let width, height, config, regl, camera

const onResize = () => {

}

export default {
  initialize(opts) {
    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    regl = reglImport({ 
      extensions: ['angle_instanced_arrays'],
      container: opts.container
    })

    camera = cameraModule(opts.container)
    camera.distance = 2.5
    camera.rotation = new Float32Array(4)

    config = opts

    const nW = 11 // triangles going across
    const nH = 2 * 22 // triangles going down
    const nTriangles = nW * nH
    const buffer = 1
    const perRectWidth = 1 / (nW / 2)
    const perRectHeight = 1 / (nH / 2)

    let bufferX = 2 * buffer / width 
    let bufferY = buffer / height

    var indices = []
    for (var i = 0; i < nTriangles; i++) {
      indices[i] = i % 2 ? 1 : -1
    }

    const indicesBuffer = regl.buffer({
      length: indices.length * 4,
      type: 'float',
      usage: 'dynamic'
    })

    const draw = regl({
      frag: opts.shaders['drawRect.fs'],

      vert: opts.shaders['drawRect.vs'],

      uniforms: {
        view: camera.view(),
        projection: ({ viewportWidth, viewportHeight }) => mat4.perspective([],
                           Math.PI / 4,
                           viewportWidth / viewportHeight,
                           0.01, 
                           2000)
      },

      attributes: {
        position: [
          [0.0, -1 * 2 * (perRectHeight - bufferY)], 
          [0, 0.0], 
          [perRectWidth - bufferX, 0.0]
        ],

        offset: {
          buffer: regl.buffer(
            Array(nTriangles).fill().map((_, i) => {
              var x = -1 + 2 * Math.floor(i / nH) / nW
              var y = -1 + 2 * (i % nH) / nH

              if(i % 2 !== 0) {
                y += perRectHeight - (bufferY * 2)
              } else {
                x += perRectWidth - bufferX
              }

              return [x, y]
            })),
          divisor: 1 // one separate offset for every triangle.
        },

        color: {
          buffer: regl.buffer(
            Array(nTriangles).fill().map((_, i) => {
              var r = Math.floor(i / nH) / nW
              var g = (i % nH) / nH
              return [r, g, r * g + 0.2]
            })),
          divisor: 1 // one separate color for every triangle
        },

        index: {
          buffer: indicesBuffer,
          divisor: 1
        }
      },

      depth: {
        enable: false
      },

      // Every triangle is just three vertices.
      // However, every such triangle are drawn N * N times,
      // through instancing.
      count: 3,

      instances: nTriangles
    })

    regl.frame(function () {
      regl.clear({
        color: [0, 0, 0, 1]
      })

      // rotate the triangles every frame.
      // for (var i = 0; i < N * N; i++) {
      //   angle[i] += 0.01
      // }
      indicesBuffer.subdata(indices)

      draw()
    })
  },

  resize() {
    onResize()
  }
}