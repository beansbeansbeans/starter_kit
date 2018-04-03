import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'
import { handleResize } from './listeners'
import model from './model/index'
import randomModule from './helpers/random'
const random = randomModule.random(42)

let shaderFiles = [], web, mouseX, mouseY, directory = {}, embeddings

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) shaders[shaderFiles[i]] = data[i]
        return data
      })
    ,
    getData: () => 
      Promise.all(['encodings_pca'].map(getData))
        .then(data => embeddings = data[0])
  }

class App extends Component {
  state = { }

  componentWillMount() {
    bindAll(this, [])
  }

  componentDidUpdate(prevProps, prevState) {

  }

  render({ }, { }) {
    return (
      <app>
        <div id="webgl-wrapper"></div>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  console.log(embeddings)
  render(<App />, document.body)
})