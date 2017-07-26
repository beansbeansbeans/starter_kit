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

    var N = 10 // N triangles on the width, N triangles on the height.

    var angle = [], indices = []
    for (var i = 0; i < N * N; i++) {
      // generate random initial angle.
      // angle[i] = Math.random() * (2 * Math.PI)
      angle[i] = 0
      indices[i] = i % 2 ? 1 : -1
    }

    // This buffer stores the angles of all
    // the instanced triangles.
    const angleBuffer = regl.buffer({
      length: angle.length * 4,
      type: 'float',
      usage: 'dynamic'
    })

    const indicesBuffer = regl.buffer({
      length: indices.length * 4,
      type: 'float',
      usage: 'dynamic'
    })

    const draw = regl({
      frag: opts.shaders['drawRect.fs'],

      vert: opts.shaders['drawRect.vs'],

      attributes: {
        position: [[0.0, -0.1], [0, 0.0], [0.19, 0.0]],

        offset: {
          buffer: regl.buffer(
            Array(N * N).fill().map((_, i) => {
              var x = -1 + 2 * Math.floor(i / N) / N
              var y = -1 + 2 * (i % N) / N + 0.1
              return [x, y]
            })),
          divisor: 1 // one separate offset for every triangle.
        },

        color: {
          buffer: regl.buffer(
            Array(N * N).fill().map((_, i) => {
              var r = Math.floor(i / N) / N
              var g = (i % N) / N
              return [r, g, r * g + 0.2]
            })),
          divisor: 1 // one separate color for every triangle
        },

        angle: {
          buffer: angleBuffer,
          divisor: 1 // one separate angle for every triangle
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
      instances: N * N
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