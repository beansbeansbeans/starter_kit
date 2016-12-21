import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import "../main.scss"
import { values } from 'underscore'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import renderer from './renderer'
import { getData } from './api'

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

class App extends Component {
  render({}) {
    return (
      <app>
        <canvas id="webgl-canvas"></canvas>
      </app>
    )
  }
}

Promise.all(['nodes', 'edges'].map(getData))
  .then(data => {
    render(<App />, document.body);

    renderer.initialize({
      element: document.querySelector("webgl-canvas"),
      nodes: data[0],
      edges: data[1]
    })
  })