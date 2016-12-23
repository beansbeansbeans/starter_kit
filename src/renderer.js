import sharedState from './sharedState'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'

const g = graph(),
  scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(75, sharedState.get('windowWidth') / sharedState.get('windowHeight'), 0.1, 3000),
  nodeGeometry = new THREE.BufferGeometry(),
  edgeGeometry = new THREE.BufferGeometry(),
  nodeMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById("node-vertex-shader").textContent,
    fragmentShader: document.getElementById("node-fragment-shader").textContent
  }),
  edgeMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById("edge-vertex-shader").textContent,
    fragmentShader: document.getElementById("edge-fragment-shader").textContent
  })

let layout, renderer, nodePositions, edgeVertices, 
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points

const renderLoop = () => {
  renderer.render(scene, camera)

  requestAnimationFrame(renderLoop)
}

export default {
  initialize({ element, nodes, edges, particleSprite }) {
    renderer = new THREE.WebGLRenderer({ canvas: element })
    nodePositions = new Float32Array(nodes.length)
    edgeVertices = new Float32Array(edges.length * 2)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 1)
    edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 2)
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)
    points = new THREE.Points(nodeGeometry, nodeMaterial)
    scene.add(points)

    requestAnimationFrame(renderLoop)
  }
}