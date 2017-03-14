import sharedState from './sharedState'
import { scaleLinear } from 'd3-scale'
import './controls'

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 3000),
  cameraDistance = 975, // this is the carefully calibrated position that exactly lines up with the border
  scene = new THREE.Scene(),
  arrowGeometry = new THREE.BufferGeometry(),
  particlesCount = 100,
  particleGeometry = new THREE.BufferGeometry(),
  particleVertices = new Float32Array(particlesCount * 3),
  particleVerticesBuffer = new THREE.BufferAttribute(particleVertices, 3),
  center = new THREE.Vector3(),
  particles = []

const particle = index => {
  let positions = [],
    advectInterval = null

  const advect = () => { // rk-2
    particleVertices[index * 3] = positions[positions.length - 1][0]
    particleVertices[index * 3 + 1] = positions[positions.length - 1][1]
    particleVertices[index * 3 + 2] = positions[positions.length - 1][2]

    const currentPosition = positions[positions.length - 1],
      currentVelocity = fieldAt(currentPosition[0], currentPosition[1], currentPosition[2]),
      nextPosition = [ 
        currentPosition[0] + stepSize * currentVelocity.x, 
        currentPosition[1] + stepSize * currentVelocity.y,
        currentPosition[2] + stepSize * currentVelocity.z
      ],
      nextVelocity = fieldAt(nextPosition[0], nextPosition[1], nextPosition[2])

    positions.push([
      currentPosition[0] + stepSize * (currentVelocity.x + nextVelocity.x) / 2,
      currentPosition[1] + stepSize * (currentVelocity.y + nextVelocity.y) / 2,
      currentPosition[2] + stepSize * (currentVelocity.z + nextVelocity.z) / 2
    ])

    if(false) { // here determine whether out of bounds
      window.clearInterval(advectInterval)
    }
  }

  return {
    spawn: initialPosition => {
      window.clearInterval(advectInterval)

      positions = [initialPosition]
      
      advectInterval = setInterval(advect, 500)
    }
  }
}

for(let i=0; i<particlesCount; i++) particles.push(particle(i))

let opts = {}, controls

const renderLoop = () => {
  particleVerticesBuffer.needsUpdate = true
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(renderLoop)
}

const fieldAt = (x, y, z) => {
  // z = Math.max(1, z) // to prevent division by 0

  const i = [1, 0, 0], j = [0, 1, 0], k = [0, 0, 1]

  // field equation: (y/z)i + (-x/z)j + 0k
  return { 
    x: 2*x*i[0] + 6*y*j[0] - 2*x*k[0],
    y: 2*x*i[1] + 6*y*j[1] - 2*x*k[1],
    z: 2*x*i[2] + 6*y*j[2] - 2*x*k[2]
  }
}

const getVector = (function() {
  const result = new THREE.Vector3()

  const func = ({ x, y, z }) => {
    const vec = fieldAt(x, y, z)
    result.x = vec.x
    result.y = vec.y
    result.z = vec.z

    return { 
      mag: result.length(),
      vector: result.normalize()
    }
  }
  return func
})()

const stepSize = 0.1
let spawnIterator = 0

