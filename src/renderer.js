import sharedState from './sharedState'

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500),
  scene = new THREE.Scene(),
  arrowGeometry = new THREE.BufferGeometry()

let opts = {}

const renderLoop = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(renderLoop)
}

const getVector = (function() {
  const result = new THREE.Vector2()

  const func = ({ x, y }) => {
    const i = [1, 0], j = [0, 1]

    // field equation: -yi + xj
    result.x = -y*i[0] + x*j[0]
    result.y = -y*i[1] + x*j[1]

    return { 
      angle: result.angle(), 
      mag: result.length() 
    }
  }
  return func
})()

window.test = getVector

export default {
  initialize(config) {
    opts = config
    renderer = new THREE.WebGLRenderer({ canvas: opts.element, alpha: true })

    renderer.setSize(opts.pxPerBlock * opts.res, opts.pxPerBlock * opts.res)
    renderer.setPixelRatio(window.devicePixelRatio)

    const arrowVertices = new Float32Array(opts.res * opts.res * 3 * 2 * 3)
    const dim = new Float32Array(opts.res * opts.res * 3 * 2 * 2)
    const arrowVerticesBuffer = new THREE.BufferAttribute(arrowVertices, 3)
    const dimBuffer = new THREE.BufferAttribute(dim, 2)

    const imageAspect = opts.arrow.image.width / opts.arrow.image.height

    const arrowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: document.getElementById("arrow-vertex-shader").textContent,
      fragmentShader: document.getElementById("arrow-fragment-shader").textContent,
      uniforms: {
        tex: { type: 't', value: opts.arrow }
      }
    })

    const arrowWidth = opts.pxPerBlock / 2
    const arrowHeight = Math.max(3, imageAspect / arrowWidth)

    for(let i=-(opts.res / 2); i<opts.res / 2; i++) { // x
      for(let j=-(opts.res / 2); j<opts.res / 2; j++) { // y
        let multiplier = ((i + opts.res / 2) * opts.res + (j + opts.res / 2)) * 18
        let centerX = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        let centerY = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        let { angle, mag } = getVector({ x: i, y: j })

        arrowVertices[multiplier] = centerX + arrowWidth / 2
        arrowVertices[multiplier + 1] = centerY - arrowHeight / 2
        arrowVertices[multiplier + 2] = 0

        arrowVertices[multiplier + 3] = centerX - arrowWidth / 2
        arrowVertices[multiplier + 4] = centerY + arrowHeight / 2
        arrowVertices[multiplier + 5] = 0
        
        arrowVertices[multiplier + 6] = centerX - arrowWidth / 2
        arrowVertices[multiplier + 7] = centerY - arrowHeight / 2
        arrowVertices[multiplier + 8] = 0
        
        arrowVertices[multiplier + 9] = centerX - arrowWidth / 2
        arrowVertices[multiplier + 10] = centerY + arrowHeight / 2
        arrowVertices[multiplier + 11] = 0
        
        arrowVertices[multiplier + 12] = centerX + arrowWidth / 2
        arrowVertices[multiplier + 13] = centerY - arrowHeight / 2
        arrowVertices[multiplier + 14] = 0

        arrowVertices[multiplier + 15] = centerX + arrowWidth / 2
        arrowVertices[multiplier + 16] = centerY + arrowHeight / 2
        arrowVertices[multiplier + 17] = 0

        let dimMultiplier = ((i + opts.res / 2) * opts.res + (j + opts.res / 2)) * 12
        dim[dimMultiplier] = 0.0
        dim[dimMultiplier + 1] = 0.0
        dim[dimMultiplier + 2] = 0.0
        dim[dimMultiplier + 3] = 1.0
        dim[dimMultiplier + 4] = 1.0
        dim[dimMultiplier + 5] = 1.0

        dim[dimMultiplier + 6] = 0.0
        dim[dimMultiplier + 7] = 0.0
        dim[dimMultiplier + 8] = 1.0
        dim[dimMultiplier + 9] = 1.0
        dim[dimMultiplier + 10] = 1.0
        dim[dimMultiplier + 11] = 0.0
      }
    }

    arrowGeometry.addAttribute("position", arrowVerticesBuffer)
    arrowGeometry.addAttribute("dim", dimBuffer)

    scene.add(new THREE.Mesh(arrowGeometry, arrowMaterial))

    arrowVerticesBuffer.needsUpdate = true

    requestAnimationFrame(renderLoop)

    camera.position.z = 200 // this is the carefully calibrated position that exactly lines up with the border
  }
}