import sharedState from './sharedState'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import helpers from './helpers/helpers'
const { decodeFloat } = helpers

const g = graph(),
  scene = new THREE.Scene(),
  raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(),
  camera = new THREE.PerspectiveCamera(75, sharedState.get('windowWidth') / sharedState.get('windowHeight'), 0.1, 3000),
  nodeGeometry = new THREE.BufferGeometry(),
  edgeGeometry = new THREE.BufferGeometry(),
  cameraDistance = 1500,
  group = new THREE.Object3D(),
  defaultEdgeOpacity = 0.005, defaultEdgeTargetOpacity = 0.02,
  defaultNodeOpacity = 0.75

let layout, renderer, nodePositions, edgeVertices, 
  nodeColors, nodeColorsBuffer,
  edgeColors, edgeColorsBuffer,
  edgeTimes, edgeTimesBuffer,
  nodeTimes, nodeTimesBuffer,
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points,
  nodesLength, edgesLength, nodes, edges,
  nodeMaterial, edgeMaterial,
  steps = 0,
  colorTimer = 1, colorIncrement = 0.01,
  fadeOutFrames = 40

raycaster.params.Points.threshold = 5

document.addEventListener("click", e => {
  event.preventDefault()
  mouse.x = ( event.clientX / sharedState.get('windowWidth') ) * 2 - 1
  mouse.y = - ( event.clientY / sharedState.get('windowHeight') ) * 2 + 1

  nodeGeometry.computeBoundingSphere()

  raycaster.setFromCamera(mouse, camera)

  let intersects = raycaster.intersectObject(points, true)

  if(intersects.length) {
    let index = [intersects[0].index]
    console.log(intersects[0])
    // window.open(`http://twitter.com/${nodes[index].handle}`, '_blank')
  }
})

const adjustSpringWeight = (fromID, toID, newWeight) => {
  // to be safe, I'll adjust both the link and spring objects to reflect the new weight
  g.getLink(fromID, toID).weight = newWeight
  layout.getSpring(fromID, toID).weight = newWeight
}

const renderLoop = () => {
  if(steps < 120) {
    layout.step()
    // steps++
  }

  for(let i=0; i<nodesLength; i++) {
    let node = nodes[i]
    let pos = layout.getNodePosition(node.id)
    nodePositions[i * 3] = pos.x
    nodePositions[i * 3 + 1] = pos.y
    nodePositions[i * 3 + 2] = pos.z
  }

  for(let i=0; i<edgesLength; i++) {
    let edge = edges[i],
      source = layout.getNodePosition(edge.source),
      target = layout.getNodePosition(edge.target)

    edgeVertices[i * 6] = source.x
    edgeVertices[i * 6 + 1] = source.y
    edgeVertices[i * 6 + 2] = source.z
    edgeVertices[i * 6 + 3] = target.x
    edgeVertices[i * 6 + 4] = target.y
    edgeVertices[i * 6 + 5] = target.z
  }

  // var timer = Date.now() * 0.0002
  // camera.position.x = Math.cos( timer ) * cameraDistance
  // camera.position.z = Math.sin( timer ) * cameraDistance
  // camera.lookAt(scene.position)

  nodeMaterial.uniforms.time.value = colorTimer
  edgeMaterial.uniforms.time.value = colorTimer

  colorTimer += colorIncrement

  nodePositionsBuffer.needsUpdate = true
  edgeVerticesBuffer.needsUpdate = true
  renderer.render(scene, camera)
  requestAnimationFrame(renderLoop)
}

export default {
  initialize(opts) {
    nodes = opts.nodes
    edges = opts.edges
    nodesLength = nodes.length
    edgesLength = edges.length
    renderer = new THREE.WebGLRenderer({ canvas: opts.element })
    edgeColors = new Float32Array(edgesLength * 2 * 3)
    nodeColors = new Float32Array(nodesLength * 3)
    nodePositions = new Float32Array(nodesLength * 3)
    edgeVertices = new Float32Array(edgesLength * 2 * 3)
    nodeTimes = new Float32Array(nodesLength * 3)
    edgeTimes = new Float32Array(edgesLength * 2 * 3)
    nodeColorsBuffer = new THREE.BufferAttribute(nodeColors, 3)
    edgeColorsBuffer = new THREE.BufferAttribute(edgeColors, 3)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 3)
    edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 3)
    nodeTimesBuffer = new THREE.BufferAttribute(nodeTimes, 3)
    edgeTimesBuffer = new THREE.BufferAttribute(edgeTimes, 3)

    nodeMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("node-vertex-shader").textContent,
      fragmentShader: document.getElementById("node-fragment-shader").textContent,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        fadeOutDur: { value: fadeOutFrames * colorIncrement },
        time: { value: 0 },
        tex: { value: opts.particleSprite },
        cameraDistance: { value: cameraDistance }
      }
    })

    edgeMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("edge-vertex-shader").textContent,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      fragmentShader: document.getElementById("edge-fragment-shader").textContent,
      uniforms: {
        time: { value: 0 },
        fadeOutDur: { value: fadeOutFrames * colorIncrement }
      }
    })
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("times", nodeTimesBuffer)
    nodeGeometry.addAttribute("color", nodeColorsBuffer)
    edgeGeometry.addAttribute("color", edgeColorsBuffer)
    edgeGeometry.addAttribute("times", edgeTimesBuffer)
    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    for(let i=0; i<nodesLength; i++) {
      nodeTimes[i * 3] = colorTimer + 0.75
      nodeTimes[i * 3 + 1] = 1
      nodeTimes[i * 3 + 2] = defaultNodeOpacity
    }

    for(let i=0; i<edgesLength; i++) {
      edgeTimes[i * 6] = colorTimer
      edgeTimes[i * 6 + 1] = 1
      edgeTimes[i * 6 + 2] = defaultEdgeOpacity
      edgeTimes[i * 6 + 3] = colorTimer
      edgeTimes[i * 6 + 4] = 1
      edgeTimes[i * 6 + 5] = defaultEdgeTargetOpacity

      edgeColors[i * 6] = 1
      edgeColors[i * 6 + 1] = 1
      edgeColors[i * 6 + 2] = 1
      edgeColors[i * 6 + 3] = 1
      edgeColors[i * 6 + 4] = 1
      edgeColors[i * 6 + 5] = 1        
    }

    for(let i=0; i<nodesLength; i++) {
      let belief = nodes[i].trumporhillary

      if(belief === 0) {
        nodeColors[i * 3] = 1
        nodeColors[i * 3 + 1] = 0.098
        nodeColors[i * 3 + 2] = 0.3255
      } else if(belief === 1 || belief === 2 || belief === 3) {
        nodeColors[i * 3] = 0
        nodeColors[i * 3 + 1] = 0.745
        nodeColors[i * 3 + 2] = 0.99
      } else {
        nodeColors[i * 3] = 1
        nodeColors[i * 3 + 1] = 1
        nodeColors[i * 3 + 2] = 1
      }
    }

    lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    points = new THREE.Points(nodeGeometry, nodeMaterial)

    group.add(lineSegments)
    group.add(points)
    scene.add(group)

    for(let i=0; i<nodesLength; i++) {
      g.addNode(nodes[i].id, nodes[i].handle)
    }

    for(let i=0; i<edgesLength; i++) {
      g.addLink(edges[i].source, edges[i].target, {}, edges[i].weight, edges[i].length)
    }

    layout = forceLayout3d(g)

    camera.position.z = cameraDistance
    camera.lookAt(scene.position)

    requestAnimationFrame(renderLoop)
  }
}