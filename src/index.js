import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'
import Node from './CSP/treeNode'
import AsyncTree from './CSP/asyncTree'
import mediator from './mediator'
import processArgument from './processArgument'
import { handleResize } from './listeners'
import randomModule from './helpers/random'
const random = randomModule.random(42)
import createStore from './argumentSchemes/store'

let shaderFiles = ['drawRect.fs', 'drawRect.vs', 'drawShadow.fs', 'drawShadow.vs'], web, mouseX, mouseY, directory = {}

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) shaders[shaderFiles[i]] = data[i]
        return data
      })
    ,
    getData: () => 
      Promise.all(['damore'].map(getData))
        .then(data => argument = data)
  }

class App extends Component {
  state = { }

  componentWillMount() {
    bindAll(this, [])
  }

  componentDidUpdate(prevProps, prevState) {

  }

  render({ }, { }) {
    return (
      <app>
        <div id="webgl-wrapper"></div>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  let node = argument[0].tree

  web = new AsyncTree(node.data, {}, node._id)
  
  window.web = web
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
})