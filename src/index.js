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
      Promise.all(['immigration'].map(getData))
        .then(data => argument = data)
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
  }

  addAttack() {
    let parentID = this.state.selectedArg || this.state.lastMove
    let parentNode = directory[parentID].node
    let parentArgID = parentNode.extraData.argument
    let attacker = store.getRandomAttacker(parentArgID)

    if(!attacker) {
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
    let defender = store.getRandomDefender(parentArgID)

    if(!defender) {
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

        function attack() {
          let found = false

          while(!found && userArgs.length) {
            let randomUserArg = userArgs.splice(Math.floor(random.nextDouble() * userArgs.length), 1)
            parentNode = directory[randomUserArg].node

            let attacker = store.getRandomAttacker(parentNode.extraData.argument)
            if(attacker && !web.traverseDF(function(n) {
              if(n && n.extraData.argument === attacker.id) {
                return true
              }
              return false
            }, web._root, true)) {
              found = true
              newNode.extraData.argument = attacker.id
              web.add(newNode, parentNode)
            }  
          }

          return found
        }

        function defend() {
          let found = false

          while(!found && computerArgs.length) {
            let randomComputerArg = computerArgs.splice(Math.floor(random.nextDouble() * computerArgs.length), 1)
            parentNode = directory[randomComputerArg].node
            let defender = store.getRandomDefender(parentNode.extraData.argument)

            if(defender && !web.traverseDF(function(n) {
              if(n && n.extraData.argument === defender.id) {
                return true
              }
              return false
            }, web._root, true)) {
              found = true
              newNode.extraData.argument = defender.id
              web.add(newNode, parentNode)
            }
          }

          return found
        }
      
        if(random.nextDouble() < 0.75 && userArgs.length) {
          if(!attack()) {
            console.log("CONCEDE")
            return            
          }
        } else {
          if(!defend()) {
            if(!attack()) {
              console.log("CONCEDE")
              return
            }
          } else {
            newNode.supports = true
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
      userTurnDOM = <UserTurnInput
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
  processArgument(argument, 10)
  
  let node = argument[0]

  store = createStore(10)
  web = new AsyncTree(node.data, { argument: store.root.id }, node._id)
  
  window.web = web
  sharedState.set("web", web)

  directory[web._root._id] = { 
    node: web._root, inWeb: true }

  render(<App />, document.body)
})