import helpers from './helpers/helpers'
import sharedState from './sharedState'
const { makeTexture, makeFlatArray, makeRandomArray } = helpers

let config, canvas, width, height, renderFlagLocation, frameBuffer, resizedCurrentState, resizedLastState, lastState, currentState, textureSizeLocation, paused = false, glBoilerplate

const render = () => {
  if(!paused) {
    if(resizedLastState) {
      lastState = resizedLastState
      resizedLastState = null
    }

    if(resizedCurrentState) {
      currentState = resizedCurrentState
      resizedCurrentState = null
    }

    gl.uniform1f(renderFlagLocation, 0)

    step()

    gl.uniform1f(renderFlagLocation, 1)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, lastState)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  requestAnimationFrame(render)
}

const step = () => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

  // attaches texture to a framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0)

  gl.bindTexture(gl.TEXTURE_2D, lastState)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  let temp = lastState
  lastState = currentState
  currentState = temp
}

const onResize = () => {
  paused = true
  width = sharedState.get("windowWidth")
  height = sharedState.get("windowHeight")
  canvas.width = width
  canvas.height = height

  gl.viewport(0, 0, width, height)

  gl.uniform2f(textureSizeLocation, width, height)

  resizedCurrentState = makeTexture(gl)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null)

  resizedLastState = makeTexture(gl)

  let rgba = new Float32Array(width * height * 4)
  rgba = makeRandomArray(rgba)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, makeRandomArray(rgba, width, height))

  paused = false
}

export default {
  initialize(opts) {
    glBoilerplate = initBoilerPlate();

    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")
    config = opts

    canvas = document.getElementById("webgl-canvas")
    canvas.width = width
    canvas.height = height

    gl = canvas.getContext("webgl", { antialias: false }) || canvas.getContext("experimental-webgl", { antialias: false})

    gl.disable(gl.DEPTH_TEST)
    gl.getExtension('OES_texture_float')

    const program = glBoilerplate.createProgramFromScripts(gl, config.shaders.mainVert, config.shaders.mainFrag)
    gl.useProgram(program)

    // obtain the location of the position attribute in the program
    const positionLocation = gl.getAttribLocation(program, "a_position")

    // create a webgl buffer, which is just a data object
    const bufferPos = gl.createBuffer()
    
    // bind the buffer to a target
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos)

    // turn the generic vertex attribute array on at a given position
    gl.enableVertexAttribArray(positionLocation)

    // specify memory layout of the buffer
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // initialize and create the buffer object's data store
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0]), gl.STATIC_DRAW)

    // constants
    renderFlagLocation = gl.getUniformLocation(program, "u_renderFlag")

    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    onResize()

    lastState = resizedLastState
    currentState = resizedCurrentState
    resizedLastState = null
    resizedCurrentState = null

    frameBuffer = gl.createFramebuffer()

    gl.bindTexture(gl.TEXTURE_2D, lastState)

    render()
  },

  resize() {
    onResize()
  }
}