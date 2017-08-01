import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'
import treeData from './tree'
const { Tree, Node } = treeData
import DebugVisualizer from './debugVisualizer'
import DebugWebgl from './debugWebgl'

let shaderFiles = ['drawRect.fs', 'drawRect.vs'], argument, debug = true

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) {
          shaders[shaderFiles[i]] = data[i]
        }
        return data
      })
    ,
    getData: () => 
      Promise.all(['argument'].map(getData))
        .then(data => argument = data)
  }

class App extends Component {
  render({}) {
    let debugDOM = null
    if(debug) {
      debugDOM = <div id="debug">
        <canvas 
          width={sharedState.get("windowWidth")}
          height={sharedState.get("windowHeight")}></canvas>
        <svg id="debug-svg"></svg>
      </div>
    }

    return (
      <app>
        {debugDOM}
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)

  let match, toSearch = [{ node: argument[0] }], web,
    constraints = []

  function* walk() {
    let newToSearch = []

    yield 42

    for(let i=0; i<toSearch.length; i++) {
      let node = toSearch[i].node,
        parent = toSearch[i].parent,
        treeNode

      if(typeof parent === 'undefined') {
        web = new Tree(node.data)
        treeNode = web._root
      } else {
        treeNode = new Node(node.data, node.supports)
        web.add(treeNode, parent)
      }

      if(typeof node.constraintValue !== 'undefined') {
        constraints.push({
          node: treeNode,
          value: node.constraintValue
        })
      }

      if(node.children) {
        node.children.forEach(c => newToSearch.push({
          parent: treeNode,
          node: c
        }))
      }
    }

    toSearch = newToSearch

    if(toSearch.length) {
      yield* walk()
    } else {
      return
    }
  }

  var walker = walk()

  function attempt() {
    result = walker.next()
    console.log(result)
    console.log(web)

    if(!result.done) {
      setTimeout(attempt, 1000)
    } else {
      web.solve(constraints)

      if(debug) {
        DebugVisualizer.initialize(web)
        DebugVisualizer.draw()    
        DebugWebgl.initialize({ canvas: document.querySelector("canvas") })
        DebugWebgl.draw(web)
      } else {
        renderer.initialize({ container: document.querySelector("app"), shaders })
      }

      console.log(web)
    }
  }

  attempt()
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  renderer.resize()
}, 250))
