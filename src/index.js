import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import "../main.scss"
import { values } from 'underscore'
import forceLayout3d from 'ngraph.forcelayout3d'
import graph from 'ngraph.graph'
import renderer from './renderer'
import { getData } from './api'

const g = graph(),
  textureLoader = new THREE.TextureLoader(),
  assets = {
    particleSprite: { filename: "particle.png" }
  },
  preload = {
    getTextures: () =>
      Promise.all(Object.keys(assets).map(k =>
        new Promise((resolve, reject) => {
          textureLoader.load(`images/${assets[k].filename}`, data => {
            assets[k].data = data
            resolve(data)
          })
          }, () => {},
          xhr => reject(new Error(`could not load ${k}`)))        
      )),
    getData: () =>
      Promise.all(['nodes', 'edges'].map(getData))
        .then(data => {
          nodes = data[0]
          edges = data[1]
        })
  }

let nodes, edges, layout

class App extends Component {
  render({}) {
    return (
      <app>
        <canvas id="webgl-canvas"></canvas>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App />, document.body);

  for(let i=0, n=nodes.length; i<n; i++) {
    g.addNode(i, nodes[i])
  }

  for(let i=0, l=edges.length; i<l; i++) {
    g.addLink(edges[i].source, edges[i].target)
  }

  let layout = forceLayout3d(g)

  renderer.initialize({
    element: document.querySelector("#webgl-canvas"),
    nodes, edges,
    particleSprite: assets.particleSprite.data
  })
})

