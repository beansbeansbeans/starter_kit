import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import renderer from './renderer'
import { getData } from './api'

const textureLoader = new THREE.TextureLoader(),
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

          // must be multiples of 3 so webgl doesn't complain
          nodes.splice(roundDown(nodes.length, 3))
          edges.splice(roundDown(edges.length, 3))
        })
  }

let nodes, edges

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

  renderer.initialize({
    element: document.querySelector("#webgl-canvas"),
    nodes, edges,
    particleSprite: assets.particleSprite.data
  })
})

