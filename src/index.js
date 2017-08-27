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
import ArgumentControls from './components/argumentControls'
import { handleResize } from './listeners'
import randomModule from './helpers/random'
const random = randomModule.random(42)
import createStore from './argumentSchemes/store'

let shaderFiles = ['drawRect.fs', 'drawRect.vs'], argument, directory = {}, web, store, mouseX, mouseY

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

const matchingArgument = id => n => {
  if(n && n.extraData.argument === id) {
    return true
  }
  return false
}

const getRandomChild = (attack, optionIDs) => {
  let found = false,
    parentNode, id, resp = false,
    getChild = "getRandomAttacker"

  if(!attack) getChild = "getRandomDefender"

  while(!found && optionIDs.length) {
    let randomOption = optionIDs.splice(Math.floor(random.nextDouble() * optionIDs.length), 1)

    parentNode = directory[randomOption].node
    let child = store[getChild](parentNode.extraData.argument)

    if(child && !web.traverseDF(matchingArgument(child.id), web._root, true)) {
      found = true
      resp = { parentNode, id: child.id }
    }
  }

  return resp
}

class App extends Component {
  state = {
    userTurn: true,
    computerTurn: false,
    showUserDialogue: true,
    lastMove: null,
    userPosition: null,
    selectedArg: null,
    selectedArgLeft: 0,
    selectedArgTop: 0
  }

  componentWillMount() {
    bindAll(this, ['addAttack', 'concede', 'addDefense', 'submitPosition', 'selectedArg'])
  }

  componentDidMount() {
    this.setState({ lastMove: web._root._id })

    handleResize()
    renderer.initialize({ 
      selectedArgCB: this.selectedArg,
      container: document.querySelector("#webgl-wrapper"), 
      shaders })
    renderer.update(web)
  }

  selectedArg({ id }) {
    this.setState({ 
      selectedArg: id,
      selectedArgLeft: sharedState.get("mouseX"),
      selectedArgTop: sharedState.get("mouseY")
    })

    console.log(store.find(directory[id].node.extraData.argument).description)
  }

  addAttack() {
    let parentID = this.state.selectedArg || this.state.lastMove
    let parentNode = directory[parentID].node
    let parentArgID = parentNode.extraData.argument
    let parentArgNode = store.find(parentArgID)
    let attacker
    let shuffledIndices = []

    for(let i=0; i<parentArgNode.attackers.length; i++) shuffledIndices.push(i)
    shuffledIndices = shuffle(shuffledIndices)

    for(let i=0; i<parentArgNode.attackers.length; i++) {
      let d = parentArgNode.attackers[shuffledIndices[i]]
      if(!web.traverseDF(matchingArgument(d.id), web._root, true)) {
        attacker = d.node
        break
      }
    }

    if(typeof attacker === 'undefined') {
      console.log("NO MATCHES")
      return
    }

    let node = new Node("blerg", false, { 
      user: true,
      argument: attacker.id
    })

    web.add(node, parentNode)
    directory[node._id] = { node, inWeb: true, byUser: true }

    renderer.update(web)

    this.setState({ 
      lastMove: node._id,
      showUserDialogue: false })

    renderer.deactivateNode()

    setTimeout(() => {
      this.setState({ selectedArg: null, userTurn: false, computerTurn: true })
    }, 1000)
  }

  addDefense() {
    let parentID = this.state.selectedArg || this.state.lastMove
    let parentNode = directory[parentID].node
    let parentArgID = parentNode.extraData.argument
    let parentArgNode = store.find(parentArgID)
    let defender
    let shuffledIndices = []

    for(let i=0; i<parentArgNode.defenders.length; i++) shuffledIndices.push(i)
    shuffledIndices = shuffle(shuffledIndices)

    for(let i=0; i<parentArgNode.defenders.length; i++) {
      let d = parentArgNode.defenders[shuffledIndices[i]]
      if(!web.traverseDF(matchingArgument(d.id), web._root, true)) {
        defender = d
        break
      }
    }

    if(typeof defender === 'undefined') {
      console.log("NO MATCHES")
      return
    }

    let node = new Node('blerg', true, { 
      user: true,
      argument: defender.id
    })

    web.add(node, parentNode.parent)
    directory[node._id] = { node, inWeb: true, byUser: true }

    renderer.update(web)

    this.setState({ 
      lastMove: node._id,
      showUserDialogue: false })

    renderer.deactivateNode()

    setTimeout(() => {
      this.setState({ selectedArg: null, userTurn: false, computerTurn: true })
    }, 1000)
  }

