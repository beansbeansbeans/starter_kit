import sharedState from './sharedState'

const scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(40, sharedState.get('windowWidth') / sharedState.get('windowHeight'), 1, 5000),
  nodeGeometry = new THREE.BufferGeometry(),
  edgeGeometry = new THREE.BufferGeometry(),
  nodeMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById("node-vertex-shader"),
    fragmentShader: document.getElementById("node-fragment-shader")
  }),
  edgeMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById("edge-vertex-shader"),
    fragmentShader: document.getElementById("edge-fragment-shader")
  })

export default {
  initialize({ element, nodes, edges }) {
    const renderer = new THREE.WebGLRenderer({
        alpha: true, 
        canvas: document.querySelector("#webgl-canvas")
      }),
      nodePositions = new Float32Array(nodes.length),
      edgeVertices = new Float32Array(edges.length * 2),
      nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 1),
      edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 2)
    
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    const lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)
    const points = new THREE.Points(nodeGeometry, nodeMaterial)
    scene.add(points)
    
  }
}