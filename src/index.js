import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'
import { handleResize } from './listeners'
import model from './model/index'
import randomModule from './helpers/random'
const random = randomModule.random(42)
import PairWise from './components/pairwise'
import Aggregation from './components/aggregation'
import Permutations from './components/permutations'

let shaderFiles = [], mouseX, mouseY, embeddings

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) shaders[shaderFiles[i]] = data[i]
        return data
      })
    ,
    getData: () => 
      Promise.all(['encodings_pca_100', 'encodings_pca_50', 'encodings_pca_10'].map(getData))
        .then(data => {
          console.log(data)
          let indices = []
          for(let i=0; i<data[0].length; i++) indices.push(i)
          indices = shuffle(indices)

          embeddings = {
            100: permute(data[0], indices),
            50: permute(data[1], indices),
            10: permute(data[2], indices)
          }
        })
  }

class App extends Component {
  render({ data }) {
    let main = <Permutations data={data} />
    // let main = <Aggregation data={data} />
    // let main = <PairWise data={data} />

    return <app>{main}</app>
  }
}


Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  console.log(embeddings)
  render(<App data={embeddings} />, document.body)
})