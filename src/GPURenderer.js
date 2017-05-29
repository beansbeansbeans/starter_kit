import helpers from './helpers/helpers'
import sharedState from './sharedState'

let width, height, paused = false, GPU, config, canvas, debug = false

const onResize = () => {
  canvas.width = width
  canvas.height = height

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
      }

      particles[index + 1] = i / height;
      particles[index + 2] = j / width;
    }
  }

  GPU.initTextureFromData("particles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("particles", true)
  GPU.initTextureFromData("nextParticles", width, height, "FLOAT", particles, true)
  GPU.initFrameBufferForTexture("nextParticles", true)

  if(debug) {
    GPU.initTextureFromData("debugMaterial", width, height, "FLOAT", new Float32Array(width * height * 4), true)
    GPU.initFrameBufferForTexture("debugMaterial", true)
    GPU.initTextureFromData("nextDebugMaterial", width, height, "FLOAT", new Float32Array(width * height * 4), true)
    GPU.initFrameBufferForTexture("nextDebugMaterial", true)    
  }

  GPU.setProgram("particles")
  GPU.setUniformForProgram("particles", "u_textureSize", [width, height], "2f")
  GPU.setProgram("render")
  GPU.setUniformForProgram("render", "u_textureSize", [width, height], "2f")
}

const render = () => {
  GPU.setSize(width, height)

  GPU.setProgram("particles")
  GPU.setUniformForProgram("particles", "u_offset", Math.random() * 1000, "1f")
  GPU.step("particles", ["particles"], "nextParticles")

  GPU.setProgram("render")
  GPU.step("render", ["particles"])

  if(debug) {
    GPU.step("render", ["nextParticles", "debugMaterial"], "nextDebugMaterial", true)
  } else {
    GPU.step("render", ["nextParticles"], null, true)
  }

  GPU.swapTextures("particles", "nextParticles")

  if(debug) {
    GPU.swapTextures("debugMaterial", "nextDebugMaterial")
  }

  requestAnimationFrame(render)
}

export default {
  initialize(opts) {
    canvas = document.getElementById("webgl-canvas")
    config = opts

    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    GPU = initGPUMath({ width, height })

    GPU.createProgram("particles", config.shaders.renderVert, config.shaders.particlesFrag)
    GPU.setUniformForProgram("particles", "u_particles", 0, "1i")
    GPU.setUniformForProgram("particles", "u_offset", 1, "1f")

    GPU.createProgram("render", config.shaders.mainVert, config.shaders.renderFrag, true)
    GPU.setUniformForProgram("render", "u_particles", 0, "1i")
    GPU.setUniformForProgram("render", "u_debugMaterial", 1, "1i")

    onResize()

    render()
  },

  resize() {
    onResize()
  }
}