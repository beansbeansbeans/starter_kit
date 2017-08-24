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
import TurnMarker from './components/turnMarker'
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
    computerTurn: false,
    showUserDialogue: true,
    lastMove: null,
    userPosition: null
  }

  componentWillMount() {
    bindAll(this, ['addAttack', 'concede', 'addDefense', 'submitPosition'])
  }

  componentDidMount() {
    this.setState({ lastMove: web._root._id })
  }

  addAttack() {
    let node = new Node("blerg", false, { user: true })
    web.add(node, directory[this.state.lastMove].node)
    directory[node._id] = { node, inWeb: true, byUser: true }

    renderer.update(web)

    this.setState({ 
      lastMove: node._id,
      showUserDialogue: false })

    renderer.deactivateNode()

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 1000)
  }

  addDefense() {
    let node = new Node('blerg', true, { user: true })
    web.add(node, directory[this.state.lastMove].node.parent)
    directory[node._id] = { node, inWeb: true, byUser: true }

    renderer.update(web)

    this.setState({ 
      lastMove: node._id,
      showUserDialogue: false })

    renderer.deactivateNode()

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 1000)
  }

  concede() {
    renderer.extrudeNode(web, [directory[this.state.lastMove].node])

    this.setState({
      showUserDialogue: false
    })

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 1000)
  }

  submitPosition(userPosition) {
    this.setState({ 
      userPosition, 
      showUserDialogue: false })

    renderer.deactivateNode()

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 1000)
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.computerTurn === true && prevState.computerTurn === false) {
      let newNode = new Node('blerg', false)
      directory[newNode._id] = {
        node: newNode, inWeb: true
      }

      if(this.state.lastMove === web._root._id) {
        web.add(newNode, web._root)
      } else {
        let randomUserArgID

        let userArgs = []
        for(let i=0; i<Object.keys(directory).length; i++) {
          let arg = directory[Object.keys(directory)[i]]
          if(arg.byUser) userArgs.push(Object.keys(directory)[i])
        }

        if(this.state.userPosition === true) {
          userArgs.push(web._root._id)
        }

        web.add(newNode, directory[userArgs[Math.floor(random.nextDouble() * userArgs.length)]].node)
      }

      renderer.update(web)
      this.setState({ lastMove: newNode._id })
      renderer.activateNode(newNode._id)

      setTimeout(() => {
        this.setState({ showUserDialogue: true, userTurn: true, computerTurn: false })
      }, 1000)
    }
  }

  render({ }, { showUserDialogue, userTurn, lastMove, computerTurn }) {
    let userTurnDOM = null

    if(showUserDialogue) {
      userTurnDOM = <UserTurnInput
        lastMove={lastMove}
        addAttack={this.addAttack}
        concede={this.concede}
        submitPosition={this.submitPosition}
        exit={() => this.setState({ showUserDialogue: false })} />
    }

    return (
      <app>
        <div id="webgl-wrapper"></div>
        {userTurnDOM}
        <TurnMarker userTurn={userTurn} computerTurn={computerTurn} />
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {

  processArgument(argument, 45)

  let node = argument[0]

  web = new AsyncTree(node.data, {
    moralMatrices: node.moralMatrices
  }, node._id)
  
  window.web = web
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
  
  handleResize()

  renderer.initialize({ container: document.querySelector("#webgl-wrapper"), shaders })
  renderer.update(web)
})