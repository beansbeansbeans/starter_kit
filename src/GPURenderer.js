import helpers from './helpers/helpers'
import sharedState from './sharedState'

let width, height, paused = false, GPU, config, canvas

const onResize = () => {
  canvas.width = width
  canvas.height = height

  const particles = new Float32Array(width * height * 4)
  for(let i=0; i<height; i++) {
    for(let j=0; j<width; j++) {
      const index = 4 * (i * width + j)
      if(Math.random() < 0.5) {
        particles[index] = 1
      }
    }
  }

  GPU.initTextureFromData("particles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("particles", true)
  GPU.initTextureFromData("nextParticles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("nextParticles", true)

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

  GPU.setUniformForProgram("particles" ,"u_textureSize", [width, height], "2f")
  GPU.setUniformForProgram("render" ,"u_textureSize", [width, height], "2f")
}

const render = () => {
  GPU.setSize(width, height)

  GPU.setProgram("particles") // ?

  GPU.step("particles", ["particles"], "nextParticles")

  GPU.setProgram("render") // ?

  // GPU.step("render", ["nextParticles", "material"])
  GPU.step("render", ["material", "nextParticles"])

  GPU.swapTextures("nextParticles", "particles")

  requestAnimationFrame(render)
}

export default {
  initialize(opts) {
    canvas = document.getElementById("webgl-canvas")
    config = opts

    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    GPU = initGPUMath()

    GPU.createProgram("particles", config.shaders.renderVert, config.shaders.particlesFrag)
    GPU.setUniformForProgram("particles", "u_particles", 0, "1i")

    GPU.createProgram("render", config.shaders.renderVert, config.shaders.renderFrag)
    GPU.setUniformForProgram("render", "u_particles", 0, "1i")
    GPU.setUniformForProgram("render", "u_material", 0, "1i")

    onResize()

    render()
  },

  resize() {
    onResize()
  }
}