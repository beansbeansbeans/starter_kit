import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import renderer from './renderer'
import { getData } from './api'
import sharedState from './sharedState'
import { debounce } from 'underscore'
import { scaleLinear } from 'd3-scale'

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

          let minPageRank = Infinity, maxPageRank = 0

          for(let j=0; j<nodes.length; j++) {
            let rank = nodes[j].pagerank
            if(rank > maxPageRank) {
              maxPageRank = rank
            }
            if(rank < minPageRank) {
              minPageRank = rank
            }
          }

          const pageRankScale = scaleLinear().domain([minPageRank, maxPageRank]).range([5, 20])

          for(let j=0; j<nodes.length; j++) {
            let rank = nodes[j].pagerank
            nodes[j].pagerank = pageRankScale(rank)
          }

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

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)
}, 250))
