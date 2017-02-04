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
  cameraDistance = 1500,
  seedID = 7163

let layout, renderer, nodePositions, edgeVertices, 
  nodeColors, nodeColorsBuffer,
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points,
  nodesLength, edgesLength, nodes, edges,
  nodeMaterial, edgeMaterial,
  steps = 0,
  graphNodes = [], graphEdges = []

const renderLoop = () => {
  // if(steps < 120) {
    layout.step()
  //   steps++
  // }

  for(let i=0; i<graphNodes.length; i++) {
    let node = graphNodes[i]
    let pos = layout.getNodePosition(node)
    nodePositions[i * 3] = pos.x
    nodePositions[i * 3 + 1] = pos.y
    nodePositions[i * 3 + 2] = pos.z
  }

  for(let i=0; i<graphEdges.length; i++) {
    let edge = graphEdges[i],
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
  camera.position.x = Math.cos( timer ) * cameraDistance
  camera.position.z = Math.sin( timer ) * cameraDistance
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
    renderer = new THREE.WebGLRenderer({ canvas: opts.element }),
    nodeColors = new Float32Array(nodesLength * 4)
    nodePositions = new Float32Array(nodesLength * 3)
    edgeVertices = new Float32Array(edgesLength * 2 * 3)
    nodeColorsBuffer = new THREE.BufferAttribute(nodeColors, 4)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 3)
    edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 3)

    nodeMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("node-vertex-shader").textContent,
      fragmentShader: document.getElementById("node-fragment-shader").textContent,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        tex: { value: opts.particleSprite },
        cameraDistance: { value: cameraDistance }
      }
    })

    edgeMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("edge-vertex-shader").textContent,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      fragmentShader: document.getElementById("edge-fragment-shader").textContent
    })
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("color", nodeColorsBuffer)
    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    for(let i=0; i<nodesLength; i++) {
      let belief = nodes[i].trumporhillary

      if(belief === 0) {
        nodeColors[i * 4] = 1
        nodeColors[i * 4 + 1] = 0.098
        nodeColors[i * 4 + 2] = 0.3255
      } else if(belief === 1 || belief === 2 || belief === 3) {
        nodeColors[i * 4] = 0
        nodeColors[i * 4 + 1] = 0.745
        nodeColors[i * 4 + 2] = 0.99
      } else {
        nodeColors[i * 4] = 1
        nodeColors[i * 4 + 1] = 1
        nodeColors[i * 4 + 2] = 1
      }

      nodeColors[i * 4 + 3] = 0.5
    }

    lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)
    points = new THREE.Points(nodeGeometry, nodeMaterial)
    scene.add(points)

    let accumulatedEdges = {}
    let accumulatedNodes = [seedID]
    let copyOfEdges = JSON.parse(JSON.stringify(edges))
    let lastNodesIndex = 0

    window.graphNodes = graphNodes
    window.graphEdges = graphEdges

    let buildNetworkIntervalID = setInterval(() => {
      let nextDegreeNodes = [], nextDegreeEdges = []

      for(let i=lastNodesIndex, l = accumulatedNodes.length; i<l; i++) {
        let id = accumulatedNodes[i], toDelete = []

        for(let j=0, len = copyOfEdges.length; j<len; j++) {
          let edge = copyOfEdges[j]

          if(typeof accumulatedEdges[edge.source] === 'undefined') {
            accumulatedEdges[edge.source] = []
          }

          if(edge.source === id && accumulatedEdges[edge.source].indexOf(edge.target) === -1) {            
            nextDegreeEdges.push(edge)
            if(accumulatedNodes.indexOf(edge.target) === -1) {
              nextDegreeNodes.push(edge.target)
            }

            toDelete.push(j)
          }
        }  

        for(let j=0; j<toDelete.length; j++) {
          copyOfEdges.splice(toDelete[j] - j, 1)
        }
      }

      for(let i=0; i<nextDegreeNodes.length; i++) {
        g.addNode(nextDegreeNodes[i])
      }

      for(let i=0; i<nextDegreeEdges.length; i++) {
        g.addLink(nextDegreeEdges[i].source, nextDegreeEdges[i].target)
      }

      lastNodesIndex = accumulatedNodes.length
      accumulatedNodes = accumulatedNodes.concat(nextDegreeNodes)

      graphNodes = accumulatedNodes
      graphEdges = graphEdges.concat(nextDegreeEdges)

      if(accumulatedNodes.length >= nodesLength || nextDegreeNodes.length === 0) {
        window.clearInterval(buildNetworkIntervalID)
      }
    }, 1000)

    layout = forceLayout3d(g)

    requestAnimationFrame(renderLoop)
  }
}