let config, canvas, width, height

const render = () => {

}

export default {
  initialize(opts) {
    width = window.innerWidth
    height = window.innerHeight
    config = opts

    canvas = document.getElementById("webgl-canvas")
    canvas.width = width
    canvas.height = height

    gl = canvas.getContext("webgl", { antialias: false })

    gl.disable(gl.DEPTH_TEST)
    gl.getExtension('OES_texture_float')

    const program = createProgramFromScripts(gl, config.shaders.mainVert, config.shaders.mainFrag)
    gl.useProgram(program)

    console.log(gl)

    render()
  }
}