import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import { getData } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './renderer'

const textureLoader = new THREE.TextureLoader(),
  assets = {},
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
      Promise.all([].map(getData))
  }

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
  render(<App />, document.body)
  renderer.initialize()
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)
}, 250))
