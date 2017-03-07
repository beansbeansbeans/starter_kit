import sharedState from './sharedState'

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 3000),
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

    const arrowSize = opts.pxPerBlock / 8

    const upperRight = new THREE.Vector3()
    const upperLeft = new THREE.Vector3()
    const lowerLeft = new THREE.Vector3()
    const lowerRight = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const m = new THREE.Matrix4()

    for(let i=-(opts.res / 2); i<opts.res / 2; i++) { // x
      for(let j=-(opts.res / 2); j<opts.res / 2; j++) { // y
        let multiplier = ((i + opts.res / 2) * opts.res + (j + opts.res / 2)) * 18
        let centerX = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        let centerY = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
        let { angle, mag } = getVector({ x: i, y: j })

        upperRight.x = arrowSize / 2
        upperRight.y = arrowSize / 2

        lowerRight.x = arrowSize / 2
        lowerRight.y = -arrowSize / 2

        upperLeft.x = -arrowSize / 2
        upperLeft.y = arrowSize / 2

        lowerLeft.x = -arrowSize / 2
        lowerLeft.y = -arrowSize / 2

        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), angle )

        m.compose(new THREE.Vector3(centerX, centerY, 0), quaternion, new THREE.Vector3(1, 1, 1).multiplyScalar(mag))

        upperRight.applyMatrix4(m)
        lowerRight.applyMatrix4(m)
        upperLeft.applyMatrix4(m)
        lowerLeft.applyMatrix4(m)

        arrowVertices[multiplier] = lowerRight.x
        arrowVertices[multiplier + 1] = lowerRight.y
        arrowVertices[multiplier + 2] = lowerRight.z

        arrowVertices[multiplier + 3] = upperLeft.x
        arrowVertices[multiplier + 4] = upperLeft.y
        arrowVertices[multiplier + 5] = upperLeft.z
        
        arrowVertices[multiplier + 6] = lowerLeft.x
        arrowVertices[multiplier + 7] = lowerLeft.y
        arrowVertices[multiplier + 8] = lowerLeft.z
        
        arrowVertices[multiplier + 9] = upperLeft.x
        arrowVertices[multiplier + 10] = upperLeft.y
        arrowVertices[multiplier + 11] = upperLeft.z
        
        arrowVertices[multiplier + 12] = lowerRight.x
        arrowVertices[multiplier + 13] = lowerRight.y
        arrowVertices[multiplier + 14] = lowerRight.z

        arrowVertices[multiplier + 15] = upperRight.x
        arrowVertices[multiplier + 16] = upperRight.y
        arrowVertices[multiplier + 17] = upperRight.z

        let dimMultiplier = ((i + opts.res / 2) * opts.res + (j + opts.res / 2)) * 12
        dim[dimMultiplier] = 1
        dim[dimMultiplier + 1] = 1
        dim[dimMultiplier + 2] = 0
        dim[dimMultiplier + 3] = 0
        dim[dimMultiplier + 4] = 0
        dim[dimMultiplier + 5] = 1

        dim[dimMultiplier + 6] = 0
        dim[dimMultiplier + 7] = 0
        dim[dimMultiplier + 8] = 1
        dim[dimMultiplier + 9] = 1
        dim[dimMultiplier + 10] = 1
        dim[dimMultiplier + 11] = 0
      }
    }

    arrowGeometry.addAttribute("position", arrowVerticesBuffer)
    arrowGeometry.addAttribute("dim", dimBuffer)

    scene.add(new THREE.Mesh(arrowGeometry, arrowMaterial))

    arrowVerticesBuffer.needsUpdate = true

    requestAnimationFrame(renderLoop)

    camera.position.z = 535 // this is the carefully calibrated position that exactly lines up with the border
  }
}