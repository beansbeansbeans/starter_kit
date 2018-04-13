import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength,
  'fractional': fractional(0.5)
}

let closestCount = 3
const resolution = 20

class Aggregation extends Component {
  constructor(props) {
    super(props)

    this.setState({
      scale: 0,
      data: null
    })
  }

  componentWillMount() {
    bindAll(this, ['aggregate'])

    Promise.all(['aggregations'].map(getData)).then(resp => {
      console.log(resp[0]['euclidean']['100'].length)
      this.setState({ 
        data: resp[0],
        maxScale: resp[0]['euclidean']['100'].length
      })
    })
  }

  aggregate() {
    this.setState({ scale: this.state.scale + 1 })
  }

  render({}, { data, scale, maxScale }) {
    let bins = []
    if(data) {
      bins = data.euclidean['100'][scale]
    }
    let total = bins.reduce((acc, curr) => acc + curr, 0)

    return (
      <div id="aggregation-wrapper">
        <div id="histogram">{bins.map(bin => {
          return <div class="bin">
            <div style={`height: ${100 * bin/total}%`} class="contents"></div>
          </div>
        })}</div>
        <div id="labels">{bins.map((bin, i) => {
          return <div class="label">{(i / bins.length).toFixed(2)}</div>
        })}</div>
        <div class="input-wrapper">
          <div class="scale">{scale}</div>
          <button style={`display: ${scale < maxScale - 1? 'block' : 'none'}`} onClick={this.aggregate}>zoom out</button>
          <button style={`display: ${scale > 0 ? 'block' : 'none'}`} onClick={() => {
            this.setState({
              scale: scale - 1
            })
          }}>zoom in</button>
        </div>
      </div>
    )
  }
}

export default Aggregation