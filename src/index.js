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

let shaderFiles = []

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
    getData: () => Promise.all([].map(getData))
  }

class App extends Component {
  render({}) {
    return (
      <app>
        <canvas id="webgl-canvas"></canvas>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)
  renderer.initialize({ shaders })

  // create web
  const web = new Tree('climate change is a hoax')
  web.add(new Node('no it is not'), web._root)

  const supportNode = new Node('that is right')
  web.add(supportNode, web._root)

  const nestedSupportNode = new Node('it is right because')
  web.add(nestedSupportNode, supportNode)
  web.add(new Node('it is wrong because'), supportNode)

  console.log(web)

  // retrieve the nested 'it is wrong because' node
  const match = web.find('it is wrong because')
  console.log(match)

  DebugVisualizer.initialize(web)
  DebugVisualizer.draw()
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  renderer.resize()
}, 250))
