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
import { handleResize } from './listeners'
import randomModule from './helpers/random'
const random = randomModule.random(42)

let shaderFiles = ['drawRect.fs', 'drawRect.vs'], argument, directory = {}, web, removedKeys = [], resolver, mouseX, mouseY

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
  state = { }

  componentWillMount() {
    bindAll(this, [])
  }

  componentDidMount() {

  }

  render({ }, { }) {
    return (
      <app>
        <div id="webgl-wrapper"></div>
      </app>
    )
  }
}

function* removeLosers() {
  yield * web.traverseDFAsync(n => {
    if(n.depth > 0) {
      if(n.value === false || n.provisionalValue === false) {
        directory[n._id].inWeb = false
        web.removeSingle(n)
      }      
    }
    return false
  })
}

function* resolve(label) {
  if(label) {
    let keys = Object.keys(directory)

    for(let i=0; i<keys.length; i++) {
      let obj = directory[keys[i]], node = obj.node
      
      if(!obj.inWeb) continue // don't remove nodes that are descendents of nodes that have been removed

      if(node.extraData.moralMatrices.indexOf(label) < 0) {
        obj.inWeb = false

        removedKeys.push(node._id)
        web.removeSingle(node)

        yield node
      }
    }

    removedKeys = removeDuplicates(removedKeys)
  }

  for(let i=0; i<removedKeys.length; i++) {
    let node = directory[removedKeys[i]].node

    if((label && node.extraData.moralMatrices.indexOf(label) > -1) || typeof label === 'undefined') {
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

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body)

  processArgument(argument, 45)

  handleResize()

  let toSearch = [{ node: argument[0] }]

  function getRandomUntraversedChild(node) {
    let indices = [], randomChild

    if(typeof node === 'undefined') {
      function traverseDF(d) {
        return d.children.reduce((acc, curr) => {
          if(!!acc && typeof directory[acc._id] === 'undefined') {
            return acc
          }

          return traverseDF(curr)
        }, d)
      }

      let match = traverseDF(argument[0])
      if(typeof directory[match._id] === 'undefined') randomChild = match
    } else {
      for(let i=0; i<node.children.length; i++) indices.push(i)
      indices = shuffle(indices)

      for(let i=0; i<node.children.length; i++) { // TODO: make this random
        let child = node.children[i]
        if(typeof directory[child._id] === 'undefined') {
          randomChild = child
          break
        }
      }      
    }

    return randomChild
  }

  function* walk(obj) {
    let node = obj.node, parent = obj.parent, treeNode

    if(typeof directory[node._id] === 'undefined') {
      if(typeof parent === 'undefined') {
        web = new AsyncTree(node.data, {
          moralMatrices: node.moralMatrices
        }, node._id)
        
        window.web = web
        sharedState.set("web", web)

        treeNode = web._root
      } else {
        treeNode = new Node(node.data, node.supports, {
          moralMatrices: node.moralMatrices
        }, node._id)

        web.add(treeNode, parent)
      }

      directory[treeNode._id] = { 
        node: treeNode, inWeb: true }

      if(Object.keys(directory).length === 20) mediator.publish("flip")

      yield treeNode
    } else {
      treeNode = directory[node._id].node
    }

    let randomChild = getRandomUntraversedChild(node),
      current = node.parent,
      parentNode = treeNode

    while(current && typeof randomChild === 'undefined') {
      randomChild = getRandomUntraversedChild(current)
      parentNode = directory[current._id].node
      current = current.parent
    }

    if(!randomChild) {
      randomChild = getRandomUntraversedChild()
      if(randomChild) {
        parentNode = directory[randomChild.parent._id].node
      }
    }

    if(randomChild) {
      yield * walk({ parent: parentNode, node: randomChild })
    }
  }

  renderer.initialize({ container: document.querySelector("#webgl-wrapper"), shaders })

  const iterators = []

  for(let i=0; i<3; i++) {
    iterators.push(wrapIterator(walk({ node: argument[0] }), function(result) {
      if(!result.done) {
        mediator.subscribe("reconcileTree", iterators[i], true)
      }

      if(i === 0) {
        renderer.update(web)
      }
    }))
  }

  iterators.forEach(d => d())
})