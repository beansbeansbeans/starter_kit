import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'
import treeData from './tree'
const { Tree, Node } = treeData
import DebugVisualizer from './debugVisualizer'
import DebugWebgl from './debugWebgl'
import mediator from './mediator'
import processArgument from './processArgument'
import MoralMatricesChart from './moralMatricesChart'
import { moralMatrices, matrices } from './config'

let shaderFiles = ['drawRect.fs', 'drawRect.vs'], argument, directory = {}, debug = false, web, removedKeys = [], resolver, mouseX, mouseY, debugNode

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) shaders[shaderFiles[i]] = data[i]
        return data
      })
    ,
    getData: () => 
      Promise.all(['immigration'].map(getData))
        .then(data => argument = data)
  }

class App extends Component {
  state = { 
    argumentLabels: [],
    moralMatrix: moralMatrices.map(m => ({
      id: m.id,
      label: m.label,
      value: null
    })),
    hoverInfo: '',
    constraints: []
  }

  componentWillMount() {
    bindAll(this, ['updateWeb', 'resolve', 'mouseLeaveRects'])
  }

  updateWeb() {
    if(typeof web === 'undefined') return

    let argumentLabels = [], 
      depth = web.getDepth(),
      rectWidth = sharedState.get('containerWidth') / depth

    web.traverseDF(n => {
      argumentLabels.push({
        top: n.top,
        left: n.depth * rectWidth,
        height: n.height,
        width: rectWidth,
        moralMatrices: n.extraData.moralMatrices,
        id: n._id
      })
    })

    this.setState({ argumentLabels })
  }

  componentDidMount() {
    mediator.subscribe("reconcileTree", this.updateWeb)

    mediator.subscribe("mouseleave", this.mouseLeaveRects)
  }

  resolve(label) {
    this.setState({
      moralMatrix: this.state.moralMatrix.map(d => {
        if(label) {
          d.value = matrices[label][d.id]
        } else {
          d.value = null
        }

        return d
      })
    }, () => {
      resolver = resolve(label)
      resolveIterate()              
    })
  }

  mouseLeaveRects() {
    this.setState({ hoverInfo: '' })
  }

  render({ }, { argumentLabels, moralMatrix, hoverInfo, constraints }) {
    let debugDOM = null, argumentLabelsDOM = null

    if(debug) {
      debugDOM = <div id="debug">
        <canvas 
          width={sharedState.get("windowWidth")}
          height={sharedState.get("windowHeight")}></canvas>
        <svg id="debug-svg"></svg>
      </div>
    } else {
      argumentLabelsDOM = []
      for(let i=0; i<argumentLabels.length; i++) {
        let label = argumentLabels[i]

        argumentLabelsDOM.push(<div 
          style={`position:fixed; top: ${label.top}px; left: ${label.left + 3}px; height: ${label.height}px; width: ${label.width}px; font-size: 11px; background-color: ${constraints.find(c => c.id === label.id) ? 'yellow' : ''}`}
          class="debug-label"
          onMouseOver={() => {
            let node = web.find(label.id, '_id')
            this.setState({ hoverInfo: node.data })
            console.log(node)
          } }
          onClick={() => {
            let newConstraints = constraints
            let indexOfThis = newConstraints.findIndex(c => c.id === label.id)
            if(indexOfThis > -1) {
              newConstraints.splice(indexOfThis, 1)
            } else {
              newConstraints.push(label)
            }

            this.setState({ constraints: newConstraints })
          }}
          data-id={label.id}>
          {label.id.substring(0, 2) + ' ' + (label.moralMatrices ? label.moralMatrices.join(" ") : '')}
          </div>)
      }
    }

    return (
      <app>
        {debugDOM}
        <div id="webgl-wrapper"></div>
        <div 
          onMouseOver={this.mouseLeaveRects}
          id="controls">
          <div class="matrices">
            <MoralMatricesChart matrix={moralMatrix} />
            <button onClick={() => this.resolve('A')}>moral matrix A</button>
            <button onClick={() => this.resolve('B')}>moral matrix B</button>
            <button onClick={this.resolve}>reset</button>
          </div>
          <div class="solver">
            <button onClick={() => {
              web.solve(constraints.map(c => ({
                node: directory[c.id].node,
                value: true
              })))
            }}>solve</button>
          </div>
          <button onClick={() => {
            web.removeSingle(debugNode)

            renderer.update(web)
          }}>debug remove node</button>
          <button onClick={() => {
            web.addBack(debugNode)

            renderer.update(web)
          }}>debug add node</button>
        </div>
        {argumentLabelsDOM}
        <div style={`transform: translate3d(${mouseX}px, ${mouseY}px, 0)`} id="hover-info">{hoverInfo}</div>
      </app>
    )
  }
}

