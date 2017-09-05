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
import Result from './components/result'
import Support from './components/support'
import UserProfile from './components/userProfile'
import { handleResize } from './listeners'
import randomModule from './helpers/random'
const random = randomModule.random(42)
import createStore from './argumentSchemes/store'

let shaderFiles = ['drawRect.fs', 'drawRect.vs', 'drawShadow.fs', 'drawShadow.vs'], argument, directory = {}, web, removedKeys = [], store, mouseX, mouseY, resolver, undoer

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
    if(!web.traverseDF(matchingArgument(d.node.id), parentNode, true)) {
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
    selectedArgTop: 0,
    showResult: false,
    showUserProfile: false
  }

  componentWillMount() {
    bindAll(this, ['addChild', 'concede', 'submitPosition', 'selectedArg', 'score', 'resolveByUser'])
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
    if(id !== this.state.selectedArg) {
      this.setState({ 
        selectedArg: id,
        selectedArgLeft: sharedState.get("mouseX"),
        selectedArgTop: sharedState.get("mouseY")
      })      
    }
  }

  addChild(id, supports) {
    let parentID = this.state.selectedArg || this.state.lastMove
    let parentNode = directory[parentID].node

    let child = store.find(id)

    let node = new Node(child.description, supports, { 
      user: true,
      argument: child.id
    })

    web.add(node, parentNode)
    directory[node._id] = { node, inWeb: true, byUser: true }

    renderer.update(web)

    defer(() => {
      renderer.activateNode(node._id)
      renderer.illuminateHistory(node._id, this.state.userPosition)
    })

    this.setState({ lastMove: node._id, showUserDialogue: false })

    defer(() => this.setState({ selectedArg: null }))

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 1500)
  }

  concede() {
    let id = this.state.selectedArg || this.state.lastMove

    directory[id].conceded = true

    this.setState({ showUserDialogue: false })

    setTimeout(() => {
      this.setState({ selectedArg: null, userTurn: false, computerTurn: true })
    }, 500)
  }

  submitPosition(userPosition) {
    this.setState({ 
      userPosition, 
      showUserDialogue: false })

    setTimeout(() => {
      this.setState({ userTurn: false, computerTurn: true })
    }, 500)
  }

  score() {
    let lastResult, self = this

    renderer.solve()

    const solveIterator = wrapIterator(web.resolveAsync(), function(result) {
      if(typeof result.value !== 'undefined') {
        lastResult = result.value
      }

      if(!result.done) {
        if(typeof result.value._id !== 'undefined') {
          renderer.extrudeNode(web, [{
            node: result.value,
            value: true
          }])          
        }

        setTimeout(solveIterator, 500)
      } else {
        self.setState({
          rootWarranted: lastResult,
          showResult: true
        })
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
        } else if(key !== web._root._id) {
          computerArgs.push(key)
        }
      }

      if(this.state.userPosition === true) {
        userArgs.push(web._root._id)
      } else {
        computerArgs.push(web._root._id)
      }
    
      if(random.nextDouble() < 0.85 && userArgs.length) {
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
      renderer.illuminateHistory(newNode._id, !this.state.userPosition)

      setTimeout(() => {
        this.setState({ 
          lastMove: newNode._id,
          showUserDialogue: true, 
          userTurn: true, 
          computerTurn: false })
      }, 1000)
    }
  }

  resolveByUser(data) {
    this.setState({
      showUserProfile: true
    })

    resolver = resolve()
    resolveIterate()
  }

  render({ }, { showUserDialogue, userTurn, lastMove, computerTurn, selectedArg, selectedArgLeft, selectedArgTop, showResult, rootWarranted, userPosition, showUserProfile }) {
    let turnDOM = null, argumentControlsDOM = null, resultDOM, userProfileDOM = null

    if(selectedArg) {
      let arg = store.find(directory[selectedArg].node.extraData.argument)
      argumentControlsDOM = <ArgumentControls
        text={arg.description}
        supporters={arg.supporters}
        resolveSupporter={this.resolveByUser}
        supportive={!!directory[selectedArg].byUser || (userPosition === true && web._root._id === selectedArg)}
        left={selectedArgLeft}
        top={selectedArgTop}
        attackers={getUnusedChildren(selectedArg, 'attackers')}
        defenders={getUnusedChildren(selectedArg, 'defenders')}
        addChild={this.addChild}
        concede={directory[selectedArg].conceded ? false : this.concede} />
    } else if(lastMove) {
      if(computerTurn || !showUserDialogue) {
        if(lastMove !== sharedState.get("web")._root._id) {
          let arg = store.find(directory[lastMove].node.extraData.argument)
          turnDOM = <div id="user-turn-input">
            <div class="arg-text"><span>The user says:</span>{`${arg.description}`}</div>
            <Support 
              supporters={arg.supporters}
              clickUser={this.resolveByUser} />
          </div>
        }
      } else {
        if(showUserDialogue) {
          let argText = '', supporters = []
          if(lastMove) {
            let arg = store.find(directory[lastMove].node.extraData.argument)
            argText = arg.description
            supporters = arg.supporters
          }

          turnDOM = <UserTurnInput
            supporters={supporters}
            resolveSupporter={this.resolveByUser}
            data={argText}
            lastMove={lastMove}
            attackers={getUnusedChildren(lastMove, 'attackers')}
            addChild={this.addChild}
            concede={directory[lastMove].conceded ? false : this.concede}
            submitPosition={this.submitPosition} />
        }
      }
    }

    if(showResult) {
      resultDOM = <Result 
        userWon={(rootWarranted && userPosition === true) || (!rootWarranted && userPosition === false)}
        rootWarranted={rootWarranted} 
        rootText={web._root.data} />
    }

    if(showUserProfile) {
      turnDOM = null
      argumentControlsDOM = null
      userProfileDOM = <UserProfile
        back={e => {
          this.setState({
            showUserProfile: false
          })

          undoer = undo()
          undoIterate()
        }} />
    }

    return (
      <app>
        <div id="webgl-wrapper"></div>
        {turnDOM}
        {argumentControlsDOM}
        {userProfileDOM}
        <div id="game-controls">
          <TurnMarker 
            showResult={showResult}
            userWon={(rootWarranted && userPosition === true) || (!rootWarranted && userPosition === false)}
            userTurn={userTurn} 
            computerTurn={computerTurn} />
          <button id="score-game-button" style="position:fixed;right:2rem;top:10rem;" onClick={this.score}>Score game</button>
        </div>
        {resultDOM}
      </app>
    )
  }
}

function* resolve() {
  let keys = Object.keys(directory)

  for(let i=0; i<keys.length; i++) {
    let key = keys[i],
      obj = directory[key], node = obj.node
    
    if(!obj.inWeb || keys[i] === web._root._id) continue

    if(random.nextDouble() < 0.35) {
      obj.inWeb = false

      removedKeys.push(node._id)
      web.removeSingle(node)

      yield node
    }
  }

  return
}

function resolveIterate() {
  let result = resolver.next()

  renderer.update(web)

  if(!result.done) {
    mediator.subscribe("reconcileTree", resolveIterate, true)
  }
}

function* undo() {
  let keys = Object.keys(directory)

  removedKeys = removeDuplicates(removedKeys)

  for(let i=0; i<removedKeys.length; i++) {
    let node = directory[removedKeys[i]].node

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

  return
}

function undoIterate() {
  let result = undoer.next()

  renderer.update(web)

  if(!result.done) {
    mediator.subscribe("reconcileTree", undoIterate, true)
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  let node = argument[0].tree

  store = createStore(argument[0], 0)

  web = new AsyncTree(node.data, { argument: store.root.id }, node._id)
  
  window.web = web
  window.store = store
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
})