export default {
  initialize(config) {
    opts = config
    renderer = new THREE.WebGLRenderer({ canvas: opts.element, alpha: true })

    renderer.setSize(opts.pxPerBlock * opts.res, opts.pxPerBlock * opts.res)
    renderer.setPixelRatio(window.devicePixelRatio)

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("particle-vertex-shader").textContent,
      fragmentShader: document.getElementById("particle-fragment-shader").textContent,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        tex: { value: opts.particleSprite },
        cameraDistance: { value: cameraDistance }
      }
    })

    particleGeometry.addAttribute("position", particleVerticesBuffer)

    scene.add(new THREE.Points(particleGeometry, particleMaterial))

    const arrowVertices = new Float32Array(opts.res * opts.res * opts.res * 3 * 2 * 3) // 3 * 2 ==> 2 triangles, the final * 3 is for the x, y, z coordinates
    const dim = new Float32Array(opts.res * opts.res * opts.res * 3 * 2 * 2)

    const arrowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: document.getElementById("arrow-vertex-shader").textContent,
      fragmentShader: document.getElementById("arrow-fragment-shader").textContent,
      uniforms: {
        tex: { type: 't', value: opts.arrow }
      }
    })

    const upperRight = new THREE.Vector3()
    const upperLeft = new THREE.Vector3()
    const lowerLeft = new THREE.Vector3()
    const lowerRight = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const m = new THREE.Matrix4()

    let arrowSize, maxMag = 0, minMag = Infinity

    for(let i=-(opts.res / 2); i<opts.res / 2; i++) { // x
      for(let j=-(opts.res / 2); j<opts.res / 2; j++) { 
        for(let k=0; k<opts.res; k++) {
          let { mag } = getVector({ x: i, y: j, z: k })

          if(mag > maxMag) maxMag = mag
          if(mag < minMag) minMag = mag          
        }
      }
    }

    const magScale = scaleLinear().domain([ minMag, maxMag ]).range([1, opts.pxPerBlock]).clamp(true)

    let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0, minZ = Infinity, maxZ = 0

    for(let i=-(opts.res / 2); i<opts.res / 2; i++) { // x
      for(let j=-(opts.res / 2); j<opts.res / 2; j++) { // y
        for(let k=0; k<opts.res; k++) { // z
          let { mag, vector } = getVector({ x: i, y: j, z: k })
          let multiplier = (((i + opts.res / 2) * opts.res * opts.res) + ((j + opts.res / 2) * opts.res) + k) * 18
          let centerX = opts.pxPerBlock * i % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
          let centerY = opts.pxPerBlock * j % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2
          let centerZ = opts.pxPerBlock * k % (opts.res * opts.pxPerBlock) + opts.pxPerBlock / 2

          if(centerX < minX) minX = centerX
          if(centerX > maxX) maxX = centerX
          if(centerY < minY) minY = centerY
          if(centerY > maxY) maxY = centerY
          if(centerZ < minZ) minZ = centerZ
          if(centerZ > maxZ) maxZ = centerZ

          arrowSize = magScale(mag)

          upperRight.x = arrowSize / 2
          upperRight.y = arrowSize / 2
          upperRight.z = 0

          lowerRight.x = arrowSize / 2
          lowerRight.y = -arrowSize / 2
          lowerRight.z = 0

          upperLeft.x = -arrowSize / 2
          upperLeft.y = arrowSize / 2
          upperLeft.z = 0

          lowerLeft.x = -arrowSize / 2
          lowerLeft.y = -arrowSize / 2
          lowerLeft.z = 0

          quaternion.setFromUnitVectors( new THREE.Vector3(1, 0, 0), vector )

          m.compose(new THREE.Vector3(centerX, centerY, centerZ), quaternion, new THREE.Vector3(1, 1, 1))

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

          let dimMultiplier = (((i + opts.res / 2) * opts.res * opts.res) + ((j + opts.res / 2) * opts.res) + k) * 12
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
    }

    center.x = minX + (maxX - minX) / 2
    center.y = minY + (maxY - minY) / 2
    center.z = minZ + (maxZ - minZ) / 2

    arrowGeometry.addAttribute("position", new THREE.BufferAttribute(arrowVertices, 3))
    arrowGeometry.addAttribute("dim", new THREE.BufferAttribute(dim, 2))

    scene.add(new THREE.Mesh(arrowGeometry, arrowMaterial))

    controls = new THREE.TrackballControls( camera )
    controls.target = center

    requestAnimationFrame(renderLoop)

    camera.position.z = cameraDistance
  },
  spawn() {
    particles[spawnIterator].spawn([
      -300 + Math.random() * 600,
      -300 + Math.random() * 600,
      Math.random() * 600
    ])

    spawnIterator = (spawnIterator + 1) % particlesCount
  }
}