import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import "../main.scss"
import { values } from 'underscore'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import './renderer'

const ITERATIONS_COUNT = 50

let g = graph()

g.addNode('hello')
g.addNode('world')

g.addLink('hello', 'world')

let layout = forceLayout3d(g)

for(let i=0; i<ITERATIONS_COUNT; i++) {
  layout.step()
}

g.forEachNode(node => {
  console.log(layout.getNodePosition(node.id))
})

g.forEachLink(link => {
  console.log(layout.getLinkPosition(link.id))
})

class Clock extends Component {
  render({}) {
    return (
      <div></div>
    )
  }
}

// render an instance of Clock into <body>:
render(<Clock />, document.body);