  concede() {
    let id = this.state.selectedArg || this.state.lastMove
    renderer.extrudeNode(web, [directory[id].node])

    this.setState({ showUserDialogue: false })

    setTimeout(() => {
      this.setState({ selectedArg: null, userTurn: false, computerTurn: true })
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
        newNode.extraData.argument = store.getRandomAttacker(store.root.id).id

        web.add(newNode, web._root)
      } else {
        let userArgs = [], computerArgs = [], parentNode

        for(let i=0; i<Object.keys(directory).length; i++) {
          let key = Object.keys(directory)[i], arg = directory[key]

          if(key === newNode._id) continue

          if(arg.byUser) {
            userArgs.push(key)
          } else {
            computerArgs.push(key)
          }
        }

        if(this.state.userPosition === true) {
          userArgs.push(web._root._id)
        } else {
          computerArgs.push(web._root._id)
        }
      
        if(random.nextDouble() < 0.75 && userArgs.length) {
          let attacker = getRandomChild(true, userArgs)
          if(attacker) {
            newNode.extraData.argument = attacker.id
            web.add(newNode, attacker.parentNode)
          } else {
            let defender = getRandomChild(false, computerArgs)
            if(defender) {
              newNode.extraData.argument = defender.id
              web.add(newNode, defender.parentNode)
            } else {
              console.log("CONCEDE")
              return                                        
            }
          }
        } else {
          let defender = getRandomChild(false, computerArgs)
          if(defender) {
            newNode.extraData.argument = defender.id
            newNode.supports = true
            web.add(newNode, defender.parentNode)
          } else {
            let attacker = getRandomChild(true, userArgs)
            if(attacker) {
              newNode.extraData.argument = attacker.id
              web.add(newNode, attacker.parentNode)
            } else {
              console.log("CONCEDE")
              return                                        
            }
          }
        }
      }

      renderer.update(web)
      this.setState({ lastMove: newNode._id })
      renderer.activateNode(newNode._id)

      setTimeout(() => {
        this.setState({ showUserDialogue: true, userTurn: true, computerTurn: false })
      }, 1000)
    }
  }

  render({ }, { showUserDialogue, userTurn, lastMove, computerTurn, selectedArg, selectedArgLeft, selectedArgTop }) {
    let userTurnDOM = null, argumentControlsDOM = null

    if(showUserDialogue) {
      let argText = ''
      if(lastMove) {
        argText = store.find(directory[lastMove].node.extraData.argument).description
      }

      userTurnDOM = <UserTurnInput
        data={argText}
        lastMove={lastMove}
        addAttack={this.addAttack}
        concede={this.concede}
        submitPosition={this.submitPosition}
        exit={() => this.setState({ showUserDialogue: false })} />
    } else if(selectedArg) {
      argumentControlsDOM = <ArgumentControls
        supportive={!!directory[selectedArg].byUser}
        left={selectedArgLeft}
        top={selectedArgTop}
        addDefense={this.addDefense}
        addAttack={this.addAttack}
        concede={this.concede} />
    }

    return (
      <app>
        <div id="webgl-wrapper"></div>
        {userTurnDOM}
        {argumentControlsDOM}
        <TurnMarker userTurn={userTurn} computerTurn={computerTurn} />
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  let node = argument[0]

  store = createStore(argument[0], 30)

  web = new AsyncTree(node.data, { argument: store.root.id }, node._id)
  
  window.web = web
  window.store = store
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
})