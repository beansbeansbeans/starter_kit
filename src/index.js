import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength } = helpers
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
        .then(data => embeddings = shuffle(data[0]))
  }

class App extends Component {
  state = { 
    startIndex: 0,
    endIndex: 0,
    intermediaries: []
  }

  componentWillMount() {
    bindAll(this, ['updateIntermediaries'])
  }

  componentDidMount() {
    this.setState({
      startIndex: this.props.data.findIndex(d => d.sentence.indexOf('simplistic , silly and tedious') > -1),
      endIndex: this.props.data.findIndex(d => d.sentence.indexOf('a fascinating and fun film') > -1)
    })
  }

  updateIntermediaries() {
    let { data } = this.props
    let { startIndex, endIndex } = this.state

    let A = data[startIndex].encoding
    let B = data[endIndex].encoding

    let buckets = []
    for(let i=0; i<1; i+=0.05) buckets.push([])

    let min = Infinity, max = 0

    for(let i=0; i<data.length; i++) {
      if(i === startIndex || i === endIndex) continue
      let P = data[i].encoding

      let pa = subVectors(P, A)
      let ba = subVectors(B, A)

      let t = dotProduct(pa, ba) / dotProduct(ba, ba)
      let tba = []
      for(let j=0; j<ba.length; j++) {
        tba.push(t * ba[j])
      }

      let paMinusTba = []
      for(let j=0; j<pa.length; j++) {
        paMinusTba.push(pa[j] - tba[j])
      }

      let d = vectorLength(paMinusTba)

      if(d > max) max = d
      if(d < min) min = d

      for(let j=0; j<buckets.length; j++) {
        let val = j * 0.05
        if(d < val) {
          buckets[j].push(data[i])
          break
        }
      }
    }

    console.log(min, max)
    console.log(buckets)

    let top10 = []
    for(let i=0; i<buckets.length; i++) {
      if(top10.length >= 10) break

      let iterator = 0
      while(top10.length < 10 && iterator < buckets[i].length) {
        top10.push(buckets[i][iterator])
        iterator++
      }
    }

    console.log(top10)
  }

  componentDidUpdate(prevProps, prevState) {
    let { startIndex, endIndex } = this.state
    if(startIndex !== prevState.startIndex || endIndex !== prevState.endIndex) {
      this.updateIntermediaries()
    }
  }

  render({ data }, { startIndex, endIndex }) {
    return (
      <app>
        <div id="webgl-wrapper">
          <div id="start">
            <div class="sentence">{data[startIndex].sentence}</div>
            <div class="marker"></div>
          </div>
          <div id="finish">
            <div class="sentence">{data[endIndex].sentence}</div>
            <div class="marker"></div>
          </div>
        </div>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  console.log(embeddings)
  render(<App data={embeddings} />, document.body)
})