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