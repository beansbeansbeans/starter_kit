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
  cameraDistance = 1500

let layout, renderer, nodePositions, edgeVertices, 
  edgeTimes, edgeTimesBuffer,
  nodeTimes, nodeTimesBuffer,
  nodeColors, nodeColorsBuffer, nodeSizes, nodeSizesBuffer,
  nodePositionsBuffer, edgeVerticesBuffer, lineSegments, points,
  nodesLength, edgesLength, nodes, edges,
  nodeMaterial, edgeMaterial,
  steps = 0,
  tweets, retweets,
  colorTimer = 1, colorIncrement = 0.01,
  fadeOutFrames = 40,
  lastActiveTweet = null, activeTweet = null,
  illuminateFollowersInterval = null

const renderLoop = () => {
  if(steps < 120) {
    layout.step()
    steps++
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

  if(activeTweet !== lastActiveTweet) {
    if(activeTweet !== null && lastActiveTweet == null) {
      for(let i=0; i<nodesLength; i++) {
        nodeTimes[i * 3] = colorTimer
        nodeTimes[i * 3 + 1] = 0 // 0 means fade out    
      }

      for(let i=0; i<edgesLength; i++) {
        edgeTimes[i * 6] = colorTimer
        edgeTimes[i * 6 + 1] = 0 // 0 means fade out    
        edgeTimes[i * 6 + 3] = colorTimer      
        edgeTimes[i * 6 + 4] = 0      
      }
    } else if(activeTweet == null && lastActiveTweet != null) {
      for(let i=0; i<nodesLength; i++) {
        nodeTimes[i * 3] = colorTimer
        nodeTimes[i * 3 + 1] = 1   
      }

      for(let i=0; i<edgesLength; i++) {
        edgeTimes[i * 6] = colorTimer
        edgeTimes[i * 6 + 1] = 1
        edgeTimes[i * 6 + 3] = colorTimer      
        edgeTimes[i * 6 + 4] = 1      
      }
    }
    
    nodeTimesBuffer.needsUpdate = true
    edgeTimesBuffer.needsUpdate = true
  }

  var timer = Date.now() * 0.0002
  camera.position.x = Math.cos( timer ) * cameraDistance
  camera.position.z = Math.sin( timer ) * cameraDistance
  camera.lookAt(scene.position)

  nodePositionsBuffer.needsUpdate = true
  edgeVerticesBuffer.needsUpdate = true

  nodeMaterial.uniforms.time.value = colorTimer
  edgeMaterial.uniforms.time.value = colorTimer

  colorTimer += colorIncrement

  lastActiveTweet = activeTweet

  renderer.render(scene, camera)
  requestAnimationFrame(renderLoop)
}

export default {
  initialize(opts) {
    tweets = opts.tweets
    retweets = opts.retweets
    nodes = opts.nodes
    edges = opts.edges

    nodesLength = nodes.length
    edgesLength = edges.length
    
    renderer = new THREE.WebGLRenderer({ canvas: opts.element }),
    nodeColors = new Float32Array(nodesLength * 3)
    nodePositions = new Float32Array(nodesLength * 3)
    nodeTimes = new Float32Array(nodesLength * 3)
    edgeVertices = new Float32Array(edgesLength * 2 * 3)
    edgeTimes = new Float32Array(edgesLength * 2 * 3)
    nodeSizes = new Float32Array(nodesLength)
    nodeTimesBuffer = new THREE.BufferAttribute(nodeTimes, 3)
    nodeColorsBuffer = new THREE.BufferAttribute(nodeColors, 3)
    nodePositionsBuffer = new THREE.BufferAttribute(nodePositions, 3)
    edgeVerticesBuffer = new THREE.BufferAttribute(edgeVertices, 3)
    nodeSizesBuffer = new THREE.BufferAttribute(nodeSizes, 1)
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
      fragmentShader: document.getElementById("edge-fragment-shader").textContent,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        fadeOutDur: { value: fadeOutFrames * colorIncrement }
      }
    })
  
    renderer.setSize(sharedState.get('windowWidth'), sharedState.get('windowHeight'))
    renderer.setPixelRatio(window.devicePixelRatio)

    nodeGeometry.addAttribute("times", nodeTimesBuffer)
    nodeGeometry.addAttribute("size", nodeSizesBuffer)
    nodeGeometry.addAttribute("color", nodeColorsBuffer)
    nodeGeometry.addAttribute("position", nodePositionsBuffer)
    edgeGeometry.addAttribute("position", edgeVerticesBuffer)
    edgeGeometry.addAttribute("times", edgeTimesBuffer)

    for(let i=0; i<nodesLength; i++) {
      let node = nodes[i]
      let belief = node.trumporhillary

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

      nodeSizes[i] = node.pagerank
    }

    for(let i=0; i<nodesLength; i++) {
      nodeTimes[i * 3] = 0
      nodeTimes[i * 3 + 1] = 1
      nodeTimes[i * 3 + 2] = 0.5
    }

    for(let i=0; i<edgesLength; i++) {
      edgeTimes[i * 6] = 0
      edgeTimes[i * 6 + 1] = 1
      edgeTimes[i * 6 + 2] = 0.1
      edgeTimes[i * 6 + 3] = 0
      edgeTimes[i * 6 + 4] = 1
      edgeTimes[i * 6 + 5] = 0.1
    }

    lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)
    points = new THREE.Points(nodeGeometry, nodeMaterial)
    scene.add(points)

    for(let i=0; i<nodesLength; i++) {
      g.addNode(nodes[i].id, nodes[i].handle)
    }

    for(let i=0; i<edgesLength; i++) {
      g.addLink(edges[i].source, edges[i].target)
    }

    layout = forceLayout3d(g)

    requestAnimationFrame(renderLoop)
  },
  setActiveTweet(newActiveTweet) {
    activeTweet = newActiveTweet

    if(activeTweet) {
      let followers = [activeTweet.node_id] // these are the people who should be illuminated
      let currentCrop = activeTweet.node_id // these are the people we are currently looking for followers of
      let newCrop = []

      let retweetIterator = 0

      illuminateFollowersInterval = setInterval(() => {
        const followersLength = followers.length
        
        for(let i=0; i<edgesLength; i++) {
          let edge = edges[i]

          // source follows target
          if(currentCrop == edge.target && followers.indexOf(edge.source) === -1) {
            followers.push(edge.source)
            newCrop.push(edge.source)

            edgeTimes[i * 6] = colorTimer
            edgeTimes[i * 6 + 1] = 1
            edgeTimes[i * 6 + 2] = 0.5
            edgeTimes[i * 6 + 3] = colorTimer      
            edgeTimes[i * 6 + 4] = 1  
            edgeTimes[i * 6 + 5] = 0.5 
          }
        }

        for(let i=0; i<nodesLength; i++) {
          if(newCrop.indexOf(nodes[i].id) > -1) {
            nodeTimes[i * 3] = colorTimer
            nodeTimes[i * 3 + 1] = 1
            nodeTimes[i * 3 + 2] = 1
          }
        }

        nodeTimesBuffer.needsUpdate = true
        edgeTimesBuffer.needsUpdate = true

        if(retweets[activeTweet._id].length <= retweetIterator) {
          window.clearInterval(illuminateFollowersInterval)
        } else {
          currentCrop = retweets[activeTweet._id][retweetIterator].retweeter_node_id

          newCrop = []          
        }

        retweetIterator++
      }, fadeOutFrames * 17) // assuming 60fps
    }
  }
}
