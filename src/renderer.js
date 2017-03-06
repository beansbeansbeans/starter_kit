import sharedState from './sharedState'

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500),
  scene = new THREE.Scene(),
  arrowGeometry = new THREE.BufferGeometry()

let opts = {}

const renderLoop = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(renderLoop)
}

export default {
  initialize(config) {
    opts = config
    renderer = new THREE.WebGLRenderer({ canvas: opts.element, alpha: true })

    renderer.setSize(opts.pxPerBlock * opts.res, opts.pxPerBlock * opts.res)
    renderer.setPixelRatio(window.devicePixelRatio)

    const arrowVertices = new Float32Array(opts.res * opts.res * 3 * 2 * 3)
    const arrowVerticesBuffer = new THREE.BufferAttribute(arrowVertices, 3)

    const arrowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: document.getElementById("arrow-vertex-shader").textContent,
      fragmentShader: document.getElementById("arrow-fragment-shader").textContent
    })

    const arrowSize = opts.pxPerBlock / 3

    for(let i=-(opts.res / 2); i<opts.res / 2; i++) { // x
      for(let j=-(opts.res / 2); j<opts.res / 2; j++) { // y
        let multiplier = ((i + opts.res / 2) * opts.res + (j + opts.res / 2)) * 18
        let xBuffer = opts.pxPerBlock / 2 - arrowSize / 2

        arrowVertices[multiplier] = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + xBuffer
        arrowVertices[multiplier + 1] = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        arrowVertices[multiplier + 2] = 0

        arrowVertices[multiplier + 3] = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + arrowSize + xBuffer
        arrowVertices[multiplier + 4] = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        arrowVertices[multiplier + 5] = 0
        
        arrowVertices[multiplier + 6] = 0
        arrowVertices[multiplier + 7] = 0
        arrowVertices[multiplier + 8] = 0
        
        arrowVertices[multiplier + 9] = 0
        arrowVertices[multiplier + 10] = 0
        arrowVertices[multiplier + 11] = 0
        
        arrowVertices[multiplier + 12] = 0
        arrowVertices[multiplier + 13] = 0
        arrowVertices[multiplier + 14] = 0
        
        arrowVertices[multiplier + 15] = 0
        arrowVertices[multiplier + 16] = 0
        arrowVertices[multiplier + 17] = 0
      }
    }

    arrowGeometry.addAttribute("position", arrowVerticesBuffer)

    scene.add(new THREE.LineSegments(arrowGeometry, arrowMaterial))

    arrowVerticesBuffer.needsUpdate = true

    requestAnimationFrame(renderLoop)

    camera.position.z = 130 // this is the carefully calibrated position that exactly lines up with the border
  }
}