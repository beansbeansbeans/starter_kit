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
  if(n && n.extraData.argument === id) return true
  return false
}

const getUnusedChildren = (parentID, type) => {
  if(parentID === null) return

  let parentNode = directory[parentID].node
  let parentArgID = parentNode.extraData.argument
  let parentArgNode = store.find(parentArgID)
  let children = []

  for(let i=0; i<parentArgNode[type].length; i++) {
    let d = parentArgNode[type][i]
    if(!web.traverseDF(matchingArgument(d.id), web._root, true)) {
      children.push(d.node)
    }
  }

  return children
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
      resp = { parentNode, id: child.id, node: child }
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
    bindAll(this, ['addChild', 'concede', 'submitPosition', 'selectedArg'])
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
  }

  addChild(id) {
    let parentID = this.state.selectedArg || this.state.lastMove
    let parentNode = directory[parentID].node

    let child = store.find(id)

    let node = new Node(child.description, false, { 
      user: true,
      argument: child.id
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

  concede() {
    let id = this.state.selectedArg || this.state.lastMove
    renderer.extrudeNode(web, [directory[id].node])

    directory[id].conceded = true

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

  score() {
    const solveIterator = wrapIterator(web.resolveAsync(), function(result) {
      console.log("iterate solver", result)

      if(!result.done) {
        setTimeout(solveIterator, 1000)
      }
    })

    solveIterator()
  }

  componentDidUpdate(prevProps, prevState) {
    let getChild = 'getRandomAttacker'
    if(this.state.userPosition === false) {
      getChild = 'getRandomDefender'
    }

    if(this.state.computerTurn === true && prevState.computerTurn === false) {
      let newNode = new Node('', false)
      directory[newNode._id] = {
        node: newNode, inWeb: true
      }

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
          newNode.data = attacker.node.description
          web.add(newNode, attacker.parentNode)
        } else {
          let defender = getRandomChild(false, computerArgs)
          if(defender) {
            newNode.extraData.argument = defender.id
            newNode.data = defender.node.description
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
          newNode.data = defender.node.description
          web.add(newNode, defender.parentNode)
        } else {
          let attacker = getRandomChild(true, userArgs)
          if(attacker) {
            newNode.extraData.argument = attacker.id
            newNode.data = attacker.node.description
            web.add(newNode, attacker.parentNode)
          } else {
            console.log("CONCEDE")
            return                                        
          }
        }
      }

      renderer.update(web)
      renderer.activateNode(newNode._id)

      defer(() => {
        this.setState({ 
          lastMove: newNode._id,
          showUserDialogue: true, 
          userTurn: true, 
          computerTurn: false })
      })
    }
  }

  render({ }, { showUserDialogue, userTurn, lastMove, computerTurn, selectedArg, selectedArgLeft, selectedArgTop }) {
    let turnDOM = null, argumentControlsDOM = null

    if(selectedArg) {
      argumentControlsDOM = <ArgumentControls
        text={store.find(directory[selectedArg].node.extraData.argument).description}
        supportive={!!directory[selectedArg].byUser}
        left={selectedArgLeft}
        top={selectedArgTop}
        attackers={getUnusedChildren(selectedArg, 'attackers')}
        defenders={getUnusedChildren(selectedArg, 'defenders')}
        addChild={this.addChild}
        concede={directory[selectedArg].conceded ? false : this.concede} />
    } else if(lastMove) {
      if(computerTurn || !showUserDialogue) {
        if(lastMove !== sharedState.get("web")._root._id) {
          turnDOM = <div style="position:fixed;top:2rem;left:2rem;">{`user says: ${store.find(directory[lastMove].node.extraData.argument).description}`}</div>
        }
      } else {
        if(showUserDialogue) {
          let argText = ''
          if(lastMove) {
            argText = store.find(directory[lastMove].node.extraData.argument).description
          }

          turnDOM = <UserTurnInput
            data={argText}
            lastMove={lastMove}
            attackers={getUnusedChildren(lastMove, 'attackers')}
            addChild={this.addChild}
            concede={directory[lastMove].conceded ? false : this.concede}
            submitPosition={this.submitPosition}
            exit={() => this.setState({ showUserDialogue: false })} />
        }
      }
    }

    return (
      <app>
        <div id="webgl-wrapper"></div>
        {turnDOM}
        {argumentControlsDOM}
        <TurnMarker userTurn={userTurn} computerTurn={computerTurn} />
        <button style="position:fixed;right:2rem;top:10rem;" onClick={this.score}>score game</button>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  let node = argument[0].tree

  store = createStore(argument[0], 25)

  web = new AsyncTree(node.data, { argument: store.root.id }, node._id)
  
  window.web = web
  window.store = store
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
})