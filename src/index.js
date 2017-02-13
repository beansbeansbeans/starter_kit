import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import renderer from './renderer'
import { getData } from './api'
import sharedState from './sharedState'
import { debounce } from 'underscore'
import { scaleLog } from 'd3-scale'
import './controls'

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
      Promise.all(['viz_nodes', 'viz_edges'].map(getData))
        .then(data => {
          nodes = data[0]
          edges = data[1]

          for(let j=0; j<nodes.length; j++) {
            let rank = nodes[j].pagerank
            if(rank > maxPageRank) maxPageRank = rank
            if(rank < minPageRank) minPageRank = rank
          }

          // must be multiples of 3 so webgl doesn't complain
          nodes.splice(roundDown(nodes.length, 3))
          edges.splice(roundDown(edges.length, 3))
        })
  }

let nodes, edges, minPageRank = Infinity, maxPageRank = 0

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
    minPageRank, maxPageRank,
    particleSprite: assets.particleSprite.data
  })
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)
}, 250))

document.addEventListener("keydown", e => {
  const key = e.keyCode
  if(key === 38) {
    renderer.pan('up')
  } else if(key === 40) {
    renderer.pan('down')
  } else if(key === 37) {
    renderer.pan('left')
  } else if(key === 39) {
    renderer.pan('right')
  }
})
