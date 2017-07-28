import helpers from './helpers/helpers'
import sharedState from './sharedState'
import reglImport from 'regl'

let width, height, config, regl

const onResize = () => {

}

export default {
  initialize(opts) {
    regl = reglImport({ 
      extensions: ['angle_instanced_arrays'],
      container: opts.container
    })

    config = opts

    var nW = 10 // triangles going across
    var nH = 2 * 9 // triangles going down
    var nTriangles = nW * nH

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

      attributes: {
        position: [
          [0.0, -1 * 2 * (1 / (nH / 2))], 
          [0, 0.0], 
          [0.19, 0.0]
        ],

        offset: {
          buffer: regl.buffer(
            Array(nTriangles).fill().map((_, i) => {
              var x = -1 + 2 * Math.floor(i / nH) / nW
              var y = -1 + 2 * (i % nH) / nH

              if(i % 2 !== 0) {
                y += 1 / (nH / 2)
              } else {
                x += 0.19
              }

              return [x, y]
            })),
          divisor: 1 // one separate offset for every triangle.
        },

        color: {
          buffer: regl.buffer(
            Array(nTriangles).fill().map((_, i) => {
              var r = Math.floor(i / nW) / nW
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