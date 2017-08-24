import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'
import Node from './CSP/treeNode'
import AsyncTree from './CSP/asyncTree'
import mediator from './mediator'
import processArgument from './processArgument'
import UserTurnInput from './userTurnInput'
import { handleResize } from './listeners'
import randomModule from './helpers/random'
const random = randomModule.random(42)

let shaderFiles = ['drawRect.fs', 'drawRect.vs'], argument, directory = {}, web, mouseX, mouseY

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
    userTurn: true,
    lastMove: null,
    userPosition: null
  }

  componentWillMount() {
    bindAll(this, ['addAttack', 'addDefense', 'submitPosition'])
  }

  componentDidMount() {

  }

  addAttack() {
    this.setState({ userTurn: false })
  }

  addDefense() {
    let node = new Node('blerg', true)
    web.add(node, web._root)

    directory[node._id] = {
      node, inWeb: true
    }

    renderer.update(web)
    this.setState({ userTurn: false })
  }

  submitPosition(userPosition) {
    this.setState({ userPosition, userTurn: false })
  }

  render({ }, { userTurn, lastMove }) {
    let userTurnDOM = null

    if(userTurn) {
      userTurnDOM = <UserTurnInput
        addAttack={this.addAttack}
        addDefense={this.addDefense}
        submitPosition={this.submitPosition}
       />
    }
    return (
      <app>
        <div id="webgl-wrapper"></div>
        {userTurnDOM}
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)

  processArgument(argument, 45)

  handleResize()

  let node = argument[0]

  web = new AsyncTree(node.data, {
    moralMatrices: node.moralMatrices
  }, node._id)
  
  window.web = web
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  renderer.initialize({ container: document.querySelector("#webgl-wrapper"), shaders })

  renderer.update(web)
})