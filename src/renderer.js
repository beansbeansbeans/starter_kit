import sharedState from './sharedState'
import forceLayout3d from 'ngraph.forceLayout3d'
import asyncLayout from 'ngraph.asyncforce'
import graph from 'ngraph.graph'
import helpers from './helpers/helpers'
const { decodeFloat } = helpers
import { scaleLog, scaleLinear } from 'd3-scale'

const g = graph(),
  scene = new THREE.Scene(),
  raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(),
  camera = new THREE.PerspectiveCamera(75, sharedState.get('windowWidth') / sharedState.get('windowHeight'), 0.1, 3000),
  nodeGeometry = new THREE.BufferGeometry(),
  edgeGeometry = new THREE.BufferGeometry(),
  cameraDistance = 1500,
  maxZoom = 0, minZoom = -1600,
  group = new THREE.Object3D(),
  defaultEdgeOpacity = 0.005, defaultEdgeTargetOpacity = 0.02,
  pageRankScale = scaleLog().range([3, 18]),
  opacityScale = scaleLog().range([0.2, 0.7]),
  edgeOpacityScale = scaleLog().range([0.001, 0.03])

let layout, renderer, nodePositions, edgeVertices, 
  nodeColors, nodeColorsBuffer,
  edgeColors, edgeColorsBuffer,
  edgeTimes, edgeTimesBuffer,
  nodeTimes, nodeTimesBuffer,
  nodeSizes, nodeSizesBuffer,
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points,
  nodesLength, edgesLength, nodes, edges,
  nodeMaterial, edgeMaterial,
  steps = 0, controls,
  colorTimer = 1, colorIncrement = 0.01,
  fadeOutFrames = 40, nodeHoverTarget = -1,
  colors = {
    'conservative': [1, 0.098, 0.3255],
    'liberal': [0, 0.745, 0.99],
    'neutral': [1, 1, 1]
  },
  getOrientation = belief => {
    if(belief == 0) {
      return 'conservative'
    } else if(belief == 1) {
      return 'liberal'
    }
    return 'neutral'
  }

raycaster.params.Points.threshold = 5

document.addEventListener("mousemove", e => {
  if(sharedState.get("controlsActive")) return 

  event.preventDefault()
  mouse.x = ( event.clientX / sharedState.get('windowWidth') ) * 2 - 1
  mouse.y = - ( event.clientY / sharedState.get('windowHeight') ) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  let intersects = raycaster.intersectObject(points, true)

  if(intersects.length) {
    nodeHoverTarget = [intersects[0].index]
    console.log(intersects[0])
  }
})

document.addEventListener("click", e => {
  if(nodeHoverTarget > -1) {
    window.open(`http://twitter.com/${nodes[nodeHoverTarget].handle}`, '_blank')
  }
})

const getNodesForEdge = i => {
  let source, target, edge = edges[i]

  for(let j=0; j<nodesLength; j++) {
    if(typeof source !== 'undefined' && typeof target !== 'undefined') break

    let node = nodes[j]

    if(node.id == edge.source) {
      source = node
    } else if(node.id == edge.target) {
      target = node
    }
  }

  return { source, target }
}

const resetEdgeColors = i => {
  const { source, target } = getNodesForEdge(i)
  const edge = edges[i]

  let sourceColor = colors.neutral, 
    targetColor = colors.neutral

  if(source) sourceColor = colors[getOrientation(source.ideology)]
  if(target) targetColor = colors[getOrientation(target.ideology)]

  edgeColors[i * 6] = sourceColor[0]
  edgeColors[i * 6 + 1] = sourceColor[1]
  edgeColors[i * 6 + 2] = sourceColor[2]
  edgeColors[i * 6 + 3] = targetColor[0]
  edgeColors[i * 6 + 4] = targetColor[1]
  edgeColors[i * 6 + 5] = targetColor[2]
}

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

  var timer = Date.now() * 0.0002
  camera.position.x = Math.cos( timer ) * cameraDistance
  camera.position.z = Math.sin( timer ) * cameraDistance
  camera.lookAt(scene.position)

  nodeMaterial.uniforms.time.value = colorTimer
  edgeMaterial.uniforms.time.value = colorTimer

  colorTimer += colorIncrement
  controls.update()

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
    nodeSizes = new Float32Array(nodesLength)
    nodeColorsBuffer = new THREE.BufferAttribute(nodeColors, 3)
    edgeColorsBuffer = new THREE.BufferAttribute(edgeColors, 3)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 3)
    nodeSizesBuffer = new THREE.BufferAttribute(nodeSizes, 1)
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

    pageRankScale.domain([opts.minPageRank, opts.maxPageRank])
    opacityScale.domain([opts.minPageRank, opts.maxPageRank])
    edgeOpacityScale.domain([opts.minPageRank, opts.maxPageRank])
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("times", nodeTimesBuffer)
    nodeGeometry.addAttribute("size", nodeSizesBuffer)
    nodeGeometry.addAttribute("color", nodeColorsBuffer)
    edgeGeometry.addAttribute("color", edgeColorsBuffer)
    edgeGeometry.addAttribute("times", edgeTimesBuffer)
    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)

    for(let i=0; i<nodesLength; i++) {
      let node = nodes[i]
      let color = colors[getOrientation(node.ideology)]

      nodeColors[i * 3] = color[0]
      nodeColors[i * 3 + 1] = color[1]
      nodeColors[i * 3 + 2] = color[2]

      nodeTimes[i * 3] = colorTimer + 0.75
      nodeTimes[i * 3 + 1] = 1
      nodeTimes[i * 3 + 2] = opacityScale(node.pagerank)

      nodeSizes[i] = pageRankScale(node.pagerank)
    }

    for(let i=0; i<edgesLength; i++) {
      let { source, target } = getNodesForEdge(i)

      if(source && target) {
        edgeTimes[i * 6] = colorTimer
        edgeTimes[i * 6 + 1] = 1
        edgeTimes[i * 6 + 2] = Math.min(edgeOpacityScale(source.pagerank), edgeOpacityScale(target.pagerank))
        edgeTimes[i * 6 + 3] = colorTimer
        edgeTimes[i * 6 + 4] = 1
        edgeTimes[i * 6 + 5] = edgeOpacityScale(target.pagerank)

        resetEdgeColors(i)              
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

    // layout = forceLayout3d(g)
    layout = asyncLayout(g, { is3d: true })

    // camera.position.z = cameraDistance
    // camera.lookAt(scene.position)

    controls = new THREE.Controls(camera, renderer.domElement, group, minZoom, maxZoom)

    requestAnimationFrame(renderLoop)

    setTimeout(() => { // timeout seems to be necessary for some reason?
      nodeGeometry.computeBoundingSphere()
    }, 1000)
  },
  pan(direction) {
    controls.pan(direction)
  }
}