function* resolve(label) {
  if(label) {
    let keys = Object.keys(directory)

    for(let i=0; i<keys.length; i++) {
      let obj = directory[keys[i]], node = obj.node
      
      if(!obj.inWeb) continue // don't remove nodes that are descendents of nodes that have been removed

      if(node.extraData.moralMatrices.indexOf(label) < 0) {
        obj.inWeb = false

        removedKeys.push(node._id)
        web.removeSingle(node)

        yield node
      }
    }

    removedKeys = removeDuplicates(removedKeys)
  }

  for(let i=0; i<removedKeys.length; i++) {
    let node = directory[removedKeys[i]].node

    if((label && node.extraData.moralMatrices.indexOf(label) > -1) || typeof label === 'undefined') {
      if(!directory[node._id].inWeb) {
        let nearestActiveAncestor = web.traverseUp(n => {
          return directory[n._id].inWeb
        }, node)

        directory[node._id].inWeb = true
        node.parent = nearestActiveAncestor

        // in case a child of this node had been reassigned to a different parent when this node was deleted, and is no longer in the tree
        let toDelete = []
        for(let i=0; i<node.children.length; i++) {
          let child = node.children[i]

          if(!directory[child._id].inWeb) {
            toDelete.push(i)
          }
        }

        for(let i=0; i<toDelete.length; i++) {
          node.children.splice(toDelete[i] - i, 1)
        }

        web.addBack(node)

        yield node
      }
    }
  }

  return
}

function resolveIterate() {
  let result = resolver.next()

  renderer.update(web)

  if(!result.done) {
    mediator.subscribe("manualReconcile", resolveIterate, true)
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)

  processArgument(argument, 20)

  handleResize()

  let toSearch = [{ node: argument[0] }]

  function* walk() {
    let newToSearch = []

    for(let i=0; i<toSearch.length; i++) {
      let node = toSearch[i].node,
        parent = toSearch[i].parent,
        treeNode

      if(typeof parent === 'undefined') {
        web = new Tree(node.data, {
          moralMatrices: node.moralMatrices
        })
        
        window.web = web

        treeNode = web._root
      } else {
        treeNode = new Node(node.data, node.supports, {
          moralMatrices: node.moralMatrices
        })

        web.add(treeNode, parent)
      }

      if(node.debug) debugNode = treeNode

      directory[treeNode._id] = { 
        node: treeNode,
        inWeb: true 
      }

      if(Object.keys(directory).length === 20) {
        mediator.publish("flip")
      }

      yield treeNode

      node.children.forEach(c => newToSearch.push({
        parent: treeNode,
        node: c
      }))
    }

    toSearch = newToSearch

    if(toSearch.length) {
      yield* walk()
    } else {
      return
    }
  }

  const walker = walk()

  if(debug) {
    DebugWebgl.initialize({ canvas: document.querySelector("canvas") })
  } else {
    renderer.initialize({ container: document.querySelector("#webgl-wrapper"), shaders })
  }

  function iterate() {
    result = walker.next()

    if(!result.done) {
      mediator.subscribe("reconcileTree", iterate, true)
    } else {

      if(debug) {
        DebugVisualizer.initialize(web)
        DebugVisualizer.draw()
      }
    }

    if(debug) {
      DebugWebgl.draw(web)
    } else {
      renderer.update(web)
    }
  }

  iterate()
})

const handleResize = () => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  const rect = document.querySelector("#webgl-wrapper").getBoundingClientRect()
  sharedState.set("containerWidth", rect.width)
  sharedState.set("containerHeight", rect.height)

  renderer.resize()
}

window.addEventListener("resize", debounce(handleResize, 250))

window.addEventListener("mousemove", e => {
  mouseX = e.clientX
  mouseY = e.clientY

  mediator.publish("mousemove", { 
    x: mouseX, 
    y: mouseY 
  })
})

window.addEventListener("mouseleave", e => {
  mediator.publish("mouseleave")
})