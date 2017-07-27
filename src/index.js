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

  // create web
  const web = new Tree('climate change is a hoax')
  web.add(new Node('no it is not', false), web._root)

  const supportNode = new Node('that is right', true)
  web.add(supportNode, web._root)

  const nestedSupportNode = new Node('it is right because', true)
  web.add(nestedSupportNode, supportNode)
  const nestedAttackNode = new Node('it is wrong because', false)
  web.add(nestedAttackNode, supportNode)

  web.solve([ 
    { node: supportNode, value: true },
    { node: nestedAttackNode, value: true }
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
