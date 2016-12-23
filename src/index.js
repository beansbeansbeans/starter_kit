import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import "../main.scss"
import { values } from 'underscore'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import renderer from './renderer'
import { getData } from './api'

const ITERATIONS_COUNT = 50
const g = graph()

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

    const nodes = data[0], edges = data[1]

    for(let i=0, n=nodes.length; i<n; i++) {
      g.addNode(i, nodes[i])
    }

    for(let i=0, l=edges.length; i<l; i++) {
      g.addLink(edges[i].source, edges[i].target)
    }

    let layout = forceLayout3d(g)

    for(let i=0; i<ITERATIONS_COUNT; i++) {
      layout.step()
    }

    renderer.initialize({
      element: document.querySelector("#webgl-canvas"),
      nodes, edges
    })
  })