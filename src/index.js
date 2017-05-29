import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import { getData } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'

const shaders = {},
  preload = {
    getShaders: () => {
      Promise.all(['renderFrag', 'renderVert', 'particlesFrag', 'mainVert'].map(d =>
        fetch(`shaders/${d}.glsl`).then(data => data.text()).then(data => {
          shaders[d] = data
          return data
        })
      ))
    },
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
  setTimeout(() => {
    render(<App />, document.body)
    renderer.initialize({ shaders })
  }, 1000)
})

window.addEventListener("resize", debounce(() => {
  sharedState.set("windowWidth", window.innerWidth)
  sharedState.set("windowHeight", window.innerHeight)

  renderer.resize()
}, 250))
