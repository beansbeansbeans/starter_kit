import helpers from './helpers/helpers'
import sharedState from './sharedState'

let width, height, paused = false, GPU, config, canvas, debug = false

const onResize = () => {
  canvas.width = width
  canvas.height = height
}

const render = () => {
  requestAnimationFrame(render)
}

export default {
  initialize(opts) {
    canvas = document.getElementById("webgl-canvas")
    config = opts

    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    GPU = initGPUMath({ width, height })

    onResize()

    render()
  },

  resize() {
    onResize()
  }
}