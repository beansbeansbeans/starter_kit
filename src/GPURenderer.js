import helpers from './helpers/helpers'
import sharedState from './sharedState'

let width, height, paused = false, GPU, config, canvas, offset = 0

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

  const particles = new Float32Array(width * height * 4)
  for(let i=0; i<height; i++) {
    for(let j=0; j<width; j++) {
      const index = 4 * (i * width + j)

      if(Math.random() < 0.25) {
        if(Math.random() < 0.5) {
          particles[index] = 1
        } else {
          particles[index] = -1
        }
        const nextDirection = Math.random()
        if(nextDirection < 1/8) {
          particles[index + 1] = 1
        } else if(nextDirection < 2/8) {
          particles[index + 1] = 2
        } else if(nextDirection < 3/8) {
          particles[index + 1] = 3
        } else if(nextDirection < 4/8) {
          particles[index + 1] = 4
        } else if(nextDirection < 5/8) {
          particles[index + 1] = 5
        } else if(nextDirection < 6/8) {
          particles[index + 1] = 6
        } else if(nextDirection < 7/8) {
          particles[index + 1] = 7
        } else {
          particles[index + 1] = 8
        }
      }
    }
  }

  GPU.initTextureFromData("particles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("particles", true)
  GPU.initTextureFromData("nextParticles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("nextParticles", true)

  GPU.setUniformForProgram("particles", "u_textureSize", [width, height], "2f")
  GPU.setUniformForProgram("render", "u_textureSize", [width, height], "2f")
}

const render = () => {
  GPU.setSize(width, height)

  // GPU.setProgram("particles") // ?

  GPU.setUniformForProgram("particles", "u_offset", offset, "1f")
  GPU.step("particles", ["particles"], "nextParticles")

  // GPU.setProgram("render") // ?

  GPU.step("render", ["material", "particles"])

  GPU.swapTextures("nextParticles", "particles")

  requestAnimationFrame(render)

  offset++
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
    GPU.setUniformForProgram("particles", "u_offset", offset, "1f")

    GPU.createProgram("render", config.shaders.renderVert, config.shaders.renderFrag)
    GPU.setUniformForProgram("render", "u_material", 0, "1i")
    GPU.setUniformForProgram("render", "u_particles", 1, "1i")

    onResize()

    render()
  },

  resize() {
    onResize()
  }
}