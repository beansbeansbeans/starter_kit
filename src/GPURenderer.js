import helpers from './helpers/helpers'
import sharedState from './sharedState'
const { makeTexture, makeFlatArray, makeRandomArray } = helpers

let width, height, paused = false, GPU, config, canvas

const onResize = () => {
  canvas.width = width
  canvas.height = height

  const material = new Float32Array(width * height * 4)
  for(let i=0; i<height; i++) {
    for(let j=0; j<width; j++) {
      const index = 4 * (i * width + j)
      material[index] = 0.5
      material[index + 1] = 0.5
      material[index + 2] = 0.5
      material[index + 3] = 1
    }
  }

  GPU.initTextureFromData("material", width, height, "FLOAT", material, true)
  GPU.initFrameBufferForTexture("material", true)
  GPU.initTextureFromData("nextMaterial", width, height, "FLOAT", material, true)
  GPU.initFrameBufferForTexture("nextMaterial", true)

  GPU.setUniformForProgram("render" ,"u_textureSize", [width, height], "2f")
}

const render = () => {
  GPU.setSize(width, height)

  GPU.step("render", ["nextMaterial"])
  GPU.swapTextures("nextMaterial", "material")

  requestAnimationFrame(render)
}

export default {
  initialize(opts) {
    canvas = document.getElementById("webgl-canvas")
    config = opts

    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    GPU = initGPUMath()

    GPU.createProgram("render", config.shaders.renderVert, config.shaders.renderFrag)
    GPU.setUniformForProgram("render", "u_material", 0, "1i")

    onResize()

    render()
  },

  resize() {
    onResize()
  }
}