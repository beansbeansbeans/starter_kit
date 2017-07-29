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
      debugDOM = <svg id="debug-svg"></svg>
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

  console.log(argument)

  const traverse = node => node.children.reduce((acc, curr) => {
    console.log(curr)
    if(curr.children && curr.children.length) {
      return traverse(curr)
    }
    return curr
  }, false)

  traverse(argument[0])

  // create web
  const web = new Tree('climate change is a hoax')
  const attackNode = new Node('no it is not', false)
  web.add(attackNode, web._root)

  web.add(new Node('yes', true), attackNode)
  web.add(new Node('no', false), attackNode)

  const supportNode = new Node('that is right', true)
  web.add(supportNode, web._root)
  web.add(new Node('another reason it is right', true), web._root)
  web.add(new Node('another reason it is wrong', false), web._root)

  const nestedSupportNode = new Node('it is right because', true)
  web.add(nestedSupportNode, supportNode)

  const doubleNestedSupport = new Node('nested support', true)
  web.add(doubleNestedSupport, nestedSupportNode)

  web.add(new Node('yes', true), doubleNestedSupport)
  web.add(new Node('no', false), doubleNestedSupport)

  const nestedAttackNode = new Node('it is wrong because', false)
  web.add(nestedAttackNode, supportNode)

  web.solve([ 
    { node: supportNode, value: true },
    // { node: nestedAttackNode, value: true }
  ])

  if(debug) {
    DebugVisualizer.initialize(web)
    DebugVisualizer.draw()    
  } else {
    renderer.initialize({ container: document.querySelector("app"), shaders })
  }

  console.log(web)
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  renderer.resize()
}, 250))
