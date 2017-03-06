import sharedState from './sharedState'

const camera = new THREE.PerspectiveCamera(75, sharedState.get('windowWidth') / sharedState.get('windowHeight'), 0.1, 3000),
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

    for(let i=-5; i<5; i++) { // x
      for(let j=-5; j<5; j++) { // y
        let multiplier = ((i + 5) * opts.res + (j + 5)) * 18

        arrowVertices[multiplier] = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock)
        arrowVertices[multiplier + 1] = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock)
        arrowVertices[multiplier + 2] = 0

        arrowVertices[multiplier + 2] = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + arrowSize
        arrowVertices[multiplier + 2] = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + arrowSize
        arrowVertices[multiplier + 2] = 0
        
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
        arrowVertices[multiplier + 2] = 0
      }
    }

    console.log(arrowVertices)

    arrowGeometry.addAttribute("position", arrowVerticesBuffer)

    scene.add(new THREE.LineSegments(arrowGeometry, arrowMaterial))

    arrowVerticesBuffer.needsUpdate = true

    requestAnimationFrame(renderLoop)

    camera.position.z = 1
  }
}