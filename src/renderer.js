import sharedState from './sharedState'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import helpers from './helpers/helpers'
const { decodeFloat } = helpers

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
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points,
  nodesLength, edgesLength, nodes, edges

const renderLoop = () => {
  layout.step()

  for(let i=0; i<nodesLength; i++) {
    let node = nodes[i]
    let pos = layout.getNodePosition(node.node_id)
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

  var timer = Date.now() * 0.0002
  camera.position.x = Math.cos( timer ) * 1500
  camera.position.z = Math.sin( timer ) * 1500
  camera.lookAt(scene.position)

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
    nodePositions = new Float32Array(nodesLength * 3)
    edgeVertices = new Float32Array(edgesLength * 2)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 3)
    edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 3)
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)
    points = new THREE.Points(nodeGeometry, nodeMaterial)
    scene.add(points)

    for(let i=0; i<nodesLength; i++) {
      g.addNode(nodes[i].node_id, nodes[i].trumporhillary)
    }

    for(let i=0; i<edgesLength; i++) {
      g.addLink(edges[i].source, edges[i].target)
    }

    layout = forceLayout3d(g)

    requestAnimationFrame(renderLoop)
  }
}