import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce } from 'underscore'
import sharedState from './sharedState'
import renderer from './GPURenderer'

let shaderFiles = []

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) {
          shaders[shaderFiles[i]] = data[i]
        }
        return data
      })
    ,
    getData: () =>
      Promise.all([].map(getData))
  }

class App extends Component {
  render({}) {
    return (
      <app>
        <h1>hi</h1>
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
